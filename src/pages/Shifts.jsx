import React, { useState, useEffect, useCallback } from 'react';
import { getShifts, startShift, closeShift } from '../services/shifts';
import useApi, { apiCache } from '../hooks/useApi';
import { toast } from 'react-toastify';
import { Modal, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AdminPagination from '../components/AdminPagination';


export default function Shifts() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeShift, setActiveShift] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);

  // Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [shiftToClose, setShiftToClose] = useState(null);
  const [closingSubmit, setClosingSubmit] = useState(false);
  const [startingSubmit, setStartingSubmit] = useState(false);

  // Check the active shift by querying page 1 of shifts
  const checkActiveShift = useCallback(async () => {
    setLoadingActive(true);
    try {
      const res = await getShifts({ page: 1 });
      const list = res?.data?.data || res?.data || [];
      if (list.length > 0 && list[0].shift_status === 'open') {
        setActiveShift(list[0]);
      } else {
        setActiveShift(null);
      }
    } catch (err) {
      console.error("Error checking active shift:", err);
    } finally {
      setLoadingActive(false);
    }
  }, []);

  // API Call Wrapper for Paginated list
  const fetchShiftsList = useCallback(() => {
    return getShifts({ page: currentPage });
  }, [currentPage]);

  const { data: response, loading, refetch, invalidateCache } = useApi(fetchShiftsList, {
    dependencies: [currentPage],
    cacheKey: `shifts-list-page-${currentPage}`,
  });

  // Load active shift status on mount
  useEffect(() => {
    checkActiveShift();
  }, [checkActiveShift]);

  const shiftsList = response?.data?.data || response?.data || [];
  const meta = response?.data || response || {};

  // Normalize pagination meta from Laravel paginator
  const pagination = {
    current_page: meta.current_page || currentPage,
    last_page: meta.last_page || 1,
    total: meta.total || 0,
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    // If it's already HH:MM:SS format
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      const ampm = hours >= 12 ? 'م' : 'ص';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${parts[1]} ${ampm}`;
    }
    return timeStr;
  };

  // Action: Start new Shift
  const handleStartShift = async () => {
    if (activeShift) {
      toast.warning('يوجد وردية عمل نشطة ومفتوحة حالياً بالفعل.');
      return;
    }

    setStartingSubmit(true);
    try {
      const res = await startShift();
      toast.success('تم بدء وردية عمل جديدة بنجاح!');
      // Invalidate all caches
      apiCache.clear();
      // Reload states
      await checkActiveShift();
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء محاولة بدء الوردية.';
      toast.error(errorMsg);
    } finally {
      setStartingSubmit(false);
    }
  };

  // Action: Open Close Shift Confirmation Modal
  const handleOpenCloseModal = (shift) => {
    setShiftToClose(shift);
    setShowCloseModal(true);
  };

  // Action: Confirm Close Shift
  const handleConfirmCloseShift = async () => {
    if (!shiftToClose) return;
    setClosingSubmit(true);
    try {
      await closeShift(shiftToClose.id);
      toast.success(`تم إغلاق الوردية رقم #${shiftToClose.id} بنجاح وتسوية الحسابات!`);
      // Invalidate all caches
      apiCache.clear();
      setShowCloseModal(false);
      setShiftToClose(null);
      // Reload states
      await checkActiveShift();
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء محاولة إغلاق الوردية.';
      toast.error(errorMsg);
    } finally {
      setClosingSubmit(false);
    }
  };

  // Action: Open Details Modal
  const handleOpenDetails = (shift) => {
    setSelectedShift(shift);
    setShowDetailsModal(true);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className="p-md-3">
      {/* Header Area */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center w-100 mb-4 gap-3">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>الورديات والشيفتات</h2>
          <p className="text-muted mb-0">بدء وإغلاق ورديات العمل اليومية ومتابعة حركة الخزينة والمبيعات.</p>
        </div>
        {!activeShift && !loadingActive && (
          <button
            onClick={handleStartShift}
            disabled={startingSubmit}
            className="btn d-flex align-items-center justify-content-center gap-2 text-dark w-100 w-sm-auto"
            style={{ backgroundColor: '#D4AF37', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none' }}
          >
            <span className="material-symbols-outlined">play_arrow</span>
            <span>{startingSubmit ? 'جاري بدء وردية...' : 'بدء وردية جديدة'}</span>
          </button>
        )}
      </div>

      {/* Active Shift Dashboard Widget */}
      <div className="card shadow-sm border-0 p-4 mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <h5 className="mb-3" style={{ fontWeight: 800, color: '#1A1A1A' }}>حالة الوردية الحالية</h5>

        {loadingActive ? (
          <div className="py-2 text-muted">جاري التحقق من حالة الوردية...</div>
        ) : activeShift ? (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 bg-light p-3 rounded-3" style={{ border: '1px solid #e0e3e5' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-success-subtle text-success rounded-3 border border-success-subtle d-flex align-items-center justify-content-center">
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>lock_open</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A1A' }}>وردية عمل مفتوحة #{activeShift.id}</div>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  تاريخ البدء: {formatDate(activeShift.created_at)} | وقت البدء: {formatTime(activeShift.start_time)}
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-4 flex-wrap">
              {/* <div>
                <div className="text-muted" style={{ fontSize: '12px' }}>إجمالي الفواتير</div>
                <div style={{ fontWeight: 800, color: '#1A1A1A', fontSize: '18px' }}>{activeShift.total_orders || 0} فواتير</div>
              </div> */}
              {/* <div className="border-start ps-3" style={{ height: '40px' }}></div> */}
              {/* <div>
                <div className="text-muted" style={{ fontSize: '12px' }}>إجمالي الدخل الحالي</div>
                <div style={{ fontWeight: 800, color: '#D4AF37', fontSize: '18px' }}>{formatPrice(activeShift.total_revenue)}</div>
              </div> */}
              {/* <div className="border-start ps-3" style={{ height: '40px' }}></div> */}
              <button
                onClick={() => handleOpenCloseModal(activeShift)}
                className="btn btn-danger d-flex align-items-center gap-2 py-2 px-3"
                style={{ fontWeight: 700, borderRadius: '8px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
                <span>إغلاق الوردية وتسوية الحساب</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning border-0 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 p-3 mb-0" style={{ borderRadius: '8px', backgroundColor: '#FFF9E6', color: '#8A6D00' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>error_outline</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>لا توجد وردية مفتوحة حالياً</div>
                <div style={{ fontSize: '12.5px', opacity: 0.9 }}>يجب بدء وردية عمل جديدة لتتمكن من إنشاء فواتير حجوزات للزبائن.</div>
              </div>
            </div>
            <button
              onClick={handleStartShift}
              disabled={startingSubmit}
              className="btn btn-warning text-dark font-bold d-flex align-items-center gap-1"
              style={{ fontWeight: 700, borderRadius: '6px', backgroundColor: '#D4AF37', border: 'none', color: '#1A1A1A', fontSize: '13px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
              <span>{startingSubmit ? 'جاري البدء...' : 'بدء الوردية الآن'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Shifts History Card */}
      <h5 className="mb-3" style={{ fontWeight: 800, color: '#1A1A1A' }}>سجل الورديات السابقة</h5>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
          <p className="mt-3 text-muted" style={{ fontWeight: 600 }}>جاري جلب سجل الورديات...</p>
        </div>
      ) : shiftsList.length === 0 ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ borderRadius: '12px' }}>
          <div className="my-3 text-muted">
            <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>history</span>
          </div>
          <h4 style={{ fontWeight: 700, color: '#1A1A1A' }}>سجل الورديات فارغ</h4>
          <p className="text-muted px-3">لم يتم بدء أو إغلاق أي وردية عمل في النظام بعد.</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ minWidth: '900px' }}>
              <thead className="bg-light" style={{ borderBottom: '1px solid #e0e3e5' }}>
                <tr>
                  <th className="px-4 py-3 text-muted font-semibold" style={{ fontSize: '12.5px', width: '10%' }}>رقم الوردية</th>
                  <th className="px-4 py-3 text-muted font-semibold" style={{ fontSize: '12.5px', width: '20%' }}>تاريخ الوردية</th>
                  <th className="px-4 py-3 text-muted font-semibold" style={{ fontSize: '12.5px', width: '15%' }}>الحالة</th>
                  <th className="px-4 py-3 text-muted font-semibold" style={{ fontSize: '12.5px', width: '15%' }}>وقت البدء</th>
                  <th className="px-4 py-3 text-muted font-semibold" style={{ fontSize: '12.5px', width: '15%' }}>وقت الإغلاق</th>
                  <th className="px-4 py-3 text-muted font-semibold" style={{ fontSize: '12.5px', width: '12%' }}>عدد الفواتير</th>
                  <th className="px-4 py-3 text-muted font-semibold" style={{ fontSize: '12.5px', width: '13%' }}>إجمالي الدخل</th>
                  <th className="px-4 py-3 text-muted font-semibold text-center" style={{ fontSize: '12.5px', width: '15%' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {shiftsList.map((shift) => (
                  <tr key={shift.id} style={{ height: '60px' }}>
                    <td className="px-4 py-3" style={{ fontWeight: 700, color: '#1A1A1A' }}>#{shift.id}</td>
                    <td className="px-4 py-3" style={{ color: '#444748' }}>{formatDate(shift.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge rounded-pill px-2.5 py-1.5 ${shift.shift_status === 'open' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'}`}
                        style={{ fontSize: '11px', fontWeight: 600 }}
                      >
                        {shift.shift_status === 'open' ? 'مفتوحة' : 'مغلقة'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatTime(shift.start_time)}</td>
                    <td className="px-4 py-3 text-muted">{formatTime(shift.end_time)}</td>
                    <td className="px-4 py-3" style={{ color: '#444748' }}>{shift.total_orders || 0}</td>
                    <td className="px-4 py-3" style={{ fontWeight: 700, color: '#1A1A1A' }}>{formatPrice(shift.total_revenue)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {/* Details Button */}
                        <button
                          onClick={() => handleOpenDetails(shift)}
                          className="btn btn-sm btn-light p-2 d-inline-flex align-items-center"
                          title="عرض التفاصيل"
                          style={{ borderRadius: '6px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#444748' }}>visibility</span>
                        </button>

                        {/* Close Action if still open */}
                        {shift.shift_status === 'open' && (
                          <button
                            onClick={() => handleOpenCloseModal(shift)}
                            className="btn btn-sm btn-outline-danger p-2 d-inline-flex align-items-center"
                            title="إغلاق الوردية"
                            style={{ borderRadius: '6px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="card-footer bg-white d-flex justify-content-between align-items-center px-4 py-3 border-top" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                عرض الصفحة {pagination.current_page} من أصل {pagination.last_page}
              </span>
              <AdminPagination
                currentPage={currentPage}
                lastPage={pagination.last_page}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* Details View Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>تفاصيل الوردية #{selectedShift?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3" style={{ fontFamily: 'Cairo' }}>
          {selectedShift && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">حالة الوردية:</span>
                <span
                  className={`badge rounded-pill px-2.5 py-1 ${selectedShift.shift_status === 'open' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'}`}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  {selectedShift.shift_status === 'open' ? 'مفتوحة' : 'مغلقة'}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">تاريخ الوردية:</span>
                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{formatDate(selectedShift.created_at)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">وقت البدء:</span>
                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{formatTime(selectedShift.start_time)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">وقت الإغلاق:</span>
                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{formatTime(selectedShift.end_time)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">إجمالي عدد الفواتير:</span>
                <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{selectedShift.total_orders || 0}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">إجمالي الدخل / المبيعات:</span>
                <span style={{ fontWeight: 800, color: '#D4AF37', fontSize: '16px' }}>{formatPrice(selectedShift.total_revenue)}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDetailsModal(false)}
            style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}
          >
            إغلاق النافذة
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Close Shift Confirmation Modal */}
      <Modal show={showCloseModal} onHide={() => !closingSubmit && setShowCloseModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>تأكيد إغلاق الوردية</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
          <p style={{ fontSize: '14.5px' }}>
            هل أنت متأكد من رغبتك في إغلاق الوردية <strong>#{shiftToClose?.id}</strong> وإنهاء شيفت العمل الحالي؟
          </p>
          <div className="bg-light p-3 rounded mb-3" style={{ border: '1px solid #e0e3e5' }}>
            <h6 style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>ملخص حسابات الوردية الحالية:</h6>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted" style={{ fontSize: '13px' }}>إجمالي الفواتير الصادرة:</span>
              <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{shiftToClose?.total_orders || 0} فواتير</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted" style={{ fontSize: '13px' }}>إجمالي الإيرادات للتسوية:</span>
              <span style={{ fontWeight: 800, color: '#D4AF37' }}>{formatPrice(shiftToClose?.total_revenue)}</span>
            </div>
          </div>
          <p className="text-danger mb-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            * تنبيه: عند إغلاق الوردية لن تتمكن من إصدار أي فواتير جديدة حتى تبدأ وردية عمل جديدة.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowCloseModal(false)}
            disabled={closingSubmit}
            style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}
          >
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmCloseShift}
            disabled={closingSubmit}
            style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px' }}
          >
            {closingSubmit ? 'جاري إغلاق الوردية...' : 'إغلاق الوردية وتسوية الحساب'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
