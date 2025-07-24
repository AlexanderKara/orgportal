import React from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, Edit, Archive, Trash2, Copy } from 'lucide-react';

// Сортируемый заголовок таблицы
export const SortableHeader = ({ 
  children, 
  sortKey, 
  currentSort, 
  onSort, 
  className = '' 
}) => {
  const isActive = currentSort?.key === sortKey;
  const isAsc = isActive && currentSort?.direction === 'asc';
  const isDesc = isActive && currentSort?.direction === 'desc';

  return (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <ChevronUp className={`w-3 h-3 ${isAsc ? 'text-gray-900' : 'text-gray-400'}`} />
          <ChevronDown className={`w-3 h-3 ${isDesc ? 'text-gray-900' : 'text-gray-400'}`} />
        </div>
      </div>
    </th>
  );
};

// Ячейка с аватаром пользователя
export const AvatarCell = ({ 
  user, 
  showName = true, 
  showPosition = false,
  className = '' 
}) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
    <div className="flex items-center">
      <div className="flex-shrink-0 h-10 w-10">
        <img 
          className="h-10 w-10 rounded-full object-cover" 
          src={user.avatar || '/package-icon.svg'} 
          alt={user.name}
        />
      </div>
      {showName && (
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
          {showPosition && user.position && (
            <div className="text-sm text-gray-500">{user.position}</div>
          )}
        </div>
      )}
    </div>
  </td>
);

// Ячейка с мини-карточкой сотрудника
export const EmployeeMiniCard = ({ 
  employee, 
  className = '' 
}) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
    <div className="flex items-center space-x-3">
      <img 
        className="h-8 w-8 rounded-full object-cover" 
        src={employee.avatar || '/package-icon.svg'} 
        alt={employee.name}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
        <p className="text-sm text-gray-500 truncate">{employee.position}</p>
      </div>
    </div>
  </td>
);

// Ячейка с тегами
export const TagsCell = ({ 
  tags = [], 
  maxTags = 3,
  className = '' 
}) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, maxTags).map((tag, index) => (
        <span 
          key={index}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {tag}
        </span>
      ))}
      {tags.length > maxTags && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          +{tags.length - maxTags}
        </span>
      )}
    </div>
  </td>
);

// Ячейка с счетчиком
export const CounterCell = ({ 
  count, 
  label, 
  className = '' 
}) => (
  <td className={`px-6 py-4 whitespace-nowrap text-center ${className}`}>
    <div className="flex flex-col items-center">
      <span className="text-lg font-semibold text-gray-900">{count}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  </td>
);

// Ячейка с действиями
export const ActionsCell = ({ 
  onEdit, 
  onArchive, 
  onDelete, 
  onCopy,
  showMenu = true,
  className = '' 
}) => (
  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${className}`}>
    <div className="flex items-center justify-end space-x-2">
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
          title="Редактировать"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      {onCopy && (
        <button
          onClick={onCopy}
          className="text-blue-600 hover:text-blue-900 p-1 rounded"
          title="Копировать"
        >
          <Copy className="w-4 h-4" />
        </button>
      )}
      {onArchive && (
        <button
          onClick={onArchive}
          className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
          title="Архивировать"
        >
          <Archive className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-900 p-1 rounded"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {showMenu && (
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  </td>
);

// Основная таблица
const Table = ({ 
  children, 
  className = '' 
}) => (
  <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg ${className}`}>
    <table className="min-w-full divide-y divide-gray-300">
      {children}
    </table>
  </div>
);

// Тело таблицы с чередующимися строками
export const TableBody = ({ 
  children, 
  className = '' 
}) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {React.Children.map(children, (child, index) => 
      React.cloneElement(child, {
        className: `${child.props.className || ''} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
      })
    )}
  </tbody>
);

// Строка таблицы
export const TableRow = ({ 
  children, 
  className = '',
  onClick,
  clickable = false
}) => (
  <tr 
    className={`${clickable ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </tr>
);

export default Table; 