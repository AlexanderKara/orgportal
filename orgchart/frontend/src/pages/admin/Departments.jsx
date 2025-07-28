import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import { Building, Plus, Edit, Trash2, Archive, Download, Upload, Search, Check, X, SortAsc, SortDesc, Users, Award } from 'lucide-react';
import DepartmentModal from '../../components/DepartmentModal';
import FourPointedStar from '../../components/FourPointedStar';
import { showNotification } from '../../utils/notifications';
import { exportData, importFile } from '../../utils/exportUtils';

export default function Departments() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [selectedDepartments, setSelectedDepartments] = useState(new Set());
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('order');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingCell, setEditingCell] = useState(null);

  // Загружаем данные
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.getDepartments();
      setDepartments(response.departments || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to preserve scroll position
  const preserveScrollPosition = async (operation) => {
    const scrollPosition = window.scrollY;
    await operation();
    window.scrollTo(0, scrollPosition);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtering
  const filteredDepartments = useMemo(() => {
    let filtered = [...departments];
    if (search.trim()) {
      filtered = filtered.filter(dep =>
        dep.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (dep.slogan && dep.slogan.toLowerCase().includes(search.trim().toLowerCase())) ||
        (dep.competencies && Array.isArray(dep.competencies) && dep.competencies.some(c => c.toLowerCase().includes(search.trim().toLowerCase())))
      );
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'order':
          aValue = a.order || 0;
          bValue = b.order || 0;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'slogan':
          aValue = a.slogan || '';
          bValue = b.slogan || '';
          break;
        case 'description':
          aValue = a.description || '';
          bValue = b.description || '';
          break;
        case 'competencies':
          aValue = Array.isArray(a.competencies) ? a.competencies.join(', ') : (a.competencies || '');
          bValue = Array.isArray(b.competencies) ? b.competencies.join(', ') : (b.competencies || '');
          break;
        default:
          aValue = a.order || 0;
          bValue = b.order || 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [departments, search, sortBy, sortDirection]);

  // Analytics
  const analytics = useMemo(() => {
    const total = departments.length;
    const totalEmployees = departments.reduce((sum, dep) => sum + (dep.employees?.length || 0), 0);
    const totalCompetencies = departments.reduce((sum, dep) => {
      if (dep.competencies && Array.isArray(dep.competencies)) {
        return sum + dep.competencies.length;
      }
      return sum;
    }, 0);
    
    return { total, totalEmployees, totalCompetencies };
  }, [departments]);

  // CRUD handlers
  const handleAdd = async (dep) => {
    try {
      setError(null); // Clear previous errors
      
      await preserveScrollPosition(async () => {
        await api.createDepartment(dep);
        // Инвалидируем кэш отделов
        api.clearCacheFor('/departments');
        // Перезагружаем данные после создания
        await loadData();
        setShowAddModal(false);
        setEditingDepartment(null);
      });
    } catch (error) {
      console.error('Error creating department:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка создания отдела';
      setError(errorMessage);
    }
  };
  
  const handleEdit = (dep) => {
    setError(null); // Clear previous errors
    setEditingDepartment(dep);
    setShowAddModal(true);
  };

  const handleUpdate = async (dep) => {
    try {
      setError(null); // Clear previous errors
      
      await preserveScrollPosition(async () => {
        // Создаем объект только с измененными полями
        const updateData = {};
        
        if (dep.changedFields?.has('name')) {
          updateData.name = dep.name;
        }
        if (dep.changedFields?.has('slogan')) {
          updateData.slogan = dep.slogan;
        }
        if (dep.changedFields?.has('description')) {
          updateData.description = dep.description;
        }
        if (dep.changedFields?.has('competencies')) {
          updateData.competencies = dep.competencies;
        }
        
        // Обновляем только если есть изменения
        if (Object.keys(updateData).length > 0) {
          console.log('Обновляем поля отдела:', updateData);
          await api.updateDepartment(dep.id, updateData);
          // Инвалидируем кэш отделов
          api.clearCacheFor('/departments');
        } else {
          console.log('Поля отдела не изменились, пропускаем обновление');
        }
        
        // Перезагружаем данные после обновления
        await loadData();
        setShowAddModal(false);
        setEditingDepartment(null);
      });
    } catch (error) {
      console.error('Error updating department:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка обновления отдела';
      setError(errorMessage);
    }
  };
  
  const handleDelete = async (id) => {
    try {
      setError(null); // Clear previous errors
      
      await preserveScrollPosition(async () => {
        await api.deleteDepartment(id);
        // Перезагружаем данные после удаления
        await loadData();
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка удаления отдела';
      setError(errorMessage);
    }
  };
  
  const handleArchive = (id) => {
    setDepartments(departments.map(d => d.id === id ? { ...d, archived: true } : d));
  };

  // Inline editing
  const handleInlineEdit = async (departmentId, field, value) => {
    try {
      const department = departments.find(d => d.id === departmentId);
      if (!department) return;

      await preserveScrollPosition(async () => {
        // Prepare the updated department data
        let updateValue = value;
        
        // Handle competencies conversion for inline editing
        if (field === 'competencies') {
          // Convert competencies array to string format for backend
          if (Array.isArray(value)) {
            updateValue = value.join('\n');
          } else if (typeof value === 'string') {
            // If it's already a string, ensure it's properly formatted
            updateValue = value
              .split('\n')
              .map(c => c.trim())
              .filter(c => c.length > 0)
              .join('\n');
          }
        }

        // Отправляем только измененное поле
        const updateData = { [field]: updateValue };
        await api.updateDepartment(departmentId, updateData);
        
        // Инвалидируем кэш отделов
        api.clearCacheFor('/departments');
        
        // Перезагружаем данные после обновления
        await loadData();
        setEditingCell(null);
      });
    } catch (error) {
      console.error('Error updating department:', error);
      setError('Ошибка обновления отдела');
      setEditingCell(null);
    }
  };

  // Sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Bulk select
  const handleSelectAll = () => {
    if (selectedDepartments.size === filteredDepartments.length) {
      setSelectedDepartments(new Set());
    } else {
      setSelectedDepartments(new Set(filteredDepartments.map(dep => dep.id)));
    }
  };
  
  const handleSelect = (id) => {
    const newSet = new Set(selectedDepartments);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedDepartments(newSet);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <SortAsc className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <SortAsc className="w-4 h-4" /> : 
      <SortDesc className="w-4 h-4" />;
  };

  // Функция для парсинга CSV строки с учетом кавычек


  const handleExport = () => {
    const data = filteredDepartments.map(dept => ({
      'ID': dept.id || '',
      'Название': dept.name || '',
      'Слоган': dept.slogan || '',
      'Описание': dept.description || '',
      'Компетенции': Array.isArray(dept.competencies) ? dept.competencies.join(';') : (dept.competencies || ''),
      'Цвет': dept.color || '#3B82F6',
      'Статус': dept.status || 'active',
      'Порядок': dept.order || 0
    }));
    
    // Используем универсальную функцию экспорта в Excel
    exportData(data, 'departments', 'excel', null, 'Отделы');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Используем универсальную функцию импорта
          const importedData = await importFile(file);
          
          if (importedData.length < 1) {
            showNotification('Файл должен содержать хотя бы одну строку данных', 'info');
            return;
          }
          
          const headers = Object.keys(importedData[0]);
          const requiredHeaders = ['ID', 'Название'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            showNotification(`Отсутствуют обязательные заголовки: ${missingHeaders.join(', ')}`, 'error');
            return;
          }
          
          const importedDepartments = importedData.map((row, index) => {
            const department = {};
            
            headers.forEach(header => {
              const value = row[header] || '';
              switch (header) {
                case 'ID':
                  department.id = value;
                  break;
                case 'Название':
                  department.name = value;
                  break;
                case 'Слоган':
                  department.slogan = value;
                  break;
                case 'Описание':
                  department.description = value;
                  break;
                case 'Компетенции':
                  department.competencies = value ? value.split(';').map(c => c.trim()).filter(c => c) : '';
                  break;
                case 'Цвет':
                  department.color = value || '#3B82F6';
                  break;
                case 'Статус':
                  department.status = value || 'active';
                  break;
                case 'Порядок':
                  department.order = parseInt(value) || 0;
                  break;
              }
            });
            
            department._rowNumber = index + 2;
            return department;
          });
          
          // Валидация и обработка данных
          const validDepartments = [];
          const errors = [];
          const updates = [];
          const creates = [];
          
          for (const department of importedDepartments) {
            const rowErrors = [];
            
            // Проверяем обязательные поля
            if (!department.name || !department.name.trim()) {
              rowErrors.push('Название обязательно');
            }
            
            if (rowErrors.length > 0) {
              errors.push({
                row: department._rowNumber,
                errors: rowErrors
              });
              continue;
            }
            
            // Ищем существующий отдел по ID
            if (department.id && department.id.trim()) {
              const existingDepartment = departments.find(dept => dept.id == department.id);
              if (existingDepartment) {
                updates.push({
                  id: existingDepartment.id,
                  data: department
                });
              } else {
                // ID указан, но отдел не найден - создаем новый
                delete department.id;
                creates.push(department);
              }
            } else {
              // Нет ID - новый отдел
              creates.push(department);
            }
            
            validDepartments.push(department);
          }
          
          // Выполняем операции с базой данных
          let successCount = 0;
          let errorCount = 0;
          
          // Обновляем существующие отделы
          for (const update of updates) {
            try {
              await api.updateDepartment(update.id, update.data);
              successCount++;
            } catch (error) {
              errorCount++;
              console.error(`Ошибка обновления отдела ${update.data.name}:`, error);
            }
          }
          
          // Создаем новые отделы
          for (const create of creates) {
            try {
              await api.createDepartment(create);
              successCount++;
            } catch (error) {
              errorCount++;
              console.error(`Ошибка создания отдела ${create.name}:`, error);
            }
          }
          
          // Показываем результаты
          if (successCount > 0) {
            showNotification(`Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`, 'success');
            await loadData(); // Перезагружаем данные
          }
          
          if (errorCount > 0) {
            showNotification(`Импорт завершен с ошибками. Успешно: ${successCount}, Ошибок: ${errorCount}`, 'warning');
          }
          
        } catch (error) {
          console.error('Ошибка при импорте:', error);
          showNotification(`Ошибка при обработке файла: ${error.message}`, 'error');
        }
      }
    };
    input.click();
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ID': '',
        'Название': 'Название отдела',
        'Слоган': 'Краткий слоган отдела',
        'Описание': 'Подробное описание отдела',
        'Компетенции': 'Компетенция 1; Компетенция 2; Компетенция 3',
        'Цвет': '#3B82F6',
        'Статус': 'active',
        'Порядок': '1'
      },
      {
        'ID': '',
        'Название': 'Пример отдела',
        'Слоган': 'Мы делаем мир лучше',
        'Описание': 'Отдел, который занимается разработкой инновационных решений',
        'Компетенции': 'JavaScript; React; TypeScript; Коммуникация; Лидерство',
        'Цвет': '#10B981',
        'Статус': 'active',
        'Порядок': '2'
      }
    ];
    
    // Экспортируем шаблон в Excel
    exportData(templateData, 'departments_template', 'excel', null, 'Шаблон отделов');
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Показываем загрузку */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка отделов...</p>
          </div>
        </div>
      )}

      {/* Показываем ошибку */}
      {error && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Показываем основной контент только если данные загружены */}
      {!loading && !error && (
      <>
      {/* Заголовок */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Отделы</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden lg:inline">Импорт</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Шаблон</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Экспорт</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Добавить</span>
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего отделов</span>
          </div>
          <div className="text-2xl font-bold text-dark">{analytics.total}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Сотрудников</span>
          </div>
          <div className="text-2xl font-bold text-dark">{analytics.totalEmployees}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Навыков</span>
          </div>
          <div className="text-2xl font-bold text-dark">{analytics.totalCompetencies}</div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px]">
        <div className="flex gap-1 bg-gray rounded-[8px] p-1">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-[8px] text-dark hover:bg-secondary hover:text-white transition"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            title="Сменить направление сортировки"
          >
            {sortDirection === 'asc' ? <SortAsc className="w-5 h-5 text-primary" /> : <SortDesc className="w-5 h-5 text-primary" />}
          </button>
        </div>
        <div className="flex-1 flex items-center w-full">
          <input
            type="text"
            placeholder="Поиск по отделам..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-base"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark">
                <input 
                  type="checkbox" 
                  checked={selectedDepartments.size === filteredDepartments.length && filteredDepartments.length > 0} 
                  onChange={handleSelectAll} 
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark">
                <button 
                  onClick={() => handleSort('order')} 
                  className="flex items-center hover:text-gray-200"
                >
                  Порядок
                  {getSortIcon('order')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark">
                <button 
                  onClick={() => handleSort('name')} 
                  className="flex items-center hover:text-gray-200"
                >
                  Название
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark">
                <button 
                  onClick={() => handleSort('slogan')} 
                  className="flex items-center hover:text-gray-200"
                >
                  Слоган
                  {getSortIcon('slogan')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark">
                <button 
                  onClick={() => handleSort('description')} 
                  className="flex items-center hover:text-gray-200"
                >
                  Описание
                  {getSortIcon('description')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark">
                <button 
                  onClick={() => handleSort('competencies')} 
                  className="flex items-center hover:text-gray-200"
                >
                  Компетенции
                  {getSortIcon('competencies')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray/20">
            {filteredDepartments.map(dep => (
              <tr key={dep.id} className={dep.archived ? 'opacity-50' : ''}>
                <td className="px-4 py-2">
                  <input 
                    type="checkbox" 
                    checked={selectedDepartments.has(dep.id)} 
                    onChange={() => handleSelect(dep.id)} 
                  />
                </td>
                <td className="px-4 py-2">
                  {editingCell?.id === dep.id && editingCell?.field === 'order' ? (
                    <input
                      type="number"
                      value={editingCell.value}
                      onChange={(e) => setEditingCell({ ...editingCell, value: parseInt(e.target.value, 10) })}
                      onBlur={() => handleInlineEdit(dep.id, 'order', editingCell.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(dep.id, 'order', editingCell.value);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -mx-2"
                      onClick={() => setEditingCell({ id: dep.id, field: 'order', value: dep.order })}
                    >
                      {dep.order}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingCell?.id === dep.id && editingCell?.field === 'name' ? (
                    <input
                      type="text"
                      value={editingCell.value}
                      onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                      onBlur={() => handleInlineEdit(dep.id, 'name', editingCell.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(dep.id, 'name', editingCell.value);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -mx-2"
                      onClick={() => setEditingCell({ id: dep.id, field: 'name', value: dep.name })}
                    >
                      {dep.name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingCell?.id === dep.id && editingCell?.field === 'slogan' ? (
                    <input
                      type="text"
                      value={editingCell.value}
                      onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                      onBlur={() => handleInlineEdit(dep.id, 'slogan', editingCell.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(dep.id, 'slogan', editingCell.value);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -mx-2"
                      onClick={() => setEditingCell({ id: dep.id, field: 'slogan', value: dep.slogan || '' })}
                    >
                      {dep.slogan || '-'}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingCell?.id === dep.id && editingCell?.field === 'description' ? (
                    <textarea
                      value={editingCell.value}
                      onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                      onBlur={() => handleInlineEdit(dep.id, 'description', editingCell.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleInlineEdit(dep.id, 'description', editingCell.value);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -mx-2"
                      onClick={() => setEditingCell({ id: dep.id, field: 'description', value: dep.description || '' })}
                    >
                      {dep.description || '-'}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingCell?.id === dep.id && editingCell?.field === 'competencies' ? (
                    <textarea
                      value={editingCell.value}
                      onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                      onBlur={() => handleInlineEdit(dep.id, 'competencies', editingCell.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[80px]"
                      rows={4}
                      placeholder="Введите компетенции, каждую с новой строки"
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -mx-2 max-h-[100px] overflow-y-auto"
                      onClick={() => setEditingCell({ 
                        id: dep.id, 
                        field: 'competencies', 
                        value: Array.isArray(dep.competencies) 
                          ? dep.competencies.join('\n') 
                          : (dep.competencies || '') 
                      })}
                    >
                      {(Array.isArray(dep.competencies) ? dep.competencies : 
                        (typeof dep.competencies === 'string' ? 
                          dep.competencies.split('\n').filter(c => c.trim().length > 0) : 
                          []
                        )
                      ).length > 0 ? (
                        <ul style={{margin: 0, padding: 0, listStyle: 'none'}}>
                          {(Array.isArray(dep.competencies) ? dep.competencies : 
                            (typeof dep.competencies === 'string' ? 
                              dep.competencies.split('\n').filter(c => c.trim().length > 0) : 
                              []
                            )
                          ).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      ) : ''}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => handleEdit(dep)} className="p-1 rounded hover:bg-gray-100">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleArchive(dep.id)} className="p-1 rounded hover:bg-gray-100">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(dep.id)} className="p-1 rounded hover:bg-gray-100">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Multi-edit actions */}
      {selectedDepartments.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Выбрано: {selectedDepartments.size}
          </span>
          <button className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90">
            Архивировать
          </button>
          <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
            Удалить
          </button>
          <button 
            onClick={() => setSelectedDepartments(new Set())}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
          >
            Отменить
          </button>
        </div>
      )}

      <DepartmentModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingDepartment(null);
          setError(null); // Clear any errors when closing modal
        }}
        onSubmit={editingDepartment ? handleUpdate : handleAdd}
        department={editingDepartment}
      />
      </>
      )}
    </div>
  );
} 