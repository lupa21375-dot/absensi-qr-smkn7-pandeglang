import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Check, X, ShieldAlert } from 'lucide-react';
import { apiCall } from '../utils/api';
import { ALL_STUDENTS } from '../data/students';

export default function Siswa({ user, addToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary w-full md:w-auto py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
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
                  placeholder="Contoh: Muhammad Rizki"
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
                  Kelas Lengkap (Contoh: X TKJ 1)
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
    </div>
  );
}
