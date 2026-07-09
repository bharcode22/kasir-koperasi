import React from 'react'

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
  return (
    <>
      <div className="panel-header">
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Katalog Produk</h3>
        <div className="search-input-wrapper">
          <input
            id="search-input"
            type="text"
            placeholder="Cari barang..."
            className="search-input"
            value={searchQuery}
            onChange={(e): void => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="scroll-container">
        <div className="product-grid" id="product-grid">
          {products.length === 0 ? (
            <div
              style={{ color: '#6b7280', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}
            >
              Tidak ada produk ditemukan.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={(): void => onProductClick(product)}
                id={`product-card-${product.id}`}
              >
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      color: '#818cf8',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      marginBottom: '2px'
                    }}
                  >
                    {product.type || 'Umum'}
                  </div>
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
      </div>
    </>
  )
}
