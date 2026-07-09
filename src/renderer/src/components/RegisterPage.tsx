import React, { useState } from 'react'

interface RegisterPageProps {
  onRegister: (user: { id: number; username: string; name: string }) => void
  onGoLogin: () => void
}

export default function RegisterPage({
  onRegister,
  onGoLogin
}: RegisterPageProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('Semua field harus diisi')
      return
    }
    if (password !== confirm) {
      setError('Password dan konfirmasi password tidak sama')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await window.api.register({ username, name, password })
      onRegister(user)
    } catch (err: any) {
      setError(err?.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🛒</span>
          <h1 className="auth-title">Kasir Koperasi</h1>
          <p className="auth-subtitle">Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="reg-name" className="auth-label">Nama Lengkap</label>
            <input
              id="reg-name"
              type="text"
              className="auth-input"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e): void => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-username" className="auth-label">Username</label>
            <input
              id="reg-username"
              type="text"
              className="auth-input"
              placeholder="Buat username"
              value={username}
              onChange={(e): void => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">Password</label>
            <input
              id="reg-password"
              type="password"
              className="auth-input"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e): void => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm" className="auth-label">Konfirmasi Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="auth-input"
              placeholder="Ulangi password"
              value={confirm}
              onChange={(e): void => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="auth-switch">
          Sudah punya akun?{' '}
          <button className="auth-link-btn" onClick={onGoLogin}>
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  )
}
