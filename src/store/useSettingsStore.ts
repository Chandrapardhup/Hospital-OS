import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type Language = 'en' | 'hi' | 'te';
type FontSize = 'small' | 'medium' | 'large';

interface SettingsState {
  theme: Theme;
  language: Language;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'en',
      fontSize: 'medium',
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => {
        set({ fontSize });
        if (fontSize === 'small') {
          document.documentElement.style.fontSize = '14px';
        } else if (fontSize === 'large') {
          document.documentElement.style.fontSize = '18px';
        } else {
          document.documentElement.style.fontSize = '16px';
        }
      },
    }),
    {
      name: 'Apollo Hospitals-settings',
    }
  )
);
