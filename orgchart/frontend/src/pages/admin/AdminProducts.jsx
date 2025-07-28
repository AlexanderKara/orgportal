import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, Filter, Plus, Edit, Trash2, 
  Download, Upload, Archive, Check, X, Copy, Users, Link, GitBranch, Eye, SortAsc, SortDesc
} from 'lucide-react';
import Select from 'react-select';
import ProductModal from '../../components/ProductModal';
import ParticipantsModal from '../../components/ParticipantsModal';
import RelatedProductsModal from '../../components/RelatedProductsModal';
import VersionsModal from '../../components/VersionsModal';
import Avatar from '../../components/ui/Avatar';
import Checkbox from '../../components/ui/Checkbox';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import { exportData, importFile } from '../../utils/exportUtils';

// Определения для фильтров
const productTypes = [
  { value: 'all', label: 'Все типы' },
  { value: 'algorithm', label: 'Алгоритм' },
  { value: 'service', label: 'Сервис' },
  { value: 'device', label: 'Устройство' },
  { value: 'mission', label: 'Миссия' },
];

const statuses = [
  { value: 'all', label: 'Все статусы' },
  { value: 'planning', label: 'Проектирование' },
  { value: 'development', label: 'Разработка' },
  { value: 'testing', label: 'Тестирование' },
  { value: 'beta', label: 'Бета' },
  { value: 'mvp', label: 'MVP' },
  { value: 'final', label: 'Финал' },
  { value: 'archived', label: 'Архив' },
];

const getCategories = () => {
  try {
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
      const categories = JSON.parse(savedCategories);
      return [
        { value: 'all', label: 'Все категории' },
        ...categories
          .filter(cat => cat.status === 'active')
          .map(cat => ({ value: cat.id.toString(), label: cat.name }))
      ];
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
  
  // Fallback to mock categories
  return [
    { value: 'all', label: 'Все категории' },
    { value: 'web-app', label: 'Веб-приложение' },
    { value: 'mobile-app', label: 'Мобильное приложение' },
    { value: 'api', label: 'API' },
    { value: 'integration', label: 'Интеграция' },
    { value: 'microservice', label: 'Микросервис' },
    { value: 'analytics', label: 'Аналитика' },
  ];
};

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

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showRelatedProductsModal, setShowRelatedProductsModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getProducts();
      // Ensure we have an array, handle both direct array and {data: array} responses
      const productsData = Array.isArray(response) ? response : (response.data || []);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация и сортировка продуктов
  const filteredProducts = useMemo(() => {
    // Ensure products is an array before spreading
    const productsArray = Array.isArray(products) ? products : [];
    let filtered = [...productsArray];

    if (search.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(search.trim().toLowerCase()))
      );
    }

    if (selectedType && selectedType.value !== 'all') {
      filtered = filtered.filter(product => product.type === selectedType.value);
    }

    if (selectedCategory && selectedCategory.value !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory.value);
    }

    if (selectedStatus && selectedStatus.value !== 'all') {
      filtered = filtered.filter(product => product.status === selectedStatus.value);
    }

    // Сортировка
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
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = a.created_at;
          bValue = b.created_at;
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
  }, [products, search, selectedType, selectedCategory, selectedStatus, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await api.deleteProduct(productId);
        await loadProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        showNotification('Ошибка при удалении продукта', 'error');
      }
    }
  };

  const handleDuplicate = (product) => {
    // Логика дублирования
  };

  const handleArchive = async (productId) => {
    if (window.confirm('Вы уверены, что хотите архивировать этот продукт?')) {
      try {
        await api.updateProduct(productId, { status: 'archived' });
        await loadProducts();
      } catch (err) {
        console.error('Error archiving product:', err);
        showNotification('Ошибка при архивировании продукта', 'error');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(product => product.id)));
    }
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleInlineEdit = (productId, field, value) => {
    // Логика инлайн редактирования
    setEditingCell(null);
  };

  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDateForExport = (dateString) => {
    if (!dateString || dateString === '') {
      return '';
    }
    
    try {
      // Если дата в формате ISO (2025-07-13T00:00:00.000Z)
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}.${month}.${year}`;
      }
      
      // Если дата в формате YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
      }
      
      // Если дата уже в формате DD.MM.YYYY
      if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateString)) {
        return dateString;
      }
      
      return dateString;
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return dateString;
    }
  };

  const handleExport = () => {
    const data = filteredProducts.map(product => ({
      'Название': product.name || '',
      'Описание': product.description || '',
      'Тип': getTypeText(product.type) || '',
      'Категория': getCategoryText(product.category) || '',
      'Статус': getStatusText(product.status) || '',
      'Дата создания': formatDateForExport(product.created_at)
    }));
    
    // Используем универсальную функцию экспорта в Excel
    exportData(data, 'admin-products', 'excel', null, 'Продукты');
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
          console.log('Imported data:', importedData);
          // Здесь можно добавить логику обработки импортированных данных
        } catch (error) {
          console.error('Ошибка импорта:', error);
          showNotification('Ошибка при импорте файла', 'error');
        }
      }
    };
    input.click();
  };

  const handleCreateProduct = async (productData) => {
    try {
      await api.createProduct(productData);
      setShowAddModal(false);
      await loadProducts();
    } catch (err) {
      console.error('Error creating product:', err);
      showNotification('Ошибка при создании продукта', 'error');
    }
  };

  const handleParticipantsSave = (updatedParticipants) => {
    // Логика сохранения участников
  };

  const handleParticipantsClick = (product) => {
    setCurrentProduct(product);
    setShowParticipantsModal(true);
  };

  const handleRelatedProductsClick = (product) => {
    setCurrentProduct(product);
    setShowRelatedProductsModal(true);
  };

  const handleVersionsClick = (product) => {
    setCurrentProduct(product);
    setShowVersionsModal(true);
  };

  const handleRelatedProductsSave = (updatedRelatedProducts) => {
    // Логика сохранения связанных продуктов
  };

  const handleVersionsSave = (updatedVersions) => {
    // Логика сохранения версий
  };

  const handleLogoUpload = (product) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          // Логика загрузки логотипа
          console.log('Logo uploaded:', base64);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'algorithm':
        return 'Алгоритм';
      case 'service':
        return 'Сервис';
      case 'device':
        return 'Устройство';
      case 'mission':
        return 'Миссия';
      default:
        return 'Неизвестно';
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 'web-app':
        return 'Веб-приложение';
      case 'mobile-app':
        return 'Мобильное приложение';
      case 'api':
        return 'API';
      case 'integration':
        return 'Интеграция';
      case 'microservice':
        return 'Микросервис';
      case 'analytics':
        return 'Аналитика';
      default:
        return category || 'Неизвестно';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'final':
        return 'Финальная версия';
      case 'development':
        return 'В разработке';
      case 'beta':
        return 'Бета версия';
      case 'mvp':
        return 'MVP';
      case 'archived':
        return 'Архивный';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'final':
        return 'bg-green-100 text-green-800';
      case 'development':
        return 'bg-blue-100 text-blue-800';
      case 'beta':
        return 'bg-yellow-100 text-yellow-800';
      case 'mvp':
        return 'bg-purple-100 text-purple-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'algorithm':
        return 'bg-purple-100 text-purple-800';
      case 'service':
        return 'bg-blue-100 text-blue-800';
      case 'device':
        return 'bg-green-100 text-green-800';
      case 'mission':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка продуктов...</div>
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
      {/* Заголовок с кнопками */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Управление продуктами</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Экспорт</span>
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden lg:inline">Импорт</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Добавить продукт</span>
          </button>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px]">
        <div className="flex-1 flex items-center w-full">
          <input
            type="text"
            placeholder="Поиск продуктов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-base"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select
            placeholder="Тип"
            options={productTypes}
            styles={customSelectStyles}
            value={selectedType}
            onChange={setSelectedType}
            isClearable
            className="w-full lg:w-32"
          />
          <Select
            placeholder="Категория"
            options={getCategories()}
            styles={customSelectStyles}
            value={selectedCategory}
            onChange={setSelectedCategory}
            isClearable
            className="w-full lg:w-40"
          />
          <Select
            placeholder="Статус"
            options={statuses}
            styles={customSelectStyles}
            value={selectedStatus}
            onChange={setSelectedStatus}
            isClearable
            className="w-full lg:w-40"
          />
        </div>
      </div>

      {/* Таблица продуктов */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray/5 border-b border-gray/20">
              <tr>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Логотип</th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray/10"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Название
                    {sortBy === 'name' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Краткое описание</th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray/10"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2">
                    Тип
                    {sortBy === 'type' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray/10"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-2">
                    Категория
                    {sortBy === 'category' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray/10"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Статус
                    {sortBy === 'status' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray/10"
                  onClick={() => handleSort('participants')}
                >
                  <div className="flex items-center gap-2">
                    Участники
                    {sortBy === 'participants' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Связи</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Версии</th>
                <th 
                  className="px-6 py-4 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray/10"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Дата создания
                    {sortBy === 'createdAt' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray/20">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray/5">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer hover:bg-gray/10"
                    onClick={() => handleLogoUpload(product)}
                    title="Загрузить логотип"
                  >
                    <Avatar
                      src={product.logo}
                      name={product.name}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${product.id}-name` ? (
                      <input
                        type="text"
                        defaultValue={product.name}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(product.id, 'name', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(product.id, 'name', e.target.value);
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
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded font-medium"
                        onClick={() => setEditingCell(`${product.id}-name`)}
                      >
                        {product.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingCell === `${product.id}-shortDescription` ? (
                      <textarea
                        defaultValue={product.description}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                        onBlur={(e) => {
                          handleInlineEdit(product.id, 'description', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            handleInlineEdit(product.id, 'description', e.target.value);
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
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded text-sm"
                        onClick={() => setEditingCell(`${product.id}-shortDescription`)}
                      >
                        {product.description}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${product.id}-type` ? (
                      <Select
                        value={productTypes.find(t => t.value === product.type)}
                        onChange={(option) => handleInlineEdit(product.id, 'type', option.value)}
                        options={productTypes.filter(t => t.value !== 'all')}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(product.type)} cursor-pointer`}
                        onClick={() => setEditingCell(`${product.id}-type`)}
                      >
                        {getTypeText(product.type)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${product.id}-category` ? (
                      <Select
                        value={getCategories().find(c => c.value === product.category)}
                        onChange={(option) => handleInlineEdit(product.id, 'category', option.value)}
                        options={getCategories().filter(c => c.value !== 'all')}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${product.id}-category`)}
                      >
                        {getCategoryText(product.category)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${product.id}-status` ? (
                      <Select
                        value={statuses.find(s => s.value === product.status)}
                        onChange={(option) => handleInlineEdit(product.id, 'status', option.value)}
                        options={statuses.filter(s => s.value !== 'all')}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)} cursor-pointer`}
                        onClick={() => setEditingCell(`${product.id}-status`)}
                      >
                        {getStatusText(product.status)}
                      </span>
                    )}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray/10"
                    onClick={() => handleParticipantsClick(product)}
                    title="Управление участниками"
                  >
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{product.participants?.length ?? 0}</span>
                      {(product.participants?.length ?? 0) > 0 && (
                        <div className="flex -space-x-1">
                          {(product.participants || []).slice(0, 3).map((participant, index) => (
                            <Avatar
                              key={participant.employeeId}
                              src={participant.avatar}
                              name={participant.employeeName}
                              size="xs"
                              className="border-2 border-white"
                              title={`${participant.employeeName} - ${participantRoles.find(r => r.value === participant.role)?.label}`}
                            />
                          ))}
                          {(product.participants?.length ?? 0) > 3 && (
                            <div className="w-6 h-6 bg-gray-300 text-gray-600 text-xs rounded-full flex items-center justify-center border-2 border-white">
                              +{(product.participants?.length ?? 0) - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray/10"
                    onClick={() => handleRelatedProductsClick(product)}
                    title="Управление связанными продуктами"
                  >
                    <div className="flex items-center gap-1">
                      <Link className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{product.relatedProducts?.length ?? 0}</span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray/10"
                    onClick={() => handleVersionsClick(product)}
                    title="Управление версиями"
                  >
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{product.versions?.length ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${product.id}-createdAt` ? (
                      <input
                        type="date"
                        defaultValue={product.created_at}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(product.id, 'created_at', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(product.id, 'created_at', e.target.value);
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
                        onClick={() => setEditingCell(`${product.id}-createdAt`)}
                      >
                        {formatDate(product.created_at)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="text-green-600 hover:text-green-900"
                        title="Дублировать"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(product.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Архивировать"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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

      {/* Модальное окно добавления/редактирования продукта */}
      <ProductModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateProduct}
        editingProduct={editingProduct}
        existingProducts={products} // Pass the current products state
      />

      {/* Модальное окно управления участниками */}
      <ParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => {
          setShowParticipantsModal(false);
          setCurrentProduct(null);
        }}
        onSave={handleParticipantsSave}
        participants={currentProduct?.participants || []}
        productName={currentProduct?.name || ''}
      />

      {/* Модальное окно управления связанными продуктами */}
      <RelatedProductsModal
        isOpen={showRelatedProductsModal}
        onClose={() => {
          setShowRelatedProductsModal(false);
          setCurrentProduct(null);
        }}
        onSave={handleRelatedProductsSave}
        relatedProducts={currentProduct?.relatedProducts || []}
        productName={currentProduct?.name || ''}
        currentProductId={currentProduct?.id}
      />

      {/* Модальное окно управления версиями */}
      <VersionsModal
        isOpen={showVersionsModal}
        onClose={() => {
          setShowVersionsModal(false);
          setCurrentProduct(null);
        }}
        onSave={handleVersionsSave}
        versions={currentProduct?.versions || []}
        productName={currentProduct?.name || ''}
        currentProductId={currentProduct?.id}
      />
    </div>
  );
} 