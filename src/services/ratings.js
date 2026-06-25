import api from '../api/axios';

/**
 * Fetch basic invoice details for rating.
 */
export const getInvoiceForRating = async (invoiceId) => {
  const response = await api.get(`/ratings/invoice/${invoiceId}`);
  return response.data;
};

/**
 * Submit customer rating.
 */
export const submitRating = async (data) => {
  const response = await api.post('/ratings', data);
  return response.data;
};

/**
 * Get all ratings (Admin only).
 */
export const getRatings = async (params) => {
  const response = await api.get('/ratings', { params });
  return response.data;
};

/**
 * Delete a rating (Admin only).
 */
export const deleteRating = async (id) => {
  const response = await api.delete(`/ratings/${id}`);
  return response.data;
};
