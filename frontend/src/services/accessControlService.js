import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.permissions)) return res.permissions;
  return [];
};

export const accessControlService = {
  getAll: () => api.get('/access-control/permissions').then((r) => extractArray(r.data)),
  create: (data) => api.post('/access-control/permissions', data).then((r) => r.data),
};
export default accessControlService;
