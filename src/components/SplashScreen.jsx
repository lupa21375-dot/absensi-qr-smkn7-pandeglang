import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function SplashScreen({ onFinish }) {
  const containerRef = useRef(null);
  const lettersRef = useRef([]);
  const subRef = useRef(null);
  const logoWrapperRef = useRef(null);
  const schoolLogoRef = useRef(null);
  const badgeRef = useRef(null);
  const ringRef = useRef(null);
  const starsRef = useRef([]);

  const titleText = "S-Absensi QR";

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            scale: 1.08,
            filter: "blur(8px)",
            duration: 0.7,
            ease: "power2.inOut",
            onComplete: onFinish
          });
        }
      });

      // 1. Initial State
      gsap.set(containerRef.current, { perspective: 1200 });

      // 2. Cosmic Ambient Backlight Expansion
      tl.fromTo(".splash-glow-core",
        { scale: 0.3, opacity: 0 },
        { scale: 1.6, opacity: 0.85, duration: 2.2, ease: "power2.out" },
        0
      );

      // 3. Floating 3D Geometric Rings rotation
      tl.fromTo(".floating-geo-ring",
        { rotationZ: 0, rotationX: 45, opacity: 0 },
        { rotationZ: 180, rotationX: 15, opacity: 0.6, duration: 3, ease: "none" },
        0
      );

      // 4. Official School Crest: Grand 3D Zoom In with Golden/Cyan Glow Ring
      tl.fromTo(schoolLogoRef.current,
        { scale: 0, rotationY: -180, rotationZ: -20, opacity: 0, filter: "brightness(2)" },
        { scale: 1, rotationY: 0, rotationZ: 0, opacity: 1, filter: "brightness(1)", duration: 1.1, ease: "back.out(2)" },
        0.2
      );

      // Glowing Aura expansion around School Logo
      tl.fromTo(ringRef.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1.25, opacity: 1, duration: 1.2, ease: "elastic.out(1, 0.4)" },
        0.4
      );

      // 5. Letter-by-letter 3D Smooth Stomp Effect with Perspective Depth ("dug dug dug" cinematic)
      tl.fromTo(lettersRef.current,
        {
          opacity: 0,
          y: 50,
          z: -120,
          rotationX: -100,
          transformOrigin: "50% 50% -30px"
        },
        {
          opacity: 1,
          y: 0,
          z: 0,
          rotationX: 0,
          duration: 0.55,
          stagger: 0.055,
          ease: "back.out(1.8)"
        },
        0.7
      );

      // 6. Subtitle & School Official Pill Fade
      tl.fromTo(subRef.current,
        { opacity: 0, y: 20, letterSpacing: "0.2em" },
        { opacity: 1, y: 0, letterSpacing: "0.02em", duration: 0.7, ease: "power3.out" },
        1.2
      );

      tl.fromTo(badgeRef.current,
        { opacity: 0, scale: 0.85, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" },
        1.4
      );

      // 7. Subtle Float & Impression hold before smooth fade-out
      tl.to(logoWrapperRef.current, {
        y: -8,
        duration: 1.2,
        ease: "sine.inOut"
      }, 1.2);

      tl.to({}, { duration: 0.9 });
    }, containerRef);

    return () => ctx.revert();
  }, [onFinish]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070E1E] text-white overflow-hidden select-none"
    >
      {/* 3D Deep Space Radial Lighting */}
      <div className="splash-glow-core absolute w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-[#315E9E]/45 via-[#10B981]/25 to-blue-400/20 blur-[110px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(49,94,158,0.22)_0%,rgba(7,14,30,0.95)_75%)] pointer-events-none" />

      {/* 3D Kinetic Geometric Wireframes */}
      <div className="floating-geo-ring absolute w-[420px] h-[420px] rounded-full border border-blue-400/15 pointer-events-none" />
      <div className="floating-geo-ring absolute w-[520px] h-[520px] rounded-full border border-emerald-400/10 pointer-events-none" style={{ animationDirection: 'reverse' }} />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Logo Container with 3D Holographic Crest of SMKN 7 Pandeglang */}
        <div ref={logoWrapperRef} className="relative mb-6 flex items-center justify-center">
          {/* Pulsing Light Halo */}
          <div
            ref={ringRef}
            className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-500/30 via-teal-400/30 to-indigo-500/30 blur-xl pointer-events-none"
          />

          <div
            ref={schoolLogoRef}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-3.5 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-2xl border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Logo Resmi Sekolah SMKN 7 Pandeglang */}
            <img
              src="./logo-sekolah.png"
              alt="Logo Resmi SMKN 7 Pandeglang"
              className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>

        {/* 3D Staggered Cinematic Title */}
        <div
          className="flex items-center justify-center space-x-1 sm:space-x-2 mb-2 font-heading font-black text-3xl sm:text-5xl tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {titleText.split("").map((char, index) => (
            <span
              key={index}
              ref={(el) => (lettersRef.current[index] = el)}
              className="inline-block"
              style={{
                display: char === " " ? "inline" : "inline-block",
                width: char === " " ? "0.35em" : "auto",
                textShadow: '0 8px 24px rgba(49, 94, 158, 0.6)'
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <p
          ref={subRef}
          className="text-xs sm:text-sm font-semibold tracking-wide text-blue-200/90 mb-5 max-w-xs sm:max-w-md drop-shadow"
        >
          Sistem Absensi Digital SMKN 7 Pandeglang
        </p>

        {/* Official Badge Pill */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold text-slate-200 shadow-lg"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
          <span>Aplikasi Resmi Sekolah</span>
        </div>
      </div>
    </div>
  );
}
