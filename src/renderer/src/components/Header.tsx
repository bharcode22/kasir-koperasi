import React from 'react'

interface HeaderProps {
  currentUser: { id: number; username: string; name: string } | null
  onLogout: () => void
  onBackupDatabase: () => void
  onRestoreDatabase: () => void
}

export default function Header({
  currentUser,
  onLogout,
  onBackupDatabase,
  onRestoreDatabase
}: HeaderProps): React.JSX.Element {
  return (
    <header className="pos-header">
      <div className="pos-title-area">
        <div className="pos-logo">🛒</div>
        <span className="pos-title">Kasir Koperasi</span>
      </div>
      <div className="header-right">
        <button
          className="header-backup-btn"
          onClick={onBackupDatabase}
          title="Simpan cadangan database (.db)"
        >
          💾 Backup Data
        </button>
        <button
          className="header-restore-btn"
          onClick={onRestoreDatabase}
          title="Pulihkan database dari file cadangan (.db)"
        >
          📥 Restore Data
        </button>
        <div className="pos-status">
          <div className="status-dot"></div>
          <span>SQLite Connected</span>
        </div>
        {currentUser && (
          <div className="header-user-area">
            <div className="header-user-info">
              <span className="header-user-name">{currentUser.name}</span>
              <span className="header-user-username">@{currentUser.username}</span>
            </div>
            <button id="btn-logout" className="header-logout-btn" onClick={onLogout} title="Keluar">
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
