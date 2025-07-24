import React from 'react';
import { Shield, Home, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Иконка */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Доступ запрещен
        </h1>

        {/* Описание */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          У вас нет прав для доступа к этой странице. 
          Обратитесь к администратору системы для получения необходимых разрешений.
        </p>

        {/* Код ошибки */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <div className="text-sm text-gray-500 mb-1">Код ошибки</div>
          <div className="font-mono text-lg font-semibold text-gray-700">403</div>
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться назад
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
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            <span>Требуется авторизация</span>
          </div>
        </div>
      </div>
    </div>
  );
} 