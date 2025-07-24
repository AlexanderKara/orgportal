import React, { useState } from 'react';
import { AlertTriangle, Shield, Search, Eye, X } from 'lucide-react';

const errorPages = [
  {
    id: 'access-denied',
    title: 'Доступ запрещен',
    icon: Shield,
    color: 'red',
    code: '403',
    description: 'У вас нет прав для доступа к этой странице. Обратитесь к администратору для получения необходимых разрешений.',
    path: '/error/access-denied'
  },
  {
    id: 'not-found',
    title: 'Страница не найдена',
    icon: Search,
    color: 'blue',
    code: '404',
    description: 'Запрашиваемая страница не существует. Проверьте правильность URL или вернитесь на главную страницу.',
    path: '/error/not-found'
  },
  {
    id: 'server-error',
    title: 'Ошибка сервера',
    icon: AlertTriangle,
    color: 'orange',
    code: '500',
    description: 'Произошла внутренняя ошибка сервера. Попробуйте обновить страницу или обратитесь в службу поддержки.',
    path: '/error/server-error'
  }
];

export default function ErrorPagesPreview() {
  const [selectedPage, setSelectedPage] = useState(null);

  const getColorClasses = (color) => {
    const colors = {
      red: 'bg-red-100 text-red-600',
      blue: 'bg-blue-100 text-blue-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color] || colors.red;
  };

  const openErrorPage = (page) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${page.path}`;
    window.open(fullUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  };

  const getPreviewContent = (page) => {
    const IconComponent = page.icon;
    
    return (
      <div className="min-h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex items-center justify-center">
        <div className="max-w-sm w-full bg-white rounded-xl shadow-lg p-6 text-center">
          {/* Иконка */}
          <div className={`mx-auto w-16 h-16 ${getColorClasses(page.color)} rounded-full flex items-center justify-center mb-4`}>
            <IconComponent className="w-8 h-8" />
          </div>

          {/* Заголовок */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {page.title}
          </h3>

          {/* Код ошибки */}
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <div className="text-xs text-gray-500 mb-1">Код ошибки</div>
            <div className="font-mono text-lg font-semibold text-gray-700">{page.code}</div>
          </div>

          {/* Описание */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {page.description}
          </p>

          {/* Кнопки */}
          <div className="mt-6 space-y-2">
            <button className="w-full bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Вернуться назад
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[15px] border border-gray/50 p-6 min-w-[300px]">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-[8px] bg-red-100 text-red-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-dark">Страницы ошибок</h2>
      </div>

      {/* Список страниц ошибок */}
      <div className="space-y-3">
        {errorPages.map((page) => (
          <div
            key={page.id}
            className={`p-3 rounded-[8px] cursor-pointer transition-all hover:bg-gray/10 ${
              selectedPage?.id === page.id 
                ? 'bg-primary/5' 
                : ''
            }`}
            onClick={() => setSelectedPage(page)}
          >
            <div className="flex items-center gap-3">
              <div className="text-gray-500">
                <page.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{page.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray/20 px-2 py-1 rounded-full">{page.code}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openErrorPage(page);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Открыть в новом окне"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Превью выбранной страницы */}
      {selectedPage && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark">
              Превью: {selectedPage.title}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openErrorPage(selectedPage)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                title="Открыть в новом окне"
              >
                <Eye className="w-3 h-3" />
                Открыть
              </button>
              <button
                onClick={() => setSelectedPage(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {getPreviewContent(selectedPage)}
        </div>
      )}
    </div>
  );
} 