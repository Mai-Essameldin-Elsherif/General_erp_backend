import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.roles)) return res.roles;
  return [];
};

export const rolesService = {
  getAll: () => api.get('/roles').then((r) => extractArray(r.data)),
  getOne: (id) => api.get(`/roles/${id}`).then((r) => r.data),
  create: (data) => api.post('/roles', data).then((r) => r.data),
  update: (id, data) => api.patch(`/roles/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/roles/${id}`),
};
export default rolesService;
