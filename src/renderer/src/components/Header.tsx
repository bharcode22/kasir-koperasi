import React from 'react'

export default function Header(): React.JSX.Element {
  return (
    <header className="pos-header">
      <div className="pos-title-area">
        <div className="pos-logo">A</div>
        <span className="pos-title">Kasir</span>
      </div>
      <div className="pos-status">
        <div className="status-dot"></div>
        <span>SQLite Database connected</span>
      </div>
    </header>
  )
}
