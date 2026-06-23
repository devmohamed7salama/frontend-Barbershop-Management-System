import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../App.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      toast.info('تم تسجيل الخروج بنجاح.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  const displayName = user?.name || user?.user_name || 'المدير العام';

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
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
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>لوحة التحكم</span>
          </NavLink>
          <NavLink to="/appointments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">calendar_month</span>
            <span>المواعيد</span>
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">group</span>
            <span>العملاء</span>
          </NavLink>
          <NavLink to="/barbers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">badge</span>
            <span>الحلاقين</span>
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">content_cut</span>
            <span>الخدمات</span>
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span>الفواتير</span>
          </NavLink>
        </nav>

        {/* CTA */}
        <div className="sidebar-cta-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/appointments/new" className="sidebar-cta-btn">
            <span className="material-symbols-outlined">calendar_today</span>
            <span>حجز موعد جديد</span>
          </NavLink>
          <NavLink to="/invoices/new" className="sidebar-cta-btn" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span>إنشاء فاتورة</span>
          </NavLink>
          <NavLink to="/invoices/quick" className="sidebar-cta-btn" style={{ backgroundColor: '#D4AF37', color: '#1A1A1A' }}>
            <span className="material-symbols-outlined">flash_on</span>
            <span>فاتورة سريعة</span>
          </NavLink>
        </div>

        {/* Footer actions */}
        <div className="sidebar-footer">
          <a href="https://wa.me/201016981295" target='blank' className="sidebar-link">
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
          {/* Search */}
          {/* <div className="header-search-container">
            <span className="material-symbols-outlined header-search-icon">search</span>
            <input
              className="header-search-input"
              placeholder="البحث عن عملاء، مواعيد، فواتير..."
              type="text"
            />
          </div> */}

          {/* User Profile / Notifications */}
          <div className="header-actions me-sm-auto">
            <div className="header-icon-buttons">
              {/* <button className="header-icon-btn">
                <span className="material-symbols-outlined">notifications</span>
                <span className="header-notification-badge"></span>
              </button> */}
              <button className="header-icon-btn">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
            </div>
            <div className="header-divider"></div>
            <button className="header-text-btn">المساعدة</button>
            <div className="header-profile-btn">
              <span className="header-profile-name">{displayName}</span>
              <div className="header-profile-avatar-container">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#747878', margin: '4px' }}>
                  person
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Child Canvas Content */}
        <main className="dashboard-main-canvas mb-4">
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
