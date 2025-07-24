import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ServerError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Иконка */}
        <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-orange-600" />
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ошибка сервера
        </h1>

        {/* Описание */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Произошла внутренняя ошибка сервера. 
          Наша команда уже работает над решением проблемы.
        </p>

        {/* Код ошибки */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <div className="text-sm text-gray-500 mb-1">Код ошибки</div>
          <div className="font-mono text-lg font-semibold text-gray-700">500</div>
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить страницу
          </button>

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            На главную
          </Link>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Если проблема повторяется, обратитесь в службу поддержки
          </div>
        </div>
      </div>
    </div>
  );
} 