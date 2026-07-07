import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([
      axios.get(`${API_URL}/api/orders`),
      axios.get(`${API_URL}/api/auth/me`)
    ]).then(([oRes, pRes]) => {
      setOrders(oRes.data);
      setProfile(pRes.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700 }}>
              Welcome back, {user?.username}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {user?.email} · <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: 'var(--accent-secondary)' }}>{orders.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Orders</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: 'var(--accent-secondary)' }}>${totalSpent.toFixed(2)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total Spent</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: 'var(--accent-secondary)' }}>Gold</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Membership</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {['overview', 'orders', 'profile'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'overview' ? '📊' : t === 'orders' ? '📦' : '👤'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="alert alert-info">
              <span>🎯</span>
              <span><strong>Workshop Tip:</strong> Try accessing <code>/api/orders?user_id=1</code> to see IDOR vulnerability!</span>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Recent Orders</h3>
              {orders.slice(0, 3).length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No orders yet. <a href="/" style={{ color: 'var(--accent-secondary)' }}>Start shopping!</a></p>
              ) : (
                orders.slice(0, 3).map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>Order #{o.id}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>${Number(o.total).toFixed(2)}</p>
                      <span className="badge badge-warning">{o.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <span><strong>IDOR Vuln:</strong> Change user_id in URL to view other users' orders. E.g. <code>/api/orders?user_id=1</code></span>
            </div>
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📦</div>
                <h3>No orders yet</h3>
                <p>Go shop something!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map(o => (
                  <div key={o.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Order #{o.id}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                          📅 {new Date(o.created_at).toLocaleString()}
                        </p>
                        {o.shipping_address && (
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 {o.shipping_address}</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", color: 'var(--accent-secondary)' }}>
                          ${Number(o.total).toFixed(2)}
                        </p>
                        <span className="badge badge-warning">{o.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="card">
            <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Profile Information</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                ['Username', profile.username],
                ['Email', profile.email],
                ['Role', profile.role],
                ['Member Since', new Date(profile.created_at).toLocaleDateString()],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, display: 'block', marginBottom: 8 }}>Bio (XSS-vulnerable)</span>
                {/* ⚠️ VULN: Stored XSS via bio */}
                <div
                  dangerouslySetInnerHTML={{ __html: profile.bio || '<em style="color:var(--text-muted)">No bio set</em>' }}
                  style={{ color: 'var(--text-secondary)', fontSize: 14 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
