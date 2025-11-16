import React, { useEffect, useState } from 'react'
import { facturasService } from '../../services/facturasService'

export default function FacturasPage() {
  const [stats, setStats] = useState(null)
  const [adminList, setAdminList] = useState({ page:1, limit:25 })
  const [dataAdmin, setDataAdmin] = useState([])
  const [totalAdmin, setTotalAdmin] = useState(0)
  const [busqueda, setBusqueda] = useState({ numero:'', usuario:'', id_usuario:'', fecha_desde:'', fecha_hasta:'', email_enviado:'' })
  const [resultados, setResultados] = useState([])
  const [selectedFactura, setSelectedFactura] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadStats = async () => {
    setError('')
    try { const j = await facturasService.estadisticas(); setStats(j) } catch (e) { setError(e?.message || 'Error al cargar estadísticas') }
  }
  const loadAdmin = async () => {
    setLoading(true); setError('')
    try {
      const j = await facturasService.listarTodas({ page: adminList.page, limit: adminList.limit })
      const arr = Array.isArray(j?.data) ? j.data : []
      setDataAdmin(arr)
      setTotalAdmin(Number(j?.total ?? arr.length))
    } catch (e) { setError(e?.message || 'Error al cargar facturas') } finally { setLoading(false) }
  }
  const doBuscar = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await facturasService.buscar({
        numero: busqueda.numero || undefined,
        usuario: busqueda.usuario || undefined,
        id_usuario: busqueda.id_usuario ? Number(busqueda.id_usuario) : undefined,
        fecha_desde: busqueda.fecha_desde || undefined,
        fecha_hasta: busqueda.fecha_hasta || undefined,
        email_enviado: busqueda.email_enviado === '' ? undefined : (busqueda.email_enviado === 'true')
      })
      setResultados(Array.isArray(data) ? data : [])
    } catch (e) { setError(e?.message || 'Error en búsqueda') } finally { setLoading(false) }
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { loadAdmin() }, [adminList.page, adminList.limit])

  const verDetalle = async (id) => {
    setLoading(true); setError('')
    try { const j = await facturasService.obtenerPorId(id); setSelectedFactura(j?.data ?? j) } catch (e) { setError(e?.message || 'No se pudo obtener detalle') } finally { setLoading(false) }
  }
  const marcarEnviada = async (id) => {
    setLoading(true); setError('')
    try { await facturasService.marcarEnviada(id); await loadAdmin() } catch (e) { setError(e?.message || 'Error al marcar enviada') } finally { setLoading(false) }
  }
  const enviarEmail = async (id) => {
    setLoading(true); setError('')
    try { await facturasService.enviarEmail(id) } catch (e) { setError(e?.message || 'Error al enviar email') } finally { setLoading(false) }
  }
  const generarPDF = async (id) => {
    setLoading(true); setError('')
    try { const j = await facturasService.generarPDF(id); if (j?.pdf_url) window.open(j.pdf_url, '_blank') } catch (e) { setError(e?.message || 'Error al generar PDF') } finally { setLoading(false) }
  }

  return (
    <div className="productos-module">
      <h1 style={{color:'#FF7A00'}}>Facturas</h1>

      <div className="card" style={{marginTop:12}}>
        <h3>Estadísticas</h3>
        {stats ? (
          <div style={{display:'flex', gap:18, flexWrap:'wrap', marginTop:8}}>
            <div className="stat-box"><b>Total facturas:</b> {stats.total_facturas ?? stats.total ?? '-'}</div>
            <div className="stat-box"><b>Monto facturado:</b> ${Number(stats.total_facturado ?? stats.monto_total ?? 0).toFixed(2)}</div>
            <div className="stat-box"><b>Enviadas:</b> {stats.facturas_enviadas ?? '-'}</div>
            <div className="stat-box"><b>Pendientes:</b> {stats.facturas_pendientes ?? '-'}</div>
          </div>
        ) : <div>Cargando estadísticas...</div>}
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <h3>Búsqueda avanzada</h3>
          <input placeholder="Número de factura" value={busqueda.numero} onChange={(e)=> setBusqueda(b => ({ ...b, numero: e.target.value }))} />
          <input placeholder="Usuario (nombre/email)" value={busqueda.usuario} onChange={(e)=> setBusqueda(b => ({ ...b, usuario: e.target.value }))} />
          <input inputMode="numeric" placeholder="ID usuario" value={busqueda.id_usuario} onChange={(e)=> setBusqueda(b => ({ ...b, id_usuario: e.target.value.replace(/[^0-9]/g,'') }))} />
          <input type="date" placeholder="Desde" value={busqueda.fecha_desde} onChange={(e)=> setBusqueda(b => ({ ...b, fecha_desde: e.target.value }))} />
          <input type="date" placeholder="Hasta" value={busqueda.fecha_hasta} onChange={(e)=> setBusqueda(b => ({ ...b, fecha_hasta: e.target.value }))} />
          <select value={busqueda.email_enviado} onChange={(e)=> setBusqueda(b => ({ ...b, email_enviado: e.target.value }))}>
            <option value="">Todos</option>
            <option value="true">Enviadas</option>
            <option value="false">Pendientes</option>
          </select>
          <button className="btn" onClick={doBuscar} style={{background:'#1f2937', color:'#fff'}}>Buscar</button>
        </div>
        <div className="table" style={{marginTop:12}}>
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Número</th>
                <th>ID Pedido</th>
                <th>Usuario</th>
                <th>Total</th>
                <th>Enviada</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {resultados.length===0 ? (
                <tr><td colSpan="7" style={{textAlign:'center', padding:20}}>Sin resultados</td></tr>
              ) : resultados.map(f => (
                <tr key={f.id_factura ?? f.id ?? f.numero_factura}>
                  <td>{f.id_factura ?? f.id}</td>
                  <td>{f.numero_factura ?? '-'}</td>
                  <td>{f.id_pedido ?? '-'}</td>
                  <td>{f.nombre_usuario ?? f.usuario ?? '-'}</td>
                  <td>${Number(f.total ?? 0).toFixed(2)}</td>
                  <td>{(f.enviado_email ? 'Sí' : 'No')}</td>
                  <td>{new Date(f.fecha_emision ?? Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table" style={{marginTop:12}}>
        <h3>Listado Admin</h3>
        {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
        {loading ? <div>Cargando facturas...</div> : (
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Número</th>
                <th>Usuario</th>
                <th>Total</th>
                <th>Acciones</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {dataAdmin.length===0 ? (
                <tr><td colSpan="6" style={{textAlign:'center', padding:20}}>No se encontraron facturas</td></tr>
              ) : dataAdmin.map(f => (
                <tr key={f.id_factura ?? f.id ?? f.numero_factura}>
                  <td>{f.id_factura ?? f.id}</td>
                  <td>{f.numero_factura ?? '-'}</td>
                  <td>{f.nombre_usuario ?? '-'}</td>
                  <td>${Number(f.total ?? 0).toFixed(2)}</td>
                  <td>
                    <button className="btn" onClick={()=> verDetalle(f.id_factura ?? f.id)} style={{background:'#1f2937', color:'#fff', marginRight:6}}>Ver</button>
                    <button className="btn" onClick={()=> generarPDF(f.id_factura ?? f.id)} style={{background:'#374151', color:'#fff', marginRight:6}}>Generar PDF</button>
                    <button className="btn" onClick={()=> marcarEnviada(f.id_factura ?? f.id)} style={{background:'#10b981', color:'#fff', marginRight:6}}>Marcar enviada</button>
                    <button className="btn" onClick={()=> enviarEmail(f.id_factura ?? f.id)} style={{background:'#f59e0b', color:'#fff'}}>Reenviar email</button>
                  </td>
                  <td>{new Date(f.fecha_emision ?? Date.now()).toLocaleString()}</td>
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

      {selectedFactura && (
        <div className="card" style={{marginTop:12}}>
          <h3>Detalle de factura</h3>
          <pre style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:8, overflow:'auto'}}>{JSON.stringify(selectedFactura, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}