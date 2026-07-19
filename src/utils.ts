import * as XLSX from 'xlsx';
import { ExcelFile, ExcelRecord } from './types';

// Simple unique ID generator
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Format file size
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Read and parse an Excel/CSV file using SheetJS (xlsx)
export async function parseExcelFile(file: File): Promise<ExcelFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const sheets = workbook.SheetNames;
        const activeSheet = sheets[0] || 'Sheet1';
        const worksheet = workbook.Sheets[activeSheet];
        
        // Parse rows as raw objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        // Extract headers from worksheet or first rows
        // SheetJS provides ref to find boundaries
        const headers: string[] = [];
        if (worksheet['!ref']) {
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
            const cell = worksheet[address];
            if (cell && cell.v) {
              headers.push(String(cell.v).trim());
            } else {
              headers.push(`Column_${C + 1}`);
            }
          }
        } else if (rawJson.length > 0) {
          headers.push(...Object.keys(rawJson[0]));
        } else {
          headers.push("Column 1", "Column 2");
        }

        // Clean headers (remove duplicates and empties)
        const cleanHeaders = headers.filter((h, idx) => h && headers.indexOf(h) === idx);

        // Map original rows, generating a safe local id
        const originalRows: ExcelRecord[] = rawJson.map((row, index) => {
          const cleanRow: ExcelRecord = { _id: `orig-${index}-${generateId()}` };
          cleanHeaders.forEach(header => {
            let val = row[header] !== undefined ? row[header] : "";
            // Handle date objects from SheetJS cellDates: true
            if (val instanceof Date) {
              val = val.toISOString().split('T')[0];
            }
            cleanRow[header] = val;
          });
          return cleanRow;
        });

        resolve({
          id: generateId(),
          name: file.name,
          size: file.size,
          headers: cleanHeaders,
          sheets,
          activeSheet,
          originalRows,
          newRows: [],
          uploadedAt: new Date().toLocaleString(),
        });
      } catch (err) {
        reject(new Error("Failed to parse file. Make sure it is a valid Excel or CSV spreadsheet."));
      }
    };
    reader.onerror = () => reject(new Error("File reading error."));
    reader.readAsArrayBuffer(file);
  });
}

// Determine form input types based on existing column values
export function detectFieldType(columnName: string, sampleRows: any[]): 'number' | 'date' | 'select' | 'text' {
  const values = sampleRows
    .map(row => row[columnName])
    .filter(val => val !== undefined && val !== null && val !== "");

  if (values.length === 0) {
    // Try column name matchers
    const lowerName = columnName.toLowerCase();
    if (lowerName.includes('date') || lowerName.includes('تاريخ')) return 'date';
    if (lowerName.includes('price') || lowerName.includes('سعر') || lowerName.includes('salary') || lowerName.includes('راتب') || lowerName.includes('qty') || lowerName.includes('كمية') || lowerName.includes('no') || lowerName.includes('رقم')) return 'number';
    return 'text';
  }

  // Check if dates
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isDate = values.every(val => {
    if (val instanceof Date) return true;
    if (typeof val === 'string' && dateRegex.test(val)) return true;
    if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.length > 6) return true;
    return false;
  });
  if (isDate) return 'date';

  // Check if numbers
  const isNumber = values.every(val => !isNaN(Number(val)));
  if (isNumber) return 'number';

  // Check if categorical (select option) - e.g. low cardinality
  const uniqueValues = Array.from(new Set(values));
  if (uniqueValues.length > 1 && uniqueValues.length <= 5 && values.length >= 5) {
    return 'select';
  }

  return 'text';
}

// Extract distinct values from a column to use as select options
export function getColumnOptions(columnName: string, sampleRows: any[]): string[] {
  const values = sampleRows
    .map(row => String(row[columnName] || '').trim())
    .filter(val => val !== "");
  return Array.from(new Set(values));
}

// Merge new rows into the workbook and download
export function exportExcelFile(excelFile: ExcelFile, format: 'xlsx' | 'csv'): { blob: Blob; filename: string } {
  // Combine original rows and new rows, and clean helper fields
  const allRows = [...excelFile.originalRows, ...excelFile.newRows].map(row => {
    const cleanRow = { ...row };
    delete cleanRow._id; // Remove temporary local ID
    return cleanRow;
  });

  // Create workspace worksheet
  const worksheet = XLSX.utils.json_to_sheet(allRows, { header: excelFile.headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, excelFile.activeSheet || 'Sheet1');

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([new TextEncoder().encode(csvContent)], { type: 'text/csv;charset=utf-8;' });
    const originalNameNoExt = excelFile.name.substring(0, excelFile.name.lastIndexOf('.')) || excelFile.name;
    return {
      blob,
      filename: `${originalNameNoExt}_updated.csv`
    };
  } else {
    // XLSX format
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const originalNameNoExt = excelFile.name.substring(0, excelFile.name.lastIndexOf('.')) || excelFile.name;
    return {
      blob,
      filename: `${originalNameNoExt}_updated.xlsx`
    };
  }
}

// Generate sample templates
export function getSampleTemplates(): ExcelFile[] {
  const templates: ExcelFile[] = [
    {
      id: 'template-sales',
      name: 'Sales_Register_Template.xlsx',
      size: 15420,
      headers: ['Invoice No', 'Customer Name', 'Date', 'Product', 'Quantity', 'Unit Price', 'Total Amount'],
      sheets: ['Sales'],
      activeSheet: 'Sales',
      uploadedAt: new Date().toLocaleString(),
      originalRows: [
        {
          _id: 'sales-init-1',
          'Invoice No': 'INV-1001',
          'Customer Name': 'أحمد الشمراني',
          'Date': '2026-07-15',
          'Product': 'شاحن ايفون لاسلكي',
          'Quantity': 3,
          'Unit Price': 120,
          'Total Amount': 360
        },
        {
          _id: 'sales-init-2',
          'Invoice No': 'INV-1002',
          'Customer Name': 'رنا العتيبي',
          'Date': '2026-07-16',
          'Product': 'حامل هاتف للسيارة',
          'Quantity': 1,
          'Unit Price': 85,
          'Total Amount': 85
        }
      ],
      newRows: []
    },
    {
      id: 'template-inventory',
      name: 'Inventory_Audit_Template.xlsx',
      size: 14850,
      headers: ['Item Code', 'Item Name', 'Category', 'Unit', 'In Stock', 'Storage Location', 'Audited By'],
      sheets: ['Inventory'],
      activeSheet: 'Inventory',
      uploadedAt: new Date().toLocaleString(),
      originalRows: [
        {
          _id: 'inv-init-1',
          'Item Code': 'SKU-5021',
          'Item Name': 'ماوس لاسلكي مريح',
          'Category': 'ملحقات حاسب',
          'Unit': 'قطعة',
          'In Stock': 24,
          'Storage Location': 'المستودع الرئيسي - رف أ3',
          'Audited By': 'محمد الغامدي'
        },
        {
          _id: 'inv-init-2',
          'Item Code': 'SKU-3091',
          'Item Name': 'سماعة رأس بلوتوث',
          'Category': 'ملحقات صوتية',
          'Unit': 'قطعة',
          'In Stock': 15,
          'Storage Location': 'مستودع العينات - رف ب1',
          'Audited By': 'إياد الصالح'
        }
      ],
      newRows: []
    },
    {
      id: 'template-students',
      name: 'Students_Attendance.xlsx',
      size: 16100,
      headers: ['Student ID', 'Student Name', 'Class/Grade', 'Date', 'Attendance Status', 'Notes'],
      sheets: ['Attendance'],
      activeSheet: 'Attendance',
      uploadedAt: new Date().toLocaleString(),
      originalRows: [
        {
          _id: 'std-init-1',
          'Student ID': 'STD-401',
          'Student Name': 'عبدالرحمن العسيري',
          'Class/Grade': 'الصف الثالث المتوسط',
          'Date': '2026-07-18',
          'Attendance Status': 'حاضر',
          'Notes': 'حضر مبكراً'
        },
        {
          _id: 'std-init-2',
          'Student ID': 'STD-402',
          'Student Name': 'خالد المطيري',
          'Class/Grade': 'الصف الثالث المتوسط',
          'Date': '2026-07-18',
          'Attendance Status': 'غائب',
          'Notes': 'بعذر طبي'
        }
      ],
      newRows: []
    }
  ];

  return templates;
}
