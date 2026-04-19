import { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved && token) setUser(JSON.parse(saved));
  }, [token]);

  const login = async (email, password) => {
    setLoading(true); setError("");
    const res = await api.login({ email, password });
    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      setLoading(false);
      return { success: true };
    }
    setError(res.detail || "Login failed");
    setLoading(false);
    return { success: false };
  };

  const register = async (data) => {
    setLoading(true); setError("");
    const res = await api.register(data);
    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      setLoading(false);
      return { success: true };
    }
    setError(res.detail || "Registration failed");
    setLoading(false);
    return { success: false };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
