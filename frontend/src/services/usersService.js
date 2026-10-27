import api from '../api/axios';

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.users)) return res.users;
  return [];
};

export const usersService = {
  getAll: () => api.get('/users').then((r) => extractArray(r.data)),
  getOne: (id) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data) => api.post('/users', data).then((r) => r.data),
  update: (id, data) => api.patch(`/users/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`),
};
export default usersService;
