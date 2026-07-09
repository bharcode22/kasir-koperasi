import React, { useState } from 'react'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  type: string
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
  items: TransactionItem[]
}

interface TransactionManagerProps {
  transactions: Transaction[]
  onDeleteTransaction: (id: number) => Promise<void>
}

export default function TransactionManager({
  transactions,
  onDeleteTransaction
}: TransactionManagerProps): React.JSX.Element {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelect = (tx: Transaction): void => {
    setSelectedTx(tx)
  }

  const handleDelete = async (id: number): Promise<void> => {
    await onDeleteTransaction(id)
    if (selectedTx?.id === id) {
      setSelectedTx(null)
    }
  }

  // Filter transactions by ID
  const filtered = transactions.filter((t) => t.id.toString().includes(searchQuery.trim()))

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="manage-tab-container">
      {/* Sisi Kiri: Daftar Transaksi */}
      <div className="product-table-wrapper">
        <div className="table-header-row">
          <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>
            Riwayat Transaksi ({transactions.length})
          </h4>
          <input
            type="number"
            placeholder="Cari ID Transaksi..."
            className="search-input table-search"
            value={searchQuery}
            onChange={(e): void => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="table-scroll-container">
          {filtered.length === 0 ? (
            <div
              style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '14px' }}
            >
              Belum ada data transaksi.
            </div>
          ) : (
            <table className="pos-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '60px' }}>No</th>
                  <th style={{ textAlign: 'center', width: '60px' }}>ID</th>
                  <th style={{ textAlign: 'center', width: '60px' }}>Penjual</th>
                  <th style={{ textAlign: 'center', width: '60px' }}>Pembeli</th>
                  <th>Tanggal & Waktu</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Total</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, index) => (
                  <tr
                    key={t.id}
                    className={selectedTx?.id === t.id ? 'active-row' : ''}
                    style={{
                      cursor: 'pointer',
                      background: selectedTx?.id === t.id ? 'rgba(255,255,255,0.04)' : undefined
                    }}
                    onClick={(): void => handleSelect(t)}
                  >
                    <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {index + 1}
                    </td>
                    <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {t.id}
                    </td>
                    <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {t.seller}
                    </td>
                    <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {t.buyer}
                    </td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      Rp{t.total.toLocaleString('id-ID')}
                    </td>
                    <td
                      style={{ textAlign: 'center' }}
                      onClick={(e): void => e.stopPropagation()}
                    >
                      <div className="table-actions">
                        <button
                          className="action-btn-edit"
                          onClick={(): void => handleSelect(t)}
                          title="Detail Transaksi"
                        >
                          Detail
                        </button>
                        <button
                          className="action-btn-delete"
                          onClick={(): void => {
                            handleDelete(t.id)
                          }}
                          title="Hapus Transaksi"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sisi Kanan: Panel Detail Struk Nota */}
      <div className="manage-form detail-transaction-panel">
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '16px' }}>
          Detail Nota Belanja
        </h3>

        {!selectedTx ? (
          <div className="detail-empty">
            <span style={{ fontSize: '32px' }}>📄</span>
            <span
              style={{
                color: '#6b7280',
                fontSize: '13px',
                textAlign: 'center',
                marginTop: '12px'
              }}
            >
              Pilih transaksi di sebelah kiri untuk melihat rincian belanjaan.
            </span>
          </div>
        ) : (
          <div className="receipt-container">
            <div className="receipt-header">
              <div className="receipt-title">NOTA BELANJA</div>
              <div className="receipt-meta">
                <table className="receipt-meta-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '120px' }}>ID Transaksi</td>
                      <td>: #{selectedTx.id}</td>
                    </tr>
                    <tr>
                      <td>Tanggal</td>
                      <td>: {formatDate(selectedTx.createdAt)}</td>
                    </tr>
                    {selectedTx.seller && (
                      <tr>
                        <td>Penjual</td>
                        <td>: {selectedTx.seller}</td>
                      </tr>
                    )}
                    {selectedTx.buyer && (
                      <tr>
                        <td>Pembeli</td>
                        <td>: {selectedTx.buyer}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="receipt-divider"></div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Harga Satuan</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedTx.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.product?.name || 'Barang Dihapus'}</div>
                      {item.product?.type && (
                        <span className="receipt-item-type">{item.product.type}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>Rp{item.price.toLocaleString('id-ID')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-divider"></div>

            <div className="receipt-summary">
              <div className="receipt-summary-row">
                <span>Subtotal</span>
                <span>Rp{selectedTx.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="receipt-summary-row">
                <span>Pajak (0%)</span>
                <span>Rp0</span>
              </div>
              <div className="receipt-summary-row grand-total">
                <span>TOTAL AKHIR</span>
                <span>Rp{selectedTx.total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="receipt-footer">Terima Kasih Atas Kunjungan Anda</div>
          </div>
        )}
      </div>
    </div>
  )
}
