// API client for Absensi QR - SMKN 7 Pandeglang
import { ALL_STUDENTS } from '../data/students';

export const CONFIG = {
  URL_API: 'https://script.google.com/macros/s/AKfycbxfVwPADDdN32ghE7Ci15vUVhgeqe8l2kuZ7DhQcKn2H5ifLmT3CKPQvrNm1qGVwDCn/exec',
  TOKEN: 'SMK7-SECRET-KEY-2026',
  TZ: 'Asia/Jakarta'
};

export const DEFAULT_SCHEDULE = {
  seninKamis: {
    masukBuka: '06:00',
    batasTepatWaktu: '07:15',
    masukTutup: '13:00',
    pulangBuka: '15:30',
    pulangTutup: '18:00'
  },
  jumat: {
    masukBuka: '06:00',
    batasTepatWaktu: '07:00',
    masukTutup: '12:00',
    pulangBuka: '11:30',
    pulangTutup: '15:00'
  }
};

export function getActiveSchedule() {
  const saved = LS.get('sabsensi_schedule');
  return saved || DEFAULT_SCHEDULE;
}

export function saveActiveSchedule(newSched) {
  LS.set('sabsensi_schedule', newSched);
}

export function getTodayScheduleRules() {
  const sched = getActiveSchedule();
  const d = new Date();
  const dow = d.getDay(); // 5 = Friday
  return dow === 5 ? (sched.jumat || DEFAULT_SCHEDULE.jumat) : (sched.seninKamis || DEFAULT_SCHEDULE.seninKamis);
}

export const LS = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage set error', e);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};

const pad = (n) => String(n).padStart(2, '0');

export function getDeviceTime() {
  const d = new Date();
  return {
    jam: `${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`,
    jamDisplay: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    tgl: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    menit: d.getHours() * 60 + d.getMinutes()
  };
}

export function isGateOpen(mode) {
  const d = new Date();
  const dow = d.getDay();
  // Saturday (6) and Sunday (0) are closed
  if (dow === 0 || dow === 6) return false;

  const currentMinutes = d.getHours() * 60 + d.getMinutes();
  const toMin = (str) => {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  };

  const todayRules = getTodayScheduleRules();

  if (mode === 'Masuk') {
    return currentMinutes >= toMin(todayRules.masukBuka) && currentMinutes < toMin(todayRules.masukTutup);
  }
  if (mode === 'Pulang') {
    return currentMinutes >= toMin(todayRules.pulangBuka) && currentMinutes < toMin(todayRules.pulangTutup);
  }
  if (mode === 'Izin') {
    return currentMinutes >= toMin('06:00') && currentMinutes < toMin('18:00');
  }
  return false;
}

export async function apiCall(action, params = {}, session = null) {
  const time = getDeviceTime();
  const payload = {
    token: CONFIG.TOKEN,
    action,
    sesi: session,
    jam: time.jam,
    tanggal: time.tgl,
    ...params
  };

  try {
    const res = await fetch(CONFIG.URL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.status !== 'success') {
      const err = new Error(data.pesan || 'Terjadi kesalahan sistem');
      err.code = data.kode;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      // In case user or server is offline, provide helpful message
      const offlineErr = new Error('Tidak dapat terhubung ke server Google Apps Script. Periksa koneksi internet.');
      offlineErr.code = 'OFFLINE';
      throw offlineErr;
    }
    throw err;
  }
}

// Parent Real-Time Notification Dispatcher
export function triggerParentNotification(student, mode, timeStr, details = {}) {
  if (!student || !student.kode) return;

  const nama = student.nama || 'Ananda';
  const kelas = student.kelas || '';
  const time = timeStr || getDeviceTime().jamDisplay;

  let title = 'S-Absensi QR — SMKN 7 Pandeglang';
  let body = '';

  if (mode === 'Masuk') {
    if (details.terlambat && Number(details.terlambat) > 0) {
      body = `🟡 Ananda ${nama} (${kelas}) tiba di sekolah pukul ${time} WIB (Terlambat ${details.terlambat} menit).`;
    } else {
      body = `🟢 Ananda ${nama} (${kelas}) telah tiba di sekolah tepat waktu pada pukul ${time} WIB. Selamat belajar!`;
    }
  } else if (mode === 'Pulang') {
    body = `🟢 Ananda ${nama} (${kelas}) telah menyelesaikan KBM dan scan pulang pukul ${time} WIB. Hati-hati di jalan!`;
  } else if (mode === 'Izin') {
    body = `🔵 Keterangan izin Ananda ${nama} (${kelas}) telah dicatat di piket: "${details.keterangan || 'Izin'}".`;
  }

  // Save to persistent notification log
  const currentLogs = LS.get('sabsensi_notif_log') || [];
  const newEntry = {
    studentKode: student.kode,
    nama,
    kelas,
    mode,
    title,
    body,
    timestamp: Date.now()
  };
  LS.set('sabsensi_notif_log', [newEntry, ...currentLogs.slice(0, 99)]);

  // Trigger Native Browser Web Notification (Pops up from top of mobile screen)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const options = {
      body,
      icon: './logo.png',
      badge: './logo.png',
      vibrate: [200, 100, 200],
      tag: `absen_${student.kode}_${Date.now()}`
    };

    try {
      new Notification(title, options);
    } catch {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          ...options
        });
      }
    }
  }
}
