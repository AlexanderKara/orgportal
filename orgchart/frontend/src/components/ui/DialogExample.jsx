import React from 'react';
import ConfirmDialog from './ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

const DialogExample = () => {
  const { dialogState, openDialog, closeDialog } = useConfirmDialog();

  const examples = [
    {
      type: 'info',
      title: 'Информационный диалог',
      message: 'Информационное сообщение с корпоративным оранжевым цветом secondary (#FF8A15)',
      buttonText: 'Информация',
      confirmText: 'Понятно',
      className: 'bg-secondary hover:bg-secondary/90'
    },
    {
      type: 'warning',
      title: 'Диалог предупреждения',
      message: 'Предупреждающее сообщение с корпоративным оранжевым цветом secondary (#FF8A15)',
      buttonText: 'Предупреждение',
      confirmText: 'Продолжить',
      className: 'bg-secondary hover:bg-secondary/90'
    },
    {
      type: 'danger',
      title: 'Диалог опасного действия',
      message: 'Сообщение об опасном действии с корпоративным красным цветом primary (#E42E0F)',
      buttonText: 'Опасное действие',
      confirmText: 'Удалить',
      className: 'bg-primary hover:bg-primary/90'
    }
  ];

  return (
    <div className="p-6 bg-white rounded-[15px] shadow-sm border border-gray/20">
      <h3 className="text-xl font-bold font-accent text-dark mb-4">
        Примеры диалогов с корпоративными цветами
      </h3>
      
      <div className="grid gap-4">
        {examples.map((example) => (
          <div key={example.type} className="flex items-center justify-between p-4 bg-gray/10 rounded-[12px]">
            <div>
              <h4 className="font-medium text-dark mb-1">{example.title}</h4>
              <p className="text-sm text-dark/70">{example.message}</p>
            </div>
            <button
              onClick={() => openDialog({
                title: example.title,
                message: example.message,
                type: example.type,
                confirmText: example.confirmText,
                cancelText: 'Отмена'
              })}
              className={`px-4 py-2 text-white text-sm font-medium rounded-[8px] transition-colors ${example.className}`}
            >
              {example.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-dark/5 rounded-[12px]">
        <h4 className="font-medium text-dark mb-2">Корпоративные цвета:</h4>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span className="text-sm text-dark/70">Primary (#E42E0F)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-secondary rounded"></div>
            <span className="text-sm text-dark/70">Secondary (#FF8A15)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-dark rounded"></div>
            <span className="text-sm text-dark/70">Dark (#2D2D2D)</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
      />
    </div>
  );
};

export default DialogExample; 