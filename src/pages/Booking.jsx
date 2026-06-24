import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getServices } from '../services/services';
import { getBarbers } from '../services/barbers';
import { createAppointment, getQueueCount } from '../services/appointments';
import { toast } from 'react-toastify';
import { Modal, Spinner } from 'react-bootstrap';
import '../App.css';

const ALL_TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00'
];

export default function Booking() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [queueAheadCount, setQueueAheadCount] = useState(null);

  // Fetch Services & Barbers on mount
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoadingData(true);
        // Fetch services
        const servicesRes = await getServices();
        const servicesArray = servicesRes?.data?.data || servicesRes?.data || [];
        // Filter out hidden services for guest view
        const activeServices = servicesArray.filter(s => s.service_status !== 'hidden');
        setServices(activeServices);

        // Fetch barbers
        const barbersRes = await getBarbers();
        const barbersArray = barbersRes?.data?.data || barbersRes?.data || [];
        setBarbers(barbersArray);
      } catch (error) {
        console.error('Error fetching landing page data:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات الخدمات أو فريق العمل.');
      } finally {
        setLoadingData(false);
      }
    };
    loadPageData();
  }, []);

  // Pre-fill user details if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerName(user.user_name || user.name || '');
      setCustomerPhone(user.phone || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [isAuthenticated, user]);

  // Helper to check if a slot is in the past
  const isTimeInPast = (slot, dateStr) => {
    const todayStr = getMinDate();
    if (dateStr !== todayStr) return false;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const [slotHour, slotMinute] = slot.split(':').map(Number);

    if (slotHour < currentHours) return true;
    if (slotHour === currentHours && slotMinute <= currentMinutes) return true;
    return false;
  };

  const getAvailableTimeSlots = () => {
    return ALL_TIME_SLOTS.filter(slot => !isTimeInPast(slot, appointmentDate));
  };

  // Initialize Date & Time defaults
  useEffect(() => {
    const todayStr = getMinDate();
    
    // Find first available slot for today
    const firstValidToday = ALL_TIME_SLOTS.find(slot => !isTimeInPast(slot, todayStr));

    if (firstValidToday) {
      setAppointmentDate(todayStr);
      setAppointmentTime(firstValidToday);
    } else {
      // If today is fully in the past (e.g. past 22:00), default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowStr = `${yyyy}-${mm}-${dd}`;
      
      setAppointmentDate(tomorrowStr);
      setAppointmentTime(ALL_TIME_SLOTS[0]); // 10:00
    }
  }, []);

  const handleDateChange = (newDate) => {
    setAppointmentDate(newDate);
    
    // If the new date is today, check if currently selected time is valid
    const todayStr = getMinDate();
    if (newDate === todayStr) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      if (appointmentTime) {
        const [selHour, selMinute] = appointmentTime.split(':').map(Number);
        const isValid = (selHour > currentHours) || (selHour === currentHours && selMinute > currentMinutes);
        
        if (!isValid) {
          // Find first available slot for today
          const availableToday = ALL_TIME_SLOTS.find(slot => !isTimeInPast(slot, todayStr));
          if (availableToday) {
            setAppointmentTime(availableToday);
          }
        }
      }
    }
  };

  // Smooth scroll helper
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, [services]);

  // Calculate dynamic totals
  const totalDuration = selectedServices.reduce((acc, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return acc + (service ? parseInt(service.service_duration || 0) : 0);
  }, 0);

  const totalPrice = selectedServices.reduce((acc, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return acc + (service ? parseFloat(service.service_price || 0) : 0);
  }, 0);

  // Handle service checkbox toggle
  const handleServiceToggle = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  // Submit appointment
  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!customerName || !customerPhone) {
      toast.error('يرجى إدخال اسمك ورقم هاتفك.');
      return;
    }

    if (customerPhone.length !== 11) {
      toast.error('يجب أن يتكون رقم الهاتف من 11 رقماً.');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('يرجى اختيار خدمة واحدة على الأقل.');
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      toast.error('يرجى تحديد تاريخ ووقت الحجز.');
      return;
    }

    if (isTimeInPast(appointmentTime, appointmentDate)) {
      toast.error('لا يمكن حجز موعد في وقت ماضٍ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        service_ids: selectedServices,
        appointment_notes: appointmentNotes,
        source: 'online'
      };

      const response = await createAppointment(bookingPayload);
      const bookingData = response?.data || response;

      setCreatedBooking(bookingData);
      setQueueAheadCount(null);

      // Fetch queue count
      const apptId = bookingData?.id || bookingData?.data?.id;
      if (apptId) {
        try {
          const queueData = await getQueueCount({ appointment_id: apptId, t: Date.now() });
          if (queueData && queueData.queue_count !== undefined) {
            setQueueAheadCount(queueData.queue_count);
          }
        } catch (err) {
          console.error('Error fetching queue count:', err);
        }
      }

      setShowSuccessModal(true);
      window.dispatchEvent(new Event('queue-updated'));
      toast.success('تم تسجيل الحجز بنجاح!');

      // Reset form if guest
      if (!isAuthenticated) {
        setCustomerName('');
        setCustomerPhone('');
      }
      setSelectedServices([]);
      setAppointmentDate('');
      setAppointmentTime('');
      setAppointmentNotes('');
    } catch (error) {
      console.error('Error submitting booking:', error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء معالجة حجزك. يرجى المحاولة لاحقاً.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current date formatted for min date input (YYYY-MM-DD)
  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="landing-page-container">
      {/* 1. Hero Section */}
      <section id="home" className="hero-section text-center d-flex align-items-center justify-content-center">
        <div className="hero-overlay"></div>
        <div className="hero-content container position-relative px-4">
          <span className="gold-badge mb-3 d-inline-block">جناح الحلاقة الرجالية الفاخرة</span>
          <h1 className="hero-title mb-3">المقص الذهبي</h1>
          <p className="hero-description mx-auto mb-4">
            نحن لا نقدم مجرد قصة شعر، بل نصنع تجربة متكاملة تجمع بين الأصالة والعصرية على أيدي أمهر خبراء الحلاقة الرجالية.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <a href="#booking" className="btn-gold-cta py-3 px-5">احجز موعدك الآن</a>
            <a href="#services" className="btn-outline-gold py-3 px-5">عرض خدماتنا</a>
          </div>
          <div className="hero-info-row mt-5 d-flex justify-content-center gap-4 flex-wrap text-white">
            <div className="info-item">
              <span className="material-symbols-outlined text-warning mb-1">schedule</span>
              <div>مفتوح يومياً: 10:00 ص - 10:00 م</div>
            </div>
            <div className="info-item">
              <span className="material-symbols-outlined text-warning mb-1">location_on</span>
              <div>مدينة اجا | شارع الجلاء</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Services Section */}
      <section id="services" className="services-section py-5">
        <div className="container px-4">
          <div className="text-center mb-5">
            <h2 className="section-title">خدماتنا المتميزة</h2>
            <div className="gold-divider mx-auto my-3"></div>
            <p className="section-subtitle text-light">اختر من بين باقة خدماتنا الفاخرة المصممة خصيصاً لتلبية احتياجاتك</p>
          </div>

          {loadingData ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="warning" />
              <div className="mt-3 text-light">جاري تحميل الخدمات...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center text-light py-5">لا توجد خدمات متاحة حالياً.</div>
          ) : (
            <div className="row g-4 justify-content-center">
              {services.map(service => (
                <div key={service.id} className="col-12 col-md-6 col-lg-4">
                  <div className="service-premium-card h-100 d-flex flex-column">
                    <div className="service-card-image-wrapper">
                      {service.service_image ? (
                        <img
                          src={service.service_image.startsWith('http') ? service.service_image : `http://localhost:8000/${service.service_image}`}
                          alt={service.service_name}
                          className="service-card-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600';
                          }}
                        />
                      ) : (
                        <div className="service-card-image-placeholder d-flex align-items-center justify-content-center bg-dark text-warning">
                          <span className="material-symbols-outlined style-icon">content_cut</span>
                        </div>
                      )}
                      <span className="service-card-price-badge">{service.service_price} ج.م</span>
                    </div>
                    <div className="service-card-body p-4 d-flex flex-column flex-grow-1">
                      <h3 className="service-card-title mb-2">{service.service_name}</h3>
                      <p className="service-card-desc text-light mb-3 flex-grow-1">{service.service_description}</p>
                      <div className="service-card-footer d-flex justify-content-between align-items-center pt-3 border-top border-secondary">
                        <div className="d-flex align-items-center gap-1 text-warning">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          <span className="font-semibold text-[13px]">{service.service_duration} دقيقة</span>
                        </div>
                        <a href="#booking" onClick={() => handleServiceToggle(service.id)} className="btn-card-book">
                          {selectedServices.includes(service.id) ? 'إلغاء التحديد' : 'تحديد الخدمة'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Barbers Team Section (Shown only if barbers count > 2) */}
      {barbers.length > 2 && (
        <section id="barbers" className="barbers-section py-5" style={{ backgroundColor: '#111111' }}>
          <div className="container px-4 text-center">
            <div className="mb-5">
              <h2 className="section-title text-white">فريق العمل المحترف</h2>
              <div className="gold-divider mx-auto my-3"></div>
              <p className="section-subtitle text-light">نخبة من أمهر الحلاقين ذوي الخبرة الطويلة في مجال الموضة والعناية بالرجل</p>
            </div>
            
            <div className="row g-4 justify-content-center">
              {barbers.map(barber => (
                <div key={barber.id} className="col-6 col-md-4 col-lg-3">
                  <div className="barber-premium-card p-4">
                    <div className="barber-avatar-wrapper mb-3 mx-auto">
                      <span className="material-symbols-outlined text-warning" style={{ fontSize: '48px' }}>
                        face_6
                      </span>
                    </div>
                    <h3 className="barber-name text-white mb-2">{barber.barber_name}</h3>
                    <span className="barber-title text-light text-[13px]">خبير حلاقة وتصفيف</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Booking Section */}
      <section id="booking" className="booking-section py-5">
        <div className="container px-4" style={{ maxWidth: '900px' }}>
          <div className="text-center mb-5">
            <h2 className="section-title">احجز موعدك الآن</h2>
            <div className="gold-divider mx-auto my-3"></div>
            <p className="section-subtitle text-light">سجل بياناتك واختر موعدك المفضل وسنقوم بتأكيده فوراً</p>
          </div>

          <div className="booking-form-wrapper p-4 p-md-5">
            <form onSubmit={handleSubmitBooking}>
              <div className="row g-4">
                
                {/* Mode Indicator & Guest Alert */}
                <div className="col-12">
                  {isAuthenticated ? (
                    <div className="alert alert-info d-flex align-items-center gap-2 border-0 bg-dark text-warning p-3">
                      <span className="material-symbols-outlined text-[20px]">verified_user</span>
                      <span>أنت مسجل دخول حالياً، سيتم ربط الحجز ببياناتك تلقائياً وبنوع حجز <strong>أونلاين</strong>.</span>
                    </div>
                  ) : (
                    <div className="alert alert-warning d-flex align-items-center gap-2 border-0 bg-dark text-warning p-3">
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                      <span>حجز سريع بدون حساب! يمكنك ملء البيانات بالأسفل وإتمام حجزك مباشرة.</span>
                    </div>
                  )}
                </div>

                {/* Customer Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-white" htmlFor="c-name">الاسم بالكامل</label>
                  <input
                    type="text"
                    id="c-name"
                    className="form-control text-white bg-dark border-secondary py-2"
                    placeholder="أدخل اسمك"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isAuthenticated || isSubmitting}
                    required
                  />
                </div>

                {/* Customer Phone */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-white" htmlFor="c-phone">رقم الهاتف (11 رقم)</label>
                  <input
                    type="tel"
                    id="c-phone"
                    className="form-control text-white bg-dark border-secondary py-2"
                    placeholder="مثال: 01012345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={isAuthenticated || isSubmitting}
                    required
                  />
                </div>

                {/* Service Selection Checklist */}
                <div className="col-12">
                  <label className="form-label text-white mb-2">اختر الخدمات المطلوبة</label>
                  {services.length === 0 ? (
                    <div className="text-light">لا توجد خدمات متاحة للاختيار.</div>
                  ) : (
                    <div className="services-checkbox-grid p-3 rounded bg-dark border border-secondary">
                      <div className="row g-3">
                        {services.map(service => (
                          <div key={service.id} className="col-12 col-sm-6">
                            <label className="d-flex align-items-center gap-3 text-white style-checkbox-label" style={{ cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                                disabled={isSubmitting}
                                style={{ width: '20px', height: '20px', accentColor: '#D4AF37' }}
                              />
                              <div className="d-flex flex-column">
                                <span className="font-semibold text-[14px]">{service.service_name}</span>
                                <span className="text-[12px] text-light">{service.service_price} ج.م | {service.service_duration} دقيقة تقريباً</span>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-white" htmlFor="ap-date">تاريخ الحجز</label>
                  <input
                    type="date"
                    id="ap-date"
                    className="form-control text-white bg-dark border-secondary py-2"
                    min={getMinDate()}
                    value={appointmentDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Time Selection */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-white" htmlFor="ap-time">وقت الحجز</label>
                  <select
                    id="ap-time"
                    className="form-select text-white bg-dark border-secondary py-2"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" disabled>اختر الوقت المناسب</option>
                    {getAvailableTimeSlots().map(slot => {
                      const [hour, minute] = slot.split(':').map(Number);
                      const isPM = hour >= 12;
                      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                      const period = isPM ? 'مساءً' : 'صباحاً';
                      const formattedTime = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
                      return (
                        <option key={slot} value={slot}>
                          {formattedTime}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Notes Input */}
                <div className="col-12">
                  <label className="form-label text-white" htmlFor="ap-notes">ملاحظات خاصة (اختياري)</label>
                  <textarea
                    id="ap-notes"
                    rows="3"
                    className="form-control text-white bg-dark border-secondary py-2"
                    placeholder="أي ملاحظات إضافية بخصوص الحلاقة..."
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Invoice Invoice-Summary Box */}
                {selectedServices.length > 0 && (
                  <div className="col-12">
                    <div className="summary-box p-3 rounded bg-dark border border-warning">
                      <h4 className="text-warning mb-3 text-[16px] font-bold">ملخص الحجز المؤقت:</h4>
                      <div className="d-flex justify-content-between mb-2 text-white text-[14px]">
                        <span>عدد الخدمات المحددة:</span>
                        <span>{selectedServices.length} خدمات</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-white text-[14px]">
                        <span>الوقت الإجمالي المتوقع:</span>
                        <span>{totalDuration} دقيقة</span>
                      </div>
                      <hr className="bg-secondary" />
                      <div className="d-flex justify-content-between text-warning font-bold text-[18px]">
                        <span>التكلفة الإجمالية:</span>
                        <span>{totalPrice} ج.م</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="col-12 mt-4 text-center">
                  <button
                    type="submit"
                    className="btn-gold-cta py-3 w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : isAuthenticated ? (
                      <>
                        <span>تأكيد الحجز أونلاين</span>
                        <span className="material-symbols-outlined ms-2">check_circle</span>
                      </>
                    ) : (
                      <>
                        <span>حجز سريع (بدون حساب)</span>
                        <span className="material-symbols-outlined ms-2">bolt</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 5. Booking Success Modal */}
      <Modal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        centered
        contentClassName="bg-dark text-white border-warning"
      >
        <Modal.Header  closeVariant="white" className="border-secondary">
          <Modal.Title className="text-warning font-bold" style={{ fontFamily: 'Cairo' }}>تم الحجز بنجاح!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          <span className="material-symbols-outlined text-success" style={{ fontSize: '72px', color: '#2e7d32' }}>
            check_circle
          </span>
          <h3 className="mt-3 mb-4 font-bold text-[20px]">حجزك الآن مسجل في النظام</h3>
          
          {createdBooking && (
            <div className="text-end bg-black p-3 rounded border border-secondary mx-auto" style={{ maxWidth: '360px' }}>
              <div className="mb-2"><strong>رقم الحجز:</strong> <span className="text-warning">#{createdBooking.id}</span></div>
              <div className="mb-2"><strong>الاسم:</strong> {createdBooking.customer?.customer_name || customerName}</div>
              <div className="mb-2"><strong>التاريخ والوقت:</strong> {createdBooking.appointment_date} في {createdBooking.appointment_time}</div>
              <div className="mb-2"><strong>السعر الإجمالي:</strong> <span className="text-warning">{createdBooking.total_price || totalPrice} ج.م</span></div>
              {queueAheadCount !== null && (
                <div className="mb-2 border-top border-secondary pt-2 text-center" style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                  <span>عدد العملاء أمامك في الانتظار: </span>
                  <span style={{ fontSize: '18px' }}>{queueAheadCount}</span>
                </div>
              )}
              <div className="mb-2">
                <strong>الخدمات المحجوزة:</strong>
                <ul className="ps-3 mb-0 text-light" style={{ direction: 'rtl', paddingRight: '20px' }}>
                  {createdBooking.services?.map(s => (
                    <li key={s.id}>{s.service_name}</li>
                  )) || services.filter(s => selectedServices.includes(s.id)).map(s => (
                    <li key={s.id}>{s.service_name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="alert alert-warning p-3 mt-3 text-center border-0" style={{ backgroundColor: '#1F1F1F', color: '#FFF', borderRadius: '8px' }}>
              <span className="material-symbols-outlined text-warning fs-4 mb-2 d-block">info</span>
              <p className="mb-2 text-[13px] text-light">
                لمتابعة رقم دورك وتحديثات طابور الانتظار مباشرة، يمكنك إنشاء حساب الآن بنفس رقم الهاتف الذي استخدمته للحجز: <strong>{createdBooking?.customer?.customer_phone || customerPhone}</strong>
              </p>
              <button 
                className="btn btn-sm btn-outline-warning w-100" 
                onClick={() => { 
                  setShowSuccessModal(false); 
                  navigate(`/register?phone=${createdBooking?.customer?.customer_phone || customerPhone}`); 
                }}
                style={{ fontWeight: 700, border: '2px solid #D4AF37' }}
              >
                إنشاء حساب لمتابعة الانتظار
              </button>
            </div>
          )}

          <p className="text-light mt-3 text-[13px]">يرجى الحضور في الموعد المحدد لضمان تقديم الخدمة بدون انتظار.</p>
        </Modal.Body>
        <Modal.Footer className="border-secondary justify-content-center">
          <button className="btn-gold-cta px-4" onClick={() => setShowSuccessModal(false)}>
            إغلاق
          </button>
          {isAuthenticated && (
            <button className="btn-outline-gold px-4" onClick={() => { setShowSuccessModal(false); navigate('/my-appointments'); }}>
              عرض حجوزاتي
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
