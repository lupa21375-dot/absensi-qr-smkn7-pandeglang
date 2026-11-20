import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Camera, ShieldCheck, Clock } from 'lucide-react';

export default function PusatBantuan({ user }) {
  const [openIdx, setOpenIdx] = useState(0);

  const GUIDES = [
    {
      title: '1. Scan Masuk (Pagi)',
      desc: 'Pilih tab Masuk, arahkan kamera ke kartu QR siswa. Jendela scan dibuka pukul 06.00 – 13.00 WIB. Siswa yang scan sebelum pukul 07.18 WIB tercatat HADIR tepat waktu. Siswa yang scan mulai pukul 07.18 WIB otomatis tercatat HADIR (TERLAMBAT X menit) dengan durasi telat yang dihitung sistem.'
    },
    {
      title: '2. Scan Pulang (Sore)',
      desc: 'Pilih tab Pulang. Jendela dibuka pukul 15.30 – 18.00 WIB. Syarat utama: siswa harus sudah melakukan scan masuk pada pagi hari. Jika belum pernah scan masuk, sistem akan menolak scan pulang.'
    },
    {
      title: '3. Scan Izin (Di Sekolah & Dari Rumah)',
      desc: 'Pilih tab Izin dan wajib isi keterangan izin (maksimal 100 karakter, misalnya "Sakit demam"). Siswa yang sakit di rumah dapat memfotokan kartu QR miliknya via WhatsApp ke wali kelas/guru piket, lalu guru mengarahkan scanner kamera ke layar foto tersebut. Siswa yang sudah masuk pagi lalu sakit di sekolah juga dapat discan di tab Izin.'
    },
    {
      title: '4. Perhitungan ALFA (Dihitung Dinamis)',
      desc: 'Status ALFA tidak disimpan manual ke spreadsheet. Sistem otomatis menghitung ALFA saat rekapitulasi dibuka, yaitu bagi setiap siswa aktif yang tidak memiliki catatan HADIR maupun IZIN pada hari aktif sekolah tersebut.'
    },
    {
      title: '5. Kamera Tidak Terbuka atau Izin Ditolak',
      desc: 'Jika kamera HP/laptop tidak menyala, ketuk ikon gembok 🔒 di sebelah kiri address bar browser, ubah izin Kamera menjadi "Izinkan" (Allow), lalu segarkan halaman atau klik tombol "Coba Nyalakan Kamera Lagi".'
    },
    {
      title: '6. Hari Libur & Akhir Pekan',
      desc: 'Hari Sabtu, Minggu, dan tanggal libur yang ditandai administrator akan menonaktifkan sistem scanner secara otomatis. Pada hari tersebut tidak ada siswa yang dihitung Alfa.'
    }
  ];

  if (user?.role === 'admin') {
    GUIDES.push({
      title: '7. Menu Khusus Administrator',
      desc: 'Admin memiliki wewenang untuk: menambah dan menonaktifkan akun guru/petugas, mereset password, mengelola kalender libur sekolah, mengunduh rekapitulasi lengkap dalam format Excel dan PDF, mencetak kartu pelajar ber-QR code, serta membuka database Google Spreadsheet secara langsung.'
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="card p-6 sm:p-7">
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#315E9E] flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#172B4D]">
              Pusat Panduan & Bantuan
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Petunjuk operasional lengkap penggunaan Sistem Absensi QR SMKN 7 Pandeglang
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {GUIDES.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white/60 transition-colors"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full py-3.5 px-4 flex items-center justify-between text-left font-heading font-bold text-sm text-[#172B4D] hover:text-[#315E9E] transition-colors cursor-pointer"
                >
                  <span>{item.title}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100/70 bg-blue-50/20">
                    {item.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
