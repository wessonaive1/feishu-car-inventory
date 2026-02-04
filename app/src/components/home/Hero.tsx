import React from 'react';
import { useTranslation } from 'react-i18next';

export function Hero() {
  const { t } = useTranslation();

  const scrollToCars = () => {
    document.getElementById('cars-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80)' }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-0" />
      
      <div className="relative z-10 text-center max-w-[800px] px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full mb-6">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm text-primary">{t('hero.tag')}</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight text-white">
          {t('hero.title')}
        </h1>
        <h2 className="text-xl md:text-3xl lg:text-4xl text-primary font-light mb-6">
          {t('hero.subtitle')}
        </h2>
        <h3 className="text-lg md:text-2xl lg:text-3xl text-white/90 font-medium mb-6 tracking-wide">
          {t('hero.slogan')}
        </h3>
        <p className="text-base md:text-lg text-white/70 max-w-[600px] mx-auto mb-8 leading-relaxed">
          {t('hero.description')}
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <button 
            onClick={scrollToCars}
            className="bg-primary text-white border-none px-8 py-4 rounded-full text-base cursor-pointer shadow-lg shadow-red-600/40 hover:bg-red-700 transition-all hover:-translate-y-1"
          >
            {t('nav.explore')}
          </button>
          <button 
            onClick={scrollToContact}
            className="bg-transparent text-white border border-white/30 px-8 py-4 rounded-full text-base cursor-pointer hover:bg-white/10 transition-all"
          >
            {t('nav.contact')}
          </button>
        </div>

        {/* Stats - Removed as per request */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[600px] mx-auto mt-12">
          {[
            { value: '156', label: t('hero.stats.vehicles') },
            { value: '24', label: t('hero.stats.brands') },
            { value: '18', label: t('hero.stats.countries') },
            { value: '2800+', label: t('hero.stats.clients') },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/50">{stat.label}</div>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
