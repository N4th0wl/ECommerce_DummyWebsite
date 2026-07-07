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
      const user = await login(form.username, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Login failed');
      // ⚠️ VULN: Show SQL query in error for educational purposes
      if (data?.query) setSqlOutput(data.query);
      if (data?.details) setSqlOutput(prev => prev + '\n\nDB Error: ' + data.details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob blob1" />
        <div className="auth-blob blob2" />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🛡️</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to ShopVuln</p>
        </div>

        <div className="alert alert-warning">
          <span>⚠️</span>
          <span><strong>Workshop Mode:</strong> Try SQL Injection on this form!</span>
        </div>

        <div className="hint-box">
          <p className="hint-title">💡 SQLi Hints</p>
          <code className="hint-code">Username: admin' -- </code>
          <code className="hint-code">Username: ' OR '1'='1' -- </code>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>❌</span> {error}
          </div>
        )}

        {sqlOutput && (
          <div className="sql-output">
            <p className="sql-output-title">🔍 Executed SQL Query (Leaked):</p>
            <pre className="sql-output-code">{sqlOutput}</pre>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter username..."
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password..."
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔑 Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>

        <div className="demo-creds">
          <p className="demo-title">Demo Credentials</p>
          <div className="demo-grid">
            <div className="demo-item">
              <span className="badge badge-customer">User</span>
              <code>john_doe / password123</code>
            </div>
            <div className="demo-item">
              <span className="badge badge-admin">Admin</span>
              <code>admin / admin123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
