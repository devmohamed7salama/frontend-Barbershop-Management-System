import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBarbers } from '../services/barbers';
import { getAppointments, updateAppointmentStatus } from '../services/appointments';
import { getDashboardStats } from '../services/dashboard';
import useApi from '../hooks/useApi';
import { toast } from 'react-toastify';

export default function AdminCreateInvoice() {
  const [barberId, setBarberId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Load active shift status dynamically
  const { data: statsResponse, loading: loadingStats } = useApi(getDashboardStats, {
    cacheKey: 'active-shift-check-invoice',
    cacheTime: 1000, // 1 second freshness
  });

  // Load barbers and appointments dynamically without caching
  const { data: barbersResponse, loading: loadingBarbers } = useApi(() => getBarbers(), {
    dependencies: [],
  });

  const { data: appointmentsResponse, loading: loadingAppointments } = useApi(() => getAppointments({ status: 'pending', per_page: 100 }), {
    dependencies: [],
  });

  const statsData = statsResponse?.data || statsResponse || {};
  const recentShifts = statsData.recent_shifts || [];
  const hasActiveShift = recentShifts.length > 0 && recentShifts[0].shift_status === 'open';

  // Extract list items from response
  const barbers = (barbersResponse?.data?.data || barbersResponse?.data || [])
    .filter(barber => barber.barber_status === 'available');
  const appointments = appointmentsResponse?.data?.data || appointmentsResponse?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasActiveShift) {
      toast.error('لا يمكن إنشاء فاتورة بدون بدء وردية عمل نشطة.');
      return;
    }
    if (!barberId || !appointmentId) {
      toast.error('يرجى اختيار الحلاق والموعد المرتبط بالفاتورة.');
      return;
    }

    setIsSubmitting(true);
    try {
      // By setting status to 'completed' with a barber_id, the API auto-creates the invoice and shifts the status
      await updateAppointmentStatus(parseInt(appointmentId), {
        appointment_status: 'completed',
        barber_id: parseInt(barberId),
      });

      toast.success('تم إكمال الحجز وإنشاء الفاتورة وتفاصيلها بنجاح!');
      navigate('/invoices');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء إكمال الحجز وإنشاء الفاتورة.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingStats || loadingBarbers || loadingAppointments) {
    return (
      <div className="text-center py-5" style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}>
        <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
        <p className="mt-3 text-muted" style={{ fontWeight: 600 }}>جاري التحقق من حالة الوردية وتحميل البيانات...</p>
      </div>
    );
  }

  if (!hasActiveShift) {
    return (
      <div className="container mt-5" style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}>
        <div className="card shadow-sm border-0 p-5 text-center" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '12px', backgroundColor: '#ffffff' }}>
          <div className="my-3 text-danger">
            <span className="material-symbols-outlined text-warning" style={{ fontSize: '72px' }}>warning</span>
          </div>
          <h3 className="mb-3" style={{ fontWeight: 800, color: '#1A1A1A' }}>عذراً، لا توجد وردية مفتوحة!</h3>
          <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            نظام إدارة الصالون يتطلب بدء وردية جديدة (شيفت) قبل التمكن من إصدار أي فواتير أو إتمام الحجوزات. يرجى التوجه لصفحة الورديات لبدء وردية عمل جديدة.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link
              to="/dashboard"
              className="btn btn-light"
              style={{ fontWeight: 700, borderRadius: '8px', padding: '10px 20px', fontSize: '13px' }}
            >
              العودة للرئيسية
            </Link>
            <Link
              to="/shifts"
              className="btn text-white"
              style={{ backgroundColor: '#D4AF37', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none', fontSize: '13px' }}
            >
              الذهاب لصفحة الورديات لبدء وردية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '12px' }}>
        <h2 className="mb-4 text-center" style={{ fontWeight: 700 }}>إنشاء فاتورة جديدة</h2>
        <form onSubmit={handleSubmit}>
          {/* Select Barber */}
          <div className="mb-3">
            <label className="form-label font-weight-bold">الحلاق المسؤول *</label>
            {loadingBarbers ? (
              <div className="text-muted text-center py-2">جاري تحميل قائمة الحلاقين...</div>
            ) : (
              <select
                className="form-select"
                required
                value={barberId}
                onChange={(e) => setBarberId(e.target.value)}
                disabled={isSubmitting}
                style={{ borderRadius: '8px', height: '42px' }}
              >
                <option value="">-- اختر الحلاق --</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.barber_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Select Appointment */}
          <div className="mb-3">
            <label className="form-label font-weight-bold">الموعد المرتبط بالفاتورة *</label>
            {loadingAppointments ? (
              <div className="text-muted text-center py-2">جاري تحميل قائمة المواعيد...</div>
            ) : (
              <select
                className="form-select"
                required
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                disabled={isSubmitting}
                style={{ borderRadius: '8px', height: '42px' }}
              >
                <option value="">-- اختر الموعد المعلق --</option>
                {appointments.map((appt) => (
                  <option key={appt.id} value={appt.id}>
                    حجز #{appt.id} - العميل: {appt.customer?.customer_name || 'مجهول'} ({appt.appointment_date} في {appt.appointment_time})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-dark w-100 py-2 mt-3"
            style={{ fontWeight: 700, backgroundColor: '#1a1a1a', borderRadius: '8px', height: '44px' }}
            disabled={isSubmitting || loadingBarbers || loadingAppointments}
          >
            {isSubmitting ? 'جاري إنشاء الفاتورة...' : 'إكمال الحجز وإصدار الفاتورة تلقائياً'}
          </button>
        </form>
      </div>
    </div>
  );
}
