import React, { useState } from 'react';
import { Download, FileSpreadsheet, ShieldCheck, RefreshCw, CheckCircle2, FileDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExcelFile, Language } from '../types';
import { exportExcelFile } from '../utils';

interface ExportSectionProps {
  activeFile: ExcelFile | null;
  onClearNewRows: () => void;
  language: Language;
}

export default function ExportSection({
  activeFile,
  onClearNewRows,
  language,
}: ExportSectionProps) {
  const [downloadFormat, setDownloadFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exporting, setExporting] = useState(false);
  const [exportedFile, setExportedFile] = useState<string | null>(null);

  const t = {
    ar: {
      title: "تنزيل وتصدير الملف المدمج",
      subtitle: "ادمج كل المدخلات الجديدة في الشيت الأصلي ونزله بموبايلك علطول",
      noFileTitle: "مفيش شيت متحدد",
      noFileDesc: "ارفع ملف أو اختار شيت علشان تبدأ تصدير البيانات المدمجة.",
      summaryCardTitle: "ملخص شغل النهاردة",
      originalCount: "الصفوف الأصلية اللي كانت في الملف:",
      newCount: "البيانات الجديدة اللي ضفتها النهاردة:",
      totalCount: "العدد الكلي بعد الدمج:",
      formatLabel: "اختار صيغة التنزيل اللي عايزها:",
      xlsxDesc: "صيغة مايكروسوفت إكسل المعتادة (.xlsx)",
      csvDesc: "ملف نصي مفصول بفواصل (.csv)",
      downloadBtn: "دمج وتنزيل الملف النهائي",
      downloading: "جاري دمج البيانات وتجهيز الملف...",
      successTitle: "الملف جاهز ونزل عندك!",
      successDesc: "تم دمج البيانات الجديدة وحفظ الملف باسم {filename} بنجاح في مكانها المظبوط.",
      clearDataBtn: "تصفير بيانات النهاردة وبدء يوم جديد",
      clearWarning: "تنبيه: ده هيمسح كل المدخلات الجديدة اللي ضفتها النهاردة علشان تبدأ على مية بيضا. البيانات الأصلية بتاعت الملف مش هتتأثر.",
      rowUnit: "صف",
    },
    en: {
      title: "Merge & Export Spreadsheet",
      subtitle: "Merge all newly entered rows with the original file and download",
      noFileTitle: "No File Selected",
      noFileDesc: "Please load or select a spreadsheet file to export.",
      summaryCardTitle: "Daily Activity Summary",
      originalCount: "Original rows uploaded:",
      newCount: "New rows entered today:",
      totalCount: "Total combined rows:",
      formatLabel: "Select export file format:",
      xlsxDesc: "Standard Microsoft Excel format (.xlsx)",
      csvDesc: "Comma-Separated Values format (.csv)",
      downloadBtn: "Merge & Download Complete File",
      downloading: "Merging and generating file...",
      successTitle: "Download Started!",
      successDesc: "Your updated file {filename} was generated, merging new records into their corresponding headers.",
      clearDataBtn: "Clear Today's Entries & Reset",
      clearWarning: "Note: This will clear the newly entered rows list to start fresh. The original template data is unaffected.",
      rowUnit: "rows",
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

  const handleDownload = () => {
    setExporting(true);
    setExportedFile(null);

    setTimeout(() => {
      try {
        const { blob, filename } = exportExcelFile(activeFile, downloadFormat);
        
        // Trigger file download in browser
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportedFile(filename);
      } catch (err) {
        console.error("Export error", err);
      } finally {
        setExporting(false);
      }
    }, 800);
  };

  const totalCombined = activeFile.originalRows.length + activeFile.newRows.length;

  return (
    <div className="flex flex-col flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50">
      <div>
        <h2 className="text-sm font-bold text-slate-800">{t.title}</h2>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{t.subtitle}</p>
      </div>

      {/* Activity Summary Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs"
        id="summary-card"
      >
        <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2.5 mb-3 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>{t.summaryCardTitle}</span>
        </h3>

        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>{t.originalCount}</span>
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {activeFile.originalRows.length} {t.rowUnit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t.newCount}</span>
            <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              +{activeFile.newRows.length} {t.rowUnit}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center font-bold text-slate-800">
            <span>{t.totalCount}</span>
            <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-sm">
              {totalCombined} {t.rowUnit}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Select Export Format */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-600 tracking-wide block">
          {t.formatLabel}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDownloadFormat('xlsx')}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
              downloadFormat === 'xlsx'
                ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            id="format-xlsx"
          >
            <div className="flex justify-between w-full items-start">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                downloadFormat === 'xlsx' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                EXCEL
              </span>
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                downloadFormat === 'xlsx' ? 'border-emerald-600' : 'border-slate-300'
              }`}>
                {downloadFormat === 'xlsx' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
              {t.xlsxDesc}
            </span>
          </button>

          <button
            onClick={() => setDownloadFormat('csv')}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
              downloadFormat === 'csv'
                ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            id="format-csv"
          >
            <div className="flex justify-between w-full items-start">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                downloadFormat === 'csv' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                CSV
              </span>
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                downloadFormat === 'csv' ? 'border-emerald-600' : 'border-slate-300'
              }`}>
                {downloadFormat === 'csv' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
              {t.csvDesc}
            </span>
          </button>
        </div>
      </div>

      {/* Download Alert Confirm Feedback */}
      <AnimatePresence>
        {exportedFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-800 flex gap-3 items-start"
            id="export-success-message"
          >
            <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full flex-shrink-0 mt-0.5">
              <CheckCircle2 size={16} />
            </div>
            <div className="text-xs">
              <h4 className="font-bold">{t.successTitle}</h4>
              <p className="text-[11px] text-emerald-700/90 leading-relaxed mt-1">
                {t.successDesc.replace('{filename}', exportedFile)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Download Button */}
      <button
        onClick={handleDownload}
        disabled={exporting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        id="download-merged-file-btn"
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{t.downloading}</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>{t.downloadBtn}</span>
          </>
        )}
      </button>

      {/* Start Fresh Reset Option */}
      {activeFile.newRows.length > 0 && (
        <div className="border-t border-slate-200/60 pt-5 mt-2 space-y-3">
          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
            {t.clearWarning}
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(language === 'ar' ? "هل أنت متأكد من مسح جميع مدخلات اليوم؟" : "Are you sure you want to clear today's entries?")) {
                onClearNewRows();
                setExportedFile(null);
              }
            }}
            className="w-full bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-100 font-bold py-3 px-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            id="clear-all-new-entries"
          >
            <Trash2 size={13} />
            <span>{t.clearDataBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
}
