import api from '../api/axios';

export const getServices = async (params) => {
  const response = await api.get('/services', { params });
  return response.data;
};

export const getService = async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data;
};

export const createService = async (data) => {
  const response = await api.post('/services', data);
  return response.data;
};

export const updateService = async (id, data) => {
  const response = await api.put(`/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id) => {
  const response = await api.delete(`/services/${id}`);
  return response.data;
};

export const createServiceFormData = async (formData) => {
  const response = await api.post('/services/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateServiceFormData = async (id, formData) => {
  const response = await api.post(`/services/update/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
