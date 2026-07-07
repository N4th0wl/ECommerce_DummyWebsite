import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/AuthContext';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/dashboard'); return; }

    Promise.all([
      axios.get(`${API_URL}/api/admin/users`),
      axios.get(`${API_URL}/api/admin/config`)
    ]).then(([uRes, cRes]) => {
      setUsers(uRes.data);
      setConfig(cRes.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>⚙️</span>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Admin Panel</h1>
          <span className="badge badge-admin">ADMIN</span>
        </div>
        <p className="section-subtitle">Sensitive admin controls — for workshop demonstration</p>

        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <span>⚠️</span>
          <div>
            <strong>Google Dork Targets:</strong>
            <br />
            <code style={{ fontSize: 12 }}>http://localhost:5000/backup/db_backup_2024.sql</code><br />
            <code style={{ fontSize: 12 }}>http://localhost:5000/config/config.txt</code><br />
            <code style={{ fontSize: 12 }}>http://localhost:5000/admin/notes.txt</code><br />
            <code style={{ fontSize: 12 }}>http://localhost:5000/robots.txt</code>
          </div>
        </div>

        <div className="tabs">
          {['users', 'config', 'dork'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'users' ? '👥' : t === 'config' ? '🔧' : '🔍'} {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Users Tab - shows plaintext passwords */}
        {activeTab === 'users' && (
          <div>
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <span>Passwords stored in plaintext! This is an intentional vulnerability.</span>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['ID', 'Username', 'Email', 'Password (Plaintext ⚠️)', 'Role', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{u.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <code style={{ fontSize: 12, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4 }}>{u.password}</code>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="alert alert-error">
              <span>🔐</span>
              <span>Sensitive configuration data — also exposed at <code style={{fontSize:11}}>/config/config.txt</code></span>
            </div>
            {config.map(c => (
              <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{c.config_key}</span>
                <code style={{ fontSize: 13, color: '#86efac', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: 6 }}>{c.config_value}</code>
              </div>
            ))}
          </div>
        )}

        {/* Google Dork Tab */}
        {activeTab === 'dork' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <h3 style={{ color: 'var(--accent-secondary)', marginBottom: 16 }}>🔍 Google Dork Attack Surface</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
                These are files/paths intentionally exposed for the Google Dork (Information Disclosure) demonstration:
              </p>
              {[
                { path: '/robots.txt', desc: 'Reveals hidden paths to attackers', dork: 'site:target inurl:robots.txt' },
                { path: '/backup/db_backup_2024.sql', desc: 'Database backup with credentials', dork: 'site:target filetype:sql' },
                { path: '/config/config.txt', desc: 'App config with API keys & DB creds', dork: 'site:target inurl:config filetype:txt' },
                { path: '/admin/notes.txt', desc: 'Admin notes with credentials', dork: 'site:target inurl:admin filetype:txt' },
                { path: '/api/health', desc: 'Server info disclosure endpoint', dork: 'site:target inurl:health' },
              ].map(item => (
                <div key={item.path} style={{ marginBottom: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                    <code style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>{item.path}</code>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→ {item.desc}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--warning)' }}>
                    <strong>Google Dork: </strong>
                    <code style={{ color: '#fcd34d' }}>{item.dork}</code>
                  </div>
                  <a href={`http://localhost:5000${item.path}`} target="_blank" rel="noreferrer"
                    className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>
                    🔗 Open File
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
