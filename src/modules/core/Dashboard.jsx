import React, { useEffect, useState } from 'react'

// Dashboard con estadísticas reales y fallback
export default function Dashboard({ user }) {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
  const displayName = (user?.nombre && user?.apellido) ? `${user.nombre} ${user.apellido}` : (user?.nombre_usuario || user?.username || user?.email || '')

  const [stats, setStats] = useState({ total_productos: 0, total_facturas: 0, pedidos_pendientes: 0, ingresos_mes: 0, total_usuarios: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date(); const m = String(d.getMonth() + 1).padStart(2, '0'); return `${d.getFullYear()}-${m}`
  })

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true); setError('')
      const token = sessionStorage.getItem('token')
      try {
        const endpoint = user?.rol === 'superadmin' ? `${API_BASE}/superadmin/system-stats` : `${API_BASE}/facturas/admin/estadisticas`
        const hdr = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        const res = await fetch(endpoint, { headers: hdr })
        let raw; try { raw = await res.json() } catch { raw = {} }
        let normalized = normalizeStats(raw)
        const fetchArr = async (url) => { const r = await fetch(url, { headers: hdr }); let j; try { j = await r.json() } catch { j = {} }; return extractArray(j, ['data','users','result','results','items']) }
        const tasks = []
        if (!(normalized.total_usuarios > 0)) tasks.push(fetchArr(`${API_BASE}/users`).then(a => { normalized.total_usuarios = a.length }))
        if (!(normalized.total_productos > 0)) tasks.push(fetchArr(`${API_BASE}/productos`).then(a => { normalized.total_productos = a.length }))
        if (!(normalized.total_facturas > 0)) tasks.push(fetchArr(`${API_BASE}/facturas/admin/todas`).then(a => { normalized.total_facturas = a.length }))
        if (!(normalized.pedidos_pendientes > 0)) tasks.push(fetchArr(`${API_BASE}/pedidos`).then(a => { normalized.pedidos_pendientes = a.length }))
        const [yy, mm] = yearMonth.split('-')
        tasks.push((async () => {
          const r = await fetch(`${API_BASE}/admin/stats/revenue-month?year=${yy}&month=${mm}`, { headers: hdr })
          let j; try { j = await r.json() } catch { j = {} }
          const val = j?.ingresos_mes ?? j?.ingresos ?? j?.monto ?? j?.total ?? j?.revenue
          const num = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : null)
          if (num != null && num > 0) { normalized.ingresos_mes = num; return }
          const endDate = new Date(parseInt(yy), parseInt(mm), 0).getDate()
          const start = `${yearMonth}-01`; const end = `${yy}-${mm}-${String(endDate).padStart(2,'0')}`
          const r2 = await fetch(`${API_BASE}/facturas/admin/buscar?fecha_inicio=${start}&fecha_fin=${end}`, { headers: hdr })
          let j2; try { j2 = await r2.json() } catch { j2 = {} }
          const arr = extractArray(j2, ['data','facturas','result','results','items'])
          const sum = sumAmounts(arr)
          if (!isNaN(sum)) normalized.ingresos_mes = sum
        })())
        if (tasks.length) await Promise.allSettled(tasks)
        setStats(normalized)
      } catch (e) { setError('Error al cargar estadísticas') } finally { setLoading(false) }
    }
    fetchStats()
  }, [user?.rol, yearMonth])

  const normalizeStats = (raw) => {
    if (!raw || typeof raw !== 'object') return { total_productos:0, total_facturas:0, pedidos_pendientes:0, ingresos_mes:0, total_usuarios:0 }
    const root = {
      total_usuarios: raw.total_usuarios ?? raw.users_count ?? 0,
      total_productos: raw.total_productos ?? raw.productos ?? raw.products_count ?? 0,
      total_facturas: raw.total_facturas ?? raw.facturas ?? raw.invoices_count ?? 0,
      pedidos_pendientes: raw.pedidos_pendientes ?? raw.pedidos ?? raw.orders_pending ?? 0,
      ingresos_mes: raw.ingresos_mes ?? raw.ingresos ?? raw.sales_month ?? 0,
    }
    const d = raw.data && typeof raw.data === 'object' ? raw.data : {}
    return {
      total_usuarios: d.total_usuarios ?? d.users_count ?? root.total_usuarios,
      total_productos: d.total_productos ?? d.productos ?? d.products_count ?? root.total_productos,
      total_facturas: d.total_facturas ?? d.facturas ?? d.invoices_count ?? root.total_facturas,
      pedidos_pendientes: d.pedidos_pendientes ?? d.pedidos ?? d.orders_pending ?? root.pedidos_pendientes,
      ingresos_mes: d.ingresos_mes ?? d.ingresos ?? d.sales_month ?? root.ingresos_mes,
    }
  }

  const extractArray = (raw, keys) => {
    if (Array.isArray(raw)) return raw
    for (const k of keys) { const v = raw?.[k]; if (Array.isArray(v)) return v }
    if (raw && typeof raw === 'object') { const maybe = Object.values(raw).find(v => Array.isArray(v)); if (Array.isArray(maybe)) return maybe }
    return []
  }

  const sumAmounts = (arr) => {
    if (!Array.isArray(arr)) return 0
    const amountKeys = ['total','monto','importe_total','precio_total','amount','subtotal','valor','precio','importe']
    const readVal = (obj) => {
      for (const k of amountKeys) {
        const v = obj?.[k]
        if (typeof v === 'number') return v
        if (typeof v === 'string' && !isNaN(parseFloat(v))) return parseFloat(v)
      }
      if (obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          const nested = readVal(obj[key])
          if (typeof nested === 'number') return nested
        }
      }
      return 0
    }
    return arr.reduce((acc, item) => acc + readVal(item), 0)
  }

  return (
    <div>
      <h1>Bienvenido, {displayName}!</h1>
      <p>Panel de administración Feraytek</p>
      <div className="card" style={{marginBottom: 16}}>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <input type="month" value={yearMonth} onChange={(e)=> setYearMonth(e.target.value)} />
          <button className="btn" onClick={()=> setYearMonth(yearMonth)}>Actualizar</button>
        </div>
      </div>
      {loading && <div>Cargando estadísticas...</div>}
      {error && <div className="error-box">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card"><h3>Total Productos</h3><div className="stat-number">{stats.total_productos ?? 0}</div></div>
        <div className="stat-card"><h3>Total Facturas</h3><div className="stat-number">{stats.total_facturas ?? 0}</div></div>
        <div className="stat-card"><h3>Pedidos Pendientes</h3><div className="stat-number">{stats.pedidos_pendientes ?? 0}</div></div>
        <div className="stat-card"><h3>Ingresos del Mes</h3><div className="stat-number">{stats.ingresos_mes != null ? `$${stats.ingresos_mes}` : '$0'}</div></div>
        <div className="stat-card"><h3>Total Usuarios</h3><div className="stat-number">{stats.total_usuarios ?? 0}</div></div>
      </div>
    </div>
  )
}