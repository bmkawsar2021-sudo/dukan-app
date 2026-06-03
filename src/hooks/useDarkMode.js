import { useState, useEffect } from 'react';

export default function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('dukan-theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('dukan-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(prev => !prev);

  return { dark, toggle };
}
