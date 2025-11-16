// =====================================================================
// Carritos Admin Page
// Panel admin: ver todos, ver carrito de usuario y estadísticas (solo lectura)
// =====================================================================

import React, { useEffect, useState } from 'react'
import { carritoService } from '../../services/carritoService'

export default function CarritosAdminPage() {
  const [stats, setStats] = useState(null)
  const [todos, setTodos] = useState([])
  const [usuarioId, setUsuarioId] = useState('')
  const [usuarioCart, setUsuarioCart] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadStats = async () => { try { const j = await carritoService.estadisticas(); setStats(j) } catch (e) { setError(e.message) } }
  const loadTodos = async () => { setLoading(true); setError(''); try { const arr = await carritoService.todos(); setTodos(Array.isArray(arr?.data)?arr.data:(Array.isArray(arr)?arr:[])) } catch (e) { setError(e.message) } finally { setLoading(false) } }
  useEffect(() => { loadStats(); loadTodos() }, [])

  const verUsuario = async () => { const id = Number(usuarioId); if (!Number.isFinite(id)||id<=0) { setError('ID usuario inválido'); return } try { setError(''); const j = await carritoService.usuario(id); const arr = Array.isArray(j?.items)? j.items : (Array.isArray(j)? j : []); setUsuarioCart(arr) } catch (e) { setError(e.message) } }
  // Modo solo lectura: no se realizan acciones de limpieza o mutación

  return (
    <div className="productos-module">
      <h1 style={{color:'#FF7A00'}}>Carritos (Admin)</h1>

      <div className="card" style={{marginTop:12}}>
        <h3>Estadísticas</h3>
        {stats ? (
          <div style={{display:'flex', gap:18, flexWrap:'wrap', marginTop:8}}>
            <div className="stat-box"><b>Total:</b> {stats.total_carritos ?? '-'}</div>
            <div className="stat-box"><b>Activos:</b> {stats.activos ?? '-'}</div>
            <div className="stat-box"><b>Completados:</b> {stats.completados ?? '-'}</div>
            <div className="stat-box"><b>Abandonados:</b> {stats.abandonados ?? '-'}</div>
            <div className="stat-box"><b>Valor total:</b> ${Number(stats.valor_total ?? 0).toFixed(2)}</div>
          </div>
        ) : <div>Cargando estadísticas...</div>}
      </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Todos los carritos</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <table style={{width:'100%'}}>
            <thead><tr><th>ID Usuario</th><th>Items</th><th>Actualizado</th></tr></thead>
            <tbody>
              {todos.length===0 ? (
                <tr><td colSpan="3" style={{textAlign:'center', padding:20}}>No hay carritos</td></tr>
              ) : todos.map(c => (
                <tr key={c.id_usuario ?? c.user_id}><td>{c.id_usuario ?? c.user_id}</td><td>{c.cantidad_items ?? c.items_count ?? '-'}</td><td>{new Date(c.updated_at ?? Date.now()).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Ver carrito por usuario</h3>
          <input inputMode="numeric" placeholder="ID usuario" value={usuarioId} onChange={(e)=> setUsuarioId(e.target.value.replace(/[^0-9]/g,''))} />
          <button className="btn" onClick={verUsuario} style={{background:'#1f2937', color:'#fff'}}>Buscar</button>
        </div>
        <div className="table" style={{marginTop:12}}>
          <table style={{width:'100%'}}>
            <thead><tr><th>Producto</th><th>Variante</th><th>Cantidad</th><th>Precio</th></tr></thead>
            <tbody>
              {usuarioCart.length===0 ? (
                <tr><td colSpan="4" style={{textAlign:'center', padding:20}}>Sin items</td></tr>
              ) : usuarioCart.map(it => (
                <tr key={(it.id_producto||it.producto_id)+'-'+(it.id_variante||it.variante_id)}><td>{it.id_producto ?? it.producto_id}</td><td>{it.id_variante ?? it.variante_id}</td><td>{it.cantidad ?? 1}</td><td>${Number(it.precio_unitario ?? 0).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Se eliminó la sección de abandonados/limpieza para mantener solo lectura */}
    </div>
  )
}