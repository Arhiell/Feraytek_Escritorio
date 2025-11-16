import React, { useEffect, useState } from 'react'
import { pagosService } from '../../services/pagosService'

export default function PagosPage() {
  const [consulta, setConsulta] = useState({ estado:'', monto_min:'', page:1, limit:25 })
  const [adminList, setAdminList] = useState({ page:1, limit:25 })
  const [creacion, setCreacion] = useState({ id_pedido:'', descripcion:'', monto_total:'' })
  const [dataConsulta, setDataConsulta] = useState([])
  const [dataAdmin, setDataAdmin] = useState([])
  const [totalAdmin, setTotalAdmin] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadAdmin = async () => {
    setLoading(true); setError('')
    try {
      const j = await pagosService.adminList({ page: adminList.page, limit: adminList.limit })
      const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
      setDataAdmin(arr)
      setTotalAdmin(Number(j?.total ?? arr.length))
    } catch (e) { setError(e?.message || 'Error al cargar pagos admin') } finally { setLoading(false) }
  }
  const doConsulta = async () => {
    setLoading(true); setError('')
    try {
      const { data, total } = await pagosService.consulta({ estado: consulta.estado, monto_min: consulta.monto_min ? Number(consulta.monto_min) : undefined, page: consulta.page, limit: consulta.limit })
      setDataConsulta(Array.isArray(data) ? data : [])
    } catch (e) { setError(e?.message || 'Error en consulta de pagos') } finally { setLoading(false) }
  }
  useEffect(() => { loadAdmin() }, [adminList.page, adminList.limit])

  const simulateApproval = async () => {
    setLoading(true); setError('')
    try {
      const r = await pagosService.simularAprobacion({ id_pedido: creacion.id_pedido, descripcion: creacion.descripcion || 'Simulación de pago', monto_total: Number(creacion.monto_total || 0) })
      await loadAdmin()
    } catch (e) { setError(e?.message || 'Error al simular aprobación') } finally { setLoading(false) }
  }

  return (
    <div className="productos-module">
      <h1 style={{color:'#FF7A00'}}>Pagos</h1>
      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Crear / Simular</h3>
          <input inputMode="numeric" placeholder="ID pedido" value={creacion.id_pedido} onChange={(e)=> setCreacion(c => ({ ...c, id_pedido: e.target.value.replace(/[^0-9]/g,'') }))} />
          <input placeholder="Descripción" value={creacion.descripcion} onChange={(e)=> setCreacion(c => ({ ...c, descripcion: e.target.value }))} />
          <input inputMode="decimal" placeholder="Monto total" value={creacion.monto_total} onChange={(e)=> setCreacion(c => ({ ...c, monto_total: e.target.value.replace(/[^0-9.]/g,'') }))} />
          <button className="btn" onClick={simulateApproval} style={{background:'#1f2937', color:'#fff'}}>Simular aprobación</button>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Consulta</h3>
          <select value={consulta.estado} onChange={(e)=> setConsulta(c => ({ ...c, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="aprobado">Aprobado</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazado">Rechazado</option>
          </select>
          <input inputMode="decimal" placeholder="Monto mínimo" value={consulta.monto_min} onChange={(e)=> setConsulta(c => ({ ...c, monto_min: e.target.value.replace(/[^0-9.]/g,'') }))} />
          <select value={consulta.limit} onChange={(e)=> setConsulta(c => ({ ...c, limit: Number(e.target.value), page: 1 }))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button className="btn" onClick={doConsulta} style={{background:'#1f2937', color:'#fff'}}>Buscar</button>
        </div>
        <div className="table" style={{marginTop:12}}>
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID Pago</th>
                <th>ID Pedido</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {dataConsulta.length===0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>Sin resultados</td></tr>
              ) : dataConsulta.map(p => (
                <tr key={p.id ?? p.id_pago ?? p.created_at}>
                  <td>{p.id ?? p.id_pago}</td>
                  <td>{p.id_pedido ?? '-'}</td>
                  <td>${Number(p.monto_total ?? p.monto ?? 0).toFixed(2)}</td>
                  <td>{p.estado ?? '-'}</td>
                  <td>{new Date(p.created_at ?? Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Listado Admin</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando pagos...</div> : (
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID Pago</th>
                <th>ID Pedido</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {dataAdmin.length===0 ? (
                <tr><td colSpan="6" style={{textAlign:'center', padding:20}}>No se encontraron pagos</td></tr>
              ) : dataAdmin.map(p => (
                <tr key={p.id ?? p.id_pago ?? p.created_at}>
                  <td>{p.id ?? p.id_pago}</td>
                  <td>{p.id_pedido ?? '-'}</td>
                  <td>{p.descripcion ?? '-'}</td>
                  <td>${Number(p.monto_total ?? p.monto ?? 0).toFixed(2)}</td>
                  <td>{p.estado ?? '-'}</td>
                  <td>{new Date(p.created_at ?? Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{display:'flex', gap:8, alignItems:'center', marginTop:12}}>
          <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: 1 }))} disabled={adminList.page===1} style={{background:'#1f2937', color:'#fff'}}>Inicio</button>
          <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: Math.max(1, a.page-1) }))} disabled={adminList.page===1} style={{background:'#1f2937', color:'#fff'}}>Anterior</button>
          <span style={{color:'#FF7A00'}}>Página {adminList.page}</span>
          <button className="btn" onClick={()=> setAdminList(a => ({ ...a, page: a.page+1 }))} style={{background:'#1f2937', color:'#fff'}}>Siguiente</button>
        </div>
      </div>
    </div>
  )
}