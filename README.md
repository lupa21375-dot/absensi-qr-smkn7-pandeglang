# 🎓 Absensi QR — SMKN 7 Pandeglang
Sistem Absensi Digital Berbasis QR Code untuk SMKN 7 Pandeglang.
Dibangun menggunakan arsitektur modern **React (Vite) + Tailwind CSS + GSAP + Web Audio API** (Frontend) yang terhubung langsung ke **Google Apps Script & Google Sheets** (Backend & Database).

---

## 🚀 Fitur Unggulan

1. **Scanner QR Multi-Mode**:
   - **Scan Masuk**: 06.00 – 13.00 WIB (Batas tepat waktu 07.18 WIB, lewat itu tercatat *HADIR (TERLAMBAT X menit)*).
   - **Scan Pulang**: 15.30 – 18.00 WIB (Otomatis terkunci sebelum jam 15.30 dan wajib sudah scan masuk).
   - **Scan Izin**: 06.00 – 18.00 WIB (Wajib keterangan izin, mendukung izin di sekolah maupun dari rumah via foto WA).
2. **Audio & Sensory Feedback**:
   - Web Audio API dual-tone chime (sukses) & buzz tone (ditolak).
   - Haptic feedback vibration pada smartphone.
3. **Dashboard Real-Time**:
   - Bento grid statistik (Hadir, Terlambat, Izin, Pulang, Alfa).
   - Indikator status gerbang sekolah dengan pulsing live dot.
   - Perhitungan ALFA dinamis otomatis.
4. **Data Siswa & Kartu QR**:
   - 1.083 data siswa dalam 33 kelas (X, XI, XII).
   - Generator & pencetakan kartu pelajar ber-QR code standar ID-1 (85.6mm x 54mm).
5. **Rekapitulasi Lengkap**:
   - Filter periode (Hari ini, Minggu ini, Bulan ini, Kustom).
   - Filter kelas & pencarian nama.
   - Ekspor laporan ke **Excel (.xlsx)** dan **PDF Landscape**.
6. **Manajemen Admin**:
   - Kelola akun guru/petugas, reset password, tandai hari libur, tautan langsung ke database Google Sheets.

---

## 🛠️ Cara Menjalankan Secara Lokal

```bash
# 1. Masuk ke folder project
cd "C:\Users\User\Desktop\absensi-smkn7"

# 2. Jalankan development server
npm run dev

# 3. Atau jalankan hasil build produksi
npm run build
npm run preview
```

---

## 🌐 Cara Deploy ke GitHub Pages / Vercel

### Opsi A: Deploy ke Vercel (Paling Cepat & Otomatis)
1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub.
2. Klik **Add New Project** $\rightarrow$ Pilih repositori `absensi-smkn7`.
3. Klik **Deploy** (Pengaturan Vite sudah otomatis terdeteksi).

### Opsi B: Deploy ke GitHub Pages
1. Push folder ini ke repositori GitHub.
2. Jalankan `npm run build` yang menghasilkan folder `dist/`.
3. Di tab Settings repositori GitHub $\rightarrow$ **Pages** $\rightarrow$ Pilih source **Deploy from a branch** $\rightarrow$ pilih branch `gh-pages` atau folder `/dist`.
