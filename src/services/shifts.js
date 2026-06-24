import api from '../api/axios';

/**
 * Get paginated list of shifts.
 * @param {Object} params - Query params (e.g. { page })
 */
export const getShifts = async (params) => {
  const response = await api.get('/shifts', { params });
  return response.data;
};

/**
 * Get details of a single shift.
 * @param {number|string} id - Shift ID
 */
export const getShift = async (id) => {
  const response = await api.get(`/shifts/${id}`);
  return response.data;
};

/**
 * Start a new shift.
 */
export const startShift = async () => {
  const response = await api.post('/shifts/start');
  return response.data;
};

/**
 * Close an active shift.
 * @param {number|string} shiftId - Shift ID
 */
export const closeShift = async (shiftId) => {
  const response = await api.post('/shifts/close', { shift_id: shiftId });
  return response.data;
};
