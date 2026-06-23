import api from '../api/axios';

export const getBarbers = async (params) => {
  const response = await api.get('/barbers', { params });
  return response.data;
};

export const getBarber = async (id) => {
  const response = await api.get(`/barbers/${id}`);
  return response.data;
};

export const createBarber = async (data) => {
  const response = await api.post('/barbers', data);
  return response.data;
};

export const updateBarber = async (id, data) => {
  const response = await api.put(`/barbers/${id}`, data);
  return response.data;
};

export const deleteBarber = async (id) => {
  const response = await api.delete(`/barbers/${id}`);
  return response.data;
};
