import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-name">ShopVuln</span>
          <span className="brand-tag">CTF</span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link nav-link-admin" onClick={() => setMenuOpen(false)}>⚙️ Admin</Link>
              )}
            </>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/cart" className="nav-cart">
                🛒
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              <div className="nav-user-menu">
                <button className="nav-user-btn">
                  <span className="user-avatar">{user.username[0].toUpperCase()}</span>
                  <span className="user-name">{user.username}</span>
                  {user.role === 'admin' && <span className="badge badge-admin">Admin</span>}
                </button>
                <div className="dropdown">
                  <Link to="/dashboard" className="dropdown-item">📊 Dashboard</Link>
                  <Link to="/profile" className="dropdown-item">👤 Profile</Link>
                  <Link to="/orders" className="dropdown-item">📦 My Orders</Link>
                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item danger">🚪 Logout</button>
                </div>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
