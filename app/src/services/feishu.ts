import type { Car } from '../types';

// 使用 Vite Proxy 代理的地址
const API_BASE_URL = '/api/feishu';

// 从环境变量获取配置
const APP_ID = import.meta.env.VITE_FEISHU_APP_ID;
const APP_SECRET = import.meta.env.VITE_FEISHU_APP_SECRET;
const APP_TOKEN = import.meta.env.VITE_FEISHU_APP_TOKEN;
const TABLE_ID = import.meta.env.VITE_FEISHU_TABLE_ID;

// 字段映射配置：根据用户提供的飞书字段进行更新
const FIELD_MAPPING = {
  name: 'Model Name', 
  price: '售价', 
  // 以下字段在用户提供的信息中没有直接对应，可能在“车辆基本信息/Imformation”中，
  // 或者用户只想要展现那4个字段。
  // 为了不破坏 Car 类型定义和前端展示逻辑，我们需要做一些默认值处理或者从“车辆基本信息”中解析。
  // 暂时先保留映射，如果飞书里没有这些列，就会取不到值，前端会显示默认值。
  year: '年份', // 假设飞书里没有这一列，之后会取默认值
  mileage: '里程', // 假设飞书里没有这一列，之后会取默认值
  fuel: '能源类型', // 假设飞书里没有这一列，之后会取默认值
  transmission: '变速箱', // 假设飞书里没有这一列，之后会取默认值
  bodyType: '车型外观', // 更新为新字段
  brand: '品牌/Brand', 
  images: '细节组图/Pictures', 
  features: '车辆基本信息/Imformation', // 用户想展现这个字段
};

// ... (keep interfaces as is)

// 1. 获取 Tenant Access Token
async function getTenantAccessToken(): Promise<string> {
  // 必须优先使用 /api/feishu 代理，而不是直接请求 open.feishu.cn
  // 因为浏览器直接请求飞书会遇到 CORS 跨域问题，而 Vercel Rewrite 已经帮我们解决了这个问题
  try {
    // 使用相对路径 /api/feishu，这样在本地和 Vercel 上都能工作
    const response = await fetch(`/api/feishu/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 注意：这里需要根据环境变量是否带 VITE_ 前缀来做兼容处理
      // 但其实更安全的做法是把获取 Token 的逻辑也移到后端 API (api/image.js 类似的 api/token.js)
      // 不过为了快速修复，我们先用 Rewrite 解决跨域
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET,
      }),
    });

    if (!response.ok) {
       // 如果 Rewrite 失败，尝试直接请求（主要用于本地开发且没有配置 Rewrite 时，虽然现在本地 vite.config.ts 也没有配置代理了）
       console.warn('Proxy request failed, trying direct request...');
       // ... 但其实直接请求肯定会跨域，所以这里只需要抛出错误
       throw new Error(`Auth failed: ${response.statusText}`);
    }

    const data: FeishuTokenResponse = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`Auth error: ${data.msg}`);
    }

    cachedToken = data.tenant_access_token;
    tokenExpireAt = Date.now() + (data.expire * 1000) - 300000;
    
    return cachedToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

// 2. 获取多维表格记录
export async function fetchCars(): Promise<Car[]> {
  // ... (keep checks)

  try {
    const token = await getTenantAccessToken();
    
    // 构建请求 URL - 同样使用 /api/feishu 代理
    const url = `/api/feishu/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // ... (rest of the function)

// 3. 数据转换助手
function transformFeishuRecordToCar(record: FeishuRecord): Car {
  const f = record.fields;
  const m = FIELD_MAPPING;

  // 处理价格显示
  const price = f[m.price] || 0;
  const priceDisplay = price >= 10000 
    ? `¥${(price / 10000).toFixed(0)}万` 
    : `¥${price.toLocaleString()}`;

  // 处理里程显示
  const mileage = f[m.mileage] || 0;
  const mileageDisplay = mileage >= 10000 
    ? `${(mileage / 10000).toFixed(1)}万公里` 
    : `${mileage.toLocaleString()}公里`;

  // 处理图片
  // 使用本地代理 /api/image?url=xxx 
  // 必须优先使用 tmp_url，因为它是临时的、带有权限签名的下载链接
  // 如果 tmp_url 不存在，才使用 url (虽然 url 通常需要更高权限)
  const images = Array.isArray(f[m.images]) 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? f[m.images].map((img: any) => `/api/image?url=${encodeURIComponent(img.tmp_url || img.url)}`)
    : [];
    
  // 移除 fallback 到 '基本信息图' 的逻辑
  if (images.length === 0) {
    // 如果真的没有图片，使用默认占位图
    images.push('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000');
  }

  // 处理 features
  // 用户希望展示 "车辆基本信息/Imformation"，如果它是多行文本或富文本，可能需要处理
  // 这里假设它是文本或字符串数组
  let features: string[] = [];
  const info = f[m.features];
  if (Array.isArray(info)) {
    features = info;
  } else if (typeof info === 'string') {
    // 尝试从文本中解析特性，例如用逗号或换行符分隔
    features = info.split(/[,，\n]/).map(s => s.trim()).filter(s => s.length > 0);
  } else if (info) {
    // 可能是其他对象格式，尝试转字符串
    features = [String(info)];
  }

  // 从 features 中提取年份、里程、燃油类型等信息（如果存在）
  // 假设 info 文本包含类似 "2018款", "4万公里", "汽油" 这样的描述
  let extractedYear = f[m.year];
  let extractedMileage = f[m.mileage];
  let extractedFuel = f[m.fuel];
  let extractedBodyType = f[m.bodyType];
  let extractedTransmission = f[m.transmission];

  const fullInfoStr = JSON.stringify(f) + (typeof info === 'string' ? info : '');
  
  if (!extractedYear) {
      const yearMatch = fullInfoStr.match(/(\d{4})款/);
      if (yearMatch) extractedYear = parseInt(yearMatch[1]);
  }

  if (!extractedMileage) {
      const mileageMatch = fullInfoStr.match(/(\d+(\.\d+)?)万公里/);
      if (mileageMatch) extractedMileage = parseFloat(mileageMatch[1]) * 10000;
  }

  // 简单的关键词匹配作为兜底
  if (!extractedFuel) {
      if (fullInfoStr.includes('纯电')) extractedFuel = '纯电动';
      else if (fullInfoStr.includes('插电') || fullInfoStr.includes('混动')) extractedFuel = '插电混动';
      else extractedFuel = '汽油';
  }
  
  if (!extractedBodyType) {
       // 如果没有从新字段提取到 bodyType，再尝试从 info 中推断
       if (fullInfoStr.includes('SUV')) extractedBodyType = 'SUV';
       else if (fullInfoStr.includes('轿车')) extractedBodyType = '轿车';
       else if (fullInfoStr.includes('跑车')) extractedBodyType = '跑车';
       else if (fullInfoStr.includes('MPV')) extractedBodyType = 'MPV';
       // else extractedBodyType = '轿车'; // 不强制默认，允许为空或在后续处理
  }

  return {
    id: record.record_id, 
    name: String(f[m.name] || '未命名车辆').trim(), // Safe trim
    price: price,
    priceDisplay: priceDisplay,
    year: extractedYear || new Date().getFullYear(),
    mileage: extractedMileage || 0,
    mileageDisplay: extractedMileage 
        ? (extractedMileage >= 10000 ? `${(extractedMileage / 10000).toFixed(1)}万公里` : `${extractedMileage}公里`)
        : '0公里',
    fuel: String(extractedFuel || '汽油').trim(),
    transmission: String(extractedTransmission || '自动挡').trim(),
    bodyType: String(extractedBodyType || '轿车').trim(),
    brand: String(f[m.brand] || '其他品牌').trim(), // Safe trim
    images: images,
    features: features
  };
}
