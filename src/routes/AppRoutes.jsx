import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../components/AdminLayout';
import ClientLayout from '../components/ClientLayout';

// Import pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Appointments from '../pages/Appointments';
import AdminBookAppointment from '../pages/AdminBookAppointment';
import Customers from '../pages/Customers';
import Services from '../pages/Services';
import Invoices from '../pages/Invoices';
import AdminCreateInvoice from '../pages/AdminCreateInvoice';
import AdminCreateQuickInvoice from '../pages/AdminCreateQuickInvoice';
import Booking from '../pages/Booking';
import Barbers from '../pages/Barbers';
import Shifts from '../pages/Shifts';
import MyAppointments from '../pages/MyAppointments';
import RatingPage from '../pages/RatingPage';
import AdminRatings from '../pages/AdminRatings';


export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Guest Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/rate/:invoiceId" element={<RatingPage />} />

      {/* Client Layout Routes (Public Booking, Blocks Admin) */}
      <Route
        element={
          <ProtectedRoute userOnly={true} allowGuest={true}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Booking />} />
        <Route path="/book" element={<Booking />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
      </Route>

      {/* Protected Admin Layout Routes (Requires admin role) */}
      <Route
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shifts" element={<Shifts />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/new" element={<AdminBookAppointment />} />
        <Route path="/barbers" element={<Barbers />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/services" element={<Services />} />
        <Route style={{ direction: 'rtl' }} path="/invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<AdminCreateInvoice />} />
        <Route path="/invoices/quick" element={<AdminCreateQuickInvoice />} />
        <Route path="/ratings" element={<AdminRatings />} />
      </Route>

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
