import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBarbers } from '../services/barbers';
import { getServices } from '../services/services';
import { createQuickInvoice } from '../services/invoices';
import useApi from '../hooks/useApi';
import { toast } from 'react-toastify';

export default function AdminCreateQuickInvoice() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [barberId, setBarberId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Load barbers and services dynamically with caching
  const { data: barbersResponse, loading: loadingBarbers } = useApi(getBarbers, {
    cacheKey: 'barbers-list-dropdown',
  });

  const { data: servicesResponse, loading: loadingServices } = useApi(getServices, {
    cacheKey: 'services-list-dropdown',
  });

  const barbers = barbersResponse?.data?.data || barbersResponse?.data || [];
  // Only show active / published services
  const services = (servicesResponse?.data?.data || servicesResponse?.data || [])
    .filter(s => s.service_status === 'published');

  // Handle service checkbox change
  const handleServiceChange = (serviceId) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter(id => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Calculate dynamic total price
  const calculateTotal = () => {
    return selectedServiceIds.reduce((sum, id) => {
      const s = services.find(x => x.id === id);
      return sum + (s ? parseFloat(s.service_price) : 0);
    }, 0);
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!customerName.trim() || !customerPhone.trim() || !barberId) {
      toast.warning('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (customerPhone.trim().length !== 11 || !/^\d+$/.test(customerPhone.trim())) {
      toast.warning('يجب أن يكون رقم الهاتف مكوناً من 11 رقماً بالضبط.');
      return;
    }

    if (selectedServiceIds.length === 0) {
      toast.warning('يرجى اختيار خدمة واحدة على الأقل لإصدار الفاتورة السريعة.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuickInvoice({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        barber_id: parseInt(barberId),
        service_ids: selectedServiceIds,
      });

      toast.success('تم إنشاء الفاتورة السريعة بنجاح!');
      navigate('/invoices');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء إنشاء الفاتورة السريعة.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4" style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: '650px', margin: '0 auto', borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <h3 className="mb-4 text-center" style={{ fontWeight: 800, color: '#1A1A1A' }}>إنشاء فاتورة سريعة</h3>
        <p className="text-muted text-center mb-4" style={{ fontSize: '13px' }}>
          أصدر فاتورة مباشرة دون الحاجة لحجز موعد مسبق. سيتم إنشاء حساب العميل تلقائياً إذا لم يكن مسجلاً.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Customer Name */}
          <div className="mb-3">
            <label className="form-label style={{ fontWeight: 700 }}">اسم العميل *</label>
            <input
              type="text"
              className="form-control"
              placeholder="اسم العميل..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={isSubmitting}
              style={{ borderRadius: '8px', height: '42px', border: '1px solid #c4c7c7' }}
            />
          </div>

          {/* Customer Phone */}
          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 700 }}>رقم هاتف العميل *</label>
            <input
              type="text"
              className="form-control"
              placeholder="رقم الهاتف (11 رقم)..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              disabled={isSubmitting}
              style={{ borderRadius: '8px', height: '42px', border: '1px solid #c4c7c7' }}
            />
          </div>

          {/* Select Barber */}
          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 700 }}>الحلاق المسؤول *</label>
            {loadingBarbers ? (
              <div className="text-muted text-center py-2">جاري تحميل قائمة الحلاقين...</div>
            ) : (
              <select
                className="form-select"
                required
                value={barberId}
                onChange={(e) => setBarberId(e.target.value)}
                disabled={isSubmitting}
                style={{ borderRadius: '8px', height: '42px', border: '1px solid #c4c7c7' }}
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

          {/* Select Services */}
          <div className="mb-4">
            <label className="form-label mb-2" style={{ fontWeight: 700 }}>الخدمات المطلوبة *</label>
            {loadingServices ? (
              <div className="text-muted text-center py-2">جاري تحميل قائمة الخدمات...</div>
            ) : services.length === 0 ? (
              <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>
                لا توجد خدمات متاحة حالياً بالصالون.
              </div>
            ) : (
              <div className="border rounded p-3 bg-light" style={{ maxHeight: '250px', overflowY: 'auto', borderRadius: '8px' }}>
                {services.map((service) => (
                  <div key={service.id} className="form-check d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom last-border-0">
                    <div>
                      <input
                        className="form-check-input ms-2 me-0"
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={selectedServiceIds.includes(service.id)}
                        onChange={() => handleServiceChange(service.id)}
                        disabled={isSubmitting}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label" htmlFor={`service-${service.id}`} style={{ cursor: 'pointer', fontWeight: 600 }}>
                        {service.service_name}
                      </label>
                    </div>
                    <span className="text-muted" style={{ fontSize: '13px', fontWeight: 700 }}>
                      {formatPrice(service.service_price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Summary Card */}
          {selectedServiceIds.length > 0 && (
            <div className="bg-light p-3 rounded mb-4 d-flex justify-content-between align-items-center" style={{ border: '2px dashed #D4AF37', borderRadius: '8px' }}>
              <span style={{ fontWeight: 700, color: '#1A1A1A' }}>الإجمالي المستحق:</span>
              <span style={{ fontWeight: 800, color: '#D4AF37', fontSize: '18px' }}>
                {formatPrice(calculateTotal())}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-dark w-100 py-2 mt-2"
            style={{ fontWeight: 700, backgroundColor: '#1a1a1a', borderRadius: '8px', height: '44px' }}
            disabled={isSubmitting || loadingBarbers || loadingServices}
          >
            {isSubmitting ? 'جاري إصدار الفاتورة...' : 'إصدار الفاتورة السريعة وتحصيل المبلغ'}
          </button>
        </form>
      </div>
    </div>
  );
}
