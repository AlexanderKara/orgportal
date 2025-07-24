import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Link, Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import Avatar from './ui/Avatar';

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
};

const relationTypes = [
  { value: 'parent', label: 'Родительский' },
  { value: 'child', label: 'Дочерний' },
  { value: 'sibling', label: 'Равный' },
];

// Mock data for products
const mockProducts = [
  { id: 1, name: 'Корпоративный портал', type: 'service', status: 'final' },
  { id: 2, name: 'Мобильное приложение', type: 'service', status: 'development' },
  { id: 3, name: 'API Gateway', type: 'service', status: 'final' },
  { id: 4, name: 'Система аналитики', type: 'algorithm', status: 'beta' },
  { id: 5, name: 'Интеграция с CRM', type: 'service', status: 'mvp' },
  { id: 6, name: 'Микросервис авторизации', type: 'service', status: 'development' },
];

export default function RelatedProductsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  relatedProducts = [],
  productName = '',
  currentProductId = null
}) {
  const [currentRelatedProducts, setCurrentRelatedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize current related products when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentRelatedProducts([...relatedProducts]);
      setSearchQuery('');
    }
  }, [isOpen, relatedProducts]);

  // Filter products based on search query and exclude already added related products and current product
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockProducts
        .filter(prod => 
          prod.id !== currentProductId && 
          !currentRelatedProducts.find(r => r.productId === prod.id)
        )
        .slice(0, 5);
    }

    return mockProducts
      .filter(prod => 
        prod.id !== currentProductId &&
        !currentRelatedProducts.find(r => r.productId === prod.id) &&
        prod.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [searchQuery, currentRelatedProducts, currentProductId]);

  const handleAddRelatedProduct = (product, relationType) => {
    const newRelatedProduct = {
      productId: product.id,
      productName: product.name,
      relationType: relationType?.value || 'sibling'
    };
    
    setCurrentRelatedProducts([...currentRelatedProducts, newRelatedProduct]);
  };

  const handleRemoveRelatedProduct = (productId) => {
    setCurrentRelatedProducts(currentRelatedProducts.filter(p => p.productId !== productId));
  };

  const handleRelationTypeChange = (productId, newRelationType) => {
    setCurrentRelatedProducts(currentRelatedProducts.map(p => 
      p.productId === productId 
        ? { ...p, relationType: newRelationType?.value || 'sibling' }
        : p
    ));
  };

  const handleSave = () => {
    onSave(currentRelatedProducts);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            Управление связанными продуктами
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {productName && (
            <div className="mb-4 p-3 bg-gray/5 rounded-[8px]">
              <p className="text-sm text-gray-600">Продукт: <span className="font-medium text-dark">{productName}</span></p>
            </div>
          )}

          {/* Текущие связанные продукты */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Текущие связанные продукты</h4>
            {currentRelatedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Связанные продукты не добавлены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(currentRelatedProducts || []).map((related) => (
                  <div key={related.productId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray/20">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={related.logo}
                        name={related.name}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium text-dark">{related.name}</div>
                        <div className="text-sm text-gray-500">{related.type} • {related.status}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={relationTypes.find(r => r.value === related.relationType)}
                        onChange={(option) => handleRelationTypeChange(related.productId, option)}
                        options={relationTypes}
                        styles={customSelectStyles}
                        className="w-40"
                        placeholder="Тип связи"
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                      />
                      <button
                        onClick={() => handleRemoveRelatedProduct(related.productId)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Добавление новых связанных продуктов */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Добавить связанный продукт</h4>
            
            {/* Поиск */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск продуктов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Результаты поиска */}
            {filteredProducts.length > 0 && (
              <div className="space-y-2 mb-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray/20">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={product.logo}
                        name={product.name}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium text-dark">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.type} • {product.status}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddRelatedProduct(product, null)}
                      className="p-1 text-gray-400 hover:text-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && filteredProducts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>Продукты не найдены</p>
              </div>
            )}
          </div>
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 