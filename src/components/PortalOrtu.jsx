import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Bell,
  BellRing,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Smartphone,
  LogOut,
  Calendar,
  HeartHandshake,
  Award,
  Sparkles
} from 'lucide-react';
import { getDeviceTime, LS } from '../utils/api';

export default function PortalOrtu({ user, onLogout, addToast }) {
  const siswa = user?.siswa;
  const [notifEnabled, setNotifEnabled] = useState(
    () => typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [digitalQrUrl, setDigitalQrUrl] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('status'); // 'status' | 'kartu' | 'riwayat'

  // Generate child's digital QR card
  useEffect(() => {
    if (siswa?.kode) {
      QRCode.toDataURL(siswa.kode, {
        width: 320,
        margin: 1,
        color: { dark: '#172B4D', light: '#FFFFFF' }
      }).then(setDigitalQrUrl).catch((e) => console.warn(e));
    }
  }, [siswa?.kode]);

  // Load notifications for this child
  useEffect(() => {
    const allNotifs = LS.get('sabsensi_notif_log') || [];
    const childNotifs = allNotifs.filter((n) => n.studentKode === siswa?.kode);
    setNotifications(childNotifs);
  }, [siswa?.kode]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      addToast('Browser ponsel Anda tidak mendukung Web Notification', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifEnabled(true);
        addToast('Notifikasi berhasil diaktifkan di ponsel ini!', 'success');

        // Trigger welcome test notification
        showTestNotification();
      } else {
        setNotifEnabled(false);
        addToast('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser.', 'error');
      }
    } catch (err) {
      addToast('Gagal meminta izin notifikasi', 'error');
    }
  };

  const showTestNotification = () => {
    const title = 'S-Absensi QR — SMKN 7 Pandeglang';
    const options = {
      body: `🟢 Notifikasi aktif! Anda akan menerima pemberitahuan otomatis setiap kali ${siswa?.nama || 'Ananda'} melakukan scan absensi di sekolah.`,
      icon: './logo.png',
      badge: './logo.png',
      vibrate: [200, 100, 200]
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch {
        // Fallback for service worker notification
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            ...options
          });
        }
      }
    }
  };

  // Live status mock or retrieved from local logs
  const latestNotif = notifications[0];
  const currentTime = getDeviceTime();

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      {/* Top Header Card for Parent */}
      <div className="card p-5 sm:p-6 flex items-center justify-between border-blue-200/60 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white p-1.5 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
            <img src="./logo.png" alt="Logo SMKN 7" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-blue-100 text-[#315E9E]">
                Portal Wali Murid
              </span>
              <span className="text-[10px] text-slate-400 font-medium">HP 1/2 Terdaftar</span>
            </div>
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#172B4D] mt-0.5 leading-tight">
              {siswa?.nama || 'Siswa SMKN 7'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Kelas {siswa?.kelas} • Kode: <span className="font-mono text-[#315E9E] font-bold">{siswa?.kode}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
          title="Keluar Sesi"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Notification Banner / Activation Pill */}
      <div className={`card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border transition-all ${
        notifEnabled
          ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
          : 'bg-amber-50/70 border-amber-200/80 text-amber-900'
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            notifEnabled ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-800'
          }`}>
            {notifEnabled ? <BellRing className="w-5 h-5 animate-bounce" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm">
              {notifEnabled ? 'Notifikasi Layar HP Aktif' : 'Aktifkan Notifikasi Layar HP'}
            </h4>
            <p className="text-xs opacity-80">
              {notifEnabled
                ? 'Pemberitahuan muncul di atas layar HP setiap kali ananda scan.'
                : 'Izinkan notifikasi agar laporan absensi muncul otomatis dari atas layar HP.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {!notifEnabled ? (
            <button
              onClick={requestNotificationPermission}
              className="btn-primary w-full sm:w-auto py-2 px-3.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Izinkan Notifikasi
            </button>
          ) : (
            <button
              onClick={showTestNotification}
              className="py-1.5 px-3 rounded-xl bg-emerald-200/80 hover:bg-emerald-300/80 text-emerald-900 text-xs font-bold transition-colors cursor-pointer"
            >
              Tes Notifikasi
            </button>
          )}
        </div>
      </div>

      {/* Navigation Pills inside Parent Portal */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'status' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Status Hari Ini
        </button>
        <button
          onClick={() => setActiveTab('kartu')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'kartu' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kartu QR Digital
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'riwayat' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Riwayat Notifikasi
        </button>
      </div>

      {/* Tab 1: Live Status Today */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Status Presensi Hari Ini ({currentTime.tgl})
            </span>

            {latestNotif ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-heading font-extrabold text-base text-emerald-900">
                    Aktivitas Terakhir: {latestNotif.mode}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  {latestNotif.body}
                </p>
                <span className="text-[10px] text-emerald-600 font-mono block">
                  Waktu: {new Date(latestNotif.timestamp).toLocaleTimeString('id-ID')} WIB
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2 text-center py-6">
                <Clock className="w-8 h-8 text-[#315E9E] mx-auto opacity-75" />
                <h4 className="font-heading font-bold text-sm text-[#172B4D]">
                  Belum Ada Riwayat Scan Hari Ini
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Begitu ananda tiba di sekolah dan kartu discan oleh petugas piket, status akan otomatis terupdate secara langsung di sini.
                </p>
              </div>
            )}

            {/* Monthly Attendance Summary Pill */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Hadir Tepat Waktu</span>
                <span className="font-heading font-extrabold text-xl text-emerald-900 block my-0.5">21</span>
                <span className="text-[10px] text-emerald-600 block">Hari</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Terlambat</span>
                <span className="font-heading font-extrabold text-xl text-amber-900 block my-0.5">1</span>
                <span className="text-[10px] text-amber-600 block">Kali</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-center">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">Izin Tercatat</span>
                <span className="font-heading font-extrabold text-xl text-blue-900 block my-0.5">0</span>
                <span className="text-[10px] text-blue-600 block">Hari</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Digital QR Card (Emergency backup if card is lost/forgotten) */}
      {activeTab === 'kartu' && (
        <div className="card p-6 flex flex-col items-center text-center space-y-4">
          <div>
            <h3 className="font-heading font-extrabold text-base text-[#172B4D]">
              Kartu Pelajar Digital Ananda
            </h3>
            <p className="text-xs text-slate-500">
              Dapat ditunjukkan atau disimpan di HP jika kartu fisik tertinggal di rumah.
            </p>
          </div>

          {/* Physical style ID card preview */}
          <div
            style={{ width: '85.6mm', height: '54mm' }}
            className="rounded-[4mm] border border-[#172B4D] bg-white text-[#172B4D] p-[4mm] flex items-center gap-[4mm] shadow-xl relative overflow-hidden select-none text-left shrink-0"
          >
            <div className="absolute top-0 left-0 right-0 h-[3mm] bg-[#172B4D]" />
            <div className="w-[34mm] h-[34mm] border border-slate-200 rounded-lg p-1 bg-white shrink-0 flex items-center justify-center">
              {digitalQrUrl && (
                <img src={digitalQrUrl} alt={siswa?.kode} className="w-full h-full object-contain" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-[36mm]">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <img src="./logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                  <span className="text-[8px] font-bold tracking-tight text-slate-500 uppercase">
                    SMKN 7 Pandeglang
                  </span>
                </div>
                <h4 className="font-heading font-extrabold text-[12px] leading-tight text-[#172B4D] line-clamp-2">
                  {siswa?.nama}
                </h4>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                  {siswa?.kelas}
                </p>
              </div>

              <div className="pt-1 border-t border-slate-200">
                <span className="text-[8px] text-slate-400 block font-medium">KODE KARTU SISWA:</span>
                <code className="text-[11px] font-mono font-bold tracking-widest text-[#315E9E] block">
                  {siswa?.kode}
                </code>
              </div>
            </div>
          </div>

          {digitalQrUrl && (
            <a
              href={digitalQrUrl}
              download={`Kartu_QR_${siswa?.nama}.png`}
              className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Simpan Gambar Barcode ke Galeri HP</span>
            </a>
          )}
        </div>
      )}

      {/* Tab 3: Notification History */}
      {activeTab === 'riwayat' && (
        <div className="card p-6 space-y-3">
          <h3 className="font-heading font-extrabold text-base text-[#172B4D]">
            Riwayat Notifikasi Kehadiran
          </h3>
          <p className="text-xs text-slate-500">
            Daftar seluruh notifikasi yang terkirim ke ponsel ini saat siswa melakukan scan.
          </p>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada riwayat notifikasi tersimpan di perangkat ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n, idx) => (
                <div key={idx} className="py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#315E9E] flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs text-[#172B4D]">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.timestamp).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
