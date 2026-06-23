import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/book', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const responseData = await login(email, password);
      toast.success('تم تسجيل الدخول بنجاح!');
      
      const userObj = responseData?.user || responseData?.data?.user || responseData;
      const userRole = userObj?.role || 'user';
      
      if (userRole === 'admin') {
        navigate(from === '/book' ? '/dashboard' : from, { replace: true });
      } else {
        navigate('/book', { replace: true });
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="auth-logo" style={{ background: '#1a1a1a', padding: '12px' }}>
            <path d="M30 40C35.5228 40 40 35.5228 40 30C40 24.4772 35.5228 20 30 20C24.4772 20 20 24.4772 20 30C20 35.5228 24.4772 40 30 40Z" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M70 40C75.5228 40 80 35.5228 80 30C80 24.4772 75.5228 20 70 20C64.4772 20 60 24.4772 60 30C60 35.5228 64.4772 40 70 40Z" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M37 37L63 73" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M63 37L37 73" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <h1 className="auth-title">تسجيل الدخول</h1>
            <p className="auth-subtitle">الوصول إلى لوحة التحكم الإدارية الخاصة بك</p>
          </div>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              البريد الإلكتروني
            </label>
            <div className="input-container">
              <span className="material-symbols-outlined input-icon">mail</span>
              <input
                className="auth-input with-icon"
                id="email"
                type="email"
                required
                placeholder="admin@trimandtaper.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">
                كلمة المرور
              </label>
              <a href="#" className="forgot-password-link">
                هل نسيت كلمة المرور؟
              </a>
            </div>
            <div className="input-container">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input
                className="auth-input with-icon"
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <span className="material-symbols-outlined" style={{ transform: 'scaleX(-1)' }}>arrow_forward</span>
              </>
            )}
          </button>

          {/* Quick Booking Button */}
          <Link
            to="/book"
            className="auth-submit-btn"
            style={{
              backgroundColor: 'transparent',
              color: '#735c00',
              border: '2px solid #D4AF37',
              marginTop: '4px',
              textDecoration: 'none'
            }}
          >
            <span>حجز سريع بدون حساب</span>
            <span className="material-symbols-outlined">bolt</span>
          </Link>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="auth-footer-link">
              أنشئ حساباً جديداً
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
