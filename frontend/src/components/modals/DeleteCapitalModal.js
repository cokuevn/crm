import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import Modal from '../common/Modal';

const DeleteCapitalModal = ({ isOpen, onClose, capital }) => {
  const { deleteCapital } = useApp();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!capital) return;

    setLoading(true);
    try {
      await deleteCapital(capital.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete capital:', error);
      alert('Ошибка при удалении капитала: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!capital) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Удалить капитал</h2>
            <p className="text-gray-600">Это действие нельзя отменить</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Вы собираетесь удалить капитал
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Капитал <strong>"{capital.name}"</strong> будет полностью удален вместе со всеми связанными данными:</p>
                  <ul className="list-disc ml-5 mt-2">
                    <li>Все клиенты этого капитала</li>
                    <li>История платежей</li>
                    <li>Аналитические данные</li>
                    <li>Расходы капитала</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={loading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Удалить навсегда
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteCapitalModal;