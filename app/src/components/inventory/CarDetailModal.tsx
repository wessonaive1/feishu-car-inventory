import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { translateAttribute, formatMileage } from '../../lib/utils';
import type { Car } from '../../types';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

interface CarDetailModalProps {
  car: Car;
  onClose: () => void;
}

export function CarDetailModal({ car, onClose }: CarDetailModalProps) {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openLightbox, setOpenLightbox] = useState(false);

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
        <div className="relative aspect-video group bg-neutral-900 cursor-zoom-in" onClick={() => setOpenLightbox(true)}>
          <img 
            src={car.images[currentImageIndex]} 
            alt={car.name}
            className="w-full h-full object-contain"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
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

        {/* Image Interaction Tip */}
        <div className="text-center py-2 text-xs text-[#888]">
          {t('inventory.modal.image_tip')}
        </div>

        {/* Lightbox */}
        <Lightbox
          open={openLightbox}
          close={() => setOpenLightbox(false)}
          index={currentImageIndex}
          slides={car.images.map(src => ({ src }))}
          plugins={[Zoom]}
          on={{
            view: ({ index }) => setCurrentImageIndex(index)
          }}
          animation={{ fade: 0 }}
          controller={{ closeOnBackdropClick: true }}
          styles={{ 
            container: { backgroundColor: "rgba(0, 0, 0, .9)" }
          }}
        />

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
    </div>
  );
}
