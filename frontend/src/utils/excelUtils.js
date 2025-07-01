import * as XLSX from 'xlsx';
import { EXCEL_CONFIG, PAYMENT_STATUS } from '../constants/api';

/**
 * Format Excel date to YYYY-MM-DD format
 */
export const formatExcelDate = (excelDate) => {
  // Handle empty or null values
  if (!excelDate) {
    return new Date().toISOString().split('T')[0];
  }
  
  // Excel dates are stored as numbers (days since 1900-01-01)
  if (typeof excelDate === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(excelDate);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    } catch (error) {
      console.warn('Failed to parse Excel date number:', excelDate);
      return new Date().toISOString().split('T')[0];
    }
  }
  
  // If it's already a string, try to parse it
  if (typeof excelDate === 'string') {
    const trimmed = excelDate.trim();
    if (!trimmed) return new Date().toISOString().split('T')[0];
    
    // Try different date formats
    const formats = [
      // DD.MM.YYYY or DD/MM/YYYY
      /^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    ];
    
    // Try DD.MM.YYYY format first
    const ddmmyyyy = trimmed.match(formats[0]);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }
    
    // Try YYYY-MM-DD format
    const yyyymmdd = trimmed.match(formats[1]);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Try standard Date parsing
    try {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Failed to parse date string:', trimmed);
    }
  }
  
  // Fallback to current date
  console.warn('Using fallback date for:', excelDate);
  return new Date().toISOString().split('T')[0];
};

/**
 * Parse payment status from Excel
 */
export const parsePaymentStatus = (statusValue) => {
  if (!statusValue || !statusValue.toString().trim()) {
    return PAYMENT_STATUS.PENDING;
  }

  const originalStatus = statusValue.toString();
  const statusStr = originalStatus.toLowerCase().trim();
  
  console.log(`Parsing payment status: "${originalStatus}" -> "${statusStr}"`);
  
  // Check each status mapping
  for (const [key, value] of Object.entries(EXCEL_CONFIG.STATUS_MAPPING)) {
    if (statusStr.includes(key)) {
      console.log(`Final status: "${value}"`);
      return value;
    }
  }
  
  // If status not recognized, default to pending
  console.log(`Неизвестный статус платежа: "${originalStatus}"`);
  return PAYMENT_STATUS.PENDING;
};

/**
 * Parse Excel file and extract client data
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with proper mapping
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('Excel файл должен содержать заголовки и данные');
        }
        
        const mappedData = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.some(cell => cell && cell.toString().trim())) { // Skip empty rows
            
            // Extract basic client information
            const clientData = {
              name: row[1] || '', // ФИО клиента (столбец B)
              product: 'Товар не указан', // Товар отсутствует в структуре
              purchase_amount: parseFloat(row[2]) || 0, // Сумма покупки (столбец C)
              debt_amount: parseFloat(row[3]) || 0, // Долг (столбец D)
              monthly_payment: parseFloat(row[4]) || 0, // Ежемесячный взнос (столбец E)
              start_date: row[5] ? formatExcelDate(row[5]) : new Date().toISOString().split('T')[0], // Дата начала (столбец F)
              end_date: row[6] ? formatExcelDate(row[6]) : '', // Конец платежей (столбец G)
              schedule: []
            };
            
            // Extract payment schedule (Платеж 1, Статус 1, ... Платеж 24, Статус 24)
            // Starting from column 7 (index 7), pairs of payment date and status
            for (let j = 7; j < 55; j += 2) { // 7 to 54 (24 payments * 2 columns)
              const paymentDate = row[j];
              const paymentStatus = row[j + 1];
              
              if (paymentDate && paymentDate.toString().trim()) {
                const status = parsePaymentStatus(paymentStatus);
                
                clientData.schedule.push({
                  payment_date: formatExcelDate(paymentDate),
                  amount: clientData.monthly_payment,
                  status: status,
                  paid_date: status === PAYMENT_STATUS.PAID ? formatExcelDate(paymentDate) : null
                });
              }
            }
            
            // Extract additional client information (after payment columns)
            // ФИО Гаранта, Адрес клиента, Телефон клиента, Телефон гаранта
            const additionalInfoStartIndex = 55; // BD-BG columns
            clientData.guarantor_name = row[additionalInfoStartIndex] || '';
            clientData.client_address = row[additionalInfoStartIndex + 1] || '';
            clientData.client_phone = row[additionalInfoStartIndex + 2] || '';
            clientData.guarantor_phone = row[additionalInfoStartIndex + 3] || '';
            
            // Calculate months from schedule if not specified
            clientData.months = clientData.schedule.length > 0 ? clientData.schedule.length : 12;
            
            mappedData.push(clientData);
          }
        }
        
        resolve(mappedData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка при чтении файла'));
    };
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Поддерживаются только файлы Excel (.xlsx, .xls)'));
    }
  });
};