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
      setError(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 500, textAlign: 'center' }}>
          <div className="card" style={{ padding: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Order Placed!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Order #{success.orderId}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-secondary)', marginBottom: 24 }}>
              Total: ${Number(success.total).toFixed(2)}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/dashboard" className="btn btn-primary">View Orders</Link>
              <Link to="/" className="btn btn-secondary">Continue Shopping</Link>
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
            <div className="icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some items to get started!</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>🛍️ Shop Now</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1 className="section-title">🛒 Your Cart</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cart.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ fontSize: 48, flexShrink: 0 }}>📦</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.category}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" className="form-input" min={1} style={{ width: 64 }}
                    value={item.quantity} onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)} />
                  <span style={{ fontWeight: 700, color: 'var(--accent-secondary)', minWidth: 80, textAlign: 'right' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>

            <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: 12 }}>
              <span>⚠️</span>
              <span>Shipping address field is vulnerable to SQLi!</span>
            </div>

            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>
                <span>{item.name} × {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginBottom: 20, fontFamily: "'Space Grotesk',sans-serif" }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent-secondary)' }}>${total.toFixed(2)}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Shipping Address <span style={{ fontSize: 10, color: 'var(--danger)' }}>← SQLi Point</span></label>
              <textarea className="form-input" rows={3} placeholder="Enter your shipping address..."
                value={shipping} onChange={e => setShipping(e.target.value)} />
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}><span>❌</span> {error}</div>}

            <button className="btn btn-primary btn-full" onClick={handleCheckout} disabled={loading}>
              {loading ? '⏳ Processing...' : '✅ Place Order'}
            </button>

            <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={clearCart}>
              🗑️ Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
