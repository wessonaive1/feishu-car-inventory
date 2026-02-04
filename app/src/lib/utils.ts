import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ATTRIBUTE_DICTIONARY: Record<string, string> = {
  // Fuel Types
  '汽油': 'Gasoline',
  '柴油': 'Diesel',
  '纯电动': 'Electric',
  '插电混动': 'PHEV',
  '油电混动': 'Hybrid',
  
  // Transmission
  '自动挡': 'Automatic',
  '手动挡': 'Manual',
  '手自一体': 'Auto-Manual',
  'CVT无级变速': 'CVT',
  '双离合': 'Dual Clutch',
  
  // Body Types
  '轿车': 'Sedan',
  'SUV': 'SUV',
  'MPV': 'MPV',
  '跑车': 'Sports Car',
  '旅行车': 'Wagon',
  '皮卡': 'Pickup',
  '面包车': 'Van'
};

export function translateAttribute(value: string, lang: string): string {
  if (lang !== 'en') return value;
  
  // Clean up the value
  const cleanValue = value.trim();
  
  // Direct dictionary lookup
  if (ATTRIBUTE_DICTIONARY[cleanValue]) {
    return ATTRIBUTE_DICTIONARY[cleanValue];
  }
  
  // Partial match for some complex cases if needed, 
  // but for now let's stick to direct mapping or return original
  return cleanValue;
}

export function formatMileage(mileage: number, lang: string): string {
  if (lang === 'en') {
    // Convert to km, mileage is in km
    // If it's stored as raw number (e.g. 80000)
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(1)}k km`;
    }
    return `${mileage} km`;
  }
  
  // Chinese format
  if (mileage >= 10000) {
    return `${(mileage / 10000).toFixed(1)}万公里`;
  }
  return `${mileage}公里`;
}
