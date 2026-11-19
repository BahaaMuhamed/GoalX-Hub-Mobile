import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getLocale, saveLocale } from '@/auth/storage';
import { copy, type Copy, type Lang } from '@/i18n/copy';

type LocaleValue = {
  lang: Lang;
  rtl: boolean;
  text: Copy;
  setLang: (lang: Lang) => void;
};

const LocaleContext = createContext<LocaleValue | null>(null);

function deviceLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return locale.startsWith('ar') ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);

  useEffect(() => {
    let active = true;
    getLocale().then((stored) => {
      if (active && stored) {
        setLangState(stored);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    void saveLocale(next);
  }, []);

  const value = useMemo<LocaleValue>(
    () => ({ lang, rtl: lang === 'ar', text: copy[lang], setLang }),
    [lang, setLang],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return value;
}
