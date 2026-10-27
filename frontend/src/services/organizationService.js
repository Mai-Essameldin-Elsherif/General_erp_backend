import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.organizations)) return res.organizations;
  return [];
};

export const organizationService = {
  getAll: () => api.get('/organization').then((r) => extractArray(r.data)),
  getOne: (id) => api.get(`/organization/${id}`).then((r) => r.data),
  create: (data) => api.post('/organization', data).then((r) => r.data),
  update: (id, data) => api.patch(`/organization/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/organization/${id}`),
};
export default organizationService;
