
import fs from 'fs';
import https from 'https';
import http from 'http';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

// === 配置区域 ===
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const APP_TOKEN = process.env.APP_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

// 初始化 S3 Client (Cloudflare R2)
// 注意：Cloudflare R2 的 endpoint 必须是 https://<ACCOUNT_ID>.r2.cloudflarestorage.com
// 不能包含 bucket 名字，也不能是 public domain
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// 1. 获取 Token
async function getTenantAccessToken() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.code !== 0) reject(new Error(json.msg));
        else resolve(json.tenant_access_token);
      });
    });
    req.write(JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }));
    req.end();
  });
}

// 2. 获取记录
async function fetchRecords(token) {
  let hasMore = true;
  let pageToken = '';
  let allRecords = [];

  while (hasMore) {
    const url = `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=20${pageToken ? `&page_token=${pageToken}` : ''}`;
    const res = await new Promise((resolve, reject) => {
      https.get({
        hostname: 'open.feishu.cn',
        path: url,
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(JSON.parse(data)));
      });
    });

    if (res.code !== 0) throw new Error(res.msg);
    allRecords = allRecords.concat(res.data.items);
    hasMore = res.data.has_more;
    pageToken = res.data.page_token;
  }
  return allRecords;
}

// 3. 获取真实下载链接 (带 Extra 参数)
async function getRealDownloadUrl(token, fileToken) {
  // 关键：构造 extra 参数，指明是哪个表格的附件
  const extra = JSON.stringify({
    bitablePerm: {
      tableId: TABLE_ID,
      rev: 0
    }
  });
  
  const path = `/open-apis/drive/v1/medias/batch_get_tmp_download_url?file_tokens=${fileToken}&extra=${encodeURIComponent(extra)}`;
  
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'open.feishu.cn',
      path: path,
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code !== 0) {
             // 尝试不带 extra 重试
             resolve(null);
             return;
          }
          const tmpUrl = json.data?.tmp_download_urls?.[0]?.tmp_download_url;
          resolve(tmpUrl);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}

// 4. 下载图片流 (自动处理重定向)
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`下载失败: ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
          buffer: Buffer.concat(chunks),
          contentType: res.headers['content-type']
      }));
    }).on('error', reject);
  });
}

// 5. 上传 R2
async function uploadToR2(buffer, key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}

// 6. 更新记录
async function updateRecord(token, recordId, imageUrls) {
  const body = JSON.stringify({
    fields: {
      'image_urls': JSON.stringify(imageUrls)
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${recordId}`,
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve());
    });
    req.write(body);
    req.end();
  });
}

// 主程序
async function run() {
  try {
    const token = await getTenantAccessToken();
    const records = await fetchRecords(token);
    console.log(`获取到 ${records.length} 条记录`);

    for (const record of records) {
      const recordId = record.record_id;
      const images = record.fields['细节组图/Pictures'];
      const existingUrlsStr = record.fields['image_urls'];
      
      if (!images || !images.length) continue;

      let existingUrls = [];
      try { existingUrls = JSON.parse(existingUrlsStr || '[]'); } catch (e) {}

      // Check if sync is needed (count mismatch OR token mismatch/order change)
      let needsSync = false;
      if (existingUrls.length !== images.length) {
        needsSync = true;
      } else {
        // Check if file tokens in existing URLs match the current image tokens in order
        for (let i = 0; i < images.length; i++) {
          const fileToken = images[i].file_token;
          // The R2 filename format is: ${recordId}_${i}_${fileToken}.jpg
          // So the URL at index i MUST contain the fileToken of image at index i
          if (!existingUrls[i].includes(fileToken)) {
            needsSync = true;
            break;
          }
        }
      }

      if (!needsSync) {
        console.log(`记录 ${recordId} 已同步，跳过`);
        continue;
      }

      console.log(`正在同步记录 ${recordId} (${images.length} 张)...`);
      const newUrls = [];

      for (let i = 0; i < images.length; i++) {
        const fileToken = images[i].file_token;
        
        try {
          // 1. 获取真实下载链接
          let downloadUrl = await getRealDownloadUrl(token, fileToken);
          if (!downloadUrl) {
             // 如果获取失败，尝试直接用原始 url (不太可能成功但试一下)
             downloadUrl = images[i].url; 
          }

          // 2. 下载
          const { buffer, contentType } = await downloadImage(downloadUrl);
          
          // 3. 上传
          const fileName = `${recordId}_${i}_${fileToken}.jpg`;
          const r2Url = await uploadToR2(buffer, fileName, contentType);
          newUrls.push(r2Url);
          console.log(`  > 图片 ${i+1} 完成`);
          
        } catch (e) {
          console.error(`  x 图片 ${i+1} 失败: ${e.message}`);
        }
      }

      if (newUrls.length > 0) {
        await updateRecord(token, recordId, newUrls);
        console.log(`  √ 记录更新完成`);
      }
    }
    console.log('所有任务完成');
  } catch (e) {
    console.error('Fatal Error:', e);
  }
}

run();
