import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function RoleVisibilityManager({ roleId, onUpdate }) {
  const [visibilityData, setVisibilityData] = useState({
    visibleSections: [],
    visibleViews: {}
  });
  
  const [options, setOptions] = useState({
    sections: [],
    views: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState(new Set());

  useEffect(() => {
    if (roleId) {
      loadVisibilityData();
      loadOptions();
    }
  }, [roleId]);

  const loadVisibilityData = async () => {
    try {
      setLoading(true);
      const response = await api.getRoleVisibility(roleId);
      setVisibilityData({
        visibleSections: response.data.visibleSections || [],
        visibleViews: response.data.visibleViews || {}
      });
    } catch (error) {
      console.error('Ошибка загрузки настроек видимости:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await api.getVisibilityOptions();
      setOptions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки опций видимости:', error);
    }
  };

  const handleSectionToggle = (sectionId) => {
    const newVisibleSections = visibilityData.visibleSections.includes(sectionId)
      ? visibilityData.visibleSections.filter(id => id !== sectionId)
      : [...visibilityData.visibleSections, sectionId];

    setVisibilityData(prev => ({
      ...prev,
      visibleSections: newVisibleSections
    }));

    // Если раздел скрыт, скрываем и все его представления
    if (!newVisibleSections.includes(sectionId)) {
      const newVisibleViews = { ...visibilityData.visibleViews };
      delete newVisibleViews[sectionId];
      setVisibilityData(prev => ({
        ...prev,
        visibleViews: newVisibleViews
      }));
    }
  };

  const handleViewToggle = (sectionId, viewId) => {
    const sectionViews = visibilityData.visibleViews[sectionId] || [];
    const newSectionViews = sectionViews.includes(viewId)
      ? sectionViews.filter(id => id !== viewId)
      : [...sectionViews, viewId];

    setVisibilityData(prev => ({
      ...prev,
      visibleViews: {
        ...prev.visibleViews,
        [sectionId]: newSectionViews
      }
    }));
  };

  const handleSectionExpand = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    try {
      await api.updateRoleVisibility(roleId, visibilityData);
      if (onUpdate) {
        onUpdate(visibilityData);
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек видимости:', error);
    }
  };

  const isSectionVisible = (sectionId) => {
    return visibilityData.visibleSections.includes(sectionId);
  };

  const isViewVisible = (sectionId, viewId) => {
    return visibilityData.visibleViews[sectionId] && 
           visibilityData.visibleViews[sectionId].includes(viewId);
  };

  const getSectionIcon = (sectionId) => {
    const section = options.sections.find(s => s.id === sectionId);
    return section?.icon || 'folder';
  };

  const getViewIcon = (viewId) => {
    // Здесь можно добавить логику для иконок представлений
    return 'file';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка настроек видимости...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Управление видимостью разделов и представлений
        </h3>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
        >
          Сохранить
        </button>
      </div>

      <div className="space-y-2">
        {options.sections.map(section => (
          <div key={section.id} className="border border-gray/20 rounded-[8px]">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSectionExpand(section.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSectionVisible(section.id)}
                    onChange={() => handleSectionToggle(section.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="font-medium">{section.label}</span>
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                {isSectionVisible(section.id) ? (
                  <Eye className="w-4 h-4 text-green-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Представления раздела */}
            {expandedSections.has(section.id) && options.views[section.id] && (
              <div className="border-t border-gray/20 bg-gray/5 p-4 space-y-2">
                {options.views[section.id].map(view => (
                  <div key={view.id} className="flex items-center justify-between pl-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isViewVisible(section.id, view.id)}
                        onChange={() => handleViewToggle(section.id, view.id)}
                        disabled={!isSectionVisible(section.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                      />
                      <span className={!isSectionVisible(section.id) ? 'text-gray-400' : 'text-gray-600'}>
                        {view.label}
                      </span>
                    </label>
                    
                    <div className="flex items-center gap-2">
                      {isViewVisible(section.id, view.id) ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Статистика */}
      <div className="mt-6 p-4 bg-gray/5 rounded-[8px]">
        <h4 className="font-medium text-gray-900 mb-2">Статистика видимости</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Видимых разделов:</span>
            <span className="ml-2 font-medium">{visibilityData.visibleSections.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Всего представлений:</span>
            <span className="ml-2 font-medium">
              {Object.values(visibilityData.visibleViews).reduce((total, views) => total + views.length, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 