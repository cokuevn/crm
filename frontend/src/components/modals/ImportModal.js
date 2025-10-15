import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/apiClient';
import { API } from '../../lib/api';
import Modal from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import Button from '../ui/Button';

const ImportModal = ({ isOpen, onClose, selectedCapital, onClientsImported, onNotify }) => {
  const [importData, setImportData] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileInputRef] = useState(React.createRef());
  const { user } = useAuth();

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.json')) {
          setImportData(e.target.result);
        } else if (file.name.endsWith('.csv')) {
          const lines = e.target.result.split('\n');
          const headers = lines[0].split(',').map((h) => h.trim());
          const jsonData = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map((v) => v.trim());
              const obj = {};
              headers.forEach((header, index) => { obj[header] = values[index] || ''; });
              jsonData.push(obj);
            }
          }
          setImportData(JSON.stringify(jsonData, null, 2));
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonData.length < 2) { onNotify?.('warning', 'Пустой файл', 'Excel файл должен содержать заголовки и данные'); return; }
          const mapped = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.some((cell) => cell && cell.toString().trim())) {
              const clientData = {
                name: row[1] || '',
                product: 'Товар не указан',
                purchase_amount: parseFloat(row[2]) || 0,
                debt_amount: parseFloat(row[3]) || 0,
                monthly_payment: parseFloat(row[4]) || 0,
                start_date: row[5] ? formatExcelDate(row[5]) : new Date().toISOString().split('T')[0],
                end_date: row[6] ? formatExcelDate(row[6]) : '',
                schedule: [],
              };
              for (let j = 7; j < 55; j += 2) {
                const paymentDate = row[j];
                const paymentStatus = row[j + 1];
                if (paymentDate && paymentDate.toString().trim()) {
                  let status = 'pending';
                  if (paymentStatus && paymentStatus.toString().trim()) {
                    const statusStr = paymentStatus.toString().toLowerCase().trim();
                    if (statusStr.includes('оплачен') || statusStr.includes('paid') || statusStr.includes('выплачен')) status = 'paid';
                    else if (statusStr.includes('просроч')) status = 'overdue';
                  }
                  clientData.schedule.push({ payment_date: formatExcelDate(paymentDate), amount: clientData.monthly_payment, status, paid_date: status === 'paid' ? formatExcelDate(paymentDate) : null });
                }
              }
              const additionalInfoStartIndex = 55;
              clientData.guarantor_name = row[additionalInfoStartIndex] || '';
              clientData.client_address = row[additionalInfoStartIndex + 1] || '';
              clientData.client_phone = row[additionalInfoStartIndex + 2] || '';
              clientData.guarantor_phone = row[additionalInfoStartIndex + 3] || '';
              clientData.months = clientData.schedule.length > 0 ? clientData.schedule.length : 12;
              mapped.push(clientData);
            }
          }
          setImportData(JSON.stringify(mapped, null, 2));
        }
      } catch (err) {
        onNotify?.('error', 'Ошибка чтения файла', err.message);
      }
    };
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const formatExcelDate = (excelDate) => {
    if (!excelDate) return new Date().toISOString().split('T')[0];
    if (typeof excelDate === 'number') {
      try {
        const d = XLSX.SSF.parse_date_code(excelDate);
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      } catch (e) { return new Date().toISOString().split('T')[0]; }
    }
    if (typeof excelDate === 'string') {
      const t = excelDate.trim();
      if (!t) return new Date().toISOString().split('T')[0];
      const ddmmyyyy = t.match(/^(\d{1,2})[\.\/(\-)](\d{1,2})[\.\/(\-)](\d{4})$/);
      if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
      const yyyymmdd = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (yyyymmdd) return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`;
      const parsed = new Date(t);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleImport = async () => {
    if (!importData.trim()) { onNotify?.('warning', 'Нет данных', 'Выберите файл для импорта'); return; }
    if (!selectedCapital) { onNotify?.('warning', 'Капитал не выбран', 'Выберите капитал для импорта'); return; }
    setLoading(true);
    try {
      const clients = JSON.parse(importData);
      if (!Array.isArray(clients)) throw new Error('Данные должны быть массивом клиентов');
      let successCount = 0; let errorCount = 0; const errors = [];
      for (const clientData of clients) {
        try {
          const payload = { ...clientData, capital_id: selectedCapital.id, months: clientData.months || clientData.schedule?.length || 12 };
          const res = await apiClient.post(`/api/clients`, payload);
          if (res.status === 200 || res.status === 201) successCount++; else { errorCount++; errors.push(`Клиент ${clientData.name}: ${res.data.detail || 'неизвестная ошибка'}`); }
        } catch (err) {
          errorCount++; errors.push(`Клиент ${clientData.name}: ${err.response?.data?.detail || err.message}`);
        }
      }
      let message = `Добавлено: ${successCount}`;
      if (errorCount > 0) {
        message += `, ошибок: ${errorCount}`;
      }
      onNotify?.(errorCount ? 'warning' : 'success', 'Импорт завершен', message);
      onClientsImported?.();
      setImportData('');
      onClose();
    } catch (err) {
      onNotify?.('error', 'Ошибка импорта', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} containerClassName="max-w-6xl" contentClassName="p-6 max-h-[85vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Импорт клиентов в "{selectedCapital?.name}"</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Загрузить файл</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input ref={fileInputRef} type="file" accept=".json,.csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current.click()} className="text-blue-500 hover:text-blue-600 font-medium text-lg">📁 Выбрать файл</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Данные для импорта (JSON)</label>
              <textarea value={importData} onChange={(e) => setImportData(e.target.value)} className="w-full h-80 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm" placeholder="Выберите файл или вставьте JSON данные..." />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h5 className="font-medium text-blue-800 mb-2">ℹ️ Важно:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Первая строка должна содержать данные (заголовки не нужны)</li>
              <li>• Обязательные поля: ФИО, суммы, даты</li>
              <li>• Платежи: дата платежа, затем статус</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={handleImport} disabled={loading || !selectedCapital || !importData.trim()}>
            {loading ? (
              <span className="inline-flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /> Импортирование...</span>
            ) : (
              '📥 Импортировать'
            )}
          </Button>
        </div>
    </Modal>
  );
};

export default ImportModal;

