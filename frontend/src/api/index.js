import { api } from './client.js';

// Auth
export const login = (password) => api.post('/auth/login', { password });

// Services
export const getServices      = ()        => api.get('/services');
export const getAllServices    = ()        => api.get('/services/all');
export const updateService    = (id, data) => api.patch(`/services/${id}`, data);

// Car types
export const getCarTypes = () => api.get('/car-types');

// Additional services
export const getAdditionalServices     = ()        => api.get('/additional-services');
export const getAllAdditionalServices   = ()        => api.get('/additional-services/all');
export const updateAdditionalService   = (id, data) => api.patch(`/additional-services/${id}`, data);

// Slots
export const getSlots = (date) => api.get(`/slots?date=${date}`);

// Orders
export const createOrder      = (data)    => api.post('/orders', data);
export const createOrderAdmin = (data)    => api.post('/orders/admin', data);
export const getOrders        = (params)  => api.get('/orders' + toQuery(params));
export const getOrder         = (id)      => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const updateOrderPrice  = (id, final_price) => api.patch(`/orders/${id}/price`, { final_price });
export const updateOrderPlate  = (id, plate_number) => api.patch(`/orders/${id}/plate`, { plate_number });

// Clients
export const getClients = (params) => api.get('/clients' + toQuery(params));
export const getClient  = (id)     => api.get(`/clients/${id}`);

// Staff
export const getStaff      = ()         => api.get('/staff');
export const createStaff   = (data)     => api.post('/staff', data);
export const updateStaff   = (id, data) => api.patch(`/staff/${id}`, data);
export const deleteStaff   = (id)       => api.delete(`/staff/${id}`);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Analytics
export const getAnalytics = (params) => api.get('/analytics' + toQuery(params));

// Checklist
export const getChecklistItems         = ()          => api.get('/checklist/items');
export const getOrderChecklist         = (orderId)   => api.get(`/checklist/order/${orderId}`);
export const initOrderChecklist        = (orderId)   => api.post(`/checklist/order/${orderId}/init`, {});
export const updateOrderChecklist      = (orderId, items, checked_by) =>
  api.patch(`/checklist/order/${orderId}`, { items, checked_by });

function toQuery(params) {
  if (!params) return '';
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
}
