import React from 'react'

// Panel de métricas del módulo Productos
export default function ProductosStatsPanel({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-card"><h3>Activos</h3><div className="stat-number" style={{color:'#FF7A00'}}>{stats.activos}</div></div>
      <div className="stat-card"><h3>Inactivos</h3><div className="stat-number" style={{color:'#FF7A00'}}>{stats.inactivos}</div></div>
      <div className="stat-card"><h3>Stock crítico</h3><div className="stat-number" style={{color:'#FF7A00'}}>{stats.criticos}</div></div>
      <div className="stat-card"><h3>Categorías principales</h3><div>{(stats.categoriasTop||[]).map(c => (<span key={c.id} className="badge" style={{marginRight:6, background:'#1E1E1E', color:'#FF7A00', border:'1px solid #FF7A00'}}>#{c.id} · {c.count}</span>))}</div></div>
    </div>
  )
}