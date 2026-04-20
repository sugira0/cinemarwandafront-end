import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { translateAppText } from '../lib/translations';

const I18nContext = createContext(null);
const LANGUAGE_STORAGE_KEY = 'cinema-rwanda-language';
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'];

function shouldSkipNode(element) {
  return Boolean(element?.closest('[data-i18n-skip="true"]'));
}

function shouldTranslateTextNode(node) {
  if (!node?.nodeValue?.trim()) return false;

  const parent = node.parentElement;
  if (!parent || shouldSkipNode(parent)) return false;

  const tag = parent.tagName;
  return !['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'PRE', 'CODE'].includes(tag);
}

function translateTextNode(node, language, originals) {
  const currentValue = node.nodeValue ?? '';
  const originalValue = originals.get(node) ?? currentValue;

  if (!originals.has(node)) {
    originals.set(node, currentValue);
  }

  const nextValue = translateAppText(originalValue, language);
  if (nextValue !== currentValue) {
    node.nodeValue = nextValue;
  }
}

function translateAttributes(root, language, originals) {
  if (!(root instanceof Element) || shouldSkipNode(root)) return;

  const elements = [root, ...root.querySelectorAll('*')];

  elements.forEach((element) => {
    if (shouldSkipNode(element)) return;

    const originalAttributes = originals.get(element) || {};

    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;

      const currentValue = element.getAttribute(attribute) || '';
      if (!(attribute in originalAttributes)) {
        originalAttributes[attribute] = currentValue;
        originals.set(element, originalAttributes);
      }

      const nextValue = translateAppText(originalAttributes[attribute], language);
      if (nextValue !== currentValue) {
        element.setAttribute(attribute, nextValue);
      }
    });
  });
}

function applyDomTranslations(language, textOriginals, attributeOriginals) {
  if (typeof document === 'undefined' || !document.body) return;

  document.documentElement.lang = language === 'rw' ? 'rw' : 'en';

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return shouldTranslateTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    },
  );

  let node = walker.nextNode();
  while (node) {
    translateTextNode(node, language, textOriginals);
    node = walker.nextNode();
  }

  translateAttributes(document.body, language, attributeOriginals);
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'rw');
  const textOriginalsRef = useRef(new WeakMap());
  const attributeOriginalsRef = useRef(new WeakMap());

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !document.body) return undefined;

    let frameId = 0;
    const scheduleApply = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        applyDomTranslations(language, textOriginalsRef.current, attributeOriginalsRef.current);
      });
    };

    scheduleApply();

    const observer = new MutationObserver(() => {
      scheduleApply();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    });

    return () => {
      observer.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: setLanguageState,
    t: (text) => translateAppText(text, language),
  }), [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}
