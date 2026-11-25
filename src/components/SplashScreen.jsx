import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function SplashScreen({ onFinish }) {
  const containerRef = useRef(null);
  const lettersRef = useRef([]);
  const subRef = useRef(null);
  const logoRef = useRef(null);
  const badgeRef = useRef(null);

  const titleText = "S-Absensi QR";

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            scale: 1.05,
            duration: 0.7,
            ease: "power2.inOut",
            onComplete: onFinish
          });
        }
      });

      // Background ambient zoom
      tl.fromTo(".splash-bg-glow", 
        { scale: 0.8, opacity: 0 },
        { scale: 1.2, opacity: 0.6, duration: 2, ease: "power2.out" },
        0
      );

      // Logo 3D Pop
      tl.fromTo(logoRef.current,
        { scale: 0, rotationY: 180, opacity: 0 },
        { scale: 1, rotationY: 0, opacity: 1, duration: 0.9, ease: "back.out(1.7)" },
        0.2
      );

      // Letter-by-letter 3D stomp effect ("dug dug dug" smooth)
      tl.fromTo(lettersRef.current,
        {
          opacity: 0,
          y: 40,
          rotationX: -90,
          transformOrigin: "50% 50% -20px"
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out"
        },
        0.5
      );

      // Subtitle & School Badge Fade In
      tl.fromTo(subRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.2"
      );

      tl.fromTo(badgeRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" },
        "-=0.3"
      );

      // Pause briefly for impression then transition out
      tl.to({}, { duration: 0.8 });
    }, containerRef);

    return () => ctx.revert();
  }, [onFinish]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D1B36] text-white overflow-hidden select-none"
      style={{ perspective: "1000px" }}
    >
      {/* 3D Dynamic Ambient Glow */}
      <div className="splash-bg-glow absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#315E9E]/40 to-[#10B981]/20 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,94,158,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Floating Geometric Elements */}
      <div className="absolute top-1/4 left-1/5 w-16 h-16 border border-blue-400/20 rounded-2xl rotate-12 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/5 w-24 h-24 border border-emerald-400/20 rounded-full animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Logo Container */}
        <div
          ref={logoRef}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-3 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center mb-6 shadow-blue-500/20"
        >
          <img
            src="./app-icon-512.png"
            alt="S-Absensi QR"
            className="w-full h-full object-contain drop-shadow-md rounded-2xl"
          />
        </div>

        {/* 3D Staggered Title */}
        <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 mb-2 font-heading font-black text-3xl sm:text-5xl tracking-tight text-white drop-shadow-lg">
          {titleText.split("").map((char, index) => (
            <span
              key={index}
              ref={(el) => (lettersRef.current[index] = el)}
              className="inline-block"
              style={{ display: char === " " ? "inline" : "inline-block", width: char === " " ? "0.3em" : "auto" }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <p
          ref={subRef}
          className="text-xs sm:text-sm font-medium tracking-wide text-blue-200/80 mb-5 max-w-xs sm:max-w-md"
        >
          Sistem Absensi Digital Siswa SMKN 7 Pandeglang
        </p>

        {/* Official Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[11px] font-semibold text-slate-300"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Versi Resmi 2026/2027</span>
        </div>
      </div>
    </div>
  );
}
