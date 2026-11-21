import api from './api';

export const messageService = {
  getMessages: async (conversationId, limit = 50) => {
    const response = await api.get(`/messages/conversation/${conversationId}?limit=${limit}`);
    return response.data;
  },

  sendMessage: async ({ conversationId, content = '', imgUrl = '', imageFile = null }) => {
    if (imageFile) {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      formData.append('content', content);
      if (imgUrl) formData.append('imgUrl', imgUrl);
      formData.append('image', imageFile);
      const response = await api.post('/messages', formData);
      return response.data;
    }
    const response = await api.post('/messages', { conversationId, content, imgUrl });
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },
};
