import React, { useEffect, useState, useRef } from 'react'

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
  const [yy, mm] = yearMonth.split('-')
  const periodText = new Date(parseInt(yy), parseInt(mm)-1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const monthRef = useRef(null)

  const parseDateFlexible = (v) => {
    if (!v) return null
    const s = typeof v === 'string' ? v.replace(' ', 'T') : String(v)
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d
    return null
  }

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
        const monthIndex = Math.max(0, parseInt(mm, 10) - 1)
        const mmPadded = String(monthIndex + 1).padStart(2, '0')
        tasks.push((async () => {
          const now = new Date(); const cYY = String(now.getFullYear()); const cMM = String(now.getMonth()+1).padStart(2,'0')
          if (`${yy}-${mmPadded}` === `${cYY}-${cMM}`) {
            const rs = await fetch(`${API_BASE}/facturas/admin/estadisticas`, { headers: hdr })
            let js; try { js = await rs.json() } catch { js = {} }
            const inc = js?.ingresos_mes ?? js?.data?.ingresos_mes ?? js?.total ?? null
            const cnt = js?.total_facturas ?? js?.data?.total_facturas ?? null
            if (inc != null) normalized.ingresos_mes = typeof inc === 'string' ? parseFloat(inc) : inc
            if (cnt != null) normalized.total_facturas = Number(cnt)
            if (normalized.ingresos_mes > 0 && normalized.total_facturas > 0) return
          }
          const endDate = new Date(parseInt(yy, 10), monthIndex + 1, 0).getDate()
          const start = `${yy}-${mmPadded}-01`; const end = `${yy}-${mmPadded}-${String(endDate).padStart(2,'0')}`
          const r2 = await fetch(`${API_BASE}/facturas/admin/buscar?fecha_inicio=${start}&fecha_fin=${end}&limite=1000`, { headers: hdr })
          let j2; try { j2 = await r2.json() } catch { j2 = {} }
          const arr = extractArray(j2, ['data','facturas','result','results','items'])
          const parseNum = (v) => {
            if (typeof v === 'number') return v
            if (typeof v === 'string') { const s = v.replace(/[^0-9,.-]/g, '').replace(',', '.'); const n = parseFloat(s); return isNaN(n) ? 0 : n }
            return 0
          }
          const sum = arr.reduce((acc, item) => {
            const t = parseNum(item?.total)
            if (t > 0) return acc + t
            const st = parseNum(item?.subtotal)
            const iv = parseNum(item?.iva_total)
            return acc + (st + iv)
          }, 0)
          normalized.ingresos_mes = isNaN(sum) ? 0 : sum
          normalized.total_facturas = Array.isArray(arr) ? arr.length : 0
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
    const amountKeys = ['total','monto','importe_total','precio_total','amount','subtotal','valor','precio','importe','iva_total']
    const parseNum = (v) => {
      if (typeof v === 'number') return v
      if (typeof v === 'string') {
        const s = v.replace(/[^0-9,.-]/g, '').replace(',', '.')
        const n = parseFloat(s)
        return isNaN(n) ? null : n
      }
      return null
    }
    const readVal = (obj) => {
      for (const k of amountKeys) {
        const v = obj?.[k]
        const n = parseNum(v)
        if (n != null) return n
      }
      const subN = parseNum(obj?.subtotal)
      const ivaN = parseNum(obj?.iva_total)
      if (subN != null && ivaN != null) return subN + ivaN
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
        <div className="month-filter">
          <span className="month-label">Periodo</span>
          <div className="month-field">
            <input ref={monthRef} className="month-input" type="month" value={yearMonth} onChange={(e)=> setYearMonth(e.target.value)} />
            <button type="button" className="month-icon" onClick={()=> monthRef.current && (monthRef.current.showPicker ? monthRef.current.showPicker() : monthRef.current.focus())}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 1 1 2 0v1zm13 6H4v11h16V8z"/>
              </svg>
            </button>
          </div>
          <button className="btn btn-primary" onClick={()=> setYearMonth(yearMonth)}>Actualizar</button>
        </div>
        <div className="legend">Mostrando datos de {periodText}</div>
      </div>
      {loading && <div>Cargando estadísticas...</div>}
      {error && <div className="error-box">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card"><h3>Facturas del Mes</h3><div className="stat-number">{stats.total_facturas ?? 0}</div></div>
        <div className="stat-card"><h3>Ingresos del Mes</h3><div className="stat-number">{stats.ingresos_mes != null ? `$${stats.ingresos_mes}` : '$0'}</div></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><h3>Total Productos</h3><div className="stat-number">{stats.total_productos ?? 0}</div></div>
        <div className="stat-card"><h3>Total Usuarios</h3><div className="stat-number">{stats.total_usuarios ?? 0}</div></div>
        <div className="stat-card"><h3>Pedidos Pendientes (total)</h3><div className="stat-number">{stats.pedidos_pendientes ?? 0}</div></div>
      </div>
      <div className="legend">Total acumulado del sistema</div>
    </div>
  )
}
