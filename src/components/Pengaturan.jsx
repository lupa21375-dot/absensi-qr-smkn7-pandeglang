import React, { useState } from 'react';
import { Settings, Lock, Sun, Moon, LogOut, ShieldCheck, Check } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function Pengaturan({ user, onLogout, onToggleTheme, theme, addToast }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [loading, setLoading] = useState(false);

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
