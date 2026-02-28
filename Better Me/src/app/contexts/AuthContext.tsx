import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiGetMe, apiUpdateProfile, type User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if we have a stored token and validate it
  useEffect(() => {
    const token = localStorage.getItem('betterme_token');
    if (token) {
      apiGetMe()
        .then((u) => setUser(u))
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('betterme_token');
          localStorage.removeItem('betterme_user');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiLogin(email, password);
      localStorage.setItem('betterme_token', result.token);
      localStorage.setItem('betterme_user', JSON.stringify(result.user));
      setUser(result.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiRegister(name, email, password);
      localStorage.setItem('betterme_token', result.token);
      localStorage.setItem('betterme_user', JSON.stringify(result.user));
      setUser(result.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('betterme_token');
    localStorage.removeItem('betterme_user');
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await apiUpdateProfile(data);
    setUser(updated);
    localStorage.setItem('betterme_user', JSON.stringify(updated));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F0E8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8312A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
