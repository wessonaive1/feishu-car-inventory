export interface Car {
  id: number | string;
  name: string;
  price: number;
  priceDisplay: string;
  year: number;
  mileage: number;
  mileageDisplay: string;
  fuel: string;
  transmission: string;
  bodyType: string;
  brand: string;
  images: string[];
  features: string[];
}

export interface FilterState {
  keyword: string;
  brand: string;
  bodyType: string;
  fuel: string;
  sortBy: string;
}

// Dummy export to ensure this file is treated as a module by Vite/esbuild
export const _types = true;
