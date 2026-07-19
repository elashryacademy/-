import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Radio } from 'lucide-react';
import { Language } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  activeLanguage: Language;
}

export default function MobileFrame({ children, activeLanguage }: MobileFrameProps) {
  const [useFrame, setUseFrame] = useState(true);
  const [time, setTime] = useState('');

  // Update clock in the simulated status bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-0 md:py-6 text-slate-800 font-sans selection:bg-emerald-100">
      {/* Desktop Top Bar: Controls */}
      <div className="hidden md:flex items-center justify-between w-full max-w-sm mb-4 px-4 bg-white py-2.5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-600">
            {activeLanguage === 'ar' ? 'نمط الهاتف المحمول نشط' : 'Mobile Simulator Active'}
          </span>
        </div>
        <button
          onClick={() => setUseFrame(!useFrame)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
        >
          {useFrame ? (
            <>
              <Monitor size={14} className="text-slate-600" />
              <span>{activeLanguage === 'ar' ? 'عرض كامل الشاشة' : 'Wide Screen View'}</span>
            </>
          ) : (
            <>
              <Smartphone size={14} className="text-slate-600" />
              <span>{activeLanguage === 'ar' ? 'عرض داخل إطار هاتف' : 'Simulator View'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          useFrame
            ? 'md:w-[390px] md:h-[844px] md:rounded-[55px] md:ring-12 md:ring-slate-950 md:shadow-2xl md:relative md:overflow-hidden md:border-4 md:border-slate-800'
            : 'md:w-full md:max-w-4xl md:min-h-[80vh] md:rounded-3xl md:shadow-lg md:border border-slate-200/80'
        } bg-white flex flex-col h-screen md:h-auto`}
      >
        {/* Dynamic Mobile Status Bar (Visible only in Simulator mode) */}
        {useFrame && (
          <div className="hidden md:flex justify-between items-center px-8 pt-3 pb-2 bg-slate-900 text-white text-xs select-none relative z-50">
            {/* Clock */}
            <span className="font-semibold text-[11px] tracking-tight">{time}</span>

            {/* Simulated Dynamic Island / Notch */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[110px] h-6 bg-black rounded-full flex items-center justify-center gap-1.5 px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-600" />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5">
              <Wifi size={11} className="stroke-[2.5]" />
              <Radio size={11} className="stroke-[2.5]" />
              <Battery size={13} className="stroke-[2] fill-current" />
            </div>
          </div>
        )}

        {/* Inner Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
          {children}
        </div>

        {/* Dynamic Mobile Home Indicator (Visible only in Simulator mode) */}
        {useFrame && (
          <div className="hidden md:flex justify-center items-center pb-2 pt-1 bg-white select-none relative z-50 border-t border-slate-100">
            <div className="w-32 h-1 bg-slate-300 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
