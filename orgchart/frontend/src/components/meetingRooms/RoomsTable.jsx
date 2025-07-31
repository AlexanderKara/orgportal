import React from 'react';
import { Eye, Plus } from 'lucide-react';

const RoomsTable = ({ rooms, onViewDetails, onBook, isHovered, onHover }) => {
  return (
    <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray/5 border-b border-gray/20">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Название</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Вместимость</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Расположение</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Статус</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray/20">
            {rooms.map((room, index) => (
              <tr 
                key={room.id} 
                className={`hover:bg-gray/5 transition-colors ${
                  isHovered === room.id.toString() ? 'bg-primary/5' : ''
                }`}
                onMouseEnter={() => onHover && onHover(room.id.toString())}
                onMouseLeave={() => onHover && onHover(null)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-dark">{room.name}</div>
                  {room.description && (
                    <div className="text-sm text-gray-500">{room.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {room.capacity} чел.
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {room.location || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    room.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {room.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails(room)}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomsTable; 