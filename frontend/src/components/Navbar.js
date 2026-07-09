import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const CartIcon = () => (
  <svg className="nav-cart-icon" viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

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
          <span className="brand-wordmark">Nexus<span>Store</span></span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Products</Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Account</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link nav-link-admin" onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
            </>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/cart" className="nav-cart">
                <CartIcon />
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              <div className="nav-user-menu">
                <button className="nav-user-btn">
                  <span className="user-avatar">{user.username[0].toUpperCase()}</span>
                  <span className="user-name">{user.username}</span>
                  {user.role === 'admin' && <span className="badge badge-admin">Admin</span>}
                </button>
                <div className="dropdown">
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setMenuOpen(false)}>My Account</Link>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setMenuOpen(false)}>Orders</Link>
                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item danger">Sign out</button>
                </div>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>&#9776;</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
