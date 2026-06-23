import api from '../api/axios';

export const getAppointments = async (params) => {
  const response = await api.get('/appointments', { params });
  return response.data;
};

export const getAppointment = async (id) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (data) => {
  const response = await api.post('/appointments', data);
  return response.data;
};

export const updateAppointment = async (id, data) => {
  const response = await api.put(`/appointments/${id}`, data);
  return response.data;
};

export const deleteAppointment = async (id) => {
  const response = await api.delete(`/appointments/${id}`);
  return response.data;
};

export const updateAppointmentStatus = async (id, statusData) => {
  const response = await api.post(`/appointments/status/${id}`, statusData);
  return response.data;
};

