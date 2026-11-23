import React, { useState, useEffect } from 'react';
import { CalendarOff, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function HariLibur({ user, addToast }) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await apiCall('kelolaLibur', { aksi: 'list' }, user?.sesi);
      setHolidays(res.data || []);
    } catch (err) {
      addToast(err.message || 'Gagal memuat daftar hari libur', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!tanggal) {
      addToast('Pilih tanggal libur terlebih dahulu', 'error');
      return;
    }

    try {
      const res = await apiCall(
        'kelolaLibur',
        {
          aksi: 'tambah',
          tanggal,
          keterangan: keterangan.trim() || 'Libur Nasional / Sekolah'
        },
        user?.sesi
      );

      addToast(res.pesan || 'Hari libur berhasil ditandai', 'success');
      setTanggal('');
      setKeterangan('');
      loadHolidays();
    } catch (err) {
      addToast(err.message || 'Gagal menambahkan hari libur', 'error');
    }
  };

  const handleDeleteHoliday = async (tgl) => {
    if (!window.confirm(`Hapus status libur untuk tanggal ${tgl}?`)) return;
    try {
      const res = await apiCall(
        'kelolaLibur',
        {
          aksi: 'hapus',
          tanggal: tgl
        },
        user?.sesi
      );

      addToast(res.pesan || 'Hari libur dihapus', 'success');
      loadHolidays();
    } catch (err) {
      addToast(err.message || 'Gagal menghapus hari libur', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Holiday Card */}
      <div className="card p-4 sm:p-5">
        <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#172B4D] mb-1">
          Tandai Hari Libur Sekolah
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Pada tanggal yang ditandai libur, sistem scanner akan terkunci otomatis dan tidak ada absensi / alfa yang dihitung.
        </p>

        <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Libur</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="input-field text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan Libur</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Keterangan hari libur (Hari Guru, Libur Semester, dll)"
              className="input-field text-xs"
            />
          </div>

          <button
            type="submit"
            className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tandai Libur</span>
          </button>
        </form>
      </div>

      {/* Holiday List */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-heading font-bold text-sm text-[#172B4D] mb-3">
          Daftar Hari Libur Terjadwal
        </h3>

        {holidays.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {holidays.map((h, idx) => (
              <div key={idx} className="py-3 px-2 flex items-center justify-between gap-3 text-sm flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="font-heading text-[#172B4D] block">
                      {h.hari}, {h.tanggal}
                    </strong>
                    <span className="text-xs text-slate-500 font-medium">{h.keterangan}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteHoliday(h.tanggal)}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus Tanggal Libur"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm font-medium">
            {loading ? 'Memuat data libur...' : 'Belum ada hari libur khusus yang ditandai.'}
          </div>
        )}
      </div>
    </div>
  );
}
