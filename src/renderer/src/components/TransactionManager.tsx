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
  cashReceived: number
  change: number
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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)
  const [printingPDF, setPrintingPDF] = useState(false)
  const [printingPrinter, setPrintingPrinter] = useState(false)

  const handleExport = async (): Promise<void> => {
    if (filtered.length === 0) return
    setExporting(true)
    try {
      const res = await window.api.exportToExcel(filtered)
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

  const handlePrintPDF = async (): Promise<void> => {
    if (!selectedTx) return
    setPrintingPDF(true)
    try {
      const res = await window.api.printToPDF(selectedTx)
      if (res.success) {
        alert(`Nota berhasil disimpan ke PDF:\n${res.filePath}`)
      } else if (res.message !== 'Cetak PDF dibatalkan') {
        alert(`Gagal menyimpan PDF: ${res.message}`)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Terjadi kesalahan: ${err.message || err}`)
    } finally {
      setPrintingPDF(false)
    }
  }

  const handlePrintPrinter = async (): Promise<void> => {
    if (!selectedTx) return
    setPrintingPrinter(true)
    try {
      const res = await window.api.printToPrinter(selectedTx)
      if (res.success) {
        // successfully sent to print queue
      }
    } catch (err: any) {
      console.error(err)
      if (err.message !== 'Pencetakan dibatalkan') {
        alert(`Gagal mengirim ke printer: ${err.message || err}`)
      }
    } finally {
      setPrintingPrinter(false)
    }
  }

  const handleSelect = (tx: Transaction): void => {
    setSelectedTx(tx)
  }

  const handleDelete = async (id: number): Promise<void> => {
    await onDeleteTransaction(id)
    if (selectedTx?.id === id) {
      setSelectedTx(null)
    }
  }

  // Filter transactions by ID, Seller, Buyer, and Date Range
  const filtered = transactions.filter((t) => {
    const q = searchQuery.trim().toLowerCase()
    const matchSearch =
      !q ||
      t.id.toString().includes(q) ||
      (t.seller || '').toLowerCase().includes(q) ||
      (t.buyer || '').toLowerCase().includes(q)

    const localDate = new Date(t.createdAt)
    const localYYYY = localDate.getFullYear()
    const localMM = String(localDate.getMonth() + 1).padStart(2, '0')
    const localDD = String(localDate.getDate()).padStart(2, '0')
    const dateKey = `${localYYYY}-${localMM}-${localDD}`

    const matchStart = !startDate || dateKey >= startDate
    const matchEnd = !endDate || dateKey <= endDate

    return matchSearch && matchStart && matchEnd
  })

  const summary = useMemo(() => {
    let totalSales = 0
    let totalCost = 0

    for (const tx of filtered) {
      totalSales += tx.total
      if (tx.items) {
        for (const item of tx.items) {
          const buyPrice = item.product?.purchasePrice ?? 0
          totalCost += buyPrice * item.quantity
        }
      }
    }

    const totalProfit = totalSales - totalCost

    return {
      totalSales,
      totalCost,
      totalProfit,
      count: filtered.length
    }
  }, [filtered])

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
          <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Riwayat Transaksi</h4>
          <input
            type="text"
            placeholder="Cari ID, Penjual, Pembeli..."
            className="search-input table-search"
            value={searchQuery}
            onChange={(e): void => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="transaction-filter-bar">
          <div className="filter-item">
            <label htmlFor="filter-start-date">Dari Tanggal</label>
            <input
              id="filter-start-date"
              type="date"
              className="filter-input"
              value={startDate}
              onChange={(e): void => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label htmlFor="filter-end-date">Sampai Tanggal</label>
            <input
              id="filter-end-date"
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
            disabled={exporting || filtered.length === 0}
            style={{ marginLeft: 'auto' }}
          >
            {exporting ? 'Mengekspor...' : '📊 Export Excel'}
          </button>
        </div>

        {/* Dashboard Ringkasan Transaksi */}
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
                Transaksi
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#fff' }}>
                {summary.count}
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
                Total Pembelian
              </div>
              <div
                style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#fb923c' }}
              >
                Rp{summary.totalCost.toLocaleString('id-ID')}
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
                Total Penjualan
              </div>
              <div
                style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: '#818cf8' }}
              >
                Rp{summary.totalSales.toLocaleString('id-ID')}
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
                Laba Kotor
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  marginTop: '4px',
                  color: summary.totalProfit >= 0 ? '#34d399' : '#f87171'
                }}
              >
                Rp{summary.totalProfit.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        )}

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
                  {/* <th style={{ textAlign: 'center', width: '60px' }}>ID</th> */}
                  {/* <th style={{ textAlign: 'center', width: '60px' }}>Penjual</th> */}
                  <th style={{ textAlign: 'center', width: '60px' }}>Pembeli</th>
                  <th>Tanggal Transaksi</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Total Pembelian</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Total Jual</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Laba</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Aksi</th>
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
                    {/* <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {t.id}
                    </td> */}
                    {/* <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {t.seller}
                    </td> */}
                    <td style={{ textAlign: 'left', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {t.buyer}
                    </td>
                    <td>
                      {formatDate(t.createdAt)}
                    </td>
                    {/* Total Modal per transaksi */}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#fb923c' }}>
                      {(() => {
                        const cost = t.items
                          ? t.items.reduce(
                            (sum, item) =>
                              sum + (item.product?.purchasePrice ?? 0) * item.quantity,
                            0
                          )
                          : 0
                        return `Rp${cost.toLocaleString('id-ID')}`
                      })()}
                    </td>
                    {/* Total Jual */}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#818cf8' }}>
                      Rp{t.total.toLocaleString('id-ID')}
                    </td>
                    {/* Laba per transaksi */}
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color:
                          t.total -
                            (t.items
                              ? t.items.reduce(
                                (sum, item) =>
                                  sum + (item.product?.purchasePrice ?? 0) * item.quantity,
                                0
                              )
                              : 0) >=
                            0
                            ? '#34d399'
                            : '#f87171'
                      }}
                    >
                      {(() => {
                        const cost = t.items
                          ? t.items.reduce(
                            (sum, item) =>
                              sum + (item.product?.purchasePrice ?? 0) * item.quantity,
                            0
                          )
                          : 0
                        const profit = t.total - cost
                        return `Rp${profit.toLocaleString('id-ID')}`
                      })()}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e): void => e.stopPropagation()}>
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
          Detail Nota Penjualan
        </h3>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '16px' }}>
          KDMP Uian
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
          <>
            <div className="receipt-actions">
              <button
                className="receipt-action-btn pdf-btn"
                onClick={handlePrintPDF}
                disabled={printingPDF || printingPrinter}
              >
                {printingPDF ? 'Mempersiapkan PDF...' : '📄 Simpan PDF'}
              </button>
              <button
                className="receipt-action-btn print-btn"
                onClick={handlePrintPrinter}
                disabled={printingPDF || printingPrinter}
              >
                {printingPrinter ? 'Mengirim ke Printer...' : '🖨️ Cetak Printer'}
              </button>
            </div>

            <div className="receipt-container">
              <div className="receipt-header">
                <div className="receipt-title">KDMP ULIAN</div>
                <div className="receipt-subtitle">NOTA PENJUALAN</div>
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
                    <th style={{ textAlign: 'right' }}>Harga Jual</th>
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
                {selectedTx.cashReceived > 0 && (
                  <>
                    <div className="receipt-summary-row" style={{ marginTop: '4px' }}>
                      <span>Uang diterima</span>
                      <span>Rp{selectedTx.cashReceived.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="receipt-summary-row">
                      <span>Kembalian</span>
                      <span>Rp{selectedTx.change.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="receipt-footer">Terima Kasih Atas Kunjungan Anda</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
