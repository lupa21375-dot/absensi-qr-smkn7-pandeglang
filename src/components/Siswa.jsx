import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Check, X, ShieldAlert, GraduationCap, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { apiCall } from '../utils/api';
import { ALL_STUDENTS } from '../data/students';

export default function Siswa({ user, addToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // New Student Form
  const [newNama, setNewNama] = useState('');
  const [newTingkat, setNewTingkat] = useState('X');
  const [newJurusan, setNewJurusan] = useState('AKL');
  const [newKelas, setNewKelas] = useState('');

  const isAdmin = user?.role === 'admin';

  // Get distinct classes list sorted properly (X, XI, XII)
  const classList = [...new Set(ALL_STUDENTS.map((s) => s.kelas))].sort((a, b) => {
    const order = { X: 0, XI: 1, XII: 2 };
    const orderA = order[a.split(' ')[0]] ?? 99;
    const orderB = order[b.split(' ')[0]] ?? 99;
    return orderA - orderB || a.localeCompare(b, 'id', { numeric: true });
  });

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await apiCall('kelolaSiswa', { aksi: 'list', semua: isAdmin ? 1 : 0 }, user?.sesi);
      if (res.data && res.data.length > 0) {
        setStudents(res.data);
      } else {
        setStudents(ALL_STUDENTS);
      }
    } catch (err) {
      // Fallback to local students list
      setStudents(ALL_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const toggleStudentStatus = async (kode, currentStatus) => {
    if (!isAdmin) return;
    try {
      const action = currentStatus ? 'hapus' : 'aktifkan';
      const res = await apiCall('kelolaSiswa', { aksi: action, kode }, user?.sesi);
      addToast(res.pesan || 'Status siswa berhasil diubah', 'success');
      setStudents((prev) =>
        prev.map((s) => (s.kode === kode ? { ...s, aktif: !currentStatus } : s))
      );
    } catch (err) {
      addToast(err.message || 'Gagal mengubah status', 'error');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newNama.trim() || !newKelas.trim()) {
      addToast('Nama dan kelas wajib diisi', 'error');
      return;
    }

    try {
      const res = await apiCall(
        'kelolaSiswa',
        {
          aksi: 'tambah',
          nama: newNama.trim(),
          tingkat: newTingkat,
          jurusan: newJurusan,
          kelas: newKelas.trim()
        },
        user?.sesi
      );

      addToast(`Siswa ditambahkan dengan kode ${res.kode}`, 'success');
      setShowAddModal(false);
      setNewNama('');
      setNewKelas('');
      loadStudents();
    } catch (err) {
      addToast(err.message || 'Gagal menambah siswa', 'error');
    }
  };

  const handlePromoteStudents = async () => {
    if (confirmText.trim().toUpperCase() !== 'NAIK KELAS') {
      addToast('Ketik NAIK KELAS untuk konfirmasi', 'error');
      return;
    }
    setPromoting(true);
    try {
      const res = await apiCall('kelolaSiswa', { aksi: 'naikKelasMassal' }, user?.sesi);
      addToast(res.pesan || 'Kenaikan kelas massal berhasil diproses!', 'success');
      setShowPromotionModal(false);
      setConfirmText('');
      loadStudents();
    } catch (err) {
      addToast(err.message || 'Gagal memproses kenaikan kelas', 'error');
    } finally {
      setPromoting(false);
    }
  };

  const countX = students.filter((s) => s.tingkat === 'X' && s.aktif !== false).length;
  const countXI = students.filter((s) => s.tingkat === 'XI' && s.aktif !== false).length;
  const countXII = students.filter((s) => s.tingkat === 'XII' && s.aktif !== false).length;

  // Filter students based on dropdown and search query
  const filteredStudents = students.filter((s) => {
    const matchesClass = !selectedClass || s.kelas === selectedClass;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || s.nama.toLowerCase().includes(q) || s.kode.toLowerCase().includes(q);
    return matchesClass && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
          {/* Class Select */}
          <div className="w-full sm:w-56 shrink-0">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field text-xs font-semibold cursor-pointer"
            >
              <option value="">Semua Kelas (33 Kelas)</option>
              {classList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau 8 digit kode QR..."
              className="input-field pl-10 text-xs"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowPromotionModal(true)}
              className="btn-secondary w-full sm:w-auto py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Kenaikan Kelas</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        )}
      </div>

      {/* Student List Count */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
        <span>
          Menampilkan <strong className="text-[#172B4D]">{filteredStudents.length}</strong> siswa
          {selectedClass ? ` di kelas ${selectedClass}` : ''}
        </span>
      </div>

      {/* Student Cards Grid */}
      <div className="card p-3 sm:p-5">
        <div className="divide-y divide-slate-100/80">
          {filteredStudents.slice(0, 150).map((s) => (
            <div
              key={s.kode}
              className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-white/40 rounded-xl transition-colors"
            >
              <div className="min-w-0">
                <span className="font-heading font-bold text-sm text-[#172B4D] block truncate">
                  {s.nama}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-medium">{s.kelas}</span>
                  <span>•</span>
                  <code className="font-mono font-bold tracking-wider text-[#315E9E] bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                    {s.kode}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {s.aktif === false ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full badge-al">
                    Nonaktif
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full badge-ok">
                    Aktif
                  </span>
                )}

                {isAdmin && (
                  <button
                    onClick={() => toggleStudentStatus(s.kode, s.aktif !== false)}
                    className="btn-secondary py-1 px-2.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {s.aktif !== false ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length > 150 && (
          <div className="text-center py-4 text-xs text-slate-400 font-medium border-t border-slate-100 mt-2">
            Menampilkan 150 siswa teratas untuk kecepatan tampilan. Gunakan pencarian atau filter kelas untuk mempersempit.
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md bg-white space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[#172B4D]">Tambah Data Siswa</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Nama lengkap siswa"
                  className="input-field text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat</label>
                  <select
                    value={newTingkat}
                    onChange={(e) => setNewTingkat(e.target.value)}
                    className="input-field text-xs font-semibold"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jurusan</label>
                  <select
                    value={newJurusan}
                    onChange={(e) => setNewJurusan(e.target.value)}
                    className="input-field text-xs font-semibold"
                  >
                    {['AKL', 'DKV', 'TKJ', 'TKR', 'TITL', 'TP', 'ATPH'].map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kelas Lengkap (Format: X TKJ 1)
                </label>
                <input
                  type="text"
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value)}
                  placeholder="X TKJ 1"
                  className="input-field text-xs"
                  required
                />
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
                  Simpan & Buat Kode QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Promotion Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg bg-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#172B4D]">
                    Kenaikan Kelas Massal
                  </h3>
                  <p className="text-xs text-slate-500">Tahun Ajaran Baru SMKN 7 Pandeglang</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPromotionModal(false);
                  setConfirmText('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem akan memindahkan seluruh jenjang kelas secara otomatis dalam satu kali klik. Kartu QR fisik siswa <strong className="text-[#172B4D]">tetap berlaku dan tidak perlu dicetak ulang</strong> karena kode unik siswa bersifat permanen.
            </p>

            {/* Simulation Preview Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/60 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Kelas X → XI</span>
                <span className="font-heading font-extrabold text-xl text-blue-900 block my-0.5">{countX}</span>
                <span className="text-[10px] text-blue-600 block">Siswa Naik</span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/60 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700 block">Kelas XI → XII</span>
                <span className="font-heading font-extrabold text-xl text-indigo-900 block my-0.5">{countXI}</span>
                <span className="text-[10px] text-indigo-600 block">Siswa Naik</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Kelas XII → Lulus</span>
                <span className="font-heading font-extrabold text-xl text-emerald-900 block my-0.5">{countXII}</span>
                <span className="text-[10px] text-emerald-600 block">Alumni</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Peringatan Admin:</strong> Tindakan ini akan memperbarui 1.083 data kelas di Google Spreadsheet sekaligus. Pastikan kenaikan kelas telah resmi disetujui rapat dewan guru.
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                Ketik <span className="font-mono font-bold text-indigo-700">NAIK KELAS</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Ketik NAIK KELAS..."
                className="input-field text-xs font-mono font-bold text-center tracking-wider py-2.5"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPromotionModal(false);
                  setConfirmText('');
                }}
                disabled={promoting}
                className="btn-secondary flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePromoteStudents}
                disabled={promoting || confirmText !== 'NAIK KELAS'}
                className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {promoting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses di Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>Eksekusi Kenaikan Kelas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
