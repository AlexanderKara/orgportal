import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { Upload, X, UserPlus, Link, GitBranch } from 'lucide-react';
import ParticipantsModal from './ParticipantsModal';
import RelatedProductsModal from './RelatedProductsModal';
import VersionsModal from './VersionsModal';
import { showNotification } from '../utils/notifications';
import api from '../services/api';

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
    zIndex: 99999,
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
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#FFE5CC',
    borderRadius: 6,
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#FF8A15',
    fontWeight: 500,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#FF8A15',
    '&:hover': {
      backgroundColor: '#FF8A15',
      color: '#fff',
    },
  }),
};

const productTypes = [
  { value: 'algorithm', label: 'Алгоритм' },
  { value: 'service', label: 'Сервис' },
  { value: 'device', label: 'Устройство' },
  { value: 'mission', label: 'Миссия' },
];

const productStatuses = [
  { value: 'planning', label: 'Проектирование' },
  { value: 'development', label: 'Разработка' },
  { value: 'testing', label: 'Тестирование' },
  { value: 'beta', label: 'Бета' },
  { value: 'mvp', label: 'MVP' },
  { value: 'final', label: 'Финал' },
  { value: 'archived', label: 'Архив' },
];

const participantRoles = [
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'developer', label: 'Разработчик' },
  { value: 'designer', label: 'Дизайнер' },
  { value: 'tester', label: 'Тестировщик' },
  { value: 'analyst', label: 'Аналитик' },
  { value: 'architect', label: 'Архитектор' },
  { value: 'devops', label: 'DevOps' },
];

const relationTypes = [
  { value: 'parent', label: 'Родительский' },
  { value: 'child', label: 'Дочерний' },
  { value: 'sibling', label: 'Равный' },
];

// Загрузка категорий из API
const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await api.getProductCategories();
        const categoriesData = response.categories || response.data || [];
        setCategories(categoriesData
          .filter(cat => cat.status === 'active')
          .map(cat => ({ value: cat.id.toString(), label: cat.name }))
        );
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, loading };
};

const mockEmployees = [
  { id: 1, name: 'Иван Петров', position: 'Frontend Developer' },
  { id: 2, name: 'Мария Сидорова', position: 'Product Manager' },
  { id: 3, name: 'Алексей Козлов', position: 'Backend Developer' },
  { id: 4, name: 'Елена Волкова', position: 'UI/UX Designer' },
  { id: 5, name: 'Дмитрий Смирнов', position: 'QA Engineer' },
];

const mockProducts = [
  { id: 1, name: 'Корпоративный портал' },
  { id: 2, name: 'Мобильное приложение' },
  { id: 3, name: 'API Gateway' },
  { id: 4, name: 'Система аналитики' },
];

export default function ProductModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingProduct = null,
  existingProducts = []
}) {
  const { categories, loading: categoriesLoading } = useCategories();
  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [productType, setProductType] = useState(null);
  const [productCategory, setProductCategory] = useState(null);
  const [productStatus, setProductStatus] = useState(null);
  const [createdAt, setCreatedAt] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [participants, setParticipants] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [versions, setVersions] = useState([]);
  const [nameError, setNameError] = useState('');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showRelatedProductsModal, setShowRelatedProductsModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const fileInputRef = useRef(null);

  // Reset form when modal opens/closes or editing product changes
  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setProductName(editingProduct.name || '');
        setShortDescription(editingProduct.shortDescription || '');
        setFullDescription(editingProduct.fullDescription || '');
        setProductType(productTypes.find(t => t.value === editingProduct.type));
        setProductCategory(categories.find(c => c.value === editingProduct.category));
        setProductStatus(productStatuses.find(s => s.value === editingProduct.status));
        setCreatedAt(editingProduct.createdAt || '');
        setLogoPreview(editingProduct.logo || '');
        setParticipants(editingProduct.participants || []);
        setRelatedProducts(editingProduct.relatedProducts || []);
        setVersions(editingProduct.versions || []);
      } else {
        setProductName('');
        setShortDescription('');
        setFullDescription('');
        setProductType(null);
        setProductCategory(null);
        setProductStatus(null);
        setCreatedAt('');
        setLogo(null);
        setLogoPreview('');
        setParticipants([]);
        setRelatedProducts([]);
        setVersions([]);
      }
      setNameError('');
    }
  }, [isOpen, editingProduct, categories]);

  const checkDuplicate = (name) => {
    if (!name.trim()) return false;
    
    return existingProducts.some(product => 
      product.id !== editingProduct?.id && 
      product.name.toLowerCase() === name.trim().toLowerCase()
    );
  };

  const handleNameBlur = () => {
    if (checkDuplicate(productName)) {
      setNameError('Продукт с таким названием уже существует');
    } else {
      setNameError('');
    }
  };

  const handleNameChange = (e) => {
    setProductName(e.target.value);
    if (nameError) {
      setNameError('');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    setLogo(null);
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddParticipant = (employee, role) => {
    const newParticipant = {
      employeeId: employee.id,
      employeeName: employee.name,
      employeePosition: employee.position,
      role: role
    };
    setParticipants([...participants, newParticipant]);
  };

  const handleRemoveParticipant = (employeeId) => {
    setParticipants(participants.filter(p => p.employeeId !== employeeId));
  };

  const handleParticipantsSave = (updatedParticipants) => {
    setParticipants(updatedParticipants);
  };

  const handleRelatedProductsSave = (updatedRelatedProducts) => {
    setRelatedProducts(updatedRelatedProducts);
  };

  const handleVersionsSave = (updatedVersions) => {
    setVersions(updatedVersions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!productName.trim() || !productType || !productCategory || !productStatus) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'info');
      return;
    }

    if (checkDuplicate(productName)) {
      setNameError('Продукт с таким названием уже существует');
      return;
    }

    onSubmit({
      name: productName.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      type: productType.value,
      category: productCategory.value,
      status: productStatus.value,
      createdAt: createdAt,
      logo: logoPreview,
      participants: participants,
      relatedProducts: relatedProducts,
      versions: versions
    });

    // Reset form
    setProductName('');
    setShortDescription('');
    setFullDescription('');
    setProductType(null);
    setProductCategory(null);
    setProductStatus(null);
    setCreatedAt('');
    setLogo(null);
    setLogoPreview('');
    setParticipants([]);
    setRelatedProducts([]);
    setVersions([]);
    setNameError('');
  };

  const handleCancel = () => {
    setProductName('');
    setShortDescription('');
    setFullDescription('');
    setProductType(null);
    setProductCategory(null);
    setProductStatus(null);
    setCreatedAt('');
    setLogo(null);
    setLogoPreview('');
    setParticipants([]);
    setRelatedProducts([]);
    setVersions([]);
    setNameError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {editingProduct ? 'Редактировать продукт' : 'Добавить продукт'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form id="product-form" className="space-y-4" onSubmit={handleSubmit}>
          {/* Логотип */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Логотип продукта</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border-2 border-dashed border-gray/20 rounded-[8px] flex items-center justify-center relative">
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleLogoRemove}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  {logoPreview ? 'Логотип загружен' : 'Нажмите для загрузки логотипа'}
                </p>
                <p className="text-xs text-gray-400">PNG, JPG до 2MB</p>
              </div>
            </div>
          </div>

          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название продукта *</label>
            <input
              type="text"
              value={productName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className={`w-full px-3 py-2 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary ${
                nameError ? 'border-red-500' : 'border-gray/20'
              }`}
              placeholder="Введите название продукта"
              required
            />
            {nameError && (
              <p className="text-red-500 text-sm mt-1">{nameError}</p>
            )}
          </div>

          {/* Краткое описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание *</label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Краткое описание продукта"
              rows={2}
              required
            />
          </div>

          {/* Полное описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Полное описание</label>
            <textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Подробное описание продукта"
              rows={4}
            />
          </div>

          {/* Тип продукта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип продукта *</label>
            <Select
              placeholder="Выберите тип"
              options={productTypes}
              styles={customSelectStyles}
              value={productType}
              onChange={setProductType}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
            <Select
              placeholder={categoriesLoading ? "Загрузка категорий..." : "Выберите категорию"}
              options={categories}
              styles={customSelectStyles}
              value={productCategory}
              onChange={setProductCategory}
              isLoading={categoriesLoading}
              isDisabled={categoriesLoading}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус *</label>
            <Select
              placeholder="Выберите статус"
              options={productStatuses}
              styles={customSelectStyles}
              value={productStatus}
              onChange={setProductStatus}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
              menuPosition="fixed"
            />
          </div>

          {/* Дата создания */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата создания</label>
            <input
              type="date"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Участники */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Участники</label>
            <div className="space-y-2">
              {(participants || []).map((participant) => (
                <div key={participant.employeeId} className="flex items-center justify-between p-2 bg-gray/5 rounded-[8px]">
                  <div>
                    <p className="text-sm font-medium">{participant.employeeName}</p>
                    <p className="text-xs text-gray-500">{participant.employeePosition}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {participantRoles.find(r => r.value === participant.role)?.label || 'Участник'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(participant.employeeId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowParticipantsModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Управление участниками
              </button>
            </div>
          </div>

          {/* Связанные продукты */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Связанные продукты</label>
            <div className="space-y-2">
              {(relatedProducts || []).map((related) => (
                <div key={related.productId} className="flex items-center justify-between p-2 bg-gray/5 rounded-[8px]">
                  <div>
                    <p className="text-sm font-medium">{related.productName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                      {relationTypes.find(r => r.value === related.relationType)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRelatedProduct(related.productId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowRelatedProductsModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
              >
                <Link className="w-4 h-4" />
                Добавить связанный продукт
              </button>
            </div>
          </div>

          {/* Версии продукта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Версии продукта</label>
            <div className="space-y-2">
              {(versions || []).map((version) => (
                <div key={version.productId} className="flex items-center justify-between p-2 bg-gray/5 rounded-[8px]">
                  <div>
                    <p className="text-sm font-medium">{version.productName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVersion(version.productId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowVersionsModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                Добавить версию
              </button>
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
              form="product-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {editingProduct ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно управления участниками */}
      <ParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        onSave={handleParticipantsSave}
        participants={participants}
        productName={productName}
      />

      {/* Модальное окно управления связанными продуктами */}
      <RelatedProductsModal
        isOpen={showRelatedProductsModal}
        onClose={() => setShowRelatedProductsModal(false)}
        onSave={handleRelatedProductsSave}
        relatedProducts={relatedProducts}
        productName={productName}
        currentProductId={editingProduct?.id}
      />

      {/* Модальное окно управления версиями */}
      <VersionsModal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        onSave={handleVersionsSave}
        versions={versions}
        productName={productName}
        currentProductId={editingProduct?.id}
      />
    </div>
  );
} 