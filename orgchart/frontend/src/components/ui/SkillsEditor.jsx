import React, { useState } from 'react';
import { X, Award, HandMetal, Heart, Plus } from 'lucide-react';
import SkillLevelModal from '../SkillLevelModal';

// Mock skills data for suggestions
const mockSkillsData = [
  { id: 1, name: 'JavaScript', type: 'hard' },
  { id: 2, name: 'React', type: 'hard' },
  { id: 3, name: 'TypeScript', type: 'hard' },
  { id: 4, name: 'Python', type: 'hard' },
  { id: 5, name: 'Коммуникация', type: 'soft' },
  { id: 6, name: 'Лидерство', type: 'soft' },
  { id: 7, name: 'Командная работа', type: 'soft' },
  { id: 8, name: 'Путешествия', type: 'hobby' },
  { id: 9, name: 'Спорт', type: 'hobby' },
  { id: 10, name: 'Музыка', type: 'hobby' },
];

const skillTypeConfig = {
  hard: {
    icon: <Award className="w-4 h-4 text-blue-500" />,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    hoverColor: 'hover:bg-blue-200',
    removeHoverColor: 'hover:text-blue-600',
    placeholder: 'Введите хард навык...',
    suggestionsColor: '#E3F8FF'
  },
  soft: {
    icon: <HandMetal className="w-4 h-4 text-orange-500" />,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    hoverColor: 'hover:bg-green-200',
    removeHoverColor: 'hover:text-green-600',
    placeholder: 'Введите софт навык...',
    suggestionsColor: '#FFE5CC'
  },
  hobby: {
    icon: <Heart className="w-4 h-4 text-green-500" />,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    hoverColor: 'hover:bg-gray-200',
    removeHoverColor: 'hover:text-gray-600',
    placeholder: 'Введите хобби...',
    suggestionsColor: '#F5F5F5'
  }
};

export default function SkillsEditor({
  skills = [],
  type = 'hard',
  isEditing = false,
  onSkillsChange,
  className = ''
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedSkillForLevel, setSelectedSkillForLevel] = useState(null);

  const config = skillTypeConfig[type];

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleCreateTag = (inputValue) => {
    if (!inputValue.trim()) return;
    
    const newSkill = { 
      id: Date.now(), 
      label: inputValue.trim(), 
      color: config.suggestionsColor, 
      level: null 
    };
    
    onSkillsChange([...skills, newSkill]);
    setInputValue('');
  };

  const handleTagSelect = (skill) => {
    // Проверяем, не добавлен ли уже этот навык
    const isAlreadyAdded = skills.some(s => s.label === skill.name);
    if (isAlreadyAdded) return;
    
    const newSkill = { 
      id: Date.now(), 
      label: skill.name, 
      color: config.suggestionsColor, 
      level: null 
    };
    
    onSkillsChange([...skills, newSkill]);
    setShowDropdown(false);
    setInputValue('');
  };

  const handleRemoveTag = (skillId) => {
    const newSkills = skills.filter(s => s.id !== skillId);
    onSkillsChange(newSkills);
  };

  const handleSkillClick = (skill) => {
    setSelectedSkillForLevel(skill);
    setShowLevelModal(true);
  };

  const handleLevelSelect = (level) => {
    if (selectedSkillForLevel) {
      const updatedSkills = skills.map(skill => 
        skill.id === selectedSkillForLevel.id 
          ? { ...skill, level } 
          : skill
      );
      onSkillsChange(updatedSkills);
    }
    setShowLevelModal(false);
    setSelectedSkillForLevel(null);
  };

  // StarBullet component for competencies
  function StarBullet() {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-[6px] min-w-[14px] rounded-[1px]">
        <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="#E42E0F" />
      </svg>
    );
  }

  const renderSkillLevel = (skill, type) => {
    if (!skill.level) {
      return null;
    }
    
    const levelNum = parseInt(skill.level);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 3) {
      return null;
    }
    
    return (
      <div className="flex gap-1">
        {Array.from({ length: levelNum }, (_, index) => (
          <StarBullet key={index} />
        ))}
      </div>
    );
  };

  // В режиме чтения - просто отображаем теги с уровнями
  if (!isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        {skills?.length > 0 ? (
          skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-2">
              {config.icon}
              <span className="text-sm text-gray-900">{skill.label}</span>
              {renderSkillLevel(skill, type)}
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">Нет навыков</div>
        )}
      </div>
    );
  }

  // В режиме редактирования
  return (
    <div className={`relative ${className}`}>
      <div 
        className="min-h-[40px] border border-gray/20 rounded-[8px] focus-within:ring-2 focus-within:ring-primary focus-within:border-primary p-2 cursor-text"
        onClick={(e) => {
          // Если клик не по тегу, фокусируемся на инпуте
          if (e.target === e.currentTarget || e.target.tagName === 'DIV') {
            e.currentTarget.querySelector('input')?.focus();
          }
        }}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {skills?.map((skill) => (
            <span
              key={skill.id}
              className={`inline-flex items-center gap-1 px-2 py-1 ${config.bgColor} ${config.textColor} rounded-full text-sm cursor-pointer ${config.hoverColor} transition-colors`}
              onClick={() => handleSkillClick(skill)}
            >
              {skill.label}
              {renderSkillLevel(skill, type)}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(skill.id);
                }}
                className={`ml-1 ${config.removeHoverColor}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={skills?.length === 0 ? config.placeholder : "Добавить навык..."}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
                handleCreateTag(e.target.value);
              }
            }}
          />
        </div>
      </div>
      
      {/* Dropdown suggestions */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray/20 rounded-[8px] shadow-lg z-50 max-h-40 overflow-y-auto">
          {mockSkillsData
            .filter(s => s.type === type)
            .filter(s => s.name.toLowerCase().includes(inputValue.toLowerCase()))
            .filter(s => !skills.some(existingSkill => existingSkill.label === s.name))
            .map(skill => (
              <div
                key={skill.id}
                className="px-3 py-2 hover:bg-gray/10 cursor-pointer text-sm"
                onClick={() => handleTagSelect(skill)}
              >
                {skill.name}
              </div>
            ))}
          {inputValue.trim() && !mockSkillsData.some(s => s.name.toLowerCase() === inputValue.toLowerCase()) && (
            <div
              className="px-3 py-2 hover:bg-gray/10 cursor-pointer text-sm text-primary border-t border-gray/20"
              onClick={() => handleCreateTag(inputValue)}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Создать "{inputValue.trim()}"
            </div>
          )}
        </div>
      )}

      {/* Skill Level Modal */}
      <SkillLevelModal
        isOpen={showLevelModal}
        onClose={() => {
          setShowLevelModal(false);
          setSelectedSkillForLevel(null);
        }}
        onSelect={handleLevelSelect}
        skillName={selectedSkillForLevel?.label}
        currentLevel={selectedSkillForLevel?.level}
      />
    </div>
  );
} 