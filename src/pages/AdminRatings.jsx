import React, { useState, useEffect } from 'react';
import { getRatings, deleteRating } from '../services/ratings';
import { getBarbers } from '../services/barbers';
import { toast } from 'react-toastify';
import { Spinner, Modal, Button, Table, Form, Pagination } from 'react-bootstrap';
import '../App.css';

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });

  // Filters
  const [selectedBarber, setSelectedBarber] = useState('');
  const [shopRateFilter, setShopRateFilter] = useState('');
  const [barberRateFilter, setBarberRateFilter] = useState('');

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch data
  const fetchRatingsData = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        barber_id: selectedBarber,
        shop_rate: shopRateFilter,
        barber_rate: barberRateFilter,
      };

      const res = await getRatings(params);
      if (res.status === 200) {
        // Laravel paginate response structure: res.data.data
        const paginatedData = res.data;
        setRatings(paginatedData.data || []);
        setPagination({
          currentPage: paginatedData.current_page || 1,
          lastPage: paginatedData.last_page || 1,
          total: paginatedData.total || 0,
          perPage: paginatedData.per_page || 10
        });
      } else {
        toast.error('حدث خطأ أثناء تحميل التقييمات.');
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل الاتصال بالخادم لتحميل التقييمات.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBarbersData = async () => {
    try {
      const res = await getBarbers();
      // Handle response structures
      const list = res.data?.data || res.data || [];
      setBarbers(list);
    } catch (err) {
      console.error('Error fetching barbers for filter:', err);
    }
  };

  useEffect(() => {
    fetchBarbersData();
  }, []);

  useEffect(() => {
    fetchRatingsData(1);
  }, [selectedBarber, shopRateFilter, barberRateFilter]);

  const handleDeleteClick = (rating) => {
    setRatingToDelete(rating);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ratingToDelete) return;
    try {
      setDeleting(true);
      const res = await deleteRating(ratingToDelete.id);
      if (res.status === 200) {
        toast.success(res.message || 'تم حذف التقييم بنجاح.');
        setShowDeleteModal(false);
        setRatingToDelete(null);
        // Refresh ratings on current page
        fetchRatingsData(pagination.currentPage);
      } else {
        toast.error(res.message || 'حدث خطأ أثناء حذف التقييم.');
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل في حذف التقييم.');
    } finally {
      setDeleting(false);
    }
  };

  const getReceiptUrl = (invoiceId) => {
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    baseUrl = baseUrl.replace(/\/api\/?$/, ''); // Remove trailing /api
    return `${baseUrl}/invoices/print/${invoiceId}`;
  };

  const renderStars = (count) => {
    return (
      <div className="d-flex text-warning gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className="material-symbols-outlined text-[18px]" 
            style={{ fontVariationSettings: star <= count ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber !== pagination.currentPage) {
      fetchRatingsData(pageNumber);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className="p-md-3">
      {/* Header Area */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center w-100 mb-4 gap-3">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>تقييمات العملاء</h2>
          <p className="text-muted mb-0">مراجعة الآراء والملاحظات الواردة من العملاء حول الصالون والحلاقين.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
            <div className="p-3 bg-light-warning rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(214, 175, 55, 0.15)', color: '#D4AF37' }}>
              <span className="material-symbols-outlined text-[32px]">reviews</span>
            </div>
            <div>
              <span className="text-muted text-[13px] d-block">إجمالي التقييمات</span>
              <h3 className="font-bold mb-0" style={{ color: '#1A1A1A' }}>{pagination.total}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4 border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <div className="row g-3 align-items-end">
          {/* Barber Filter */}
          <div className="col-md-4">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>الحلاق</Form.Label>
              <Form.Select 
                value={selectedBarber} 
                onChange={(e) => setSelectedBarber(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7', cursor: 'pointer' }}
              >
                <option value="">كل الحلاقين</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>{barber.barber_name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          {/* Shop Rating Filter */}
          <div className="col-md-3">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>تقييم الصالون</Form.Label>
              <Form.Select 
                value={shopRateFilter} 
                onChange={(e) => setShopRateFilter(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7', cursor: 'pointer' }}
              >
                <option value="">كل التقييمات</option>
                <option value="5">5 نجوم (ممتاز)</option>
                <option value="4">4 نجوم وأكثر</option>
                <option value="3">3 نجوم وأكثر</option>
                <option value="2">نجمتان وأكثر</option>
                <option value="1">نجمة واحدة وأكثر</option>
              </Form.Select>
            </Form.Group>
          </div>

          {/* Barber Rating Filter */}
          <div className="col-md-3">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>تقييم الحلاق</Form.Label>
              <Form.Select 
                value={barberRateFilter} 
                onChange={(e) => setBarberRateFilter(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7', cursor: 'pointer' }}
              >
                <option value="">كل التقييمات</option>
                <option value="5">5 نجوم (ممتاز)</option>
                <option value="4">4 نجوم وأكثر</option>
                <option value="3">3 نجوم وأكثر</option>
                <option value="2">نجمتان وأكثر</option>
                <option value="1">نجمة واحدة وأكثر</option>
              </Form.Select>
            </Form.Group>
          </div>

          {/* Reset Filters */}
          <div className="col-md-2">
            <button
              onClick={() => { setSelectedBarber(''); setShopRateFilter(''); setBarberRateFilter(''); }}
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ height: '42px', borderRadius: '8px', fontWeight: 600 }}
              disabled={!selectedBarber && !shopRateFilter && !barberRateFilter}
            >
              <span className="material-symbols-outlined">filter_list_off</span>
              <span>إعادة تعيين</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ratings Table */}
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
            <div className="mt-2 text-muted">جاري تحميل التقييمات...</div>
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined text-muted text-[48px] mb-2">rate_review</span>
            <h5 className="text-muted">لا توجد تقييمات مطابقة للفلاتر المحددة</h5>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light text-dark">
                <tr>
                  <th style={{ padding: '16px 20px', fontWeight: '700' }}>التاريخ والوقت</th>
                  <th style={{ padding: '16px 20px', fontWeight: '700' }}>رقم الفاتورة</th>
                  <th style={{ padding: '16px 20px', fontWeight: '700' }}>العميل</th>
                  <th style={{ padding: '16px 20px', fontWeight: '700' }}>الحلاق</th>
                  <th style={{ padding: '16px 20px', fontWeight: '700' }}>تقييم الصالون</th>
                  <th style={{ padding: '16px 20px', fontWeight: '700' }}>تقييم الحلاق</th>
                  <th style={{ padding: '16px 20px', fontWeight: '700', width: '19%' }}>التعليق/الملاحظات</th>
                  {/* <th style={{ padding: '16px 20px', fontWeight: '700' }} className="text-center">إجراءات</th> */}
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => {
                  const customer = rating.invoice?.customer;
                  return (
                    <tr key={rating.id} style={{ transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px 20px', color: '#555', fontSize: '13px' }}>
                        {new Date(rating.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <a 
                          href={getReceiptUrl(rating.invoice_id)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-bold text-decoration-none"
                          style={{ color: '#D4AF37' }}
                        >
                          {rating.invoice?.invoice_number || `#INV-${rating.invoice_id}`}
                        </a>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="font-bold" style={{ color: '#1A1A1A' }}>{customer?.customer_name || 'عميل زائر'}</div>
                        <div className="text-muted text-[11px]">{customer?.customer_phone || 'بدون هاتف'}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: '#1A1A1A' }}>
                        {rating.barber?.barber_name || 'غير محدد'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {renderStars(rating.shop_rate)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {renderStars(rating.barber_rate)}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#444', lineHeight: '1.6' }}>
                        {rating.comment ? (
                          <span>"{rating.comment}"</span>
                        ) : (
                          <span className="text-muted">- لا يوجد تعليق -</span>
                        )}
                      </td>
                      {/* <td style={{ padding: '16px 20px' }} className="text-center">
                        <button
                          onClick={() => handleDeleteClick(rating)}
                          className="btn btn-outline-danger btn-sm border-0 d-inline-flex align-items-center justify-content-center p-2 rounded-circle"
                          title="حذف التقييم"
                          style={{ transition: 'all 0.2s' }}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.lastPage > 1 && (
          <div className="d-flex justify-content-between align-items-center p-4 border-top border-light">
            <span className="text-muted text-[13px]">
              عرض التقييمات {ratings.length} من أصل {pagination.total} تقييم
            </span>
            <Pagination className="mb-0 custom-pagination">
              <Pagination.First onClick={() => handlePageChange(1)} disabled={pagination.currentPage === 1} />
              <Pagination.Prev onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} />
              
              {Array.from({ length: pagination.lastPage }, (_, index) => {
                const page = index + 1;
                return (
                  <Pagination.Item 
                    key={page} 
                    active={page === pagination.currentPage}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Pagination.Item>
                );
              })}

              <Pagination.Next onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage} />
              <Pagination.Last onClick={() => handlePageChange(pagination.lastPage)} disabled={pagination.currentPage === pagination.lastPage} />
            </Pagination>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {/* <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="font-bold" style={{ fontSize: '18px' }}>تأكيد حذف التقييم</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-start py-3">
          <p className="mb-0" style={{ fontSize: '15px', color: '#444' }}>
            هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟
            <br />
            <strong className="text-danger">تنبيه:</strong> سيتم حذف التقييم وإعادة فتح الفاتورة لتمكين العميل من التقييم مجدداً.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-start gap-2">
          <Button 
            variant="danger" 
            onClick={confirmDelete} 
            disabled={deleting}
            style={{ borderRadius: '8px', padding: '8px 20px', fontWeight: 'bold' }}
          >
            {deleting ? 'جاري الحذف...' : 'نعم، احذف'}
          </Button>
          <Button 
            variant="light" 
            onClick={() => setShowDeleteModal(false)}
            style={{ borderRadius: '8px', padding: '8px 20px', fontWeight: 'bold', border: '1px solid #ccc' }}
          >
            إلغاء
          </Button>
        </Modal.Footer>
      </Modal> */}
    </div>
  );
}
