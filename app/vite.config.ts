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
             // 简单透传代理
             const target = new URL(targetUrl);
             const options = {
                 hostname: target.hostname,
                 path: target.pathname + target.search,
                 method: 'GET',
                 headers: {
                     // 本地开发直接透传，不需要额外鉴权，因为 url 参数里通常已经带了
                     'User-Agent': 'Local-Dev-Proxy/1.0'
                 }
             };
             
             const client = target.protocol === 'https:' ? https : http;
             const proxyReq = client.request(options, (proxyRes) => {
                 if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                     res.statusCode = 302;
                     res.setHeader('Location', proxyRes.headers.location);
                     res.end();
                     return;
                 }
                 res.statusCode = proxyRes.statusCode || 200;
                 if (proxyRes.headers['content-type']) res.setHeader('Content-Type', proxyRes.headers['content-type']);
                 proxyRes.pipe(res);
             });
             proxyReq.on('error', (e) => {
                 console.error(e);
                 res.statusCode = 500;
                 res.end('Proxy Error');
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
