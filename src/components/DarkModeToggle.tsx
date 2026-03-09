import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
    } else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="w-[34px] h-[34px] rounded-lg bg-background border border-border flex items-center justify-center text-sm hover:border-primary transition-all"
      title={dark ? 'Mode clair' : 'Mode sombre'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
