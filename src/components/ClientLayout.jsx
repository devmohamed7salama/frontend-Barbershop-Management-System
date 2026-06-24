import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../App.css';

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('تم تسجيل الخروج بنجاح.');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  const handleScroll = (elementId) => {
    if (window.location.pathname !== '/' && window.location.pathname !== '/book') {
      navigate('/#' + elementId);
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
      return;
    }
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="client-layout-container" style={{ direction: 'rtl' }}>
      {/* Public/Client Header */}
      <header className="client-header py-2 px-3">
        <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ maxWidth: '1200px' }}>
          
          {/* Logo */}
          <Link to="/" className="client-header-logo d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1", color: '#D4AF37' }}>
              content_cut
            </span>
            <span className="client-header-title" style={{ fontFamily: 'Cairo', fontWeight: '800', color: '#D4AF37' }}>المقص الذهبي</span>
          </Link>

          {/* Navigation Links */}
          <nav className="d-flex align-items-center gap-3 flex-wrap">
            <Link to="/" onClick={(e) => { e.preventDefault(); handleScroll('home'); }} className="client-nav-link px-2">الرئيسية</Link>
            <a href="#services" onClick={(e) => { e.preventDefault(); handleScroll('services'); }} className="client-nav-link px-2">خدماتنا</a>
            <a href="#booking" onClick={(e) => { e.preventDefault(); handleScroll('booking'); }} className="client-nav-link px-2">احجز الآن</a>
            {isAuthenticated && user?.role !== 'admin' && (
              <Link to="/my-appointments" className="client-nav-link px-2" style={{ color: '#D4AF37', fontWeight: 'bold' }}>حجوزاتي</Link>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="text-white font-medium" style={{ fontSize: '14px' }}>
                  مرحباً، {user?.user_name || 'العميل'}
                </span>
                
                {user?.role === 'admin' ? (
                  <Link to="/dashboard" className="client-auth-btn">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
                    <span>لوحة التحكم</span>
                  </Link>
                ) : (
                  <button onClick={handleLogout} className="client-logout-btn">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', transform: 'scaleX(-1)' }}>logout</span>
                    <span>تسجيل الخروج</span>
                  </button>
                )}
              </div>
            ) : (
              <Link to="/login" className="client-auth-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                <span>تسجيل الدخول</span>
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="client-main-content w-100 flex-grow-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="client-footer" style={{ backgroundColor: '#111', borderTop: '1px solid #222', padding: '24px 0' }}>
        <div className="container text-center">
          <p className="text-light mb-0" style={{ fontSize: '13px', color: '#fff' }}>
            © {new Date().getFullYear()} صالون المقص الذهبي للحلاقة الرجالية الفاخرة. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
