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
  const [queryUserId, setQueryUserId] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', bio: '' });
  const [flagMsg, setFlagMsg] = useState('');
  const [toast, setToast] = useState('');
  const [idorResults, setIdorResults] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([
      axios.get(`${API_URL}/api/orders`),
      axios.get(`${API_URL}/api/auth/me`)
    ]).then(([oRes, pRes]) => {
      setOrders(oRes.data);
      setProfile(pRes.data);
      setEditForm({ email: pRes.data.email, bio: pRes.data.bio || '' });
    }).finally(() => setLoading(false));
  }, [user]);

  const handleQueryOrders = async () => {
    setFlagMsg('');
    setIdorResults(null);
    if (!queryUserId) return;
    try {
      const res = await axios.get(`${API_URL}/api/orders?user_id=${queryUserId}`);
      if (res.data.flag) {
        setFlagMsg(`${res.data.flag}\n${res.data.message}`);
        if (res.data.orders) setIdorResults(res.data.orders);
      } else {
        setIdorResults(res.data);
      }
    } catch (err) {
      setToast('Failed to fetch orders');
      setTimeout(() => setToast(''), 2500);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setFlagMsg('');
    try {
      const res = await axios.put(`${API_URL}/api/users/profile`, editForm);
      if (res.data.flag) {
        setFlagMsg(`${res.data.flag}\n${res.data.message}`);
        setToast('Profile updated');
      } else {
        setToast('Profile updated');
      }
      setEditMode(false);
      const pRes = await axios.get(`${API_URL}/api/auth/me`);
      setProfile(pRes.data);
      setEditForm({ email: pRes.data.email, bio: pRes.data.bio || '' });
    } catch (err) {
      setToast('Profile update failed');
    }
    setTimeout(() => setToast(''), 2500);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);

  const labelStyle = { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' };
  const valueStyle = { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {user?.username}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {user?.email} &middot; <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total orders', value: orders.length },
            { label: 'Total spent', value: `$${totalSpent.toFixed(2)}` },
            { label: 'Membership', value: 'Standard' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
              <p style={labelStyle}>{s.label}</p>
              <p style={{ ...valueStyle, fontSize: 22, fontFamily: "'DM Sans',sans-serif", marginTop: 6 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          {['overview', 'orders', 'profile'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => {
              setActiveTab(t);
              setFlagMsg('');
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {flagMsg && (
          <div className="sql-output" style={{ borderColor: 'rgba(22,163,74,0.3)', marginBottom: 24 }}>
            <p className="sql-output-title" style={{ color: '#4ade80' }}>Server Response</p>
            <pre className="sql-output-code" style={{ color: '#86efac' }}>{flagMsg}</pre>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>Recent orders</h3>
            {orders.slice(0, 3).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                No orders yet. <a href="/" style={{ color: 'var(--accent-light)' }}>Start shopping</a>
              </p>
            ) : (
              orders.slice(0, 3).map(o => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>Order #{o.id}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans',sans-serif" }}>${Number(o.total).toFixed(2)}</p>
                    <span className={`badge badge-${o.status}`} style={{ marginTop: 4, display: 'inline-block' }}>{o.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {/* IDOR Query - looks like a customer service lookup */}
            <div className="card" style={{ marginBottom: 20 }}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>Order lookup by customer ID</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Customer ID"
                  value={queryUserId}
                  onChange={e => setQueryUserId(e.target.value)}
                  style={{ width: 140, marginBottom: 0 }}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleQueryOrders}>
                  Lookup
                </button>
              </div>
            </div>

            {idorResults ? (
              <div style={{ marginBottom: 20 }}>
                <p style={{ ...labelStyle, marginBottom: 12 }}>Results for customer #{queryUserId}</p>
                {idorResults.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No orders found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {idorResults.map(o => (
                      <div key={o.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>Order #{o.id} &middot; User {o.user_id}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(o.created_at).toLocaleString()}</p>
                          {o.shipping_address && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{o.shipping_address}</p>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 700, fontFamily: "'DM Sans',sans-serif", fontSize: 16 }}>${Number(o.total).toFixed(2)}</p>
                          <span className={`badge badge-${o.status}`} style={{ marginTop: 4, display: 'inline-block' }}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              orders.length === 0 ? (
                <div className="empty-state">
                  <h3>No orders yet</h3>
                  <p>When you place orders, they'll appear here</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orders.map(o => (
                    <div key={o.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>Order #{o.id}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(o.created_at).toLocaleString()}</p>
                        {o.shipping_address && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{o.shipping_address}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, fontFamily: "'DM Sans',sans-serif", fontSize: 16 }}>${Number(o.total).toFixed(2)}</p>
                        <span className={`badge badge-${o.status}`} style={{ marginTop: 4, display: 'inline-block' }}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>Account details</h3>
              {!editMode && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>
                  Edit
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input type="email" className="form-input" value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-input" rows={4} value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself" />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary btn-sm">Save changes</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gap: 0 }}>
                {[
                  ['Username', profile.username],
                  ['Email', profile.email],
                  ['Role', profile.role],
                  ['Member since', new Date(profile.created_at).toLocaleDateString()],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={labelStyle}>{label}</span>
                    <span style={valueStyle}>{val}</span>
                  </div>
                ))}
                <div style={{ paddingTop: 16 }}>
                  <p style={{ ...labelStyle, marginBottom: 10 }}>Bio</p>
                  {/* VULN: Stored XSS via bio field */}
                  <div
                    style={{ color: 'var(--text-secondary)', fontSize: 14 }}
                    dangerouslySetInnerHTML={{ __html: profile.bio || '<em style="color:var(--text-muted)">No bio added</em>' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Dashboard;
