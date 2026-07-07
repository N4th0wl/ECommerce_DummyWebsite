import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/AuthContext';

const EMOJI_MAP = {
  Electronics: '💻', Accessories: '🔌', Audio: '🎧', Monitors: '🖥️',
  Storage: '💾', Security: '🔒', Networking: '📡'
};

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
    try {
      await axios.post(`${API_URL}/api/products/${id}/reviews`, newReview);
      const rRes = await axios.get(`${API_URL}/api/products/${id}/reviews`);
      setReviews(rRes.data);
      setNewReview({ rating: 5, comment: '' });
      setToast('✅ Review submitted!');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      setToast('❌ Failed to submit review');
      setTimeout(() => setToast(''), 2500);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!product) return null;

  return (
    <div className="page-wrapper">
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: 24 }}>
          ← Back
        </button>

        <div className="product-detail-grid">
          {/* Product Image */}
          <div className="detail-img-box">
            <span style={{ fontSize: 96 }}>{EMOJI_MAP[product.category] || '📦'}</span>
            <span className="badge badge-success" style={{ marginTop: 16 }}>In Stock: {product.stock}</span>
          </div>

          {/* Product Info */}
          <div className="detail-info">
            <span className="product-category">{product.category}</span>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
              {product.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{product.description}</p>

            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-secondary)', fontFamily: "'Space Grotesk',sans-serif", marginBottom: 24 }}>
              ${Number(product.price).toFixed(2)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Qty:</label>
              <input type="number" className="form-input" min={1} max={product.stock}
                value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)}
                style={{ width: 80 }} />
              <button className="btn btn-primary" onClick={() => {
                for (let i = 0; i < qty; i++) addToCart(product);
                setToast(`✅ Added ${qty}x ${product.name} to cart!`);
                setTimeout(() => setToast(''), 2500);
              }}>
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <h2 className="section-title" style={{ fontSize: 22, marginBottom: 24 }}>Customer Reviews</h2>

          {user && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16, color: 'var(--text-secondary)' }}>
                Write a Review <span className="vuln-label">⚠️ Stored XSS Point</span>
              </h3>
              <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                <span>💡</span>
                <span>Try: <code style={{fontSize:11}}>{'<script>alert("XSS")</script>'}</code> or <code style={{fontSize:11}}>{'<img src=x onerror=alert(1)>'}</code></span>
              </div>
              <form onSubmit={submitReview}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select className="form-input" style={{ width: 120 }}
                    value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: e.target.value })}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Comment <span style={{fontSize:11,color:'var(--danger)'}}>← Vulnerable to XSS</span></label>
                  <textarea className="form-input" placeholder="Write your review... (HTML allowed!)"
                    value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
              </form>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state"><p>No reviews yet. Be the first!</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(r => (
                <div key={r.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {r.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{r.username}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span style={{ color: 'var(--warning)', fontSize: 16 }}>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  {/* ⚠️ VULN: dangerouslySetInnerHTML for Stored XSS demonstration */}
                  <div
                    className="review-comment"
                    dangerouslySetInnerHTML={{ __html: r.comment }}
                    style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}
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
