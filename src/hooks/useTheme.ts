import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'solarized' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as ThemeMode) || 'system';
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    // Remove all theme classes first
    root.classList.remove('dark', 'solarized');
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'solarized') {
      root.classList.add('solarized');
      // Solarized uses dark mode colors by default
      root.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'solarized';
      if (prev === 'solarized') return 'system';
      return 'light';
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}