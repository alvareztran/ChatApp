import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authService";
import { userService } from "../services/userService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await userService.getMe();
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      setCurrentUser(null);
      localStorage.removeItem("accessToken");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      // Try refresh token via cookie
      authService
        .refreshToken()
        .then((data) => {
          if (data?.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
            setToken(data.accessToken);
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    }

    const handleAuthExpired = () => {
      setCurrentUser(null);
      setToken(null);
    };

    const handleTokenRefreshed = (event) => {
      if (event.detail) setToken(event.detail);
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    window.addEventListener("auth:token", handleTokenRefreshed);
    return () => {
      window.removeEventListener("auth:expired", handleAuthExpired);
      window.removeEventListener("auth:token", handleTokenRefreshed);
    };
  }, [token, fetchCurrentUser]);

  const login = async (username, password) => {
    const res = await authService.signin({ username, password });
    if (res?.accessToken) {
      localStorage.setItem("accessToken", res.accessToken);
      setToken(res.accessToken);
      setCurrentUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.signup(userData);
    return res;
  };

  const logout = async () => {
    try {
      await authService.signout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("accessToken");
      setToken(null);
      setCurrentUser(null);
    }
  };

  const updateUserProfile = (newUserData) => {
    setCurrentUser((prev) => ({ ...prev, ...newUserData }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
