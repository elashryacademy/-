import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, ArrowRight, Table2, Info, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExcelFile, Language } from '../types';
import { getSampleTemplates, parseExcelFile, formatBytes } from '../utils';

interface FileUploaderProps {
  onFileLoaded: (file: ExcelFile) => void;
  activeFile: ExcelFile | null;
  uploadedFiles: ExcelFile[];
  onSelectFile: (file: ExcelFile) => void;
  onDeleteFile: (id: string) => void;
  language: Language;
}

export default function FileUploader({
  onFileLoaded,
  activeFile,
  uploadedFiles,
  onSelectFile,
  onDeleteFile,
  language,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Translations
  const t = {
    ar: {
      uploadTitle: "ارفع ملف الإكسل وابدأ الشغل",
      uploadSubtitle: "اسحب الملف هنا أو اضغط علشان تختار من ملفات الموبايل",
      uploadLimits: "بيدعم صيغ XLSX, XLS, CSV",
      orTryTemplate: "أو جرب شيت جاهز من دول:",
      salesTemplate: "دفتر المبيعات",
      inventoryTemplate: "جرد المخزن",
      attendanceTemplate: "حضور وغياب",
      errorTitle: "حصل مشكلة في قراءة الملف",
      processing: "جاري تحليل أعمدة الملف...",
      uploadedFiles: "الشيتات المفتوحة حالياً",
      originalRows: "الصفوف الأصلية:",
      newRows: "المدخلات الجديدة النهاردة:",
      activeNow: "شغال حالياً",
      selectToUse: "اضغط لتفعيل الشيت والبدء بالعمل",
      deleteConfirm: "حذف الملف",
      templateBadge: "قالب جاهز",
      noFilesYet: "لسه مفيش ملفات مرفوعة. اختار شيت تجريبي أو ارفع ملف إكسل من موبايلك علشان تبدأ تعبي البيانات علطول.",
    },
    en: {
      uploadTitle: "Upload Excel File to Start",
      uploadSubtitle: "Drag & drop file here or browse your device",
      uploadLimits: "Supports XLSX, XLS, CSV formats",
      orTryTemplate: "Or start with a ready template:",
      salesTemplate: "Sales Register",
      inventoryTemplate: "Inventory Audit",
      attendanceTemplate: "Students Attendance",
      errorTitle: "Error Reading File",
      processing: "Analyzing column structure...",
      uploadedFiles: "Active Spreadsheet Files",
      originalRows: "Original rows:",
      newRows: "Rows added today:",
      activeNow: "Currently Active",
      selectToUse: "Click to activate and enter data",
      deleteConfirm: "Remove file",
      templateBadge: "Template",
      noFilesYet: "No files uploaded yet. Please select a sample template or upload your spreadsheet file to start entering data.",
    },
  }[language];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);

    try {
      const parsedFile = await parseExcelFile(file);
      onFileLoaded(parsedFile);
    } catch (err: any) {
      setError(err?.message || "Failed parsing sheet");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadSample = (templateKey: 'sales' | 'inventory' | 'students') => {
    const templates = getSampleTemplates();
    const idx = templateKey === 'sales' ? 0 : templateKey === 'inventory' ? 1 : 2;
    onFileLoaded(templates[idx]);
  };

  return (
    <div className="flex flex-col flex-1 p-5 overflow-y-auto space-y-6">
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[190px] relative overflow-hidden ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/50 shadow-inner'
              : 'border-slate-300 hover:border-emerald-400 bg-white hover:shadow-sm'
          }`}
          id="excel-drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileInputChange}
            id="excel-file-input"
          />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-3"
              >
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-emerald-600">{t.processing}</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-3"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{t.uploadTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1 px-4">{t.uploadSubtitle}</p>
                </div>
                <span className="inline-block bg-slate-100 text-[10px] text-slate-500 font-medium px-2.5 py-1 rounded-full border border-slate-200">
                  {t.uploadLimits}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-start gap-3"
        >
          <div className="bg-red-100 text-red-600 p-1 rounded-lg">
            <Info size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold">{t.errorTitle}</h4>
            <p className="text-xs mt-0.5 text-red-600/90">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Templates Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t.orTryTemplate}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'sales', label: t.salesTemplate, color: 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100/75' },
            { key: 'inventory', label: t.inventoryTemplate, color: 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100/75' },
            { key: 'students', label: t.attendanceTemplate, color: 'bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100/75' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => loadSample(item.key as any)}
              className={`py-2.5 px-1.5 rounded-xl border text-[11px] font-bold text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer hover:shadow-xs active:scale-95 ${item.color}`}
              id={`template-btn-${item.key}`}
            >
              <Table2 size={16} />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Files Section */}
      <div className="flex-1 flex flex-col min-h-0 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t.uploadedFiles}
        </h3>

        {uploadedFiles.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center flex flex-col items-center justify-center flex-1">
            <FileSpreadsheet size={32} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{t.noFilesYet}</p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {uploadedFiles.map((file) => {
              const isActive = activeFile?.id === file.id;
              const isTemplate = file.id.startsWith('template-');
              return (
                <motion.div
                  key={file.id}
                  layoutId={`file-card-${file.id}`}
                  onClick={() => onSelectFile(file)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group flex items-start justify-between gap-3 ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  id={`file-item-${file.id}`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <FileSpreadsheet size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-800 truncate max-w-[140px] md:max-w-[180px]">
                          {file.name}
                        </h4>
                        {isTemplate && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                            {t.templateBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatBytes(file.size)} • {file.headers.length} {language === 'ar' ? 'أعمدة' : 'columns'}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold text-slate-600">
                        <span>{t.originalRows} <span className="font-mono text-slate-800">{file.originalRows.length}</span></span>
                        <span>{t.newRows} <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">{file.newRows.length}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 h-full justify-between">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white select-none">
                        <Check size={9} strokeWidth={3} />
                        <span>{t.activeNow}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-50 group-hover:bg-slate-100 px-1.5 py-0.5 rounded-full transition-colors">
                        {t.selectToUse}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer self-end"
                      title={t.deleteConfirm}
                      id={`delete-file-${file.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
