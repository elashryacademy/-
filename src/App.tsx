import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, PlusCircle, Database, Download, Globe, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Type definitions
import { ExcelFile, ExcelRecord, Language } from './types';

// Child components
import MobileFrame from './components/MobileFrame';
import FileUploader from './components/FileUploader';
import DynamicForm from './components/DynamicForm';
import RecordList from './components/RecordList';
import ExportSection from './components/ExportSection';

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [uploadedFiles, setUploadedFiles] = useState<ExcelFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'files' | 'form' | 'records' | 'export'>('files');

  // Load state from localStorage on init
  useEffect(() => {
    const savedLanguage = localStorage.getItem('excel_form_lang') as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    const savedFiles = localStorage.getItem('excel_form_files');
    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles) as ExcelFile[];
        setUploadedFiles(parsed);
        
        const savedActiveId = localStorage.getItem('excel_form_active_id');
        if (savedActiveId && parsed.some(f => f.id === savedActiveId)) {
          setActiveFileId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveFileId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, []);

  // Save state to localStorage on update
  const saveToLocalStorage = (files: ExcelFile[], activeId: string | null) => {
    localStorage.setItem('excel_form_files', JSON.stringify(files));
    if (activeId) {
      localStorage.setItem('excel_form_active_id', activeId);
    } else {
      localStorage.removeItem('excel_form_active_id');
    }
  };

  const handleLanguageToggle = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    localStorage.setItem('excel_form_lang', nextLang);
  };

  const handleFileLoaded = (file: ExcelFile) => {
    // Add file to list (or update if already exists with same name/id)
    let updated: ExcelFile[];
    const existsIdx = uploadedFiles.findIndex(f => f.name === file.name);

    if (existsIdx >= 0) {
      // Keep existing newRows if they match
      const existing = uploadedFiles[existsIdx];
      const mergedFile = {
        ...file,
        newRows: existing.newRows,
      };
      updated = [...uploadedFiles];
      updated[existsIdx] = mergedFile;
    } else {
      updated = [file, ...uploadedFiles];
    }

    setUploadedFiles(updated);
    setActiveFileId(file.id);
    saveToLocalStorage(updated, file.id);

    // Redirect to form input directly for smooth UX!
    setCurrentTab('form');
  };

  const handleSelectFile = (file: ExcelFile) => {
    setActiveFileId(file.id);
    saveToLocalStorage(uploadedFiles, file.id);
  };

  const handleDeleteFile = (id: string) => {
    const updated = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(updated);

    let nextActiveId: string | null = null;
    if (activeFileId === id) {
      nextActiveId = updated.length > 0 ? updated[0].id : null;
      setActiveFileId(nextActiveId);
    } else {
      nextActiveId = activeFileId;
    }

    saveToLocalStorage(updated, nextActiveId);
  };

  const handleAddRecord = (record: ExcelRecord) => {
    if (!activeFileId) return;

    const updated = uploadedFiles.map(file => {
      if (file.id === activeFileId) {
        return {
          ...file,
          newRows: [...file.newRows, record]
        };
      }
      return file;
    });

    setUploadedFiles(updated);
    saveToLocalStorage(updated, activeFileId);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!activeFileId) return;

    const updated = uploadedFiles.map(file => {
      if (file.id === activeFileId) {
        return {
          ...file,
          newRows: file.newRows.filter(r => r._id !== recordId)
        };
      }
      return file;
    });

    setUploadedFiles(updated);
    saveToLocalStorage(updated, activeFileId);
  };

  const handleUpdateRecord = (updatedRecord: ExcelRecord) => {
    if (!activeFileId) return;

    const updated = uploadedFiles.map(file => {
      if (file.id === activeFileId) {
        return {
          ...file,
          newRows: file.newRows.map(r => r._id === updatedRecord._id ? updatedRecord : r)
        };
      }
      return file;
    });

    setUploadedFiles(updated);
    saveToLocalStorage(updated, activeFileId);
  };

  const handleClearNewRows = () => {
    if (!activeFileId) return;

    const updated = uploadedFiles.map(file => {
      if (file.id === activeFileId) {
        return {
          ...file,
          newRows: []
        };
      }
      return file;
    });

    setUploadedFiles(updated);
    saveToLocalStorage(updated, activeFileId);
  };

  const activeFile = uploadedFiles.find(f => f.id === activeFileId) || null;

  // Language Dictionary
  const t = {
    ar: {
      appName: "مُدخل بيانات إكسل الذكي",
      tabFiles: "الشيتات المفتوحة",
      tabForm: "الفورم",
      tabRecords: "المراجعة",
      tabExport: "حفظ وتصدير",
    },
    en: {
      appName: "Excel Mobile Form",
      tabFiles: "Spreadsheets",
      tabForm: "Entry Form",
      tabRecords: "Review Rows",
      tabExport: "Merge & Save",
    }
  }[language];

  const isRtl = language === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="w-full min-h-screen bg-slate-100 antialiased selection:bg-emerald-100">
      <MobileFrame activeLanguage={language}>
        {/* Top Header Bar */}
        <header className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-md relative z-40 flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 p-1.5 rounded-xl text-white shadow-md shadow-emerald-500/10">
              <FileSpreadsheet size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-xs font-bold tracking-tight select-none">
              {t.appName}
            </h1>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={handleLanguageToggle}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer select-none"
            id="lang-toggle-btn"
          >
            <Globe size={11} />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </header>

        {/* Content View Area */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-50 relative">
          <AnimatePresence mode="wait">
            {currentTab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? -30 : 30 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <FileUploader
                  onFileLoaded={handleFileLoaded}
                  activeFile={activeFile}
                  uploadedFiles={uploadedFiles}
                  onSelectFile={handleSelectFile}
                  onDeleteFile={handleDeleteFile}
                  language={language}
                />
              </motion.div>
            )}

            {currentTab === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? -30 : 30 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <DynamicForm
                  activeFile={activeFile}
                  onAddRecord={handleAddRecord}
                  language={language}
                  onNavigateToFiles={() => setCurrentTab('files')}
                />
              </motion.div>
            )}

            {currentTab === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? -30 : 30 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <RecordList
                  activeFile={activeFile}
                  onDeleteRecord={handleDeleteRecord}
                  onUpdateRecord={handleUpdateRecord}
                  language={language}
                  onNavigateToForm={() => setCurrentTab('form')}
                />
              </motion.div>
            )}

            {currentTab === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? -30 : 30 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <ExportSection
                  activeFile={activeFile}
                  onClearNewRows={handleClearNewRows}
                  language={language}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Tab Navigation Bar */}
        <nav className="bg-white border-t border-slate-200/80 px-2 py-2 flex items-center justify-around flex-shrink-0 shadow-lg relative z-40 select-none">
          {[
            { id: 'files', label: t.tabFiles, icon: FileSpreadsheet },
            { id: 'form', label: t.tabForm, icon: PlusCircle },
            { id: 'records', label: t.tabRecords, icon: Database },
            { id: 'export', label: t.tabExport, icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all cursor-pointer relative ${
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                id={`nav-tab-${tab.id}`}
              >
                <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'}`} />
                <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 w-5 h-0.5 bg-emerald-600 rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                
                {/* Tiny badge showing rows waiting to be saved */}
                {tab.id === 'records' && activeFile && activeFile.newRows.length > 0 && (
                  <span className="absolute -top-0.5 right-4 w-4 h-4 bg-red-500 text-white font-bold text-[8px] flex items-center justify-center rounded-full ring-2 ring-white">
                    {activeFile.newRows.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </MobileFrame>
    </div>
  );
}
