import React from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/dashboard';
import useApi from '../hooks/useApi';
import { Row } from 'react-bootstrap';

export default function Dashboard() {
  // Fetch stats using useApi with memoization/cache
  const { data: response, loading } = useApi(getDashboardStats, {
    cacheKey: 'dashboard-statistics-cache',
  });

  const statsData = response?.data || response || {};
  const statsCards = statsData.stats || [];
  const mostVisiting = statsData.most_visiting_customers || [];
  const mostPaying = statsData.most_paying_customers || [];
  const recentHaircuts = statsData.recent_haircuts || [];
  const popularServices = statsData.popular_services || [];
  const recentShifts = statsData.recent_shifts || [];

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  const getInitials = (name) => {
    if (!name) return 'ع';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Helper to map icons from backend
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'users':
        return 'group';
      case 'scissors':
        return 'content_cut';
      case 'user-tie':
        return 'badge';
     
      case 'wallet':
        return 'payments';
      default:
        return 'monitoring';
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className="p-md-3">
      {/* Header Area */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center w-100 mb-4 gap-3">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>لوحة التحكم</h2>
          <p className="text-muted mb-0">نظرة عامة على أداء الصالون وحركة الحجوزات اليوم.</p>
        </div>

        {/* Dynamic CTAs */}
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto">
          <Link
            to="/invoices/quick"
            className="btn d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
            style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', fontWeight: 700, borderRadius: '8px', padding: '10px 18px', border: 'none' }}
          >
            <span className="material-symbols-outlined">flash_on</span>
            <span>فاتورة سريعة</span>
          </Link>
          <Link
            to="/appointments/new"
            className="btn d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
            style={{ backgroundColor: '#1A1A1A', color: '#ffffff', fontWeight: 700, borderRadius: '8px', padding: '10px 18px', border: 'none' }}
          >
            <span className="material-symbols-outlined">calendar_today</span>
            <span>حجز موعد جديد</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
          <p className="mt-3 text-muted" style={{ fontWeight: 600 }}>جاري جلب إحصائيات لوحة التحكم...</p>
        </div>
      ) : (
        <>
          {/* Top Row: Stat Cards */}
          <div className="row g-4 mb-4">

            {statsCards.map((stat, idx) => (
              <div key={idx} className="col-6 col-md-6 col-lg-3">
                <div
                  className="card h-100 shadow-sm border-0 p-2 p-sm-3 hover-shadow transition-shadow relative overflow-hidden"
                  style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center stat-card-icon-container"
                      style={{
                        width: '42px',
                        height: '42px',
                        backgroundColor: stat.icon === 'wallet' ? '#ffe088' : '#eceef0',
                        color: stat.icon === 'wallet' ? '#745c00' : '#1A1A1A'
                      }}
                    >
                      <span className="material-symbols-outlined">{getIcon(stat.icon)}</span>
                    </div>
                    {stat.icon === 'wallet' && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle py-1 px-2 py-sm-1.5 px-sm-2.5 stat-card-badge" style={{ fontSize: '11px', fontWeight: 600 }}>
                        نشط
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-muted mb-1 stat-card-title" style={{ fontSize: '13px', fontWeight: 600 }}>{stat.name}</p>
                    <h3 className="stat-card-value" style={{ fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                      {stat.icon === 'wallet' ? formatPrice(stat.value) : stat.value}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Redesigned Current Shift Info Area */}
          <div className="col-12 mb-4">
            <div className="card shadow-sm border-0 p-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h5 className="mb-2" style={{ fontWeight: 800, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined text-warning" style={{ fontWeight: 700 }}>schedule</span>
                    الوردية الحالية
                  </h5>

                  {recentShifts.length > 0 && recentShifts[0].shift_status === 'open' ? (
                    <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
                      <div className="p-3 bg-success-subtle text-success rounded-3 border border-success-subtle d-flex align-items-center gap-2">
                        <span className="material-symbols-outlined">lock_open</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>وردية نشطة رقم #{recentShifts[0].id}</div>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>وقت البدء: {recentShifts[0].start_time?.slice(0, 5)}</div>
                        </div>
                      </div>
                      <div>
                        {/* <div className="text-muted mb-0" style={{ fontSize: '12px' }}>الدخل الحالي للوردية</div>
                        <div style={{ fontWeight: 800, color: '#1A1A1A', fontSize: '20px' }}>
                          {formatPrice(recentShifts[0].total_revenue)}
                        </div> */}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="alert alert-warning d-flex align-items-center gap-2 py-2.5 px-3 mb-0" style={{ fontSize: '13px', borderRadius: '8px', border: 'none', backgroundColor: '#FFF9E6', color: '#8A6D00' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error_outline</span>
                        <span style={{ fontWeight: 600 }}>لا توجد وردية نشطة مفتوحة حالياً.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="d-flex flex-column align-items-md-end gap-2">
                  <Link
                    to="/shifts"
                    className="btn d-flex align-items-center gap-2 text-nowrap"
                    style={{
                      backgroundColor: '#1A1A1A',
                      color: '#ffffff',
                      fontWeight: 700,
                      borderRadius: '8px',
                      padding: '10px 18px',
                      border: 'none',
                      fontSize: '13px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                    <span>إدارة الورديات والشيفتات</span>
                  </Link>
                </div>
              </div>

              {/* Important Rules / Alerts */}
              <div className="row g-3 mt-3 border-top pt-3">
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2 text-muted" style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <span className="material-symbols-outlined text-warning" style={{ fontSize: '18px', marginTop: '2px' }}>info</span>
                    <div>
                      <strong style={{ color: '#1A1A1A' }}>تنويه الإحصائيات:</strong> جميع إحصائيات وأرقام الصالون تظهر وتكتمل بشكل نهائي عند إغلاق الوردية الحالية.
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2 text-danger" style={{ fontSize: '12px', lineHeight: '1.6' }}>
                    <span className="material-symbols-outlined text-danger" style={{ fontSize: '18px', marginTop: '2px' }}>warning</span>
                    <div>
                      <strong>تنبيه هام:</strong> لا يمكن إتمام أي حجوزات أو إصدار فواتير للعملاء بدون بدء وردية جديدة.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* Middle Row: Top Clients Tables */}
          <div className="row g-4 mb-4">
            {/* Most Visiting Customers */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                  <h5 style={{ fontWeight: 800, color: '#1A1A1A', margin: 0 }}>العملاء الأكثر زيارة</h5>
                  <span className="material-symbols-outlined text-muted">group</span>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-2 text-muted" style={{ fontSize: '12px' }}>العميل</th>
                        <th className="px-4 py-2 text-muted" style={{ fontSize: '12px' }}>رقم الهاتف</th>
                        <th className="px-4 py-2 text-muted text-center" style={{ fontSize: '12px' }}>عدد الزيارات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostVisiting.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted">لا يوجد بيانات كافية</td>
                        </tr>
                      ) : (
                        mostVisiting.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-full d-flex align-items-center justify-content-center font-bold text-white bg-dark"
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', fontSize: '11px' }}
                                >
                                  {getInitials(customer.customer_name)}
                                </div>
                                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{customer.customer_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted" style={{ fontSize: '13px' }}>{customer.customer_phone}</td>
                            <td className="px-4 py-3 text-center" style={{ fontWeight: 700, color: '#D4AF37' }}>{customer.visits_count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Most Paying Customers */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                  <h5 style={{ fontWeight: 800, color: '#1A1A1A', margin: 0 }}>العملاء الأكثر إنفاقاً</h5>
                  <span className="material-symbols-outlined text-muted">payments</span>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-2 text-muted" style={{ fontSize: '12px' }}>العميل</th>
                        <th className="px-4 py-2 text-muted" style={{ fontSize: '12px' }}>رقم الهاتف</th>
                        <th className="px-4 py-2 text-muted text-center" style={{ fontSize: '12px' }}>إجمالي المدفوعات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostPaying.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted">لا يوجد بيانات كافية</td>
                        </tr>
                      ) : (
                        mostPaying.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-full d-flex align-items-center justify-content-center font-bold"
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', fontSize: '11px', backgroundColor: '#ffe088', color: '#241a00' }}
                                >
                                  {getInitials(customer.customer_name)}
                                </div>
                                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{customer.customer_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted" style={{ fontSize: '13px' }}>{customer.customer_phone}</td>
                            <td className="px-4 py-3 text-center font-semibold" style={{ color: '#1A1A1A' }}>{formatPrice(customer.total_paid)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Haircuts & Shifts */}
          <div className="row g-4">
            {/* Recent Completed Haircuts */}
            <div className="col-12 col-lg-7">
              <div className="card shadow-sm border-0 p-3 h-100" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                <h5 className="mb-4 px-2" style={{ fontWeight: 800, color: '#1A1A1A' }}>آخر حلاقة مكتملة</h5>
                <Row className='gy-4'>

                  {recentHaircuts.length === 0 ? (
                    <div className="text-center text-muted py-4">لا توجد عمليات حلاقة مسجلة مؤخراً</div>
                  ) : (
                    recentHaircuts.map((haircut) => (


                      <div className="col-md-6 ">

                        <div key={haircut.id} className="p-3 h-100 border rounded d-flex justify-content-between align-items-center hover-shadow transition-shadow bg-light" style={{ borderRadius: '8px' }}>
                          <div>
                            <h6 style={{ fontWeight: 700, margin: '0 0 4px 0', color: '#1A1A1A' }}>{haircut.customer_name}</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
                              الخدمات: {haircut.services?.map(s => s.service_name).join('، ')}
                            </p>
                          </div>
                          <div className="text-start">
                            <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 mb-1 d-inline-block" style={{ fontSize: '11px' }}>مكتمل</span>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{haircut.appointment_date} | {haircut.appointment_time?.slice(0, 5)}</div>
                          </div>
                        </div>
                      </div>
                    )
                    )
                  )}
                </Row>

              </div>
            </div>

            {/* Popular Services & Shifts */}
            <div className="col-12 col-lg-5">
              <div className="card shadow-sm border-0 p-3 h-100" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                <h5 className="mb-4" style={{ fontWeight: 800, color: '#1A1A1A' }}>الخدمات الأكثر طلباً</h5>
                <div className="row g-3">
                  {popularServices.slice(0, 2).map((service) => (
                    <div key={service.id} className="col-6">
                      <div className="p-3 rounded border text-center bg-light h-100" style={{ borderRadius: '8px' }}>
                        <span className="material-symbols-outlined text-warning mb-2" style={{ fontSize: '28px' }}>content_cut</span>
                        <h6 className="mb-1 text-truncate" style={{ fontWeight: 700, color: '#1A1A1A', fontSize: '13px' }}>{service.service_name}</h6>
                        <div className="text-muted mb-1" style={{ fontSize: '11px' }}>{service.demand_count} طلب</div>
                        <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: '14px' }}>{formatPrice(service.service_price)}</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
