import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import gsap from 'gsap';
import {
  Clock,
  Keyboard,
  RefreshCw,
  ShieldAlert,
  SwitchCamera,
  CheckCircle2,
  XCircle,
  QrCode
} from 'lucide-react';
import { apiCall, triggerParentNotification } from '../utils/api';
import { ALL_STUDENTS } from '../data/students';
import { playSuccessBeep, playErrorBuzz, triggerHaptic } from '../utils/audio';

const MODES = [
  { id: 'Masuk', label: 'Scan Masuk', hours: '06.00 – 13.00' },
  { id: 'Pulang', label: 'Scan Pulang', hours: '15.30 – 18.00' },
  { id: 'Izin', label: 'Scan Izin', hours: '06.00 – 18.00' }
];

let scannerInstanceCounter = 0;

export default function Scanner({ user, addToast }) {
  const [mode, setMode] = useState('Masuk');
  const [keterangan, setKeterangan] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isSwitching, setIsSwitching] = useState(false);

  // Stable unique element id
  const containerIdRef = useRef(`qr-reader-core-${++scannerInstanceCounter}`);
  const html5QrCodeRef = useRef(null);
  const isBusyRef = useRef(false);
  const laserRef = useRef(null);
  const modalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Laser animation loop
  useEffect(() => {
    if (isScanning && laserRef.current) {
      const tween = gsap.fromTo(
        laserRef.current,
        { top: '8%' },
        { top: '88%', duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' }
      );
      return () => tween.kill();
    }
  }, [isScanning]);

  // Modal 3D pop animation
  useEffect(() => {
    if (scanResult && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0, y: 30, rotationX: -15 },
        { scale: 1, opacity: 1, y: 0, rotationX: 0, duration: 0.45, ease: 'back.out(1.7)' }
      );
    }
  }, [scanResult]);

  // Safely stop and clear previous scanner instance
  const stopCurrentScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Stopping scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  }, []);

  // Initialize and start camera
  const startCamera = useCallback(async () => {
    if (!isMountedRef.current) return;
    setCameraError(null);
    setIsSwitching(true);

    await stopCurrentScanner();
    await new Promise((r) => setTimeout(r, 100));
    if (!isMountedRef.current) return;

    try {
      // Discover available cameras
      let devices = cameraDevices;
      if (!devices || devices.length === 0) {
        try {
          const list = await Html5Qrcode.getCameras();
          if (list && list.length > 0) {
            devices = list;
            setCameraDevices(list);
          }
        } catch (e) {
          console.warn('Camera enumeration note:', e);
        }
      }

      const html5Qr = new Html5Qrcode(containerIdRef.current);
      html5QrCodeRef.current = html5Qr;

      const qrConfig = {
        fps: 15,
        qrbox: { width: 230, height: 230 },
        aspectRatio: 1.0
      };

      // Select camera source: device ID if available, otherwise facingMode
      let cameraConfig;
      if (devices && devices.length > 0) {
        const selected = devices[activeCameraIdx % devices.length];
        cameraConfig = selected.id;
      } else {
        cameraConfig = { facingMode: facingMode };
      }

      await html5Qr.start(cameraConfig, qrConfig, onQrScanned, () => {});

      if (isMountedRef.current) {
        setIsScanning(true);
        setIsSwitching(false);
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      if (isMountedRef.current) {
        setIsScanning(false);
        setIsSwitching(false);
        setCameraError(
          'Akses kamera belum diizinkan atau tidak ditemukan. Klik ikon gembok di address bar browser untuk mengizinkan kamera.'
        );
      }
    }
  }, [activeCameraIdx, facingMode, cameraDevices, stopCurrentScanner]);

  // Start on mount and restart when activeCameraIdx or facingMode changes
  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopCurrentScanner();
    };
  }, [activeCameraIdx, facingMode]);

  // Handle successful QR detection
  const onQrScanned = async (decodedText) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    try {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.pause(true);
      }
    } catch {}

    const cleanCode = String(decodedText || '').trim().toUpperCase();
    await processAttendance(cleanCode);
  };

  // Submit scan to backend
  const processAttendance = async (code) => {
    if (mode === 'Izin' && !keterangan.trim()) {
      addToast('Keterangan izin wajib diisi terlebih dahulu', 'error');
      playErrorBuzz();
      triggerHaptic(false);
      resumeScanning();
      return;
    }

    try {
      const res = await apiCall(
        `scan${mode}`,
        {
          kode: code,
          keterangan: mode === 'Izin' ? keterangan.trim() : ''
        },
        user?.sesi
      );

      playSuccessBeep();
      triggerHaptic(true);

      // Trigger instant parent notification
      const studentObj = res.siswa || ALL_STUDENTS.find((s) => s.kode === code) || { kode: code, nama: res.nama, kelas: res.kelas };
      triggerParentNotification(studentObj, mode, res.jam, {
        terlambat: res.terlambat || 0,
        keterangan: keterangan.trim()
      });

      setScanResult({
        success: true,
        data: res,
        mode
      });
    } catch (err) {
      playErrorBuzz();
      triggerHaptic(false);
      setScanResult({
        success: false,
        message: err.message || 'Scan ditolak oleh sistem',
        siswa: err.data?.siswa || null,
        mode
      });
    }
  };

  const resumeScanning = () => {
    setScanResult(null);
    isBusyRef.current = false;
    if (mode === 'Izin') setKeterangan('');

    try {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.resume();
      }
    } catch {}
  };

  // Auto-dismiss scan result
  useEffect(() => {
    if (scanResult) {
      const timer = setTimeout(resumeScanning, scanResult.success ? 2800 : 4200);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  // Toggle camera switch (front / back)
  const handleToggleCamera = () => {
    if (cameraDevices && cameraDevices.length > 1) {
      setActiveCameraIdx((prev) => (prev + 1) % cameraDevices.length);
    } else {
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const code = manualCode.trim().toUpperCase();
    setShowManualModal(false);
    setManualCode('');
    isBusyRef.current = true;
    processAttendance(code);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Mode Tabs */}
      <div className="relative p-1.5 rounded-2xl glass border border-white/60 shadow-lg grid grid-cols-3 gap-1">
        {MODES.map((item) => {
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                resumeScanning();
              }}
              className={`py-2.5 px-2 rounded-xl font-heading text-xs font-bold transition-all text-center cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#3C6DB1] to-[#172B4D] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Operational Hours Banner */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-slate-600">
          <Clock className="w-3.5 h-3.5 text-[#315E9E]" />
          <span>
            Jam {mode.toLowerCase()}:{' '}
            <strong className="text-[#172B4D]">
              {MODES.find((m) => m.id === mode)?.hours} WIB
            </strong>
          </span>
        </span>
      </div>

      {/* Izin Note Input */}
      {mode === 'Izin' && (
        <div className="card p-3.5 border-amber-300/60 bg-amber-50/60">
          <label className="block text-xs font-bold text-amber-900 mb-1">
            Keterangan Izin (Wajib diisi):
          </label>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Keterangan izin (misal: Sakit demam, Keperluan dinas keluarga...)"
            maxLength={100}
            className="input-field text-xs sm:text-sm"
          />
        </div>
      )}

      {/* Viewfinder Outer Box */}
      <div className="relative w-full aspect-square max-w-[380px] mx-auto rounded-[32px] overflow-hidden bg-slate-950 shadow-2xl border-4 border-white/80">
        {/* Core video container */}
        <div id={containerIdRef.current} className="absolute inset-0 w-full h-full" />

        {/* Loading state during camera switch */}
        {isSwitching && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-white z-30">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs font-semibold text-slate-300">Menghubungkan kamera...</span>
          </div>
        )}

        {/* L-Bracket Reticle Frame */}
        <div className="absolute inset-0 pointer-events-none p-12 flex flex-col justify-between z-10">
          <div className="flex justify-between">
            <div className="w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl shadow-sm" />
            <div className="w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl shadow-sm" />
          </div>
          <div className="flex justify-between">
            <div className="w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl shadow-sm" />
            <div className="w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl shadow-sm" />
          </div>
        </div>

        {/* Moving Laser Scanner Line */}
        {isScanning && !isSwitching && (
          <div
            ref={laserRef}
            className="absolute left-[16%] right-[16%] h-[2.5px] rounded-full bg-cyan-400 shadow-[0_0_16px_3px_#22d3ee] pointer-events-none z-20"
          />
        )}
      </div>

      {/* Camera Toolbar Controls (Outside & Below viewfinder to avoid overlap) */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleToggleCamera}
          title="Putar ke kamera depan/belakang"
          className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
        >
          <SwitchCamera className="w-4 h-4 text-[#315E9E]" />
          <span>Putar Kamera</span>
        </button>

        <button
          onClick={() => setShowManualModal(true)}
          title="Input kode siswa manual"
          className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
        >
          <Keyboard className="w-4 h-4 text-[#172B4D]" />
          <span>Ketik Kode</span>
        </button>
      </div>

      {/* Camera Error Alert */}
      {cameraError && (
        <div className="card p-4 sm:p-5 border-rose-300 bg-rose-50/80 text-slate-800 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-sm font-bold text-rose-900 block">Kamera Belum Aktif</strong>
              <p className="text-slate-600 leading-relaxed">{cameraError}</p>
            </div>
          </div>
          <button
            onClick={startCamera}
            className="btn-primary py-2 px-4 rounded-xl text-xs font-bold w-full cursor-pointer"
          >
            Nyalakan Ulang Kamera
          </button>
        </div>
      )}

      {/* Manual Input Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm bg-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <QrCode className="w-5 h-5 text-[#315E9E]" />
              <h3 className="font-heading font-extrabold text-base text-[#172B4D]">Input Kode Manual</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan 8 karakter kode QR siswa jika kartu buram atau kamera tidak terbaca (format: UDWU-QCZR).
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="input-field text-center font-mono font-bold tracking-widest text-base py-3"
                autoFocus
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="btn-secondary flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proses Absen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Result Modal (3D Pop) */}
      {scanResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 perspective-1000">
          <div
            ref={modalRef}
            className={`card p-6 w-full max-w-sm text-center shadow-2xl border-2 preserve-3d ${
              scanResult.success
                ? 'bg-gradient-to-b from-white via-white to-emerald-50/70 border-emerald-400'
                : 'bg-gradient-to-b from-white via-white to-rose-50/70 border-rose-400'
            }`}
          >
            {scanResult.success ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {scanResult.mode} Berhasil
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-2xl text-[#172B4D]">
                    {scanResult.data?.nama}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {scanResult.data?.kelas} • {scanResult.data?.jurusan}
                  </p>
                </div>
                <div className="py-1 text-3xl font-heading font-extrabold text-[#172B4D] tabular-nums">
                  {scanResult.data?.jam ? scanResult.data.jam.replace('.', ':') : ''} WIB
                </div>
                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full badge-ok">
                  {scanResult.data?.statusAbsen}
                </span>
                {scanResult.data?.keterangan && (
                  <p className="text-xs text-slate-600 italic mt-1 bg-blue-50/60 p-2 rounded-lg">
                    "{scanResult.data.keterangan}"
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
                  <XCircle className="w-7 h-7" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800">
                  Scan Ditolak
                </span>
                {scanResult.siswa?.nama && (
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-[#172B4D]">
                      {scanResult.siswa.nama}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {scanResult.siswa.kelas}
                    </p>
                  </div>
                )}
                <p className="text-sm font-bold text-rose-700 py-1 leading-snug">
                  {scanResult.message}
                </p>
              </div>
            )}

            <button
              onClick={resumeScanning}
              className="mt-5 w-full btn-primary py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Scan Kartu Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
