import React from 'react';
import EmployeeCard from './EmployeeCard';

/**
 * Адаптивная сетка для карточек сотрудников
 * Ультраширокие экраны: 8 карточек
 * Широкие: 6 карточек  
 * Обычные: 4 карточки
 * Планшеты: от 4 до 2 карточек
 * Мобильные: 1 карточка
 */
export default function EmployeeGrid({ 
  employees = [], 
  variant = 'compact', 
  onEmployeeClick, 
  onEmployeeEdit, 
  showEditButton = false,
  className = '' 
}) {
  if (!employees.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Нет сотрудников для отображения</p>
      </div>
    );
  }

  return (
    <div 
      className={`
        grid gap-4 w-full
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-6
        2xl:grid-cols-8
        ${className}
      `}
    >
      {employees.map((employee) => (
        <div key={employee.id} className="flex">
          <EmployeeCard
            employee={employee}
            variant={variant}
            onClick={() => onEmployeeClick?.(employee)}
            onEdit={() => onEmployeeEdit?.(employee)}
            showEditButton={showEditButton}
            className="w-full h-full"
          />
        </div>
      ))}
    </div>
  );
}