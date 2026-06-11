'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-md bg-muted dark:bg-slate-800 animate-pulse" />;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted dark:hover:bg-slate-800 text-muted-foreground dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-card text-card-foreground border border-slate-200 dark:border-slate-800 rounded-md shadow-lg overflow-hidden z-50 py-1">
          <button
            onClick={() => { setTheme('light'); setIsOpen(false); }}
            className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-muted dark:hover:bg-slate-800 transition-colors ${theme === 'light' ? 'text-primary font-medium' : 'text-foreground dark:text-slate-300'}`}
          >
            <Sun className="w-4 h-4 mr-2" />
            Light
          </button>
          <button
            onClick={() => { setTheme('dark'); setIsOpen(false); }}
            className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-muted dark:hover:bg-slate-800 transition-colors ${theme === 'dark' ? 'text-primary font-medium' : 'text-foreground dark:text-slate-300'}`}
          >
            <Moon className="w-4 h-4 mr-2" />
            Dark
          </button>
          <button
            onClick={() => { setTheme('system'); setIsOpen(false); }}
            className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-muted dark:hover:bg-slate-800 transition-colors ${theme === 'system' ? 'text-primary font-medium' : 'text-foreground dark:text-slate-300'}`}
          >
            <Monitor className="w-4 h-4 mr-2" />
            System
          </button>
        </div>
      )}
    </div>
  );
}
