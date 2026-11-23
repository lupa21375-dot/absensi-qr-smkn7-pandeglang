import React, { useState, useEffect } from 'react';
import { Clock, Shield, Moon, Sun, CircleDot, Smartphone } from 'lucide-react';
import { getDeviceTime, isGateOpen } from '../utils/api';
import { NAV_ITEMS } from './Sidebar';

export default function Header({ currentTab, user, onToggleTheme, theme }) {
  const [currentTime, setCurrentTime] = useState(getDeviceTime());
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getDeviceTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === currentTab);
  const pageTitle = activeNav ? activeNav.label : 'Absensi QR';

  const masukOpen = isGateOpen('Masuk');
  const pulangOpen = isGateOpen('Pulang');

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-8 pt-5 pb-3 shrink-0 no-print">
      <div className="flex items-center gap-3">
        {/* Official School Logo */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-sm shrink-0 flex items-center justify-center">
          <img src="./logo.png" alt="Logo SMKN 7 Pandeglang" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-lg sm:text-2xl text-[#172B4D] tracking-tight">
              {pageTitle}
            </h1>
            <span className="text-[10px] sm:text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-100/80 text-[#315E9E] border border-blue-200/60">
              S-Absensi QR
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            SMKN 7 Pandeglang
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
        {/* Live Gate Status Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/60 text-xs font-semibold text-slate-700 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              masukOpen || pulangOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className="text-[11px] font-bold">
            {masukOpen ? 'Gate Masuk Aktif' : pulangOpen ? 'Gate Pulang Aktif' : 'Gate Terkunci'}
          </span>
        </div>

        {/* Live Clock Chip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/60 text-xs font-semibold text-slate-700 shadow-sm tabular-nums">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{currentTime.tgl}</span>
          <span className="font-bold text-[#172B4D]">{currentTime.jamDisplay}</span>
        </div>

        {/* PWA Install Button */}
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer animate-pulse"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install Aplikasi</span>
          </button>
        )}

        {/* User Chip */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/60 text-xs font-bold text-[#172B4D] shadow-sm">
          <Shield className="w-3.5 h-3.5 text-[#315E9E]" />
          <span>{user?.nama}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-100 text-[#315E9E] uppercase">
            {user?.role}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title="Ubah Mode Terang / Gelap"
          className="p-2 rounded-full glass border border-white/60 text-slate-600 hover:text-blue-900 transition-colors shadow-sm cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
