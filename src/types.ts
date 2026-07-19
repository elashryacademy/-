export interface ExcelRecord {
  _id: string;
  [key: string]: any;
}

export interface ExcelFile {
  id: string;
  name: string;
  size: number;
  headers: string[];
  sheets: string[];
  activeSheet: string;
  originalRows: ExcelRecord[];
  newRows: ExcelRecord[];
  uploadedAt: string;
}

export type Language = 'ar' | 'en';
