import React, { useState, useEffect } from 'react';
import { KeyRound, UserPlus, Shield, UserCheck, UserX, Lock, RefreshCw } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function KelolaAkun({ user, addToast }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [formUsername, setFormUsername] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('guru');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await apiCall('kelolaAkun', { aksi: 'list' }, user?.sesi);
      setAccounts(res.data || []);
    } catch (err) {
      addToast(err.message || 'Gagal memuat akun', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!formUsername.trim() || !formNama.trim() || !formPassword.trim()) {
      addToast('Semua field wajib diisi', 'error');
      return;
    }
    if (formPassword.length < 6) {
      addToast('Password minimal 6 karakter', 'error');
      return;
    }

    try {
      const res = await apiCall(
        'kelolaAkun',
        {
          aksi: 'tambah',
          username: formUsername.trim().toLowerCase(),
          nama: formNama.trim(),
          password: formPassword.trim(),
          role: formRole
        },
        user?.sesi
      );

      addToast(res.pesan || 'Akun berhasil dibuat', 'success');
      setShowAddModal(false);
      setFormUsername('');
      setFormNama('');
      setFormPassword('');
      loadAccounts();
    } catch (err) {
      addToast(err.message || 'Gagal membuat akun', 'error');
    }
  };

  const handleToggleActive = async (targetUser, currentlyActive) => {
    try {
      const res = await apiCall(
        'kelolaAkun',
        {
          aksi: currentlyActive ? 'nonaktifkan' : 'aktifkan',
          username: targetUser
        },
        user?.sesi
      );
      addToast(res.pesan || 'Status akun berhasil diubah', 'success');
      loadAccounts();
    } catch (err) {
      addToast(err.message || 'Gagal mengubah status akun', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast('Password baru minimal 6 karakter', 'error');
      return;
    }

    try {
      const res = await apiCall(
        'kelolaAkun',
        {
          aksi: 'resetPassword',
          username: resetModalUser,
          passwordBaru: newPassword
        },
        user?.sesi
      );

      addToast(res.pesan || 'Password berhasil direset', 'success');
      setResetModalUser(null);
      setNewPassword('');
    } catch (err) {
      addToast(err.message || 'Gagal mereset password', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action */}
      <div className="card p-4 sm:p-5 flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#172B4D]">
            Manajemen Akun Guru & Admin
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelola hak akses untuk guru dan petugas absensi SMKN 7 Pandeglang
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Account List */}
      <div className="card p-4 sm:p-6">
        {accounts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {accounts.map((acc) => (
              <div
                key={acc.username}
                className="py-3 px-2 flex items-center justify-between gap-3 text-sm flex-wrap hover:bg-white/40 rounded-xl"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="font-heading text-[#172B4D]">{acc.nama}</strong>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-md uppercase ${
                        acc.role === 'admin'
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">
                    @{acc.username}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      acc.aktif ? 'badge-ok' : 'badge-al'
                    }`}
                  >
                    {acc.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>

                  <button
                    onClick={() => setResetModalUser(acc.username)}
                    className="btn-secondary py-1 px-2.5 rounded-lg text-xs font-bold"
                  >
                    Reset PW
                  </button>

                  {acc.username !== user?.username && (
                    <button
                      onClick={() => handleToggleActive(acc.username, acc.aktif)}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        acc.aktif
                          ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      {acc.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            {loading ? 'Memuat akun...' : 'Belum ada akun terdaftar.'}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md bg-white space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[#172B4D]">Tambah Akun Pengguna</h3>
            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Pak Budi Santoso, S.Pd"
                  className="input-field text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username Login</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="huruf kecil, angka, titik"
                  className="input-field text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password Awal (Min. 6 Kar)</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="input-field text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role Akun</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="input-field text-xs font-bold"
                >
                  <option value="guru">Guru / Satpam</option>
                  <option value="admin">Administrator Sekolah</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1 py-2.5 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold">
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm bg-white space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[#172B4D]">
              Reset Password @{resetModalUser}
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="input-field text-xs"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="btn-secondary flex-1 py-2.5 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold">
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
