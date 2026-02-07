import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { translateAttribute, formatMileage } from '../../lib/utils';
import type { Car } from '../../types';

interface CarDetailModalProps {
  car: Car;
  onClose: () => void;
}

export function CarDetailModal({ car, onClose }: CarDetailModalProps) {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  // Touch handling for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  // Lightbox component
  const Lightbox = () => (
    <div 
      className="fixed inset-0 bg-black z-[200] flex items-center justify-center animate-fade-in touch-none"
      onClick={() => setIsFullscreen(false)}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-50"
      >
        <X size={24} />
      </button>

      <div 
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={car.images[currentImageIndex]} 
          alt={car.name}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />

        {/* Navigation Arrows (PC only) */}
        <button 
          onClick={prevImage}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white items-center justify-center hover:bg-white/20"
        >
          <ChevronLeft size={28} />
        </button>
        <button 
          onClick={nextImage}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white items-center justify-center hover:bg-white/20"
        >
          <ChevronRight size={28} />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
          {currentImageIndex + 1} / {car.images.length}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {isFullscreen && <Lightbox />}
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
          <div 
            className="relative aspect-video group bg-neutral-900 cursor-zoom-in"
            onClick={() => setIsFullscreen(true)}
          >
            <img 
              src={car.images[currentImageIndex]} 
              alt={car.name}
              className="w-full h-full object-contain"
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
            <div className="absolute bottom-4 right-4 bg-black/70 px-4 py-2 rounded-full text-sm text-white flex items-center gap-2">
              <ZoomIn size={14} />
              <span>{currentImageIndex + 1} / {car.images.length}</span>
            </div>
          </div>

        {/* Image Interaction Tip */}
        <div className="text-center py-2 text-xs text-[#888]">
          {t('inventory.modal.image_tip')}
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
              {i18n.language === 'en' && car.nameEn ? car.nameEn : car.name}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {[
              { label: t('inventory.modal.year'), value: `${car.year}${t('inventory.card.year')}` },
              { label: t('inventory.modal.mileage'), value: formatMileage(car.mileage, i18n.language) },
              { label: t('inventory.modal.fuel'), value: translateAttribute(car.fuel, i18n.language) },
              { label: t('inventory.modal.transmission'), value: translateAttribute(car.transmission, i18n.language) },
              { label: t('inventory.modal.body_type'), value: translateAttribute(car.bodyType, i18n.language) },
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
              {(i18n.language === 'en' && car.featuresEn ? car.featuresEn : car.features).map((f, i) => (
                <span key={i} className="text-sm px-4 py-2 bg-red-600/20 text-primary rounded-full border border-red-600/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
