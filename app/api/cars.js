
import https from 'https';

// 从环境变量获取配置 (支持 Vercel 注入的变量)
const APP_ID = process.env.FEISHU_APP_ID || process.env.VITE_FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET || process.env.VITE_FEISHU_APP_SECRET;
const APP_TOKEN = process.env.VITE_FEISHU_APP_TOKEN;
const TABLE_ID = process.env.VITE_FEISHU_TABLE_ID;

// 1. 获取飞书 Access Token
function getTenantAccessToken() {
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
        try {
          const json = JSON.parse(data);
          if (json.code !== 0) reject(new Error(json.msg));
          else resolve(json.tenant_access_token);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.write(JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }));
    req.end();
  });
}

// 2. 获取多维表格记录
function fetchRecords(token) {
  return new Promise((resolve, reject) => {
    // 获取所有记录 (这里先只取第一页，如果数据量大可以做分页)
    // 自动处理 Base Token 格式 (Vercel 环境变量里可能有 'bas' 前缀也可能没有)
    const safeAppToken = APP_TOKEN; 
    
    const path = `/open-apis/bitable/v1/apps/${safeAppToken}/tables/${TABLE_ID}/records?page_size=100`;
    
    https.get({
      hostname: 'open.feishu.cn',
      path: path,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code !== 0) reject(new Error(`Feishu Error ${json.code}: ${json.msg}`));
          else resolve(json.data.items);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 主处理函数
export default async function handler(req, res) {
  // 设置 CORS 头，允许前端访问
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!APP_ID || !APP_SECRET || !APP_TOKEN || !TABLE_ID) {
      throw new Error('Missing environment variables');
    }

    const token = await getTenantAccessToken();
    const records = await fetchRecords(token);

    res.status(200).json({
      code: 0,
      data: records
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      code: 500,
      msg: error.message
    });
  }
}
