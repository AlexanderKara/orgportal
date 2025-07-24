import React, { useState, useEffect } from 'react';
import { X, Building, Award } from 'lucide-react';
import FourPointedStar from './FourPointedStar';

export default function DepartmentModal({ isOpen, onClose, onSubmit, department = null }) {
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    description: '',
    competencies: ''
  });
  
  // Track original data and changes
  const [originalData, setOriginalData] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());

  useEffect(() => {
    if (department) {
      const competencies = Array.isArray(department.competencies) 
        ? department.competencies.join('\n') 
        : (department.competencies || '');
        
      setFormData({
        name: department.name || '',
        slogan: department.slogan || '',
        description: department.description || '',
        competencies
      });
      
      // Save original data for comparison
      setOriginalData({
        name: department.name || '',
        slogan: department.slogan || '',
        description: department.description || '',
        competencies
      });
      setChangedFields(new Set());
    } else {
      setFormData({
        name: '',
        slogan: '',
        description: '',
        competencies: ''
      });
      setOriginalData({});
      setChangedFields(new Set());
    }
  }, [department]);

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
    
    const departmentData = {
      ...formData,
      competencies: typeof formData.competencies === 'string'
        ? formData.competencies
            .split('\n')
            .map(c => c.trim())
            .filter(c => c.length > 0)
            .join('\n')
        : (Array.isArray(formData.competencies) ? formData.competencies.join('\n') : '')
    };

    // Only add id if we're editing an existing department
    if (department?.id) {
      departmentData.id = department.id;
      departmentData.changedFields = changedFields;
    }

    onSubmit(departmentData);
    
    // Reset form after submission
    setFormData({
      name: '',
      slogan: '',
      description: '',
      competencies: ''
    });
    setOriginalData({});
    setChangedFields(new Set());
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      slogan: '',
      description: '',
      competencies: ''
    });
    setOriginalData({});
    setChangedFields(new Set());
    onClose();
  };

  const competenciesList = typeof formData.competencies === 'string' 
    ? formData.competencies
        .split('\n')
        .map(c => c.trim())
        .filter(c => c.length > 0)
    : Array.isArray(formData.competencies) 
      ? formData.competencies 
      : [];

  if (!isOpen) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {department ? 'Редактировать отдел' : 'Добавить отдел'}
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
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название отдела *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    trackFieldChange('name', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Введите название отдела"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Слоган
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => {
                    setFormData({ ...formData, slogan: e.target.value });
                    trackFieldChange('slogan', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Введите слоган отдела"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    trackFieldChange('description', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Введите описание отдела"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Компетенции
                </label>
                <div className="space-y-3">
                  <textarea
                    value={formData.competencies}
                    onChange={(e) => {
                      setFormData({ ...formData, competencies: e.target.value });
                      trackFieldChange('competencies', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[120px]"
                    placeholder="Введите компетенции, каждую с новой строки"
                    rows={6}
                  />
                  {competenciesList.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Компетенции:</span>
                      </div>
                      <ul className="space-y-1">
                        {competenciesList.map((competency, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <FourPointedStar className="w-3.5 h-3.5" />
                            {competency}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {department ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 