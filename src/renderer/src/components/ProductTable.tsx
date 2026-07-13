import React, { useMemo, useState } from 'react'

interface Product {
  id: number
  name: string
  price: number
  purchasePrice: number
  stock: number
  type: string
}

interface ProductTableProps {
  products: Product[]
  onEditClick: (product: Product) => void
  onDeleteClick: (productId: number) => void
}

export default function ProductTable({
  products,
  onEditClick,
  onDeleteClick
}: ProductTableProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState<string>('Semua')

  // Derive unique types for filter buttons
  const types = useMemo(() => {
    const set = new Set(products.map((p) => p.type?.trim() || 'Umum'))
    return ['Semua', ...Array.from(set).sort()]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase())
      const matchType = activeType === 'Semua' || (p.type?.trim() || 'Umum') === activeType
      return matchQuery && matchType
    })
  }, [products, query, activeType])

  const stockSummary = useMemo(() => {
    let totalStock = 0
    let totalAssetCost = 0
    let totalAssetValue = 0

    for (const p of filtered) {
      totalStock += p.stock
      totalAssetCost += (p.purchasePrice ?? 0) * p.stock
      totalAssetValue += p.price * p.stock
    }

    const potentialProfit = totalAssetValue - totalAssetCost

    return {
      totalStock,
      totalAssetCost,
      totalAssetValue,
      potentialProfit
    }
  }, [filtered])

  return (
    <div className="product-table-wrapper">
      <div className="table-header-row">
        <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>
          Daftar Barang ({products.length})
        </h4>
        <input
          type="text"
          placeholder="Cari barang..."
          className="search-input table-search"
          value={query}
          onChange={(e): void => setQuery(e.target.value)}
        />
      </div>

      {/* Filter type buttons */}
      <div className="filter-type-bar">
        {types.map((t) => (
          <button
            key={t}
            className={`filter-type-btn ${activeType === t ? 'active' : ''}`}
            onClick={(): void => setActiveType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard Ringkasan Aset Barang */}
      {filtered.length > 0 && (
        <div
          className="transaction-summary-dashboard"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
            marginTop: '12px'
          }}
        >
          <div
            className="summary-card"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              padding: '12px',
              borderRadius: '8px'
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
            >
              Total Stok Fisik
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#fff' }}>
              {stockSummary.totalStock} unit
            </div>
          </div>
          <div
            className="summary-card"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              padding: '12px',
              borderRadius: '8px'
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
            >
              Total Modal Aset
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#fb923c' }}>
              Rp{stockSummary.totalAssetCost.toLocaleString('id-ID')}
            </div>
          </div>
          <div
            className="summary-card"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              padding: '12px',
              borderRadius: '8px'
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
            >
              Nilai Jual Aset
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#818cf8' }}>
              Rp{stockSummary.totalAssetValue.toLocaleString('id-ID')}
            </div>
          </div>
          <div
            className="summary-card"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              padding: '12px',
              borderRadius: '8px'
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
            >
              Potensi Laba Aset
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                marginTop: '4px',
                color: stockSummary.potentialProfit >= 0 ? '#34d399' : '#f87171'
              }}
            >
              Rp{stockSummary.potentialProfit.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      )}

      <div className="table-scroll-container">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '14px' }}>
            Belum ada data barang.
          </div>
        ) : (
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '60px' }}>No</th>
                <th style={{ textAlign: 'center', width: '60px' }}>ID</th>
                <th>Nama Barang</th>
                <th>Tipe</th>
                <th style={{ textAlign: 'left' }}>Harga Beli</th>
                <th style={{ textAlign: 'left' }}>Harga Jual</th>
                <th style={{ textAlign: 'center' }}>Stok</th>
                <th style={{ textAlign: 'right' }}>Total Modal</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, index) => (
                <tr key={p.id}>
                  <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {index + 1}
                  </td>
                  <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {p.id}
                  </td>
                  <td>{p.name}</td>
                  <td>
                    <span style={{ opacity: 0.8, fontSize: '12px' }}>{p.type || '-'}</span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    Rp{(p.purchasePrice ?? 0).toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>
                    Rp{p.price.toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`table-stock-badge ${p.stock <= 0 ? 'out' : ''}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#fb923c' }}>
                    Rp{((p.purchasePrice ?? 0) * p.stock).toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions">
                      <button
                        className="action-btn-edit"
                        onClick={(): void => onEditClick(p)}
                        title="Edit Produk"
                      >
                        Update
                      </button>
                      <button
                        className="action-btn-delete"
                        onClick={(): void => onDeleteClick(p.id)}
                        title="Hapus Produk"
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
  )
}
