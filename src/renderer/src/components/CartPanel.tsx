import React, { useState, useEffect } from 'react'

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
  onCheckout: (buyerName: string, cashReceived: number, change: number) => void
}

export default function CartPanel({
  cart,
  onUpdateQty,
  onRemoveFromCart,
  onCheckout
}: CartPanelProps): React.JSX.Element {
  const [buyer, setBuyer] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  useEffect(() => {
    if (cart.length === 0) {
      setCashReceived('')
      setBuyer('')
    }
  }, [cart.length])

  const cashReceivedVal = parseInt(cashReceived.replace(/\D/g, ''), 10) || 0
  const changeVal = cashReceivedVal - cartTotal

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const rawVal = e.target.value.replace(/\D/g, '')
    if (rawVal === '') {
      setCashReceived('')
      return
    }
    const num = parseInt(rawVal, 10)
    setCashReceived(num.toLocaleString('id-ID'))
  }

  const selectQuickCash = (amount: number): void => {
    setCashReceived(amount.toLocaleString('id-ID'))
  }

  const getQuickCashOptions = (total: number): number[] => {
    if (total <= 0) return []
    const standardBills = [2000, 5000, 10000, 20000, 50000, 100000]
    const options = new Set<number>()

    // Always include exact change
    options.add(total)

    // Add bills larger than total
    for (const bill of standardBills) {
      if (bill > total) {
        options.add(bill)
      }
    }

    return Array.from(options)
      .sort((a, b) => a - b)
      .slice(0, 4)
  }

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
                <div className="cart-item-price">
                  Rp{item.product.price.toLocaleString('id-ID')}
                </div>
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

      {/* Buyer input area */}
      {cart.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="buyer-input-wrapper">
            <label htmlFor="buyer-name-input" className="buyer-input-label">
              Nama Pembeli
            </label>
            <input
              id="buyer-name-input"
              type="text"
              className="buyer-input"
              placeholder="Masukkan nama pembeli..."
              value={buyer}
              onChange={(e): void => setBuyer(e.target.value)}
            />
          </div>

          <div className="buyer-input-wrapper" style={{ borderTop: 'none', paddingTop: 0 }}>
            <label htmlFor="cash-received-input" className="buyer-input-label">
              Uang Diterima <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="cash-received-input"
              type="text"
              className="buyer-input"
              placeholder="Rp0"
              required
              value={cashReceived}
              onChange={handleCashChange}
            />
            {cartTotal > 0 && (
              <div className="quick-cash-container">
                {getQuickCashOptions(cartTotal).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="quick-cash-btn"
                    onClick={(): void => selectQuickCash(amount)}
                  >
                    {amount === cartTotal ? 'Uang Pas' : `Rp${amount.toLocaleString('id-ID')}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

        {cashReceivedVal > 0 && (
          <>
            <div className="summary-row" style={{ marginTop: '8px' }}>
              <span>Uang Diterima</span>
              <span>Rp{cashReceivedVal.toLocaleString('id-ID')}</span>
            </div>
            <div
              className="summary-row total"
              style={{ fontSize: '15px', borderTop: 'none', paddingTop: 0, marginTop: 0 }}
            >
              <span>Kembalian</span>
              <span
                className={changeVal >= 0 ? 'change-display-positive' : 'change-display-negative'}
              >
                {changeVal >= 0
                  ? `Rp${changeVal.toLocaleString('id-ID')}`
                  : `Kurang Rp${Math.abs(changeVal).toLocaleString('id-ID')}`}
              </span>
            </div>
          </>
        )}

        <button
          id="btn-pay"
          className="pay-btn"
          disabled={cart.length === 0 || !cashReceived || changeVal < 0}
          onClick={(): void => onCheckout(buyer.trim(), cashReceivedVal, changeVal)}
        >
          Proses Pembayaran (Bayar)
        </button>
      </div>
    </section>
  )
}
