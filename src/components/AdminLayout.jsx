import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { getQueueCount } from '../services/appointments';
import '../App.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const fetchQueueCount = async () => {
      try {
        const data = await getQueueCount({ t: Date.now() });
        if (data && data.today_queue_count !== undefined) {
          setQueueCount(data.today_queue_count);
        }
      } catch (error) {
        console.error('Error fetching queue count in sidebar:', error);
      }
    };

    fetchQueueCount();
    window.addEventListener('queue-updated', fetchQueueCount);
    const interval = setInterval(fetchQueueCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('queue-updated', fetchQueueCount);
    };
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    setSidebarOpen(false);
    try {
      await logout();
      toast.info('تم تسجيل الخروج بنجاح.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  const displayName = user?.name || user?.user_name || 'المدير العام';

  return (
    <div className="dashboard-container">
      {/* Sidebar Overlay Backdrop for Mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop d-lg-none" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }}>
              <path d="M30 40C35.5228 40 40 35.5228 40 30C40 24.4772 35.5228 20 30 20C24.4772 20 20 24.4772 20 30C20 35.5228 24.4772 40 30 40Z" stroke="#D4AF37" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M70 40C75.5228 40 80 35.5228 80 30C80 24.4772 75.5228 20 70 20C64.4772 20 60 24.4772 60 30C60 35.5228 64.4772 40 70 40Z" stroke="#D4AF37" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M37 37L63 73" stroke="#D4AF37" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M63 37L37 73" stroke="#D4AF37" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="sidebar-brand-info">
            <h1 className="sidebar-brand-name">المقص الذهبي</h1>
            <p className="sidebar-brand-sub">نظام إدارة الصالون</p>
          </div>
        </div>

        {/* Links */}
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>لوحة التحكم</span>
          </NavLink>
          <NavLink to="/shifts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">schedule</span>
            <span>الورديات</span>
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">calendar_month</span>
            <span>المواعيد</span>
            {queueCount > 0 && (
              <span className="badge rounded-pill bg-warning text-dark ms-auto" style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 8px' }}>
                {queueCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">group</span>
            <span>العملاء</span>
          </NavLink>
          <NavLink to="/barbers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">badge</span>
            <span>الحلاقين</span>
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">content_cut</span>
            <span>الخدمات</span>
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span>الفواتير</span>
          </NavLink>
        </nav>
         

        {/* CTA */}
        <div className="sidebar-cta-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/appointments/new" className="sidebar-cta-btn" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">calendar_today</span>
            <span>حجز موعد جديد</span>
          </NavLink>
          <NavLink to="/invoices/new" className="sidebar-cta-btn" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span>إنشاء فاتورة</span>
          </NavLink>
          <NavLink to="/invoices/quick" className="sidebar-cta-btn" style={{ backgroundColor: '#D4AF37', color: '#1A1A1A' }} onClick={handleLinkClick}>
            <span className="material-symbols-outlined">flash_on</span>
            <span>فاتورة سريعة</span>
          </NavLink>
        </div>

        {/* Footer actions */}
        <div className="sidebar-footer">
          <a href="https://wa.me/201016981295" target='blank' className="sidebar-link" onClick={handleLinkClick}>
            <span className="material-symbols-outlined">help</span>
            <span>الدعم الفني</span>
          </a>
          <a href="#" className="sidebar-link" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>تسجيل الخروج</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-content-wrapper">
        {/* Top Navbar */}
        <header className="dashboard-header">
          {/* Hamburger Menu Toggle for Mobile */}
          <button 
            className="d-lg-none btn border-0 p-1 d-flex align-items-center ms-2"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none' }}
            title="فتح القائمة"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#1A1A1A' }}>menu</span>
          </button>

          {/* User Profile / Notifications */}
          <div className="header-actions me-auto me-sm-auto">
            <div className="header-icon-buttons">
              <a href="https://wa.me/201016981295" target='blank' className="header-icon-btn text-decoration-none">
                <span className="material-symbols-outlined">help_outline</span>
              </a>
            </div>
            <div className="header-divider"></div>
            <a href="https://wa.me/201016981295" target='blank' className="header-text-btn text-decoration-none">المساعدة</a>
            <div className="header-profile-btn">
              <span className="header-profile-name d-none d-sm-inline">{displayName}</span>
              <div className="header-profile-avatar-container">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#747878', margin: '4px' }}>
                  person
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Child Canvas Content */}
        <main className="dashboard-main-canvas mb-4 px-3 px-md-4 py-3">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="dashboard-footer">
          <div className="dashboard-footer-brand">المقص الذهبي</div>
          <p className="dashboard-footer-copy">
            © {new Date().getFullYear()} أنظمة إدارة المقص الذهبي. جميع الحقوق محفوظة.
          </p>
          <div className="dashboard-footer-links">
            <a href="callto:+201016981295" className="dashboard-footer-link">الاتصال بالدعم</a>
            <a href="https://wa.me/201016981295" target='blank' className="dashboard-footer-link">واتساب بالدعم</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
