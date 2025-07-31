import React, { useState, useEffect, useRef, useCallback } from 'react';

const InteractiveArbatMap = ({ rooms, onRoomClick, onSlotClick }) => {
  const [svgContent, setSvgContent] = useState('');
  const svgRef = useRef(null);
  const eventHandlersRef = useRef(new Map());

  // Функция для проверки занятости комнаты в текущий момент
  const isRoomOccupiedNow = useCallback((room) => {
    if (!room.bookings || !Array.isArray(room.bookings)) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // время в минутах
    
    return room.bookings.some(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      
      // Проверяем, что бронирование на сегодня
      const today = new Date();
      const isToday = bookingStart.toDateString() === today.toDateString();
      
      if (!isToday) return false;
      
      const startMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
      const endMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
      
      return currentTime >= startMinutes && currentTime < endMinutes;
    });
  }, []);

  // Создание обработчиков событий для полигонов
  const createPolygonEventHandlers = useCallback((polygon, roomId) => {
    const handleClick = () => {
      const room = rooms.find(r => r.id.toString() === roomId);
      if (room && onRoomClick) {
        onRoomClick(room);
      }
    };

    return { handleClick };
  }, [rooms, onRoomClick]);

  // Загрузка SVG
  useEffect(() => {
    fetch('/images/arbat.svg')
      .then(response => response.text())
      .then(svgText => {
        setSvgContent(svgText);
      })
      .catch(error => {
        console.error('Ошибка загрузки SVG:', error);
      });
  }, []);

  // Инициализация обработчиков событий
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !svgContent) return;

    // Находим все полигоны с id="id*"
    const interactivePolygons = svg.querySelectorAll('polygon[id^="id"]');
    
    interactivePolygons.forEach(polygon => {
      const roomId = polygon.id.replace('id', '');
      
      // Создаем обработчики для полигонов
      const handlers = createPolygonEventHandlers(polygon, roomId);
      
      // Сохраняем ссылки на обработчики для правильной очистки
      eventHandlersRef.current.set(polygon, handlers);
      
      // Добавляем обработчики
      polygon.addEventListener('click', handlers.handleClick);
      
      // Инициализируем стили полигонов
      polygon.style.fill = 'black';
      polygon.style.fillOpacity = '0.3';
      polygon.style.cursor = 'pointer';
    });

    // Очистка обработчиков при размонтировании
    return () => {
      interactivePolygons.forEach(polygon => {
        const handlers = eventHandlersRef.current.get(polygon);
        if (handlers) {
          polygon.removeEventListener('click', handlers.handleClick);
        }
      });
      eventHandlersRef.current.clear();
    };
  }, [svgContent, createPolygonEventHandlers]);

  return (
    <div className="flex justify-center items-center p-8 bg-gray/5 rounded-[15px] border border-gray/20">
      {svgContent ? (
        <div 
          ref={svgRef}
          dangerouslySetInnerHTML={{ __html: svgContent }}
          className="max-w-full h-auto"
          style={{ width: '799px', height: '703px' }}
        />
      ) : (
        <div className="flex items-center justify-center w-96 h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default InteractiveArbatMap;