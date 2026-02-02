
import https from 'https';
import http from 'http';

export default async function handler(req, res) {
  const { url: targetUrl } = req.query;

  if (!targetUrl) {
    return res.status(400).send('Missing url param');
  }

  // 获取环境变量 (Vercel 会自动注入)
  // 为了安全，我们使用非 VITE_ 前缀的变量名，防止泄露给前端
  const APP_ID = process.env.FEISHU_APP_ID || process.env.VITE_FEISHU_APP_ID;
  const APP_SECRET = process.env.FEISHU_APP_SECRET || process.env.VITE_FEISHU_APP_SECRET;

  try {
    // 1. 获取 Tenant Access Token
    // 注意：Vercel Serverless 环境下，每次请求都获取 Token 可能会稍慢，
    // 生产环境可以考虑简单的内存缓存，但在 Serverless 中缓存不一定持久。
    // 为了稳定性，先每次获取。
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            app_id: APP_ID,
            app_secret: APP_SECRET,
        }),
    });
    
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) throw new Error(tokenData.msg);
    const accessToken = tokenData.tenant_access_token;

    // 2. 代理图片请求
    const target = new URL(targetUrl);
    const options = {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Feishu-Image-Proxy/1.0'
        }
    };

    const client = target.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        const proxyReq = client.request(options, (proxyRes) => {
            // 处理重定向
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                res.status(302).setHeader('Location', proxyRes.headers.location).end();
                return resolve();
            }

            if (proxyRes.statusCode !== 200) {
                // 读取错误信息
                let errData = '';
                proxyRes.on('data', d => errData += d);
                proxyRes.on('end', () => {
                    console.error('Feishu Error:', errData);
                    res.status(proxyRes.statusCode || 500).send(`Feishu Error: ${errData}`);
                    resolve();
                });
                return;
            }

            // 转发 Headers
            res.status(200);
            if (proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            res.setHeader('Cache-Control', 'public, max-age=3600');

            // 管道传输
            proxyRes.pipe(res);
            
            proxyRes.on('end', () => resolve());
            proxyRes.on('error', (err) => {
                console.error('Stream Error:', err);
                res.status(500).end();
                resolve();
            });
        });

        proxyReq.on('error', (err) => {
            console.error('Proxy Request Error:', err);
            res.status(500).send('Proxy Request Error');
            resolve();
        });

        proxyReq.end();
    });

  } catch (error) {
    console.error('Serverless Error:', error);
    res.status(500).send('Internal Server Error: ' + String(error));
  }
}
