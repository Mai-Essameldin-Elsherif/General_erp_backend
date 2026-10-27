import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export const dashboardService = {
  getUsers: () => api.get('/users').then((r) => extractArray(r.data)),
  getBranches: () => api.get('/branches').then((r) => extractArray(r.data)),
  getDepartments: () => api.get('/departments').then((r) => extractArray(r.data)),
  getAuditLogs: () => api.get('/audit').then((r) => extractArray(r.data)),
  getRoles: () => api.get('/roles').then((r) => extractArray(r.data)),
  getOrganizations: () => api.get('/organization').then((r) => extractArray(r.data)),
};
export default dashboardService;
