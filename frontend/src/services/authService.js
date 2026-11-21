import api from "./api";

export const authService = {
  signup: async (data) => {
    // data: { username, password, email, displayName }
    const response = await api.post("/auth/signup", data);
    return response.data;
  },

  signin: async (data) => {
    // data: { username, password }
    const response = await api.post("/auth/signin", data);
    return response.data;
  },

  signout: async () => {
    const response = await api.post("/auth/signout");
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },
};
