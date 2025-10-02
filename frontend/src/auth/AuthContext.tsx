import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode, ReactElement } from "react";
import { login as apiLogin, logout as apiLogout, register as apiRegister } from "../api";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState<boolean>(!!localStorage.getItem("token"));

  useEffect(() => {
    setAuth(!!localStorage.getItem("token"));
  }, []);

  async function login(email: string, password: string) {
    await apiLogin(email, password);
    setAuth(true);
  }
  async function register(name: string, email: string, password: string) {
    await apiRegister(name, email, password);
    setAuth(true);
  }
  function logout() {
    apiLogout();
    setAuth(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* Guard para rutas privadas */
export function Private({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  return children;
}
