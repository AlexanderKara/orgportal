import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, Search, Filter, Plus, Edit, Trash2, 
  Users, FileText, BarChart3, Tag, Copy, Upload, Download, Archive
} from 'lucide-react';
import Select from 'react-select';
import SkillGroupModal from '../../components/SkillGroupModal';
import SkillModal from '../../components/SkillModal';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';

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

// Удаляем моковые данные - теперь используем реальные API

const skillTypes = [
  { value: 'all', label: 'Все типы' },
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
  { value: 'all', label: 'Все группы' },
  ...skillGroupsByType.hard,
  ...skillGroupsByType.soft,
  ...skillGroupsByType.hobby,
];

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-[15px] border border-gray/50 p-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Показано {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} из {totalItems}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Строк на странице:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1 text-sm border border-gray/20 rounded hover:bg-gray/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Предыдущая
        </button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-1 text-sm border rounded ${
                page === currentPage
                  ? 'bg-primary text-white border-primary'
                  : page === '...'
                  ? 'border-transparent cursor-default'
                  : 'border-gray/20 hover:bg-gray/10'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1 text-sm border border-gray/20 rounded hover:bg-gray/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Следующая →
        </button>
      </div>
    </div>
  );
};

// Removed skill levels as they are now handled per employee

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [skillGroups, setSkillGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedSkills, setSelectedSkills] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([loadSkills(), loadSkillGroups()]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await api.getSkills();
      setSkills(response.skills || []);
    } catch (error) {
      console.error('Error loading skills:', error);
      setError('Ошибка загрузки навыков');
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

  const loadSkillGroups = async () => {
    try {
      const response = await api.getSkillGroups();
      // Универсально ищем массив групп навыков
      const groupsData =
        Array.isArray(response.skillGroups) ? response.skillGroups :
        Array.isArray(response.data) ? response.data :
        Array.isArray(response) ? response : [];
      setSkillGroups(groupsData);
    } catch (err) {
      console.error('Error loading skill groups:', err);
      setSkillGroups([]);
    }
  };

  // Фильтрация и сортировка навыков
  const filteredSkills = useMemo(() => {
    try {
      // Ensure skills is an array before spreading
      const skillsArray = Array.isArray(skills) ? skills : [];
      let filtered = [...skillsArray];

      if (search.trim()) {
        filtered = filtered.filter(skill => 
          skill.name && skill.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          (skill.description && skill.description.toLowerCase().includes(search.trim().toLowerCase()))
        );
      }

      if (selectedType && selectedType.value !== 'all') {
        filtered = filtered.filter(skill => skill.skill_type === selectedType.value);
      }

      if (selectedGroup && selectedGroup.value !== 'all') {
        filtered = filtered.filter(skill => 
          skill.skillGroup && skill.skillGroup.id === selectedGroup.value
        );
      }

      // Сортировка
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'skill_type':
            aValue = a.skill_type || '';
            bValue = b.skill_type || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          default:
            aValue = a.name || '';
            bValue = b.name || '';
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      return filtered;
    } catch (error) {
      console.error('Error filtering skills:', error);
      return [];
    }
  }, [skills, search, selectedType, selectedGroup, sortBy, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSkills = filteredSkills.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedType, selectedGroup]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setShowAddModal(true);
  };

  const handleDelete = async (skillId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот навык?')) {
      try {
        await api.deleteSkill(skillId);
        await loadSkills();
      } catch (err) {
        console.error('Error deleting skill:', err);
        showNotification('Ошибка при удалении навыка', 'error');
      }
    }
  };

  const handleDuplicate = (skill) => {
    // Логика дублирования
  };

  const handleArchive = async (skillId) => {
    if (window.confirm('Вы уверены, что хотите архивировать этот навык?')) {
      try {
        await api.updateSkill(skillId, { status: 'archived' });
        await loadSkills();
      } catch (err) {
        console.error('Error archiving skill:', err);
        showNotification('Ошибка при архивировании навыка', 'error');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedSkills.size === paginatedSkills.length && paginatedSkills.length > 0) {
      setSelectedSkills(new Set());
    } else {
      setSelectedSkills(new Set(paginatedSkills.map(skill => skill.id)));
    }
  };

  const handleSelectSkill = (skillId) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };

  const handleInlineEdit = async (skillId, field, value) => {
    try {
      await preserveScrollPosition(async () => {
        // Find the skill to update
        const skill = skills.find(s => s.id === skillId);
        if (!skill) return;

        // Prepare update data
        const updateData = { [field]: value };

        // If updating skill_group_id, we need to find the group ID by name
        if (field === 'skill_group_id') {
          updateData.skill_group_id = value;
        }

        // Call API to update the skill
        await api.updateSkill(skillId, updateData);
        
        // Reload skills to get updated data
        await loadSkills();
        
        setEditingCell(null);
      });
    } catch (err) {
      console.error('Error updating skill:', err);
      showNotification('Ошибка при обновлении навыка', 'error');
    }
  };

  const handleExport = () => {
    try {
      const data = filteredSkills.map(skill => ({
        'Название': skill.name || '',
        'Описание': skill.description || '',
        'Тип навыка': skill.skill_type || '',
        'Группа навыков': skill.skill_group?.name || '',
        'Статус': skill.status || ''
      }));
      
      if (data.length === 0) {
        showNotification('Нет данных для экспорта', 'info');
        return;
      }
      
      // Экспорт с разделителем точка с запятой и экранированием
      const csv = [
        Object.keys(data[0]).join(';'),
        ...data.map(row => Object.values(row).map(value => {
          const stringValue = String(value);
          if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(';'))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skills_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting skills:', error);
      showNotification('Ошибка при экспорте навыков', 'error');
    }
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
            
            const importedSkills = lines.slice(1).map((line, index) => {
              const values = parseCSVLine(line, delimiter);
              const skill = {};
              
              headers.forEach((header, headerIndex) => {
                const value = values[headerIndex] || '';
                switch (header) {
                  case 'Название':
                    skill.name = value;
                    break;
                  case 'Описание':
                    skill.description = value;
                    break;
                  case 'Тип навыка':
                    skill.skill_type = value;
                    break;
                  case 'Группа навыков':
                    skill.skill_group_name = value;
                    break;
                  case 'Статус':
                    skill.status = value || 'active';
                    break;
                }
              });
              
              skill._rowNumber = index + 2;
              return skill;
            });
            
            // Валидация и обработка данных
            const validSkills = [];
            const errors = [];
            const updates = [];
            const creates = [];
            
            // Получаем существующие типы навыков и группы
            const existingSkillTypes = ['hard', 'soft', 'hobby'];
            const existingSkillGroups = skillGroups.map(group => group.name);
            
            for (const skill of importedSkills) {
              const rowErrors = [];
              
              // Проверяем обязательные поля
              if (!skill.name || !skill.name.trim()) {
                rowErrors.push('Название обязательно');
              }
              
              // Валидация типа навыка
              if (skill.skill_type) {
                const normalizedType = skill.skill_type.toLowerCase();
                if (!existingSkillTypes.includes(normalizedType)) {
                  rowErrors.push(`Неизвестный тип навыка: ${skill.skill_type}`);
                } else {
                  skill.skill_type = normalizedType;
                }
              }
              
              if (rowErrors.length > 0) {
                errors.push({
                  row: skill._rowNumber,
                  errors: rowErrors
                });
                continue;
              }
              
              // Ищем существующий навык по названию
              const existingSkill = skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
              
              if (existingSkill) {
                updates.push({
                  id: existingSkill.id,
                  data: skill
                });
              } else {
                creates.push(skill);
              }
              
              validSkills.push(skill);
            }
            
            // Выполняем операции с базой данных
            let successCount = 0;
            let errorCount = 0;
            
            // Обновляем существующие навыки
            for (const update of updates) {
              try {
                await api.updateSkill(update.id, update.data);
                successCount++;
              } catch (error) {
                errorCount++;
                console.error(`Ошибка обновления навыка ${update.data.name}:`, error);
              }
            }
            
            // Создаем новые навыки
            for (const create of creates) {
              try {
                // Если указана группа навыков, создаем её если не существует
                if (create.skill_group_name && !existingSkillGroups.includes(create.skill_group_name)) {
                  try {
                    await api.createSkillGroup({
                      name: create.skill_group_name,
                      type: create.skill_type || 'hard'
                    });
                  } catch (error) {
                    console.error(`Ошибка создания группы навыков ${create.skill_group_name}:`, error);
                  }
                }
                
                await api.createSkill(create);
                successCount++;
              } catch (error) {
                errorCount++;
                console.error(`Ошибка создания навыка ${create.name}:`, error);
              }
            }
            
            // Показываем результаты
            if (successCount > 0) {
              showNotification(`Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`, 'success');
              await loadSkills(); // Перезагружаем данные
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
      await api.createSkillGroup(groupData);
      setShowAddGroupModal(false);
      // Reload skills to get updated group data
      await loadSkills();
      await loadSkillGroups(); // Reload groups to update the dropdown
    } catch (err) {
      console.error('Error creating skill group:', err);
      showNotification('Ошибка при создании группы навыков', 'error');
    }
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

  // Фильтр групп
  const groupOptions = useMemo(() => {
    try {
      return [
        { value: 'all', label: 'Все группы' },
        ...(skillGroups || []).map(group => ({ 
          value: group.id, 
          label: group.name, 
          type: group.type || 'unknown' 
        }))
      ];
    } catch (error) {
      console.error('Error creating groupOptions:', error);
      return [{ value: 'all', label: 'Все группы' }];
    }
  }, [skillGroups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка навыков...</div>
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
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Навыки</h1>
          <p className="text-gray-600">Управление навыками и компетенциями</p>
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
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
          <button
            onClick={() => {
              setShowAddGroupModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Добавить группу навыков
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setEditingSkill(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Добавить навык
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего навыков</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredSkills.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Активных навыков</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredSkills.filter(skill => skill.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Групп навыков</span>
          </div>
          <div className="text-2xl font-bold text-dark">{new Set(filteredSkills.map(skill => skill.skillGroup ? skill.skillGroup.name : null).filter(Boolean)).size}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Выбрано</span>
          </div>
          <div className="text-2xl font-bold text-dark">{selectedSkills.size}</div>
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
            options={skillTypes}
            styles={customSelectStyles}
            className="w-32"
          />
          <Select
            placeholder="Группа"
            value={groupOptions.find(g => g.value === (selectedGroup ? selectedGroup.value : 'all'))}
            onChange={setSelectedGroup}
            options={groupOptions}
            styles={customSelectStyles}
            className="w-40"
          />
          {/* Removed level filter as levels are now per employee */}
        </div>
      </div>

      {/* Пагинация над таблицей */}
      {filteredSkills.length > 0 && (
        <div className="mb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={filteredSkills.length}
          />
        </div>
      )}

      {/* Таблица навыков */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedSkills.size === paginatedSkills.length && paginatedSkills.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                  >
                    <span>Навык</span>
                    <span className="text-xs">
                      {sortBy === 'name' ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('skill_type')}
                    className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                  >
                    <span>Тип</span>
                    <span className="text-xs">
                      {sortBy === 'skill_type' ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('skill_group_id')}
                    className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                  >
                    <span>Группа</span>
                    <span className="text-xs">
                      {sortBy === 'skill_group_id' ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  </button>
                </th>
                {/* Removed level column as levels are now per employee */}
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {paginatedSkills.map((skill, index) => (
                <tr key={skill.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSkills.has(skill.id)}
                      onChange={() => handleSelectSkill(skill.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {editingCell === `${skill.id}-name` ? (
                            <input
                              type="text"
                              defaultValue={skill.name}
                              className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              onBlur={(e) => {
                                handleInlineEdit(skill.id, 'name', e.target.value);
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleInlineEdit(skill.id, 'name', e.target.value);
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
                              onClick={() => setEditingCell(`${skill.id}-name`)}
                            >
                              {skill.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {editingCell === `${skill.id}-description` ? (
                            <input
                              type="text"
                              defaultValue={skill.description}
                              className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              onBlur={(e) => {
                                handleInlineEdit(skill.id, 'description', e.target.value);
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleInlineEdit(skill.id, 'description', e.target.value);
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
                              onClick={() => setEditingCell(`${skill.id}-description`)}
                            >
                              {skill.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${skill.id}-skill_type` ? (
                      <Select
                        value={skillTypes.find(t => t.value === skill.skill_type)}
                        onChange={(option) => handleInlineEdit(skill.id, 'skill_type', option.value)}
                        options={skillTypes}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(skill.skill_type)} cursor-pointer`}
                        onClick={() => setEditingCell(`${skill.id}-skill_type`)}
                      >
                        {skill.skill_type === 'hard' ? 'Хард скиллы' : 
                         skill.skill_type === 'soft' ? 'Софт скиллы' : 
                         skill.skill_type === 'hobby' ? 'Хобби' : 'Неизвестно'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${skill.id}-skill_group_id` ? (
                      <Select
                        value={groupOptions.find(g => {
                          try {
                            return g.value === (skill.skillGroup ? skill.skillGroup.id : skill.skill_group_id);
                          } catch (error) {
                            console.error('Error finding group:', error);
                            return false;
                          }
                        })}
                        onChange={option => handleInlineEdit(skill.id, 'skill_group_id', option.value)}
                        options={groupOptions.filter(g => {
                          try {
                            return g.value !== 'all' && g.type === skill.skill_type;
                          } catch (error) {
                            console.error('Error filtering groups:', error);
                            return false;
                          }
                        })}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${skill.id}-skill_group_id`)}
                      >
                        {skill.skillGroup ? skill.skillGroup.name : ''}
                      </span>
                    )}
                  </td>
                  {/* Removed level cell as levels are now per employee */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(skill)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(skill)}
                        className="text-green-600 hover:text-green-900"
                        title="Дублировать"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(skill.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Архивировать"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(skill.id)}
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

      {/* Пагинация */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={filteredSkills.length}
        />
      )}

      {/* Модальное окно добавления навыка */}
      <SkillModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSkill(null);
        }}
        onSubmit={async (skillData) => {
          try {
            if (editingSkill) {
              // Создаем объект только с измененными полями
              const updateData = {};
              
              if (skillData.changedFields?.has('name')) {
                updateData.name = skillData.name;
              }
              if (skillData.changedFields?.has('description')) {
                updateData.description = skillData.description;
              }
              if (skillData.changedFields?.has('type')) {
                updateData.type = skillData.type;
              }
              if (skillData.changedFields?.has('group')) {
                updateData.group = skillData.group;
              }
              
              // Обновляем только если есть изменения
              if (Object.keys(updateData).length > 0) {
                console.log('Обновляем поля навыка:', updateData);
                await api.updateSkill(editingSkill.id, updateData);
              } else {
                console.log('Поля навыка не изменились, пропускаем обновление');
              }
            } else {
              // Создание нового навыка
              await api.createSkill(skillData);
            }
            
            await loadSkills(); // Перезагружаем данные
            setShowAddModal(false);
            setEditingSkill(null);
          } catch (error) {
            console.error('Ошибка сохранения навыка:', error);
            showNotification('Ошибка сохранения навыка', 'error');
          }
        }}
        editingSkill={editingSkill}
        existingSkills={skills}
      />

      {/* Модальное окно добавления группы навыков */}
      <SkillGroupModal
        isOpen={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        onSubmit={handleCreateGroup}
        existingGroups={skillGroups.filter(g => g.value !== 'all')}
      />
    </div>
  );
} 