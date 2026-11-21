import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Search,
  FileText,
  Printer,
  ChevronDown
} from 'lucide-react';
import { apiCall, getDeviceTime } from '../utils/api';
import { ALL_STUDENTS } from '../data/students';

export default function Rekap({ user, addToast }) {
  const [period, setPeriod] = useState('h'); // h = hari ini, m = minggu ini, b = bulan ini, c = custom
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rekapData, setRekapData] = useState(null);

  const isAdmin = user?.role === 'admin';

  // Distinct classes list
  const classList = [...new Set(ALL_STUDENTS.map((s) => s.kelas))].sort((a, b) => {
    const order = { X: 0, XI: 1, XII: 2 };
    const orderA = order[a.split(' ')[0]] ?? 99;
    const orderB = order[b.split(' ')[0]] ?? 99;
    return orderA - orderB || a.localeCompare(b, 'id', { numeric: true });
  });

  // Calculate default dates on period change
  const applyPeriod = (val) => {
    setPeriod(val);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let start = new Date(now);
    if (val === 'm') {
      const day = (now.getDay() + 6) % 7; // Monday start
      start.setDate(now.getDate() - day);
    } else if (val === 'b') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (val !== 'c') {
      setDari(isoOf(start));
      setSampai(isoOf(now));
    }
  };

  useEffect(() => {
    applyPeriod('h');
  }, []);

  const handleFetchRekap = async () => {
    setLoading(true);
    try {
      const res = await apiCall(
        'getRekap',
        {
          dari,
          sampai,
          kelas: selectedClass,
          q: searchQuery
        },
        user?.sesi
      );
      setRekapData(res);
      addToast(`Rekap dimuat: ${res.data?.length || 0} baris data`, 'success');
    } catch (err) {
      addToast(err.message || 'Gagal memuat rekap', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportExcel = () => {
    if (!rekapData || !rekapData.data || rekapData.data.length === 0) {
      addToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const headers = ['Tanggal', 'Hari', 'Nama', 'Kelas', 'Jurusan', 'Jam Masuk', 'Status Masuk', 'Jam Pulang', 'Keterangan Izin'];
    const rows = rekapData.data.map((x) => [
      x.tanggal,
      x.hari,
      x.nama,
      x.kelas,
      x.jurusan,
      x.jamMasuk,
      x.status,
      x.jamPulang,
      x.izinKeterangan
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

    const fileName = `Rekap_Absensi_SMKN7_${(rekapData.dari || 'tgl').replace(/\//g, '-')}_sd_${(rekapData.sampai || 'tgl').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addToast('File Excel berhasil diunduh', 'success');
  };

  // Export to PDF
  const exportPdf = () => {
    if (!rekapData || !rekapData.data || rekapData.data.length === 0) {
      addToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REKAP ABSENSI SISWA SMKN 7 PANDEGLANG', 14, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Periode: ${rekapData.dari} s.d. ${rekapData.sampai} | Kelas: ${selectedClass || 'Semua Kelas'}`, 14, 20);

    const headers = [['Tanggal', 'Hari', 'Nama Siswa', 'Kelas', 'Masuk', 'Status', 'Pulang', 'Keterangan']];
    const rows = rekapData.data.map((x) => [
      x.tanggal,
      x.hari,
      x.nama,
      x.kelas,
      x.jamMasuk,
      x.status,
      x.jamPulang,
      x.izinKeterangan || '-'
    ]);

    const tableOptions = {
      head: headers,
      body: rows,
      startY: 24,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [23, 43, 77], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 253] }
    };

    if (typeof doc.autoTable === 'function') {
      doc.autoTable(tableOptions);
    } else if (typeof autoTable === 'function') {
      autoTable(doc, tableOptions);
    }

    const fileName = `Rekap_Absensi_SMKN7_${(rekapData.dari || 'tgl').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    addToast('File PDF berhasil dibuat', 'success');
  };

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
    <div className="space-y-4">
      {/* Filter Card */}
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Period Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Periode</label>
            <select
              value={period}
              onChange={(e) => applyPeriod(e.target.value)}
              className="input-field text-xs font-bold"
            >
              <option value="h">Hari Ini</option>
              <option value="m">Minggu Ini</option>
              <option value="b">Bulan Ini</option>
              <option value="c">Pilih Tanggal Manual</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dari}
              onChange={(e) => {
                setDari(e.target.value);
                setPeriod('c');
              }}
              className="input-field text-xs"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={sampai}
              onChange={(e) => {
                setSampai(e.target.value);
                setPeriod('c');
              }}
              className="input-field text-xs"
            />
          </div>

          {/* Class Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Filter Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field text-xs font-semibold"
            >
              <option value="">Semua Kelas</option>
              {classList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Name Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Cari Nama</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama siswa..."
              className="input-field text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={handleFetchRekap}
            disabled={loading}
            className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Filter className="w-4 h-4" />
            <span>{loading ? 'Menghitung Rekap...' : 'Tampilkan Rekapitulasi'}</span>
          </button>
        </div>
      </div>

      {/* Rekap Results */}
      {rekapData && (
        <div className="space-y-4">
          {/* Summary Badges & Action Bar */}
          <div className="card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full badge-ok">
                Hadir: {rekapData.ringkasan?.hadir || 0}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full badge-late">
                Terlambat: {rekapData.ringkasan?.terlambat || 0}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full badge-iz">
                Izin: {rekapData.ringkasan?.izin || 0}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full badge-pl">
                Pulang: {rekapData.ringkasan?.pulang || 0}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full badge-al">
                Alfa: {rekapData.ringkasan?.alfa || 0}
              </span>
              <span className="text-xs text-slate-500 font-medium ml-1">
                ({rekapData.dari} – {rekapData.sampai} • {rekapData.jumlahHariAktif || 1} hari aktif)
              </span>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={exportExcel}
                  className="btn-secondary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={exportPdf}
                  className="btn-secondary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Export PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="card p-0 overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#172B4D] text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3 font-heading font-bold">Tanggal</th>
                    <th className="py-3 px-3 font-heading font-bold">Nama Siswa</th>
                    <th className="py-3 px-3 font-heading font-bold">Kelas</th>
                    <th className="py-3 px-3 font-heading font-bold">Masuk</th>
                    <th className="py-3 px-3 font-heading font-bold">Status</th>
                    <th className="py-3 px-3 font-heading font-bold">Pulang</th>
                    <th className="py-3 px-3 font-heading font-bold">Keterangan Izin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapData.data && rekapData.data.length > 0 ? (
                    rekapData.data.slice(0, 800).map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-medium">
                          {row.tanggal}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-[#172B4D]">
                          {row.nama}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                          {row.kelas}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-slate-600">
                          {row.jamMasuk}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadge(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono tabular-nums text-slate-600">
                          {row.jamPulang}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                          {row.izinKeterangan || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Tidak ada catatan absensi pada periode atau filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {rekapData.data && rekapData.data.length > 800 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
                Menampilkan 800 baris pertama di web. File unduhan Excel / PDF berisi seluruh data lengkap.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
