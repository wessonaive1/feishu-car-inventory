import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import https from 'https';
import http from 'http';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    plugins: [inspectAttr(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // 代理飞书 API 请求，解决开发环境跨域问题
        '/api/feishu': {
          target: 'https://open.feishu.cn/open-apis',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/feishu/, ''),
          secure: false, 
        }
      },
      // 自定义中间件处理图片代理
      configureServer(server) {
        server.middlewares.use('/api/image', async (req, res, next) => {
          const urlObj = new URL(req.url!, `http://${req.headers.host}`);
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url param');
            return;
          }

          try {
            // 1. 获取 Tenant Access Token
            const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                app_id: env.VITE_FEISHU_APP_ID,
                app_secret: env.VITE_FEISHU_APP_SECRET,
              }),
            });
            
            const tokenData = await tokenRes.json();
            if (tokenData.code !== 0) throw new Error(tokenData.msg);
            const accessToken = tokenData.tenant_access_token;

            // 2. 请求目标 URL
            // 重要：这里使用 node-fetch (Vite 环境) 需要手动处理流
            // 且必须传递正确的 Authorization 头
            // 飞书返回的 tmp_url 已经包含了很多鉴权参数，我们只需透传
            
            // 为了避免 node-fetch 的流处理问题，我们改用原生 https 模块发起请求
            // 这样最稳妥，类似 pipeImage 的逻辑
            
            // 解析 targetUrl
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
            
            const proxyReq = client.request(options, (proxyRes) => {
                // 检查是否重定向 (3xx)
                if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                    // 如果有重定向，直接让浏览器去跟随新的地址（通常是CDN地址）
                    // 这种情况下通常不再需要 Token 了
                    res.statusCode = 302;
                    res.setHeader('Location', proxyRes.headers.location);
                    res.end();
                    return;
                }
                
                // 检查是否错误
                if (proxyRes.statusCode !== 200) {
                     console.error(`Feishu Image Proxy Error: ${proxyRes.statusCode}`);
                     // 读取错误信息并打印，方便调试
                     let errData = '';
                     proxyRes.on('data', d => errData += d);
                     proxyRes.on('end', () => {
                         console.error('Feishu Error Body:', errData);
                         res.statusCode = proxyRes.statusCode || 500;
                         res.end(`Feishu Error: ${errData}`);
                     });
                     return;
                }

                // 正常返回 200，透传 Content-Type 和 Cache-Control
                res.statusCode = 200;
                if (proxyRes.headers['content-type']) {
                    res.setHeader('Content-Type', proxyRes.headers['content-type']);
                }
                res.setHeader('Cache-Control', 'public, max-age=3600');
                
                // 管道传输数据
                proxyRes.pipe(res);
            });
            
            proxyReq.on('error', (err) => {
                console.error('Proxy Request Error:', err);
                res.statusCode = 500;
                res.end('Proxy Request Error');
            });
            
            proxyReq.end();

          } catch (error) {
            console.error('Proxy Middleware Error:', error);
            res.statusCode = 500;
            res.end('Proxy Middleware Error: ' + String(error));
          }
        });
      }
    }
  };
});

function pipeImage(url: string, res: any) {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (proxyRes) => {
        // 转发 Content-Type
        if (proxyRes.headers['content-type']) {
            res.setHeader('Content-Type', proxyRes.headers['content-type']);
        }
        // 设置缓存
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        proxyRes.pipe(res);
    }).on('error', (err) => {
        console.error('Stream Error:', err);
        res.statusCode = 500;
        res.end('Stream Error');
    });
}
