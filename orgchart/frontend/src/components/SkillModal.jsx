import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { X } from 'lucide-react';
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

// Groups organized by skill type
const skillGroupsByType = {
  hard: [
    { value: 'Программирование', label: 'Программирование' },
    { value: 'Аналитика', label: 'Аналитика' },
    { value: 'Дизайн', label: 'Дизайн' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Базы данных', label: 'Базы данных' },
  ],
  soft: [
    { value: 'Мягкие навыки', label: 'Мягкие навыки' },
    { value: 'Менеджмент', label: 'Менеджмент' },
    { value: 'Коммуникация', label: 'Коммуникация' },
    { value: 'Лидерство', label: 'Лидерство' },
    { value: 'Продажи', label: 'Продажи' },
  ],
  hobby: [
    { value: 'Спорт', label: 'Спорт' },
    { value: 'Искусство', label: 'Искусство' },
    { value: 'Музыка', label: 'Музыка' },
    { value: 'Путешествия', label: 'Путешествия' },
    { value: 'Кулинария', label: 'Кулинария' },
    { value: 'Чтение', label: 'Чтение' },
  ],
};

const skillGroups = [
  ...skillGroupsByType.hard,
  ...skillGroupsByType.soft,
  ...skillGroupsByType.hobby,
];

export default function SkillModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingSkill = null,
  existingSkills = []
}) {
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillType, setSkillType] = useState(null);
  const [skillGroup, setSkillGroup] = useState(null);
  
  // Track original data and changes
  const [originalData, setOriginalData] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());

  // Reset form when modal opens/closes or editing skill changes
  useEffect(() => {
    if (isOpen) {
      if (editingSkill) {
        const skillData = {
          name: editingSkill.name,
          description: editingSkill.description || '',
          type: editingSkill.type,
          group: editingSkill.group
        };
        
        setSkillName(editingSkill.name);
        setSkillDescription(editingSkill.description || '');
        setSkillType(skillTypes.find(t => t.value === editingSkill.type));
        setSkillGroup(skillGroups.find(g => g.value === editingSkill.group));
        
        setOriginalData(skillData);
        setChangedFields(new Set());
      } else {
        setSkillName('');
        setSkillDescription('');
        setSkillType(null);
        setSkillGroup(null);
        setOriginalData({});
        setChangedFields(new Set());
      }
    }
  }, [isOpen, editingSkill]);

  // Track field changes
  const trackFieldChange = (fieldName, value) => {
    const originalValue = originalData[fieldName];
    if (originalValue !== value) {
      setChangedFields(prev => new Set([...prev, fieldName]));
    } else {
      setChangedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!skillName.trim() || !skillType || !skillGroup) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
      return;
    }

    // Check for duplicates (excluding current editing skill)
    const isDuplicate = existingSkills.some(skill => 
      skill.id !== editingSkill?.id && 
      skill.name.toLowerCase() === skillName.trim().toLowerCase()
    );

    if (isDuplicate) {
      showNotification('Навык с таким названием уже существует', 'warning');
      return;
    }

    const submitData = {
      name: skillName.trim(),
      description: skillDescription.trim(),
      type: skillType.value,
      group: skillGroup.value
    };

    if (editingSkill?.id) {
      submitData.changedFields = changedFields;
    }

    onSubmit(submitData);

    // Reset form
    setSkillName('');
    setSkillDescription('');
    setSkillType(null);
    setSkillGroup(null);
    setOriginalData({});
    setChangedFields(new Set());
  };

  const handleCancel = () => {
    setSkillName('');
    setSkillDescription('');
    setSkillType(null);
    setSkillGroup(null);
    setOriginalData({});
    setChangedFields(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-[15px] shadow-lg w-full max-w-lg mx-auto flex flex-col max-h-[90vh] relative">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {editingSkill ? 'Редактировать навык' : 'Добавить навык'}
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
          <form id="skill-form" className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => {
                  setSkillName(e.target.value);
                  trackFieldChange('name', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите название навыка"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={skillDescription}
                onChange={(e) => {
                  setSkillDescription(e.target.value);
                  trackFieldChange('description', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите описание навыка"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип *</label>
                <Select
                  placeholder="Выберите тип"
                  options={skillTypes}
                  styles={customSelectStyles}
                  value={skillType}
                  onChange={(option) => {
                    setSkillType(option);
                    setSkillGroup(null); // Reset group when type changes
                    trackFieldChange('type', option?.value);
                  }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Группа *</label>
                <Select
                  placeholder="Выберите группу"
                  options={skillType && skillType.value !== 'all' 
                    ? skillGroupsByType[skillType.value] || []
                    : skillGroups
                  }
                  styles={customSelectStyles}
                  value={skillGroup}
                  onChange={(option) => {
                    setSkillGroup(option);
                    trackFieldChange('group', option?.value);
                  }}
                  isDisabled={!skillType || skillType.value === 'all'}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
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
              form="skill-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {editingSkill ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 