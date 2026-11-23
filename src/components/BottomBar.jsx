import React, { useState } from 'react';
import {
  LayoutDashboard,
  QrCode,
  Users,
  FileSpreadsheet,
  Menu as MenuIcon,
  X,
  History,
  KeyRound,
  CalendarOff,
  Printer,
  Database,
  HelpCircle,
  Settings,
  LogOut
} from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';

export default function BottomBar({ currentTab, onSelectTab, user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const PRIMARY_MOBILE = [
    { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Scanner', icon: QrCode },
    { id: 'siswa', label: 'Siswa', icon: Users },
    { id: 'rekap', label: 'Rekap', icon: FileSpreadsheet }
  ];

  const handleNavClick = (id) => {
    onSelectTab(id);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Floating Bottom Nav */}
      <nav className="lg:hidden fixed left-3 right-3 bottom-3 z-50 glass rounded-2xl p-1.5 border border-white/60 shadow-2xl flex items-center justify-around no-print">
        {PRIMARY_MOBILE.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex-1 py-1.5 px-2 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-t from-[#172B4D] to-[#3C6DB1] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-heading font-bold">{item.label}</span>
            </button>
          );
        })}

        {/* More Menu Toggle */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex-1 py-1.5 px-2 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
            drawerOpen || (!PRIMARY_MOBILE.some((m) => m.id === currentTab))
              ? 'bg-blue-100/80 text-blue-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MenuIcon className="w-4 h-4" />
          <span className="text-[10px] font-heading font-bold">Menu</span>
        </button>
      </nav>

      {/* Full Screen Menu Drawer on Mobile */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end no-print">
          <div className="bg-white/95 rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto border-t border-white/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src="./logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="font-heading font-bold text-base text-[#172B4D]">Menu Lengkap</h3>
                  <p className="text-xs text-slate-500">{user?.nama} ({user?.role})</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`p-3 rounded-2xl flex items-center gap-2.5 border text-left transition-all ${
                      isActive
                        ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                        : 'bg-slate-50 hover:bg-blue-50/70 border-slate-200/60 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-heading font-bold truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onLogout();
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-heading font-bold text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
