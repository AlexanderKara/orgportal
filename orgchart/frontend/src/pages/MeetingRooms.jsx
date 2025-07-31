import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, MapPin, FileText, Video, Link, Package, Bell, Plus, Edit, Trash2, Eye,
  Filter, Building2, CheckCircle, Archive
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BookingModal from '../components/meetingRooms/BookingModal';
import RoomDetailsModal from '../components/meetingRooms/RoomDetailsModal';
import BookingDetailsModal from '../components/meetingRooms/BookingDetailsModal';
import RequestChangeModal from '../components/meetingRooms/RequestChangeModal';
import InteractiveArbatMap from '../components/meetingRooms/InteractiveArbatMap';
import RoomCard from '../components/meetingRooms/RoomCard';
import BookingsSection from '../components/meetingRooms/BookingsSection';

const MeetingRooms = () => {
  const { userData } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Модальные окна
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRoomDetailsModal, setShowRoomDetailsModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [showRequestChangeModal, setShowRequestChangeModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [prefillData, setPrefillData] = useState(null);

  // Загрузка данных
  useEffect(() => {
    loadRooms();
    loadUserBookings();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await api.getMeetingRooms();
      const roomsWithBookings = response || [];
      
      // Загружаем бронирования для каждой комнаты
      const today = new Date().toISOString().split('T')[0];
      const roomsWithBookingsData = await Promise.all(
        roomsWithBookings.map(async (room) => {
          try {
            const scheduleResponse = await api.getRoomSchedule(room.id, today);
            return {
              ...room,
              bookings: scheduleResponse?.bookings || []
            };
          } catch (error) {
            console.error(`Ошибка при загрузке расписания для комнаты ${room.id}:`, error);
            return {
              ...room,
              bookings: []
            };
          }
        })
      );
      
      // Сортируем комнаты по ID
      const sortedRooms = roomsWithBookingsData.sort((a, b) => a.id - b.id);
      setRooms(sortedRooms);
    } catch (error) {
      console.error('Ошибка при загрузке переговорных комнат:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBookings = async () => {
    try {
      const response = await api.getUserBookings();
      setUserBookings(response?.bookings || []);
    } catch (error) {
      console.error('Ошибка при загрузке бронирований:', error);
      setUserBookings([]);
    }
  };

  // Обработчики событий
  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleViewRoom = (room) => {
    setSelectedRoom(room);
    setShowRoomDetailsModal(true);
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleSlotClick = (slotData) => {
    setSelectedRoom(slotData.room);
    setPrefillData(slotData);
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap text-center md:text-left">
        <h1 className="text-[32px] font-bold font-accent text-primary w-full md:w-auto pb-4 md:pb-0">Переговорные комнаты</h1>
        <div className="flex flex-row gap-2 flex-wrap w-full md:w-auto justify-center md:justify-end items-center">
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Забронировать</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего комнат</span>
          </div>
          <div className="text-2xl font-bold text-dark">{rooms.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Общая вместимость</span>
          </div>
          <div className="text-2xl font-bold text-dark">
            {rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)}
          </div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Мои бронирования</span>
          </div>
          <div className="text-2xl font-bold text-dark">{userBookings.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Активные бронирования</span>
          </div>
          <div className="text-2xl font-bold text-dark">
            {userBookings.filter(b => b.status === 'confirmed').length}
          </div>
        </div>
      </div>

      {/* Основной контент - карта слева, карточки справа */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Интерактивная карта */}
        <div className="lg:order-1">
          <InteractiveArbatMap 
            rooms={rooms}
            onRoomClick={handleRoomClick}
            onSlotClick={handleSlotClick}
          />
        </div>

        {/* Карточки переговорных комнат */}
        <div className="lg:order-2">
          <div className="grid grid-cols-1 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onView={handleViewRoom}
                onBook={handleBookRoom}
                onSlotClick={handleSlotClick}
                currentUserId={userData?.employee_id || userData?.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Секция моих бронирований */}
      <div className="mt-8">
        <BookingsSection
          bookings={userBookings}
          onViewDetails={(booking) => {
            setSelectedBooking(booking);
            setShowBookingDetailsModal(true);
          }}
          onRequestChange={(booking) => {
            setSelectedBooking(booking);
            setShowRequestChangeModal(true);
          }}
          onMove={(booking) => {
            // Логика переноса бронирования
            // Здесь можно добавить модальное окно для выбора нового времени
          }}
        />
      </div>

      {/* Модальные окна */}
      {showBookingModal && (
        <>
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => {
              setShowBookingModal(false);
              setPrefillData(null);
            }}
            selectedRoom={selectedRoom}
            prefillData={prefillData}
            rooms={rooms}
            onSubmit={async (bookingData) => {
              try {
                await api.createBooking(bookingData);
                setShowBookingModal(false);
                setPrefillData(null);
                loadUserBookings();
                loadRooms(); // Перезагружаем комнаты с обновленными бронированиями
                // Показываем уведомление об успехе
                if (typeof window !== 'undefined' && window.showNotification) {
                  window.showNotification('Бронирование успешно создано', 'success');
                }
              } catch (error) {
                console.error('Ошибка при создании бронирования:', error);
                // Показываем уведомление об ошибке
                const errorMessage = error.response?.data?.error || error.message || 'Неизвестная ошибка';
                if (typeof window !== 'undefined' && window.showNotification) {
                  window.showNotification(`Ошибка при создании бронирования: ${errorMessage}`, 'error');
                }
                // Показываем нативное уведомление
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Ошибка бронирования', {
                    body: errorMessage,
                    icon: '/favicon.ico'
                  });
                }
              }
            }}
          />
        </>
      )}

      {showRoomDetailsModal && selectedRoom && (
        <RoomDetailsModal
          isOpen={showRoomDetailsModal}
          room={selectedRoom}
          onClose={() => setShowRoomDetailsModal(false)}
        />
      )}

      {showBookingDetailsModal && selectedBooking && (
        <BookingDetailsModal
          isOpen={showBookingDetailsModal}
          booking={selectedBooking}
          onClose={() => setShowBookingDetailsModal(false)}
        />
      )}

      {showRequestChangeModal && selectedBooking && (
        <RequestChangeModal
          isOpen={showRequestChangeModal}
          booking={selectedBooking}
          onClose={() => setShowRequestChangeModal(false)}
          onSubmit={async (requestData) => {
            try {
              await api.requestBookingChange(selectedBooking.id, requestData);
              setShowRequestChangeModal(false);
              loadUserBookings();
            } catch (error) {
              console.error('Ошибка при отправке запроса:', error);
            }
          }}
        />
      )}
    </div>
  );
};

export default MeetingRooms; 