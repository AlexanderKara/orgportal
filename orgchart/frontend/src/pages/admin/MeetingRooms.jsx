import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Users, MapPin, Settings, Calendar, Clock, Building2, CheckCircle, Archive, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import Select from 'react-select';
import api from '../../services/api';
import RoomFormModal from '../../components/meetingRooms/RoomFormModal';
import RoomScheduleModal from '../../components/meetingRooms/RoomScheduleModal';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    minHeight: 40,
    borderColor: state.isFocused ? '#FF8A15' : '#D9D9D9',
    boxShadow: state.isFocused ? '0 0 0 2px #FF8A15' : 'none',
    outline: 'none',
    '&:hover': {
      borderColor: '#FF8A15',
    },
    paddingRight: 0,
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: 8,
    zIndex: 9999,
    minWidth: 'fit-content',
    width: 'auto',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFE5CC' : '#fff',
    color: state.isSelected ? '#fff' : '#2D2D2D',
    borderRadius: 6,
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#BDBDBD',
    paddingRight: 8,
    paddingLeft: 4,
  }),
};

export default function AdminMeetingRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await api.getMeetingRoomsAdmin();
      setRooms(response || []);
    } catch (error) {
      console.error('Ошибка при загрузке переговорных комнат:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      await api.createMeetingRoom(roomData);
      setShowRoomForm(false);
      loadRooms();
    } catch (error) {
      console.error('Ошибка при создании комнаты:', error);
      alert(error.response?.data?.error || 'Ошибка при создании комнаты');
    }
  };

  const handleUpdateRoom = async (id, roomData) => {
    try {
      await api.updateMeetingRoom(id, roomData);
      setShowRoomForm(false);
      setEditingRoom(null);
      loadRooms();
    } catch (error) {
      console.error('Ошибка при обновлении комнаты:', error);
      alert(error.response?.data?.error || 'Ошибка при обновлении комнаты');
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту переговорную комнату?')) {
      return;
    }

    try {
      await api.deleteMeetingRoom(id);
      loadRooms();
    } catch (error) {
      console.error('Ошибка при удалении комнаты:', error);
      alert(error.response?.data?.error || 'Ошибка при удалении комнаты');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowRoomForm(true);
  };

  const handleViewSchedule = (room) => {
    setSelectedRoom(room);
    setShowScheduleModal(true);
  };

  const getRoomStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoomStatusText = (isActive) => {
    return isActive ? 'Активна' : 'Неактивна';
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'Активные' },
    { value: 'inactive', label: 'Неактивные' },
  ];

  const filteredAndSortedRooms = rooms
    .filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase()) ||
                          (room.description && room.description.toLowerCase().includes(search.toLowerCase())) ||
                          (room.location && room.location.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = !selectedStatus || 
                           (selectedStatus.value === 'active' && room.is_active) ||
                           (selectedStatus.value === 'inactive' && !room.is_active);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'capacity':
          aValue = a.capacity || 0;
          bValue = b.capacity || 0;
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'location':
          aValue = (a.location || '').toLowerCase();
          bValue = (b.location || '').toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка переговорных комнат...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Управление переговорными комнатами</h1>
          <p className="text-gray-600 hidden lg:block">Создание, редактирование и управление переговорными комнатами</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRoomForm(true)}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Добавить комнату</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего комнат</span>
          </div>
          <div className="text-2xl font-bold text-dark">{rooms?.length || 0}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Активных</span>
          </div>
          <div className="text-2xl font-bold text-dark">
            {rooms?.filter(room => room.is_active)?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">Неактивных</span>
          </div>
          <div className="text-2xl font-bold text-dark">
            {rooms?.filter(room => !room.is_active)?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Общая вместимость</span>
          </div>
          <div className="text-2xl font-bold text-dark">
            {rooms?.reduce((sum, room) => sum + (room.capacity || 0), 0) || 0}
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px]">
        <div className="flex-1 flex items-center w-full">
          <input
            type="text"
            placeholder="Поиск по названию, описанию или расположению..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select
            placeholder="Статус"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statusOptions}
            styles={customSelectStyles}
            className="w-full lg:w-40"
          />
        </div>
      </div>

      {/* Таблица комнат */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Комната
                    {sortBy === 'name' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Расположение
                    {sortBy === 'location' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('capacity')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Вместимость
                    {sortBy === 'capacity' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Статус
                    {sortBy === 'status' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider sticky right-0 z-10 bg-gray">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredAndSortedRooms.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Переговорные комнаты не найдены</h3>
                    <p className="text-gray-600 mb-4">Попробуйте изменить параметры поиска или создайте новую комнату</p>
                    <button
                      onClick={() => setShowRoomForm(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                    >
                      Добавить комнату
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSortedRooms.map((room, index) => (
                  <tr key={room.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                    <td className={`px-6 py-4 whitespace-nowrap ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                      <div className="text-sm font-medium text-gray-900">{room.name}</div>
                      {room.description && (
                        <div className="text-sm text-gray-500">{room.description}</div>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                      {room.location || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                      {room.capacity} чел.
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoomStatusColor(room.is_active)}`}>
                        {getRoomStatusText(room.is_active)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewSchedule(room)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Расписание"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальные окна */}
      {showRoomForm && (
        <RoomFormModal
          isOpen={showRoomForm}
          onClose={() => {
            setShowRoomForm(false);
            setEditingRoom(null);
          }}
          onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom}
          room={editingRoom}
        />
      )}

      {showScheduleModal && selectedRoom && (
        <RoomScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          room={selectedRoom}
        />
      )}
    </div>
  );
} 