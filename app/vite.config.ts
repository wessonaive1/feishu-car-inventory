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
        // ... (Vite middleware logic is for local dev only, not for Vercel production)
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
