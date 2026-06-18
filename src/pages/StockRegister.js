import React, { useState, useEffect } from 'react';
import { subscribeProducts, subscribeStockEntries, addProduct, deleteProduct, addStockEntry, deleteStockEntry, getToday } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const st = {
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  cardBody: { padding: 24 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' },
  select: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  btnPrimary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
  btnBlue: { background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 2px 8px rgba(37,99,235,0.3)' },
  btnDanger: { background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  btnGhost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  thRight: { textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  thCenter: { textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  td: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)' },
  tdRight: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)', textAlign: 'right' },
  tdCenter: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)', textAlign: 'center' },
  headerBar: { padding: '14px 20px', borderBottom: '1px solid var(--border)' },
};

const StockRegister = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStockEntry, setShowStockEntry] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'pcs', openingStock: 0 });
  const [newEntry, setNewEntry] = useState({ productId: '', type: 'in', quantity: 0, date: getToday(), note: '' });

  useEffect(() => {
    if (!currentUser) return;
    const unsubProducts = subscribeProducts(currentUser.uid, setProducts);
    const unsubEntries = subscribeStockEntries(currentUser.uid, setStockEntries);
    return () => { unsubProducts(); unsubEntries(); };
  }, [currentUser]);

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !currentUser) return;
    await addProduct(currentUser.uid, { name: newProduct.name, unit: newProduct.unit, openingStock: Number(newProduct.openingStock) });
    setNewProduct({ name: '', unit: 'pcs', openingStock: 0 });
    setShowAddProduct(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!currentUser) return;
    if (window.confirm('Delete this product and all its stock entries?')) {
      await deleteProduct(currentUser.uid, id);
      const relatedEntries = stockEntries.filter(e => String(e.productId) === String(id));
      for (const entry of relatedEntries) {
        await deleteStockEntry(currentUser.uid, entry.id);
      }
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.productId || Number(newEntry.quantity) <= 0 || !currentUser) return;
    await addStockEntry(currentUser.uid, { ...newEntry, quantity: Number(newEntry.quantity) });
    setNewEntry({ productId: '', type: 'in', quantity: 0, date: getToday(), note: '' });
    setShowStockEntry(false);
  };

  const handleDeleteEntry = async (id) => {
    if (!currentUser) return;
    await deleteStockEntry(currentUser.uid, id);
  };

  const LOW_STOCK_THRESHOLD = 10;

  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Stock Register</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Inventory Management</p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setShowAddProduct(!showAddProduct)} style={st.btnPrimary}>+ Add Product</button>
        <button onClick={() => setShowStockEntry(!showStockEntry)} style={st.btnBlue}>Stock IN/OUT</button>
      </div>

      {/* Add Product Form */}
      {showAddProduct && (
        <div style={{ ...st.card, marginBottom: 24 }}>
          <div style={st.cardBody}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Add New Product</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={st.label}>Product Name</label>
                <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g., Rice, Oil, Sugar" style={st.input} />
              </div>
              <div>
                <label style={st.label}>Unit</label>
                <select value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} style={st.select}>
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilogram</option>
                  <option value="liter">Liter</option>
                  <option value="bag">Bag</option>
                  <option value="box">Box</option>
                  <option value="packet">Packet</option>
                </select>
              </div>
              <div>
                <label style={st.label}>Opening Stock</label>
                <input type="number" value={newProduct.openingStock} onChange={(e) => setNewProduct({ ...newProduct, openingStock: e.target.value })} min="0" style={st.input} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddProduct} style={st.btnPrimary}>Save</button>
                <button onClick={() => setShowAddProduct(false)} style={st.btnGhost}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Entry Form */}
      {showStockEntry && (
        <div style={{ ...st.card, marginBottom: 24 }}>
          <div style={st.cardBody}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Stock IN / OUT Entry</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={st.label}>Product</label>
                <select value={newEntry.productId} onChange={(e) => setNewEntry({ ...newEntry, productId: e.target.value })} style={st.select}>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
              </div>
              <div>
                <label style={st.label}>Type</label>
                <select value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })} style={st.select}>
                  <option value="in">Stock IN</option>
                  <option value="out">Stock OUT</option>
                </select>
              </div>
              <div>
                <label style={st.label}>Quantity</label>
                <input type="number" value={newEntry.quantity} onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })} min="1" style={st.input} />
              </div>
              <div>
                <label style={st.label}>Date</label>
                <input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} style={st.input} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddEntry} style={st.btnBlue}>Save</button>
                <button onClick={() => setShowStockEntry(false)} style={st.btnGhost}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Stock Overview */}
      <div style={{ ...st.card, marginBottom: 24 }}>
        <div style={st.headerBar}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Product Stock Overview</h3>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={st.th}>Product Name</th>
                <th style={st.thCenter}>Unit</th>
                <th style={st.thRight}>Opening</th>
                <th style={st.thRight}>Stock IN</th>
                <th style={st.thRight}>Stock OUT</th>
                <th style={st.thRight}>Balance</th>
                <th style={{ ...st.th, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="7" style={{ ...st.td, textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>No products yet. Add your first product!</td></tr>
              ) : (
                products.map((product) => {
                  const entries = stockEntries.filter((e) => String(e.productId) === String(product.id));
                  const stockIn = entries.filter((e) => e.type === 'in').reduce((sum, e) => sum + (e.quantity || 0), 0);
                  const stockOut = entries.filter((e) => e.type === 'out').reduce((sum, e) => sum + (e.quantity || 0), 0);
                  const balance = Number(product.openingStock || 0) + stockIn - stockOut;
                  const isLow = balance <= LOW_STOCK_THRESHOLD;

                  return (
                    <tr key={product.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...st.td, fontWeight: 600 }}>{product.name}</td>
                      <td style={{ ...st.tdCenter, color: 'var(--text-secondary)' }}>{product.unit}</td>
                      <td style={st.tdRight}>{product.openingStock || 0}</td>
                      <td style={{ ...st.tdRight, color: 'var(--teal)' }}>+{stockIn}</td>
                      <td style={{ ...st.tdRight, color: 'var(--danger)' }}>-{stockOut}</td>
                      <td style={{ ...st.tdRight, fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text)' }}>
                        {balance}
                        {isLow && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--crimson-soft)', color: 'var(--crimson)', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>LOW</span>}
                      </td>
                      <td style={st.td}>
                        <button onClick={() => handleDeleteProduct(product.id)} style={st.btnDanger}>X</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Stock Entries */}
      <div style={st.card}>
        <div style={st.headerBar}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Recent Stock Entries</h3>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={st.th}>Date</th>
                <th style={st.th}>Product</th>
                <th style={st.thCenter}>Type</th>
                <th style={st.thRight}>Quantity</th>
                <th style={{ ...st.th, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {stockEntries.length === 0 ? (
                <tr><td colSpan="5" style={{ ...st.td, textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>No stock entries yet.</td></tr>
              ) : (
                [...stockEntries].reverse().slice(0, 20).map((entry) => {
                  const product = products.find((p) => String(p.id) === String(entry.productId));
                  return (
                    <tr key={entry.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={st.td}>{entry.date}</td>
                      <td style={{ ...st.td, fontWeight: 600 }}>{product?.name || 'Unknown'}</td>
                      <td style={st.tdCenter}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                          background: entry.type === 'in' ? 'var(--teal-soft)' : 'var(--crimson-soft)',
                          color: entry.type === 'in' ? 'var(--teal)' : 'var(--crimson)',
                        }}>
                          {entry.type === 'in' ? 'IN' : 'OUT'}
                        </span>
                      </td>
                      <td style={{ ...st.tdRight, fontWeight: 600 }}>{entry.quantity}</td>
                      <td style={st.td}>
                        <button onClick={() => handleDeleteEntry(entry.id)} style={st.btnDanger}>X</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockRegister;
