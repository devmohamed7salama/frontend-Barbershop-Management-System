import React, { useState, useEffect, useCallback } from 'react';
import { getBarbers, createBarber, updateBarber, deleteBarber } from '../services/barbers';
import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';

export default function Barbers() {
  // Filter States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [formData, setFormData] = useState({
    barber_name: '',
    barber_phone: '',
    barber_nid: '',
    salary: '',
    barber_status: 'available',
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Status Confirm Modal States
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [barberToConfirmStatus, setBarberToConfirmStatus] = useState(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // API Call Wrapper with Memoization
  const fetchBarbersList = useCallback(() => {
    const params = {
      page: currentPage,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== 'all') params.status = statusFilter;

    return getBarbers(params);
  }, [debouncedSearch, statusFilter, currentPage]);

  // Caching configuration using useApi
  const cacheKey = `barbers-list-${debouncedSearch}-${statusFilter}-${currentPage}`;
  const { data: response, loading, refetch, invalidateCache } = useApi(fetchBarbersList, {
    dependencies: [debouncedSearch, statusFilter, currentPage],
    cacheKey,
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Extract pagination info & list
  const barbersList = response?.data?.data || response?.data || [];
  const meta = response?.data?.meta || response?.meta || null;

  // Helpers
  const getInitials = (name) => {
    if (!name) return 'ح';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  const getStatusBadgeClass = (status) => {
    return status === 'available'
      ? 'bg-success-subtle text-success border border-success-subtle'
      : 'bg-danger-subtle text-danger border border-danger-subtle';
  };

  const getStatusArabic = (status) => {
    return status === 'available' ? 'متاح' : 'غير متاح';
  };

  // Actions
  const handleOpenAdd = () => {
    setEditingBarber(null);
    setFormData({
      barber_name: '',
      barber_phone: '',
      barber_nid: '',
      salary: '',
      barber_status: 'available',
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (barber) => {
    setEditingBarber(barber);
    setFormData({
      barber_name: barber.barber_name || '',
      barber_phone: barber.barber_phone || '',
      barber_nid: barber.barber_nid || '',
      salary: barber.salary || '',
      barber_status: barber.barber_status || 'available',
    });
    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.barber_name || !formData.barber_phone || !formData.barber_nid || !formData.salary) {
      toast.warning('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (formData.barber_phone.length !== 11 || !/^\d+$/.test(formData.barber_phone)) {
      toast.warning('يجب أن يكون رقم الهاتف مكوناً من 11 رقماً بالضبط.');
      return;
    }

    if (formData.barber_nid.length !== 14 || !/^\d+$/.test(formData.barber_nid)) {
      toast.warning('يجب أن يكون الرقم القومي مكوناً من 14 رقماً بالضبط.');
      return;
    }

    try {
      setSubmittingForm(true);
      const dataToSubmit = {
        ...formData,
        salary: parseFloat(formData.salary),
      };

      if (editingBarber) {
        await updateBarber(editingBarber.id, dataToSubmit);
        toast.success('تم تحديث بيانات الحلاق بنجاح.');
      } else {
        await createBarber(dataToSubmit);
        toast.success('تم إضافة الحلاق بنجاح.');
      }

      setShowFormModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات.';
      toast.error(errorMsg);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleToggleStatus = (barber) => {
    setBarberToConfirmStatus(barber);
    setShowStatusConfirmModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!barberToConfirmStatus) return;
    const nextStatus = barberToConfirmStatus.barber_status === 'available' ? 'unavailable' : 'available';
    try {
      setSubmittingStatus(true);
      await updateBarber(barberToConfirmStatus.id, {
        barber_name: barberToConfirmStatus.barber_name,
        barber_phone: barberToConfirmStatus.barber_phone,
        barber_nid: barberToConfirmStatus.barber_nid,
        salary: barberToConfirmStatus.salary,
        barber_status: nextStatus,
      });
      toast.success(`تم تغيير حالة الحلاق إلى (${getStatusArabic(nextStatus)}) بنجاح.`);
      setShowStatusConfirmModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء تعديل الحالة.';
      toast.error(errorMsg);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleOpenDelete = (barber) => {
    setBarberToDelete(barber);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setSubmittingDelete(true);
      await deleteBarber(barberToDelete.id);
      toast.success('تم حذف بيانات الحلاق بنجاح.');
      setShowDeleteModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء حذف الحلاق.';
      toast.error(errorMsg);
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className="p-md-3">
      {/* Header Area */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>الحلاقين</h2>
          <p className="text-muted mb-0">إدارة طاقم عمل صالون الحلاقة، ومتابعة حالات تواجدهم، ورواتبهم الشهرية.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn d-flex align-items-center gap-2"
          style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none' }}
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>إضافة حلاق جديد</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4 border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <div className="row g-3 align-items-end">
          {/* Barber Search */}
          <div className="col-md-7">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>البحث عن حلاق</Form.Label>
              <Form.Control
                type="text"
                placeholder="ابحث باسم الحلاق..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7' }}
              />
            </Form.Group>
          </div>

          {/* Status Filter */}
          <div className="col-md-3">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>حالة الحلاق</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7', cursor: 'pointer' }}
              >
                <option value="all">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="unavailable">غير متاح</option>
              </Form.Select>
            </Form.Group>
          </div>

          {/* Reset Filters */}
          <div className="col-md-2">
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ height: '42px', borderRadius: '8px', fontWeight: 600 }}
              disabled={!search && statusFilter === 'all'}
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
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>الحلاق</th>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>رقم الهاتف</th>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>الرقم القومي</th>
                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 700, color: '#444748' }}>الراتب الشهري</th>
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
                    <p className="mt-2 text-muted mb-0">جاري تحميل قائمة الحلاقين...</p>
                  </td>
                </tr>
              ) : barbersList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#c4c7c7' }}>badge</span>
                    <p className="mt-2 mb-0" style={{ fontWeight: 600 }}>لا يوجد أي حلاقين مسجلين بالنظام مطابعين للمواصفات.</p>
                  </td>
                </tr>
              ) : (
                barbersList.map((barber) => (
                  <tr key={barber.id} style={{ minHeight: '64px' }}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white font-weight-bold"
                          style={{ width: '36px', height: '36px', backgroundColor: '#1A1A1A', fontSize: '13px' }}
                        >
                          {getInitials(barber.barber_name)}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{barber.barber_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444748', direction: 'ltr', textAlign: 'right' }}>
                      {barber.barber_phone}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444748' }}>
                      {barber.barber_nid}
                    </td>
                    <td className="px-4 py-3" style={{ fontWeight: 600, color: '#1A1A1A' }}>
                      {formatPrice(barber.salary)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(barber.barber_status)}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                        {getStatusArabic(barber.barber_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(barber)}
                          className={`btn btn-sm ${barber.barber_status === 'available' ? 'btn-outline-danger' : 'btn-outline-success'} p-2 d-inline-flex align-items-center`}
                          title={barber.barber_status === 'available' ? 'تغيير لغير متاح' : 'تغيير لمتاح'}
                          style={{ borderRadius: '6px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {barber.barber_status === 'available' ? 'person_off' : 'check_circle'}
                          </span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(barber)}
                          className="btn btn-sm btn-light p-2 d-inline-flex align-items-center"
                          title="تعديل البيانات"
                          style={{ borderRadius: '6px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#444748' }}>edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleOpenDelete(barber)}
                          className="btn btn-sm btn-outline-danger p-2 d-inline-flex align-items-center"
                          title="حذف"
                          style={{ borderRadius: '6px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                        </button>
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
              عرض الصفحة {meta.current_page} من {meta.last_page} (إجمالي الحلاقين: {meta.total})
            </span>
            <div className="d-flex align-items-center gap-1">
              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                style={{ borderRadius: '6px' }}
              >
                الأولى
              </button>

              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1 d-inline-flex align-items-center"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ borderRadius: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>

              {Array.from({ length: Math.min(5, meta.last_page) }, (_, idx) => {
                let targetPage = currentPage - 2 + idx;
                if (currentPage <= 2) targetPage = idx + 1;
                if (currentPage >= meta.last_page - 1) targetPage = meta.last_page - 4 + idx;
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

              <button
                className="btn btn-sm btn-outline-secondary px-2 py-1 d-inline-flex align-items-center"
                disabled={currentPage === meta.last_page}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ borderRadius: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>

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

      {/* Add / Edit Form Modal */}
      <Modal show={showFormModal} onHide={() => !submittingForm && setShowFormModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>
            {editingBarber ? 'تعديل بيانات الحلاق' : 'إضافة حلاق جديد'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
            {/* Name */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>اسم الحلاق بالكامل *</Form.Label>
              <Form.Control
                type="text"
                name="barber_name"
                required
                value={formData.barber_name}
                onChange={handleInputChange}
                placeholder="مثال: محمد أحمد علي"
                style={{ height: '42px', borderRadius: '8px' }}
                disabled={submittingForm}
              />
            </Form.Group>

            {/* Phone & National ID */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700 }}>رقم الهاتف *</Form.Label>
                  <Form.Control
                    type="text"
                    name="barber_phone"
                    required
                    maxLength={11}
                    value={formData.barber_phone}
                    onChange={handleInputChange}
                    placeholder="مثال: 01011111111"
                    style={{ height: '42px', borderRadius: '8px' }}
                    disabled={submittingForm}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '11px' }}>مكون من 11 رقماً.</Form.Text>
                </Form.Group>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700 }}>الرقم القومي *</Form.Label>
                  <Form.Control
                    type="text"
                    name="barber_nid"
                    required
                    maxLength={14}
                    value={formData.barber_nid}
                    onChange={handleInputChange}
                    placeholder="مثال: 29901011234567"
                    style={{ height: '42px', borderRadius: '8px' }}
                    disabled={submittingForm}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '11px' }}>مكون من 14 رقماً.</Form.Text>
                </Form.Group>
              </div>
            </div>

            {/* Salary & Status */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700 }}>الراتب الشهري (ج.م) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="salary"
                    required
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="مثال: 5000"
                    style={{ height: '42px', borderRadius: '8px' }}
                    disabled={submittingForm}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700 }}>حالة التواجد *</Form.Label>
                  <Form.Select
                    name="barber_status"
                    value={formData.barber_status}
                    onChange={handleInputChange}
                    style={{ height: '42px', borderRadius: '8px', cursor: 'pointer' }}
                    disabled={submittingForm}
                  >
                    <option value="available">متاح</option>
                    <option value="unavailable">غير متاح</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowFormModal(false)}
              disabled={submittingForm}
              style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="dark"
              disabled={submittingForm}
              style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px', backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' }}
            >
              {submittingForm ? 'جاري حفظ البيانات...' : (editingBarber ? 'تحديث البيانات' : 'إضافة الحلاق')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Status Confirm Modal */}
      <Modal show={showStatusConfirmModal} onHide={() => !submittingStatus && setShowStatusConfirmModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>تغيير حالة الحلاق</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
          {barberToConfirmStatus && (
            <p style={{ fontSize: '14px' }}>
              هل أنت متأكد من تغيير حالة الحلاق <strong>{barberToConfirmStatus.barber_name}</strong> إلى (<strong>{barberToConfirmStatus.barber_status === 'available' ? 'غير متاح' : 'متاح'}</strong>)؟
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
            onClick={handleConfirmToggleStatus}
            disabled={submittingStatus}
            style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px', backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' }}
          >
            {submittingStatus ? 'جاري التحديث...' : 'تأكيد التغيير'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !submittingDelete && setShowDeleteModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>حذف الحلاق</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
          <p style={{ fontSize: '14px' }}>
            هل أنت متأكد من رغبتك في حذف الحلاق <strong>{barberToDelete?.barber_name}</strong> نهائياً من الصالون؟
          </p>
          <p className="text-danger mb-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            * تنبيه: سيؤدي حذف الحلاق إلى إزالته نهائياً من النظام، ولن يؤثر ذلك على فواتيره السابقة.
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
            {submittingDelete ? 'جاري الحذف...' : 'حذف نهائي'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
