import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Car } from '../../types';

interface CarDetailModalProps {
  car: Car;
  onClose: () => void;
}

export function CarDetailModal({ car, onClose }: CarDetailModalProps) {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
  };

  const handleDownload = async () => {
    try {
      const imageUrl = car.images[currentImageIndex];
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${car.name.replace(/\s+/g, '-')}-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('inventory.modal.download_started') || 'Download started');
    } catch (error) {
      console.error('Download failed', error);
      window.open(car.images[currentImageIndex], '_blank');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#111] rounded-2xl w-full max-w-[1000px] max-h-[90vh] overflow-y-auto border border-white/10 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Main Image */}
        <div className="relative aspect-video group">
          <img 
            src={car.images[currentImageIndex]} 
            alt={car.name}
            className="w-full h-full object-cover"
          />
          
          {/* Navigation Arrows */}
          {car.images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft size={28} />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          
          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black/70 px-4 py-2 rounded-full text-sm text-white">
            {currentImageIndex + 1} / {car.images.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex gap-2 p-4 overflow-x-auto border-b border-white/10 scrollbar-hide">
          {car.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img 
                src={img} 
                alt={`${car.name} - ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Car Info */}
        <div className="p-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <h2 className="text-3xl font-bold text-white">
              {car.name}
            </h2>
            <div className="text-2xl font-bold text-primary">
              {car.priceDisplay}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {[
              { label: t('inventory.modal.year'), value: `${car.year}${t('inventory.card.year')}` },
              { label: t('inventory.modal.mileage'), value: car.mileageDisplay },
              { label: t('inventory.modal.fuel'), value: car.fuel },
              { label: t('inventory.modal.transmission'), value: car.transmission },
              { label: t('inventory.modal.body_type'), value: car.bodyType },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-white/50 text-xs mb-1">{item.label}</div>
                <div className="text-white font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-white">{t('inventory.modal.features')}</h3>
            <div className="flex flex-wrap gap-2">
              {car.features.map((f, i) => (
                <span key={i} className="text-sm px-4 py-2 bg-red-600/20 text-primary rounded-full border border-red-600/20">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Actions (Download, etc) */}
          <div className="flex gap-4 border-t border-white/10 pt-6">
             <button 
               onClick={handleDownload}
               className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
             >
               <Download size={18} />
               <span>{t('inventory.modal.download')}</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
