import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/AuthContext';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    if (!shipping.trim()) { setError('Please enter a shipping address'); return; }
    setLoading(true);
    setError('');
    try {
      const items = cart.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price }));
      const res = await axios.post(`${API_URL}/api/orders`, { items, shipping_address: shipping });
      setSuccess(res.data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 520, textAlign: 'center', paddingTop: 64 }}>
          <div className="card" style={{ padding: '48px 40px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Order confirmed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: 14 }}>Order #{success.orderId}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, fontFamily: "'DM Sans',sans-serif" }}>
              ${Number(success.total).toFixed(2)}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link to="/dashboard" className="btn btn-primary">View orders</Link>
              <Link to="/" className="btn btn-secondary">Continue shopping</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <h3>Your cart is empty</h3>
            <p>Browse our products and find something you like</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Browse products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 28 }}>Your cart</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 20px' }}>
                <div style={{ width: 56, height: 56, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {item.category?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.category}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" className="form-input" min={1} style={{ width: 60, padding: '6px 10px', textAlign: 'center' }}
                    value={item.quantity} onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)} />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: 72, textAlign: 'right', fontFamily: "'DM Sans',sans-serif" }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => removeFromCart(item.id)}
                    style={{ padding: '5px 10px', color: 'var(--text-muted)' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Order summary</h3>

            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>
                <span>{item.name} × {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <div className="divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, marginBottom: 20, fontFamily: "'DM Sans',sans-serif" }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Shipping address</label>
              <textarea className="form-input" rows={3} placeholder="Enter your full shipping address"
                value={shipping} onChange={e => setShipping(e.target.value)} />
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}><span>{error}</span></div>}

            <button className="btn btn-primary btn-full" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Processing...' : 'Place order'}
            </button>

            <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={clearCart}>
              Clear cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
