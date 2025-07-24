import { useState } from 'react';

export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    type: 'warning',
    onConfirm: () => {}
  });

  const openDialog = ({
    title = 'Подтверждение действия',
    message = 'Вы уверены, что хотите выполнить это действие?',
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    type = 'warning',
    onConfirm = () => {}
  }) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    dialogState,
    openDialog,
    closeDialog
  };
}; 