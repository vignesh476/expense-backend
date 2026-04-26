import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getUser, setUser, logout } from '../utils/auth';

const AuthContext = createContext();

const initialState = {
  user: null,
  loading: true
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    case 'LOADING':
      return { ...state, loading: true };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const user = getUser();
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
    } else {
      dispatch({ type: 'LOADING', payload: false });
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    dispatch({ type: 'SET_USER', payload: userData });
  };

  const userLogout = async () => {
    try {
      await import('../api').then(m => m.default.post('/auth/logout/'));
    } catch (e) {
      // ignore errors on logout
    }
    logout();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ 
      user: state.user, 
      loading: state.loading,
      login, 
      logout: userLogout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

