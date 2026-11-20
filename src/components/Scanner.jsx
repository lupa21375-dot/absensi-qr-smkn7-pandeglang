import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import gsap from 'gsap';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Keyboard,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FileEdit,
  ShieldAlert
} from 'lucide-react';
import { apiCall, isGateOpen } from '../utils/api';
import { playSuccessBeep, playErrorBuzz, triggerHaptic } from '../utils/audio';
import { ALL_STUDENTS } from '../data/students';

const MODES = [
  { id: 'Masuk', label: 'Scan Masuk', hours: '06.00 – 13.00' },
  { id: 'Pulang', label: 'Scan Pulang', hours: '15.30 – 18.00' },
  { id: 'Izin', label: 'Scan Izin', hours: '06.00 – 18.00' }
];

export default function Scanner({ user, addToast }) {
  const [mode, setMode] = useState('Masuk');
  const [keterangan, setKeterangan] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { success: bool, data, message }
  const [facingMode, setFacingMode] = useState('environment'); // environment / user

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isBusyRef = useRef(false);
  const laserRef = useRef(null);
  const modalRef = useRef(null);

  // Laser animation loop
  useEffect(() => {
    if (laserRef.current) {
      const tween = gsap.fromTo(
        laserRef.current,
        { top: '10%' },
        { top: '88%', duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' }
      );
      return () => tween.kill();
    }
  }, [isScanning]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const html5Qr = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: facingMode },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 }
        },
        onQrScanned,
        () => {} // frame error ignored
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setIsScanning(false);
      setCameraError(
        'Kamera belum bisa diakses. Pastikan izin kamera sudah diberikan lewat ikon gembok di address bar browser.'
      );
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Handle successful QR detection
  const onQrScanned = async (decodedText) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    // Pause camera scanning temporarily
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.pause(true);
      }
    } catch {}

    const cleanCode = String(decodedText || '').trim().toUpperCase();
    await processAttendance(cleanCode);
  };

  const processAttendance = async (code) => {
    if (mode === 'Izin' && !keterangan.trim()) {
      addToast('Keterangan izin wajib diisi terlebih dahulu!', 'error');
      playErrorBuzz();
      triggerHaptic(false);
      resumeScanning();
      return;
    }

    try {
      const actionName = `scan${mode}`;
      const payload = {
        kode: code,
        keterangan: mode === 'Izin' ? keterangan.trim() : ''
      };

      const res = await apiCall(actionName, payload, user?.sesi);

      playSuccessBeep();
      triggerHaptic(true);
      setScanResult({
        success: true,
        data: res,
        mode: mode
      });
    } catch (err) {
      playErrorBuzz();
      triggerHaptic(false);

      // Check if student details came with error response
      const errRes = err.data || {};
      setScanResult({
        success: false,
        message: err.message || 'Scan ditolak sistem',
        siswa: errRes.siswa || null,
        mode: mode
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

  // Auto-dismiss scan modal
  useEffect(() => {
    if (scanResult) {
      const timer = setTimeout(() => {
        resumeScanning();
      }, scanResult.success ? 2400 : 3800);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  // Flip camera toggle
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual fallback search
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const code = manualCode.trim().toUpperCase();
    setShowManualModal(false);
    setManualCode('');
    processAttendance(code);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Mode Selector */}
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
              <span>{item.id}</span>
            </button>
          );
        })}
      </div>

      {/* Operational Hours Banner */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-[#315E9E]" />
          <span>
            Jam {mode.toLowerCase()}:{' '}
            <strong className="text-[#172B4D]">
              {MODES.find((m) => m.id === mode)?.hours} WIB
            </strong>
          </span>
        </span>
      </div>

      {/* Mandatory Keterangan input for Izin mode */}
      {mode === 'Izin' && (
        <div className="card p-3 border-amber-300/60 bg-amber-50/50">
          <label className="block text-xs font-bold text-amber-900 mb-1">
            Keterangan Izin (Wajib diisi):
          </label>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Sakit demam, Keperluan keluarga, dsb. (maks. 100 kar)"
            maxLength={100}
            className="input-field text-sm"
          />
        </div>
      )}

      {/* Viewfinder Container */}
      <div className="relative w-full aspect-square max-w-[420px] mx-auto rounded-[36px] overflow-hidden bg-slate-950 shadow-2xl border-4 border-white/80">
        {/* Html5-Qrcode reader node */}
        <div id="qr-reader-container" className="w-full h-full object-cover" />

        {/* Reticle L-Bracket Corners */}
        <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-9 h-9 border-t-4 border-l-4 border-white rounded-tl-xl shadow-sm" />
            <div className="w-9 h-9 border-t-4 border-r-4 border-white rounded-tr-xl shadow-sm" />
          </div>
          <div className="flex justify-between">
            <div className="w-9 h-9 border-b-4 border-l-4 border-white rounded-bl-xl shadow-sm" />
            <div className="w-9 h-9 border-b-4 border-r-4 border-white rounded-br-xl shadow-sm" />
          </div>
        </div>

        {/* Sinusoidal Moving Laser Line */}
        {isScanning && (
          <div
            ref={laserRef}
            className="absolute left-[12%] right-[12%] h-1 rounded-full bg-cyan-400 shadow-[0_0_18px_3px_#22d3ee] pointer-events-none z-10"
          />
        )}

        {/* Bottom Scanner Toolbar */}
        <div className="absolute left-0 right-0 bottom-4 z-20 flex items-center justify-center gap-3 px-4">
          <button
            onClick={toggleCameraFacing}
            title="Ganti Kamera Depan/Belakang"
            className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all border border-white/20 shadow-lg cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            title="Input Kode Manual"
            className="px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold hover:bg-black/80 transition-all border border-white/20 shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
            <span>Ketik Kode</span>
          </button>
        </div>
      </div>

      {/* Camera Error Card */}
      {cameraError && (
        <div className="card p-5 border-rose-300 bg-rose-50/70 text-slate-800 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-sm font-bold text-rose-900 block">Kamera Belum Diizinkan</strong>
              <p className="text-slate-600">{cameraError}</p>
            </div>
          </div>
          <button
            onClick={startCamera}
            className="btn-primary py-2 px-4 rounded-xl text-xs font-bold w-full cursor-pointer"
          >
            Coba Nyalakan Kamera Lagi
          </button>
        </div>
      )}

      {/* Manual Input Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm bg-white space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[#172B4D]">Input Kode Siswa Manual</h3>
            <p className="text-xs text-slate-500">
              Gunakan opsi ini jika kartu QR siswa rusak atau buram. Masukkan 8 karakter kode siswa (contoh: UDWU-QCZR).
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="input-field text-center font-mono font-bold tracking-widest text-base"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="btn-secondary flex-1 py-2 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2 rounded-xl text-xs font-bold"
                >
                  Proses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Result Overlay Modal */}
      {scanResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className={`card p-6 w-full max-w-sm text-center shadow-2xl border-2 transition-all ${
              scanResult.success
                ? 'bg-gradient-to-b from-white via-white to-emerald-50/50 border-emerald-400'
                : 'bg-gradient-to-b from-white via-white to-rose-50/50 border-rose-400'
            }`}
          >
            {scanResult.success ? (
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {scanResult.mode} BERHASIL
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-2xl text-[#172B4D]">
                    {scanResult.data?.nama}
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    {scanResult.data?.kelas}
                  </p>
                </div>
                <div className="py-2 text-3xl font-heading font-extrabold text-[#172B4D] tabular-nums">
                  {scanResult.data?.jam ? scanResult.data.jam.replace('.', ':') : ''} WIB
                </div>
                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full badge-ok">
                  {scanResult.data?.statusAbsen}
                </span>
                {scanResult.data?.keterangan && (
                  <p className="text-xs text-slate-500 italic mt-1">
                    "{scanResult.data.keterangan}"
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800">
                  SCAN DITOLAK
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
                <p className="text-sm font-bold text-rose-600 py-2">
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
