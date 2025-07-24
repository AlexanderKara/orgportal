import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Archive } from 'lucide-react';

// Mock data for vacation types
const mockVacationTypes = [
  { id: 1, name: 'Ежегодный отпуск', description: 'Основной оплачиваемый отпуск', status: 'active' },
  { id: 2, name: 'Больничный', description: 'Отпуск по болезни', status: 'active' },
  { id: 3, name: 'Декретный отпуск', description: 'Отпуск по беременности и родам', status: 'active' },
  { id: 4, name: 'Учебный отпуск', description: 'Отпуск для обучения', status: 'active' },
  { id: 5, name: 'Отпуск без содержания', description: 'Неоплачиваемый отпуск', status: 'active' },
  { id: 6, name: 'Другой', description: 'Прочие виды отпусков', status: 'archived' },
];

export default function VacationTypeModal({ isOpen, onClose, onSubmit }) {
  const [vacationTypes, setVacationTypes] = useState(mockVacationTypes);
  const [editingType, setEditingType] = useState(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load vacation types from localStorage if available
      const savedTypes = localStorage.getItem('vacationTypes');
      if (savedTypes) {
        setVacationTypes(JSON.parse(savedTypes));
      }
    }
  }, [isOpen]);

  const handleAddType = () => {
    if (!newTypeName.trim()) return;

    const newType = {
      id: Date.now(),
      name: newTypeName.trim(),
      description: newTypeDescription.trim(),
      status: 'active'
    };

    const updatedTypes = [...vacationTypes, newType];
    setVacationTypes(updatedTypes);
    setNewTypeName('');
    setNewTypeDescription('');
    
    // Save to localStorage
    localStorage.setItem('vacationTypes', JSON.stringify(updatedTypes));
    
    // Call onSubmit to update parent component
    if (onSubmit) {
      onSubmit(updatedTypes);
    }
  };

  const handleEditType = (typeId) => {
    const type = vacationTypes.find(t => t.id === typeId);
    if (type) {
      setEditingType(type);
      setNewTypeName(type.name);
      setNewTypeDescription(type.description);
    }
  };

  const handleSaveEdit = () => {
    if (!editingType || !newTypeName.trim()) return;

    const updatedTypes = vacationTypes.map(type =>
      type.id === editingType.id
        ? { ...type, name: newTypeName.trim(), description: newTypeDescription.trim() }
        : type
    );

    setVacationTypes(updatedTypes);
    setEditingType(null);
    setNewTypeName('');
    setNewTypeDescription('');
    
    // Save to localStorage
    localStorage.setItem('vacationTypes', JSON.stringify(updatedTypes));
    
    // Call onSubmit to update parent component
    if (onSubmit) {
      onSubmit(updatedTypes);
    }
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setNewTypeName('');
    setNewTypeDescription('');
  };

  const handleArchiveType = (typeId) => {
    const updatedTypes = vacationTypes.map(type =>
      type.id === typeId
        ? { ...type, status: type.status === 'archived' ? 'active' : 'archived' }
        : type
    );

    setVacationTypes(updatedTypes);
    
    // Save to localStorage
    localStorage.setItem('vacationTypes', JSON.stringify(updatedTypes));
    
    // Call onSubmit to update parent component
    if (onSubmit) {
      onSubmit(updatedTypes);
    }
  };

  const handleDeleteType = (typeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тип отпуска?')) {
      const updatedTypes = vacationTypes.filter(type => type.id !== typeId);
      setVacationTypes(updatedTypes);
      
      // Save to localStorage
      localStorage.setItem('vacationTypes', JSON.stringify(updatedTypes));
      
      // Call onSubmit to update parent component
      if (onSubmit) {
        onSubmit(updatedTypes);
      }
    }
  };

  const handleClose = () => {
    setEditingType(null);
    setNewTypeName('');
    setNewTypeDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[15px] w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">Управление типами отпусков</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Добавление нового типа */}
          <div className="mb-6 p-4 bg-gray/5 rounded-[8px] border border-gray/20">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Добавить новый тип отпуска</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Название типа отпуска"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                placeholder="Описание типа отпуска"
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
              />
              <button
                onClick={editingType ? handleSaveEdit : handleAddType}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
              >
                {editingType ? (
                  <>
                    <Edit className="w-4 h-4" />
                    Сохранить изменения
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Добавить тип
                  </>
                )}
              </button>
              {editingType && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] hover:bg-gray/10 transition-colors"
                >
                  Отменить редактирование
                </button>
              )}
            </div>
          </div>

          {/* Список типов отпусков */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Существующие типы отпусков</h4>
            {vacationTypes.map((type) => (
              <div
                key={type.id}
                className={`p-4 rounded-[8px] border ${
                  type.status === 'archived' 
                    ? 'bg-gray/5 border-gray/20' 
                    : 'bg-white border-gray/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className={`font-medium ${
                        type.status === 'archived' ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {type.name}
                      </h5>
                      {type.status === 'archived' && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                          Архивный
                        </span>
                      )}
                    </div>
                    {type.description && (
                      <p className={`text-sm ${
                        type.status === 'archived' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {type.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditType(type.id)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchiveType(type.id)}
                      className="text-orange-600 hover:text-orange-900 transition-colors"
                      title={type.status === 'archived' ? 'Активировать' : 'Архивировать'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteType(type.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 