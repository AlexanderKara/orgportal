import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import api from '../../services/api';

export default function BookingModal({ rooms = [], selectedRoom, onClose, onSubmit, availableSlots = [], prefillData = null }) {
  const [formData, setFormData] = useState({
    meeting_room_id: '',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    participants: [],
    documents: [],
    video_link: '',
    location_address: '',
    product_id: '',
    notifications: []
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState(null);
  const [timeSelectionStep, setTimeSelectionStep] = useState('hour'); // 'hour' или 'minute'
  const [tempSelectedHour, setTempSelectedHour] = useState('08');
  const [tempSelectedMinute, setTempSelectedMinute] = useState('00');
  const [hoveredHour, setHoveredHour] = useState(null);
  const [hoveredMinute, setHoveredMinute] = useState(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [inputValue, setInputValue] = useState('08:00');
  const [timeError, setTimeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState('');

  useEffect(() => {
    if (selectedRoom) {
      setFormData(prev => ({ ...prev, meeting_room_id: selectedRoom.id }));
    }
    
    if (prefillData && prefillData.room) {
      const today = new Date();
      const startDateTime = new Date(today);
      startDateTime.setHours(prefillData.startTime.getHours(), prefillData.startTime.getMinutes(), 0, 0);
      
      const endDateTime = new Date(today);
      endDateTime.setHours(prefillData.endTime.getHours(), prefillData.endTime.getMinutes(), 0, 0);
      
      setFormData(prev => ({
        ...prev,
        meeting_room_id: prefillData.room.id,
        title: prefillData.title,
        start_time: `${prefillData.startTime.getHours().toString().padStart(2, '0')}:${prefillData.startTime.getMinutes().toString().padStart(2, '0')}`,
        end_time: `${prefillData.endTime.getHours().toString().padStart(2, '0')}:${prefillData.endTime.getMinutes().toString().padStart(2, '0')}`
      }));
      
      setSelectedDate(today);
    }
    
    loadProducts();
    loadEmployees();
  }, [selectedRoom, prefillData]);

  const loadProducts = async () => {
    try {
      const response = await api.getProducts();
      setProducts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Ошибка при загрузке продуктов:', error);
      setProducts([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.getEmployees();
      setEmployees(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Ошибка при загрузке сотрудников:', error);
      setEmployees([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Валидация времени
    if (field === 'start_time' || field === 'end_time') {
      validateTime();
      // Проверяем конфликты при изменении времени
      if (formData.meeting_room_id && value) {
        setTimeout(() => {
          checkBookingConflicts().then(({ hasConflict, conflicts }) => {
            if (hasConflict) {
              setConflictError(`Обнаружены конфликты с существующими бронированиями: ${conflicts.map(c => `${c.title} (${formatTime(new Date(c.start_time))} - ${formatTime(new Date(c.end_time))})`).join(', ')}`);
            } else {
              setConflictError('');
            }
          });
        }, 500); // Небольшая задержка для избежания частых запросов
      }
    }
  };

  const validateTime = () => {
    const startTime = formData.start_time;
    const endTime = formData.end_time;
    
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);
      
      if (start >= end) {
        setTimeError('Время окончания должно быть позже времени начала');
        // Показываем нативное уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Ошибка времени', {
            body: 'Время окончания должно быть позже времени начала',
            icon: '/favicon.ico'
          });
        }
        return false;
      }
      
      // Проверяем, что время не в прошлом
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const startDateTime = new Date(`${selectedDateStr}T${startTime}:00`);
      const now = new Date();
      
      if (startDateTime <= now) {
        setTimeError('Нельзя бронировать время в прошлом');
        // Показываем нативное уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Ошибка времени', {
            body: 'Нельзя бронировать время в прошлом',
            icon: '/favicon.ico'
          });
        }
        return false;
      }
      
      setTimeError('');
      return true;
    }
    return true;
  };

  // Функция для проверки конфликтов бронирования
  const checkBookingConflicts = async () => {
    if (!formData.meeting_room_id || !formData.start_time || !formData.end_time) {
      return { hasConflict: false, conflicts: [] };
    }

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const startDateTime = `${dateString}T${formData.start_time}:00`;
      const endDateTime = `${dateString}T${formData.end_time}:00`;

      // Получаем расписание комнаты на выбранную дату
      const schedule = await api.getRoomSchedule(formData.meeting_room_id, dateString);
      
      if (!schedule || !schedule.bookings) {
        return { hasConflict: false, conflicts: [] };
      }

      const conflicts = [];
      const newBookingStart = new Date(startDateTime);
      const newBookingEnd = new Date(endDateTime);

      for (const booking of schedule.bookings) {
        const existingBookingStart = new Date(booking.start_time);
        const existingBookingEnd = new Date(booking.end_time);

        // Проверяем пересечение временных интервалов
        if (newBookingStart < existingBookingEnd && newBookingEnd > existingBookingStart) {
          conflicts.push({
            id: booking.id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            title: booking.title,
            employee: booking.employee
          });
        }
      }

      return { hasConflict: conflicts.length > 0, conflicts };
    } catch (error) {
      console.error('Ошибка при проверке конфликтов:', error);
      return { hasConflict: false, conflicts: [] };
    }
  };

  const handleTimeFieldClick = (field) => {
    setActiveTimeField(field);
    setShowTimePicker(true);
    setTimeSelectionStep('hour');
    
    // Инициализируем временные значения
    const currentTime = formData[field] || '08:00';
    const [hour, minute] = currentTime.split(':');
    setTempSelectedHour(hour);
    setTempSelectedMinute(minute);
  };

  const handleHourSelect = (hour) => {
    setTempSelectedHour(hour.toString().padStart(2, '0'));
    setTimeSelectionStep('minute');
  };

  const handleMinuteSelect = (minute) => {
    setTempSelectedMinute(minute.toString().padStart(2, '0'));
    const finalTime = `${tempSelectedHour}:${minute.toString().padStart(2, '0')}`;
    handleInputChange(activeTimeField, finalTime);
    setShowTimePicker(false);
    
    // Если выбрано время начала, автоматически открываем выбор времени окончания
    if (activeTimeField === 'start_time') {
      setTimeout(() => {
        setActiveTimeField('end_time');
        setShowTimePicker(true);
        setTimeSelectionStep('hour');
        
        // Инициализируем время окончания на час позже времени начала
        const [startHour, startMinute] = finalTime.split(':');
        const endHour = (parseInt(startHour) + 1) % 24;
        setTempSelectedHour(endHour.toString().padStart(2, '0'));
        setTempSelectedMinute(startMinute);
      }, 100);
    } else {
      setActiveTimeField(null);
      setTimeSelectionStep('hour');
    }
  };

  const handleTimeSelect = (time) => {
    if (activeTimeField) {
      handleInputChange(activeTimeField, time);
    }
    setShowTimePicker(false);
    setActiveTimeField(null);
    setTimeSelectionStep('hour');
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const handleDateChange = (date) => {
    setSelectedDate(new Date(date));
    // Сбрасываем время при смене даты
    setFormData(prev => ({ 
      ...prev, 
      start_time: '', 
      end_time: '' 
    }));
  };

  const handleSlotSelect = (slot) => {
    if (slot.available) {
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);
      
      setFormData(prev => ({
        ...prev,
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16)
      }));
    }
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { name: '', url: '' }]
    }));
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const updateDocument = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => 
        i === index ? { ...doc, [field]: value } : doc
      )
    }));
  };

  const addNotification = () => {
    setFormData(prev => ({
      ...prev,
      notifications: [...prev.notifications, { type: 'app', time: 'before_15' }]
    }));
  };

  const removeNotification = (index) => {
    setFormData(prev => ({
      ...prev,
      notifications: prev.notifications.filter((_, i) => i !== index)
    }));
  };

  const updateNotification = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      notifications: prev.notifications.map((notif, i) => 
        i === index ? { ...notif, [field]: value } : notif
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверяем валидацию времени перед отправкой
    if (!validateTime()) {
      return;
    }

    // Проверяем конфликты бронирования
    setLoading(true);
    const { hasConflict, conflicts } = await checkBookingConflicts();
    
    if (hasConflict) {
      setConflictError(`Обнаружены конфликты с существующими бронированиями: ${conflicts.map(c => `${c.title} (${formatTime(new Date(c.start_time))} - ${formatTime(new Date(c.end_time))})`).join(', ')}`);
      
      // Показываем нативное уведомление
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Конфликт бронирования', {
          body: `Обнаружены конфликты с существующими бронированиями`,
          icon: '/favicon.ico'
        });
      }
      
      setLoading(false);
      return;
    }

    setConflictError('');

    try {
      // Объединяем дату с временем
      const dateString = selectedDate.toISOString().split('T')[0];
      const startDateTime = `${dateString}T${formData.start_time}:00`;
      const endDateTime = `${dateString}T${formData.end_time}:00`;
      
      const bookingData = {
        ...formData,
        start_time: startDateTime,
        end_time: endDateTime,
        documents: JSON.stringify(formData.documents),
        notifications: JSON.stringify(formData.notifications),
        participants: formData.participants && formData.participants.length > 0 ? JSON.stringify(formData.participants) : null,
        product_id: formData.product_id || null
      };

      await onSubmit(bookingData);
      // onClose() убираем отсюда - окно закроется только при успешном создании
    } catch (error) {
      console.error('Ошибка при создании бронирования:', error);
      // Не закрываем окно при ошибке
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedRoomData = rooms?.find(room => room.id == formData.meeting_room_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">Бронирование переговорной комнаты</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Переговорная комната *
                </label>
                <select
                  value={formData.meeting_room_id ? formData.meeting_room_id.toString() : ''}
                  onChange={(e) => handleInputChange('meeting_room_id', parseInt(e.target.value) || '')}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Выберите комнату</option>
                  {rooms?.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название встречи *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Введите название встречи"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Описание встречи"
              />
            </div>

            {/* Дата и время */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата *
                </label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Время начала *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    onClick={() => handleTimeFieldClick('start_time')}
                    className={`w-full px-3 py-2 pr-10 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors ${
                      timeError && formData.start_time ? 'border-red-500 bg-red-50' : 'border-gray/20'
                    }`}
                    placeholder="Выберите время"
                    readOnly
                    required
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {timeError && formData.start_time && (
                  <div className="text-red-500 text-sm mt-1">{timeError}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Время окончания *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    onClick={() => handleTimeFieldClick('end_time')}
                    className={`w-full px-3 py-2 pr-10 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors ${
                      timeError && formData.end_time ? 'border-red-500 bg-red-50' : 'border-gray/20'
                    }`}
                    placeholder="Выберите время"
                    readOnly
                    required
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {timeError && formData.end_time && (
                  <div className="text-red-500 text-sm mt-1">{timeError}</div>
                )}
              </div>
            </div>

            {/* Ошибка конфликта */}
            {conflictError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-700 text-sm font-medium">Конфликт бронирования</div>
                <div className="text-red-600 text-sm mt-1">{conflictError}</div>
              </div>
            )}

            {/* Доступные слоты */}
            {selectedRoomData && availableSlots && availableSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Доступные слоты для {selectedRoomData.name}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-2 text-sm rounded-[8px] border transition ${
                        slot.available
                          ? 'border-gray/20 hover:border-primary hover:bg-primary/5'
                          : 'border-gray/20 bg-gray/50 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!slot.available}
                    >
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Продукт */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Связанный продукт
              </label>
              <select
                multiple
                value={formData.product_id ? JSON.parse(formData.product_id) : []}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  handleInputChange('product_id', JSON.stringify(selectedOptions));
                }}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              >
                <option value="" disabled>Выберите продукт (необязательно)</option>
                {Array.isArray(products) && products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Участники */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Участники встречи
              </label>
              <div className="space-y-2">
                <select
                  multiple
                  value={formData.participants || []}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    handleInputChange('participants', selectedOptions);
                  }}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                >
                  <option value="" disabled>Выберите участников встречи</option>
                  {Array.isArray(employees) && employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} {employee.middle_name ? employee.middle_name : ''} 
                      {employee.department ? ` (${employee.department})` : ''}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {formData.participants && formData.participants.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Выбрано участников: {formData.participants.length}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Удерживайте Ctrl (Cmd на Mac) для выбора нескольких участников
                </p>
              </div>
            </div>

            {/* Документы */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Документы и ссылки
                </label>
                <button
                  type="button"
                  onClick={addDocument}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                >
                  <Plus className="w-4 h-4" />
                  Добавить документ
                </button>
              </div>
              {formData.documents?.map((doc, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={doc.name}
                    onChange={(e) => updateDocument(index, 'name', e.target.value)}
                    placeholder="Название документа"
                    className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="url"
                    value={doc.url}
                    onChange={(e) => updateDocument(index, 'url', e.target.value)}
                    placeholder="Ссылка на документ"
                    className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Видеовстреча и адрес */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ссылка на видеовстречу
                </label>
                <input
                  type="url"
                  value={formData.video_link}
                  onChange={(e) => handleInputChange('video_link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес места проведения
                </label>
                <input
                  type="text"
                  value={formData.location_address}
                  onChange={(e) => handleInputChange('location_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Адрес или описание места"
                />
              </div>
            </div>

            {/* Уведомления */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Уведомления
                </label>
                <button
                  type="button"
                  onClick={addNotification}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                >
                  <Plus className="w-4 h-4" />
                  Добавить уведомление
                </button>
              </div>
              {formData.notifications?.map((notif, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={notif.type}
                    onChange={(e) => updateNotification(index, 'type', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="app">В приложении</option>
                    <option value="email">Email</option>
                    <option value="telegram">Telegram</option>
                  </select>
                  <select
                    value={notif.time}
                    onChange={(e) => updateNotification(index, 'time', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="before_15">За 15 минут</option>
                    <option value="before_30">За 30 минут</option>
                    <option value="before_60">За 1 час</option>
                    <option value="before_24">За 24 часа</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeNotification(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray/20">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray/20 text-gray-700 rounded-[8px] hover:bg-gray/50 transition"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || timeError}
            className={`px-6 py-2 rounded-[8px] font-medium transition-colors ${
              loading || timeError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {loading ? 'Создание...' : 'Создать бронирование'}
          </button>
        </div>
      </div>

      {/* Кастомный циферблат */}
      {showTimePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]" onClick={() => setShowTimePicker(false)}>
          <div className="bg-white rounded-[15px] p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {activeTimeField === 'start_time' ? 'Введите время начала' : 'Введите время окончания'}
              </h3>
              <button
                onClick={() => setShowTimePicker(false)}
                className="p-1 hover:bg-gray/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              {/* Циферблат */}
              <div className="relative w-64 h-64 mb-4">
                {/* Внешний круг для часов (24-часовой формат) */}
                <div className="absolute inset-0 rounded-full">
                  {Array.from({ length: 24 }, (_, i) => {
                    const angle = (i * 15) - 90; // 360° / 24 = 15°
                    const x = 50 + 45 * Math.cos(angle * Math.PI / 180);
                    const y = 50 + 45 * Math.sin(angle * Math.PI / 180);
                    const hour = i;
                    const isActive = timeSelectionStep === 'hour';
                    const isSelected = timeSelectionStep === 'minute' && tempSelectedHour === hour.toString().padStart(2, '0');
                    const isDimmed = timeSelectionStep === 'minute' && !isSelected; // Бледные часы при выборе минут
                    return (
                      <div
                        key={`hour-${hour}`}
                        className={`absolute w-8 h-8 flex items-center justify-center text-sm font-medium cursor-pointer transition-all group ${
                          isActive 
                            ? 'hover:bg-[#FF8A15] hover:text-white rounded-full' 
                            : isSelected
                            ? 'bg-[#FF8A15] text-white rounded-full'
                            : 'cursor-not-allowed'
                        }`}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                          ...(isDimmed && {
                            color: '#d1d5db' // Бледный серый текст для неактивных часов
                          })
                        }}
                        onClick={isActive ? () => handleHourSelect(hour) : undefined}
                        onMouseEnter={() => {
                          if (isActive) {
                            setTempSelectedHour(hour.toString().padStart(2, '0'));
                            setHoveredHour(hour);
                          }
                        }}
                        onMouseLeave={() => {
                          if (isActive) {
                            setTempSelectedHour(formData[activeTimeField]?.split(':')[0] || '08');
                            setHoveredHour(null);
                          }
                        }}
                      >
                        {hour}
                      </div>
                    );
                  })}
                </div>
                
                {/* Внутренний круг для минут */}
                <div className="absolute inset-8 rounded-full">
                  {Array.from({ length: 12 }, (_, i) => {
                    const angle = (i * 30) - 90; // Начинаем с 12 часов
                    const x = 50 + 40 * Math.cos(angle * Math.PI / 180);
                    const y = 50 + 40 * Math.sin(angle * Math.PI / 180);
                    const minute = i * 5;
                    const isActive = timeSelectionStep === 'minute';
                    const isSelected = timeSelectionStep === 'minute' && tempSelectedMinute === minute.toString().padStart(2, '0');
                    const isDimmed = timeSelectionStep === 'hour'; // Явно определяем бледность
                    return (
                      <div
                        key={`minute-${minute}`}
                        className={`absolute w-8 h-8 flex items-center justify-center text-sm font-medium cursor-pointer transition-all group ${
                          isActive 
                            ? 'hover:bg-[#FF8A15] hover:text-white rounded-full' 
                            : isSelected
                            ? 'bg-[#FF8A15] text-white rounded-full'
                            : 'cursor-not-allowed'
                        }`}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                          ...(isDimmed && {
                            color: '#d1d5db' // Только бледный серый текст
                          })
                        }}
                        onClick={isActive ? () => handleMinuteSelect(minute) : undefined}
                        onMouseEnter={() => {
                          if (isActive) {
                            setTempSelectedMinute(minute.toString().padStart(2, '0'));
                            setHoveredMinute(minute);
                          }
                        }}
                        onMouseLeave={() => {
                          if (isActive) {
                            setTempSelectedMinute(formData[activeTimeField]?.split(':')[1] || '00');
                            setHoveredMinute(null);
                          }
                        }}
                      >
                        {minute.toString().padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>
                
                {/* Линии от центра к hover элементам */}
                {timeSelectionStep === 'hour' && (
                  Array.from({ length: 24 }, (_, i) => {
                    const angle = (i * 15) - 90 + 90; // Добавляем 90° чтобы 0 часов был вертикальным
                    const hour = i;
                    const isHovered = hoveredHour === hour;
                    return (
                      <div
                        key={`hour-line-${hour}`}
                        className={`absolute transition-opacity pointer-events-none z-50 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          left: '50%',
                          top: '50%',
                          width: '4px',
                          height: '80%', // Еще немного увеличиваем высоту для часов
                          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                          transformOrigin: '50% 50%'
                        }}
                        data-hour={hour}
                      >
                        {/* Видимая часть линии (верхняя половина) */}
                        <div 
                          className="absolute w-full bg-[#FF8A15]"
                          style={{
                            top: '0%',
                            height: '50%'
                          }}
                        />
                        {/* Невидимая часть линии (нижняя половина) */}
                        <div 
                          className="absolute w-full bg-transparent"
                          style={{
                            bottom: '0%',
                            height: '50%'
                          }}
                        />
                      </div>
                    );
                  })
                )}
                
                {timeSelectionStep === 'minute' && (
                  Array.from({ length: 12 }, (_, i) => {
                    const angle = (i * 30) - 90 + 90; // Добавляем 90° чтобы 00 минут был вертикальным
                    const minute = i * 5;
                    const isHovered = hoveredMinute === minute;
                    return (
                      <div
                        key={`minute-line-${minute}`}
                        className={`absolute transition-opacity pointer-events-none z-50 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          left: '50%',
                          top: '50%',
                          width: '4px',
                          height: '50%', // Укорачиваем высоту для минут
                          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                          transformOrigin: '50% 50%'
                        }}
                        data-minute={minute}
                      >
                        {/* Видимая часть линии (верхняя половина) */}
                        <div 
                          className="absolute w-full bg-[#FF8A15]"
                          style={{
                            top: '0%',
                            height: '50%'
                          }}
                        />
                        {/* Невидимая часть линии (нижняя половина) */}
                        <div 
                          className="absolute w-full bg-transparent"
                          style={{
                            bottom: '0%',
                            height: '50%'
                          }}
                        />
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Текущее выбранное время */}
              <div className="text-center mb-4">
                <input
                  type="text"
                  value={isManualInput ? inputValue : `${tempSelectedHour}:${tempSelectedMinute}`}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputValue(value);
                    setIsManualInput(true);
                    if (/^\d{1,2}:\d{2}$/.test(value)) {
                      const [hour, minute] = value.split(':');
                      setTempSelectedHour(hour.padStart(2, '0'));
                      setTempSelectedMinute(minute);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key >= '0' && e.key <= '9') {
                      e.preventDefault();
                      const cursorPos = e.target.selectionStart;
                      const value = e.target.value;
                      
                      // Ввод в часы (позиции 0 и 1)
                      if (cursorPos === 0 || cursorPos === 1) {
                        const newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
                        setInputValue(newValue);
                        setTimeout(() => {
                          const newCursorPos = cursorPos + 1;
                          if (newCursorPos === 2) {
                            e.target.setSelectionRange(3, 3); // Переходим к минутам
                          } else {
                            e.target.setSelectionRange(newCursorPos, newCursorPos);
                          }
                        }, 0);
                      }
                      // Ввод в минуты (позиции 3 и 4)
                      else if (cursorPos === 3 || cursorPos === 4) {
                        const newValue = value.substring(0, cursorPos) + e.key + value.substring(cursorPos + 1);
                        setInputValue(newValue);
                        setTimeout(() => {
                          e.target.setSelectionRange(cursorPos + 1, cursorPos + 1);
                        }, 0);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      const cursorPos = e.target.selectionStart;
                      const value = e.target.value;
                      
                      // Стирание с учетом двоеточия
                      if (cursorPos === 1) {
                        // Стираем первую цифру часов
                        const newValue = '0' + value.substring(1);
                        setInputValue(newValue);
                        setTimeout(() => {
                          e.target.setSelectionRange(0, 0);
                        }, 0);
                      } else if (cursorPos === 2) {
                        // Стираем вторую цифру часов
                        const newValue = value.substring(0, 1) + '0' + value.substring(2);
                        setInputValue(newValue);
                        setTimeout(() => {
                          e.target.setSelectionRange(1, 1);
                        }, 0);
                      } else if (cursorPos === 3) {
                        // Курсор на двоеточии - стираем вторую цифру часов и переходим к первой
                        const newValue = value.substring(0, 1) + '0' + value.substring(2);
                        setInputValue(newValue);
                        setTimeout(() => {
                          e.target.setSelectionRange(1, 1);
                        }, 0);
                      } else if (cursorPos === 4) {
                        // Стираем первую цифру минут
                        const newValue = value.substring(0, 3) + '0' + value.substring(4);
                        setInputValue(newValue);
                        setTimeout(() => {
                          e.target.setSelectionRange(3, 3);
                        }, 0);
                      } else if (cursorPos === 5) {
                        // Стираем вторую цифру минут
                        const newValue = value.substring(0, 4) + '0' + value.substring(5);
                        setInputValue(newValue);
                        setTimeout(() => {
                          e.target.setSelectionRange(4, 4);
                        }, 0);
                      }
                    }
                  }}
                  onFocus={() => {
                    setIsManualInput(true);
                    setInputValue(`${tempSelectedHour}:${tempSelectedMinute}`);
                  }}
                  onBlur={() => {
                    setIsManualInput(false);
                    setInputValue(`${tempSelectedHour}:${tempSelectedMinute}`);
                  }}
                  className={`text-2xl font-bold text-center px-4 py-2 border rounded-[8px] transition-all w-1/2 mx-auto ${
                    isManualInput
                      ? 'border-[#FF8A15] text-black' // Активное - оранжевая обводка, черный текст
                      : 'border-gray-300 text-red-500' // Неактивное - серая обводка, красный текст
                  }`}
                  style={{
                    backgroundColor: 'transparent'
                  }}
                />
                <div className="text-sm text-gray-500 mt-2">
                  {timeSelectionStep === 'hour' ? 'Выберите час' : 'Выберите минуты'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 