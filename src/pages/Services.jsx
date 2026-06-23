import React, { useState, useEffect, useCallback } from 'react';
import { getServices, createServiceFormData, updateServiceFormData, updateService } from '../services/services';
import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';

export default function Services() {
  // Filter States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    service_price: '',
    service_duration: '',
    service_description: '',
    service_status: 'published',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  // Confirm Status Modal States
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [serviceForStatusToggle, setServiceForStatusToggle] = useState(null);
  const [submittingStatusToggle, setSubmittingStatusToggle] = useState(false);

  // API Call Wrapper with Memoization
  const fetchServicesList = useCallback(() => {
    const params = {
      page: currentPage,
    };
    if (debouncedSearch) params.search = debouncedSearch;

    return getServices(params);
  }, [debouncedSearch, currentPage]);

  // Caching configuration using useApi
  const cacheKey = `services-list-${debouncedSearch}-${currentPage}`;
  const { data: response, loading, refetch, invalidateCache } = useApi(fetchServicesList, {
    dependencies: [debouncedSearch, currentPage],
    cacheKey,
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Cleanup object URL preview on unmount or file change
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Extract pagination info & list
  const servicesList = response?.data?.data || response?.data || [];
  const meta = response?.data?.meta || response?.meta || null;

  // Helpers
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000';

    // Workaround for absolute file paths returned from backend
    let relativePath = imagePath;
    if (imagePath.includes('public/')) {
      relativePath = imagePath.split('public/')[1];
    } else if (imagePath.includes('public\\')) {
      relativePath = imagePath.split('public\\')[1];
    } else if (imagePath.includes('public')) {
      const idx = imagePath.indexOf('public');
      relativePath = imagePath.slice(idx + 6);
    }

    const standardizedPath = relativePath.replace(/\\/g, '/');

    if (!standardizedPath.includes('storage') && !standardizedPath.startsWith('images/')) {
      return `${baseUrl}/storage/${standardizedPath}`;
    }
    const cleanedPath = standardizedPath.startsWith('/') ? standardizedPath : `/${standardizedPath}`;
    return `${baseUrl}${cleanedPath}`;
  };

  // Actions
  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      service_name: '',
      service_price: '',
      service_duration: '',
      service_description: '',
      service_status: 'published',
    });
    setImageFile(null);
    setImagePreview('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name || '',
      service_price: service.service_price || '',
      service_duration: service.service_duration || '',
      service_description: service.service_description || '',
      service_status: service.service_status || 'published',
    });
    setImageFile(null);
    setImagePreview(getImageUrl(service.service_image) || '');
    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning('حجم الصورة كبير جداً. الحد الأقصى هو 2 ميجابايت.');
        e.target.value = null;
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.service_name || !formData.service_price || !formData.service_duration || !formData.service_description) {
      toast.warning('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (!editingService && !imageFile) {
      toast.warning('يرجى اختيار صورة للخدمة الجديدة.');
      return;
    }

    const priceNum = parseFloat(formData.service_price);
    const durationNum = parseInt(formData.service_duration);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.warning('يرجى إدخال سعر صحيح أكبر من الصفر.');
      return;
    }

    if (isNaN(durationNum) || durationNum < 1) {
      toast.warning('يرجى إدخال مدة صحيحة (دقيقة واحدة على الأقل).');
      return;
    }

    try {
      setSubmittingForm(true);
      const submitData = new FormData();
      submitData.append('service_name', formData.service_name);
      submitData.append('service_price', priceNum);
      submitData.append('service_duration', durationNum);
      submitData.append('service_description', formData.service_description);
      submitData.append('service_status', formData.service_status);

      if (imageFile) {
        submitData.append('service_image', imageFile);
      }

      if (editingService) {
        await updateServiceFormData(editingService.id, submitData);
        toast.success('تم تحديث بيانات الخدمة بنجاح.');
      } else {
        await createServiceFormData(submitData);
        toast.success('تم إضافة الخدمة بنجاح.');
      }

      setShowFormModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء حفظ الخدمة.';
      toast.error(errorMsg);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleToggleStatus = (service) => {
    setServiceForStatusToggle(service);
    setShowStatusConfirmModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!serviceForStatusToggle) return;
    const targetStatus = serviceForStatusToggle.service_status === 'published' ? 'hidden' : 'published';
    try {
      setSubmittingStatusToggle(true);
      await updateService(serviceForStatusToggle.id, {
        service_name: serviceForStatusToggle.service_name,
        service_price: parseFloat(serviceForStatusToggle.service_price),
        service_duration: parseInt(serviceForStatusToggle.service_duration),
        service_description: serviceForStatusToggle.service_description,
        service_status: targetStatus
      });
      toast.success('تم تحديث حالة الخدمة بنجاح.');
      setShowStatusConfirmModal(false);
      invalidateCache();
      refetch();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء تحديث حالة الخدمة.';
      toast.error(errorMsg);
    } finally {
      setSubmittingStatusToggle(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className="p-md-3">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>قائمة الخدمات</h2>
          <p className="text-muted mb-0">إدارة باقات وخدمات صالون الحلاقة، وتعديل الأسعار وفترات الحلاقة.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn d-flex align-items-center gap-2"
          style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none' }}
        >
          <span className="material-symbols-outlined">add</span>
          <span>إضافة خدمة جديدة</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm mb-4 border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-10">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>البحث عن خدمة</Form.Label>
              <Form.Control
                type="text"
                placeholder="ابحث باسم الخدمة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7' }}
              />
            </Form.Group>
          </div>
          <div className="col-md-2">
            <button
              onClick={() => setSearch('')}
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ height: '42px', borderRadius: '8px', fontWeight: 600 }}
              disabled={!search}
            >
              <span className="material-symbols-outlined">filter_list_off</span>
              <span>إعادة تعيين</span>
            </button>
          </div>
        </div>
      </div>

      {/* Services Bento Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
          <p className="mt-2 text-muted mb-0">جاري تحميل قائمة الخدمات...</p>
        </div>
      ) : servicesList.length === 0 ? (
        <div className="text-center py-5 card border-0 shadow-sm text-muted" style={{ borderRadius: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#c4c7c7' }}>content_cut</span>
          <p className="mt-2 mb-0" style={{ fontWeight: 600 }}>لا توجد أي خدمات مسجلة بالنظام حالياً.</p>
        </div>
      ) : (
        <>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 mb-4">
            {servicesList.map((service) => {
              const imageSrc = getImageUrl(service.service_image);
              return (
                <div key={service.id} className="col">
                  <div
                    className="card h-100 border-0 shadow-sm overflow-hidden group position-relative"
                    style={{ borderRadius: '16px', transition: 'transform 0.2s', backgroundColor: '#ffffff' }}
                  >
                    {/* Image / Banner */}
                    <div className="position-relative overflow-hidden" style={{ height: '160px', backgroundColor: '#f2f4f6' }}>
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={service.service_name}
                          className="w-100 h-100 object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                          display: imageSrc ? 'none' : 'flex',
                          background: 'linear-gradient(135deg, #1c1b1b 0%, #474746 100%)'
                        }}
                      >
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '48px', opacity: 0.3 }}>content_cut</span>
                      </div>

                      {/* Duration Badge */}
                      <div
                        className="position-absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-pill d-flex align-items-center gap-1 shadow-sm"
                        style={{ border: '1px solid rgba(196,199,199, 0.5)' }}
                      >
                        <span className="material-symbols-outlined text-dark" style={{ fontSize: '15px' }}>schedule</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A' }}>{service.service_duration} دقيقة</span>
                      </div>

                      {/* Popularity Badge if highly demanded */}
                      {service.demand_count > 5 && (
                        <div className="position-absolute top-3 left-3 bg-dark text-white px-2 py-1 rounded-pill" style={{ fontSize: '10px', fontWeight: 700 }}>
                          الأكثر طلباً 🔥
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h4 className="card-title mb-0" style={{ fontWeight: 700, fontSize: '17px', color: '#1A1A1A' }}>{service.service_name}</h4>
                        <span style={{ fontWeight: 800, color: '#D4AF37', fontSize: '18px' }}>{formatPrice(service.service_price)}</span>
                      </div>

                      <p className="card-text text-muted mb-4 flex-grow-1" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                        {service.service_description}
                      </p>

                      <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-auto">
                        <div>
                          <small className="text-muted d-block" style={{ fontWeight: 600 }}>
                            الطلبات: {service.demand_count || 0} حجوزات
                          </small>
                          <span className={`badge rounded-pill mt-1 ${service.service_status === 'published' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '10px' }}>
                            {service.service_status === 'published' ? 'منشور' : 'مخفي'}
                          </span>
                        </div>
                        <div className="d-flex gap-1">
                          {/* Toggle Availability status */}
                          <button
                            onClick={() => handleToggleStatus(service)}
                            className={`btn btn-sm ${service.service_status === 'published' ? 'btn-outline-danger' : 'btn-outline-success'} p-2 d-inline-flex align-items-center`}
                            title={service.service_status === 'published' ? 'إخفاء الخدمة' : 'نشر الخدمة'}
                            style={{ borderRadius: '6px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              {service.service_status === 'published' ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(service)}
                            className="btn btn-sm btn-light p-2 d-inline-flex align-items-center"
                            title="تعديل الخدمة"
                            style={{ borderRadius: '6px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#444748' }}>edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {meta && meta.last_page > 1 && (
            <div
              className="card shadow-sm border-0 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 px-4 py-3"
              style={{ backgroundColor: '#ffffff', borderRadius: '12px' }}
            >
              <span style={{ fontSize: '13px', color: '#747878', fontWeight: 500 }}>
                عرض الصفحة {meta.current_page} من {meta.last_page} (إجمالي الخدمات: {meta.total})
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
        </>
      )}

      {/* Add / Edit Form Modal */}
      <Modal show={showFormModal} onHide={() => !submittingForm && setShowFormModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header
          className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>
            {editingService ? 'تعديل بيانات الخدمة' : 'إضافة خدمة جديدة'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
            {/* Service Name */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>اسم الخدمة *</Form.Label>
              <Form.Control
                type="text"
                name="service_name"
                required
                value={formData.service_name}
                onChange={handleInputChange}
                placeholder="مثال: تحديد ذقن بالبخار"
                style={{ height: '42px', borderRadius: '8px' }}
                disabled={submittingForm}
              />
            </Form.Group>

            {/* Price & Duration */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700 }}>سعر الخدمة (ج.م) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="service_price"
                    required
                    value={formData.service_price}
                    onChange={handleInputChange}
                    placeholder="مثال: 120"
                    style={{ height: '42px', borderRadius: '8px' }}
                    disabled={submittingForm}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label style={{ fontWeight: 700 }}>مدة الخدمة (بالدقائق) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="service_duration"
                    required
                    value={formData.service_duration}
                    onChange={handleInputChange}
                    placeholder="مثال: 30"
                    style={{ height: '42px', borderRadius: '8px' }}
                    disabled={submittingForm}
                  />
                </Form.Group>
              </div>
            </div>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>وصف الخدمة تفصيلياً *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="service_description"
                required
                value={formData.service_description}
                onChange={handleInputChange}
                placeholder="صف تفاصيل الخدمة والمميزات..."
                style={{ borderRadius: '8px' }}
                disabled={submittingForm}
              />
            </Form.Group>

            {/* Status Select */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>حالة ظهور الخدمة للعملاء *</Form.Label>
              <Form.Select
                name="service_status"
                value={formData.service_status}
                onChange={handleInputChange}
                style={{ height: '42px', borderRadius: '8px', cursor: 'pointer' }}
                disabled={submittingForm}
              >
                <option value="published">منشور (متاح للحجز)</option>
                <option value="hidden">مخفي (غير متاح للحجز)</option>
              </Form.Select>
            </Form.Group>

            {/* Service Image */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 700 }}>صورة الخدمة {editingService ? '(اختياري)' : '*'}</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ borderRadius: '8px' }}
                disabled={submittingForm}
              />
              <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                يقبل الصور (jpeg, png, jpg, gif, svg, webp) بحد أقصى 2 ميجابايت.
              </Form.Text>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3 text-center">
                  <div className="text-muted mb-1" style={{ fontSize: '12px' }}>معاينة الصورة الحالية:</div>
                  <img
                    src={imagePreview}
                    alt="معاينة الخدمة"
                    className="img-thumbnail rounded"
                    style={{ maxHeight: '120px', objectFit: 'cover' }}
                  />
                </div>
              )}
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
              {submittingForm ? 'جاري حفظ البيانات...' : (editingService ? 'تحديث الخدمة' : 'إضافة الخدمة')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Status Confirm Modal */}
      <Modal show={showStatusConfirmModal} onHide={() => !submittingStatusToggle && setShowStatusConfirmModal(false)} centered style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header className="border-0 pb-0  justify-content-between ">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>تغيير حالة ظهور الخدمة</Modal.Title>

        </Modal.Header>
        <Modal.Body className="pt-2" style={{ fontFamily: 'Cairo' }}>
          {serviceForStatusToggle && (
            <p style={{ fontSize: '14px' }}>
              هل أنت متأكد من رغبتك في تغيير حالة خدمة <strong>{serviceForStatusToggle.service_name}</strong> إلى <strong>{serviceForStatusToggle.service_status === 'published' ? 'مخفية (غير متاحة للحجز)' : 'منشورة (متاحة للحجز)'}</strong>؟
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowStatusConfirmModal(false)}
            disabled={submittingStatusToggle}
            style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px' }}
          >
            إلغاء
          </Button>
          <Button
            variant={serviceForStatusToggle?.service_status === 'published' ? 'danger' : 'success'}
            onClick={handleConfirmToggleStatus}
            disabled={submittingStatusToggle}
            style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px' }}
          >
            {submittingStatusToggle ? 'جاري التعديل...' : 'تأكيد التغيير'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
