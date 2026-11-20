import api from './api';

export const userService = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (data) => {
    // data: { displayName, avatarUrl, avatarId, bio, phone }
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/me/avatar', formData);
    return response.data;
  },

  searchUsers: async (keyword) => {
    const response = await api.get(`/users/search?keyword=${encodeURIComponent(keyword)}`);
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};
