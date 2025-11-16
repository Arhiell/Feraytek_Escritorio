import React, { useState } from 'react'

// Pantalla de Login
export default function Login({ onLogin }) {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json().catch(async () => ({ message: await res.text() }))
      if (!res.ok) { setError(data?.message || 'Error de autenticación'); return }
      if (data.user && (data.user.rol === 'admin' || data.user.rol === 'superadmin')) onLogin(data.user, data.token)
      else setError('Usuario no autenticado o sin permisos')
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>
        {error && <div className="error-box" style={{marginBottom:10}}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
          <div className="form-group"><label>Contraseña</label><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Iniciando...':'Iniciar Sesión'}</button>
        </form>
        <div className="login-hint">Demo: admin@feraytek.com / cualquier contraseña</div>
      </div>
    </div>
  )
}