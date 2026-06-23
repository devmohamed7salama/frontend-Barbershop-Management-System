import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, userOnly = false, allowGuest = false }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (allowGuest) {
      return children;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    // If not admin, redirect to user booking area
    return <Navigate to="/book" replace />;
  }

  if (userOnly && user?.role === 'admin') {
    // If admin, redirect to admin dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
