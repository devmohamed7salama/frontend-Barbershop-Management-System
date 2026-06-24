import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../App.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/book', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get('phone');
    if (phoneParam) {
      setPhone(phoneParam);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    if (phone.length !== 11) {
      toast.error('يجب أن يتكون رقم الهاتف من 11 رقماً.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        user_name: name,
        email,
        phone,
        password,
        password_confirmation: password // To satisfy Laravel's personal access/auth requirements
      });
      toast.success('تم إنشاء الحساب وتسجيل الدخول بنجاح!');
      navigate('/book');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'فشل إنشاء الحساب. يرجى التحقق من صحة البيانات.';
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
            <path d="M30 40C35.5228 40 40 35.5228 40 30C40 24.4772 35.5228 20 30 20C24.4772 20 20 24.4772 20 30C20 35.5228 24.4772 40 30 40Z" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 40C75.5228 40 80 35.5228 80 30C80 24.4772 75.5228 20 70 20C64.4772 20 60 24.4772 60 30C60 35.5228 64.4772 40 70 40Z" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M37 37L63 73" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M63 37L37 73" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h1 className="auth-title">إنشاء حساب جديد</h1>
            <p className="auth-subtitle">أنشئ حساب الإدارة الخاص بك في جناح الحلاقة الفاخر</p>
          </div>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Name input */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              اسم المستخدم
            </label>
            <div className="input-container">
              <span className="material-symbols-outlined input-icon">person</span>
              <input
                className="auth-input with-icon"
                id="username"
                type="text"
                required
                placeholder="اسم المستخدم (مثال: أحمد)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

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
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Phone input */}
          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              رقم الهاتف
            </label>
            <div className="input-container">
              <span className="material-symbols-outlined input-icon">call</span>
              <input
                className="auth-input with-icon"
                id="phone"
                type="tel"
                required
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              كلمة المرور
            </label>
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
                <span>إنشاء الحساب</span>
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
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="auth-footer-link">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
