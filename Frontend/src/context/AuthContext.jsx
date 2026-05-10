import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('omnicart_token');
    const savedUser = localStorage.getItem('omnicart_user');
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed.user);
        setRole(parsed.role);
      } catch {
        localStorage.removeItem('omnicart_token');
        localStorage.removeItem('omnicart_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, loginRole) => {
    const res = await API.post('/auth/login', { email, password, role: loginRole });
    const { token, user: userData } = res.data;
    localStorage.setItem('omnicart_token', token);
    localStorage.setItem('omnicart_user', JSON.stringify({ user: userData, role: loginRole }));
    setUser(userData);
    setRole(loginRole);
    return res.data;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    const { token, user: userData } = res.data;
    localStorage.setItem('omnicart_token', token);
    localStorage.setItem('omnicart_user', JSON.stringify({ user: userData, role: data.role }));
    setUser(userData);
    setRole(data.role);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('omnicart_token');
    localStorage.removeItem('omnicart_user');
    setUser(null);
    setRole(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('omnicart_user', JSON.stringify({ user: updatedUser, role }));
  };

  const value = useMemo(() => ({
    user, role, loading, login, register, logout, updateUser, isAuthenticated: !!user
  }), [user, role, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
