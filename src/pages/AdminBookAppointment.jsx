import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAppointment } from '../services/appointments';
import { getServices } from '../services/services';
import useApi from '../hooks/useApi';
import { toast } from 'react-toastify';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getTodayTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export default function AdminBookAppointment() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getTodayTime());
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  // Load services list with client-side caching
  const { data: servicesResponse, loading: loadingServices } = useApi(getServices, {
    cacheKey: 'services-list-dropdown',
  });

  // Extract from Unified JSON structure
  const services = (servicesResponse?.data?.data || servicesResponse?.data || [])
    .filter(s => s.service_status !== 'hidden');

  const handleServiceChange = (serviceId) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !date || !time) {
      toast.error('يرجى ملء الحقول المطلوبة (الاسم، الهاتف، التاريخ، والوقت).');
      return;
    }
    if (selectedServiceIds.length === 0) {
      toast.error('يرجى اختيار خدمة واحدة على الأقل لحجز الموعد.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointment({
        customer_phone: customerPhone,
        customer_name: customerName,
        appointment_date: date,
        appointment_time: time,
        service_ids: selectedServiceIds,
        source: 'offline', // Admin bookings are entered offline
        appointment_notes: notes,
      });
      toast.success('تم حجز الموعد بنجاح!');
      navigate('/appointments');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء حجز الموعد.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4 " style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '12px' }}>
        <h2 className="mb-4 text-center" style={{ fontWeight: 700 }}>حجز موعد جديد</h2>
        <form onSubmit={handleSubmit}>
          {/* Customer Name */}
          <div className="mb-3">
            <label className="form-label font-weight-bold">اسم العميل *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="مثال: أحمد علي"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Customer Phone */}
          <div className="mb-3">
            <label className="form-label font-weight-bold">رقم الهاتف *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="مثال: 01012222232"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Date & Time */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label font-weight-bold">التاريخ *</label>
              <input
                type="date"
                className="form-control"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                min={getTodayDate()}
                placeholder="اختر التاريخ"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label font-weight-bold">الوقت *</label>
              <input
                type="time"
                className="form-control"
                required
                value={time}
                min={getTodayTime()}
                placeholder="اختر الوقت"
                onChange={(e) => setTime(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Services Checklist */}
          <div className="mb-3">
            <label className="form-label font-weight-bold">الخدمات المطلوبة *</label>
            {loadingServices ? (
              <div className="text-muted text-center py-2">جاري تحميل الخدمات...</div>
            ) : services.length === 0 ? (
              <div className="text-danger py-2">لا توجد خدمات متاحة في النظام حالياً.</div>
            ) : (
              <div className="border rounded p-3 bg-light" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {services.map((service) => (
                  <div key={service.id} className="form-check d-flex align-items-center gap-2 mb-2">
                    <input
                      className="form-check-input ms-2"
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={selectedServiceIds.includes(service.id)}
                      onChange={() => handleServiceChange(service.id)}
                      disabled={isSubmitting}
                    />
                    <label className="form-check-label" htmlFor={`service-${service.id}`}>
                      {service.service_name} ({service.service_price} ج.م)
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label className="form-label">ملاحظات إضافية</label>
            <textarea
              className="form-control"
              placeholder="مثال: بدون سشوار..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100 py-2 mt-3"
            style={{ fontWeight: 700, backgroundColor: '#D4AF37', borderColor: '#D4AF37', color: '#1a1a1a' }}
            disabled={isSubmitting || loadingServices}
          >
            {isSubmitting ? 'جاري حجز الموعد...' : 'حجز الموعد وإضافته'}
          </button>
        </form>
      </div>
    </div>
  );
}
