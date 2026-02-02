import React from 'react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-6 border-t border-white/10 bg-black text-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Company */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/logo.png" 
                alt="Shunway Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-bold mb-4">{t('footer.quick_links')}</h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                { label: t('footer.links.home'), href: '#' },
                { label: t('footer.links.inventory'), href: '#cars-section' },
                { label: t('footer.links.about'), href: '#' },
                { label: t('footer.links.contact'), href: '#contact-section' },
              ].map((item, i) => (
                <li key={i}>
                  <a href={item.href} className="text-white/50 text-sm hover:text-white transition-colors decoration-0">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-base font-bold mb-4">{t('footer.services')}</h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                t('footer.links.sourcing'),
                t('footer.links.export'),
                t('footer.links.logistics'),
                t('footer.links.support'),
              ].map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-white/50 text-sm hover:text-white transition-colors decoration-0">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base font-bold mb-4">{t('footer.contact_info')}</h4>
            <ul className="list-none p-0 m-0 space-y-2">
              <li className="text-white/50 text-sm">广东省佛山市南海区海八路</li>
              <li className="text-white/50 text-sm">+86 400-888-8888</li>
              <li className="text-white/50 text-sm">sales@shunway.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/40 text-sm">
            {t('footer.rights', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
