import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState('');
  const [flagMsg, setFlagMsg] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/products/${id}`),
      axios.get(`${API_URL}/api/products/${id}/reviews`)
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data);
      setReviews(rRes.data);
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setFlagMsg('');
    try {
      const res = await axios.post(`${API_URL}/api/products/${id}/reviews`, newReview);
      const rRes = await axios.get(`${API_URL}/api/products/${id}/reviews`);
      setReviews(rRes.data);
      setNewReview({ rating: 5, comment: '' });
      if (res.data?.flag) {
        setFlagMsg(`${res.data.flag}\n${res.data.message}`);
        setToast('Review submitted');
      } else {
        setToast('Review submitted');
      }
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      setToast('Failed to submit review');
      setTimeout(() => setToast(''), 2500);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!product) return null;

  return (
    <div className="page-wrapper">
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: 28 }}>
          ← Back
        </button>

        <div className="product-detail-grid">
          {/* Image panel */}
          <div className="detail-img-box">
            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {product.category}
            </div>
            <div style={{ width: 96, height: 96, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
          </div>

          {/* Info panel */}
          <div className="detail-info">
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              {product.category}
            </span>
            <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8, marginBottom: 12, letterSpacing: '-0.02em' }}>
              {product.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              {product.description}
            </p>

            <div style={{ marginBottom: 28 }}>
              <span style={{ fontSize: 30, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)' }}>
                ${Number(product.price).toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: product.stock > 0 ? '#4ade80' : '#f87171', marginLeft: 14, fontWeight: 500 }}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Quantity</label>
              <input type="number" className="form-input" min={1} max={product.stock} value={qty}
                onChange={e => setQty(parseInt(e.target.value) || 1)}
                style={{ width: 72, padding: '8px 12px', textAlign: 'center' }} />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: 280, justifyContent: 'center' }}
              onClick={() => {
                addToCart({ ...product, quantity: qty });
                setToast(`${product.name} added to cart`);
                setTimeout(() => setToast(''), 2500);
              }}
            >
              Add to cart
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", marginBottom: 24 }}>
            Customer Reviews
          </h2>

          {flagMsg && (
            <div className="sql-output" style={{ borderColor: 'rgba(22,163,74,0.3)', marginBottom: 20 }}>
              <p className="sql-output-title" style={{ color: '#4ade80' }}>Server Response</p>
              <pre className="sql-output-code" style={{ color: '#86efac' }}>{flagMsg}</pre>
            </div>
          )}

          {user && (
            <div className="card" style={{ marginBottom: 28 }}>
              <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Write a review
              </h3>
              <form onSubmit={submitReview}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select className="form-input" style={{ width: 120 }}
                    value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: e.target.value })}>
                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea className="form-input" placeholder="Share your thoughts about this product..."
                    value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Submit review</button>
              </form>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <h3>No reviews yet</h3>
              <p>Be the first to review this product</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(r => (
                <div key={r.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{r.username}</span>
                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <span key={i} style={{ fontSize: 13, color: i <= r.rating ? '#fbbf24' : 'var(--text-muted)' }}>★</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {/* VULN: Stored XSS — comment rendered as raw HTML */}
                  <div
                    className="review-comment"
                    dangerouslySetInnerHTML={{ __html: r.comment }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default ProductDetail;
