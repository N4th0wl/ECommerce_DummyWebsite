import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { API_URL } from '../context/AuthContext';
import './Home.css';

const CATEGORIES = ['all', 'Electronics', 'Accessories', 'Audio', 'Monitors', 'Storage', 'Security', 'Networking'];

const EMOJI_MAP = {
  Electronics: '💻', Accessories: '🔌', Audio: '🎧', Monitors: '🖥️',
  Storage: '💾', Security: '🔒', Networking: '📡', all: '🛍️'
};

const ProductCard = ({ product, onAddToCart }) => (
  <div className="product-card">
    <div className="product-img">
      <span className="product-emoji">{EMOJI_MAP[product.category] || '📦'}</span>
      <div className="product-overlay">
        <Link to={`/products/${product.id}`} className="btn btn-secondary btn-sm">View Details</Link>
      </div>
    </div>
    <div className="product-info">
      <span className="product-category">{product.category}</span>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-desc">{product.description?.slice(0, 80)}...</p>
      <div className="product-footer">
        <span className="product-price">${Number(product.price).toFixed(2)}</span>
        <button className="btn btn-primary btn-sm" onClick={() => onAddToCart(product)}>
          🛒 Add to Cart
        </button>
      </div>
    </div>
  </div>
);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [sqlHint, setSqlHint] = useState('');
  const [toast, setToast] = useState('');
  const { addToCart } = useCart();

  const fetchProducts = async () => {
    setLoading(true);
    setSqlHint('');
    try {
      const params = { search, category, sort };
      const res = await axios.get(`${API_URL}/api/products`, { params });
      setProducts(res.data);
    } catch (err) {
      // ⚠️ VULN: Display leaked SQL query from server error
      if (err.response?.data?.query) {
        setSqlHint(err.response.data.query);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [category, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setToast(`✅ ${product.name} added to cart!`);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob h-blob1" />
          <div className="hero-blob h-blob2" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge">🛡️ CyberSecurity Workshop Demo</div>
          <h1 className="hero-title">
            Premium Tech <br />
            <span className="hero-gradient">At Your Fingertips</span>
          </h1>
          <p className="hero-subtitle">
            Discover the latest gadgets — and hidden vulnerabilities.<br />
            <em>This site is intentionally vulnerable for educational purposes.</em>
          </p>
          <div className="hero-actions">
            <a href="#products" className="btn btn-primary">🛍️ Shop Now</a>
            <Link to="/register" className="btn btn-secondary">✨ Get Started</Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">3+</span><span className="stat-label">Vulnerabilities</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-num">10+</span><span className="stat-label">Products</span></div>
            <div className="stat-div" />
            <div className="stat"><span className="stat-num">CTF</span><span className="stat-label">Ready</span></div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section id="products" className="products-section">
        <div className="container">
          <div className="search-bar-row">
            <form onSubmit={handleSearch} className="search-form">
              <input
                className="form-input search-input"
                placeholder="Search products... (try: ' UNION SELECT 1,username,email,password,5,6,7,8,9 FROM users -- )"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">🔍 Search</button>
            </form>
            <select className="form-input sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="name_asc">Name A–Z</option>
            </select>
          </div>

          {sqlHint && (
            <div className="sql-leak-banner">
              <p className="sql-leak-title">🔍 SQL Query Leaked from Server Error:</p>
              <pre className="sql-leak-code">{sqlHint}</pre>
            </div>
          )}

          <div className="tabs">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`tab ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}>
                {EMOJI_MAP[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <h3>No products found</h3>
              <p>Try a different search or category</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Home;
