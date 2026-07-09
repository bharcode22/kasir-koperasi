import React, { useMemo } from 'react'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  type: string
}

interface ProductCatalogueProps {
  products: Product[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onProductClick: (product: Product) => void
}

export default function ProductCatalogue({
  products,
  searchQuery,
  onSearchChange,
  onProductClick
}: ProductCatalogueProps): React.JSX.Element {
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return q ? products.filter((p) => p.name.toLowerCase().includes(q) || (p.type || '').toLowerCase().includes(q)) : products
  }, [products, searchQuery])

  // Group products by type
  const grouped = useMemo(() => {
    const map: Record<string, Product[]> = {}
    for (const p of filtered) {
      const key = p.type?.trim() || 'Umum'
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <>
      <div className="panel-header">
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Katalog Produk</h3>
        <div className="search-input-wrapper">
          <input
            id="search-input"
            type="text"
            placeholder="Cari barang atau tipe..."
            className="search-input"
            value={searchQuery}
            onChange={(e): void => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="scroll-container">
        {filtered.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
            Tidak ada produk ditemukan.
          </div>
        ) : (
          grouped.map(([type, items]) => (
            <div key={type} className="product-group">
              <div className="product-group-label">{type}</div>
              <div className="product-grid" id={`product-grid-${type}`}>
                {items.map((product) => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={(): void => onProductClick(product)}
                    id={`product-card-${product.id}`}
                  >
                    <div>
                      <div className="product-name">{product.name}</div>
                    </div>
                    <div className="product-footer">
                      <div className="product-price">Rp{product.price.toLocaleString('id-ID')}</div>
                      <div className={`product-stock ${product.stock <= 0 ? 'out' : ''}`}>
                        {product.stock <= 0 ? 'Habis' : `Stok: ${product.stock}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
