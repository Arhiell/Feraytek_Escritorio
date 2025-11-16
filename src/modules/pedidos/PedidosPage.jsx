import React, { useState, useEffect } from 'react'
import { pedidosService } from '../../services/pedidosService'
import PedidoDetailPanel from './PedidoDetailPanel'
import { Eye } from 'lucide-react'

export default function PedidosPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ estado:'', metodo_pago:'', fecha_desde:'', fecha_hasta:'', id:'', id_usuario:'' })
  const [detail, setDetail] = useState(null)
  const [mineOnly, setMineOnly] = useState(false)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const j = mineOnly ? await pedidosService.listarUsuario({ page, per_page: perPage }) : await pedidosService.listar({ page, per_page: perPage, ...filters })
      const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
      setItems(arr)
      setTotal(Number(j?.total ?? arr.length))
    } catch (e) { setError(e?.message || 'Error al cargar pedidos') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [page, perPage, filters.estado, filters.metodo_pago, filters.fecha_desde, filters.fecha_hasta, mineOnly])

  const pages = Math.max(1, Math.ceil(total / perPage))
  const changePage = (p) => setPage(Math.min(pages, Math.max(1, p)))
  const handlePositiveId = (val) => { const clean = val.replace(/[^0-9]/g, ''); setFilters(f => ({ ...f, id: clean })) }

  return (
    <div className="productos-module">
      <h1 style={{color:'#FF7A00'}}>Pedidos</h1>
      <div className="card" style={{marginTop:12}}>
        <div className="productos-filters" style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={mineOnly} onChange={(e)=> {
              const checked = e.target.checked
              setMineOnly(checked)
              if (checked) {
                const u = sessionStorage.getItem('user')
                let uid = ''
                try { uid = String(JSON.parse(u)?.id ?? JSON.parse(u)?.id_usuario ?? '') } catch {}
                setFilters(f => ({ ...f, id_usuario: uid, id: '' }))
              } else {
                setFilters(f => ({ ...f, id_usuario: '' }))
              }
              setPage(1)
            }} />
            Mis pedidos
          </label>
          <select value={filters.estado} onChange={(e)=> setFilters(f => ({ ...f, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="procesando">Procesando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select value={filters.metodo_pago} onChange={(e)=> setFilters(f => ({ ...f, metodo_pago: e.target.value }))}>
            <option value="">Todos los métodos</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="simulado">Simulado</option>
          </select>
          <input type="date" value={filters.fecha_desde} onChange={(e)=> setFilters(f => ({ ...f, fecha_desde: e.target.value }))} />
          <input type="date" value={filters.fecha_hasta} onChange={(e)=> setFilters(f => ({ ...f, fecha_hasta: e.target.value }))} />
          <input inputMode="numeric" placeholder="ID pedido" value={filters.id} onChange={(e)=> handlePositiveId(e.target.value)} style={{width:120}} disabled={mineOnly} />
          <input inputMode="numeric" placeholder="ID usuario" value={filters.id_usuario} onChange={(e)=> setFilters(f => ({ ...f, id_usuario: e.target.value.replace(/[^0-9]/g,'') }))} style={{width:120}} disabled={mineOnly} />
          <select value={perPage} onChange={(e)=> { setPerPage(Number(e.target.value)); setPage(1) }}>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={30}>30</option>
          </select>
          <button className="btn" onClick={()=> { setPage(1); load() }} style={{background:'#1f2937', color:'#fff'}}>Aplicar</button>
        </div>
      </div>

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading ? <div>Cargando pedidos...</div> : (
        <div className="table" style={{marginTop:12}}>
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th># Pedido</th>
                <th>Cliente</th>
                <th>Creado</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Método</th>
                <th>Ítems</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 ? (
                <tr><td colSpan="8" style={{textAlign:'center', padding:20}}>No se encontraron pedidos con los filtros seleccionados</td></tr>
              ) : items.map(p => {
                const id = p.id ?? p.id_pedido
                const cliente = p.cliente?.nombre || p.cliente_nombre || `${p.cliente?.nombre || ''} ${p.cliente?.apellido || ''}`.trim() || '-'
                const creado = new Date(p.created_at ?? p.fecha_creacion ?? p.fecha_pedido ?? Date.now()).toLocaleString()
                const estado = p.estado ?? '-'
                const total = Number(p.total_final ?? p.total ?? 0).toFixed(2)
                const metodo = p.metodo_pago ?? p.payment_method ?? '-'
                const count = Array.isArray(p.items) ? p.items.length : (Number(p.cantidad_items ?? p.items_count ?? 0))
                return (
                  <tr key={id ?? creado}>
                    <td>{id}</td>
                    <td>{cliente}</td>
                    <td>{creado}</td>
                    <td><span className={`badge ${estado==='cancelado'?'badge-danger':'badge-success'}`}>{estado}</span></td>
                    <td>${total}</td>
                    <td>{metodo}</td>
                    <td>{count}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-view" onClick={async()=>{
                          try { const d = await pedidosService.obtener(id); setDetail(d) } catch {}
                        }}><Eye size={14}/> Ver detalle</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{display:'flex', gap:8, alignItems:'center', marginTop:12}}>
        <button className="btn" onClick={()=> changePage(1)} disabled={page===1} style={{background:'#1f2937', color:'#fff'}}>Inicio</button>
        <button className="btn" onClick={()=> changePage(page-1)} disabled={page===1} style={{background:'#1f2937', color:'#fff'}}>Anterior</button>
        <span style={{color:'#FF7A00'}}>Página {page} de {pages}</span>
        <button className="btn" onClick={()=> changePage(page+1)} disabled={page>=pages} style={{background:'#1f2937', color:'#fff'}}>Siguiente</button>
        <button className="btn" onClick={()=> changePage(pages)} disabled={page>=pages} style={{background:'#1f2937', color:'#fff'}}>Final</button>
      </div>

      {detail && (
        <PedidoDetailPanel pedido={detail} onClose={()=> setDetail(null)} onChanged={async()=>{ await load(); }} />
      )}
    </div>
  )
}