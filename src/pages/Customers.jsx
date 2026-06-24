import React, { useState, useEffect, useCallback } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customers';
import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';
import AdminPagination from '../components/AdminPagination';


export default function Customers() {
  // Filter States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // API Call Wrapper with Memoization
  const fetchCustomersList = useCallback(() => {
    const params = {
      page: currentPage,
    };
    if (debouncedSearch) params.search = debouncedSearch;

    return getCustomers(params);
  }, [debouncedSearch, currentPage]);

  // Caching configuration using useApi
  const cacheKey = `customers-list-${debouncedSearch}-${currentPage}`;
  const { data: response, loading, refetch, invalidateCache } = useApi(fetchCustomersList, {
    dependencies: [debouncedSearch, currentPage],
    cacheKey,
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Extract pagination info & list
  const customersList = response?.data?.data || response?.data || [];
  const meta = response?.data?.meta || response?.meta || null;

  // Helpers
  const getWhatsAppLink = (phone) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}`;
  };

  const getInitials = (name) => {
    if (!name) return 'ع';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  // Actions
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      customer_phone: '',
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      customer_phone: customer.customer_phone,
    });
    setShowFormModal(true);
  };

  const handleOpenDelete = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      toast.warning('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (formData.customer_phone.trim().length !== 11 || !/^\d+$/.test(formData.customer_phone.trim())) {
      toast.warning('يجب أن يكون رقم الهاتف مكوناً من 11 رقماً بالضبط.');
      return;
    }

    try {
      setSubmittingForm(true);
      if (editingCustomer) {
        // Update Customer
        await updateCustomer(editingCustomer.id, formData);
        toast.success('تم تحديث بيانات العميل بنجاح.');
      } else {
        // Create Customer
        await createCustomer(formData);
        toast.success('تم إضافة العميل بنجاح.');
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

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      setSubmittingDelete(true);
      await deleteCustomer(customerToDelete.id);
      toast.success('تم حذف العميل بنجاح.');
      setShowDeleteModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء حذف العميل.';
      toast.error(errorMsg);
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className="p-md-3">
      {/* Header Area */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center w-100 mb-4 gap-3">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>العملاء</h2>
          <p className="text-muted mb-0">إدارة ملفات العملاء وسجل زياراتهم ونسب الإنفاق بالصالون.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
          style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none' }}
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4 border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <div className="row g-3 align-items-end">
          {/* Customer Search */}
          <div className="col-12">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>البحث عن عميل</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="ابحث باسم العميل أو رقم الهاتف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7', paddingRight: '12px' }}
                />
              </div>
            </Form.Group>
          </div>
        </div>
      </div>

      {/* Loading & Content Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
          <p className="mt-3 text-muted" style={{ fontWeight: 600 }}>جاري جلب قائمة العملاء...</p>
        </div>
      ) : customersList.length === 0 ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ borderRadius: '12px' }}>
          <div className="my-3">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '64px' }}>search_off</span>
          </div>
          <h4 style={{ fontWeight: 700, color: '#1A1A1A' }}>لا يوجد عملاء متاحين</h4>
          <p className="text-muted px-3">لم نجد أي عميل مسجل يطابق معايير البحث الحالية.</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px' }}>
              <thead className="bg-light" style={{ borderBottom: '1px solid #e0e3e5' }}>
                <tr>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '35%' }}>العميل</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '20%' }}>رقم الهاتف</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '15%' }}>عدد الزيارات</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '15%' }}>إجمالي الإنفاق</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold text-center" style={{ fontSize: '12px', width: '15%' }}>العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customersList.map((customer) => (
                  <tr key={customer.id} style={{ height: '64px' }}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-full d-flex align-items-center justify-content-center font-bold"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#ffe088',
                            color: '#241a00',
                            fontSize: '14px',
                            fontWeight: 700
                          }}
                        >
                          {getInitials(customer.customer_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{customer.customer_name}</div>
                          {customer.visit_count > 0 ? (
                            <div className="text-muted" style={{ fontSize: '11px' }}>عميل نشط</div>
                          ) : (
                            <div className="text-muted" style={{ fontSize: '11px' }}>عميل جديد</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444748' }}>
                      {customer.customer_phone}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444748' }}>
                      {customer.visit_count || 0}
                    </td>
                    <td className="px-4 py-3" style={{ fontWeight: 600, color: '#1A1A1A' }}>
                      {formatPrice(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {/* WhatsApp Button */}
                        {customer.customer_phone && (
                          <a
                            href={getWhatsAppLink(customer.customer_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success p-2 d-inline-flex align-items-center text-white"
                            title="تواصل عبر واتساب"
                            style={{ borderRadius: '6px', backgroundColor: '#25D366', borderColor: '#25D366' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.031 2c-5.516 0-9.988 4.472-9.988 9.987a9.92 9.92 0 0 0 1.332 4.981L2 22l5.202-1.362a9.92 9.92 0 0 0 4.829 1.237h.004c5.516 0 9.988-4.472 9.988-9.987a9.96 9.96 0 0 0-9.992-9.888zm5.783 14.382c-.247.697-1.444 1.293-1.986 1.344-.492.046-1.127.082-3.218-.788-2.673-1.113-4.387-3.83-4.52-4.007-.133-.178-1.074-1.428-1.074-2.723 0-1.296.677-1.932.918-2.193.24-.262.532-.328.71-.328.177 0 .354.002.507.009.16.007.375-.062.587.45.22.532.753 1.838.82 1.97.065.13.11.284.02.464-.09.18-.133.293-.264.445-.133.15-.278.337-.397.453-.133.13-.272.272-.116.54.156.267.69 1.135 1.48 1.84.975.87 1.792 1.14 2.052 1.272.26.133.41.11.564-.065.155-.178.665-.778.843-1.042.177-.263.354-.22.597-.13.243.09 1.543.727 1.81.86.265.133.442.198.508.312.067.115.067.665-.181 1.361z"/>
                            </svg>
                          </a>
                        )}

                        {/* Call Button */}
                        {customer.customer_phone && (
                          <a
                            href={`tel:${customer.customer_phone}`}
                            className="btn btn-sm btn-primary p-2 d-inline-flex align-items-center text-white"
                            title="اتصال هاتفي"
                            style={{ borderRadius: '6px', backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>call</span>
                          </a>
                        )}

                        {/* Edit Button */}
                        {/* <button
                          onClick={() => handleOpenEdit(customer)}
                          className="btn btn-sm btn-light p-2 d-inline-flex align-items-center"
                          title="تعديل البيانات"
                          style={{ borderRadius: '6px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#444748' }}>edit</span>
                        </button> */}


                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="card-footer bg-white d-flex justify-content-between align-items-center px-4 py-3 border-top" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                عرض الصفحة {meta.current_page} من أصل {meta.last_page}
              </span>
              <AdminPagination
                currentPage={currentPage}
                lastPage={meta.last_page}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <Modal show={showFormModal} onHide={() => !submittingForm && setShowFormModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>
            {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>اسم العميل *</Form.Label>
              <Form.Control
                type="text"
                placeholder="أدخل الاسم الرباعي أو الثلاثي للعميل..."
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7' }}
                disabled={submittingForm}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>رقم الهاتف *</Form.Label>
              <Form.Control
                type="text"
                placeholder="أدخل رقم الهاتف (11 رقماً)..."
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                required
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7' }}
                disabled={submittingForm}
              />
            </Form.Group>
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
              {submittingForm ? 'جاري حفظ البيانات...' : (editingCustomer ? 'تحديث البيانات' : 'إضافة العميل')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !submittingDelete && setShowDeleteModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>حذف بيانات العميل</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
          <p style={{ fontSize: '14px' }}>
            هل أنت متأكد من رغبتك في حذف العميل <strong>{customerToDelete?.customer_name}</strong> نهائياً من الصالون؟
          </p>
          <p className="text-danger mb-0" style={{ fontSize: '12px', fontWeight: 600 }}>
            * تنبيه: سيؤدي حذف العميل إلى إزالته نهائياً من النظام، ولن يؤثر ذلك على إحصائيات الفواتير السابقة.
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
