import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Экспорт данных в Excel формат
 * @param {Array} data - массив объектов для экспорта
 * @param {string} filename - имя файла без расширения
 * @param {Array} sheets - массив объектов с данными для разных листов
 * @param {string} sheetName - имя основного листа
 */
export const exportToExcel = (data, filename, sheets = null, sheetName = 'Данные') => {
  const workbook = XLSX.utils.book_new();
  
  if (sheets) {
    // Множественные листы
    sheets.forEach(sheet => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });
  } else {
    // Один лист
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  
  // Настройка ширины колонок
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let col = range.s.c; col <= range.e.c; col++) {
    const colLetter = XLSX.utils.encode_col(col);
    worksheet[`${colLetter}1`] = { 
      ...worksheet[`${colLetter}1`], 
      s: { font: { bold: true } } 
    };
  }
  
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array' 
  });
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Экспорт данных в CSV формат
 * @param {Array} data - массив объектов для экспорта
 * @param {string} filename - имя файла без расширения
 * @param {string} delimiter - разделитель (по умолчанию ';')
 */
export const exportToCSV = (data, filename, delimiter = ';') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(delimiter),
    ...data.map(row => 
      headers.map(header => {
        const value = String(row[header] || '');
        // Экранируем кавычки и заключаем в кавычки если есть разделитель, кавычки или перенос строки
        if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(delimiter)
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Универсальная функция экспорта с выбором формата
 * @param {Array} data - массив объектов для экспорта
 * @param {string} filename - имя файла без расширения
 * @param {string} format - формат ('excel' или 'csv')
 * @param {Array} sheets - массив объектов с данными для разных листов (только для Excel)
 * @param {string} sheetName - имя основного листа
 */
export const exportData = (data, filename, format = 'excel', sheets = null, sheetName = 'Данные') => {
  if (format === 'excel') {
    exportToExcel(data, filename, sheets, sheetName);
  } else {
    exportToCSV(data, filename);
  }
};

/**
 * Парсинг Excel файла
 * @param {File} file - файл для парсинга
 * @returns {Promise<Array>} - массив объектов с данными
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('Файл должен содержать заголовки и хотя бы одну строку данных'));
          return;
        }
        
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        
        const result = rows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            if (header) {
              obj[header] = row[index] || '';
            }
          });
          return obj;
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Парсинг CSV файла
 * @param {string} csvData - содержимое CSV файла
 * @param {string} delimiter - разделитель (по умолчанию ';')
 * @returns {Array} - массив объектов с данными
 */
export const parseCSV = (csvData, delimiter = ';') => {
  const lines = csvData.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('Файл должен содержать заголовки и хотя бы одну строку данных');
  }
  
  // Определяем разделитель автоматически
  const firstLine = lines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const actualDelimiter = semicolonCount > 0 ? ';' : ',';
  
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === actualDelimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };
  
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        obj[header] = values[index] || '';
      }
    });
    return obj;
  });
  
  return rows;
};

/**
 * Универсальная функция импорта файла
 * @param {File} file - файл для импорта
 * @returns {Promise<Array>} - массив объектов с данными
 */
export const importFile = (file) => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'xlsx' || extension === 'xls') {
      parseExcelFile(file).then(resolve).catch(reject);
    } else if (extension === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = parseCSV(e.target.result);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file, 'utf-8');
    } else {
      reject(new Error('Неподдерживаемый формат файла. Используйте .xlsx, .xls или .csv'));
    }
  });
}; 