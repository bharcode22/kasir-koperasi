import { useState, useEffect } from 'react'
import Header from './components/Header'
import ProductCatalogue from './components/ProductCatalogue'
import ProductForm from './components/ProductForm'
import ProductTable from './components/ProductTable'
import ProductTypeManager from './components/ProductTypeManager'
import TransactionManager from './components/TransactionManager'
import CartPanel from './components/CartPanel'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import SalesReport from './components/SalesReport'

interface Product {
  id: number
  name: string
  price: number
  purchasePrice: number
  stock: number
  type: string
}

interface ProductType {
  id: number
  name: string
}

interface TransactionItem {
  id: number
  productId: number
  product?: Product
  quantity: number
  price: number
}

interface Transaction {
  id: number
  createdAt: string
  total: number
  qty: number
  price: number
  seller: string
  buyer: string
  cashReceived: number
  change: number
  items: TransactionItem[]
}

interface CartItem {
  product: Product
  quantity: number
}

interface CurrentUser {
  id: number
  username: string
  name: string
}

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<
    'catalogue' | 'manage' | 'types' | 'transactions' | 'reports'
  >('catalogue')
  const [products, setProducts] = useState<Product[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  // Auth state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem('kasir_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login')

  // State untuk produk yang sedang diedit (null jika mode Tambah Produk)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form input data produk
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    purchasePrice: '',
    stock: '',
    type: ''
  })

  // Toast notification
  const [toast, setToast] = useState<string | null>(null)

  // Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // Fetch products dari database
  const fetchProducts = async (): Promise<void> => {
    try {
      const data = await window.api.getProducts()
      setProducts(data)
    } catch (err) {
      console.error('Gagal mengambil produk:', err)
    }
  }

  // Fetch tipe produk dari database
  const fetchProductTypes = async (): Promise<void> => {
    try {
      const data = await window.api.getProductTypes()
      setProductTypes(data)
    } catch (err) {
      console.error('Gagal mengambil tipe produk:', err)
    }
  }

  // Fetch riwayat transaksi dari database
  const fetchTransactions = async (): Promise<void> => {
    try {
      const data = await window.api.getTransactions()
      setTransactions(data)
    } catch (err) {
      console.error('Gagal mengambil transaksi:', err)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchProducts()
      fetchProductTypes()
      fetchTransactions()
    }
  }, [currentUser])

  // Auth handlers
  const handleLogin = (user: CurrentUser): void => {
    setCurrentUser(user)
    localStorage.setItem('kasir_user', JSON.stringify(user))
  }

  const handleLogout = (): void => {
    setCurrentUser(null)
    localStorage.removeItem('kasir_user')
    setCart([])
  }

  // Show toast helper
  const showToast = (message: string): void => {
    setToast(message)
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

const parseIndonesianNumber = (val: string | number): number => {
  if (typeof val === 'number') return val
  if (!val) return 0
  let cleaned = val.toString().trim()
  if (cleaned.includes('.')) {
    if (!cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '')
    } else {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }
  return parseFloat(cleaned) || 0
}

  // Handle submit form produk (Create atau Update)
  const handleSubmitProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      showToast('Harap isi semua field utama!')
      return
    }

    const parsedPrice = parseIndonesianNumber(formData.price)
    const parsedPurchasePrice = Math.round(parseIndonesianNumber(formData.purchasePrice || '0'))
    const parsedStock = parseInt(formData.stock || '0', 10)

    try {
      if (editingProduct) {
        // Update Produk
        await window.api.updateProduct({
          id: editingProduct.id,
          name: formData.name,
          price: parsedPrice,
          purchasePrice: parsedPurchasePrice,
          stock: parsedStock,
          type: formData.type
        })
        showToast('Produk berhasil diperbarui!')
        setEditingProduct(null)
      } else {
        // Create Produk Baru
        await window.api.createProduct({
          name: formData.name,
          price: parsedPrice,
          purchasePrice: parsedPurchasePrice,
          stock: parsedStock,
          type: formData.type
        })
        showToast('Produk berhasil ditambahkan!')
      }
      setFormData({ name: '', price: '', purchasePrice: '', stock: '', type: '' })
      fetchProducts()
    } catch (err) {
      console.error(err)
      showToast('Gagal memproses produk')
    }
  }

  // Pemicu edit produk (memindahkan data ke form)
  const startEdit = (product: Product): void => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      purchasePrice: Math.round(product.purchasePrice ?? 0).toString(),
      stock: product.stock.toString(),
      type: product.type
    })
  }

  // Batalkan pengeditan produk
  const cancelEdit = (): void => {
    setEditingProduct(null)
    setFormData({ name: '', price: '', purchasePrice: '', stock: '', type: '' })
  }

  // Hapus produk
  const handleDeleteProduct = async (productId: number): Promise<void> => {
    setConfirmDialog({
      title: 'Hapus Produk',
      message: 'Apakah Anda yakin ingin menghapus produk ini?',
      onConfirm: async () => {
        try {
          await window.api.deleteProduct(productId)
          showToast('Produk berhasil dihapus!')
          setCart((prev) => prev.filter((item) => item.product.id !== productId))
          if (editingProduct?.id === productId) {
            cancelEdit()
          }
          fetchProducts()
        } catch (err) {
          console.error(err)
          showToast('Gagal menghapus produk')
        }
      }
    })
  }

  // CRUD Tipe Produk (ProductType)
  const handleCreateProductType = async (name: string): Promise<void> => {
    try {
      await window.api.createProductType({ name })
      showToast('Tipe barang berhasil ditambahkan!')
      fetchProductTypes()
    } catch (err) {
      console.error(err)
      showToast('Gagal menambahkan tipe barang')
    }
  }

  const handleUpdateProductType = async (id: number, name: string): Promise<void> => {
    try {
      await window.api.updateProductType({ id, name })
      showToast('Tipe barang berhasil diperbarui!')
      fetchProductTypes()
      fetchProducts() // Muat ulang barang agar nama tipe yang baru ikut terupdate
    } catch (err) {
      console.error(err)
      showToast('Gagal memperbarui tipe barang')
    }
  }

  const handleDeleteProductType = async (id: number): Promise<void> => {
    setConfirmDialog({
      title: 'Hapus Tipe Barang',
      message: 'Apakah Anda yakin ingin menghapus tipe barang ini?',
      onConfirm: async () => {
        try {
          await window.api.deleteProductType(id)
          showToast('Tipe barang berhasil dihapus!')
          fetchProductTypes()
        } catch (err) {
          console.error(err)
          showToast('Gagal menghapus tipe barang')
        }
      }
    })
  }

  // Hapus Transaksi dari Riwayat
  const handleDeleteTransaction = async (id: number): Promise<void> => {
    setConfirmDialog({
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus transaksi ini dari riwayat?',
      onConfirm: async () => {
        try {
          const res = await window.api.deleteTransaction(id)
          if (res && res.success !== false) {
            showToast('Transaksi berhasil dihapus!')
            fetchProducts() // Muat ulang produk untuk memperbarui stok barang di UI
            fetchTransactions()
          } else {
            showToast(`Gagal: ${res?.message || 'Gagal menghapus transaksi'}`)
          }
        } catch (err) {
          console.error(err)
          showToast('Gagal menghapus transaksi')
        }
      }
    })
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
  const handleCheckout = async (
    buyerName: string,
    cashReceived: number,
    change: number
  ): Promise<void> => {
    if (cart.length === 0) return

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      purchasePrice: item.product.purchasePrice
    }))

    const sellerName = currentUser?.name || 'Umum'
    const finalBuyerName = buyerName.trim() || 'Umum'

    try {
      await window.api.createTransaction({
        seller: sellerName,
        buyer: finalBuyerName,
        cashReceived,
        change,
        items
      })
      showToast('Transaksi Berhasil! Stok diperbarui.')
      setCart([])
      fetchProducts()
      fetchTransactions() // Muat ulang transaksi setelah checkout berhasil
    } catch (err) {
      console.error(err)
      showToast('Gagal memproses transaksi')
    }
  }

  // Filtered catalogue
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Backup Database Handler
  const handleBackupDatabase = async (): Promise<void> => {
    try {
      const res = await window.api.backupDatabase()
      if (res.success) {
        showToast('Backup database berhasil disimpan!')
      } else if (res.message !== 'Backup dibatalkan') {
        showToast(`Gagal backup: ${res.message}`)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Gagal melakukan backup database')
    }
  }

  // Restore Database Handler
  const handleRestoreDatabase = async (): Promise<void> => {
    setConfirmDialog({
      title: 'Pulihkan Database (Restore)',
      message:
        'Apakah Anda yakin ingin memulihkan database dari file cadangan? Data produk dan riwayat transaksi saat ini akan digantikan oleh data dari file backup tersebut.',
      onConfirm: async () => {
        try {
          const res = await window.api.restoreDatabase()
          if (res.success) {
            showToast('Database berhasil dipulihkan!')
            fetchProducts()
            fetchProductTypes()
            fetchTransactions()
          } else if (res.message !== 'Restore dibatalkan') {
            showToast(`Gagal restore: ${res.message}`)
          }
        } catch (err: any) {
          console.error(err)
          showToast('Gagal memulihkan database')
        }
      }
    })
  }

  // Auth guard: tampilkan login/register jika belum login
  if (!currentUser) {
    if (authPage === 'register') {
      return (
        <RegisterPage
          onRegister={(user): void => {
            handleLogin(user)
            setAuthPage('login')
          }}
          onGoLogin={(): void => setAuthPage('login')}
        />
      )
    }
    return <LoginPage onLogin={handleLogin} onGoRegister={(): void => setAuthPage('register')} />
  }

  return (
    <div className="pos-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast" id="toast-notif">
          {toast}
        </div>
      )}

      {/* POS Header Component */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onBackupDatabase={handleBackupDatabase}
        onRestoreDatabase={handleRestoreDatabase}
      />

      {/* Main Grid */}
      <main className={`pos-grid ${activeTab !== 'catalogue' ? 'full-width' : ''}`}>
        {/* Left Panel */}
        <section className="catalogue-panel">
          <div className="panel-header">
            <div className="tabs">
              <button
                id="tab-catalogue"
                className={`tab-btn ${activeTab === 'catalogue' ? 'active' : ''}`}
                onClick={(): void => setActiveTab('catalogue')}
              >
                Katalog Barang
              </button>
              <button
                id="tab-transactions"
                className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={(): void => {
                  setActiveTab('transactions')
                  cancelEdit()
                  fetchTransactions()
                }}
              >
                Riwayat Transaksi
              </button>
              <button
                id="tab-reports"
                className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={(): void => {
                  setActiveTab('reports')
                  cancelEdit()
                  fetchTransactions()
                }}
              >
                Laporan Penjualan
              </button>
              <button
                id="tab-manage"
                className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={(): void => {
                  setActiveTab('manage')
                  cancelEdit() // Reset form ke mode tambah baru saat ganti tab
                }}
              >
                Kelola Barang
              </button>
              <button
                id="tab-types"
                className={`tab-btn ${activeTab === 'types' ? 'active' : ''}`}
                onClick={(): void => {
                  setActiveTab('types')
                  cancelEdit()
                }}
              >
                Kelola Tipe
              </button>
            </div>
          </div>

          {activeTab === 'catalogue' ? (
            <ProductCatalogue
              products={filteredProducts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onProductClick={addToCart}
            />
          ) : activeTab === 'manage' ? (
            <div className="manage-tab-container">
              {/* Sisi Kiri: Tabel Daftar Produk untuk Edit & Hapus */}
              <ProductTable
                products={products}
                onEditClick={startEdit}
                onDeleteClick={handleDeleteProduct}
              />

              {/* Sisi Kanan: Form Tambah/Edit Produk */}
              <ProductForm
                formData={formData}
                onFormChange={setFormData}
                onSubmit={handleSubmitProduct}
                isEditing={!!editingProduct}
                editingProduct={editingProduct}
                onCancelEdit={cancelEdit}
                productTypes={productTypes}
              />
            </div>
          ) : activeTab === 'types' ? (
            <ProductTypeManager
              productTypes={productTypes}
              onCreateType={handleCreateProductType}
              onUpdateType={handleUpdateProductType}
              onDeleteType={handleDeleteProductType}
            />
          ) : activeTab === 'reports' ? (
            <SalesReport transactions={transactions} />
          ) : (
            <TransactionManager
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </section>

        {/* Right Cart Panel Component */}
        {activeTab === 'catalogue' && (
          <CartPanel
            cart={cart}
            onUpdateQty={updateQty}
            onRemoveFromCart={removeFromCart}
            onCheckout={handleCheckout}
          />
        )}
      </main>

      {/* Modal Konfirmasi Pengganti Window.confirm Native */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmDialog.onConfirm
                  setConfirmDialog(null)
                  action()
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
