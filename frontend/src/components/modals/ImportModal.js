import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { clientService } from '../../services/clientService';
import { parseExcelFile } from '../../utils/excelUtils';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const ImportModal = ({ isOpen, onClose, selectedCapital }) => {
  const { loadClients } = useApp();
  const [importData, setImportData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const parsedData = await parseExcelFile(file);
      setImportData(JSON.stringify(parsedData, null, 2));
    } catch (error) {
      console.error('File parsing error:', error);
      setError('Ошибка при чтении файла: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setError('Нет данных для импорта');
      return;
    }

    if (!selectedCapital) {
      setError('Выберите капитал');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const clients = JSON.parse(importData);
      const results = await clientService.bulkImport(clients, selectedCapital.id);
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        await loadClients(selectedCapital.id);
        
        if (errorCount === 0) {
          alert(`Успешно импортировано ${successCount} клиентов`);
          handleClose();
        } else {
          alert(`Импортировано ${successCount} клиентов. Ошибок: ${errorCount}`);
        }
      } else {
        setError('Не удалось импортировать ни одного клиента');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError('Ошибка при импорте: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImportData('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Импорт клиентов из Excel"
      size="xl"
    >
      <div className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите Excel файл
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Excel Structure Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-medium text-gray-900 mb-3">
            📊 Ожидаемая структура Excel файла:
          </h4>
          <div className="bg-gray-50 p-4 rounded-xl text-sm overflow-auto">
            <div className="mb-3">
              <h6 className="font-medium text-gray-800 mb-2">Обязательные столбцы:</h6>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-medium">A:</span> № клиента (не используется)</div>
                <div><span className="font-medium">B:</span> ФИО клиента <span className="text-red-500">*</span></div>
                <div><span className="font-medium">C:</span> Сумма покупки <span className="text-red-500">*</span></div>
                <div><span className="font-medium">D:</span> Долг клиента <span className="text-red-500">*</span></div>
                <div><span className="font-medium">E:</span> Ежемесячный взнос <span className="text-red-500">*</span></div>
                <div><span className="font-medium">F:</span> Дата начала <span className="text-red-500">*</span></div>
                <div><span className="font-medium">G:</span> Конец платежей <span className="text-red-500">*</span></div>
              </div>
            </div>
            
            <div className="mb-3">
              <h6 className="font-medium text-gray-800 mb-2">График платежей (столбцы H-BC):</h6>
              <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                <strong>H-I:</strong> Платеж 1, Статус 1 | <strong>J-K:</strong> Платеж 2, Статус 2 | ... | <strong>BB-BC:</strong> Платеж 24, Статус 24
                <br />
                <em>Статусы:</em> "Оплачен", "Просрочено", "Будущий" (или пусто)
              </div>
            </div>
            
            <div>
              <h6 className="font-medium text-gray-800 mb-2">Дополнительная информация:</h6>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-medium">BD:</span> ФИО Гаранта</div>
                <div><span className="font-medium">BE:</span> Адрес клиента</div>
                <div><span className="font-medium">BF:</span> Телефон клиента</div>
                <div><span className="font-medium">BG:</span> Телефон гаранта</div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h5 className="font-medium text-blue-800 mb-2">ℹ️ Важно:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Первая строка должна содержать данные (заголовки не нужны)</li>
            <li>• Обязательные поля: ФИО, товар, суммы, даты начала и конца</li>
            <li>• Платежи в формате: дата платежа, затем статус платежа</li>
            <li>• Статусы: "Оплачен", "Просрочено", "Будущий" (или пусто)</li>
            <li>• Даты в любом формате (ДД.ММ.ГГГГ, ГГГГ-ММ-ДД, Excel-даты)</li>
            <li>• Суммы указывайте числами без пробелов и символов</li>
          </ul>
        </div>

        {/* Data Preview */}
        {importData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Предпросмотр данных:
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
              placeholder="Данные из Excel появятся здесь..."
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!importData.trim() || loading}
            loading={loading}
          >
            {loading ? 'Импортируем...' : 'Импортировать'}
          </Button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;