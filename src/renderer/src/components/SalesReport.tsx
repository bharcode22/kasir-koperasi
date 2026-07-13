import React, { useState, useMemo } from 'react'

interface Product {
  id: number
  name: string
  price: number
  purchasePrice?: number
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

interface SalesReportProps {
  transactions: Transaction[]
}

export default function SalesReport({ transactions }: SalesReportProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  // 1. Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const localDate = new Date(t.createdAt)
      const localYYYY = localDate.getFullYear()
      const localMM = String(localDate.getMonth() + 1).padStart(2, '0')
      const localDD = String(localDate.getDate()).padStart(2, '0')
      const dateKey = `${localYYYY}-${localMM}-${localDD}`

      const matchStart = !startDate || dateKey >= startDate
      const matchEnd = !endDate || dateKey <= endDate

      return matchStart && matchEnd
    })
  }, [transactions, startDate, endDate])

  // 2. Aggregate sales per product item
  const aggregatedSales = useMemo(() => {
    const map: Record<
      number,
      {
        productId: number
        name: string
        type: string
        quantitySold: number
        totalRevenue: number
        totalCost: number
      }
    > = {}

    for (const tx of filteredTransactions) {
      if (tx.items) {
        for (const item of tx.items) {
          const pid = item.productId
          const name = item.product?.name || 'Barang Dihapus'
          const type = item.product?.type || 'Umum'
          const qty = item.quantity
          const revenue = item.price * qty
          const buyPrice = item.product?.purchasePrice ?? 0
          const cost = buyPrice * qty

          if (!map[pid]) {
            map[pid] = {
              productId: pid,
              name,
              type,
              quantitySold: 0,
              totalRevenue: 0,
              totalCost: 0
            }
          }

          map[pid].quantitySold += qty
          map[pid].totalRevenue += revenue
          map[pid].totalCost += cost
        }
      }
    }

    const list = Object.values(map).map((item) => {
      const profit = item.totalRevenue - item.totalCost
      const avgPurchasePrice = item.quantitySold > 0 ? item.totalCost / item.quantitySold : 0
      const avgSellPrice = item.quantitySold > 0 ? item.totalRevenue / item.quantitySold : 0

      return {
        ...item,
        profit,
        avgPurchasePrice,
        avgSellPrice
      }
    })

    const q = searchQuery.toLowerCase().trim()
    if (q) {
      return list.filter(
        (item) => item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
      )
    }
    return list
  }, [filteredTransactions, searchQuery])

  // 3. Calculate summary metrics
  const summary = useMemo(() => {
    let qty = 0
    let cost = 0
    let revenue = 0
    let profit = 0

    for (const item of aggregatedSales) {
      qty += item.quantitySold
      cost += item.totalCost
      revenue += item.totalRevenue
      profit += item.profit
    }

    return { qty, cost, revenue, profit }
  }, [aggregatedSales])

  const handleExport = async (): Promise<void> => {
    if (aggregatedSales.length === 0) return
    setExporting(true)
    try {
      const res = await window.api.exportSalesReport(aggregatedSales)
      if (res.success) {
        alert(`Data berhasil di-export ke:\n${res.filePath}`)
      } else if (res.message !== 'Ekspor dibatalkan') {
        alert(`Gagal mengekspor data: ${res.message}`)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Terjadi kesalahan: ${err.message || err}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="product-table-wrapper" style={{ width: '100%' }}>
      <div className="table-header-row">
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, margin: 0 }}>
          Buku Kecil
        </h3>
        <input
          type="text"
          placeholder="Cari barang atau tipe..."
          className="search-input table-search"
          value={searchQuery}
          onChange={(e): void => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Date Filters */}
      <div className="transaction-filter-bar" style={{ marginTop: '8px', marginBottom: '16px' }}>
        <div className="filter-item">
          <label htmlFor="report-start-date">Dari Tanggal</label>
          <input
            id="report-start-date"
            type="date"
            className="filter-input"
            value={startDate}
            onChange={(e): void => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label htmlFor="report-end-date">Sampai Tanggal</label>
          <input
            id="report-end-date"
            type="date"
            className="filter-input"
            value={endDate}
            onChange={(e): void => setEndDate(e.target.value)}
          />
        </div>
        {(startDate || endDate || searchQuery) && (
          <button
            className="reset-filter-btn"
            onClick={(): void => {
              setStartDate('')
              setEndDate('')
              setSearchQuery('')
            }}
          >
            Reset
          </button>
        )}
        <button
          className="export-excel-btn"
          onClick={handleExport}
          disabled={exporting || aggregatedSales.length === 0}
          style={{ marginLeft: 'auto' }}
        >
          {exporting ? 'Mengekspor...' : '📊 Export Excel'}
        </button>
      </div>

      {/* Summary Cards */}
      {aggregatedSales.length > 0 && (
        <div
          className="transaction-summary-dashboard"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
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
              Total Barang Terjual
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#fff' }}>
              {summary.qty} pcs
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
              Total Jual
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#818cf8' }}>
              Rp{summary.revenue.toLocaleString('id-ID')}
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
              Total Beli
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#fb923c' }}>
              Rp{summary.cost.toLocaleString('id-ID')}
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
              Total Laba Kotor
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                marginTop: '4px',
                color: summary.profit >= 0 ? '#34d399' : '#f87171'
              }}
            >
              Rp{summary.profit.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      )}

      {/* Sales Report Table */}
      <div className="table-scroll-container">
        {aggregatedSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '14px' }}>
            Tidak ada data penjualan untuk filter saat ini.
          </div>
        ) : (
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '50px' }}>No</th>
                <th>Nama Barang</th>
                <th>Tipe</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Terjual</th>
                <th style={{ textAlign: 'right' }}>Harga Beli</th>
                <th style={{ textAlign: 'right' }}>Harga Satuan</th>
                <th style={{ textAlign: 'right' }}>Total Pembelian</th>
                <th style={{ textAlign: 'right' }}>Total Penjualan</th>
                <th style={{ textAlign: 'right' }}>Laba Kotor</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedSales.map((item, index) => (
                <tr key={item.productId}>
                  <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {index + 1}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>
                    <span style={{ opacity: 0.8, fontSize: '12px' }}>{item.type}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantitySold} pcs</td>
                  <td style={{ textAlign: 'right' }}>
                    Rp{Math.round(item.avgPurchasePrice).toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    Rp{Math.round(item.avgSellPrice).toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'right', color: '#fb923c' }}>
                    Rp{item.totalCost.toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'right', color: '#818cf8', fontWeight: 600 }}>
                    Rp{item.totalRevenue.toLocaleString('id-ID')}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: item.profit >= 0 ? '#34d399' : '#f87171',
                      fontWeight: 600
                    }}
                  >
                    Rp{item.profit.toLocaleString('id-ID')}
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
