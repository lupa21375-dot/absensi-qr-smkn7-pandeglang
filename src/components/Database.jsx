import React from 'react';
import { Database as DbIcon, ExternalLink, ShieldCheck, AlertCircle, Table } from 'lucide-react';

export default function Database({ user, addToast }) {
  const defaultSheetUrl = 'https://docs.google.com/spreadsheets/d/1b0yhAPVYVKcgVi667AAyqmhZt-PksWLWImXoHahBCQc/edit?usp=sharing';
  const targetUrl = user?.dbUrl || defaultSheetUrl;

  const handleOpenDatabase = () => {
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="card p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
            <DbIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#172B4D]">
              Database Google Spreadsheet
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Akses langsung ke pusat data absensi siswa SMKN 7 Pandeglang
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Semua transaksi absensi (Masuk, Pulang, Izin), data siswa, akun guru, dan hari libur tersimpan secara otomatis dan aman di dalam Google Sheets.
        </p>

        {/* 5 Tab Structure Guide */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172B4D]">
            <Table className="w-4 h-4 text-blue-600" />
            <span>Struktur 5 Tab Resmi Database:</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 pl-5 list-disc">
            <li><strong>DATA_SISWA</strong>: Berisi 1.083 data siswa, kelas, jurusan, dan kode QR unik.</li>
            <li><strong>ABSENSI</strong>: Log kehadiran harian siswa (Masuk & Pulang).</li>
            <li><strong>IZIN</strong>: Log catatan perizinan siswa dan guru pencatatnya.</li>
            <li><strong>AKUN</strong>: Kredensial username, hashed password, dan role akun.</li>
            <li><strong>HARI_LIBUR</strong>: Kalender tanggal libur sekolah resmi.</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Catatan Penting Operator:</strong>
            Jangan mengurutkan (*Sort Range*) atau menghapus baris di tab <code>ABSENSI</code> dan <code>IZIN</code> secara manual karena scanner membaca riwayat terkini. Jika ingin menyortir, gunakan fitur <strong>Filter View</strong> bawaan Google Sheets.
          </div>
        </div>

        <button
          onClick={handleOpenDatabase}
          className="btn-primary w-full py-3 px-6 rounded-xl font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <span>Buka Google Spreadsheet Sekarang</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
