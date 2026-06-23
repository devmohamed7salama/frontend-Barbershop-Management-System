import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBarbers } from '../services/barbers';
import { getAppointments, updateAppointmentStatus } from '../services/appointments';
import useApi from '../hooks/useApi';
import { toast } from 'react-toastify';

export default function AdminCreateInvoice() {
  const [barberId, setBarberId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Load barbers and appointments dynamically with caching
  const { data: barbersResponse, loading: loadingBarbers } = useApi(getBarbers, {
    cacheKey: 'barbers-list-dropdown',
  });

  const { data: appointmentsResponse, loading: loadingAppointments } = useApi(getAppointments, {
    cacheKey: 'appointments-list-dropdown',
  });

  // Extract list items from response
  const barbers = barbersResponse?.data?.data || barbersResponse?.data || [];
  const appointments = (appointmentsResponse?.data?.data || appointmentsResponse?.data || [])
    .filter(appt => appt.appointment_status !== 'completed');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
