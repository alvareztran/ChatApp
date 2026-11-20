import api from './api';

export const friendRequestService = {
  getReceivedRequests: async () => {
    const response = await api.get('/friend_requests/received');
    return response.data;
  },

  sendFriendRequest: async (toUserId, message = '') => {
    const response = await api.post('/friend_requests', { toUserId, message });
    return response.data;
  },

  acceptFriendRequest: async (requestId) => {
    const response = await api.patch(`/friend_requests/${requestId}/accept`);
    return response.data;
  },

  rejectFriendRequest: async (requestId) => {
    const response = await api.patch(`/friend_requests/${requestId}/reject`);
    return response.data;
  },
};
