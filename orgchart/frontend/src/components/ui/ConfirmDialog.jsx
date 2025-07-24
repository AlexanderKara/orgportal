import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Подтверждение действия',
  message = 'Вы уверены, что хотите выполнить это действие?',
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          confirmButton: 'bg-primary hover:bg-primary/90 text-white'
        };
      case 'info':
        return {
          iconColor: 'text-secondary',
          iconBg: 'bg-secondary/10',
          confirmButton: 'bg-secondary hover:bg-secondary/90 text-white'
        };
      default: // warning
        return {
          iconColor: 'text-secondary',
          iconBg: 'bg-secondary/10',
          confirmButton: 'bg-secondary hover:bg-secondary/90 text-white'
        };
    }
  };

  const styles = getTypeStyles();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-[15px] shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-300 border border-gray/10">
        {/* Заголовок с иконкой и кнопкой закрытия */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-[12px] ${styles.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold font-accent text-dark leading-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-dark transition-all duration-200 p-1 rounded-[6px] hover:bg-gray/20 flex-shrink-0 ml-2 hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Сообщение */}
        <div className="mb-8 ml-16">
          <p className="text-dark/70 leading-relaxed text-base">{message}</p>
        </div>

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-dark bg-white border border-gray/30 rounded-[8px] hover:bg-gray/10 transition-all duration-200 hover:border-gray/50 hover:shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-sm font-medium rounded-[8px] transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 