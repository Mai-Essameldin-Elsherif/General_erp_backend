import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.branches)) return res.branches;
  return [];
};

export const branchesService = {
  getAll: () => api.get('/branches').then((r) => extractArray(r.data)),
  getOne: (id) => api.get(`/branches/${id}`).then((r) => r.data),
  create: (data) => api.post('/branches', data).then((r) => r.data),
  update: (id, data) => api.patch(`/branches/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/branches/${id}`),
};
export default branchesService;
