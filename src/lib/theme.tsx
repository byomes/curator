'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Same pattern as watson-tools' deacon app (src/lib/deaconTheme.ts,
// src/app/cat/deaconapp/ThemeShell.tsx) — localStorage-persisted, falls
// back to OS preference, class-based (Tailwind's `dark:` variant is
// configured in globals.css as `@custom-variant dark (&:where(.dark, .dark
// *));`, scoped so it only affects elements under a `.dark` ancestor).
// Unlike the deacon app (one component owns both the wrapping div and the
// toggle button), Curator's toggle lives in NavHeader while the class has
// to wrap the whole page tree (layout.tsx) — a plain hook would give each
// call site its own independent state, so this is Context instead.
//
// The `.dark` class is applied to <html> itself (not a wrapper div) so the
// page's real background -- what a phone's status bar / browser chrome
// actually samples to tint itself -- flips with the toggle too. The
// theme-color meta tag is kept in sync alongside it for the same reason.

const STORAGE_KEY = 'curator-theme';
const LIGHT_THEME_COLOR = '#ffffff';
const DARK_THEME_COLOR = '#0f1117'; // matches manifest.ts's theme_color

export type Theme = 'light' | 'dark';

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

const ThemeContext = createContext<[Theme, () => void]>(['light', () => {}]);

// Renders 'light' on the server and on first client paint (avoiding a
// hydration mismatch), then syncs to the stored preference — falling back
// to the OS preference — right after mount.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage unavailable (private browsing, etc.) — theme just
        // won't persist across reloads.
      }
      return next;
    });
  }

  return <ThemeContext.Provider value={[theme, toggleTheme]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): [Theme, () => void] {
  return useContext(ThemeContext);
}
