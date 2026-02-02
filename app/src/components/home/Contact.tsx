import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Brand Icons
const WeChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.067 5.59L2.5 17.5l3.297-1.64c1.026.36 2.148.56 3.32.56 4.8 0 8.691-3.288 8.691-7.342 0-4.054-3.891-7.34-8.691-7.34z"/>
    <path d="M16.602 7.34c-3.696 0-6.693 2.531-6.693 5.654 0 3.124 2.997 5.655 6.693 5.655.826 0 1.615-.133 2.34-.377L21.5 19.5l-.465-2.586c1.396-1.047 2.267-2.52 2.267-4.135 0-3.123-2.997-5.654-6.693-5.654z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.27-.27.35-.66.24-1.01-.37-1.11-.56-2.3-.56-3.53 0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
  </svg>
);

// Social Icons
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export function Contact() {
  const { t } = useTranslation();

  const handleCopyWeChat = () => {
    navigator.clipboard.writeText('ShunwayAuto2024');
    toast.success(t('contact.copied'));
  };

  const contactItems = [
    { 
      key: 'wechat',
      title: t('contact.wechat'), 
      value: 'ShunwayAuto2024', 
      color: 'bg-green-500', 
      action: handleCopyWeChat,
      cursor: 'cursor-pointer',
      icon: WeChatIcon
    },
    { 
      key: 'whatsapp',
      title: t('contact.whatsapp'), 
      value: '+86 138-0013-8000', 
      color: 'bg-emerald-500', 
      link: 'https://wa.me/8613800138000',
      cursor: 'cursor-pointer',
      icon: WhatsAppIcon
    },
    { 
      key: 'email',
      title: t('contact.email'), 
      value: 'sales@shunway.com', 
      color: 'bg-blue-500', 
      link: 'mailto:sales@shunway.com',
      cursor: 'cursor-pointer',
      icon: EmailIcon
    },
    { 
      key: 'phone',
      title: t('contact.phone'), 
      value: '+86 400-888-8888', 
      color: 'bg-red-600', 
      link: 'tel:+864008888888',
      cursor: 'cursor-pointer',
      icon: PhoneIcon
    },
  ];

  return (
    <section id="contact-section" className="py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-full mb-4">
          <span className="text-sm text-primary">{t('contact.tag')}</span>
        </div>
        <h2 className="text-4xl font-bold mb-3 text-white">{t('contact.title')}</h2>
        <p className="text-white/50 mb-12">{t('contact.subtitle')}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[900px] mx-auto">
          {contactItems.map((item, i) => (
            <div 
              key={i} 
              onClick={() => {
                if (item.action) item.action();
                if (item.link) window.open(item.link, '_blank');
              }}
              className={`bg-white/5 rounded-2xl p-7 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 ${item.cursor}`}
            >
              <div className={`w-14 h-14 ${item.color} rounded-xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg`}>
                <item.icon />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
              <p className="text-primary font-mono text-sm">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="mt-12">
          <p className="text-white/50 mb-4">{t('contact.follow_us')}</p>
          <div className="flex justify-center gap-4">
            {[
              { icon: FacebookIcon, label: 'Facebook', link: 'https://www.facebook.com/profile.php?id=61583949447358' },
              { icon: InstagramIcon, label: 'Instagram', link: 'https://instagram.com' },
              { icon: TikTokIcon, label: 'TikTok', link: 'https://tiktok.com' },
            ].map(({ icon: Icon, label, link }) => (
              <a 
                key={label} 
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center cursor-pointer text-white transition-all hover:bg-primary hover:scale-110"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
