import React, { useState } from 'react'

interface ProductType {
  id: number
  name: string
}

interface ProductTypeManagerProps {
  productTypes: ProductType[]
  onCreateType: (name: string) => Promise<void>
  onUpdateType: (id: number, name: string) => Promise<void>
  onDeleteType: (id: number) => Promise<void>
}

export default function ProductTypeManager({
  productTypes,
  onCreateType,
  onUpdateType,
  onDeleteType
}: ProductTypeManagerProps): React.JSX.Element {
  const [editingType, setEditingType] = useState<ProductType | null>(null)
  const [typeName, setTypeName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!typeName.trim()) return

    try {
      if (editingType) {
        await onUpdateType(editingType.id, typeName.trim())
        setEditingType(null)
      } else {
        await onCreateType(typeName.trim())
      }
      setTypeName('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditClick = (type: ProductType): void => {
    setEditingType(type)
    setTypeName(type.name)
  }

  const handleCancelEdit = (): void => {
    setEditingType(null)
    setTypeName('')
  }

  const filtered = productTypes.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="manage-tab-container">
      {/* Sisi Kiri: Tabel Tipe Produk */}
      <div className="product-table-wrapper">
        <div className="table-header-row">
          <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>
            Daftar Tipe Barang ({productTypes.length})
          </h4>
          <input
            type="text"
            placeholder="Cari tipe..."
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
              Belum ada tipe barang.
            </div>
          ) : (
            <table className="pos-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '60px' }}>No</th>
                  <th style={{ textAlign: 'center', width: '60px' }}>ID</th>
                  <th>Nama Tipe</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, index) => (
                  <tr key={t.id}>
                    <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {index + 1}
                    </td>
                    <td style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {t.id}
                    </td>
                    <td>{t.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-actions">
                        <button
                          className="action-btn-edit"
                          onClick={(): void => handleEditClick(t)}
                          title="Edit Tipe"
                        >
                          Update
                        </button>
                        <button
                          className="action-btn-delete"
                          onClick={(): void => {
                            onDeleteType(t.id)
                          }}
                          title="Hapus Tipe"
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

      {/* Sisi Kanan: Form Tambah/Edit Tipe */}
      <div className="manage-form">
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, marginBottom: '8px' }}>
          {editingType ? 'Edit Tipe Barang' : 'Tambah Tipe Baru'}
        </h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div className="form-group">
            <label htmlFor="type-name">Nama Tipe Barang</label>
            <input
              id="type-name"
              type="text"
              className="form-control"
              placeholder="Masukkan nama tipe barang"
              value={typeName}
              onChange={(e): void => setTypeName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="submit-btn" style={{ flex: 1 }}>
              {editingType ? 'Update Tipe' : 'Simpan Tipe'}
            </button>
            {editingType && (
              <button
                type="button"
                className="submit-btn"
                onClick={handleCancelEdit}
                style={{ backgroundColor: '#4b5563', flex: 1 }}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
