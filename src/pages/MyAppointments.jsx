import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAppointments, getQueueCount } from '../services/appointments';
import { toast } from 'react-toastify';
import { Spinner, Tab, Tabs } from 'react-bootstrap';
import '../App.css';

export default function MyAppointments() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [queueCounts, setQueueCounts] = useState({});

  // Redirect if not authenticated (after auth load finishes)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.warning('يرجى تسجيل الدخول لعرض قائمة حجوزاتك.');
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch appointments
  useEffect(() => {
    const fetchUserAppointments = async () => {
      if (!isAuthenticated) return;
      try {
        setLoadingData(true);
        const res = await getAppointments();
        // Extract array from Laravel paginated response structure
        const list = res?.data?.data || res?.data || [];
        setAppointments(list);
      } catch (error) {
        console.error('Error fetching customer appointments:', error);
        toast.error('حدث خطأ أثناء تحميل الحجوزات.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchUserAppointments();
  }, [isAuthenticated]);

  // Fetch queue counts for pending appointments
  useEffect(() => {
    const fetchQueueCounts = async () => {
      const pendingAppts = appointments.filter(ap => ap.appointment_status === 'pending');
      if (pendingAppts.length === 0) return;

      const counts = {};

      await Promise.all(
        pendingAppts.map(async (ap) => {
          try {
            const data = await getQueueCount({ appointment_id: ap.id, t: Date.now() });
            if (data && data.queue_count !== undefined) {
              counts[ap.id] = data.queue_count;
            }
          } catch (error) {
            console.error(`Error fetching queue count for appt ${ap.id}:`, error);
          }
        })
      );

      setQueueCounts(counts);
    };

    fetchQueueCounts();
  }, [appointments]);

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-black min-vh-100 text-white">
        <Spinner animation="border" variant="warning" />
        <span className="ms-2">جاري التحقق من الهوية...</span>
      </div>
    );
  }

  // Filter appointments
  const activeBookings = appointments.filter(ap => ap.appointment_status === 'pending');
  const pastBookings = appointments.filter(ap => ap.appointment_status === 'completed' || ap.appointment_status === 'cancelled');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning text-dark px-3 py-2">قيد الانتظار (معلق)</span>;
      case 'completed':
        return <span className="badge bg-success px-3 py-2">مكتمل وتمت الخدمة</span>;
      case 'cancelled':
        return <span className="badge bg-danger px-3 py-2">ملغي</span>;
      default:
        return <span className="badge bg-secondary px-3 py-2">{status}</span>;
    }
  };

  const renderBookingCard = (ap) => {
    return (
      <div key={ap.id} className="card bg-dark text-white border-secondary mb-4 overflow-hidden" style={{ borderRadius: '12px', transition: 'border-color 0.3s' }}>
        <div className="card-header bg-black d-flex justify-content-between align-items-center py-3 border-secondary flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-warning">event_available</span>
            <span className="font-bold text-warning" style={{ fontSize: '16px' }}>رقم الحجز: #{ap.id}</span>
          </div>
          <div>{getStatusBadge(ap.appointment_status)}</div>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            {/* Appointment Details */}
            <div className="col-12 col-md-6">
              <div className="mb-2 text-light text-[13px]">تفاصيل الموعد:</div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-light" style={{ fontSize: '18px' }}>calendar_month</span>
                <span><strong>التاريخ:</strong> {ap.appointment_date}</span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-light" style={{ fontSize: '18px' }}>schedule</span>
                <span><strong>وقت الحضور:</strong> {ap.appointment_time}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined text-light" style={{ fontSize: '18px' }}>payments</span>
                <span><strong>التكلفة الإجمالية:</strong> <strong className="text-warning">{ap.total_price || ap.services?.reduce((acc, s) => acc + parseFloat(s.service_price), 0)} ج.م</strong></span>
              </div>
              {ap.appointment_status === 'pending' && queueCounts[ap.id] !== undefined && (
                <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-secondary text-warning" style={{ fontSize: '14px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hourglass_empty</span>
                  <span><strong>العملاء أمامك في الانتظار:</strong> {queueCounts[ap.id]} عميل</span>
                </div>
              )}
            </div>

            {/* Services List */}
            <div className="col-12 col-md-6">
              <div className="mb-2 text-light text-[13px]">الخدمات المطلوبة:</div>
              <div className="p-3 bg-black rounded border border-secondary">
                {/* <ul className="mb-0 ps-0" style={{ listStyle: 'none' }}> */}
                {ap.services && ap.services.map(service => (
                  <div key={service.id} className="d-flex justify-content-between align-items-center mb-1  text-[13px]">
                    <span><span className="material-symbols-outlined text-warning text-[16px] ms-1 ">content_cut</span>{service.service_name}</span>
                    <span className="text-light">{service.service_price} ج.م</span>
                  </div>
                ))}
                {/* </ul> */}
              </div>
            </div>

            {/* Notes */}
            {ap.appointment_notes && (
              <div className="col-12 border-top border-secondary pt-3 mt-2">
                <div className="text-light text-[13px] mb-1">ملاحظاتك:</div>
                <p className="mb-0 text-light italic text-[13px]">{ap.appointment_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="my-appointments-container py-5 min-vh-100" style={{ backgroundColor: '#0b0b0b', color: '#fff' }}>
      <div className="container px-4" style={{ maxWidth: '850px' }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="font-bold text-white mb-2" style={{ fontFamily: 'Cairo', fontSize: '28px' }}>حجوزاتي</h1>
            <p className="text-light mb-0" style={{ fontSize: '14px' }}>عرض تاريخ ومتابعة طلبات الحجز الخاصة بك</p>
          </div>
          <Link to="/" className="btn-outline-gold py-2 px-4 d-flex align-items-center gap-2 text-[14px]">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span>حجز موعد جديد</span>
          </Link>
        </div>

        <div className="gold-divider mb-5"></div>

        {loadingData ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
            <div className="mt-3 text-light">جاري تحميل حجوزاتك...</div>
          </div>
        ) : (
          <Tabs
            defaultActiveKey="active"
            id="my-appointments-tabs"
            className="mb-4 custom-tabs-premium border-secondary"
            variant="tabs"
            style={{ direction: 'rtl' }}
          >
            <Tab eventKey="active" title={`الحجوزات النشطة والقادمة (${activeBookings.length})`}>
              <div className="pt-3">
                {activeBookings.length === 0 ? (
                  <div className="text-center py-5 bg-dark rounded border border-secondary p-4">
                    <span className="material-symbols-outlined text-light text-[48px] mb-2">event_busy</span>
                    <h4 className="text-white text-[16px] mb-2">لا توجد حجوزات نشطة حالياً</h4>
                    <p className="text-light text-[13px] mb-4">بإمكانك حجز موعد للحلاقة الآن وتأكيده مباشرة.</p>
                    <Link to="/" className="btn-gold-cta py-2 px-4 text-[14px]">احجز موعدك الأول</Link>
                  </div>
                ) : (
                  activeBookings.map(ap => renderBookingCard(ap))
                )}
              </div>
            </Tab>

            <Tab eventKey="past" title={`الحجوزات السابقة والمنتهية (${pastBookings.length})`}>
              <div className="pt-3">
                {pastBookings.length === 0 ? (
                  <div className="text-center py-5 bg-dark rounded border border-secondary p-4">
                    <span className="material-symbols-outlined text-light text-[48px] mb-2">history</span>
                    <h4 className="text-white text-[16px]">لا يوجد سجل حجوزات سابقة</h4>
                    <p className="text-light text-[13px] mb-0">جميع حجوزاتك المكتملة أو الملغية ستظهر هنا.</p>
                  </div>
                ) : (
                  pastBookings.map(ap => renderBookingCard(ap))
                )}
              </div>
            </Tab>
          </Tabs>
        )}

      </div>
    </div>
  );
}
