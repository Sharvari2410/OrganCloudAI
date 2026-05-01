import { createContext, useContext, useMemo, useState } from "react";
import { loginRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("organ_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("organ_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    const response = await loginRequest({ email, password });
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem("organ_token", response.token);
    localStorage.setItem("organ_user", JSON.stringify(response.user));
    return response.user;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("organ_token");
    localStorage.removeItem("organ_user");
  };

  const value = useMemo(
    () => ({ token, user, login, logout, isAuthenticated: Boolean(token) }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
