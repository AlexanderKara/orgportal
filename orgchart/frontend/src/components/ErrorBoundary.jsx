import React from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Если это 500 ошибка, перенаправляем на страницу ошибки
    if (error.status === 500) {
      this.props.navigate('/error/server-error');
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      // Если это 500 ошибка, показываем загрузку пока происходит перенаправление
      if (this.state.error?.status === 500) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Перенаправление на страницу ошибки...</p>
            </div>
          </div>
        );
      }

      // Для других ошибок показываем стандартную страницу ошибки
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <div className="text-red-600 text-4xl">⚠️</div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Произошла ошибка
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Что-то пошло не так. Попробуйте обновить страницу или вернуться на главную.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Обновить страницу
              </button>
              <button
                onClick={() => this.props.navigate('/')}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper компонент для использования с hooks
export default function ErrorBoundaryWrapper({ children }) {
  const navigate = useNavigate();
  return <ErrorBoundary navigate={navigate}>{children}</ErrorBoundary>;
} 