import React, { useState, useEffect } from 'react'

interface FormData {
  name: string
  price: string
  purchasePrice: string
  stock: string
  type: string
}

interface Product {
  id: number
  name: string
  price: number
  purchasePrice: number
  stock: number
  type: string
}

interface ProductFormProps {
  formData: FormData
  onFormChange: (data: FormData) => void
  onSubmit: (e: React.FormEvent) => void
  isEditing: boolean
  editingProduct?: Product | null
  onCancelEdit?: () => void
  productTypes: { id: number; name: string }[]
}

export default function ProductForm({
  formData,
  onFormChange,
  onSubmit,
  isEditing,
  editingProduct,
  onCancelEdit,
  productTypes
}: ProductFormProps): React.JSX.Element {
  const [isRestockMode, setIsRestockMode] = useState(false)
  const [restockQty, setRestockQty] = useState('')
  const [newPurchasePriceInput, setNewPurchasePriceInput] = useState('')

  useEffect(() => {
    setIsRestockMode(false)
    setRestockQty('')
    setNewPurchasePriceInput('')
  }, [editingProduct])

  const originalStock = editingProduct ? editingProduct.stock : 0
  const originalPurchasePrice = editingProduct ? (editingProduct.purchasePrice ?? 0) : 0

  const handleRestockQtyChange = (qtyStr: string): void => {
    setRestockQty(qtyStr)
    const qty = parseInt(qtyStr, 10) || 0
    const newPP = parseFloat(newPurchasePriceInput) || originalPurchasePrice

    const finalStock = originalStock + qty
    let finalPurchasePrice = originalPurchasePrice

    if (finalStock > 0) {
      finalPurchasePrice = ((originalStock * originalPurchasePrice) + (qty * newPP)) / finalStock
    }

    onFormChange({
      ...formData,
      stock: finalStock.toString(),
      purchasePrice: finalPurchasePrice.toString()
    })
  }

  const handleNewPurchasePriceChange = (ppStr: string): void => {
    setNewPurchasePriceInput(ppStr)
    const qty = parseInt(restockQty, 10) || 0
    const newPP = parseFloat(ppStr) || 0

    const finalStock = originalStock + qty
    let finalPurchasePrice = originalPurchasePrice

    if (finalStock > 0) {
      finalPurchasePrice = ((originalStock * originalPurchasePrice) + (qty * newPP)) / finalStock
    }

    onFormChange({
      ...formData,
      stock: finalStock.toString(),
      purchasePrice: finalPurchasePrice.toString()
    })
  }

  const handleToggleRestock = (checked: boolean): void => {
    setIsRestockMode(checked)
    if (checked) {
      setRestockQty('')
      setNewPurchasePriceInput(originalPurchasePrice.toString())
      onFormChange({
        ...formData,
        stock: originalStock.toString(),
        purchasePrice: originalPurchasePrice.toString()
      })
    } else {
      onFormChange({
        ...formData,
        stock: originalStock.toString(),
        purchasePrice: originalPurchasePrice.toString()
      })
    }
  }

  return (
    <div className="manage-form">
      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '8px' }}>
        {isEditing ? 'Edit Produk' : 'Tambah Barang Baru'}
      </h3>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label htmlFor="prod-name">Nama Barang</label>
          <input
            id="prod-name"
            type="text"
            className="form-control"
            placeholder="Masukkan nama barang"
            value={formData.name}
            onChange={(e): void => onFormChange({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="prod-type">Tipe Barang</label>
          <select
            id="prod-type"
            className="form-control form-select"
            value={formData.type}
            onChange={(e): void => onFormChange({ ...formData, type: e.target.value })}
            required
          >
            <option value="">-- Pilih Tipe Barang --</option>
            {productTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {isEditing && (
          <div
            className="form-group-checkbox"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}
          >
            <input
              id="is-restock-mode"
              type="checkbox"
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              checked={isRestockMode}
              onChange={(e): void => handleToggleRestock(e.target.checked)}
            />
            <label
              htmlFor="is-restock-mode"
              style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6', cursor: 'pointer' }}
            >
              Tambah Stok (Restock Barang)
            </label>
          </div>
        )}

        {isRestockMode ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '12px',
                color: '#9ca3af',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                paddingBottom: '8px'
              }}
            >
              <div>
                <span>Stok Sekarang: </span>
                <strong style={{ color: '#fff' }}>{originalStock} unit</strong>
              </div>
              <div>
                <span>Harga Beli Lama: </span>
                <strong style={{ color: '#fb923c' }}>
                  Rp{originalPurchasePrice.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="restock-qty" style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Jumlah Stok Masuk
                </label>
                <input
                  id="restock-qty"
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="Contoh: 20"
                  value={restockQty}
                  onChange={(e): void => handleRestockQtyChange(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-purchase-price" style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Harga Beli Baru / Unit
                </label>
                <input
                  id="new-purchase-price"
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Contoh: 9500"
                  value={newPurchasePriceInput}
                  onChange={(e): void => handleNewPurchasePriceChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div
              style={{
                background: 'rgba(251, 146, 60, 0.05)',
                border: '1px solid rgba(251, 146, 60, 0.15)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Total Stok Akhir:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>
                  {originalStock + (parseInt(restockQty, 10) || 0)} unit
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Harga Beli Rata-Rata (WAC):</span>
                <span style={{ fontWeight: 700, color: '#fb923c' }}>
                  Rp
                  {Math.round(parseFloat(formData.purchasePrice || '0')).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prod-price-restock">Harga Jual Baru</label>
              <input
                id="prod-price-restock"
                type="number"
                min="0"
                className="form-control"
                placeholder="Contoh: 15000"
                value={formData.price}
                onChange={(e): void => onFormChange({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>
        ) : (
          <>
            <div
              className="form-group-row"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
            >
              <div className="form-group">
                <label htmlFor="prod-purchase-price">Harga Beli</label>
                <input
                  id="prod-purchase-price"
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Contoh: 12000"
                  value={formData.purchasePrice}
                  onChange={(e): void => onFormChange({ ...formData, purchasePrice: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="prod-price">Harga Jual</label>
                <input
                  id="prod-price"
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Contoh: 15000"
                  value={formData.price}
                  onChange={(e): void => onFormChange({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="prod-stock">{isEditing ? 'Stok' : 'Stok Awal'}</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                className="form-control"
                placeholder="Contoh: 50"
                value={formData.stock}
                onChange={(e): void => onFormChange({ ...formData, stock: e.target.value })}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" id="btn-submit-product" className="submit-btn" style={{ flex: 1 }}>
            {isEditing ? 'Update Barang' : 'Simpan Barang'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="submit-btn"
              onClick={onCancelEdit}
              style={{ backgroundColor: '#4b5563', flex: 1 }}
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
