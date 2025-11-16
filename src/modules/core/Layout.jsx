import React from 'react'
import { Link } from 'react-router-dom'

// Layout principal: sidebar y contenido
export default function Layout({ user, logout, children }) {
  return (
    <div className="app-container">
      <nav className="sidebar">
        <h3 style={{color: 'white', marginBottom: 30}}>Feraytek Admin</h3>
        <ul className="nav-menu">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/productos">Productos</Link></li>
          <li><Link to="/facturas">Facturas</Link></li>
          <li><Link to="/pedidos">Pedidos</Link></li>
          <li><Link to="/pagos">Pagos</Link></li>
          <li><Link to="/envios">Envios</Link></li>
          <li><Link to="/informes">Informes</Link></li>
          <li><Link to="/carritos-admin">Carritos Admin</Link></li>
          <li><Link to="/soporte">Soporte</Link></li>
          <li><Link to="/resenas">Reseñas</Link></li>
          {user?.rol === 'superadmin' && <li><Link to="/usuarios">Usuarios</Link></li>}
        </ul>
        <div style={{marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #34495e'}}>
          <p style={{color: '#bdc3c7', fontSize: 14}}>{user?.nombre} {user?.apellido}</p>
          <p style={{color: '#95a5a6', fontSize: 12}}>{user?.rol}</p>
          <button onClick={logout} className="btn" style={{marginTop: 10, background: '#e74c3c', color: 'white'}}>Cerrar Sesión</button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  )
}