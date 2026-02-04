
# 项目修改与部署记录 (Deployment Log)

## 1. 核心问题解决 (Problem Solving)

### A. 飞书 API 图片代理 (Image Proxy)
**问题**：飞书多维表格附件（图片）链接有防盗链和鉴权限制，直接在前端 `<img>` 标签使用会报错 403 Forbidden。
**方案**：
1.  **Serverless 中转**：创建了 [api/image.js](file:///c%3A/Users/zheng/Desktop/%E5%9B%BE%E7%89%87%E9%80%9F%E5%AD%98%E5%A4%B9/%E9%A1%BA%E6%BD%9E%E6%9D%A5%E7%BD%91%E9%A1%B5/Kimi_Agent_%E5%BA%93%E5%AD%98%E9%A1%B5/app/api/image.js) 作为后端代理。
2.  **流式传输**：后端获取 Token 后请求飞书图片流，并正确透传 `Content-Type` 和 `Cache-Control` 给浏览器。
3.  **重定向处理**：修复了飞书 CDN 返回 302 重定向时代理失效的问题，改为自动跟随或返回 302 给前端。

### B. 跨域与权限 (CORS & Auth)
**问题**：浏览器直接请求 `open.feishu.cn` 获取数据会触发 CORS 跨域错误；本地开发与线上环境对环境变量的处理不同。
**方案**：
1.  **Vercel Rewrites**：在 [vercel.json](file:///c%3A/Users/zheng/Desktop/%E5%9B%BE%E7%89%87%E9%80%9F%E5%AD%98%E5%A4%B9/%E9%A1%BA%E6%BD%9E%E6%9D%A5%E7%BD%91%E9%A1%B5/Kimi_Agent_%E5%BA%93%E5%AD%98%E9%A1%B5/app/vercel.json) 中配置了 `/api/feishu/*` -> `https://open.feishu.cn/open-apis/*` 的反向代理。
2.  **前端适配**：修改 [services/feishu.ts](file:///c%3A/Users/zheng/Desktop/%E5%9B%BE%E7%89%87%E9%80%9F%E5%AD%98%E5%A4%B9/%E9%A1%BA%E6%BD%9E%E6%9D%A5%E7%BD%91%E9%A1%B5/Kimi_Agent_%E5%BA%93%E5%AD%98%E9%A1%B5/app/src/services/feishu.ts)，将请求路径改为 `/api/feishu/...`，统一了本地和线上的请求方式。

### C. 安全性加固 (Security)
**问题**：Vercel 警告 `VITE_` 前缀的环境变量会暴露给前端，导致 App Secret 泄露风险。
**方案**：
1.  **变量重命名**：将 `VITE_FEISHU_APP_ID` 和 `SECRET` 改为 `FEISHU_APP_ID` (无前缀)。
2.  **代码兼容**：[api/image.js](file:///c%3A/Users/zheng/Desktop/%E5%9B%BE%E7%89%87%E9%80%9F%E5%AD%98%E5%A4%B9/%E9%A1%BA%E6%BD%9E%E6%9D%A5%E7%BD%91%E9%A1%B5/Kimi_Agent_%E5%BA%93%E5%AD%98%E9%A1%B5/app/api/image.js) 增加了对无前缀变量的读取支持。

---

## 2. 部署状态 (Deployment Status)

- **托管平台**：Vercel
- **仓库地址**：GitHub (wessonaivel/feishu-car-inventory)
- **当前版本**：已包含 CORS 修复和安全变量更新。
- **环境变量配置**：
  - `FEISHU_APP_ID`: `cli_...` (已去前缀)
  - `FEISHU_APP_SECRET`: `5oR...` (已去前缀)
  - `VITE_FEISHU_APP_TOKEN`: `TVo...` (保留前缀，前端需使用)
  - `VITE_FEISHU_TABLE_ID`: `tbl...` (保留前缀，前端需使用)

## 3. 遗留问题与建议 (Known Issues & Next Steps)

目前线上环境仍未成功加载数据，可能原因及排查方向：
1.  **Vercel Rewrite 缓存**：有时候 rewrite 规则生效有延迟，或者浏览器缓存了旧的 404/403 响应。
2.  **Token 权限范围**：虽然 App 权限已开，但“多维表格高级权限”可能限制了 API 读取特定字段（如附件）。
3.  **飞书 API 频率限制**：如果短时间调试请求过多，IP 可能被飞书暂时风控。

**后续建议**：
- 休息一下，等待 Vercel 缓存完全刷新。
- 在本地使用 `vercel dev` 命令模拟真实的 Vercel 环境进行调试（比单纯 `vite` 更接近线上）。
- 检查飞书开发者后台的“事件订阅”或“日志”，看是否有报错请求。

---
*记录时间：2026-02-03*
