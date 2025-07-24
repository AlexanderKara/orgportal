import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBlock({ title = 'Ошибка загрузки', message = 'Не удалось загрузить данные.', onRetry, showRetry = true }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-red-700 mb-2">{title}</h2>
      <div className="text-gray-600 mb-4">{message}</div>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Повторить
        </button>
      )}
    </div>
  );
} 