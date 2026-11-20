import api from './api';

export const friendService = {
  getFriends: async () => {
    const response = await api.get('/friends');
    return response.data;
  },

  deleteFriend: async (friendId) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },
};
