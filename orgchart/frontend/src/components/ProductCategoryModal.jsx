import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Edit, Archive, Trash2, Check, X as XIcon } from 'lucide-react';
import api from '../services/api';
import { showNotification } from '../utils/notifications';

// Загружаем категории из API
const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await api.getProductCategories();
        setCategories(response.categories || []);
      } catch (error) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, loading, setCategories };
};

export default function ProductCategoryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onArchive,
  onDelete,
  editingCategory = null,
  existingCategories
}) {
  const { categories, loading, setCategories } = useCategories();
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [nameError, setNameError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEditingId(null);
      setEditingName('');
      setShowAddForm(false);
      setNewCategoryName('');
      setNameError('');
    }
  }, [isOpen]);

  const checkDuplicate = (name, excludeId = null) => {
    if (!name.trim()) return false;
    
    return categories.some(category => 
      category.id !== excludeId && 
      category.name.toLowerCase() === name.trim().toLowerCase()
    );
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setNameError('');
  };

  const handleSaveEdit = () => {
    if (!editingName.trim()) {
      showNotification('Пожалуйста, введите название категории', 'info');
      return;
    }

    if (checkDuplicate(editingName, editingId)) {
      setNameError('Категория с таким названием уже существует');
      return;
    }

    const updatedCategories = categories.map(cat => 
      cat.id === editingId 
        ? { ...cat, name: editingName.trim() }
        : cat
    );
    
    setCategories(updatedCategories);
    onSubmit(updatedCategories); // Передаем обновленные данные
    
    setEditingId(null);
    setEditingName('');
    setNameError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setNameError('');
  };

  const handleArchive = (categoryId) => {
    const updatedCategories = categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, status: cat.status === 'archived' ? 'active' : 'archived' }
        : cat
    );
    setCategories(updatedCategories);
    onSubmit(updatedCategories); // Передаем обновленные данные
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      setCategories(updatedCategories);
      onSubmit(updatedCategories); // Передаем обновленные данные
    }
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setNewCategoryName('');
    setNameError('');
  };

  const handleSaveNew = () => {
    if (!newCategoryName.trim()) {
      showNotification('Пожалуйста, введите название категории', 'info');
      return;
    }

    if (checkDuplicate(newCategoryName)) {
      setNameError('Категория с таким названием уже существует');
      return;
    }

    const newCategory = {
      id: Date.now(),
      name: newCategoryName.trim(),
      status: 'active'
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    onSubmit(updatedCategories); // Передаем обновленные данные
    
    setShowAddForm(false);
    setNewCategoryName('');
    setNameError('');
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewCategoryName('');
    setNameError('');
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (editingId) {
      setEditingName(value);
    } else {
      setNewCategoryName(value);
    }
    // Clear error when user starts typing
    if (nameError) {
      setNameError('');
    }
  };

  const handleNameBlur = () => {
    const currentName = editingId ? editingName : newCategoryName;
    const excludeId = editingId;
    
    if (checkDuplicate(currentName, excludeId)) {
      setNameError('Категория с таким названием уже существует');
    } else {
      setNameError('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Активная';
      case 'archived': return 'Архивная';
      default: return 'Неизвестно';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[15px] w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">Управление категориями</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Показываем загрузку */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Загрузка категорий...</p>
              </div>
            </div>
          )}

          {/* Показываем основной контент только если данные загружены */}
          {!loading && (
          <>
          {/* Список категорий */}
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-gray/5 rounded-[8px] border border-gray/20">
                {editingId === category.id ? (
                  // Режим редактирования
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="text"
                      value={editingName}
                      onChange={handleNameChange}
                      onBlur={handleNameBlur}
                      className={`flex-1 px-3 py-2 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary ${
                        nameError ? 'border-red-500' : 'border-gray/20'
                      }`}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-[8px] transition-colors"
                      title="Сохранить"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
                      title="Отмена"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  // Обычный режим просмотра
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(category.status)}`}>
                          {getStatusText(category.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-[8px] transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(category.id)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-[8px] transition-colors"
                        title={category.status === 'archived' ? 'Активировать' : 'Архивировать'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-[8px] transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Форма добавления новой категории */}
            {showAddForm && (
              <div className="flex items-center gap-3 p-3 bg-blue/5 rounded-[8px] border border-blue/20">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  className={`flex-1 px-3 py-2 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary ${
                    nameError ? 'border-red-500' : 'border-gray/20'
                  }`}
                  placeholder="Введите название новой категории"
                  autoFocus
                />
                <button
                  onClick={handleSaveNew}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-[8px] transition-colors"
                  title="Добавить"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
                  title="Отмена"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Кнопка добавления */}
            {!showAddForm && (
              <button
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray/30 rounded-[8px] text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Добавить категорию</span>
              </button>
            )}

            {/* Сообщение об ошибке */}
            {nameError && (
              <p className="text-red-500 text-sm mt-2">{nameError}</p>
            )}
          </div>
          </>
          )}
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
} 