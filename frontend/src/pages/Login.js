import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [sqlOutput, setSqlOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSqlOutput('');
    setLoading(true);
    try {
      const res = await login(form.username, form.password);
      if (res.flag) {
        setSqlOutput(`${res.flag}\n${res.message}`);
        setTimeout(() => navigate(res.user?.role === 'admin' ? '/admin' : '/dashboard'), 3000);
      } else {
        navigate(res.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Invalid credentials. Please try again.');
      if (data?.query) setSqlOutput(data.query);
      if (data?.details) setSqlOutput(prev => prev + '\n\n' + data.details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        {/* Brand panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-logo">Nexus<span>Store</span></div>
          <div>
            <p className="auth-brand-tagline">
              Premium tech,<br />
              <em>delivered fast.</em>
            </p>
          </div>
          <div className="auth-brand-features">
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span>Curated selection of premium products</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span>Secure checkout & fast delivery</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span>24/7 customer support</span>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <h1 className="auth-form-title">Welcome back</h1>
          <p className="auth-form-subtitle">Sign in to your account to continue</p>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {sqlOutput && (
            <div className="sql-output">
              <p className="sql-output-title">Server Response</p>
              <pre className="sql-output-code">{sqlOutput}</pre>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Create one</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
