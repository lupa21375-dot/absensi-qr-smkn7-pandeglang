import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  Users,
  History,
  FileSpreadsheet,
  KeyRound,
  CalendarOff,
  Printer,
  Database,
  HelpCircle,
  Settings,
  LogOut,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scan', label: 'Scanner QR', icon: QrCode },
  { id: 'siswa', label: 'Data Siswa', icon: Users },
  { id: 'riwayat', label: 'Riwayat Hari Ini', icon: History },
  { id: 'rekap', label: 'Rekapitulasi', icon: FileSpreadsheet },
  { id: 'akun', label: 'Kelola Akun', icon: KeyRound, adminOnly: true },
  { id: 'libur', label: 'Hari Libur', icon: CalendarOff, adminOnly: true },
  { id: 'qr', label: 'Cetak Kartu QR', icon: Printer, adminOnly: true },
  { id: 'db', label: 'Database Sheets', icon: Database, adminOnly: true },
  { id: 'bantuan', label: 'Pusat Bantuan', icon: HelpCircle },
  { id: 'set', label: 'Pengaturan', icon: Settings }
];

export default function Sidebar({ currentTab, onSelectTab, user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden lg:flex w-64 flex-col glass rounded-[28px] m-4 p-4 border border-white/60 shadow-xl shrink-0 overflow-hidden no-print">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-slate-200/50">
        <div className="w-10 h-10 rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-sm shrink-0 flex items-center justify-center">
          <img src="./logo-sekolah.png" alt="Logo SMKN 7" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading font-extrabold text-base text-[#172B4D] leading-tight truncate">
            S-Absensi QR
          </h2>
          <p className="text-[11px] text-slate-500 font-medium truncate">SMKN 7 Pandeglang</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto space-y-1 py-2 pr-1 -mr-1">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading text-xs font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#3C6DB1] to-[#172B4D] text-white shadow-md shadow-blue-950/20'
                  : 'text-slate-600 hover:text-[#172B4D] hover:bg-blue-50/70'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {item.adminOnly && (
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="pt-3 border-t border-slate-200/50 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-blue-50/50 border border-blue-100/60">
          <div className="w-7 h-7 rounded-lg bg-blue-900/10 flex items-center justify-center text-blue-900 shrink-0">
            {isAdmin ? <ShieldCheck className="w-4 h-4 text-[#315E9E]" /> : <GraduationCap className="w-4 h-4 text-[#315E9E]" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-[#172B4D] truncate">{user?.nama || 'Pengguna'}</span>
            <span className="block text-[10px] text-slate-500 capitalize">{user?.role || 'Guru'}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/80 transition-colors border border-rose-200/40 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
