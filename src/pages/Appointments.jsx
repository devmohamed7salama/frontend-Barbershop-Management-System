import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAppointments, deleteAppointment, updateAppointmentStatus } from '../services/appointments';
import { getBarbers } from '../services/barbers';
import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';

export default function Appointments() {
  // Filter States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [showBarberModal, setShowBarberModal] = useState(false);
  const [apptToComplete, setApptToComplete] = useState(null);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [apptToDelete, setApptToDelete] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Status Change Confirm Modal States
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [statusConfirmAppt, setStatusConfirmAppt] = useState(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState('');

  // API Call Wrapper with Memoization
  const fetchAppointments = useCallback(() => {
    const params = {
      page: currentPage,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;

    return getAppointments(params);
  }, [debouncedSearch, statusFilter, dateFilter, currentPage]);

  // Caching configuration using useApi
  const cacheKey = `appointments-list-${debouncedSearch}-${statusFilter}-${dateFilter}-${currentPage}`;
  const { data: response, loading, refetch, invalidateCache } = useApi(fetchAppointments, {
    dependencies: [debouncedSearch, statusFilter, dateFilter, currentPage],
    cacheKey,
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, dateFilter]);

  // Load barbers for the modal
  const fetchAvailableBarbers = useCallback(() => getBarbers(), []);
  const { data: barbersResponse, loading: loadingBarbers, refetch: refetchBarbers } = useApi(fetchAvailableBarbers, {
    cacheKey: 'available-barbers-list',
    immediate: false, // only load when barber modal opens
  });

  const availableBarbers = barbersResponse?.data?.data || barbersResponse?.data || [];

  // Extract pagination info & list
  const appointmentsList = response?.data?.data || response?.data || [];
  const meta = response?.data?.meta || response?.meta || null;

  // Helpers
  const getInitials = (name) => {
    if (!name) return 'ع';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  // Status Style Helpers
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'cancelled':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'pending':
      default:
        return 'bg-warning-subtle text-warning border border-warning-subtle';
    }
  };

  const getStatusArabic = (status) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'pending': return 'معلق';
      default: return status;
    }
  };

  // Actions
  const handleViewDetails = (appt) => {
    setSelectedAppt(appt);
    setShowDetailsModal(true);
  };

  const handleOpenStatusChange = (appt, targetStatus) => {
    if (targetStatus === 'completed') {
      // Need barber selection modal to generate invoice
      setApptToComplete(appt);
      setSelectedBarberId('');
      setShowBarberModal(true);
      // Fetch barbers dynamically if cache is empty
      refetchBarbers();
    } else {
      // Open custom confirmation modal instead of window.confirm
      setStatusConfirmAppt(appt);
      setStatusConfirmTarget(targetStatus);
      setShowStatusConfirmModal(true);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusConfirmAppt || !statusConfirmTarget) return;
    try {
      setSubmittingStatus(true);
      await updateAppointmentStatus(statusConfirmAppt.id, { appointment_status: statusConfirmTarget });
      toast.success('تم تحديث حالة الموعد بنجاح');
      setShowStatusConfirmModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء تحديث الحالة.';
      toast.error(errorMsg);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!selectedBarberId) {
      toast.warning('يرجى اختيار حلاق لإكمال الموعد.');
      return;
    }

    try {
      setSubmittingStatus(true);
      await updateAppointmentStatus(apptToComplete.id, {
        appointment_status: 'completed',
        barber_id: parseInt(selectedBarberId),
      });
      toast.success('تم إكمال الموعد بنجاح وإنشاء الفاتورة تلقائياً!');
      setShowBarberModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء إكمال الموعد.';
      toast.error(errorMsg);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleOpenDelete = (appt) => {
    setApptToDelete(appt);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setSubmittingDelete(true);
      await deleteAppointment(apptToDelete.id);
      toast.success('تم حذف الموعد بنجاح.');
      setShowDeleteModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء حذف الموعد.';
      toast.error(errorMsg);
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className='p-md-3'>
      {/* Header Area */}
      <div className="d-flex justify-content-between align-items-end mb-4 ">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>المواعيد</h2>
          <p className="text-muted mb-0">إدارة جدول حجوزات الصالون ومتابعة المواعيد القادمة للعملاء.</p>
        </div>
        <Link
          to="/appointments/new"
          className="btn d-flex align-items-center gap-2"
          style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none' }}
        >
          <span className="material-symbols-outlined">event_available</span>
          <span>حجز موعد جديد</span>
        </Link>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4 border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <div className="row g-3 align-items-end">
          {/* Client Search */}
          <div className="col-lg-4 col-md-12">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>البحث عن عميل</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="اسم العميل أو رقم الهاتف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingRight: '12px', height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7' }}
                />
              </div>
            </Form.Group>
          </div>

          {/* Status Dropdown */}
          <div className="col-lg-3 col-md-6 col-sm-6">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>حالة الموعد</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7', cursor: 'pointer' }}
              >
                <option value="all">كل الحالات</option>
                <option value="pending">معلق</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </Form.Select>
            </Form.Group>
          </div>

          {/* Date Picker */}
          <div className="col-lg-3 col-md-6 col-sm-6">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>تاريخ محدد</Form.Label>
              <Form.Control
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7', cursor: 'pointer' }}
              />
            </Form.Group>
          </div>

          {/* Reset Filters */}
          <div className="col-lg-2 col-md-12 text-lg-end">
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter(''); }}
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ height: '42px', borderRadius: '8px', fontWeight: 600 }}
              disabled={!search && statusFilter === 'all' && !dateFilter}
            >
              <span className="material-symbols-outlined">filter_list_off</span>
              <span>إعادة تعيين</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card shadow-sm border-0 overflow-hidden" style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-right">
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #e2e8f0', height: '48px' }}>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>العميل</th>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>رقم الهاتف</th>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>الخدمات المطلوبة</th>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>التاريخ والوقت</th>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>الحالة</th>
                <th className="px-4 py-3 text-center" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-warning" role="status">
                      <span className="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p className="mt-2 text-muted mb-0">جاري تحميل قائمة المواعيد...</p>
                  </td>
                </tr>
              ) : appointmentsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#c4c7c7' }}>calendar_today</span>
                    <p className="mt-2 mb-0" style={{ fontWeight: 600 }}>لا توجد أي مواعيد مطابقة لخيارات التصفية.</p>
                  </td>
                </tr>
              ) : (
                appointmentsList.map((appt) => (
                  <tr key={appt.id} style={{ minHeight: '64px' }}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white font-weight-bold"
                          style={{ width: '36px', height: '36px', backgroundColor: '#1A1A1A', fontSize: '13px' }}
                        >
                          {getInitials(appt.customer?.customer_name)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{appt.customer?.customer_name || 'عميل غير مسجل'}</span>
                          {appt.source && (
                            <span
                              className="badge ms-2"
                              style={{
                                fontSize: '10px',
                                backgroundColor: appt.source === 'online' ? '#e3f2fd' : '#f5f5f5',
                                color: appt.source === 'online' ? '#0d47a1' : '#616161'
                              }}
                            >
                              {appt.source === 'online' ? 'أونلاين' : 'يدوي'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444748', direction: 'ltr', textAlign: 'right' }}>
                      {appt.customer?.customer_phone || '-'}
                    </td>
                    <td className="px-4 py-3" style={{ maxWidth: '220px' }}>
                      <div className="text-truncate" style={{ color: '#1a1a1a', fontWeight: 500 }}>
                        {appt.services?.map(s => s.service_name).join('، ') || '-'}
                      </div>
                      <small className="text-muted">
                        إجمالي: {formatPrice(appt.total_price || 0)}
                      </small>
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{appt.appointment_date}</div>
                      <div style={{ fontSize: '12px', color: '#747878' }} className="mt-1">{appt.appointment_time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(appt.appointment_status)}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                        {getStatusArabic(appt.appointment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewDetails(appt)}
                          className="btn btn-sm btn-light p-2 d-inline-flex align-items-center"
                          title="عرض التفاصيل"
                          style={{ borderRadius: '6px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#444748' }}>visibility</span>
                        </button>

                        {/* Complete Button (If pending) */}
                        {appt.appointment_status === 'pending' && (
                          <button
                            onClick={() => handleOpenStatusChange(appt, 'completed')}
                            className="btn btn-sm btn-success p-2 d-inline-flex align-items-center text-white"
                            title="إكمال الموعد"
                            style={{ borderRadius: '6px', backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}
                            disabled={submittingStatus}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                          </button>
                        )}

                        {/* Cancel Button (If pending) */}
                        {appt.appointment_status === 'pending' && (
                          <button
                            onClick={() => handleOpenStatusChange(appt, 'cancelled')}
                            className="btn btn-sm btn-outline-danger p-2 d-inline-flex align-items-center"
                            title="إلغاء الموعد"
                            style={{ borderRadius: '6px' }}
                            disabled={submittingStatus}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>cancel</span>
                          </button>
                        )}

                        {/* Re-open Button (If cancelled/completed) */}
                        {/* {appt.appointment_status !== 'pending' && (
                          <button 
                            onClick={() => handleOpenStatusChange(appt, 'pending')}
                            className="btn btn-sm btn-outline-warning p-2 d-inline-flex align-items-center"
                            title="إعادة تعيين كمعلق"
                            style={{ borderRadius: '6px' }}
                            disabled={submittingStatus}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>undo</span>
                          </button>
                        )} */}

                        {/* Delete Button */}
                        {/* <button 
                          onClick={() => handleOpenDelete(appt)}
                          className="btn btn-sm btn-outline-danger p-2 d-inline-flex align-items-center"
                          title="حذف"
                          style={{ borderRadius: '6px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && meta && meta.last_page > 1 && (
          <div className="card-footer border-top border-light d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 px-4 py-3" style={{ backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '13px', color: '#747878', fontWeight: 500 }}>
              عرض الصفحة {meta.current_page} من {meta.last_page} (إجمالي المواعيد: {meta.total})
            </span>
            <div className="d-flex align-items-center gap-1">
              {/* First Page */}
              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                style={{ borderRadius: '6px' }}
              >
                الأولى
              </button>

              {/* Prev Button */}
              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1 d-inline-flex align-items-center"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ borderRadius: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>

              {/* Page numbers (brief display) */}
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, idx) => {
                // Calculate display pages centered around current page
                let targetPage = currentPage - 2 + idx;
                if (currentPage <= 2) targetPage = idx + 1;
                if (currentPage >= meta.last_page - 1) targetPage = meta.last_page - 4 + idx;

                // Fallbacks/constraints
                if (targetPage < 1 || targetPage > meta.last_page) return null;

                return (
                  <button
                    key={targetPage}
                    onClick={() => setCurrentPage(targetPage)}
                    className={`btn btn-sm ${currentPage === targetPage ? 'btn-dark' : 'btn-outline-secondary'} px-3`}
                    style={{ borderRadius: '6px', fontWeight: currentPage === targetPage ? 700 : 500 }}
                  >
                    {targetPage}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1 d-inline-flex align-items-center"
                disabled={currentPage === meta.last_page}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ borderRadius: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>

              {/* Last Page */}
              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1"
                disabled={currentPage === meta.last_page}
                onClick={() => setCurrentPage(meta.last_page)}
                style={{ borderRadius: '6px' }}
              >
                الأخيرة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>تفاصيل الموعد</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {selectedAppt && (
            <div style={{ fontFamily: 'Cairo' }}>
              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded mb-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white font-weight-bold"
                  style={{ width: '48px', height: '48px', backgroundColor: '#1A1A1A', fontSize: '16px' }}
                >
                  {getInitials(selectedAppt.customer?.customer_name)}
                </div>
                <div>
                  <h5 className="mb-1" style={{ fontWeight: 700 }}>{selectedAppt.customer?.customer_name}</h5>
                  <span style={{ fontSize: '13px', color: '#444748' }}>هاتف: {selectedAppt.customer?.customer_phone}</span>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '12px' }}>التاريخ</div>
                  <div style={{ fontWeight: 600 }}>{selectedAppt.appointment_date}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '12px' }}>الوقت</div>
                  <div style={{ fontWeight: 600 }}>{selectedAppt.appointment_time}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '12px' }}>حالة الحجز</div>
                  <span className={`badge rounded-pill px-3 py-2 mt-1 ${getStatusBadgeClass(selectedAppt.appointment_status)}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                    {getStatusArabic(selectedAppt.appointment_status)}
                  </span>
                </div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: '12px' }}>مصدر الحجز</div>
                  <div className="mt-1" style={{ fontWeight: 600 }}>
                    {selectedAppt.source === 'online' ? 'حجز أونلاين (عميل)' : 'إدخال يدوي (مسؤول)'}
                  </div>
                </div>

                <div className="col-12 border-top pt-2">
                  <div className="text-muted mb-1" style={{ fontSize: '12px' }}>الخدمات المطلوبة</div>
                  <ul className="list-group list-group-flush pr-0">
                    {selectedAppt.services?.map((s) => (
                      <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                        <span>{s.service_name}</span>
                        <span style={{ fontWeight: 600 }}>{formatPrice(s.service_price)}</span>
                      </li>
                    ))}
                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2" style={{ borderTop: '2px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 700 }}>الإجمالي الكلي:</span>
                      <span style={{ fontWeight: 800, color: '#D4AF37', fontSize: '16px' }}>{formatPrice(selectedAppt.total_price || 0)}</span>
                    </li>
                  </ul>
                </div>

                {selectedAppt.appointment_notes && (
                  <div className="col-12 border-top pt-2">
                    <div className="text-muted" style={{ fontSize: '12px' }}>ملاحظات العميل</div>
                    <div className="bg-light p-2 rounded mt-1" style={{ fontSize: '13px', color: '#191c1e' }}>
                      {selectedAppt.appointment_notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="dark" onClick={() => setShowDetailsModal(false)} style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 2. Barber Selection Modal (For Completion) */}
      <Modal show={showBarberModal} onHide={() => !submittingStatus && setShowBarberModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>إكمال الموعد وتعيين الحلاق</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleConfirmCompletion}>
          <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
            <p className="text-muted" style={{ fontSize: '13px' }}>
              لإكمال الموعد وإنشاء الفاتورة وتفاصيلها بنجاح، يجب عليك اختيار الحلاق المسؤول الذي قام بأداء الخدمة للعميل.
            </p>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>اختر الحلاق المسؤول *</Form.Label>
              {loadingBarbers ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                  <span className="ms-2 text-muted" style={{ fontSize: '13px' }}>جاري تحميل الحلاقين المتاحين...</span>
                </div>
              ) : availableBarbers.length === 0 ? (
                <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>
                  لا يوجد أي حلاقين مسجلين بالصالون حالياً.
                </div>
              ) : (
                <Form.Select
                  required
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7' }}
                  disabled={submittingStatus}
                >
                  <option value="">-- اختر الحلاق من القائمة --</option>
                  {availableBarbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.barber_name}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            {apptToComplete && (
              <div className="bg-light p-2.5 rounded border mb-2" style={{ fontSize: '13px' }}>
                <div><strong>العميل:</strong> {apptToComplete.customer?.customer_name}</div>
                <div><strong>الخدمات:</strong> {apptToComplete.services?.map(s => s.service_name).join('، ')}</div>
                <div><strong>السعر الإجمالي للفاتورة:</strong> {formatPrice(apptToComplete.total_price || 0)}</div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowBarberModal(false)}
              disabled={submittingStatus}
              style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={submittingStatus || !selectedBarberId}
              style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px', backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}
            >
              {submittingStatus ? 'جاري إرسال الفاتورة...' : 'إكمال الموعد وإصدار الفاتورة'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 2.5 Status Update Confirmation Modal */}
      <Modal show={showStatusConfirmModal} onHide={() => !submittingStatus && setShowStatusConfirmModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>تحديث حالة الحجز</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
          {statusConfirmAppt && (
            <p style={{ fontSize: '14px' }}>
              هل أنت متأكد من تغيير حالة حجز العميل <strong>{statusConfirmAppt.customer?.customer_name}</strong> إلى (<strong>{getStatusArabic(statusConfirmTarget)}</strong>)؟
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowStatusConfirmModal(false)}
            disabled={submittingStatus}
            style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}
          >
            إلغاء
          </Button>
          <Button
            variant="dark"
            onClick={handleConfirmStatusChange}
            disabled={submittingStatus}
            style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px', backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' }}
          >
            {submittingStatus ? 'جاري التحديث...' : 'تأكيد التغيير'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 3. Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !submittingDelete && setShowDeleteModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>حذف الموعد</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
          <p style={{ fontSize: '14px' }}>
            هل أنت متأكد من رغبتك في حذف موعد العميل <strong>{apptToDelete?.customer?.customer_name}</strong> المحدد بتاريخ <strong>{apptToDelete?.appointment_date}</strong> في تمام الساعة <strong>{apptToDelete?.appointment_time}</strong>؟
          </p>
          <p className="text-danger mb-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            * تنبيه: هذا الإجراء نهائي ولا يمكن التراجع عنه.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={submittingDelete}
            style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}
          >
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={submittingDelete}
            style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px' }}
          >
            {submittingDelete ? 'جاري حذف الموعد...' : 'حذف الموعد نهائياً'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
