import React from 'react';
import { X } from 'lucide-react';

export default function SkillLevelModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  skillName = '',
  currentLevel = null
}) {
  const handleLevelSelect = (level) => {
    onSelect(level);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[15px] w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            Выберите уровень владения
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
        {skillName && (
          <p className="text-gray-600 mb-4">
            Навык: <span className="font-medium">{skillName}</span>
          </p>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => handleLevelSelect(1)}
            className={`w-full flex items-center gap-3 p-3 border rounded-[8px] transition-colors ${
              currentLevel === 1 
                ? 'border-primary bg-primary/10' 
                : 'border-gray/20 hover:bg-gray/10'
            }`}
          >
            <div className="flex gap-1">
              {[1, 2, 3].map((star) => (
                <svg
                  key={star}
                  className="w-3 h-3"
                  viewBox="0 0 14 14"
                  style={{ display: 'inline' }}
                >
                  <polygon
                    points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2"
                    fill={star === 1 ? '#E42E0F' : '#666666'}
                  />
                </svg>
              ))}
            </div>
            <span className="text-left">
              <div className="font-medium">Базовый</div>
              <div className="text-sm text-gray-500">Начальный уровень владения</div>
            </span>
          </button>

          <button
            onClick={() => handleLevelSelect(2)}
            className={`w-full flex items-center gap-3 p-3 border rounded-[8px] transition-colors ${
              currentLevel === 2 
                ? 'border-primary bg-primary/10' 
                : 'border-gray/20 hover:bg-gray/10'
            }`}
          >
            <div className="flex gap-1">
              {[1, 2, 3].map((star) => (
                <svg
                  key={star}
                  className="w-3 h-3"
                  viewBox="0 0 14 14"
                  style={{ display: 'inline' }}
                >
                  <polygon
                    points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2"
                    fill={star <= 2 ? '#E42E0F' : '#666666'}
                  />
                </svg>
              ))}
            </div>
            <span className="text-left">
              <div className="font-medium">Средний</div>
              <div className="text-sm text-gray-500">Хороший уровень владения</div>
            </span>
          </button>

          <button
            onClick={() => handleLevelSelect(3)}
            className={`w-full flex items-center gap-3 p-3 border rounded-[8px] transition-colors ${
              currentLevel === 3 
                ? 'border-primary bg-primary/10' 
                : 'border-gray/20 hover:bg-gray/10'
            }`}
          >
            <div className="flex gap-1">
              {[1, 2, 3].map((star) => (
                <svg
                  key={star}
                  className="w-3 h-3"
                  viewBox="0 0 14 14"
                  style={{ display: 'inline' }}
                >
                  <polygon
                    points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2"
                    fill={star <= 3 ? '#E42E0F' : '#666666'}
                  />
                </svg>
              ))}
            </div>
            <span className="text-left">
              <div className="font-medium">Профессиональный</div>
              <div className="text-sm text-gray-500">Высокий уровень владения</div>
            </span>
          </button>

          <button
            onClick={() => handleLevelSelect(null)}
            className={`w-full flex items-center gap-3 p-3 border rounded-[8px] transition-colors ${
              currentLevel === null || currentLevel === 'none'
                ? 'border-primary bg-primary/10' 
                : 'border-gray/20 hover:bg-gray/10'
            }`}
          >
            <span className="text-left">
              <div className="font-medium">Не указывать</div>
              <div className="text-sm text-gray-500">Без указания уровня владения</div>
            </span>
          </button>
        </div>

        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 