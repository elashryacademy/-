import React, { useState } from 'react';
import { Search, Edit, Trash2, Calendar, FileSpreadsheet, Eye, X, Check, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExcelFile, ExcelRecord, Language } from '../types';

interface RecordListProps {
  activeFile: ExcelFile | null;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (record: ExcelRecord) => void;
  language: Language;
  onNavigateToForm: () => void;
}

export default function RecordList({
  activeFile,
  onDeleteRecord,
  onUpdateRecord,
  language,
  onNavigateToForm,
}: RecordListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'original'>('new');
  const [editingRecord, setEditingRecord] = useState<ExcelRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});

  const t = {
    ar: {
      title: "مراجعة الصفوف والبيانات",
      newRowsTab: "اللي ضفته النهاردة",
      originalTab: "البيانات الأصلية للشيت",
      searchPlaceholder: "دور في الصفوف والبيانات...",
      noFileTitle: "مفيش شيت متحدد",
      noFileDesc: "ارفع ملف إكسل أو اختار شيت علشان تعرض البيانات اللي جواه وتراجعها.",
      noRecordsTitle: "لسه مضافش أي صفوف النهاردة",
      noRecordsDesc: "ابدأ بتعبئة فورم الإدخال وهتلاقي كل الصفوف اللي ضفتها ظهرت هنا علطول علشان تعدلها أو تمسحها قبل ما تنزل الملف النهائي.",
      goToFormBtn: "إدخال صف جديد",
      deleteConfirm: "عايز تمسح الصف ده؟",
      editTitle: "تعديل بيانات الصف",
      saveBtn: "حفظ التعديل",
      cancelBtn: "إلغاء",
      totalCount: "العدد الكلي:",
      emptySearchResults: "مفيش بيانات مطابقة للبحث بتاعك.",
      originalBadge: "أصلي من الشيت",
      newBadge: "مضاف جديد",
    },
    en: {
      title: "Review Records",
      newRowsTab: "New Entries Today",
      originalTab: "Original Rows",
      searchPlaceholder: "Search records...",
      noFileTitle: "No File Selected",
      noFileDesc: "Please load or select a spreadsheet file to review records.",
      noRecordsTitle: "No records added today",
      noRecordsDesc: "Start entering data and your entries will appear here for auditing and editing.",
      goToFormBtn: "Enter New Record",
      deleteConfirm: "Delete record?",
      editTitle: "Edit Record",
      saveBtn: "Save Changes",
      cancelBtn: "Cancel",
      totalCount: "Total:",
      emptySearchResults: "No records match your search.",
      originalBadge: "Original",
      newBadge: "Newly Added",
    }
  }[language];

  if (!activeFile) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8 text-center bg-slate-50">
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">{t.noFileTitle}</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{t.noFileDesc}</p>
        </div>
      </div>
    );
  }

  // Choose rows based on active tab
  const rowsToDisplay = activeTab === 'new' ? activeFile.newRows : activeFile.originalRows;

  // Filter rows based on search
  const filteredRows = rowsToDisplay.filter((row) => {
    return activeFile.headers.some((header) => {
      const value = row[header];
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const startEdit = (record: ExcelRecord) => {
    setEditingRecord(record);
    const initialData: Record<string, string> = {};
    activeFile.headers.forEach((header) => {
      initialData[header] = String(record[header] || '');
    });
    setEditFormData(initialData);
  };

  const handleEditChange = (header: string, val: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [header]: val,
    }));
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    // Smart calculate total if qty and price exist and are numbers on Edit save
    const qtyHeader = activeFile.headers.find(h => h.toLowerCase().includes('qty') || h.toLowerCase().includes('quantity') || h.toLowerCase().includes('كمية'));
    const priceHeader = activeFile.headers.find(h => h.toLowerCase().includes('price') || h.toLowerCase().includes('سعر') || h.toLowerCase().includes('unit'));
    const totalHeader = activeFile.headers.find(h => h.toLowerCase().includes('total') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('إجمالي'));
    
    let finalEditFormData = { ...editFormData };
    if (qtyHeader && priceHeader && totalHeader) {
      const q = parseFloat(editFormData[qtyHeader]);
      const p = parseFloat(editFormData[priceHeader]);
      if (!isNaN(q) && !isNaN(p)) {
        finalEditFormData[totalHeader] = String(q * p);
      }
    }

    const updatedRecord: ExcelRecord = {
      ...editingRecord,
      ...finalEditFormData,
    };

    onUpdateRecord(updatedRecord);
    setEditingRecord(null);
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50 overflow-hidden relative">
      {/* Search & Tabs Header */}
      <div className="bg-white border-b border-slate-200/80 p-4 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">{t.title}</h2>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
            {t.totalCount} {rowsToDisplay.length}
          </span>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('new');
              setSearchTerm('');
            }}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'new'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-new-rows"
          >
            {t.newRowsTab} ({activeFile.newRows.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('original');
              setSearchTerm('');
            }}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'original'
                ? 'bg-white text-slate-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-original-rows"
          >
            {t.originalTab} ({activeFile.originalRows.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
            id="search-records-input"
          />
        </div>
      </div>

      {/* Rows Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRows.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center py-12">
            {searchTerm ? (
              <p className="text-xs text-slate-500">{t.emptySearchResults}</p>
            ) : activeTab === 'new' ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-3 border border-emerald-100">
                  <FileDown size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{t.noRecordsTitle}</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs leading-relaxed">{t.noRecordsDesc}</p>
                <button
                  onClick={onNavigateToForm}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
                  id="go-to-form-btn"
                >
                  {t.goToFormBtn}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">لا توجد صفوف أصلية متوفرة في هذه الورقة.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((row) => (
              <motion.div
                key={row._id}
                layout
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-colors"
                id={`record-card-${row._id}`}
              >
                {/* Meta details */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5 mb-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    activeTab === 'new' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {activeTab === 'new' ? t.newBadge : t.originalBadge}
                  </span>

                  {/* Actions (Only editable for newly added rows to keep audit trail solid) */}
                  {activeTab === 'new' && (
                    <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(row)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                        title={t.editTitle}
                        id={`edit-btn-${row._id}`}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(row._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title={t.deleteConfirm}
                        id={`delete-btn-${row._id}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid values */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  {activeFile.headers.map((header) => (
                    <div key={header} className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium truncate">
                        {header}
                      </span>
                      <span className="text-slate-800 font-semibold break-words block mt-0.5">
                        {row[header] !== undefined && row[header] !== "" ? String(row[header]) : <span className="text-slate-300 italic">-</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Record Modal Overlay */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setEditingRecord(null)}
            />

            {/* Modal content sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] md:max-h-[75vh]"
              id="edit-record-modal"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Edit size={14} className="text-emerald-600" />
                  <span>{t.editTitle}</span>
                </h3>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  id="close-edit-modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable form fields */}
              <form onSubmit={saveEdit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {activeFile.headers.map((header) => (
                  <div key={header} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">
                      {header}
                    </label>
                    <input
                      type="text"
                      value={editFormData[header] || ""}
                      onChange={(e) => handleEditChange(header, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-colors"
                      id={`edit-input-${header.replace(/\s+/g, '-')}`}
                    />
                  </div>
                ))}

                {/* Footer buttons stick in modal */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl text-xs text-center cursor-pointer transition-colors"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                    id="save-edit-record"
                  >
                    <Check size={14} />
                    <span>{t.saveBtn}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
