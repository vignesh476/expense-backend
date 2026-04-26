import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/reset-password/', { token, password });
      setMessage('Password reset successful. You can now login with your new password.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Failed to reset password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>

        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            <div className="form-row">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

