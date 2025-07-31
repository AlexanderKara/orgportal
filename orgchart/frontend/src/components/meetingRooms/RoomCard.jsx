import React, { useCallback, useState } from 'react';
import { Users, MapPin, Eye, Plus, Edit, ArrowRight } from 'lucide-react';

const RoomCard = ({ room, onView, onBook, onSlotClick, currentUserId }) => {
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isHoveringComponent, setIsHoveringComponent] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Функция для расчета загруженности
  const calculateOccupancy = () => {
    if (!room.bookings || !Array.isArray(room.bookings)) return 0;
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0);
    
    const activeBookings = room.bookings.filter(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return bookingStart < endOfDay && bookingEnd > startOfDay;
    });
    
    const totalMinutes = (endOfDay - startOfDay) / (1000 * 60);
    const occupiedMinutes = activeBookings.reduce((total, booking) => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      const overlapStart = Math.max(bookingStart.getTime(), startOfDay.getTime());
      const overlapEnd = Math.min(bookingEnd.getTime(), endOfDay.getTime());
      return total + (overlapEnd - overlapStart) / (1000 * 60);
    }, 0);
    
    return Math.min(occupiedMinutes / totalMinutes, 1);
  };

  // Функция для получения цвета индикатора
  const getOccupancyColor = (occupancy) => {
    if (occupancy < 0.3) return '#10B981'; // зеленый
    if (occupancy < 0.7) return '#F59E0B'; // желтый
    return '#EF4444'; // красный
  };

  // Функция для получения оценки загруженности по 10-балльной шкале
  const getOccupancyRating = (occupancy) => {
    if (occupancy < 0.05) return '1.0';
    if (occupancy < 0.1) return '1.5';
    if (occupancy < 0.15) return '2.0';
    if (occupancy < 0.2) return '2.5';
    if (occupancy < 0.25) return '3.0';
    if (occupancy < 0.3) return '3.5';
    if (occupancy < 0.35) return '4.0';
    if (occupancy < 0.4) return '4.5';
    if (occupancy < 0.45) return '5.0';
    if (occupancy < 0.5) return '5.5';
    if (occupancy < 0.55) return '6.0';
    if (occupancy < 0.6) return '6.5';
    if (occupancy < 0.65) return '7.0';
    if (occupancy < 0.7) return '7.5';
    if (occupancy < 0.75) return '8.0';
    if (occupancy < 0.8) return '8.5';
    if (occupancy < 0.85) return '9.0';
    if (occupancy < 0.9) return '9.5';
    return '10.0';
  };

  // Функция для генерации получасовых интервалов
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8;
    const endHour = 21;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(time);
      }
    }
    
    return slots;
  };

  // Функция для проверки занятости интервала и определения владельца
  const getSlotStatus = (slotTime) => {
    if (!room.bookings || !Array.isArray(room.bookings)) return { occupied: false, isOwnedByCurrentUser: false };
    
    const slotEnd = new Date(slotTime.getTime() + 30 * 60 * 1000);
    
    for (const booking of room.bookings) {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      
      if (bookingStart < slotEnd && bookingEnd > slotTime) {
        // Проверяем, принадлежит ли бронирование текущему пользователю
        // Используем employee.id из связанного объекта, если employee_id отсутствует
        const bookingEmployeeId = parseInt(booking.employee?.id || booking.employee_id);
        const currentUserIdNum = parseInt(currentUserId);
        const isOwnedByCurrentUser = currentUserId && bookingEmployeeId === currentUserIdNum;
        
        return { occupied: true, isOwnedByCurrentUser };
      }
    }
    
    return { occupied: false, isOwnedByCurrentUser: false };
  };

  // Функция для получения цвета слота
  const getSlotColor = (slotTime) => {
    const { occupied, isOwnedByCurrentUser } = getSlotStatus(slotTime);
    
    if (!occupied) return '#D1D5DB'; // серый для свободных слотов
    if (isOwnedByCurrentUser) return '#10B981'; // зеленый для слотов текущего пользователя
    return '#EF4444'; // красный для слотов других пользователей
  };

  // Функция для правильного склонения названия переговорной комнаты
  const getRoomNameInCase = (roomName) => {
    // Заменяем прописные буквы на обычные
    const normalizedName = roomName.toLowerCase();
    
    // Правила склонения для разных типов названий
    if (normalizedName.includes('большая переговорная')) {
      return 'большой переговорной';
    }
    if (normalizedName.includes('комната отдыха')) {
      return 'комнате отдыха';
    }
    if (normalizedName.includes('переговорная')) {
      return 'переговорной';
    }
    if (normalizedName.includes('комната')) {
      return 'комнате';
    }
    
    return roomName;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Генерируем timeSlots заранее
  const timeSlots = generateTimeSlots();

  // Функция для определения слотов, которые нужно подсветить при ховере
  const getSlotsToHighlight = useCallback((hoveredIndex) => {
    if (hoveredIndex < 0 || hoveredIndex >= timeSlots.length) return [];
    
    const hoveredSlot = timeSlots[hoveredIndex];
    const nextSlot = timeSlots[hoveredIndex + 1];
    
    // Проверяем статус текущего и следующего слотов
    const currentStatus = getSlotStatus(hoveredSlot);
    const nextStatus = nextSlot ? getSlotStatus(nextSlot) : { occupied: false, isOwnedByCurrentUser: false };
    
    const slotsToHighlight = [hoveredIndex];
    
    if (!currentStatus.occupied) {
      // Если текущий слот свободен
      if (nextSlot && !nextStatus.occupied) {
        // Если следующий тоже свободен - подсвечиваем оба
        slotsToHighlight.push(hoveredIndex + 1);
      }
      // Если следующий занят - подсвечиваем только текущий (уже добавлен)
    } else {
      // Если текущий слот занят - подсвечиваем все слоты, относящиеся к этой брони
      const booking = findBookingForSlot(hoveredSlot);
      if (booking) {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        
        // Находим все слоты, которые пересекаются с этой брони
        timeSlots.forEach((slot, index) => {
          const slotEnd = new Date(slot.getTime() + 30 * 60 * 1000);
          if (bookingStart < slotEnd && bookingEnd > slot) {
            if (!slotsToHighlight.includes(index)) {
              slotsToHighlight.push(index);
            }
          }
        });
      }
    }
    
    return slotsToHighlight;
  }, [timeSlots]);

  // Функция для поиска брони для конкретного слота
  const findBookingForSlot = useCallback((slotTime) => {
    if (!room.bookings || !Array.isArray(room.bookings)) return null;
    
    const slotEnd = new Date(slotTime.getTime() + 30 * 60 * 1000);
    
    for (const booking of room.bookings) {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      
      if (bookingStart < slotEnd && bookingEnd > slotTime) {
        return booking;
      }
    }
    
    return null;
  }, [room.bookings]);

  // Функция для определения оптимального интервала при клике на слот
  const getOptimalTimeInterval = useCallback((clickedSlot, clickedIndex) => {
    const currentStatus = getSlotStatus(clickedSlot);
    
    if (currentStatus.occupied) {
      // Если слот занят текущим пользователем, показываем оверлей
      if (currentStatus.isOwnedByCurrentUser) {
        const booking = findBookingForSlot(clickedSlot);
        if (booking) {
          setSelectedBooking(booking);
          setShowOverlay(true);
          return null; // Не создаем интервал
        }
      }
      // Если слот занят другим пользователем, возвращаем только этот слот
      const endTime = new Date(clickedSlot.getTime() + 30 * 60 * 1000);
      return { startTime: clickedSlot, endTime };
    }
    
    // Проверяем следующий слот
    const nextSlot = timeSlots[clickedIndex + 1];
    const nextStatus = nextSlot ? getSlotStatus(nextSlot) : { occupied: true };
    
    if (nextSlot && !nextStatus.occupied) {
      // Если следующий слот тоже свободен, создаем часовой интервал
      const endTime = new Date(clickedSlot.getTime() + 60 * 60 * 1000);
      return { startTime: clickedSlot, endTime };
    } else {
      // Если следующий слот занят, создаем получасовой интервал
      const endTime = new Date(clickedSlot.getTime() + 30 * 60 * 1000);
      return { startTime: clickedSlot, endTime };
    }
  }, [timeSlots, getSlotStatus, findBookingForSlot]);

  // Обновленные обработчики ховера
  const handleSlotMouseEnter = useCallback((event, slot, index) => {
    const slotsToHighlight = getSlotsToHighlight(index);
    
    slotsToHighlight.forEach(slotIndex => {
      const element = document.querySelector(`[data-room-id="${room.id}"][data-slot-index="${slotIndex}"]`);
      if (element) {
        element.style.backgroundColor = '#FF8A15';
      }
    });

    // Обновляем инфобар
    const slotStatus = getSlotStatus(slot);
    const slotEnd = new Date(slot.getTime() + 30 * 60 * 1000);
    
    let tooltipText = '';
    if (slotStatus.occupied) {
      const booking = findBookingForSlot(slot);
      if (booking) {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        tooltipText = `Занято: ${formatTime(bookingStart)} - ${formatTime(bookingEnd)}`;
        if (booking.employee?.name) {
          tooltipText += ` (${booking.employee.name})`;
        }
      }
    } else {
      tooltipText = `Свободно: ${formatTime(slot)} - ${formatTime(slotEnd)}`;
    }

    setTooltipInfo(tooltipText);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, [getSlotsToHighlight, room.id, findBookingForSlot]);

  const handleSlotMouseLeave = useCallback((event, slot, index) => {
    const slotsToHighlight = getSlotsToHighlight(index);
    
    slotsToHighlight.forEach(slotIndex => {
      const element = document.querySelector(`[data-room-id="${room.id}"][data-slot-index="${slotIndex}"]`);
      if (element) {
        const slotTime = timeSlots[slotIndex];
        element.style.backgroundColor = getSlotColor(slotTime);
      }
    });
  }, [getSlotsToHighlight, room.id, timeSlots]);

  // Обработчики ховера для всего компонента
  const handleComponentMouseEnter = useCallback(() => {
    setIsHoveringComponent(true);
  }, []);

  const handleComponentMouseLeave = useCallback(() => {
    setIsHoveringComponent(false);
    setTooltipInfo(null);
  }, []);

  // Функции для работы с оверлеем
  const handleViewBooking = () => {
    // Логика просмотра брони
    setShowOverlay(false);
  };

  const handleMoveBooking = () => {
    // Логика переноса брони
    setShowOverlay(false);
  };

  const handleEditBooking = () => {
    // Логика редактирования брони
    setShowOverlay(false);
  };

  const occupancy = calculateOccupancy();
  const occupancyColor = getOccupancyColor(occupancy);
  const occupancyRating = getOccupancyRating(occupancy);

  return (
    <div 
      className="bg-white rounded-[15px] border border-gray/50 p-4 pb-8 relative"
      onMouseEnter={handleComponentMouseEnter}
      onMouseLeave={handleComponentMouseLeave}
    >
      {/* Инфобар - следует за курсором */}
      {isHoveringComponent && tooltipInfo && (
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white bg-black rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40,
            transform: 'translateY(-100%)'
          }}
        >
          {tooltipInfo}
          <div className="absolute top-full left-4 w-0 h-0 border-l-6 border-r-6 border-t-8 border-transparent border-t-black"></div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-dark">{room.name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(room)}
            className="p-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-[6px] transition-colors"
            title="Просмотр расписания"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onBook(room)}
            className="p-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-[6px] transition-colors"
            title="Забронировать"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Загруженность</span>
          <span className="font-medium">{occupancyRating}</span>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: occupancyColor }}
          />
          <span>•</span>
          <Users className="w-4 h-4" />
          <span>{room.capacity} чел.</span>
          {room.description && (
            <>
              <span>•</span>
              <span className="line-clamp-1">{room.description}</span>
            </>
          )}
        </div>
        
        {/* Полоса загруженности */}
        <div className="relative flex gap-0.5 w-full">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="flex-1 h-4 rounded-sm"
              style={{ backgroundColor: getSlotColor(slot) }}
              onClick={() => {
                const interval = getOptimalTimeInterval(slot, index);
                if (!interval) return; // Если null, значит показывается оверлей
                
                const { startTime, endTime } = interval;
                const roomNameInCase = getRoomNameInCase(room.name);
                const title = `Встреча в ${formatTime(startTime)} в ${roomNameInCase}`;
                
                const slotData = {
                  room,
                  startTime,
                  endTime,
                  title
                };
                
                onSlotClick(slotData);
              }}
              onMouseEnter={(event) => handleSlotMouseEnter(event, slot, index)}
              onMouseLeave={(event) => handleSlotMouseLeave(event, slot, index)}
              data-room-id={room.id}
              data-slot-index={index}
            />
          ))}
          
          {/* Шкала времени с абсолютным позиционированием */}
          <div className="absolute top-full left-0 right-0 flex" style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.25rem' }}>
            {Array.from({ length: 27 }, (_, i) => {
              const hour = Math.floor(i / 2) + 8; // с 8:00 до 21:00
              const isHalfHour = i % 2 === 1;
              const position = (i / 26) * 100; // процентное позиционирование
              return (
                <div 
                  key={i} 
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  {i === 0 ? (
                    <span>{hour}</span>
                  ) : isHalfHour ? (
                    <div className="w-px h-2" style={{ backgroundColor: '#374151' }}></div>
                  ) : (
                    <span>{hour}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Оверлей для управления бронированием */}
      {showOverlay && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-lg p-8 flex gap-8">
            {/* Кнопка просмотра */}
            <button
              onClick={handleViewBooking}
              className="flex flex-col items-center gap-2 p-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
              title="Просмотреть"
            >
              <Eye className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-blue-600">Просмотреть</span>
            </button>

            {/* Кнопка переноса */}
            <button
              onClick={handleMoveBooking}
              className="flex flex-col items-center gap-2 p-4 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
              title="Перенести"
            >
              <ArrowRight className="w-8 h-8 text-green-600" />
              <span className="text-sm text-green-600">Перенести</span>
            </button>

            {/* Кнопка редактирования */}
            <button
              onClick={handleEditBooking}
              className="flex flex-col items-center gap-2 p-4 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
              title="Изменить"
            >
              <Edit className="w-8 h-8 text-orange-600" />
              <span className="text-sm text-orange-600">Изменить</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCard; 