import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { API_URL } from '../context/AuthContext';
import './Home.css';

const CATEGORIES = ['all', 'Electronics', 'Accessories', 'Audio', 'Monitors', 'Storage', 'Security', 'Networking'];

const CATEGORY_ICONS = {
  Electronics: '⬛', Accessories: '⬛', Audio: '⬛', Monitors: '⬛',
  Storage: '⬛', Security: '⬛', Networking: '⬛', all: '⬛'
};

const ProductCard = ({ product, onAddToCart }) => (
  <div className={`product-card${product.category === 'CTF_FLAG' ? ' ctf-flag-card' : ''}`}>
    <div className="product-img">
      <span className="product-img-placeholder">
        {product.category === 'CTF_FLAG' ? '■' : '■'}
      </span>
      <div className="product-overlay">
        {product.category !== 'CTF_FLAG' && (
          <Link to={`/products/${product.id}`} className="btn btn-secondary btn-sm">View details</Link>
        )}
      </div>
    </div>
    <div className="product-info">
      <span className="product-category">{product.category}</span>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-desc">{product.description?.slice(0, 100)}{product.description?.length > 100 ? '...' : ''}</p>
      <div className="product-footer">
        <span className="product-price">
          {isNaN(Number(product.price)) ? product.price : `$${Number(product.price).toFixed(2)}`}
        </span>
        {product.category !== 'CTF_FLAG' && (
          <button className="btn btn-primary btn-sm" onClick={() => onAddToCart(product)}>
            Add to cart
          </button>
        )}
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
    setToast(`${product.name} added to cart`);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Free shipping on orders over $50
          </div>
          <h1 className="hero-title">
            Premium tech,<br />
            <span className="hero-title-accent">at your fingertips.</span>
          </h1>
          <p className="hero-subtitle">
            Discover the latest in electronics, accessories, and smart devices — all in one place.
          </p>
          <div className="hero-actions">
            <a href="#products" className="btn btn-primary">Shop now</a>
            <Link to="/register" className="btn btn-secondary">Create account</Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">10+</span>
              <span className="stat-label">Product categories</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">1K+</span>
              <span className="stat-label">Happy customers</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">99%</span>
              <span className="stat-label">Satisfaction rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="products-section">
        <div className="container">
          <div className="products-header">
            <div>
              <h2 className="section-title">All Products</h2>
              <p className="section-subtitle">{products.length} items available</p>
            </div>
            <div className="search-bar-row">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  className="form-input search-input"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary">Search</button>
              </form>
              <select className="form-input sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name A–Z</option>
              </select>
            </div>
          </div>

          {sqlHint && (
            <div className="sql-leak-banner">
              <p className="sql-leak-title">Server Error — Query Exposed</p>
              <pre className="sql-leak-code">{sqlHint}</pre>
            </div>
          )}

          <div className="category-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-tab${category === cat ? ' active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="icon">—</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or category filter</p>
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Home;
