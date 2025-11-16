const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const pagosService = {
  crear: async ({ id_pedido, descripcion, monto_total }) => {
    const token = sessionStorage.getItem('token')
    const body = { id_pedido: Number(id_pedido), descripcion: String(descripcion || ''), monto_total: Number(monto_total) }
    const res = await fetch(`${LOCAL_BACKEND}/validator/pagos`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al crear pago')
    return j?.data ?? j
  },
  simularAprobacion: async ({ id_pedido, descripcion, monto_total }) => {
    const token = sessionStorage.getItem('token')
    const body = { id_pedido: Number(id_pedido), descripcion: String(descripcion || ''), monto_total: Number(monto_total) }
    const res = await fetch(`${LOCAL_BACKEND}/pagos/simular-aprobacion`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al simular aprobación')
    return j?.data ?? j
  },
  adminList: async ({ page = 1, limit = 25 } = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
    const res = await fetch(`${LOCAL_BACKEND}/pagos/admin?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error al listar pagos')
    return j
  },
  consulta: async ({ estado, monto_min, page = 1, limit = 25 } = {}) => {
    const token = sessionStorage.getItem('token')
    const qs = new URLSearchParams()
    if (estado) qs.set('estado', String(estado))
    if (monto_min != null) qs.set('monto_min', String(monto_min))
    qs.set('page', String(page))
    qs.set('limit', String(limit))
    const res = await fetch(`${LOCAL_BACKEND}/pagos/consulta?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error en consulta de pagos')
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])
    const total = Number(j?.total ?? arr.length)
    return { data: arr, total }
  }
}