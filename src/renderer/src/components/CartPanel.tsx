import React from 'react'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

interface CartItem {
  product: Product
  quantity: number
}

interface CartPanelProps {
  cart: CartItem[]
  onUpdateQty: (productId: number, delta: number) => void
  onRemoveFromCart: (productId: number) => void
  onCheckout: () => void
}

export default function CartPanel({
  cart,
  onUpdateQty,
  onRemoveFromCart,
  onCheckout
}: CartPanelProps): React.JSX.Element {
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <section className="cart-panel">
      <div className="cart-title">Keranjang Belanja</div>

      <div className="cart-items" id="cart-items-container">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <span style={{ fontSize: '32px' }}>🛒</span>
            <span>Keranjang masih kosong</span>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="cart-item" id={`cart-item-${item.product.id}`}>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.product.name}</div>
                <div className="cart-item-price">Rp{item.product.price.toLocaleString('id-ID')}</div>
              </div>

              <div className="cart-item-qty-control">
                <button
                  className="qty-btn"
                  onClick={(): void => onUpdateQty(item.product.id, -1)}
                  id={`btn-qty-minus-${item.product.id}`}
                >
                  -
                </button>
                <span className="qty-val">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={(): void => onUpdateQty(item.product.id, 1)}
                  id={`btn-qty-plus-${item.product.id}`}
                >
                  +
                </button>
              </div>

              <div className="cart-item-total">
                Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}
              </div>

              <button
                className="cart-item-remove"
                onClick={(): void => onRemoveFromCart(item.product.id)}
                title="Hapus"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary */}
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="summary-row">
          <span>Pajak (0%)</span>
          <span>Rp0</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
        </div>
        <button
          id="btn-pay"
          className="pay-btn"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          Proses Pembayaran (Bayar)
        </button>
      </div>
    </section>
  )
}
