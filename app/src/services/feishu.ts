
import type { Car } from '../types';

// 使用 Vite Proxy 代理的地址
const API_BASE_URL = '/api/feishu';

// 从环境变量获取配置
const APP_ID = import.meta.env.FEISHU_APP_ID || import.meta.env.VITE_FEISHU_APP_ID;
const APP_SECRET = import.meta.env.FEISHU_APP_SECRET || import.meta.env.VITE_FEISHU_APP_SECRET;
const APP_TOKEN = import.meta.env.VITE_FEISHU_APP_TOKEN;
const TABLE_ID = import.meta.env.VITE_FEISHU_TABLE_ID;

// 字段映射配置：根据用户提供的飞书字段进行更新
const FIELD_MAPPING = {
  name: 'Model Name', 
  price: '售价', 
  year: '年份', // 假设飞书里没有这一列，之后会取默认值
  mileage: '里程', // 假设飞书里没有这一列，之后会取默认值
  fuel: '能源类型', // 假设飞书里没有这一列，之后会取默认值
  transmission: '变速箱', // 假设飞书里没有这一列，之后会取默认值
  bodyType: '车型外观', // 更新为新字段
  brand: '品牌/Brand', 
  images: 'image_urls', // 修改为新的 R2 图片链接字段
  features: '车辆基本信息/Imformation', // 用户想展现这个字段
  nameEn: 'Model Name En', // English Model Name
  featuresEn: 'Features En', // English Features
};

// 1. 获取车辆数据 (直接调用后端代理)
export async function fetchCars(): Promise<Car[]> {
  try {
    // 请求我们自己的后端 API，不再直接请求飞书
    // 这样就避免了前端跨域和 Token 泄露问题
    const response = await fetch('/api/cars');

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    const res = await response.json();
    
    if (res.code !== 0) {
      throw new Error(`API Error: ${res.msg}`);
    }

    // 转换数据
    return res.data.map(transformFeishuRecordToCar);

  } catch (error) {
    console.error('Error fetching cars:', error);
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
  // 从 image_urls 字段解析 R2 链接
  let images: string[] = [];
  const imageUrlsRaw = f[m.images];
  
  if (imageUrlsRaw) {
      if (Array.isArray(imageUrlsRaw)) {
          // 如果飞书返回已经是数组（虽然多行文本通常是字符串）
          images = imageUrlsRaw;
      } else if (typeof imageUrlsRaw === 'string') {
          try {
              // 尝试解析 JSON 字符串
              images = JSON.parse(imageUrlsRaw);
          } catch (e) {
              // 如果不是 JSON，可能就是单个 URL 或者逗号分隔
              images = [imageUrlsRaw];
          }
      }
  }
    
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

  // Process English Features
  let featuresEn: string[] = [];
  const infoEn = f[m.featuresEn];
  if (Array.isArray(infoEn)) {
    featuresEn = infoEn;
  } else if (typeof infoEn === 'string') {
    featuresEn = infoEn.split(/[,，\n]/).map(s => s.trim()).filter(s => s.length > 0);
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
    features: features,
    nameEn: f[m.nameEn] ? String(f[m.nameEn]).trim() : undefined,
    featuresEn: featuresEn.length > 0 ? featuresEn : undefined
  };
}
