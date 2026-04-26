import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import Tools from './pages/Tools';
import ResetPassword from './pages/ResetPassword';
import { LogOut, LayoutDashboard, Plane, Wrench, LogIn, Wallet, Sun, Moon } from 'lucide-react';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
  if (!user) return <Navigate to="/auth" />;
  return children;
}

function AppHeader({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: userLogout } = useAuth();
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/reset-password';

  const handleLogout = () => {
    userLogout();
    navigate('/auth');
  };

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.body.classList.toggle('dark', next);
  };

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <Wallet className="app-header-icon" size={28} />
        <span className="app-header-title">Expense Tracker</span>
      </div>

      <nav className="app-header-nav">
        {!isAuthPage && user && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/trips" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Plane size={18} />
              <span>Trips</span>
            </NavLink>
            <NavLink to="/tools" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Wrench size={18} />
              <span>Tools</span>
            </NavLink>
          </>
        )}
        {isAuthPage && (
          <NavLink to="/auth" className="nav-link active">
            <LogIn size={18} />
            <span>Login</span>
          </NavLink>
        )}
      </nav>

      <div className="app-header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user && (
          <>
            <span className="user-name">{user.nickname || user.email || 'User'}</span>
            <button onClick={handleLogout} className="btn btn-logout">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="app">
      <AppHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/trips" element={<PrivateRoute><Trips /></PrivateRoute>} />
          <Route path="/tools" element={<PrivateRoute><Tools /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

