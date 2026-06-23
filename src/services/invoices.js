import api from '../api/axios';

export const getInvoices = async (params) => {
  const response = await api.get('/invoices', { params });
  return response.data;
};

export const getInvoice = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data) => {
  const response = await api.post('/invoices', data);
  return response.data;
};

export const updateInvoice = async (id, data) => {
  const response = await api.put(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id) => {
  const response = await api.delete(`/invoices/${id}`);
  return response.data;
};

export const createQuickInvoice = async (data) => {
  const response = await api.post('/invoices/quick', data);
  return response.data;
};
