import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (mounted) {
          setUser(data.data.user);
          setIsAuthenticated(true);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initAuth();
    return () => { mounted = false; };
  }, []);

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setUser(data.data.user);
    setIsAuthenticated(true);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = useCallback(async () => {
    try {
      if (isAuthenticated) await api.post('/auth/logout');
    } catch {
      // Always clear the local application state, even if the session expired.
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
