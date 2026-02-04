import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Menu } from 'lucide-react';

export function Header() {
  const { t, i18n } = useTranslation();

  const scrollToCars = () => {
    document.getElementById('cars-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 h-20">
      <div className="flex items-center justify-between h-full px-6 max-w-[1400px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/shunway-logo.png" 
            alt="Shunway Logo" 
            className="h-16 w-auto object-contain scale-110"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <a href="#" className="text-primary text-sm font-medium hover:text-red-500 transition-colors">{t('nav.home')}</a>
          <a href="#cars-section" className="text-white/70 text-sm hover:text-white transition-colors">{t('nav.inventory')}</a>
          <a href="#contact-section" className="text-white/70 text-sm hover:text-white transition-colors">{t('nav.contact')}</a>
          
          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <Globe size={16} />
            <span>{i18n.language === 'zh' ? 'EN' : '中'}</span>
          </button>
        </nav>

        {/* Mobile Actions */}
        <div className="flex items-center gap-4 md:hidden">
           <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <Globe size={18} />
            <span>{i18n.language === 'zh' ? 'EN' : '中'}</span>
          </button>
        </div>

        {/* CTA Button (Desktop) */}
        <button 
          onClick={scrollToCars}
          className="hidden md:block bg-primary text-white border-none px-5 py-2.5 rounded-full cursor-pointer text-sm font-medium hover:bg-red-700 transition-colors"
        >
          {t('nav.explore')}
        </button>
      </div>
    </header>
  );
}
