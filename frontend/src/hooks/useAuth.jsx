import { useState, useContext, createContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Mock login for now
      console.log('Logging in:', email);
      
      const mockUser = {
        id: '1',
        email: email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER'
      };
      
      setUser(mockUser);
      setAccessToken('mock-token');
      localStorage.setItem('accessToken', 'mock-token');
      
      return { success: true, user: mockUser };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('Registering:', userData);
      
      return { 
        success: true, 
        message: 'Registration successful. Please check your email.' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  useEffect(() => {
    // Auto-login for demo purposes
    if (!user && !loading) {
      const savedToken = localStorage.getItem('accessToken');
      if (savedToken) {
        setUser({
          id: '1',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'CUSTOMER'
        });
      }
    }
    setLoading(false);
  }, [user, loading]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => user && roles.includes(user.role)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};