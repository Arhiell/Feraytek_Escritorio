// =====================================================================
// Soporte Page (Frontend)
// Panel admin: crear ticket, listar, responder y cerrar
// - UI: tarjetas, filtros y tabla con acciones
// - Validaciones básicas en inputs
// =====================================================================

import React, { useEffect, useState } from 'react'
import { soporteService } from '../../services/soporteService'

export default function SoportePage() {
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState({ asunto:'', descripcion:'', prioridad:'media' })
  const [list, setList] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadStats = async () => { try { const j = await soporteService.estadisticas(); setStats(j) } catch (e) { setError(e.message) } }
  const loadList = async () => { setLoading(true); setError(''); try { const arr = await soporteService.misTickets(); setList(arr) } catch (e) { setError(e.message) } finally { setLoading(false) } }

  useEffect(() => { loadStats(); loadList() }, [])

  // Enviar creación de ticket (valida campos vacíos)
  const crear = async () => {
    if (!form.asunto.trim() || !form.descripcion.trim()) { setError('Completa asunto y descripción'); return }
    try { setError(''); await soporteService.crear(form); setForm({ asunto:'', descripcion:'', prioridad:'media' }); await loadList() } catch (e) { setError(e.message) }
  }

  // Acciones: responder, prioridad, cerrar
  const responder = async (id) => { const r = prompt('Respuesta'); if (!r || !r.trim()) return; try { await soporteService.responder(id, { respuesta: r.trim() }); await loadList() } catch (e) { setError(e.message) } }
  const cambiarPrioridad = async (id) => { const p = prompt('Prioridad (baja, media, alta, urgente)', 'alta'); if (!p) return; try { await soporteService.prioridad(id, p.trim()) } catch (e) { setError(e.message) } }
  const cerrar = async (id) => { const m = prompt('Motivo de cierre'); if (!m || !m.trim()) return; try { await soporteService.cerrar(id, { motivo: m.trim(), estado: 'cerrado' }); await loadList() } catch (e) { setError(e.message) } }

  return (
    <div className="productos-module">
      <h1 style={{color:'#FF7A00'}}>Soporte</h1>

      <div className="card" style={{marginTop:12}}>
        <h3>Estadísticas</h3>
        {stats ? (
          <div style={{display:'flex', gap:18, flexWrap:'wrap', marginTop:8}}>
            <div className="stat-box"><b>Total:</b> {stats.total ?? '-'}</div>
            <div className="stat-box"><b>Abiertos:</b> {stats.abiertos ?? '-'}</div>
            <div className="stat-box"><b>Cerrados:</b> {stats.cerrados ?? '-'}</div>
          </div>
        ) : <div>Cargando estadísticas...</div>}
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Crear ticket</h3>
          <input placeholder="Asunto" value={form.asunto} onChange={(e)=> setForm(f => ({ ...f, asunto: e.target.value }))} />
          <input placeholder="Descripción" value={form.descripcion} onChange={(e)=> setForm(f => ({ ...f, descripcion: e.target.value }))} />
          <select value={form.prioridad} onChange={(e)=> setForm(f => ({ ...f, prioridad: e.target.value }))}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
          <button className="btn" onClick={crear} style={{background:'#1f2937', color:'#fff'}}>Crear</button>
        </div>
      </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Mis tickets</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID</th><th>Asunto</th><th>Prioridad</th><th>Estado</th><th>Creado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.length===0 ? (
                <tr><td colSpan="6" style={{textAlign:'center', padding:20}}>Sin tickets</td></tr>
              ) : list.map(t => (
                <tr key={t.id ?? t.id_soporte}>
                  <td>{t.id ?? t.id_soporte}</td>
                  <td>{t.asunto ?? '-'}</td>
                  <td>{t.prioridad ?? '-'}</td>
                  <td>{t.estado ?? '-'}</td>
                  <td>{new Date(t.created_at ?? Date.now()).toLocaleString()}</td>
                  <td>
                    <button className="btn" onClick={()=> responder(t.id ?? t.id_soporte)} style={{background:'#374151', color:'#fff', marginRight:6}}>Responder</button>
                    <button className="btn" onClick={()=> cambiarPrioridad(t.id ?? t.id_soporte)} style={{background:'#f59e0b', color:'#fff', marginRight:6}}>Prioridad</button>
                    <button className="btn" onClick={()=> cerrar(t.id ?? t.id_soporte)} style={{background:'#10b981', color:'#fff'}}>Cerrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}