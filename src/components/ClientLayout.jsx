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
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  return (
    <div className="client-layout-container">
      {/* Public/Client Header */}
      <header className="client-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1120px', padding: '0 16px' }}>
          <Link to="/book" className="client-header-logo">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              content_cut
            </span>
            <span className="client-header-title">المقص الذهبي - Goolden Clipper</span>
          </Link>

          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: '#444748', fontWeight: '600' }}>
                مرحباً، {user?.name || user?.user_name || 'العميل'}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ba1a1a',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', transform: 'scaleX(-1)' }}>logout</span>
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="client-main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="client-footer">
        <div className="client-footer-container">
          <p className="client-footer-text">
            © {new Date().getFullYear()} المقص الذهبي . جناح الحلاقة الفاخر. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
