import { useNavigate } from 'react-router-dom';

export const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = (error) => {
    console.error('Error caught by useErrorHandler:', error);
    
    // Если это 500 ошибка, перенаправляем на страницу ошибки
    if (error && (error.status === 500 || error.isServerError)) {
      navigate('/error/server-error');
      return;
    }
    
    // Для других ошибок можно показать уведомление или обработать по-другому
    throw error;
  };

  return handleError;
}; 