import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { setAccessToken, setRefreshToken } from '../utils/auth';

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      if (mode === 'login') {
        const resp = await api.post('/auth/login/', { email, password });
        setAccessToken(resp.data.access);
        setRefreshToken(resp.data.refresh);
        // Use user data from response
        login(resp.data.user);
        navigate('/dashboard');
      } else {
        // register
        await api.post('/auth/register/', { email, password });
        setIsLoading(false);
        alert('Registered. You can now login.');
        setMode('login');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.response?.data || err.message || 'Unknown error';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuest() {
    setError(null);
    setIsLoading(true);
    // Try a few attempts to avoid nickname collision (409)
    let attempts = 0;
    let resp = null;
    let nickname = nicknameInput || `Guest${Math.floor(Math.random() * 10000)}`;
    while (attempts < 4) {
      try {
        resp = await api.post('/auth/guest-login/', { nickname });
        break;
      } catch (err) {
        attempts += 1;
        const status = err.response?.status;
        if (status === 409) {
          // Nickname taken - generate a new one and retry
          nickname = `Guest${Math.floor(Math.random() * 100000)}${Date.now().toString().slice(-4)}`;
          continue;
        }
        // Other errors - stop
        console.error('Guest login error:', err);
        const msg = err.response?.data || err.message || 'Guest login failed';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        break;
      }
    }

    setIsLoading(false);

    if (resp && resp.data) {
      setAccessToken(resp.data.access);
      setRefreshToken(resp.data.refresh);
      const userData = {
        ...resp.data.user,
        is_guest: true,
        displayName: resp.data.user?.nickname || nickname
      };
      login(userData);
      navigate('/dashboard');
      return;
    }

    if (!error) setError('Guest login failed after multiple attempts. Try a different nickname.');
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{mode === 'login' ? 'Login' : 'Register'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={isLoading}>{isLoading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}</button>
            <button type="button" className="btn link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Have an account? Login'}</button>
          </div>
        </form>

        <div className="divider">or</div>

        <div className="guest-section">
          <div className="form-row">
            <label>Guest nickname (optional)</label>
            <input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="Nickname for guest session" />
          </div>
          <div className="form-actions">
            <button className="btn secondary" onClick={handleGuest} disabled={isLoading}>{isLoading ? 'Signing in...' : 'Continue as Guest'}</button>
          </div>
        </div>

      </div>
    </div>
  );
}
