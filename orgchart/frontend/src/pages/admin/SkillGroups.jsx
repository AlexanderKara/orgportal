import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, Search, Filter, Plus, Edit, Trash2, 
  Users, FileText, Award, Tag, Copy, Upload, Download, Archive
} from 'lucide-react';
import Select from 'react-select';
import SkillGroupModal from '../../components/SkillGroupModal';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import { exportData, importFile } from '../../utils/exportUtils';

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
    zIndex: 9999,
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

export default function SkillGroups() {
  const [skillGroups, setSkillGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Load skill groups from API
  useEffect(() => {
    loadSkillGroups();
  }, []);

  const loadSkillGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSkillGroups();
      // Универсально ищем массив групп навыков
      const skillGroupsData =
        Array.isArray(response.skillGroups) ? response.skillGroups :
        Array.isArray(response.data) ? response.data :
        Array.isArray(response) ? response : [];
      setSkillGroups(skillGroupsData);
    } catch (err) {
      console.error('Error loading skill groups:', err);
      setError(err.message || 'Failed to load skill groups');
      setSkillGroups([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort skill groups
  const filteredGroups = useMemo(() => {
    // Ensure skillGroups is an array before spreading
    const groupsArray = Array.isArray(skillGroups) ? skillGroups : [];
    let filtered = [...groupsArray];

    if (search.trim()) {
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(search.trim().toLowerCase()))
      );
    }

    if (selectedType && selectedType.value !== 'all') {
      filtered = filtered.filter(group => group.type === selectedType.value);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'skillsCount':
          aValue = a.skillsCount || 0;
          bValue = b.skillsCount || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [skillGroups, search, selectedType, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setShowAddModal(true);
  };

  const handleDelete = async (groupId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту группу навыков?')) {
      try {
        await api.deleteSkillGroup(groupId);
        await loadSkillGroups();
      } catch (err) {
        console.error('Error deleting skill group:', err);
        showNotification('Ошибка при удалении группы навыков', 'error');
      }
    }
  };

  const handleDuplicate = (group) => {
    // Логика дублирования
  };

  const handleArchive = async (groupId) => {
    if (window.confirm('Вы уверены, что хотите архивировать эту группу навыков?')) {
      try {
        await api.updateSkillGroup(groupId, { status: 'archived' });
        await loadSkillGroups();
      } catch (err) {
        console.error('Error archiving skill group:', err);
        showNotification('Ошибка при архивировании группы навыков', 'error');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroups.map(group => group.id)));
    }
  };

  const handleSelectGroup = (groupId) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleInlineEdit = async (groupId, field, value) => {
    try {
      // Сохраняем позицию прокрутки
      const scrollPosition = window.scrollY;

      // Find the group to update
      const group = skillGroups.find(g => g.id === groupId);
      if (!group) return;

      // Prepare update data
      const updateData = { [field]: value };

      // Call API to update the skill group
      await api.updateSkillGroup(groupId, updateData);
      
      // Reload skill groups to get updated data
      await loadSkillGroups();
      
      setEditingCell(null);
      
      // Восстанавливаем позицию прокрутки после обновления
      window.scrollTo(0, scrollPosition);
    } catch (err) {
      console.error('Error updating skill group:', err);
      showNotification('Ошибка при обновлении группы навыков', 'error');
    }
  };

  const handleExport = () => {
    const data = filteredGroups.map(group => ({
      'Название': group.name || '',
      'Описание': group.description || '',
      'Тип навыка': group.type || '',
      'Количество навыков': group.skillsCount || 0,
      'Статус': group.status || ''
    }));
    
    if (data.length === 0) {
      showNotification('Нет данных для экспорта', 'info');
      return;
    }
    
    exportData(data, 'skill_groups', 'excel');
  };

  // Функция для парсинга CSV строки с учетом кавычек
  const parseCSVLine = (line, delimiter) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const csv = e.target.result;
            const lines = csv.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
              showNotification('Файл должен содержать заголовки и хотя бы одну строку данных', 'info');
              return;
            }
            
            // Определяем разделитель (приоритет точке с запятой)
            const firstLine = lines[0];
            const semicolonCount = (firstLine.match(/;/g) || []).length;
            const commaCount = (firstLine.match(/,/g) || []).length;
            const delimiter = semicolonCount > 0 ? ';' : ',';
            
            const headers = parseCSVLine(lines[0], delimiter).map(h => h.trim().replace(/"/g, ''));
            const requiredHeaders = ['Название', 'Тип навыка'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            
            if (missingHeaders.length > 0) {
              showNotification(`Отсутствуют обязательные заголовки: ${missingHeaders.join(', ')}`, 'error');
              return;
            }
            
            const importedGroups = lines.slice(1).map((line, index) => {
              const values = parseCSVLine(line, delimiter);
              const group = {};
              
              headers.forEach((header, headerIndex) => {
                const value = values[headerIndex] || '';
                switch (header) {
                  case 'Название':
                    group.name = value;
                    break;
                  case 'Описание':
                    group.description = value;
                    break;
                  case 'Тип навыка':
                    group.type = value;
                    break;
                  case 'Статус':
                    group.status = value || 'active';
                    break;
                }
              });
              
              group._rowNumber = index + 2;
              return group;
            });
            
            // Валидация и обработка данных
            const validGroups = [];
            const errors = [];
            const updates = [];
            const creates = [];
            
            // Получаем существующие типы навыков
            const existingSkillTypes = ['hard', 'soft', 'hobby'];
            
            for (const group of importedGroups) {
              const rowErrors = [];
              
              // Проверяем обязательные поля
              if (!group.name || !group.name.trim()) {
                rowErrors.push('Название обязательно');
              }
              
              // Валидация типа навыка
              if (group.type) {
                const normalizedType = group.type.toLowerCase();
                if (!existingSkillTypes.includes(normalizedType)) {
                  rowErrors.push(`Неизвестный тип навыка: ${group.type}`);
                } else {
                  group.type = normalizedType;
                }
              }
              
              if (rowErrors.length > 0) {
                errors.push({
                  row: group._rowNumber,
                  errors: rowErrors
                });
                continue;
              }
              
              // Ищем существующую группу по названию
              const existingGroup = skillGroups.find(g => g.name.toLowerCase() === group.name.toLowerCase());
              
              if (existingGroup) {
                updates.push({
                  id: existingGroup.id,
                  data: group
                });
              } else {
                creates.push(group);
              }
              
              validGroups.push(group);
            }
            
            // Выполняем операции с базой данных
            let successCount = 0;
            let errorCount = 0;
            
            // Обновляем существующие группы
            for (const update of updates) {
              try {
                await api.updateSkillGroup(update.id, update.data);
                successCount++;
              } catch (error) {
                errorCount++;
                console.error(`Ошибка обновления группы навыков ${update.data.name}:`, error);
              }
            }
            
            // Создаем новые группы
            for (const create of creates) {
              try {
                await api.createSkillGroup(create);
                successCount++;
              } catch (error) {
                errorCount++;
                console.error(`Ошибка создания группы навыков ${create.name}:`, error);
              }
            }
            
            // Показываем результаты
            if (successCount > 0) {
              showNotification(`Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`, 'success');
              await loadSkillGroups(); // Перезагружаем данные
            }
            
            if (errorCount > 0) {
              showNotification(`Импорт завершен с ошибками. Успешно: ${successCount}, Ошибок: ${errorCount}`, 'warning');
            }
            
          } catch (error) {
            console.error('Ошибка при импорте:', error);
            showNotification('Ошибка при обработке файла. Проверьте формат CSV.', 'error');
          }
        };
        reader.readAsText(file, 'UTF-8');
      }
    };
    input.click();
  };

  const handleCreateGroup = async (groupData) => {
    try {
      if (editingGroup) {
        await api.updateSkillGroup(editingGroup.id, groupData);
      } else {
        await api.createSkillGroup(groupData);
      }
      setShowAddModal(false);
      setEditingGroup(null);
      await loadSkillGroups();
    } catch (err) {
      console.error('Error saving skill group:', err);
      showNotification('Ошибка при сохранении группы навыков', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Название': 'Программирование',
        'Описание': 'Группа навыков для программистов',
        'Тип навыка': 'hard',
        'Количество навыков': 5,
        'Статус': 'active'
      },
      {
        'Название': 'Коммуникация',
        'Описание': 'Группа навыков для коммуникации',
        'Тип навыка': 'soft',
        'Количество навыков': 3,
        'Статус': 'active'
      },
      {
        'Название': 'Спорт',
        'Описание': 'Группа навыков для спортивных хобби',
        'Тип навыка': 'hobby',
        'Количество навыков': 2,
        'Статус': 'active'
      }
    ];
    
    exportData(templateData, 'skill_groups_template', 'excel');
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'hard':
        return 'bg-blue-100 text-blue-800';
      case 'soft':
        return 'bg-green-100 text-green-800';
      case 'hobby':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка групп навыков...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Ошибка: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Группы навыков</h1>
          <p className="text-gray-600">Управление группами навыков и компетенций</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Upload className="w-4 h-4" />
            Импорт
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <FileText className="w-4 h-4" />
            Шаблон
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setEditingGroup(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Добавить группу
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего групп</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredGroups.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Навыков в группах</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredGroups.reduce((sum, group) => sum + (group.skillsCount || 0), 0)}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Выбрано</span>
          </div>
          <div className="text-2xl font-bold text-dark">{selectedGroups.size}</div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px] flex-wrap">
        <div className="flex-1 flex items-center">
          <input
            type="text"
            placeholder="Поиск по названию или описанию..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            placeholder="Тип"
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { value: 'all', label: 'Все типы' },
              { value: 'hard', label: 'Хард скиллы' },
              { value: 'soft', label: 'Софт скиллы' },
              { value: 'hobby', label: 'Хобби' },
            ]}
            styles={customSelectStyles}
            className="w-40"
          />
        </div>
      </div>

      {/* Таблица групп навыков */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedGroups.size === filteredGroups.length && filteredGroups.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Группа
                    {sortBy === 'name' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Тип
                    {sortBy === 'type' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Описание
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('skillsCount')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Навыки
                    {sortBy === 'skillsCount' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {filteredGroups.map((group, index) => (
                <tr key={group.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedGroups.has(group.id)}
                      onChange={() => handleSelectGroup(group.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {editingCell === `${group.id}-name` ? (
                            <div className="relative">
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                                onBlur={(e) => {
                                  handleInlineEdit(group.id, 'name', e.target.value);
                                  setEditingCell(null);
                                  setEditingValue('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInlineEdit(group.id, 'name', e.target.value);
                                    setEditingCell(null);
                                    setEditingValue('');
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    setEditingValue('');
                                  }
                                }}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span 
                              className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                              onClick={() => {
                                setEditingCell(`${group.id}-name`);
                                setEditingValue(group.name);
                              }}
                            >
                              {group.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${group.id}-type` ? (
                      <Select
                        value={{ value: group.type, label: group.type === 'hard' ? 'Хард' : group.type === 'soft' ? 'Софт' : 'Хобби' }}
                        onChange={(option) => handleInlineEdit(group.id, 'type', option.value)}
                        options={[
                          { value: 'hard', label: 'Хард' },
                          { value: 'soft', label: 'Софт' },
                          { value: 'hobby', label: 'Хобби' },
                        ]}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(group.type)} cursor-pointer`}
                        onClick={() => setEditingCell(`${group.id}-type`)}
                      >
                        {group.type === 'hard' ? 'Хард' : 
                         group.type === 'soft' ? 'Софт' : 
                         group.type === 'hobby' ? 'Хобби' : 'Неизвестно'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${group.id}-description` ? (
                      <textarea
                        defaultValue={group.description}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                        onBlur={(e) => {
                          handleInlineEdit(group.id, 'description', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            handleInlineEdit(group.id, 'description', e.target.value);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${group.id}-description`)}
                      >
                        {group.description}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${group.id}-skillsCount` ? (
                      <input
                        type="number"
                        defaultValue={group.skillsCount}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(group.id, 'skillsCount', parseInt(e.target.value));
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(group.id, 'skillsCount', parseInt(e.target.value));
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${group.id}-skillsCount`)}
                      >
                        {group.skillsCount}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(group)}
                        className="text-green-600 hover:text-green-900"
                        title="Дублировать"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(group.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Архивировать"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно добавления/редактирования группы */}
      <SkillGroupModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingGroup(null);
        }}
        onSubmit={handleCreateGroup}
        editingGroup={editingGroup}
      />
    </div>
  );
} 