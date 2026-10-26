import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.departments)) return res.departments;
  return [];
};

export const departmentsService = {
  getAll: () => api.get('/departments').then((r) => extractArray(r.data)),
  getOne: (id) => api.get(`/departments/${id}`).then((r) => r.data),
  create: (data) => api.post('/departments', data).then((r) => r.data),
  update: (id, data) => api.patch(`/departments/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/departments/${id}`),
};
export default departmentsService;
