import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  isOnboarded: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Verify current user state from server
        apiRequest("GET", "/api/auth/me")
          .then((currentUser) => {
            if (currentUser.isOnboarded !== parsedUser.isOnboarded) {
              const updatedUser = { ...parsedUser, isOnboarded: currentUser.isOnboarded };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          })
          .catch((error) => {
            console.warn("Failed to verify user state:", error.message);
            // Only clear auth if it's a 401 (unauthorized), not for network errors
            if (error.message.includes("401")) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setToken(null);
              setUser(null);
            }
          })
          .finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
