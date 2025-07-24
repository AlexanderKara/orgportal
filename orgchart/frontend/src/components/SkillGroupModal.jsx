import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { X, BarChart3, FileText } from 'lucide-react';
import Button from './ui/Button';
import { showNotification } from '../utils/notifications';

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

const skillTypes = [
  { value: 'hard', label: 'Хард скиллы' },
  { value: 'soft', label: 'Софт скиллы' },
  { value: 'hobby', label: 'Хобби' },
];

export default function SkillGroupModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingGroup = null,
  existingGroups = []
}) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState(null);
  const [nameError, setNameError] = useState('');

  // Reset form when modal opens/closes or editing group changes
  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setGroupName(editingGroup.name);
        setGroupDescription(editingGroup.description || '');
        setGroupType(skillTypes.find(t => t.value === editingGroup.type));
      } else {
        setGroupName('');
        setGroupDescription('');
        setGroupType(null);
      }
      setNameError('');
    }
  }, [isOpen, editingGroup]);

  const checkDuplicate = (name) => {
    if (!name.trim()) return false;
    
    return existingGroups.some(group => 
      group.id !== editingGroup?.id && 
      group.name.toLowerCase() === name.trim().toLowerCase()
    );
  };

  const handleNameBlur = () => {
    if (checkDuplicate(groupName)) {
      setNameError('Группа с таким названием уже существует');
    } else {
      setNameError('');
    }
  };

  const handleNameChange = (e) => {
    setGroupName(e.target.value);
    // Clear error when user starts typing
    if (nameError) {
      setNameError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!groupName.trim() || !groupType) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }

    // Check for duplicates
    if (checkDuplicate(groupName)) {
      setNameError('Группа с таким названием уже существует');
      return;
    }

    onSubmit({
      name: groupName.trim(),
      type: groupType.value,
      description: groupDescription.trim()
    });

    // Reset form
    setGroupName('');
    setGroupDescription('');
    setGroupType(null);
    setNameError('');
  };

  const handleCancel = () => {
    setGroupName('');
    setGroupDescription('');
    setGroupType(null);
    setNameError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {editingGroup ? 'Редактировать группу навыков' : 'Добавить группу навыков'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="skill-group-form" className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название группы *</label>
              <input
                type="text"
                value={groupName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                className={`w-full px-3 py-2 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary ${
                  nameError ? 'border-red-500' : 'border-gray/20'
                }`}
                placeholder="Введите название группы"
                required
              />
              {nameError && (
                <p className="text-red-500 text-sm mt-1">{nameError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип навыков *</label>
              <Select
                placeholder="Выберите тип"
                options={skillTypes}
                styles={customSelectStyles}
                value={groupType}
                onChange={setGroupType}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите описание группы"
                rows={3}
              />
            </div>
          </form>
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="skill-group-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {editingGroup ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 