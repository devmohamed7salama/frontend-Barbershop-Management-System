import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getInvoices } from '../services/invoices';
import useApi from '../hooks/useApi';
import { Modal, Button, Form } from 'react-bootstrap';
import AdminPagination from '../components/AdminPagination';


export default function Invoices() {
  // Filter States
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Details Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // API Call Wrapper with Memoization
  const fetchInvoicesList = useCallback(() => {
    const params = {
      page: currentPage,
    };
    if (dateFilter) params.date = dateFilter;

    return getInvoices(params);
  }, [dateFilter, currentPage]);

  const { data: response, loading, refetch } = useApi(fetchInvoicesList, {
    dependencies: [dateFilter, currentPage],
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter]);

  // Extract pagination info & list
  const invoicesList = response?.data?.data || response?.data || [];
  const meta = response?.data?.meta || response?.meta || null;

  // Helpers
  const getInitials = (name) => {
    if (!name) return 'ع';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  const getReceiptUrl = (invoiceId, print = false) => {
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    baseUrl = baseUrl.replace(/\/api\/?$/, ''); // Remove trailing /api
    return `${baseUrl}/invoices/print/${invoiceId}${print ? '?print=true' : ''}`;
  };

  const formatWhatsAppPhone = (phone) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      return '2' + cleanPhone; // Egypt country code prefix
    }
    if (cleanPhone.startsWith('1')) {
      return '20' + cleanPhone; // missing leading zero
    }
    return cleanPhone;
  };

  const handleWhatsAppShare = (invoice) => {
    const phone = formatWhatsAppPhone(invoice.customer?.phone || invoice.customer?.customer_phone);
    if (!phone) {
      alert('عذراً، رقم الهاتف غير متوفر لهذه الفاتورة.');
      return;
    }
    const invoiceNumber = invoice.invoice_number || `#INV-${invoice.id}`;
    const receiptUrl = getReceiptUrl(invoice.id);
    const ratingUrl = `${window.location.origin}/rate/${invoice.id}`;
    const message = `مرحباً ${invoice.customer?.name || invoice.customer?.customer_name || 'عميلنا العزيز'}،\n\nيسعدنا زيارتك لصالون المقص الذهبي. 💈✨\n\nهذه تفاصيل فاتورتك رقم ${invoiceNumber} بقيمة ${formatPrice(invoice.total_price)}.\nيمكنك عرضها وطباعتها من خلال الرابط التالي:\n${receiptUrl}\n\nنسعد بتقييمك لخدمتنا من خلال هذا الرابط:\n${ratingUrl}\n\nنشكرك لاختيارك صالوننا الفاخر! ❤️`;
    
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const handleOpenDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }} className="p-md-3">
      {/* Header Area */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center w-100 mb-4 gap-3">
        <div>
          <h2 className="mb-1" style={{ fontWeight: 800, color: '#1A1A1A' }}>الفواتير</h2>
          <p className="text-muted mb-0">متابعة الفواتير الصادرة للعملاء ومراجعة تفاصيل المعاملات المالية.</p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto">
          <Link 
            to="/invoices/quick"
            className="btn d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
            style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none' }}
          >
            <span className="material-symbols-outlined">flash_on</span>
            <span>فاتورة سريعة</span>
          </Link>
          <Link 
            to="/invoices/new"
            className="btn d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
            style={{ backgroundColor: '#1A1A1A', color: '#ffffff', fontWeight: 700, borderRadius: '8px', padding: '10px 20px', border: 'none' }}
          >
            <span className="material-symbols-outlined">add</span>
            <span>إنشاء فاتورة جديدة</span>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4 border-0 p-3" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
        <div className="row g-3 align-items-end">
          {/* Date Filter */}
          <div className="col-md-4">
            <Form.Group>
              <Form.Label style={{ fontSize: '13px', fontWeight: 700, color: '#444748' }}>تصفية حسب التاريخ</Form.Label>
              <Form.Control
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #c4c7c7' }}
              />
            </Form.Group>
          </div>

          {/* Reset Filters */}
          {dateFilter && (
            <div className="col-md-2">
              <button
                onClick={() => setDateFilter('')}
                className="btn btn-outline-secondary w-100"
                style={{ height: '42px', borderRadius: '8px', fontWeight: 600 }}
              >
                إعادة تعيين
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading & Content Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
          <p className="mt-3 text-muted" style={{ fontWeight: 600 }}>جاري جلب الفواتير...</p>
        </div>
      ) : invoicesList.length === 0 ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ borderRadius: '12px' }}>
          <div className="my-3">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: '64px' }}>search_off</span>
          </div>
          <h4 style={{ fontWeight: 700, color: '#1A1A1A' }}>لا توجد فواتير صادرة</h4>
          <p className="text-muted px-3">لم نجد أي فاتورة تطابق التاريخ المحدد أو لا توجد فواتير بالصالون حالياً.</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px' }}>
              <thead className="bg-light" style={{ borderBottom: '1px solid #e0e3e5' }}>
                <tr>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '15%' }}>رقم الفاتورة</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '25%' }}>العميل</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '20%' }}>الحلاق المسؤول</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '15%' }}>التاريخ والوقت</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '13%' }}>القيمة الإجمالية</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold" style={{ fontSize: '12px', width: '12%' }}>الحالة</th>
                  <th className="px-4 py-3 text-muted uppercase tracking-wider font-semibold text-center" style={{ fontSize: '12px', width: '10%' }}>التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoicesList.map((invoice) => (
                  <tr key={invoice.id} style={{ height: '64px' }}>
                    <td className="px-4 py-3" style={{ fontWeight: 700, color: '#1A1A1A' }}>
                      {invoice.invoice_number || `#INV-${invoice.id}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="rounded-full d-flex align-items-center justify-content-center font-bold" 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%',
                            backgroundColor: '#d3e4fe', 
                            color: '#0b1c30',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          {getInitials(invoice.customer?.name || invoice.customer?.customer_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{invoice.customer?.name || invoice.customer?.customer_name || 'عميل زائر'}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{invoice.customer?.phone || 'بدون هاتف'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444748' }}>
                      {invoice.barber_name}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444748', fontSize: '13px' }}>
                      <div>{invoice.appointment_date || invoice.created_at?.split(' ')[0]}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{invoice.appointment_time || invoice.created_at?.split(' ').slice(1).join(' ')}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#1A1A1A' }}>
                      {formatPrice(invoice.total_price)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge rounded-pill px-2.5 py-1.5 bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '11px', fontWeight: 600 }}>
                        مدفوعة
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleOpenDetails(invoice)}
                        className="btn btn-sm btn-light p-2 d-inline-flex align-items-center"
                        title="عرض الفاتورة"
                        style={{ borderRadius: '6px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#444748' }}>visibility</span>
                      </button>
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

      {/* Invoice Details Receipt Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="md" style={{ direction: 'rtl', textAlign: 'right' }}>
        <Modal.Header  className="border-0 pb-0 justify-content-between">
          <Modal.Title style={{ fontWeight: 800, fontFamily: 'Cairo' }}>تفاصيل الفاتورة</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: 'Cairo' }}>
          {selectedInvoice && (
            <div className="p-3 border rounded bg-light" style={{ borderStyle: 'dashed', borderColor: '#747878' }}>
              {/* Receipt Header */}
              <div className="text-center mb-3">
                <h5 style={{ fontWeight: 800, color: '#1A1A1A', margin: 0 }}>صالون المقص الذهبي</h5>
                <p className="text-muted" style={{ fontSize: '12px' }}>نظام إدارة الصالون والمواعيد الفاخر</p>
                <div style={{ borderTop: '2px dashed #c4c7c7', margin: '12px 0' }}></div>
              </div>

              {/* Receipt Body */}
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><strong>رقم الفاتورة:</strong> {selectedInvoice.invoice_number || `#INV-${selectedInvoice.id}`}</div>
                <div className="col-6 text-start"><strong>تاريخ الصدور:</strong> {selectedInvoice.created_at}</div>
                
                <div className="col-6"><strong>العميل:</strong> {selectedInvoice.customer?.name || selectedInvoice.customer?.customer_name || 'عميل زائر'}</div>
                <div className="col-6 text-start"><strong>رقم الهاتف:</strong> {selectedInvoice.customer?.phone || 'بدون هاتف'}</div>

                <div className="col-12"><strong>الحلاق المسؤول:</strong> {selectedInvoice.barber_name}</div>
                
                {selectedInvoice.appointment_date && (
                  <div className="col-12">
                    <strong>تفاصيل الحجز:</strong> {selectedInvoice.appointment_date} في تمام الساعة {selectedInvoice.appointment_time}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '2px dashed #c4c7c7', margin: '15px 0' }}></div>

              {/* Receipt Items */}
              <div className="mb-3">
                <h6 style={{ fontWeight: 700, fontSize: '14px', color: '#1A1A1A', marginBottom: '8px' }}>الخدمات المقدمة:</h6>
                  {selectedInvoice.items?.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center px-0 py-2 bg-transparent">
                      <span>{item.service_name}</span>
                      <span style={{ fontWeight: 600 }}>{formatPrice(item.price || item.service_price)}</span>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between align-items-center px-0 py-2 bg-transparent" style={{ borderTop: '2px solid #c4c7c7' }}>
                    <span style={{ fontWeight: 700 }}>الإجمالي الكلي:</span>
                    <span style={{ fontWeight: 800, color: '#D4AF37', fontSize: '16px' }}>{formatPrice(selectedInvoice.total_price)}</span>
                  </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center mt-3 text-muted" style={{ fontSize: '11px' }}>
                <p className="mb-1">نشكركم على زيارتكم لصالوننا الفاخر!</p>
                <p className="mb-0">تمت العملية بنجاح - تم الدفع</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex flex-wrap justify-content-between gap-2" style={{ fontFamily: 'Cairo' }}>
          <div className="d-flex gap-2 flex-grow-1">
            {selectedInvoice && (
              <>
                <a 
                  href={getReceiptUrl(selectedInvoice.id, false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark d-flex align-items-center gap-2"
                  style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px', fontSize: '13px', textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                  <span>عرض الفاتورة</span>
                </a>

                <a 
                  href={getReceiptUrl(selectedInvoice.id, true)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-warning d-flex align-items-center gap-2 text-dark"
                  style={{ fontFamily: 'Cairo', fontWeight: 700, borderRadius: '8px', fontSize: '13px', backgroundColor: '#D4AF37', border: 'none', textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                  <span>طباعة وتنزيل</span>
                </a>

                {selectedInvoice.customer?.phone && selectedInvoice.customer?.phone !== '0000000000' && (
                  <button 
                    onClick={() => handleWhatsAppShare(selectedInvoice)}
                    className="btn text-white d-flex align-items-center gap-2"
                    style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px', fontSize: '13px', backgroundColor: '#25D366', border: 'none' }}
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 2.051 14.12 1.01 11.5 1.012c-5.438 0-9.863 4.372-9.867 9.8-.001 2.01.528 3.975 1.532 5.727L2.105 20.3l3.966-1.03c1.636.886 3.14 1.34 4.576 1.34h.001zm10.744-7.405c-.272-.137-1.61-.795-1.86-.886-.25-.092-.432-.137-.61.137-.182.273-.706.886-.865 1.069-.158.183-.317.206-.59.068-.272-.137-1.15-.425-2.19-1.353-.807-.72-1.352-1.61-1.51-1.883-.158-.273-.017-.42.12-.556.123-.122.272-.319.408-.478.136-.159.182-.272.272-.455.09-.182.046-.341-.023-.478-.069-.137-.61-1.472-.837-2.017-.22-.53-.442-.457-.61-.466-.157-.008-.339-.01-.52-.01-.182 0-.477.067-.727.341-.25.272-.953.932-.953 2.273s.977 2.636 1.114 2.818c.137.182 1.92 2.932 4.654 4.113.65.28 1.157.447 1.554.573.653.208 1.248.178 1.717.108.523-.078 1.61-.659 1.837-1.295.227-.636.227-1.182.158-1.295-.069-.114-.25-.182-.523-.319z"/>
                    </svg>
                    <span>واتساب</span>
                  </button>
                )}
              </>
            )}
          </div>
          <Button variant="dark" onClick={() => setShowDetailsModal(false)} style={{ fontFamily: 'Cairo', fontWeight: 600, borderRadius: '8px', fontSize: '13px' }}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
