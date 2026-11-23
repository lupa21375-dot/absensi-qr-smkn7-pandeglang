import React, { useState } from 'react';
import { Settings, Lock, Sun, Moon, LogOut, ShieldCheck, Check, Clock, Calendar, RotateCcw } from 'lucide-react';
import { apiCall, getActiveSchedule, saveActiveSchedule, DEFAULT_SCHEDULE } from '../utils/api';

export default function Pengaturan({ user, onLogout, onToggleTheme, theme, addToast }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [loading, setLoading] = useState(false);

  // Flexible Schedule State (Admin Only)
  const isAdmin = user?.role === 'admin';
  const [schedule, setSchedule] = useState(() => getActiveSchedule());

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    saveActiveSchedule(schedule);
    addToast('Jadwal jam absensi sekolah berhasil diperbarui!', 'success');
  };

  const handleResetSchedule = () => {
    setSchedule(DEFAULT_SCHEDULE);
    saveActiveSchedule(DEFAULT_SCHEDULE);
    addToast('Jadwal absensi dikembalikan ke standar default sekolah.', 'info');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPw || !newPw) {
      addToast('Password lama dan baru wajib diisi', 'error');
      return;
    }
    if (newPw.length < 6) {
      addToast('Password baru minimal 6 karakter', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiCall(
        'kelolaAkun',
        {
          aksi: 'gantiPassword',
          passwordLama: oldPw,
          passwordBaru: newPw
        },
        user?.sesi
      );

      addToast(res.pesan || 'Password berhasil diperbarui', 'success');
      setOldPw('');
      setNewPw('');
    } catch (err) {
      addToast(err.message || 'Gagal mengganti password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Profile Card */}
      <div className="card p-5 sm:p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Akun Anda Saat Ini
          </span>
          <h3 className="font-heading font-extrabold text-xl text-[#172B4D] mt-0.5">
            {user?.nama || 'Pengguna'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Username: <span className="font-mono font-bold text-slate-700">@{user?.username}</span> • Role:{' '}
            <span className="font-bold uppercase text-[#315E9E]">{user?.role}</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#315E9E] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Admin Flexible Schedule Settings */}
      {isAdmin && (
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#315E9E]" />
              <div>
                <h4 className="font-heading font-extrabold text-sm text-[#172B4D]">
                  Pengaturan Jam Absensi Sekolah
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tentukan jam masuk, batas toleransi terlambat, dan jam pulang secara mandiri.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetSchedule}
              className="text-[11px] font-semibold text-slate-500 hover:text-[#315E9E] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Standar</span>
            </button>
          </div>

          <form onSubmit={handleSaveSchedule} className="space-y-4">
            {/* Senin - Kamis */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/80 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#315E9E]" />
                <span className="text-xs font-bold text-[#172B4D]">Hari Kerja Normal (Senin – Kamis)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Buka Scan Masuk</label>
                  <input
                    type="time"
                    value={schedule.seninKamis?.masukBuka || '06:00'}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        seninKamis: { ...prev.seninKamis, masukBuka: e.target.value }
                      }))
                    }
                    className="input-field text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    Batas Tepat Waktu (Telat)
                  </label>
                  <input
                    type="time"
                    value={schedule.seninKamis?.batasTepatWaktu || '07:15'}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        seninKamis: { ...prev.seninKamis, batasTepatWaktu: e.target.value }
                      }))
                    }
                    className="input-field text-xs font-mono font-bold border-emerald-300 bg-emerald-50/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Buka Scan Pulang</label>
                  <input
                    type="time"
                    value={schedule.seninKamis?.pulangBuka || '15:30'}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        seninKamis: { ...prev.seninKamis, pulangBuka: e.target.value }
                      }))
                    }
                    className="input-field text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Jumat (Jumtak) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100/80 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">Hari Khusus Jumat (Jum'at Taqwa / Jumtak)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    Batas Tepat Waktu Jumtak
                  </label>
                  <input
                    type="time"
                    value={schedule.jumat?.batasTepatWaktu || '07:00'}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        jumat: { ...prev.jumat, batasTepatWaktu: e.target.value }
                      }))
                    }
                    className="input-field text-xs font-mono font-bold border-amber-300 bg-amber-50/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    Buka Scan Pulang (Pasca Shalat)
                  </label>
                  <input
                    type="time"
                    value={schedule.jumat?.pulangBuka || '11:30'}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        jumat: { ...prev.jumat, pulangBuka: e.target.value }
                      }))
                    }
                    className="input-field text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold w-full cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan & Simpan Jadwal Sekolah</span>
            </button>
          </form>
        </div>
      )}

      {/* Change Password Card */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Lock className="w-4 h-4 text-blue-700" />
          <h4 className="font-heading font-bold text-sm text-[#172B4D]">Ganti Kata Sandi Akun</h4>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password Lama</label>
            <input
              type="password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              placeholder="Masukkan password lama..."
              className="input-field text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru (Min. 6 Karakter)</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Masukkan password baru..."
              className="input-field text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold w-full cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Menyimpan Password...' : 'Simpan Perubahan Password'}
          </button>
        </form>
      </div>

      {/* Appearance & Theme Card */}
      <div className="card p-5 sm:p-6 flex items-center justify-between">
        <div>
          <h4 className="font-heading font-bold text-sm text-[#172B4D]">Tema Tampilan Aplikasi</h4>
          <p className="text-xs text-slate-500 font-medium">
            Mode saat ini: {theme === 'dark' ? 'Gelap (Dark Mode)' : 'Terang (Light Glassmorphism)'}
          </p>
        </div>

        <button
          onClick={onToggleTheme}
          className="btn-secondary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Ganti ke Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Ganti ke Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="btn-danger w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi Akun Sekarang</span>
        </button>
      </div>
    </div>
  );
}
