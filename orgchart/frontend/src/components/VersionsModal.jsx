import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, GitBranch, Plus, Edit, Trash2 } from 'lucide-react';
import Avatar from './ui/Avatar';

// Mock data for products
const mockProducts = [
  { id: 1, name: 'Корпоративный портал', type: 'service', status: 'final' },
  { id: 2, name: 'Мобильное приложение', type: 'service', status: 'development' },
  { id: 3, name: 'API Gateway', type: 'service', status: 'final' },
  { id: 4, name: 'Система аналитики', type: 'algorithm', status: 'beta' },
  { id: 5, name: 'Интеграция с CRM', type: 'service', status: 'mvp' },
  { id: 6, name: 'Микросервис авторизации', type: 'service', status: 'development' },
];

export default function VersionsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  versions = [],
  productName = '',
  currentProductId = null
}) {
  const [currentVersions, setCurrentVersions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize current versions when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentVersions([...versions]);
      setSearchQuery('');
    }
  }, [isOpen, versions]);

  // Filter products based on search query and exclude already added versions and current product
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockProducts
        .filter(prod => 
          prod.id !== currentProductId && 
          !currentVersions.find(v => v.productId === prod.id)
        )
        .slice(0, 5);
    }

    return mockProducts
      .filter(prod => 
        prod.id !== currentProductId &&
        !currentVersions.find(v => v.productId === prod.id) &&
        prod.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [searchQuery, currentVersions, currentProductId]);

  const handleAddVersion = (product) => {
    const newVersion = {
      productId: product.id,
      productName: product.name
    };
    
    setCurrentVersions([...currentVersions, newVersion]);
  };

  const handleRemoveVersion = (productId) => {
    setCurrentVersions(currentVersions.filter(v => v.productId !== productId));
  };

  const handleSave = () => {
    onSave(currentVersions);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            Управление версиями продукта
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

          {/* Текущие версии */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Текущие версии</h4>
            {currentVersions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Версии не добавлены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(currentVersions || []).map((version) => (
                  <div key={version.productId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray/20">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={version.author?.avatar}
                        name={version.author?.name || 'Unknown'}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium text-dark">{version.productName}</div>
                        <div className="text-sm text-gray-500">{version.author?.name || 'Unknown'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{version.date}</span>
                      <button
                        onClick={() => handleRemoveVersion(version.productId)}
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

          {/* Добавление новых версий */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Добавить версию</h4>
            
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
                  <div key={product.id} className="flex items-center justify-between p-3 border border-gray/20 rounded-[8px] hover:bg-gray/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={product.author?.avatar}
                        name={product.author?.name || 'Unknown'}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.type} • {product.status}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddVersion(product)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Добавить версию"
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