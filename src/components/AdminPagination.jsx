import React from 'react';

export default function AdminPagination({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;

  // Calculate current block of 3 pages
  const currentBlock = Math.ceil(currentPage / 3);
  const startPage = (currentBlock - 1) * 3 + 1;
  const endPage = Math.min(startPage + 2, lastPage);

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const handlePrevBlock = () => {
    onPageChange(startPage - 1);
  };

  const handleNextBlock = () => {
    onPageChange(endPage + 1);
  };

  return (
    <nav aria-label="Page navigation" className="d-flex justify-content-center align-items-center">
      <ul className="pagination pagination-sm mb-0 gap-2 align-items-center" style={{ direction: 'rtl' }}>
        {/* Right Arrow (Previous Page) */}
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link d-flex align-items-center justify-content-center border"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              color: currentPage === 1 ? '#c4c7c7' : '#1A1A1A',
              backgroundColor: '#ffffff',
              borderColor: '#e0e3e5',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
          </button>
        </li>

        {/* Previous Block Dots (...) */}
        {startPage > 1 && (
          <li className="page-item">
            <button
              className="page-link d-flex align-items-center justify-content-center border"
              onClick={handlePrevBlock}
              title="الصفحات السابقة"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                color: '#1A1A1A',
                backgroundColor: '#ffffff',
                borderColor: '#e0e3e5',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
              }}
            >
              ...
            </button>
          </li>
        )}

        {/* Page Numbers (exactly 3 or less) */}
        {pages.map((page) => (
          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
            <button
              className="page-link d-flex align-items-center justify-content-center border"
              onClick={() => onPageChange(page)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: currentPage === page ? '#1A1A1A' : '#ffffff',
                color: currentPage === page ? '#ffffff' : '#1A1A1A',
                borderColor: currentPage === page ? '#1A1A1A' : '#e0e3e5',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {page}
            </button>
          </li>
        ))}

        {/* Next Block Dots (...) */}
        {endPage < lastPage && (
          <li className="page-item">
            <button
              className="page-link d-flex align-items-center justify-content-center border"
              onClick={handleNextBlock}
              title="الصفحات التالية"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                color: '#1A1A1A',
                backgroundColor: '#ffffff',
                borderColor: '#e0e3e5',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
              }}
            >
              ...
            </button>
          </li>
        )}

        {/* Left Arrow (Next Page) */}
        <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
          <button
            className="page-link d-flex align-items-center justify-content-center border"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === lastPage}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              color: currentPage === lastPage ? '#c4c7c7' : '#1A1A1A',
              backgroundColor: '#ffffff',
              borderColor: '#e0e3e5',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
