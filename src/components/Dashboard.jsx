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
  CheckCircle2,
  Flag,
  HeartHandshake,
  Award,
  AlertCircle
} from 'lucide-react';
import { apiCall, getDeviceTime, getTodayScheduleRules } from '../utils/api';
import StockTrendChart from './StockTrendChart';

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
  const circleRef = useRef(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const devTime = getDeviceTime();
      // Jika sudah malam setelah jam 19:30 (Habis Isya), dashboard menampilkan status siap untuk esok hari (semua 0)
      const isNightReset = devTime.jam >= 19 && devTime.menit >= 30;

      const res = await apiCall('getDashboard', { limitRiwayat: 30, tanggal: devTime.tgl, _t: Date.now() }, user?.sesi);
      
      if (isNightReset) {
        // Tampilkan keadaan segar (semua 0) menjelang hari esok
        setData({
          ...res,
          keterangan: 'Sesi hari ini selesai. Sistem siap untuk aktivitas esok hari.',
          hadir: 0,
          terlambat: 0,
          izin: 0,
          pulang: 0,
          alfa: 0,
          riwayat: []
        });
      } else {
        setData(res);
      }

      if (bentoRef.current) {
        gsap.fromTo(
          bentoRef.current.children,
          { opacity: 0, y: 25, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.5, ease: 'power2.out' }
        );
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
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

  // Day detection for Upacara (Senin) & Jumtak (Jumat)
  const hariLower = String(data.hari || '').toLowerCase();
  const dow = new Date().getDay();
  const isSenin = hariLower.includes('senin') || dow === 1;
  const isJumat = hariLower.includes('jumat') || dow === 5;

  // Dynamic schedule rules
  const todayRules = getTodayScheduleRules();
  const batasTepatWaktuStr = (todayRules.batasTepatWaktu || '07:15').replace(':', '.') + ' WIB';
  const [cutH, cutM] = (todayRules.batasTepatWaktu || '07:15').split(':').map(Number);
  const cutoffMinutes = cutH * 60 + cutM;

  // Title and context for ceremonial / morning activity
  let eventTitle = 'Ketepatan Waktu Siswa';
  let eventSubtitle = `Persentase kehadiran siswa tepat waktu sebelum batas toleransi ${batasTepatWaktuStr}.`;
  let EventIcon = Award;

  if (isSenin) {
    eventTitle = 'Partisipasi Upacara Bendera';
    eventSubtitle = `Siswa yang hadir tepat waktu (sebelum ${batasTepatWaktuStr}) dihitung mengikuti upacara.`;
    EventIcon = Flag;
  } else if (isJumat) {
    eventTitle = "Partisipasi Jum'at Taqwa (Jumtak)";
    eventSubtitle = `Siswa yang hadir tepat waktu (sebelum ${batasTepatWaktuStr}) dihitung mengikuti Jumtak.`;
    EventIcon = HeartHandshake;
  }

  // Determine if today is an active school day with attendance
  const isHariAktif = data.kondisi === 'AKTIF';
  const devTime = getDeviceTime();
  const isAfterUpacaraCutoff = devTime.menit >= cutoffMinutes;
  const isAfterMasukCutoff = devTime.menit >= 13 * 60; // 13:00 WIB

  // Participation logic:
  // If weekend / holiday / non-active day: everything is 0 (no false penalties on weekend!)
  let siswaIkut = 0;
  let persenIkut = 0;
  let siswaTidakIkut = 0;
  let persenTidakIkut = 0;

  if (isHariAktif) {
    siswaIkut = data.hadir || 0;
    persenIkut = totalSiswa ? Math.round((siswaIkut / totalSiswa) * 100) : 0;

    // Only mark students as "Tidak Mengikuti" after 07.18 WIB cutoff
    // Before 07.18 WIB, students are still arriving at the gate
    if (isAfterUpacaraCutoff) {
      siswaTidakIkut = Math.max(0, totalSiswa - siswaIkut);
      persenTidakIkut = 100 - persenIkut;
    }
  }

  // Circular progress math (radius 48 -> circumference ~301.59)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isHariAktif ? circumference - (persenIkut / 100) * circumference : circumference;

  // Students who have not scanned yet (ONLY on active school days)
  const belumScan = isHariAktif ? Math.max(0, totalSiswa - totalMasuk - (data.izin || 0)) : 0;
  const tampilkanAlfa = isAfterMasukCutoff && isHariAktif;
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
      {/* Welcome Header */}
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

      {/* FEATURED: Circular Progress Chart (Upacara / Jumtak / Kedisiplinan) */}
      <div className="card p-5 sm:p-6 tilt-card border border-white/80 shadow-xl relative overflow-hidden bg-gradient-to-br from-white/90 via-white/80 to-blue-50/50">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-200/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3C6DB1] to-[#172B4D] text-white flex items-center justify-center shrink-0 shadow-md">
            <EventIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#172B4D]">
              {eventTitle}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {!isHariAktif
                ? 'Tidak ada kegiatan upacara atau absensi pada akhir pekan / hari libur.'
                : eventSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Circular Donut Diagram */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="11"
                  fill="none"
                />
                {/* Dynamic Progress Ring */}
                <circle
                  ref={circleRef}
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke={persenIkut >= 75 ? '#16845B' : persenIkut >= 50 ? '#315E9E' : '#B7791F'}
                  strokeWidth="11"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Stat Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-heading font-extrabold text-3xl text-[#172B4D] tabular-nums tracking-tight">
                  {persenIkut}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mengikuti
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Statistics Breakdown */}
          <div className="flex-1 w-full space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Box 1: Mengikuti */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Mengikuti</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800">
                    {persenIkut}%
                  </span>
                </div>
                <div className="font-heading font-extrabold text-2xl text-emerald-800 mt-1 tabular-nums">
                  {siswaIkut} <span className="text-xs font-medium text-emerald-700">/ {totalSiswa} Siswa</span>
                </div>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  {!isHariAktif ? 'Sekolah libur / akhir pekan' : `Scan masuk sebelum ${batasTepatWaktuStr}`}
                </span>
              </div>

              {/* Box 2: Tidak Mengikuti */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Tidak Mengikuti</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-200 text-amber-800">
                    {persenTidakIkut}%
                  </span>
                </div>
                <div className="font-heading font-extrabold text-2xl text-amber-800 mt-1 tabular-nums">
                  {siswaTidakIkut} <span className="text-xs font-medium text-amber-700">/ {totalSiswa} Siswa</span>
                </div>
                <span className="text-[11px] text-amber-700 mt-1 block">
                  {!isHariAktif
                    ? 'Tidak ada kegiatan hari ini'
                    : !isAfterUpacaraCutoff
                    ? 'Sesi masuk sedang berlangsung'
                    : 'Terlambat, izin, atau belum hadir'}
                </span>
              </div>
            </div>

            {/* Explanatory Rule Pill */}
            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2 text-xs text-slate-600">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {!isHariAktif
                  ? 'Sistem absensi dan upacara bendera akan mulai aktif pada hari Senin pukul 06.00 WIB.'
                  : `Siswa yang datang terlambat (scan lewat ${batasTepatWaktuStr}) otomatis tidak dihitung sebagai peserta upacara/jumtak.`}
              </span>
            </div>
          </div>
        </div>
      </div>

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
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Lewat {batasTepatWaktuStr}</span>
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

      {/* Stock-Style Monthly Attendance Trend Chart */}
      <StockTrendChart />

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
