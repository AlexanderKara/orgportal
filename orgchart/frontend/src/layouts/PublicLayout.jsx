import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { Outlet } from 'react-router-dom';

function getScrollbarWidth() {
  if (typeof window === 'undefined') return 0;
  // Всегда измеряем ширину скроллбара
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  const inner = document.createElement('div');
  outer.appendChild(inner);
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  document.body.removeChild(outer);
  // Проверяем, есть ли скроллбар у окна
  const hasScrollbar = window.innerWidth > document.documentElement.clientWidth;
  return hasScrollbar ? scrollbarWidth : 0;
}

export default function PublicLayout() {
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  useEffect(() => {
    const updateScrollbarWidth = () => {
      const width = getScrollbarWidth();
      setScrollbarWidth(width);
    };
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      updateScrollbarWidth();
    };
    updateScrollbarWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Вычисляем paddingLeft и paddingRight аналогично Header
  let paddingLeft = 16; // px-4 = 16px
  if (windowWidth >= 1024) paddingLeft = 70; // lg:px-[70px]
  let paddingRight = paddingLeft; // Делаем правый паддинг равным левому

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main
        className="flex-1 pt-[50px] pb-8 px-4 lg:px-[70px]"
        style={{ paddingRight, paddingLeft }}
      >
        <Outlet />
      </main>
    </div>
  );
} 