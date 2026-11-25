import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import BottomBar from './components/BottomBar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import Siswa from './components/Siswa';
import Riwayat from './components/Riwayat';
import Rekap from './components/Rekap';
import KelolaAkun from './components/KelolaAkun';
import HariLibur from './components/HariLibur';
import CetakQR from './components/CetakQR';
import Database from './components/Database';
import PusatBantuan from './components/PusatBantuan';
import Pengaturan from './components/Pengaturan';
import PortalOrtu from './components/PortalOrtu';
import ToastContainer from './components/Toast';
import { LS } from './utils/api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(() => LS.get('absen_user') || null);
  const [session, setSession] = useState(() => LS.get('absen_session') || null);
  const [currentTab, setCurrentTab] = useState('dash');
  const [theme, setTheme] = useState(() => LS.get('absen_theme') || 'light');
  const [toasts, setToasts] = useState([]);

  const viewContainerRef = useRef(null);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    LS.set('absen_theme', theme);
  }, [theme]);

  // Tab switch transition animation
  useEffect(() => {
    if (viewContainerRef.current) {
      gsap.fromTo(
        viewContainerRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [currentTab]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (userData, sessionId) => {
    setUser({ ...userData, sesi: sessionId });
    setSession(sessionId);
    LS.set('absen_user', { ...userData, sesi: sessionId });
    LS.set('absen_session', sessionId);
    setCurrentTab('dash');
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    LS.remove('absen_user');
    LS.remove('absen_session');
    addToast('Anda telah keluar dari aplikasi', 'info');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Splash Screen Intro 3D
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // If user is not authenticated, render Login view
  if (!user || !session) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <Login onLoginSuccess={handleLoginSuccess} addToast={addToast} />
      </>
    );
  }

  // If authenticated as Parent (Wali Murid)
  if (user?.role === 'ortu') {
    return (
      <div className="min-h-screen w-full overflow-y-auto px-4 pt-5 pb-16 bg-surface">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <PortalOrtu user={user} onLogout={handleLogout} addToast={addToast} />
      </div>
    );
  }

  // Render view by active tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dash':
        return <Dashboard user={user} onNavigate={setCurrentTab} addToast={addToast} />;
      case 'scan':
        return <Scanner user={user} addToast={addToast} />;
      case 'siswa':
        return <Siswa user={user} addToast={addToast} />;
      case 'riwayat':
        return <Riwayat user={user} addToast={addToast} />;
      case 'rekap':
        return <Rekap user={user} addToast={addToast} />;
      case 'akun':
        return <KelolaAkun user={user} addToast={addToast} />;
      case 'libur':
        return <HariLibur user={user} addToast={addToast} />;
      case 'qr':
        return <CetakQR user={user} addToast={addToast} />;
      case 'db':
        return <Database user={user} addToast={addToast} />;
      case 'bantuan':
        return <PusatBantuan user={user} />;
      case 'set':
        return (
          <Pengaturan
            user={user}
            onLogout={handleLogout}
            onToggleTheme={toggleTheme}
            theme={theme}
            addToast={addToast}
          />
        );
      default:
        return <Dashboard user={user} onNavigate={setCurrentTab} addToast={addToast} />;
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-transparent">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Desktop ERP Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <Header
          currentTab={currentTab}
          user={user}
          onToggleTheme={toggleTheme}
          theme={theme}
        />

        {/* Dynamic Content View Container */}
        <main
          ref={viewContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-8 pt-2 pb-24 lg:pb-8"
        >
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Glass Floating Nav */}
      <BottomBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
}
