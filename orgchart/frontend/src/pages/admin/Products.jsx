import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, Filter, Plus, Edit, Trash2, 
  UserPlus, Building, Mail, Phone, Calendar,
  Download, Upload, Archive, Check, X
} from 'lucide-react';
import Select from 'react-select';
import Checkbox from '../../components/ui/Checkbox';
import api from '../../services/api';
import { showNotification } from '../utils/notifications';
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

const categories = [
  { value: 'all', label: 'Все категории' },
  { value: 'Веб-приложения', label: 'Веб-приложения' },
  { value: 'Мобильные приложения', label: 'Мобильные приложения' },
  { value: 'API', label: 'API' },
  { value: 'Интеграции', label: 'Интеграции' },
];

const statuses = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активный' },
  { value: 'development', label: 'В разработке' },
  { value: 'maintenance', label: 'Поддержка' },
  { value: 'archived', label: 'Архивный' },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);

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
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'team':
          aValue = a.team;
          bValue = b.team;
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
  }, [products, search, selectedCategory, selectedStatus, sortBy, sortDirection]);

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

  const handleExport = () => {
    const data = filteredProducts.map(product => ({
      'Название': product.name || '',
      'Описание': product.description || '',
      'Категория': product.category || '',
      'Статус': getStatusText(product.status) || '',
      'Команда': product.team || '',
      'URL': product.url || ''
    }));
    
    // Используем универсальную функцию экспорта в Excel
    exportData(data, 'products', 'excel', null, 'Продукты');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'development':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'development':
        return 'В разработке';
      case 'maintenance':
        return 'Поддержка';
      case 'archived':
        return 'Архивный';
      default:
        return 'Неизвестно';
    }
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
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Продукты</h1>
          <p className="text-gray-600">Управление продуктами и проектами</p>
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Добавить продукт
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего продуктов</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredProducts.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Активных</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredProducts.filter(p => p.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">В разработке</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredProducts.filter(p => p.status === 'development').length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Выбрано</span>
          </div>
          <div className="text-2xl font-bold text-dark">{selectedProducts.size}</div>
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
            placeholder="Категория"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categories}
            styles={customSelectStyles}
            className="w-40"
          />
          <Select
            placeholder="Статус"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statuses}
            styles={customSelectStyles}
            className="w-40"
          />
        </div>
      </div>

      {/* Таблица продуктов */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <Checkbox
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Продукт
                    {sortBy === 'name' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('category')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Категория
                    {sortBy === 'category' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Статус
                    {sortBy === 'status' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('team')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Команда
                    {sortBy === 'team' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
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
                              className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                              onClick={() => setEditingCell(`${product.id}-name`)}
                            >
                              {product.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {editingCell === `${product.id}-description` ? (
                            <input
                              type="text"
                              defaultValue={product.description}
                              className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              onBlur={(e) => {
                                handleInlineEdit(product.id, 'description', e.target.value);
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
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
                              className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                              onClick={() => setEditingCell(`${product.id}-description`)}
                            >
                              {product.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${product.id}-category` ? (
                      <Select
                        value={categories.find(c => c.value === product.category)}
                        onChange={(option) => handleInlineEdit(product.id, 'category', option.value)}
                        options={categories.filter(c => c.value !== 'all')}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${product.id}-category`)}
                      >
                        {product.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${product.id}-status` ? (
                      <Select
                        value={statuses.find(s => s.value === product.status)}
                        onChange={(option) => handleInlineEdit(product.id, 'status', option.value)}
                        options={statuses}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${product.id}-team` ? (
                      <input
                        type="text"
                        defaultValue={product.team}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(product.id, 'team', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(product.id, 'team', e.target.value);
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
                        onClick={() => setEditingCell(`${product.id}-team`)}
                      >
                        {product.team}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${product.id}-url` ? (
                      <input
                        type="url"
                        defaultValue={product.url}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(product.id, 'url', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(product.id, 'url', e.target.value);
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
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded text-blue-600 hover:text-blue-800"
                        onClick={() => setEditingCell(`${product.id}-url`)}
                      >
                        {product.url}
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

      {/* Модальное окно добавления продукта */}
      {showAddModal && (
        <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[15px] p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">
              {editingProduct ? 'Редактировать продукт' : 'Добавить продукт'}
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  type="text"
                  defaultValue={editingProduct?.name || ''}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Введите название продукта"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  defaultValue={editingProduct?.description || ''}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Описание продукта"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
                  <Select
                    placeholder="Выберите категорию"
                    options={categories.filter(c => c.value !== 'all')}
                    styles={customSelectStyles}
                    defaultValue={editingProduct ? categories.find(c => c.value === editingProduct.category) : null}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус *</label>
                  <Select
                    placeholder="Выберите статус"
                    options={statuses}
                    styles={customSelectStyles}
                    defaultValue={editingProduct ? statuses.find(s => s.value === editingProduct.status) : statuses[0]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Команда</label>
                  <input
                    type="text"
                    defaultValue={editingProduct?.team || ''}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Название команды"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    defaultValue={editingProduct?.url || ''}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
                >
                  {editingProduct ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 