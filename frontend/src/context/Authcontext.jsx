import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ── Restore session from localStorage on mount ──
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          try {
            // Verify token with backend
            const res = await api.get('/auth/me');
            if (isMounted) {
              const freshUser = res.data;
              setToken(savedToken);
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          } catch (err) {
            if (err?.response?.status === 401) {
              if (isMounted) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
              }
            } else if (isMounted) {
              try {
                setUser(JSON.parse(savedUser));
                setToken(savedToken);
              } catch {}
            }
          }
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Login ──
  const login = useCallback(
    async (email, password) => {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      navigate('/dashboard', { replace: true });
      return response.data;
    },
    [navigate]
  );

  // ── Logout ──
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // ── Helpers ──
  const isAuthenticated = !!token && !!user;
  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      const userRole = user?.role?.toLowerCase();
      const arr = (Array.isArray(roles) ? roles : [roles]).map((r) => r.toLowerCase());
      return arr.includes(userRole);
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, token, loading, isAuthenticated, login, logout, hasRole }),
    [user, token, loading, isAuthenticated, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
export default AuthContext;
