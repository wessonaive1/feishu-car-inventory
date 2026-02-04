import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

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
      }
    }
  };
});
