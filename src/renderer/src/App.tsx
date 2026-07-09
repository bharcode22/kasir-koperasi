import { useState, useEffect } from 'react'

interface Product {
  id: number
  name: string
  price: number
  sku: string
  stock: number
}

interface CartItem {
  product: Product
  quantity: number
}

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'manage'>('catalogue')
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  // Form add product
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sku: '',
    stock: ''
  })

  // Toast & Receipt
  const [toast, setToast] = useState<string | null>(null)

  // Fetch products on mount
  const fetchProducts = async (): Promise<void> => {
    try {
      const data = await window.api.getProducts()
      setProducts(data)
    } catch (err) {
      console.error('Gagal mengambil produk:', err)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Show Toast helper
  const showToast = (message: string): void => {
    setToast(message)
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  // Handle Add Product
  const handleAddProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formData.name || !formData.price || !formData.sku) {
      showToast('Harap isi semua field utama!')
      return
    }

    try {
      await window.api.createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        sku: formData.sku,
        stock: parseInt(formData.stock || '0', 10)
      })
      showToast('Produk berhasil ditambahkan!')
      setFormData({ name: '', price: '', sku: '', stock: '' })
      fetchProducts()
      setActiveTab('catalogue')
    } catch (err) {
      console.error(err)
      showToast('Gagal menambahkan produk (SKU mungkin duplikat)')
    }
  }

  // Add to cart
  const addToCart = (product: Product): void => {
    if (product.stock <= 0) {
      showToast('Stok produk habis!')
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast('Jumlah melebihi stok yang tersedia!')
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  // Update Cart Qty
  const updateQty = (productId: number, delta: number): void => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            if (newQty > item.product.stock) {
              showToast('Stok tidak mencukupi!')
              return item
            }
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

  // Remove from cart
  const removeFromCart = (productId: number): void => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  // Checkout
  const handleCheckout = async (): Promise<void> => {
    if (cart.length === 0) return

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price
    }))

    try {
      await window.api.createTransaction({ total, items })
      showToast('Transaksi Berhasil! Stok diperbarui.')
      setCart([])
      fetchProducts()
    } catch (err) {
      console.error(err)
      showToast('Gagal memproses transaksi')
    }
  }

  // Filtered catalogue
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <div className="pos-container">
      {/* Toast Notification */}
      {toast && <div className="toast" id="toast-notif">{toast}</div>}

      {/* POS Header */}
      <header className="pos-header">
        <div className="pos-title-area">
          <div className="pos-logo">A</div>
          <span className="pos-title">Kasir</span>
        </div>
        <div className="pos-status">
          <div className="status-dot"></div>
          <span>SQLite Database connected</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="pos-grid">
        {/* Left Catalogue Panel */}
        <section className="catalogue-panel">
          <div className="panel-header">
            <div className="tabs">
              <button
                id="tab-catalogue"
                className={`tab-btn ${activeTab === 'catalogue' ? 'active' : ''}`}
                onClick={(): void => setActiveTab('catalogue')}
              >
                Katalog Produk
              </button>
              <button
                id="tab-manage"
                className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={(): void => setActiveTab('manage')}
              >
                Kelola Barang
              </button>
            </div>
            {activeTab === 'catalogue' && (
              <div className="search-input-wrapper">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Cari barang atau SKU..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e): void => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="scroll-container">
            {activeTab === 'catalogue' ? (
              <div className="product-grid" id="product-grid">
                {filteredProducts.length === 0 ? (
                  <div style={{ color: '#6b7280', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                    Tidak ada produk ditemukan.
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="product-card"
                      onClick={(): void => addToCart(product)}
                      id={`product-card-${product.id}`}
                    >
                      <div>
                        <div className="product-sku">{product.sku}</div>
                        <div className="product-name">{product.name}</div>
                      </div>
                      <div className="product-footer">
                        <div className="product-price">Rp{product.price.toLocaleString('id-ID')}</div>
                        <div className={`product-stock ${product.stock <= 0 ? 'out' : ''}`}>
                          {product.stock <= 0 ? 'Habis' : `Stok: ${product.stock}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="manage-form">
                <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '8px' }}>Tambah Produk Baru</h3>
                <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="prod-name">Nama Barang</label>
                    <input
                      id="prod-name"
                      type="text"
                      className="form-control"
                      placeholder="Masukkan nama barang"
                      value={formData.name}
                      onChange={(e): void => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-sku">Kode Barang</label>
                    <input
                      id="prod-sku"
                      type="text"
                      className="form-control"
                      placeholder="BRG-001"
                      value={formData.sku}
                      onChange={(e): void => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label htmlFor="prod-price">Harga (satuan)</label>
                      <input
                        id="prod-price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="Contoh: 15000"
                        value={formData.price}
                        onChange={(e): void => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="prod-stock">Stok Awal</label>
                      <input
                        id="prod-stock"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="Contoh: 50"
                        value={formData.stock}
                        onChange={(e): void => setFormData({ ...formData, stock: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" id="btn-submit-product" className="submit-btn">
                    Simpan Produk
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Right Cart Panel */}
        <section className="cart-panel">
          <div className="cart-title">Keranjang Belanja</div>

          <div className="cart-items" id="cart-items-container">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span style={{ fontSize: '32px' }}>🛒</span>
                <span>Keranjang masih kosong</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="cart-item" id={`cart-item-${item.product.id}`}>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product.name}</div>
                    <div className="cart-item-price">Rp{item.product.price.toLocaleString('id-ID')}</div>
                  </div>

                  <div className="cart-item-qty-control">
                    <button
                      className="qty-btn"
                      onClick={(): void => updateQty(item.product.id, -1)}
                      id={`btn-qty-minus-${item.product.id}`}
                    >
                      -
                    </button>
                    <span className="qty-val">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={(): void => updateQty(item.product.id, 1)}
                      id={`btn-qty-plus-${item.product.id}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-total">
                    Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}
                  </div>

                  <button
                    className="cart-item-remove"
                    onClick={(): void => removeFromCart(item.product.id)}
                    title="Hapus"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="summary-row">
              <span>Pajak (0%)</span>
              <span>Rp0</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
            </div>
            <button
              id="btn-pay"
              className="pay-btn"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Proses Pembayaran (Bayar)
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
