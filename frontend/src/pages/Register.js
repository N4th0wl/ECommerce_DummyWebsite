import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [flagMsg, setFlagMsg] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFlagMsg('');
    setLoading(true);
    try {
      const res = await register(form.username, form.email, form.password, form.bio);
      if (res.flag) {
        setFlagMsg(`${res.flag}\n${res.message}`);
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
              Join thousands<br />
              of <em>happy shoppers.</em>
            </p>
          </div>
          <div className="auth-brand-features">
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span>30-day hassle-free returns</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span>Exclusive member discounts</span>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <h1 className="auth-form-title">Create an account</h1>
          <p className="auth-form-subtitle">Get started in under a minute</p>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {flagMsg && (
            <div className="sql-output" style={{ borderColor: 'rgba(22,163,74,0.3)' }}>
              <p className="sql-output-title" style={{ color: '#4ade80' }}>Server Response</p>
              <pre className="sql-output-code" style={{ color: '#86efac' }}>{flagMsg}</pre>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" type="text" placeholder="Choose a username"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Create a password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea className="form-input" placeholder="Tell us a little about yourself"
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
