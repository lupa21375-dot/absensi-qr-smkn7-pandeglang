import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Users,
  Clock,
  UserCheck,
  AlertTriangle,
  UserX,
  FileText,
  Calendar,
  KeyRound,
  Printer,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { apiCall, getDeviceTime } from '../utils/api';

export default function Dashboard({ user, onNavigate, addToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    hari: '',
    tanggal: '',
    kondisi: 'AKTIF',
    keterangan: '',
    totalSiswa: 1083,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    pulang: 0,
    alfa: 0,
    riwayat: []
  });

  const bentoRef = useRef(null);
  const hadirCountRef = useRef(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiCall('getDashboard', { limitRiwayat: 30 }, user?.sesi);
      setData(res);

      if (bentoRef.current) {
        gsap.fromTo(
          bentoRef.current.children,
          { opacity: 0, y: 25, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.5, ease: 'power2.out' }
        );
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
      // Clean fallback using real device date & empty stats (no dummy data)
      const devTime = getDeviceTime();
      setData((prev) => ({
        ...prev,
        hari: 'Hari Ini',
        tanggal: devTime.tgl,
        kondisi: 'AKTIF',
        totalSiswa: 1083,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        pulang: 0,
        alfa: 0,
        riwayat: []
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalMasuk = (data.hadir || 0) + (data.terlambat || 0);
  const totalSiswa = data.totalSiswa || 1083;
  const percentage = totalSiswa ? Math.round((totalMasuk / totalSiswa) * 100) : 0;

  // Determine if morning gate has passed 13:00 WIB
  const devTime = getDeviceTime();
  const isAfterMasukCutoff = devTime.menit >= 13 * 60; // 13:00 WIB

  // Students who have not scanned yet
  const belumScan = Math.max(0, totalSiswa - totalMasuk - (data.izin || 0));

  // Alfa is ONLY displayed after gate masuk closes (13:00 WIB) on active days
  const tampilkanAlfa = isAfterMasukCutoff && data.kondisi === 'AKTIF';
  const angkaAlfa = tampilkanAlfa ? (data.alfa || belumScan) : 0;

  const getStatusBadge = (status) => {
    if (!status) return 'badge-gr';
    if (status.startsWith('HADIR (TERLAMBAT')) return 'badge-late';
    if (status.startsWith('HADIR')) return 'badge-ok';
    if (status.startsWith('IZIN')) return 'badge-iz';
    if (status.startsWith('ALFA')) return 'badge-al';
    if (status.startsWith('PULANG')) return 'badge-pl';
    return 'badge-gr';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#172B4D] tracking-tight">
            Halo, {user?.nama || 'Petugas Piket'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {data.hari ? `${data.hari}, ${data.tanggal}` : 'Sistem Absensi Digital SMKN 7 Pandeglang'}
          </p>
        </div>

        {user?.role === 'admin' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('scan')}
              className="btn-primary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Buka Scanner</span>
            </button>
            <button
              onClick={() => onNavigate('rekap')}
              className="btn-secondary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Lihat Rekap</span>
            </button>
          </div>
        )}
      </div>

      {/* Holiday / Inactive Notice */}
      {data.kondisi && data.kondisi !== 'AKTIF' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm font-semibold">
            {data.kondisi === 'LIBUR'
              ? `Hari ini Libur Sekolah: ${data.keterangan || 'Libur Nasional'}`
              : `Tidak ada jadwal absensi aktif hari ini (${data.keterangan || data.hari}).`}
          </div>
        </div>
      )}

      {/* Bento Grid Analytics with 3D Depth */}
      <div ref={bentoRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 perspective-1000">
        {/* Big Bento Card: Hadir Tepat Waktu */}
        <div className="col-span-2 row-span-2 card p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden tilt-card group">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hadir Tepat Waktu
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs">
                OK
              </span>
            </div>
            <div
              ref={hadirCountRef}
              className="font-heading font-extrabold text-5xl sm:text-7xl text-emerald-700 mt-3 tabular-nums"
              style={{ transform: 'translateZ(24px)' }}
            >
              {data.hadir || 0}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2">
              <span className="font-bold text-slate-700">{percentage}%</span> dari total{' '}
              <span className="font-bold text-slate-700">{totalSiswa}</span> siswa aktif
            </p>
          </div>

          <div className="mt-6">
            <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Terlambat */}
        <div className="card p-5 relative overflow-hidden tilt-card group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Terlambat</span>
          <div
            className="font-heading font-extrabold text-3xl sm:text-4xl text-amber-700 mt-2 tabular-nums"
            style={{ transform: 'translateZ(18px)' }}
          >
            {data.terlambat || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Lewat 07.18 WIB</span>
        </div>

        {/* Izin */}
        <div className="card p-5 relative overflow-hidden tilt-card group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-500/15 blur-xl pointer-events-none" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Izin</span>
          <div
            className="font-heading font-extrabold text-3xl sm:text-4xl text-blue-700 mt-2 tabular-nums"
            style={{ transform: 'translateZ(18px)' }}
          >
            {data.izin || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Tercatat di piket</span>
        </div>

        {/* Pulang */}
        <div className="card p-5 relative overflow-hidden tilt-card group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-500/15 blur-xl pointer-events-none" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pulang</span>
          <div
            className="font-heading font-extrabold text-3xl sm:text-4xl text-indigo-700 mt-2 tabular-nums"
            style={{ transform: 'translateZ(18px)' }}
          >
            {data.pulang || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Scan sore 15.30+</span>
        </div>

        {/* Alfa / Status Belum Scan */}
        <div className="card p-5 relative overflow-hidden tilt-card group">
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl pointer-events-none ${tampilkanAlfa ? 'bg-rose-500/15' : 'bg-slate-400/15'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {tampilkanAlfa ? 'Alfa (Tidak Hadir)' : 'Belum Scan'}
          </span>
          <div
            className={`font-heading font-extrabold text-3xl sm:text-4xl mt-2 tabular-nums ${tampilkanAlfa ? 'text-rose-700' : 'text-slate-600'}`}
            style={{ transform: 'translateZ(18px)' }}
          >
            {tampilkanAlfa ? angkaAlfa : belumScan}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            {tampilkanAlfa ? 'Dihitung otomatis hari ini' : 'Dihitung Alfa setelah 13.00 WIB'}
          </span>
        </div>
      </div>

      {/* Admin Quick Actions */}
      {user?.role === 'admin' && (
        <div className="card p-4 sm:p-5">
          <h3 className="font-heading font-bold text-sm text-[#172B4D] mb-3">Pintasan Cepat Admin</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onNavigate('libur')}
              className="p-3 rounded-2xl bg-white/60 hover:bg-white border border-slate-200/60 flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-blue-900 transition-all shadow-sm cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Atur Hari Libur</span>
            </button>
            <button
              onClick={() => onNavigate('akun')}
              className="p-3 rounded-2xl bg-white/60 hover:bg-white border border-slate-200/60 flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-blue-900 transition-all shadow-sm cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Kelola Akun Guru</span>
            </button>
            <button
              onClick={() => onNavigate('qr')}
              className="p-3 rounded-2xl bg-white/60 hover:bg-white border border-slate-200/60 flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-blue-900 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cetak Kartu QR</span>
            </button>
            <button
              onClick={() => onNavigate('rekap')}
              className="p-3 rounded-2xl bg-white/60 hover:bg-white border border-slate-200/60 flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-blue-900 transition-all shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Rekap Excel/PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity List */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#172B4D]">Aktivitas Scan Hari Ini</h3>
            <p className="text-xs text-slate-500 font-medium">Log scan real-time kehadiran siswa yang masuk atau izin</p>
          </div>
          <button
            onClick={() => onNavigate('riwayat')}
            className="text-xs font-bold text-[#315E9E] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Semua riwayat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {data.riwayat && data.riwayat.length > 0 ? (
          <div className="divide-y divide-slate-100/80">
            {data.riwayat.slice(0, 10).map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-sm flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-500 tabular-nums">
                    {item.jam}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
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
          <div className="py-8 text-center text-slate-400 text-xs sm:text-sm font-medium">
            Belum ada aktivitas scan siswa hari ini.
          </div>
        )}
      </div>
    </div>
  );
}
