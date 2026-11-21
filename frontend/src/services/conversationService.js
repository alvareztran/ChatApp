import api from "./api";

export const conversationService = {
  getConversations: async () => {
    const response = await api.get("/conversations");
    return response.data;
  },

  createConversation: async ({
    type = "direct",
    participants = [],
    name = "",
  }) => {
    const response = await api.post("/conversations", {
      type,
      participants,
      name,
    });
    return response.data;
  },

  getConversation: async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  },

  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  },
};
