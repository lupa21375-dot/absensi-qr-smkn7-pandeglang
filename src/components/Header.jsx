import React, { useState, useEffect } from 'react';
import { Clock, Shield, Moon, Sun, CircleDot } from 'lucide-react';
import { getDeviceTime, isGateOpen } from '../utils/api';
import { NAV_ITEMS } from './Sidebar';

export default function Header({ currentTab, user, onToggleTheme, theme }) {
  const [currentTime, setCurrentTime] = useState(getDeviceTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getDeviceTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeNav = NAV_ITEMS.find((n) => n.id === currentTab);
  const pageTitle = activeNav ? activeNav.label : 'Absensi QR';

  const masukOpen = isGateOpen('Masuk');
  const pulangOpen = isGateOpen('Pulang');

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-8 pt-5 pb-3 shrink-0">
      <div>
        <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#172B4D] tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-xs text-slate-500 font-medium hidden sm:block">
          Sistem Absensi Digital Siswa SMKN 7 Pandeglang
        </p>
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
