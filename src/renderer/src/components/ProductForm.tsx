import React from 'react'

interface FormData {
  name: string
  price: string
  stock: string
  type: string
}

interface ProductFormProps {
  formData: FormData
  onFormChange: (data: FormData) => void
  onSubmit: (e: React.FormEvent) => void
  isEditing: boolean
  onCancelEdit?: () => void
  productTypes: { id: number; name: string }[]
}

export default function ProductForm({
  formData,
  onFormChange,
  onSubmit,
  isEditing,
  onCancelEdit,
  productTypes
}: ProductFormProps): React.JSX.Element {
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
        <div
          className="form-group-row"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
        >
          <div className="form-group">
            <label htmlFor="prod-price">Harga Satuan</label>
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
          <div className="form-group">
            <label htmlFor="prod-stock">Stok Awal</label>
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
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            id="btn-submit-product"
            className="submit-btn"
            style={{ flex: 1 }}
          >
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
