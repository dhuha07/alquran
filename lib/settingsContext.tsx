import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import type { AppSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';
import { loadSettings, saveSettings } from '@/lib/settings';
import { resolveTheme, type ThemeColors } from '@/lib/theme';

interface SettingsContextValue {
  settings: AppSettings;
  theme: ThemeColors;
  isLoaded: boolean;
  update: (partial: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadSettings()
      .then((s) => {
        if (mounted) setSettings(s);
      })
      .catch(() => {
        // fall back to defaults on error
      })
      .finally(() => {
        if (mounted) setIsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // React to system appearance changes when in "system" mode.
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      setSettings((prev) => ({ ...prev }));
    });
    return () => sub.remove();
  }, []);

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next).catch(() => {});
      return next;
    });
  }, []);

  const theme = useMemo(() => resolveTheme(settings), [settings]);

  const value: SettingsContextValue = { settings, theme, isLoaded, update };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
