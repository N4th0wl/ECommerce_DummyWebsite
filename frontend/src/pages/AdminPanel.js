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
  const [plaintextFlag, setPlaintextFlag] = useState('');
  const [jwtFlag, setJwtFlag] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/dashboard'); return; }

    Promise.all([
      axios.get(`${API_URL}/api/admin/users`),
      axios.get(`${API_URL}/api/admin/config`)
    ]).then(([uRes, cRes]) => {
      setUsers(uRes.data.users || uRes.data);
      setConfig(cRes.data);
      if (uRes.data.flag_plaintext) setPlaintextFlag(uRes.data.flag_plaintext);
      if (uRes.data.flag_jwt) setJwtFlag(`${uRes.data.flag_jwt} — ${uRes.data.message}`);
    }).catch(err => {
      console.error('Failed to load admin data', err);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const thStyle = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  };
  const tdStyle = {
    padding: '12px 16px',
    fontSize: 13,
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    verticalAlign: 'middle',
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="section-title" style={{ marginBottom: 0 }}>Admin Console</h1>
            <span className="badge badge-admin">Admin</span>
          </div>
          <p className="section-subtitle">System management and configuration</p>
        </div>

        {/* Exposed files reference */}
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>
            System file paths
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['/robots.txt', '/backup/db_backup_2024.sql', '/config/config.txt', '/admin/notes.txt'].map(p => (
              <a key={p} href={`http://localhost:5000${p}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: 'var(--accent-light)', fontFamily: 'Courier New, monospace', textDecoration: 'none' }}>
                {p}
              </a>
            ))}
          </div>
        </div>

        {plaintextFlag && (
          <div className="sql-output" style={{ borderColor: 'rgba(22,163,74,0.3)', marginBottom: 24 }}>
            <p className="sql-output-title" style={{ color: '#4ade80' }}>Server Response</p>
            <pre className="sql-output-code" style={{ color: '#86efac' }}>{plaintextFlag}</pre>
          </div>
        )}

        {jwtFlag && (
          <div className="sql-output" style={{ borderColor: 'rgba(22,163,74,0.3)', marginBottom: 24 }}>
            <p className="sql-output-title" style={{ color: '#4ade80' }}>Authentication Notice</p>
            <pre className="sql-output-code" style={{ color: '#86efac' }}>{jwtFlag}</pre>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          {[['users', 'Users'], ['config', 'Configuration'], ['files', 'File Access']].map(([key, label]) => (
            <button key={key} className={`tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID', 'Username', 'Email', 'Password', 'Role', 'Joined'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{u.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      <code style={{ fontSize: 12, color: '#fca5a5', background: 'rgba(220,38,38,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                        {u.password}
                      </code>
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {config.map(c => (
              <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Courier New, monospace' }}>{c.config_key}</span>
                <code style={{ fontSize: 13, color: '#86efac', background: 'rgba(0,0,0,0.3)', padding: '3px 12px', borderRadius: 5 }}>
                  {c.config_value}
                </code>
              </div>
            ))}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { path: '/robots.txt', desc: 'Web crawler exclusion file', method: 'GET' },
              { path: '/backup/db_backup_2024.sql', desc: 'Database backup — January 2024', method: 'GET' },
              { path: '/config/config.txt', desc: 'Application configuration and secrets', method: 'GET' },
              { path: '/admin/notes.txt', desc: 'Internal admin notes', method: 'GET' },
              { path: '/api/health', desc: 'Service health & environment info', method: 'GET' },
            ].map(item => (
              <div key={item.path} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                <div>
                  <code style={{ fontSize: 12.5, color: 'var(--accent-light)', display: 'block', marginBottom: 4 }}>{item.path}</code>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</span>
                </div>
                <a href={`http://localhost:5000${item.path}`} target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm">
                  Open
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
