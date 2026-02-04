import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { carsData as mockCars } from '../../data/cars';
import type { Car, FilterState } from '../../types';
import { CarFilter } from './CarFilter';
import { CarDetailModal } from './CarDetailModal';
import { fetchCars } from '../../services/feishu';

export function Inventory() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    brand: '',
    bodyType: '',
    fuel: '',
    sortBy: 'price-desc'
  });
  
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Fetch cars on mount
  useEffect(() => {
    async function loadCars() {
      try {
        const feishuCars = await fetchCars();
        if (feishuCars.length > 0) {
          setCars(feishuCars);
          setError(null);
        } else {
          // 如果配置了 API 但返回空，可能是权限问题或表格为空
          // 不再回退到 Mock 数据，而是显示空状态或错误，以免用户困惑
          console.warn('Feishu API returned empty.');
          setCars([]); 
          // 只有在完全没有配置时才使用 mock? 
          // 不，fetchCars 内部如果没配置会返回 []。
          // 我们这里假设如果有配置但没数据，就是真没数据。
        }
      } catch (err) {
        console.error('Failed to load cars', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setCars([]); // 出错时不显示 Mock 数据，显示错误信息
      } finally {
        setLoading(false);
      }
    }
    
    loadCars();
  }, []);

  // Get filter options
  const brands = useMemo(() => {
    // Trim and filter empty strings, then deduplicate
    const allBrands = cars.map(c => c.brand?.trim()).filter(Boolean);
    return [...new Set(allBrands)];
  }, [cars]);
  
  const bodyTypes = useMemo(() => {
    const allTypes = cars.map(c => c.bodyType?.trim()).filter(Boolean);
    return [...new Set(allTypes)];
  }, [cars]);

  const fuelTypes = useMemo(() => {
    const allFuels = cars.map(c => c.fuel?.trim()).filter(Boolean);
    return [...new Set(allFuels)];
  }, [cars]);

  // Filter and sort cars
  const filteredCars = useMemo(() => {
    let result = [...cars];
    
    if (filters.keyword) {
      const k = filters.keyword.toLowerCase().trim();
      result = result.filter(c => c.name.toLowerCase().includes(k) || c.brand.toLowerCase().includes(k));
    }
    if (filters.brand) result = result.filter(c => c.brand.trim() === filters.brand);
    if (filters.bodyType) result = result.filter(c => c.bodyType.trim() === filters.bodyType);
    if (filters.fuel) result = result.filter(c => c.fuel.trim() === filters.fuel);
    
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'year-desc': return b.year - a.year;
        case 'mileage-asc': return a.mileage - b.mileage;
        default: return 0;
      }
    });
    
    return result;
  }, [filters, cars]);

  const clearFilters = () => {
    setFilters({
      keyword: '',
      brand: '',
      bodyType: '',
      fuel: '',
      sortBy: 'price-desc'
    });
  };

  if (loading) {
    return (
      <section className="py-20 text-center text-white/50">
        <div className="animate-pulse">Loading inventory...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 text-center text-red-400">
        <div className="text-xl mb-2">⚠️ Error loading data</div>
        <div className="text-sm opacity-70">{error}</div>
        <div className="mt-4 text-xs text-white/30">
          Please check your Feishu configuration (App ID, Secret, Token).
        </div>
      </section>
    );
  }

  return (
    <section id="cars-section" className="py-20 px-6 max-w-[1400px] mx-auto">
      <CarFilter 
        filters={filters}
        setFilters={setFilters}
        brands={brands}
        bodyTypes={bodyTypes}
        fuelTypes={fuelTypes}
        totalCars={filteredCars.length}
        clearFilters={clearFilters}
      />

      {/* Cars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCars.map((car) => (
          <div 
            key={car.id} 
            onClick={() => setSelectedCar(car)}
            className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-300 hover:border-red-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img 
                src={car.images[0]} 
                alt={i18n.language === 'en' && car.nameEn ? car.nameEn : car.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="p-5">
              <h3 className="text-lg font-bold mb-3 text-white truncate">
                {i18n.language === 'en' && car.nameEn ? car.nameEn : car.name}
              </h3>
              <div className="flex gap-4 text-white/60 text-sm mb-4">
                <span>{car.year}{t('inventory.card.year')}</span>
                <span className="w-px h-4 bg-white/20" />
                <span>{car.mileageDisplay}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(i18n.language === 'en' && car.featuresEn ? car.featuresEn : car.features).slice(0, 3).map((f, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-white/5 rounded-full text-white/60 group-hover:bg-red-600/10 group-hover:text-red-400 transition-colors">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCars.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg mb-4">{t('inventory.no_results')}</p>
          <button 
            onClick={clearFilters} 
            className="text-primary hover:underline cursor-pointer"
          >
            {t('inventory.clear_filters')}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCar && (
        <CarDetailModal 
          car={selectedCar} 
          onClose={() => setSelectedCar(null)} 
        />
      )}
    </section>
  );
}
