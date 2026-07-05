import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { id: 'rw', label: 'Kinyarwanda', short: 'RW', flag: '🇷🇼' },
  { id: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = LANGUAGES.find((item) => item.id === language) || LANGUAGES[0];

  useEffect(() => {
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (id) => {
    setLanguage(id);
    setOpen(false);
  };

  return (
    <div className={`language-switcher${open ? ' open' : ''}`} ref={rootRef} data-i18n-skip="true">
      <button className="language-switcher-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="listbox">
        <span className="language-flag" aria-hidden="true">{active.flag}</span>
        <span className="language-current">{active.label}</span>
        <span className="language-short">{active.short}</span>
        <ChevronDown size={14} className="language-chevron" />
      </button>

      {open && (
        <div className="language-menu" role="listbox" aria-label="Choose language">
          <div className="language-menu-head"><span>Language</span><small>Ururimi</small></div>
          {LANGUAGES.map((item) => (
            <button key={item.id} type="button" role="option" aria-selected={language === item.id} className={`language-option${language === item.id ? ' active' : ''}`} onClick={() => choose(item.id)}>
              <span className="language-flag" aria-hidden="true">{item.flag}</span>
              <span>{item.label}</span>
              {language === item.id && <Check size={15} strokeWidth={2.5} />}
            </button>
          ))}
          <p className="language-menu-note">More languages coming soon</p>
        </div>
      )}
    </div>
  );
}
