import React, { useEffect, useMemo, useRef, useState } from 'react'
import { informeService } from '../../services/informeService'

function BarChart({ data, labelKey = 'label', valueKey = 'value', height = 160 }) {
  const max = Math.max(1, ...data.map(d => Number(d[valueKey] || 0)))
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:8, height}}>
      {data.map((d, i) => (
        <div key={i} style={{width:24, background:'#1f2937', border:'1px solid #374151'}}>
          <div style={{height: `${(Number(d[valueKey])/max)*100}%`, background:'#FF7A00'}} />
          <div style={{fontSize:10, textAlign:'center', color:'#9ca3af'}}>{String(d[labelKey]).slice(0,4)}</div>
        </div>
      ))}
    </div>
  )
}

function LineChart({ points, height = 160 }) {
  const max = Math.max(1, ...points.map(p => Number(p.value || 0)))
  const step = points.length ? 300 / (points.length - 1 || 1) : 0
  const path = points.map((p, i) => {
    const x = i * step
    const y = height - (Number(p.value)/max) * height
    return `${i===0?'M':'L'}${x},${y}`
  }).join(' ')
  return (
    <svg width={320} height={height} style={{background:'#0f172a', border:'1px solid #1f2937'}}>
      <path d={path} stroke="#FF7A00" fill="none" strokeWidth={2} />
    </svg>
  )
}

function PieChart({ items, valueKey = 'value', size = 160 }) {
  const total = items.reduce((a,b)=> a + Number(b[valueKey] || 0), 0) || 1
  let start = 0
  const colors = ['#FF7A00','#0ea5e9','#22c55e','#ef4444','#a78bfa','#f59e0b']
  const slices = items.map((it, idx) => {
    const val = Number(it[valueKey] || 0)
    const angle = (val/total) * 2 * Math.PI
    const x1 = 80 + Math.cos(start) * 80, y1 = 80 + Math.sin(start) * 80
    const x2 = 80 + Math.cos(start + angle) * 80, y2 = 80 + Math.sin(start + angle) * 80
    const large = angle > Math.PI ? 1 : 0
    const d = `M80,80 L${x1},${y1} A80,80 0 ${large} 1 ${x2},${y2} Z`
    start += angle
    return <path key={idx} d={d} fill={colors[idx % colors.length]} />
  })
  return <svg width={size} height={size} style={{background:'#0f172a', border:'1px solid #1f2937'}}>{slices}</svg>
}

export default function InformesPage() {
  const [tab, setTab] = useState('ventas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ventas, setVentas] = useState({ ingresosDia: [], totalVentas: 0, montoTotal: 0, porMetodo: {} })
  const [envios, setEnvios] = useState({ estados: {}, promedioDias: 0, en_curso: 0, entregados: 0, demorados: 0 })
  const [usuarios, setUsuarios] = useState({ roles: {}, activos: 0, inactivos: 0, nuevosMes: 0, carritosAbandonados: 0 })
  const [productos, setProductos] = useState({ top10: [], bajos: [], rotacion: [] })
  const [reseñas, setReseñas] = useState({ global: 0, califPorProducto: [], positivas: 0, negativas: 0, reseñasPorMes: [], soporte: {} })
  const timer = useRef(null)

  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); const prev = new Date(d.getTime() - 30*86400000)
    return prev.toISOString().slice(0,10)
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().slice(0,10))

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const [v, e, u, p, r] = await Promise.all([
        informeService.ventas({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
        informeService.envios({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
        informeService.usuarios({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
        informeService.productos({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
        informeService.resenasSoporte({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }).catch(()=>null),
      ])
      if (v?.ok) setVentas(v.data || {})
      if (e?.ok) setEnvios(e.data || {})
      if (u?.ok) setUsuarios(u.data || {})
      if (p?.ok) setProductos(p.data || {})
      if (r?.ok) setReseñas(r.data || {})
    } catch (err) { setError(err.message || 'Error al cargar informes') } finally { setLoading(false) }
  }

  useEffect(() => { cargar(); timer.current = setInterval(cargar, 15000); return () => { if (timer.current) clearInterval(timer.current) } }, [fechaInicio, fechaFin])

  const metodoData = useMemo(() => Object.entries(ventas.porMetodo||{}).map(([label, value])=>({ label, value })), [ventas])
  const estadosEnvio = useMemo(() => Object.entries(envios.estados||{}).map(([label, value])=>({ label, value })), [envios])
  const rolesDist = useMemo(() => Object.entries(usuarios.roles||{}).map(([label, value])=>({ label, value })), [usuarios])

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Informes</h2>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={cargar}>Actualizar</button>
        </div>
      </div>

      <div className="tabs">
        {['ventas','envios','usuarios','productos','resenas'].map(t => (
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=> setTab(t)}>{t}</button>
        ))}
      </div>

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading && <div>Cargando...</div>}

      {tab==='ventas' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3>Rango de fechas</h3>
            <div style={{display:'flex', gap:8}}>
              <input type="date" value={fechaInicio} onChange={e=> setFechaInicio(e.target.value)} />
              <input type="date" value={fechaFin} onChange={e=> setFechaFin(e.target.value)} />
              <button className="btn" onClick={cargar}>Aplicar</button>
            </div>
          </div>
          <div className="card">
            <h3>Ingresos por día</h3>
            <LineChart points={(ventas.ingresosDia||[]).map(d=>({ value: Number(d.value||0) }))} />
          </div>
          <div className="card">
            <h3>Ventas por método</h3>
            <PieChart items={metodoData} />
          </div>
          <div className="card"><h3>Total Ventas</h3><div className="stat-number">{ventas.totalVentas??0}</div></div>
          <div className="card"><h3>Monto Total</h3><div className="stat-number">${ventas.montoTotal??0}</div></div>
        </div>
      )}

      {tab==='envios' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3>Rango de fechas</h3>
            <div style={{display:'flex', gap:8}}>
              <input type="date" value={fechaInicio} onChange={e=> setFechaInicio(e.target.value)} />
              <input type="date" value={fechaFin} onChange={e=> setFechaFin(e.target.value)} />
              <button className="btn" onClick={cargar}>Aplicar</button>
            </div>
          </div>
          <div className="card"><h3>Estados</h3><BarChart data={estadosEnvio} /></div>
          <div className="card"><h3>Promedio días entrega</h3><div className="stat-number">{envios.promedioDias??0}</div></div>
          <div className="card"><h3>En curso</h3><div className="stat-number">{envios.en_curso??0}</div></div>
          <div className="card"><h3>Entregados</h3><div className="stat-number">{envios.entregados??0}</div></div>
        </div>
      )}

      {tab==='usuarios' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3>Rango de fechas</h3>
            <div style={{display:'flex', gap:8}}>
              <input type="date" value={fechaInicio} onChange={e=> setFechaInicio(e.target.value)} />
              <input type="date" value={fechaFin} onChange={e=> setFechaFin(e.target.value)} />
              <button className="btn" onClick={cargar}>Aplicar</button>
            </div>
          </div>
          <div className="card"><h3>Roles</h3><PieChart items={rolesDist} /></div>
          <div className="card"><h3>Activos</h3><div className="stat-number">{usuarios.activos??0}</div></div>
          <div className="card"><h3>Inactivos</h3><div className="stat-number">{usuarios.inactivos??0}</div></div>
          <div className="card"><h3>Nuevos del mes</h3><div className="stat-number">{usuarios.nuevosMes??0}</div></div>
          <div className="card"><h3>Nuevos en rango</h3><div className="stat-number">{usuarios.nuevosRango??0}</div></div>
        </div>
      )}

      {tab==='productos' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3>Rango de fechas</h3>
            <div style={{display:'flex', gap:8}}>
              <input type="date" value={fechaInicio} onChange={e=> setFechaInicio(e.target.value)} />
              <input type="date" value={fechaFin} onChange={e=> setFechaFin(e.target.value)} />
              <button className="btn" onClick={cargar}>Aplicar</button>
            </div>
          </div>
          <div className="card">
            <h3>Top 10 rotación</h3>
            <BarChart data={(productos.top10||[]).map(x=>({ label: x.nombre||x.id, value: Number(x.rotacion||0) }))} />
          </div>
          <div className="card"><h3>Bajo stock</h3><div>{(productos.bajos||[]).map(b=> (<span key={b.id} className="badge" style={{marginRight:6}}>{b.nombre} · {b.stock}</span>))}</div></div>
          <div className="card"><h3>Nuevos en rango</h3><div className="stat-number">{productos.nuevosRango??0}</div></div>
        </div>
      )}

      {tab==='resenas' && (
        <div className="grid2" style={{marginTop:12}}>
          <div className="card">
            <h3>Rango de fechas</h3>
            <div style={{display:'flex', gap:8}}>
              <input type="date" value={fechaInicio} onChange={e=> setFechaInicio(e.target.value)} />
              <input type="date" value={fechaFin} onChange={e=> setFechaFin(e.target.value)} />
              <button className="btn" onClick={cargar}>Aplicar</button>
            </div>
          </div>
          <div className="card"><h3>Global</h3><div className="stat-number">{reseñas.global??0}</div></div>
          <div className="card"><h3>Reseñas por mes</h3><LineChart points={(reseñas.reseñasPorMes||[]).map(d=>({ value: Number(d.count||0) }))} /></div>
          <div className="card"><h3>Positivas</h3><div className="stat-number">{reseñas.positivas??0}</div></div>
          <div className="card"><h3>Negativas</h3><div className="stat-number">{reseñas.negativas??0}</div></div>
        </div>
      )}
    </div>
  )
}