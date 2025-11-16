// =====================================================================
// Reseñas Page (Frontend)
// Panel admin: crear y listar reseñas de productos
// - UI: formulario de alta y tabla con reseñas
// =====================================================================

import React, { useEffect, useState } from 'react'
import { resenasService } from '../../services/resenasService'

export default function ReseñasPage() {
  const [form, setForm] = useState({ id_producto:'', calificacion:'5', comentario:'' })
  const [list, setList] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => { setLoading(true); setError(''); try { const arr = await resenasService.listar(); setList(arr) } catch (e) { setError(e.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  // Crear reseña con validaciones de UI
  const crear = async () => {
    const idp = Number(form.id_producto); const cal = Number(form.calificacion); const com = form.comentario.trim()
    if (!Number.isFinite(idp) || idp<=0) { setError('ID de producto inválido'); return }
    if (!Number.isFinite(cal) || cal<1 || cal>5) { setError('Calificación debe ser 1..5'); return }
    if (!com) { setError('Comentario requerido'); return }
    try { setError(''); await resenasService.crear({ id_producto:idp, calificacion:cal, comentario:com }); setForm({ id_producto:'', calificacion:'5', comentario:'' }); await load() } catch (e) { setError(e.message) }
  }

  return (
    <div className="productos-module">
      <h1 style={{color:'#FF7A00'}}>Reseñas</h1>

      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Crear reseña</h3>
          <input inputMode="numeric" placeholder="ID producto" value={form.id_producto} onChange={(e)=> setForm(f => ({ ...f, id_producto: e.target.value.replace(/[^0-9]/g,'') }))} />
          <select value={form.calificacion} onChange={(e)=> setForm(f => ({ ...f, calificacion: e.target.value }))}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input placeholder="Comentario" value={form.comentario} onChange={(e)=> setForm(f => ({ ...f, comentario: e.target.value }))} />
          <button className="btn" onClick={crear} style={{background:'#1f2937', color:'#fff'}}>Crear</button>
        </div>
      </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Listado</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando...</div> : (
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID</th><th>Producto</th><th>Calificación</th><th>Comentario</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {list.length===0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>Sin reseñas</td></tr>
              ) : list.map(r => (
                <tr key={r.id ?? r.id_resena}>
                  <td>{r.id ?? r.id_resena}</td>
                  <td>{r.id_producto ?? '-'}</td>
                  <td>{r.calificacion ?? '-'}</td>
                  <td>{r.comentario ?? '-'}</td>
                  <td>{new Date(r.created_at ?? Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}