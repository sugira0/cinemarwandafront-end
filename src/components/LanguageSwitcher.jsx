import { Globe } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="language-switcher" data-i18n-skip="true">
      <div className="language-switcher-label">
        <Globe size={14} strokeWidth={1.8} />
        <span>{language === 'rw' ? 'Ururimi' : 'Language'}</span>
      </div>

      <div className="language-switcher-actions">
        <button
          type="button"
          className={`language-switcher-btn${language === 'en' ? ' active' : ''}`}
          onClick={() => setLanguage('en')}
          aria-label="Switch language to English"
        >
          EN
        </button>
        <button
          type="button"
          className={`language-switcher-btn${language === 'rw' ? ' active' : ''}`}
          onClick={() => setLanguage('rw')}
          aria-label="Hindura ururimi ujye kuri Kinyarwanda"
        >
          RW
        </button>
      </div>
    </div>
  );
}
