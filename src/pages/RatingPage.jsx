import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvoiceForRating, submitRating } from '../services/ratings';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import '../App.css';

export default function RatingPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [shopRate, setShopRate] = useState(0);
  const [shopHover, setShopHover] = useState(0);
  const [barberRate, setBarberRate] = useState(0);
  const [barberHover, setBarberHover] = useState(0);
  const [comment, setComment] = useState('');

  const rateLabels = {
    1: 'سيء جداً',
    2: 'سيء ',
    3: 'مقبول ',
    4: 'جيد ',
    5: 'ممتاز جداً ',
  };

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        const res = await getInvoiceForRating(invoiceId);
        if (res.status === 200) {
          setInvoice(res.data);
          if (res.data.rating_status === 'submitted') {
            setSuccess(true);
          }
        } else {
          toast.error('لم نتمكن من العثور على تفاصيل الفاتورة.');
        }
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء تحميل الفاتورة. يرجى التأكد من الرابط.');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (shopRate === 0) {
      toast.warning('يرجى تقييم الصالون (المكان).');
      return;
    }
    if (barberRate === 0) {
      toast.warning('يرجى تقييم الحلاق.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitRating({
        invoice_id: invoiceId,
        shop_rate: shopRate,
        barber_rate: barberRate,
        comment: comment,
      });

      if (res.status === 201) {
        setSuccess(true);
        toast.success(res.message || 'تم إرسال التقييم بنجاح. شكراً لك!');
      } else {
        toast.error(res.message || 'حدث خطأ أثناء إرسال التقييم.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'حدث خطأ في النظام أثناء إرسال تقييمك.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center bg-black min-vh-100 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <Spinner animation="border" variant="warning" style={{ width: '3rem', height: '3rem' }} />
        <span className="mt-3 text-warning font-bold" style={{ fontSize: '18px' }}>جاري تحميل تفاصيل الفاتورة...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-black min-vh-100 px-3" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
        <div className="card bg-dark text-white border-danger text-center p-5" style={{ maxWidth: '500px', borderRadius: '16px', borderTop: '6px solid #dc3545' }}>
          <span className="material-symbols-outlined text-danger text-[64px] mb-3">error</span>
          <h2 className="font-bold text-white mb-3" style={{ fontSize: '24px' }}>خطأ في الفاتورة</h2>
          <p className="text-light mb-4" style={{ fontSize: '15px' }}>رابط التقييم هذا غير صالح أو أن الفاتورة المطلوبة غير موجودة في النظام.</p>
          <Link to="/" className="btn w-100 py-3 font-bold" style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', borderRadius: '8px' }}>العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-black min-vh-100 px-3" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
        <div className="card text-white text-center p-5 position-relative overflow-hidden"
          style={{
            maxWidth: '500px',
            borderRadius: '20px',
            backgroundColor: '#161616',
            border: '1px solid #333',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
            borderTop: '6px solid #D4AF37'
          }}>
          {/* Subtle background glow */}
          <div className="position-absolute" style={{ width: '150px', height: '150px', backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: '50%', filter: 'blur(40px)', top: '-50px', left: '-50px' }}></div>
          <div className="position-absolute" style={{ width: '150px', height: '150px', backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: '50%', filter: 'blur(40px)', bottom: '-50px', right: '-50px' }}></div>

          <div className="mb-4 d-inline-flex align-items-center m-auto justify-content-center" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '2px solid #D4AF37' }}>
            <span className="material-symbols-outlined text-warning text-[42px] animate-bounce">check_circle</span>
          </div>

          <h2 className="font-bold text-white mb-2" style={{ fontSize: '26px' }}>شكراً جزيلاً لتقييمك!</h2>
          <p className="text-warning mb-4" style={{ fontSize: '14px', fontWeight: '600' }}>فاتورة رقم {invoice.invoice_number}</p>

          <p className="text-light mb-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>
            نسعد دائماً بزيارتك لصالون <strong>المقص الذهبي</strong>. رأيك يساعدنا على تحسين جودة خدماتنا وتقديم تجربة حلاقة فاخرة تليق بك.
          </p>

          <div className="p-3 bg-black rounded border border-secondary mb-4 text-start">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-light">العميل:</span>
              <span className="font-bold text-white">{invoice.customer_name}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-light">الحلاق:</span>
              <span className="font-bold text-warning">{invoice.barber_name}</span>
            </div>
          </div>

          <Link to="/" className="btn w-100 py-3 font-bold text-decoration-none" style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', borderRadius: '10px', fontSize: '16px', transition: 'all 0.3s' }}>
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (currentRate, setRate, hoverRate, setHoverRate) => {
    return (
      <div className="d-flex gap-2 justify-content-center align-items-center py-2" style={{ direction: 'ltr' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoverRate || currentRate);
          return (
            <button
              key={star}
              type="button"
              className="btn p-0 border-0 outline-none star-btn"
              onClick={() => setRate(star)}
              onMouseEnter={() => setHoverRate(star)}
              onMouseLeave={() => setHoverRate(0)}
              style={{ background: 'none', transition: 'transform 0.2s', transform: hoverRate === star ? 'scale(1.25)' : 'scale(1)' }}
            >
              <span
                className="material-symbols-outlined text-[36px]"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  color: isActive ? '#D4AF37' : '#555555',
                  cursor: 'pointer'
                }}
              >
                star
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-vh-100 py-5 px-3 bg-black d-flex justify-content-center align-items-center" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      <div className="card text-white overflow-hidden shadow-lg border-0"
        style={{
          width: '100%',
          maxWidth: '550px',
          borderRadius: '24px',
          backgroundColor: '#121212',
          border: '1px solid #222',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
        }}>

        {/* Brand Banner */}
        <div className="py-4 text-center border-bottom border-secondary position-relative" style={{ backgroundColor: '#1A1A1A' }}>
          <div className="position-absolute" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(212, 175, 55, 0.05)', borderRadius: '50%', filter: 'blur(20px)', top: '10px', left: '10px' }}></div>
          <span className="material-symbols-outlined text-warning text-[40px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>content_cut</span>
          <h2 className="font-bold text-white m-0" style={{ fontSize: '22px', letterSpacing: '0.5px' }}>صالون المقص الذهبي</h2>
          <p className="text-light mb-0 mt-1 text-[13px]">نظام التقييم الفاخر للخدمات</p>
        </div>

        {/* Content Body */}
        <div className="card-body p-4 p-md-5">
          <div className="mb-4 text-center">
            <h3 className="font-bold text-white mb-2" style={{ fontSize: '20px' }}>مرحباً بك، {invoice.customer_name}</h3>
            <p className="text-light text-[14px]">يسعدنا زيارتك ويسرنا معرفة رأيك حول الخدمة المقدمة لك.</p>
          </div>

          {/* Quick Info Grid */}
          <div className="row g-2 mb-4 p-3 rounded" style={{ backgroundColor: '#181818', border: '1px solid #282828' }}>
            <div className="col-6 text-center border-start border-secondary">
              <span className="text-light text-[12px] d-block mb-1">رقم الفاتورة</span>
              <span className="font-bold text-white text-[14px]">{invoice.invoice_number}</span>
            </div>
            <div className="col-6 text-center">
              <span className="text-light text-[12px] d-block mb-1">الحلاق المسؤول</span>
              <span className="font-bold text-warning text-[14px]">{invoice.barber_name}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">

            {/* Shop Rating */}
            <div className="text-center bg-[#161616] p-3 rounded-lg" style={{ border: '1px solid #222' }}>
              <label className="form-label font-bold text-white d-block mb-1" style={{ fontSize: '15px' }}>
                تقييم الصالون (المكان والضيافة)
              </label>
              <span className="text-light text-[11px] d-block mb-2">كيف كانت تجربتك العامة داخل الصالون؟</span>
              {renderStars(shopRate, setShopRate, shopHover, setShopHover)}
              <span className="text-warning font-bold d-block mt-1 text-[13px]" style={{ minHeight: '20px' }}>
                {shopRate > 0 ? rateLabels[shopRate] : 'اختر التقييم بالنجوم'}
              </span>
            </div>

            {/* Barber Rating */}
            <div className="text-center bg-[#161616] p-3 rounded-lg" style={{ border: '1px solid #222' }}>
              <label className="form-label font-bold text-white d-block mb-1" style={{ fontSize: '15px' }}>
                تقييم الحلاق ({invoice.barber_name})
              </label>
              <span className="text-light text-[11px] d-block mb-2">كيف تقيم جودة الحلاقة واحترافية الحلاق؟</span>
              {renderStars(barberRate, setBarberRate, barberHover, setBarberHover)}
              <span className="text-warning font-bold d-block mt-1 text-[13px]" style={{ minHeight: '20px' }}>
                {barberRate > 0 ? rateLabels[barberRate] : 'اختر التقييم بالنجوم'}
              </span>
            </div>

            {/* Notes / Comments */}
            <div className="">
              <label htmlFor="comments" className="form-label font-bold text-white mb-2" style={{ fontSize: '15px' }}>
                ملاحظات أو مقترحات إضافية (اختياري)
              </label>
              <textarea
                id="comments"
                className="form-control bg-dark text-white border-secondary"
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب هنا أي ملاحظات تود مشاركتها معنا لتطوير خدماتنا..."
                style={{ borderRadius: '10px', fontSize: '13px', resize: 'none' }}
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn py-3 font-bold mt-2 d-flex align-items-center justify-content-center gap-2"
              style={{
                backgroundColor: '#D4AF37',
                color: '#1A1A1A',
                borderRadius: '12px',
                fontSize: '16px',
                border: 'none',
                transition: 'all 0.3s',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" variant="dark" />
                  <span>جاري إرسال تقييمك...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  <span>إرسال التقييم</span>
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
