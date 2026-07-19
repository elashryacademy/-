import React, { useState, useEffect } from 'react';
import { PlusCircle, HelpCircle, RefreshCw, FileSpreadsheet, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExcelFile, ExcelRecord, Language } from '../types';
import { detectFieldType, getColumnOptions, generateId } from '../utils';

interface DynamicFormProps {
  activeFile: ExcelFile | null;
  onAddRecord: (record: ExcelRecord) => void;
  language: Language;
  onNavigateToFiles: () => void;
}

export default function DynamicForm({
  activeFile,
  onAddRecord,
  language,
  onNavigateToFiles,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldTypes, setFieldTypes] = useState<Record<string, 'number' | 'date' | 'select' | 'text'>>({});
  const [fieldOptions, setFieldOptions] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [stickyFields, setStickyFields] = useState<Record<string, boolean>>({});

  const t = {
    ar: {
      noFileTitle: "مفيش شيت نشط حالياً",
      noFileDesc: "اختار شيت من قائمة الملفات أو ارفع واحد جديد علشان نولدلك فورم الإدخال دي تلقائياً.",
      selectFileBtn: "عرض ملفات الإكسل",
      formTitle: "إدخال بيانات جديدة",
      formSubtitle: "اكتب البيانات في الخانات دي وهتتضاف علطول في ملف الإكسل",
      submitBtn: "إضافة البيانات دي للشيت",
      successMsg: "البيانات اتضافت بنجاح!",
      stickyLabel: "ثبّت القيمة دي للصف الجاي",
      smartFill: "تعبئة تلقائية ذكية",
      smartFillTooltip: "توليد بيانات تجريبية متناسقة علشان تجرب الشغل بسرعة",
      placeholderSelect: "اختار من هنا...",
      activeSheet: "الشيت الشغال:",
    },
    en: {
      noFileTitle: "No Active File Selected",
      noFileDesc: "Please select a file from the files tab or upload a new one to automatically generate the data entry form.",
      selectFileBtn: "Select File",
      formTitle: "New Data Entry",
      formSubtitle: "Fill in the fields to append to the active spreadsheet",
      submitBtn: "Add Record to File",
      successMsg: "Record added successfully!",
      stickyLabel: "Keep value for next record",
      smartFill: "Quick Autofill",
      smartFillTooltip: "Generates smart contextual dummy data for easy testing",
      placeholderSelect: "Choose option...",
      activeSheet: "Active Sheet:",
    }
  }[language];

  // Analyze columns and build fields whenever the active file changes
  useEffect(() => {
    if (!activeFile) return;

    const detectedTypes: Record<string, 'number' | 'date' | 'select' | 'text'> = {};
    const options: Record<string, string[]> = {};
    const initialForm: Record<string, string> = {};

    const allSampleRows = [...activeFile.originalRows, ...activeFile.newRows];

    activeFile.headers.forEach(header => {
      const type = detectFieldType(header, allSampleRows);
      detectedTypes[header] = type;

      if (type === 'select') {
        options[header] = getColumnOptions(header, allSampleRows);
      }

      // Initialize form values. Keep existing sticky values if present
      initialForm[header] = stickyFields[header] ? (formData[header] || "") : "";
    });

    setFieldTypes(detectedTypes);
    setFieldOptions(options);
    setFormData(initialForm);
  }, [activeFile]);

  if (!activeFile) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8 text-center bg-slate-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 max-w-sm flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">{t.noFileTitle}</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{t.noFileDesc}</p>
          <button
            onClick={onNavigateToFiles}
            className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
            id="go-to-files-btn"
          >
            {t.selectFileBtn}
          </button>
        </motion.div>
      </div>
    );
  }

  const handleInputChange = (header: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [header]: value
    }));
  };

  const toggleSticky = (header: string) => {
    setStickyFields(prev => ({
      ...prev,
      [header]: !prev[header]
    }));
  };

  const handleSmartAutofill = () => {
    const autofilled: Record<string, string> = { ...formData };
    
    activeFile.headers.forEach(header => {
      // Don't overwrite sticky fields if already filled
      if (stickyFields[header] && autofilled[header]) return;

      const lowerHeader = header.toLowerCase();
      const type = fieldTypes[header];

      // Smart mock data generators based on field types and names
      if (type === 'number') {
        if (lowerHeader.includes('invoice') || lowerHeader.includes('id') || lowerHeader.includes('رقم')) {
          autofilled[header] = String(Math.floor(1000 + Math.random() * 9000));
        } else if (lowerHeader.includes('price') || lowerHeader.includes('سعر') || lowerHeader.includes('salary') || lowerHeader.includes('راتب')) {
          autofilled[header] = String(Math.floor(20 + Math.random() * 480));
        } else if (lowerHeader.includes('qty') || lowerHeader.includes('quantity') || lowerHeader.includes('كمية')) {
          autofilled[header] = String(Math.floor(1 + Math.random() * 10));
        } else if (lowerHeader.includes('amount') || lowerHeader.includes('total') || lowerHeader.includes('إجمالي')) {
          // Leave it or calculate later
          autofilled[header] = String(Math.floor(100 + Math.random() * 1000));
        } else {
          autofilled[header] = String(Math.floor(Math.random() * 100));
        }
      } else if (type === 'date') {
        const today = new Date().toISOString().split('T')[0];
        autofilled[header] = today;
      } else if (type === 'select' && fieldOptions[header]?.length > 0) {
        const opts = fieldOptions[header];
        autofilled[header] = opts[Math.floor(Math.random() * opts.length)];
      } else {
        // Text field heuristics
        if (lowerHeader.includes('name') || lowerHeader.includes('اسم')) {
          const names = ['سعود المطيري', 'عبدالعزيز العتيبي', 'هند الفهد', 'ياسمين الحربي', 'تركي القحطاني', 'خلود الدوسري'];
          autofilled[header] = names[Math.floor(Math.random() * names.length)];
        } else if (lowerHeader.includes('product') || lowerHeader.includes('item') || lowerHeader.includes('سلعة') || lowerHeader.includes('منتج')) {
          const items = ['سماعة لاسلكية', 'بنك طاقة شاحن', 'كابل شحن سريع', 'ماوس بلوتوث', 'لوحة مفاتيح مضيئة'];
          autofilled[header] = items[Math.floor(Math.random() * items.length)];
        } else if (lowerHeader.includes('code') || lowerHeader.includes('sku')) {
          autofilled[header] = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
        } else if (lowerHeader.includes('note') || lowerHeader.includes('ملاحظ')) {
          autofilled[header] = 'تعبئة تلقائية تجريبية';
        } else {
          autofilled[header] = 'بيانات مدخلة';
        }
      }
    });

    // Smart computation for total amount if quantity and price exist
    const qtyHeader = activeFile.headers.find(h => h.toLowerCase().includes('qty') || h.toLowerCase().includes('quantity') || h.toLowerCase().includes('كمية'));
    const priceHeader = activeFile.headers.find(h => h.toLowerCase().includes('price') || h.toLowerCase().includes('سعر') || h.toLowerCase().includes('unit'));
    const totalHeader = activeFile.headers.find(h => h.toLowerCase().includes('total') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('إجمالي'));
    
    if (qtyHeader && priceHeader && totalHeader && autofilled[qtyHeader] && autofilled[priceHeader]) {
      const q = parseFloat(autofilled[qtyHeader]);
      const p = parseFloat(autofilled[priceHeader]);
      if (!isNaN(q) && !isNaN(p)) {
        autofilled[totalHeader] = String(q * p);
      }
    }

    setFormData(autofilled);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one field is filled
    const isAnyFieldFilled = Object.values(formData).some(val => val !== "");
    if (!isAnyFieldFilled) return;

    // Smart calculate total if qty and price exist and are numbers before appending
    const qtyHeader = activeFile.headers.find(h => h.toLowerCase().includes('qty') || h.toLowerCase().includes('quantity') || h.toLowerCase().includes('كمية'));
    const priceHeader = activeFile.headers.find(h => h.toLowerCase().includes('price') || h.toLowerCase().includes('سعر') || h.toLowerCase().includes('unit'));
    const totalHeader = activeFile.headers.find(h => h.toLowerCase().includes('total') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('إجمالي'));
    
    let finalFormData = { ...formData };
    if (qtyHeader && priceHeader && totalHeader) {
      const q = parseFloat(formData[qtyHeader]);
      const p = parseFloat(formData[priceHeader]);
      if (!isNaN(q) && !isNaN(p)) {
        finalFormData[totalHeader] = String(q * p);
      }
    }

    const newRecord: ExcelRecord = {
      _id: `new-${generateId()}`,
      ...finalFormData
    };

    onAddRecord(newRecord);

    // Show beautiful success banner
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);

    // Reset form values, honoring sticky tags
    const resetForm: Record<string, string> = {};
    activeFile.headers.forEach(header => {
      resetForm[header] = stickyFields[header] ? (formData[header] || "") : "";
    });
    setFormData(resetForm);
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50 overflow-hidden relative">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-slate-200/80 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-800">{t.formTitle}</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {t.activeSheet} <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{activeFile.name}</span>
          </p>
        </div>

        {/* Quick Autofill Trigger */}
        <button
          type="button"
          onClick={handleSmartAutofill}
          className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
          title={t.smartFillTooltip}
          id="autofill-btn"
        >
          <Sparkles size={11} className="animate-pulse" />
          <span>{t.smartFill}</span>
        </button>
      </div>

      {/* Success Alert Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-4 right-4 top-4 bg-emerald-600 text-white py-3.5 px-4 rounded-2xl shadow-xl z-50 flex items-center gap-2.5 border border-emerald-500/30"
            id="success-banner"
          >
            <div className="bg-white/20 p-1 rounded-full text-white">
              <Check size={14} strokeWidth={3} />
            </div>
            <span className="text-xs font-bold">{t.successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0" id="data-entry-form">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs text-slate-500 mb-2 leading-relaxed">{t.formSubtitle}</p>

          <div className="space-y-4.5">
            {activeFile.headers.map((header) => {
              const type = fieldTypes[header] || 'text';
              const options = fieldOptions[header] || [];
              const isSticky = !!stickyFields[header];

              return (
                <div key={header} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-2.5">
                  {/* Label Row */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 tracking-wide block">
                      {header}
                    </label>

                    {/* Keep Value (Sticky) Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSticky(header)}
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                        isSticky
                          ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-500'
                      }`}
                      id={`sticky-toggle-${header.replace(/\s+/g, '-')}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isSticky ? 'bg-amber-500' : 'bg-slate-300'}`} />
                      <span>{t.stickyLabel}</span>
                    </button>
                  </div>

                  {/* Input Rendering */}
                  {type === 'select' ? (
                    <select
                      value={formData[header] || ""}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors"
                      id={`input-${header.replace(/\s+/g, '-')}`}
                    >
                      <option value="">{t.placeholderSelect}</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : type === 'date' ? (
                    <input
                      type="date"
                      value={formData[header] || ""}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors"
                      id={`input-${header.replace(/\s+/g, '-')}`}
                    />
                  ) : type === 'number' ? (
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formData[header] || ""}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors"
                      id={`input-${header.replace(/\s+/g, '-')}`}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'أدخل البيانات هنا...' : 'Enter data...'}
                      value={formData[header] || ""}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors"
                      id={`input-${header.replace(/\s+/g, '-')}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Sticky Submit Action Footer */}
        <div className="bg-white border-t border-slate-200/80 p-4 flex-shrink-0">
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
            id="submit-record-btn"
          >
            <PlusCircle size={16} />
            <span>{t.submitBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
