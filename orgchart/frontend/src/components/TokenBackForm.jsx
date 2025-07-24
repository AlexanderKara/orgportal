import React, { useState } from 'react';
import Button from './ui/Button';

export default function TokenBackForm({ token }) {
  const [description, setDescription] = useState(token?.description || '');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Здесь можно добавить onSend
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full justify-center items-center p-6">
      <h2 className="text-xl font-semibold text-dark text-center mb-6">Отправить токен</h2>
      <div className="flex-1 w-full space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Введите описание токена..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
            placeholder="Добавьте комментарий (необязательно)..."
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray/20 w-full justify-end">
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={loading || !description.trim()}
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </Button>
      </div>
    </div>
  );
} 