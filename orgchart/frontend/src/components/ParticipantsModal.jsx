import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, UserPlus, UserMinus } from 'lucide-react';
import Select from 'react-select';
import Avatar from './ui/Avatar';

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
    zIndex: 99999,
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

const participantRoles = [
  { value: 'no_role', label: 'Без роли' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'developer', label: 'Разработчик' },
  { value: 'frontend_developer', label: 'Frontend Developer' },
  { value: 'backend_developer', label: 'Backend Developer' },
  { value: 'designer', label: 'Дизайнер' },
  { value: 'ui_designer', label: 'UI Designer' },
  { value: 'ux_designer', label: 'UX Designer' },
  { value: 'tester', label: 'Тестировщик' },
  { value: 'qa_engineer', label: 'QA Engineer' },
  { value: 'analyst', label: 'Аналитик' },
  { value: 'architect', label: 'Архитектор' },
  { value: 'devops', label: 'DevOps' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'scrum_master', label: 'Scrum Master' },
];

// Роли для отображения в интерфейсе (включая "Без роли")
const displayRoles = participantRoles;

// Mock data for employees
const mockEmployees = [
  { id: 1, name: 'Иван Петров', position: 'Frontend Developer', department: 'Разработка' },
  { id: 2, name: 'Мария Сидорова', position: 'Product Manager', department: 'Продукт' },
  { id: 3, name: 'Алексей Козлов', position: 'Backend Developer', department: 'Разработка' },
  { id: 4, name: 'Елена Волкова', position: 'UI/UX Designer', department: 'Дизайн' },
  { id: 5, name: 'Дмитрий Смирнов', position: 'QA Engineer', department: 'Тестирование' },
  { id: 6, name: 'Анна Козлова', position: 'Business Analyst', department: 'Аналитика' },
  { id: 7, name: 'Сергей Иванов', position: 'DevOps Engineer', department: 'Инфраструктура' },
  { id: 8, name: 'Ольга Петрова', position: 'Team Lead', department: 'Разработка' },
  { id: 9, name: 'Павел Сидоров', position: 'Scrum Master', department: 'Проекты' },
  { id: 10, name: 'Наталья Козлова', position: 'UX Designer', department: 'Дизайн' },
];

export default function ParticipantsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  participants = [],
  productName = ''
}) {
  const [currentParticipants, setCurrentParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // Initialize current participants when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentParticipants([...participants]);
      setSearchQuery('');
      setSelectedEmployee(null);
      setSelectedRole(null);
    }
  }, [isOpen, participants]);

  // Filter employees based on search query and exclude already added participants
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockEmployees
        .filter(emp => !currentParticipants.find(p => p.employeeId === emp.id))
        .slice(0, 5);
    }

    return mockEmployees
      .filter(emp => 
        !currentParticipants.find(p => p.employeeId === emp.id) &&
        (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
         emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 5);
  }, [searchQuery, currentParticipants]);

  const handleAddParticipant = () => {
    if (selectedEmployee) {
      const newParticipant = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        employeePosition: selectedEmployee.position,
        employeeDepartment: selectedEmployee.department,
        role: selectedRole?.value || 'no_role',
        roleLabel: selectedRole?.label || 'Без роли'
      };
      
      setCurrentParticipants([...currentParticipants, newParticipant]);
      setSelectedEmployee(null);
      setSelectedRole(null);
    }
  };

  const handleRemoveParticipant = (employeeId) => {
    setCurrentParticipants(currentParticipants.filter(p => p.employeeId !== employeeId));
  };

  const handleRoleChange = (participantId, newRole) => {
    setCurrentParticipants(currentParticipants.map(p => 
      p.employeeId === participantId 
        ? { 
            ...p, 
            role: newRole?.value || 'no_role', 
            roleLabel: newRole?.label || 'Без роли' 
          }
        : p
    ));
  };

  const handleSave = () => {
    onSave(currentParticipants);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            Управление участниками
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6 flex-1 overflow-y-auto">

        {productName && (
          <div className="mb-4 p-3 bg-gray/5 rounded-[8px]">
            <p className="text-sm text-gray-600">Продукт: <span className="font-medium text-dark">{productName}</span></p>
          </div>
        )}

        {/* Текущие участники */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Текущие участники</h4>
          {currentParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Участники не добавлены</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(currentParticipants || []).map((participant) => (
                <div key={participant.employeeId} className="flex items-center justify-between p-3 bg-gray/5 rounded-[8px]">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={participant.avatar}
                      name={participant.employeeName}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-sm">{participant.employeeName}</p>
                      <p className="text-xs text-gray-500">{participant.employeePosition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={participantRoles.find(r => r.value === participant.role)}
                      onChange={(option) => handleRoleChange(participant.employeeId, option)}
                      options={displayRoles}
                      styles={customSelectStyles}
                      className="w-40"
                      placeholder="Роль"
                      menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                    <button
                      onClick={() => handleRemoveParticipant(participant.employeeId)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Удалить участника"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Добавление новых участников */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Добавить участника</h4>
          
          {/* Поиск */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск сотрудников..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Результаты поиска */}
          {filteredEmployees.length > 0 && (
            <div className="space-y-2 mb-4">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray/20">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={employee.avatar}
                      name={employee.name}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-dark">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.department}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newParticipant = {
                        employeeId: employee.id,
                        employeeName: employee.name,
                        employeePosition: employee.position,
                        employeeDepartment: employee.department,
                        role: selectedRole?.value || 'no_role',
                        roleLabel: selectedRole?.label || 'Без роли'
                      };
                      setCurrentParticipants([...currentParticipants, newParticipant]);
                      setSelectedEmployee(null);
                      setSelectedRole(null);
                    }}
                    className="p-1 text-gray-400 hover:text-primary transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Кнопка добавления выбранного участника */}
          {selectedEmployee && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-[8px]">
              <div className="flex items-center gap-2">
                <Avatar
                  src={selectedEmployee.avatar}
                  name={selectedEmployee.name}
                  size="xs"
                  className="bg-blue-500 text-white"
                />
                <span className="text-sm font-medium">{selectedEmployee.name}</span>
                {selectedRole && (
                  <>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {selectedRole.label}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={handleAddParticipant}
                className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-[6px] hover:bg-blue-600 transition-colors text-sm"
              >
                Добавить участника
              </button>
            </div>
          )}

          {searchQuery && filteredEmployees.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>Сотрудники не найдены</p>
            </div>
          )}
        </div>

        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 