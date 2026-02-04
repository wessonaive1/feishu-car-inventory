import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterState } from '../../types';

interface CarFilterProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  brands: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  totalCars: number;
  clearFilters: () => void;
}

export function CarFilter({ 
  filters, 
  setFilters, 
  brands, 
  bodyTypes, 
  fuelTypes, 
  totalCars,
  clearFilters 
}: CarFilterProps) {
  const { t } = useTranslation();
  
  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = filters.keyword || filters.brand || filters.bodyType || filters.fuel;

  return (
    <div className="mb-8">
      {/* Header & Sort */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-white">{t('inventory.title')}</h2>
          <p className="text-white/50">{t('inventory.found', { count: totalCars })}</p>
        </div>
        
        <select 
          value={filters.sortBy} 
          onChange={(e) => handleChange('sortBy', e.target.value)}
          className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          <option value="year-desc" className="bg-neutral-900">{t('inventory.sort.year_desc')}</option>
          <option value="mileage-asc" className="bg-neutral-900">{t('inventory.sort.mileage_asc')}</option>
        </select>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <input 
          type="text" 
          placeholder={t('inventory.search_placeholder')}
          value={filters.keyword}
          onChange={(e) => handleChange('keyword', e.target.value)}
          className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-white/30"
        />
        <select 
          value={filters.brand} 
          onChange={(e) => handleChange('brand', e.target.value)}
          className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          <option value="" className="bg-neutral-900">{t('inventory.all_brands')}</option>
          {brands.map(b => <option key={b} value={b} className="bg-neutral-900">{b}</option>)}
        </select>
        <select 
          value={filters.bodyType} 
          onChange={(e) => handleChange('bodyType', e.target.value)}
          className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          <option value="" className="bg-neutral-900">{t('inventory.all_types')}</option>
          {bodyTypes.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
        </select>
        <select 
          value={filters.fuel} 
          onChange={(e) => handleChange('fuel', e.target.value)}
          className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary"
        >
          <option value="" className="bg-neutral-900">{t('inventory.all_fuels')}</option>
          {fuelTypes.map(f => <option key={f} value={f} className="bg-neutral-900">{f}</option>)}
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button 
          onClick={clearFilters}
          className="text-primary bg-transparent border-none cursor-pointer text-sm hover:underline"
        >
          {t('inventory.clear_filters')}
        </button>
      )}
    </div>
  );
}
