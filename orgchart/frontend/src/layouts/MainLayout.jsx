import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { Outlet } from 'react-router-dom';

function getScrollbarWidth() {
  if (typeof window === 'undefined') return 0;
  
  try {
    // Создаем временный div для измерения
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.position = 'absolute';
    outer.style.top = '-9999px';
    outer.style.left = '-9999px';
    
    document.body.appendChild(outer);
    const inner = document.createElement('div');
    outer.appendChild(inner);
    
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    
    // Безопасно удаляем элементы
    if (outer.parentNode) {
      outer.parentNode.removeChild(outer);
    }
    
    // Проверяем, есть ли скроллбар у окна
    const hasScrollbar = window.innerWidth > document.documentElement.clientWidth;
    return hasScrollbar ? scrollbarWidth : 0;
  } catch (error) {
    console.warn('Error calculating scrollbar width:', error);
    return 0;
  }
}

export default function MainLayout() {
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  useEffect(() => {
    const updateScrollbarWidth = () => {
      try {
        const width = getScrollbarWidth();
        setScrollbarWidth(width);
      } catch (error) {
        console.warn('Error updating scrollbar width:', error);
        setScrollbarWidth(0);
      }
    };
    const handleResize = () => {
      try {
        setWindowWidth(window.innerWidth);
        updateScrollbarWidth();
      } catch (error) {
        console.warn('Error handling resize:', error);
      }
    };
    
    // Добавляем небольшую задержку для стабилизации DOM
    const timeoutId = setTimeout(updateScrollbarWidth, 100);
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Вычисляем paddingLeft и paddingRight аналогично Header
  let paddingLeft = 16; // px-4 = 16px
  if (windowWidth >= 1024) paddingLeft = 70; // lg:px-[70px]
  let paddingRight = paddingLeft; // Делаем правый паддинг равным левому

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main
        className="flex-1 pb-8 px-4 lg:px-[70px]"
        style={{ paddingRight, paddingLeft, paddingTop: windowWidth >= 1024 ? 70 : 50 }}
      >
        <Outlet />
      </main>
    </div>
  );
} 