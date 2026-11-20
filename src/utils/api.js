// API client for Absensi QR - SMKN 7 Pandeglang
import { ALL_STUDENTS } from '../data/students';

export const CONFIG = {
  URL_API: 'https://script.google.com/macros/s/AKfycbxfVwPADDdN32ghE7Ci15vUVhgeqe8l2kuZ7DhQcKn2H5ifLmT3CKPQvrNm1qGVwDCn/exec',
  TOKEN: 'SMK7-SECRET-KEY-2026',
  TZ: 'Asia/Jakarta',
  BATAS_TELAT: '07:18',
  JAM_MASUK: { buka: '06:00', tutup: '13:00' },
  JAM_PULANG: { buka: '15:30', tutup: '18:00' },
  JAM_IZIN: { buka: '06:00', tutup: '18:00' }
};

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

  if (mode === 'Masuk') {
    return currentMinutes >= toMin(CONFIG.JAM_MASUK.buka) && currentMinutes < toMin(CONFIG.JAM_MASUK.tutup);
  }
  if (mode === 'Pulang') {
    return currentMinutes >= toMin(CONFIG.JAM_PULANG.buka) && currentMinutes < toMin(CONFIG.JAM_PULANG.tutup);
  }
  if (mode === 'Izin') {
    return currentMinutes >= toMin(CONFIG.JAM_IZIN.buka) && currentMinutes < toMin(CONFIG.JAM_IZIN.tutup);
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
