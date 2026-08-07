import React, { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' }
];

const LanguageSwitcher = () => {
  const [language, setLanguage] = useState('en');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'en,ta,hi', autoDisplay: false }, 'google_translate_element');
      }
    };
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
    const close = event => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selectLanguage = code => {
    setLanguage(code);
    setOpen(false);
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div id="google_translate_element" className="hidden" />
      <button type="button" onClick={() => setOpen(!open)} className="btn-secondary text-xs py-1.5 px-3" title="Change language">
        <Globe className="w-4 h-4" /> {languages.find(item => item.code === language)?.label}
      </button>
      {open && <div className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
        {languages.map(item => <button key={item.code} type="button" onClick={() => selectLanguage(item.code)} className={`block w-full px-3 py-2 text-left text-xs hover:bg-slate-800 ${language === item.code ? 'text-red-300' : 'text-slate-200'}`}>{item.label}</button>)}
      </div>}
    </div>
  );
};

export default LanguageSwitcher;
