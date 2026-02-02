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

interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

interface FeishuRecord {
  record_id: string;
  fields: Record<string, any>;
}

interface FeishuListResponse {
  code: number;
  msg: string;
  data: {
    has_more: boolean;
    page_token: string;
    total: number;
    items: FeishuRecord[];
  };
}

let cachedToken: string | null = null;
let tokenExpireAt = 0;

// 1. 获取 Tenant Access Token
async function getTenantAccessToken(): Promise<string> {
  // 如果缓存有效，直接返回
  if (cachedToken && Date.now() < tokenExpireAt) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.statusText}`);
    }

    const data: FeishuTokenResponse = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`Auth error: ${data.msg}`);
    }

    cachedToken = data.tenant_access_token;
    // 提前 5 分钟过期，确保安全
    tokenExpireAt = Date.now() + (data.expire * 1000) - 300000;
    
    return cachedToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

// 2. 获取多维表格记录
export async function fetchCars(): Promise<Car[]> {
  if (!APP_ID || !APP_SECRET || !APP_TOKEN || !TABLE_ID) {
    console.warn('Feishu configuration is missing. Using mock data.');
    return [];
  }

  // 移除严格的 'bas' 前缀检查，因为新版 Base Token 可能不以 'bas' 开头
  if (!APP_TOKEN.startsWith('bas')) {
     console.warn('Base Token does not start with "bas", but proceeding anyway. Current token:', APP_TOKEN);
  }

  try {
    const token = await getTenantAccessToken();
    
    // 构建请求 URL
    const url = `${API_BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch records failed: ${response.statusText}`);
    }

    const res: FeishuListResponse = await response.json();
    
    if (res.code !== 0) {
      throw new Error(`Feishu API error: ${res.msg}`);
    }

    // 转换数据
    return res.data.items.map(transformFeishuRecordToCar);

  } catch (error) {
    console.error('Error fetching cars from Feishu:', error);
    // 出错时返回空数组，避免页面崩溃
    return [];
  }
}

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
