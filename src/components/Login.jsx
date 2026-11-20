import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { LogIn, Wifi, ShieldCheck, KeyRound, User, Lock, Sparkles } from 'lucide-react';
import { apiCall, CONFIG } from '../utils/api';
import { playSuccessBeep, playErrorBuzz, triggerHaptic } from '../utils/audio';

export default function Login({ onLoginSuccess, addToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingConn, setTestingConn] = useState(false);

  const stageRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    // 3D Parallax floating cards animation
    if (card1Ref.current && card2Ref.current) {
      gsap.set(card1Ref.current, { z: 50, rotationZ: -4 });
      gsap.set(card2Ref.current, { z: -40, rotationZ: 6, x: 42, y: 32 });

      gsap.to(card1Ref.current, {
        y: -10,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
      gsap.to(card2Ref.current, {
        y: 38,
        duration: 3.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }

    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch' || !stageRef.current) return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    gsap.to(stageRef.current, {
      rotationY: x * 24,
      rotationX: -y * 16,
      transformPerspective: 1100,
      duration: 0.6,
      ease: 'power2.out'
    });
  };

  const handlePointerLeave = () => {
    if (!stageRef.current) return;
    gsap.to(stageRef.current, {
      rotationY: 0,
      rotationX: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('Username dan password wajib diisi', 'error');
      playErrorBuzz();
      triggerHaptic(false);
      return;
    }

    setLoading(true);
    try {
      const res = await apiCall('login', {
        username: username.trim(),
        password: password.trim()
      });

      playSuccessBeep();
      triggerHaptic(true);
      addToast(`Selamat datang, ${res.nama}!`, 'success');
      onLoginSuccess({
        username: res.username,
        nama: res.nama,
        role: res.role,
        dbUrl: res.dbUrl || ''
      }, res.sesi);
    } catch (err) {
      playErrorBuzz();
      triggerHaptic(false);
      addToast(err.message || 'Login gagal', 'error');

      // Error shake
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: -10 },
          { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.25)' }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTestingConn(true);
    try {
      const res = await fetch(CONFIG.URL_API);
      const data = await res.json();
      playSuccessBeep();
      addToast(`Server OK: ${data.layanan || 'Absensi QR SMKN 7 Pandeglang'}`, 'success');
    } catch (err) {
      playErrorBuzz();
      addToast(`Koneksi Gagal: ${err.message}`, 'error');
    } finally {
      setTestingConn(false);
    }
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-[#0B1528] via-[#132442] to-[#1E3A6B] text-slate-100"
    >
      {/* 3D Grid Floor Effect */}
      <div 
        className="absolute -left-[30%] -right-[30%] -bottom-[15%] h-[55%] pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          transform: 'perspective(520px) rotateX(64deg)',
          maskImage: 'linear-gradient(to top, #000 25%, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, #000 25%, transparent)'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 w-full max-w-5xl">
        {/* Left Side: 3D ID Card Preview (Desktop) */}
        <div ref={stageRef} className="hidden lg:block relative w-[360px] h-[230px] shrink-0 preserve-3d">
          {/* Card 2: Background Glow Card */}
          <div
            ref={card2Ref}
            className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between border border-white/20 shadow-2xl bg-gradient-to-br from-[#315E9E] to-[#172B4D] text-white backdrop-blur-md opacity-80"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">Kartu Pelajar Digital</span>
              <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs">SMK</span>
            </div>
            <div className="text-sm font-semibold opacity-70">SMKN 7 Pandeglang</div>
          </div>

          {/* Card 1: Front Student ID Card */}
          <div
            ref={card1Ref}
            className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between border border-white/60 shadow-[0_30px_50px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_#ffffff] bg-gradient-to-br from-white via-[#EEF4FD] to-[#D5E3F7] text-[#172B4D]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-1 border border-blue-200 shadow-sm shrink-0">
                <img src="./logo.png" alt="Logo SMKN 7" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kartu Pelajar</span>
                <span className="font-heading font-bold text-sm text-[#172B4D]">SMKN 7 Pandeglang</span>
              </div>
            </div>

            <div className="flex items-end justify-between mt-auto pt-4 border-t border-blue-900/10">
              <div>
                <span className="font-heading font-extrabold text-base tracking-tight text-[#172B4D]">Ahmad Rizko</span>
                <span className="block text-xs font-semibold text-slate-500">XI TKJ 2</span>
                <code className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-900/10 text-xs font-mono font-bold tracking-widest text-[#315E9E]">
                  K7M2-X9QD
                </code>
              </div>

              {/* QR Code Graphic Mockup */}
              <div className="w-16 h-16 rounded-xl bg-white p-1.5 border border-blue-200 shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 21 21" className="w-full h-full" shapeRendering="crispEdges">
                  <rect x="0" y="0" width="7" height="7" fill="#172B4D"/>
                  <rect x="1" y="1" width="5" height="5" fill="#fff"/>
                  <rect x="2" y="2" width="3" height="3" fill="#172B4D"/>
                  <rect x="14" y="0" width="7" height="7" fill="#172B4D"/>
                  <rect x="15" y="1" width="5" height="5" fill="#fff"/>
                  <rect x="16" y="2" width="3" height="3" fill="#172B4D"/>
                  <rect x="0" y="14" width="7" height="7" fill="#172B4D"/>
                  <rect x="1" y="15" width="5" height="5" fill="#fff"/>
                  <rect x="2" y="16" width="3" height="3" fill="#172B4D"/>
                  <rect x="8" y="2" width="2" height="2" fill="#172B4D"/>
                  <rect x="10" y="5" width="2" height="2" fill="#172B4D"/>
                  <rect x="8" y="8" width="5" height="5" fill="#172B4D"/>
                  <rect x="14" y="10" width="3" height="2" fill="#172B4D"/>
                  <rect x="10" y="14" width="2" height="4" fill="#172B4D"/>
                  <rect x="15" y="16" width="4" height="2" fill="#172B4D"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphism Login Box */}
        <div
          ref={formRef}
          className="w-full max-w-md p-6 sm:p-8 rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]"
        >
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-lg shadow-black/20 flex items-center justify-center shrink-0">
              <img src="./logo.png" alt="Logo SMKN 7" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                Absensi QR
              </h1>
              <p className="text-xs text-blue-200/80 font-medium">SMKN 7 Pandeglang</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mb-6">
            Masuk dengan akun <span className="font-semibold text-white">Guru</span> atau <span className="font-semibold text-white">Admin</span> untuk mulai absensi.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-200 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ketik username..."
                  autoComplete="username"
                  autoCapitalize="none"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/20 bg-black/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-200 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ketik password..."
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/20 bg-black/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-heading font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] shadow-lg shadow-blue-900/40 border border-white/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Memeriksa Kredensial...' : 'Masuk Aplikasi'}</span>
            </button>
          </form>

          {/* Helper & Test Connection */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={testConnection}
              disabled={testingConn}
              className="text-xs text-blue-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wifi className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin' : ''}`} />
              <span>{testingConn ? 'Menghubungkan...' : 'Tes Koneksi Server Apps Script'}</span>
            </button>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center w-full">
              <span className="text-[11px] text-blue-200 block">Akun default sistem:</span>
              <span className="text-xs font-mono text-white/90">
                admin / admin123 &nbsp;•&nbsp; guru / guru123
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
