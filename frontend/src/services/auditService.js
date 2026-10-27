import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.logs)) return res.logs;
  return [];
};

export const auditService = {
  getAll: () => api.get('/audit').then((r) => extractArray(r.data)),
  getOne: (id) => api.get(`/audit/${id}`).then((r) => r.data),
  create: (data) => api.post('/audit', data).then((r) => r.data),
};
export default auditService;
