import React, { useState } from 'react'

interface LoginPageProps {
  onLogin: (user: { id: number; username: string; name: string }) => void
  onGoRegister: () => void
}

export default function LoginPage({ onLogin, onGoRegister }: LoginPageProps): React.JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await window.api.login({ username, password })
      onLogin(user)
    } catch (err: any) {
      setError(err?.message || 'Login gagal')
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
          <p className="auth-subtitle">Masuk ke sistem kasir</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="login-username" className="auth-label">Username</label>
            <input
              id="login-username"
              type="text"
              className="auth-input"
              placeholder="Masukkan username"
              value={username}
              onChange={(e): void => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              placeholder="Masukkan password"
              value={password}
              onChange={(e): void => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="auth-switch">
          Belum punya akun?{' '}
          <button className="auth-link-btn" onClick={onGoRegister}>
            Daftar sekarang
          </button>
        </p>
      </div>
    </div>
  )
}
