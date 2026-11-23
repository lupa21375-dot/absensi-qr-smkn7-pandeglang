import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, Clock } from 'lucide-react';
import { apiCall } from '../utils/api';

export default function Riwayat({ user, addToast }) {
  const [loading, setLoading] = useState(true);
  const [riwayat, setRiwayat] = useState([]);
  const [search, setSearch] = useState('');

  const loadRiwayat = async () => {
    setLoading(true);
    try {
      // Selalu bypass cache dengan menambahkan timestamp/fresh parameter
      const res = await apiCall('getDashboard', { limitRiwayat: 200, _t: Date.now() }, user?.sesi);
      setRiwayat(res.riwayat || []);
      addToast('Data riwayat berhasil diperbarui', 'success');
    } catch (err) {
      addToast(err.message || 'Gagal memuat riwayat', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiwayat();
  }, []);

  const getStatusBadge = (status) => {
    if (status.startsWith('HADIR (TERLAMBAT')) return 'badge-late';
    if (status.startsWith('HADIR')) return 'badge-ok';
    if (status.startsWith('IZIN')) return 'badge-iz';
    if (status.startsWith('ALFA')) return 'badge-al';
    if (status.startsWith('PULANG')) return 'badge-pl';
    return 'badge-gr';
  };

  const filtered = riwayat.filter(
    (r) =>
      !search ||
      r.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.kelas.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau kelas..."
            className="input-field pl-10 text-xs"
          />
        </div>

        <button
          onClick={loadRiwayat}
          disabled={loading}
          className="btn-secondary w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Riwayat List */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-extrabold text-base text-[#172B4D]">
            Riwayat Scan Hari Ini ({filtered.length} Aktivitas)
          </h3>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="py-3 px-2 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-white/40 rounded-xl transition-colors flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-slate-500 tabular-nums">
                    {item.jam}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                    {item.tipe}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-[#172B4D] block truncate">{item.nama}</span>
                    <span className="text-xs text-slate-400 block truncate">
                      {item.kelas} {item.keterangan ? `• ${item.keterangan}` : ''}
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusBadge(item.status)}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">
            {loading ? 'Memuat log aktivitas...' : 'Belum ada data scan yang cocok hari ini.'}
          </div>
        )}
      </div>
    </div>
  );
}
