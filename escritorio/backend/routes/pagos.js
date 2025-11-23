// Rutas de pagos: validación, consulta, listado admin y simulación
const express = require('express')
const router = express.Router()
const { apiClient } = require('../lib/apiClient')
function _clienteInfo(raw) {
  const root = raw?.data ?? raw
  const d = root?.pedido || root
  const c = d?.cliente || d?.usuario || d?.user || d?.perfil || {}
  const nombreParts = [c?.nombre, c?.apellido].filter(Boolean)
  const nombre1 = nombreParts.length ? nombreParts.join(' ') : null
  const nombre2 = d?.cliente_nombre || c?.razon_social || c?.name || c?.nombre_usuario || c?.username || d?.nombre_cliente || null
  const nombre = nombre1 || nombre2 || c?.email || null
  const uid = d?.id_usuario ?? d?.usuario_id ?? c?.id ?? c?.id_usuario ?? null
  return { nombre: nombre ? String(nombre) : null, id_usuario: uid }
}

router.post('/validator/pagos', async (req, res) => {
  try {
    const { id_pedido, descripcion, monto_total } = req.body || {}
    const pid = Number(id_pedido)
    const monto = Number(monto_total)
    if (!Number.isFinite(pid) || pid <= 0) return res.status(400).json({ error: 'ID de pedido inválido' })
    if (!descripcion || typeof descripcion !== 'string' || !descripcion.trim()) return res.status(400).json({ error: 'Descripción requerida' })
    if (!Number.isFinite(monto) || monto <= 0) return res.status(400).json({ error: 'Monto total debe ser positivo' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const pedido = await apiClient.get(`/pedidos/${pid}`, { headers: hdr }).catch(() => null)
    if (!pedido || !(pedido.data?.data || pedido.data)) return res.status(400).json({ error: 'No se puede generar el pago: pedido inexistente' })
    const r = await apiClient.post('/pagos', { id_pedido: pid, descripcion, monto_total: monto }, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al crear pago' }) }
})

router.get('/pagos/consulta', async (req, res) => {
  try {
    const { estado, monto_min, limit = 25, page = 1 } = req.query
    const l = Number(limit), p = Number(page)
    if (!Number.isFinite(l) || l <= 0) return res.status(400).json({ error: 'limit inválido' })
    if (!Number.isFinite(p) || p <= 0) return res.status(400).json({ error: 'page inválido' })
    if (monto_min != null) {
      const m = Number(monto_min)
      if (!Number.isFinite(m) || m < 0) return res.status(400).json({ error: 'monto_min debe ser positivo' })
    }
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const qs = new URLSearchParams()
    if (estado) qs.set('estado', String(estado))
    if (monto_min != null) qs.set('monto_min', String(monto_min))
    qs.set('limit', String(l))
    qs.set('page', String(p))
    const r = await apiClient.get(`/pagos/consulta?${qs.toString()}`, { headers: hdr })
    let resData = r.data
    let arr = Array.isArray(resData?.data) ? resData.data : (Array.isArray(resData) ? resData : [])
    const ids = Array.from(new Set(arr.map(x => Number(x.id_pedido ?? x.pedido_id ?? x.order_id)).filter(n => Number.isFinite(n) && n>0)))
    const pedidos = await Promise.allSettled(ids.map(id => apiClient.get(`/pedidos/${id}`, { headers: hdr })))
    const nameMap = {}
    const userIds = []
    pedidos.forEach((pr, idx) => {
      const id = ids[idx]
      if (pr.status === 'fulfilled') {
        const info = _clienteInfo(pr.value?.data)
        if (info.nombre) nameMap[id] = info.nombre
        else if (info.id_usuario) userIds.push({ pid: id, uid: info.id_usuario })
      }
    })
    if (userIds.length) {
      const resUsers = await Promise.allSettled(userIds.map(x => apiClient.get(`/users/profile/${x.uid}`, { headers: hdr })))
      resUsers.forEach((ur, i) => {
        if (ur.status === 'fulfilled') {
          const ud = ur.value?.data?.data ?? ur.value?.data
          const nm = ud?.nombre || ud?.nombre_usuario || ud?.username || null
          if (nm) nameMap[userIds[i].pid] = String(nm)
        }
      })
    }
    arr = arr.map(x => {
      const pid = Number(x.id_pedido ?? x.pedido_id ?? x.order_id)
      return { ...x, cliente_nombre: nameMap[pid] || null }
    })
    if (Array.isArray(resData?.data)) resData = { ...resData, data: arr }
    return res.json(resData)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al consultar pagos' }) }
})

router.get('/pagos/admin', async (req, res) => {
  try {
    const { limit = 25, page = 1 } = req.query
    const l = Number(limit), p = Number(page)
    if (!Number.isFinite(l) || l <= 0) return res.status(400).json({ error: 'limit inválido' })
    if (!Number.isFinite(p) || p <= 0) return res.status(400).json({ error: 'page inválido' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const r = await apiClient.get('/pagos', { headers: hdr })
    let arr = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.result) ? r.data.result : []))
    arr.sort((a,b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    const ids = Array.from(new Set(arr.map(x => Number(x.id_pedido ?? x.pedido_id ?? x.order_id)).filter(n => Number.isFinite(n) && n>0)))
    const pedidos = await Promise.allSettled(ids.map(id => apiClient.get(`/pedidos/${id}`, { headers: hdr })))
    const nameMap = {}
    const userIds = []
    pedidos.forEach((pr, idx) => {
      const id = ids[idx]
      if (pr.status === 'fulfilled') {
        const info = _clienteInfo(pr.value?.data)
        if (info.nombre) nameMap[id] = info.nombre
        else if (info.id_usuario) userIds.push({ pid: id, uid: info.id_usuario })
      }
    })
    if (userIds.length) {
      const resUsers = await Promise.allSettled(userIds.map(x => apiClient.get(`/users/profile/${x.uid}`, { headers: hdr })))
      resUsers.forEach((ur, i) => {
        if (ur.status === 'fulfilled') {
          const ud = ur.value?.data?.data ?? ur.value?.data
          const nm = ud?.nombre || ud?.nombre_usuario || ud?.username || null
          if (nm) nameMap[userIds[i].pid] = String(nm)
        }
      })
    }
    arr = arr.map(x => {
      const pid = Number(x.id_pedido ?? x.pedido_id ?? x.order_id)
      return { ...x, cliente_nombre: nameMap[pid] || null }
    })
    const total = arr.length
    const start = (p-1)*l
    const pageItems = arr.slice(start, start+l)
    return res.json({ data: pageItems, total, page: p, limit: l })
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al listar pagos' }) }
})

router.post('/pagos/simular-aprobacion', async (req, res) => {
  try {
    const { id_pedido, id_pago, descripcion, monto_total, code } = req.body || {}
    const pid = Number(id_pedido)
    const monto = Number(monto_total)
    const desc = String(descripcion || '').trim()
    if (!Number.isFinite(pid) || pid <= 0) return res.status(400).json({ error: 'ID de pedido inválido' })
    if (!Number.isFinite(monto) || monto <= 0) return res.status(400).json({ error: 'Monto total debe ser positivo' })
    if (!desc) return res.status(400).json({ error: 'Descripción requerida' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    // Requiere code: si no viene, intentar derivarlo del pago del pedido
    let simCode = code ? String(code) : null
    if (!simCode) {
      const r = await apiClient.get('/pagos', { headers: hdr })
      let arr = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.result) ? r.data.result : []))
      if (id_pago!=null) {
        arr = arr.filter(p => String(p.id ?? p.id_pago ?? '') === String(id_pago))
      } else {
        arr = arr.filter(p => String(p.id_pedido ?? p.pedido_id ?? p.order_id) === String(pid))
      }
      if (!arr.length) return res.status(400).json({ error: 'No existe pago para el pedido indicado' })
      arr.sort((a,b) => new Date(b.created_at ?? b.fecha_pago ?? 0).getTime() - new Date(a.created_at ?? a.fecha_pago ?? 0).getTime())
      const isPend = (x) => String(x.estado_pago ?? x.estado ?? '').toLowerCase().includes('pend')
      const match = arr.find(isPend) || arr[0]
      simCode = match.id_transaccion ?? match.codigo ?? match.code ?? null
      if (!simCode && typeof match.raw_gateway_json === 'string') {
        try { const raw = JSON.parse(match.raw_gateway_json); simCode = raw?.data?.id ?? raw?.data?.code ?? null } catch {}
      }
      if (!simCode) return res.status(400).json({ error: 'No se encontró código de transacción para simular' })
    }
    const resp = await apiClient.post(`/pagos/simular-aprobacion/${encodeURIComponent(simCode)}`, {}, { headers: hdr })
    try { await apiClient.put(`/pedidos/${pid}/estado`, { estado: 'procesando' }, { headers: hdr }) } catch {}
    return res.json(resp.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error en simulación de aprobación' }) }
})

router.post('/pagos/aprobar', async (req, res) => {
  try {
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const r = await apiClient.post('/pagos/aprobar', req.body, { headers: hdr })
    const result = { pago_aprobado: true, factura_creada: false, factura_id: null, pdf_generado: false, email_enviado: false, errores: [] }
    let pid = Number(req.body?.id_pedido)
    let pagoId = req.body?.id_pago != null ? Number(req.body.id_pago) : null
    let monto = null
    // Fallback: intentar derivar datos desde la respuesta de aprobación
    try {
      const rd = r.data?.data ?? r.data
      const rpago = Array.isArray(rd) ? rd[0] : rd
      if (rpago) {
        if (!Number.isFinite(pid) || pid <= 0) pid = Number(rpago.id_pedido ?? rpago.pedido_id ?? rpago.order_id)
        if (!Number.isFinite(pagoId) || pagoId <= 0) pagoId = Number(rpago.id ?? rpago.id_pago)
        if (!Number.isFinite(monto) || monto <= 0) monto = Number(rpago.monto_total ?? rpago.total ?? rpago.monto)
      }
    } catch {}
    try {
      if (!Number.isFinite(pid) || pid <= 0) {
        const rp = await apiClient.get('/pagos', { headers: hdr })
        let arr = Array.isArray(rp.data?.data) ? rp.data.data : (Array.isArray(rp.data) ? rp.data : (Array.isArray(rp.data?.result) ? rp.data.result : []))
        if (pagoId != null) {
          const match = arr.find(p => String(p.id ?? p.id_pago ?? '') === String(pagoId))
          if (match) {
            pid = Number(match.id_pedido ?? match.pedido_id ?? match.order_id)
            monto = Number(match.monto_total ?? match.total ?? match.monto ?? NaN)
          }
        } else {
          const last = arr.filter(p => String(p.estado ?? p.estado_pago ?? '').toLowerCase().includes('apro')).sort((a,b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))[0]
          if (last) {
            pagoId = Number(last.id ?? last.id_pago ?? NaN)
            pid = Number(last.id_pedido ?? last.pedido_id ?? last.order_id)
            monto = Number(last.monto_total ?? last.total ?? last.monto ?? NaN)
          }
        }
      }
    } catch (e) { result.errores.push('no_se_pudo_derivar_pago'); }
    let pedidoResp = null
    try { if (Number.isFinite(pid) && pid > 0) pedidoResp = await apiClient.get(`/pedidos/${pid}`, { headers: hdr }) } catch (e) { result.errores.push('pedido_no_encontrado') }
    const info = pedidoResp ? _clienteInfo(pedidoResp.data) : { id_usuario: null }
    const uid = info.id_usuario
    const pd = pedidoResp?.data?.data ?? pedidoResp?.data ?? null
    let total = Number(monto)
    if (!Number.isFinite(total) || total <= 0) total = Number(pd?.total ?? pd?.total_final ?? pd?.monto_total ?? NaN)
    const subtotal = Number(pd?.subtotal ?? NaN)
    const iva_total = Number(pd?.iva_total ?? NaN)
    if (Number.isFinite(uid) && Number.isFinite(pid) && Number.isFinite(total) && total > 0) {
      try {
        const body = { id_usuario: uid, id_pedido: pid, total, tipo: 'A', subtotal: Number.isFinite(subtotal) ? subtotal : (Number.isFinite(iva_total) ? total - iva_total : total), iva_total: Number.isFinite(iva_total) ? iva_total : 0, id_pago: Number.isFinite(pagoId) ? pagoId : null, pdf_url: null }
        const cf = await apiClient.post('/facturas/admin', body, { headers: hdr })
        const fid = cf.data?.data?.id ?? cf.data?.id ?? null
        if (fid != null) {
          result.factura_creada = true
          result.factura_id = fid
          try { await apiClient.post(`/facturas/admin/${fid}/generar-pdf`, {}, { headers: hdr }); result.pdf_generado = true } catch (e) { result.errores.push('pdf_error') }
          try { await apiClient.post(`/facturas/admin/${fid}/enviar-email`, {}, { headers: hdr }); result.email_enviado = true } catch (e) { result.errores.push('email_error') }
          try { await apiClient.patch(`/facturas/admin/${fid}/marcar-enviada`, {}, { headers: hdr }) } catch {}
        }
      } catch (e) { result.errores.push('factura_error') }
    } else {
      result.errores.push('datos_insuficientes_para_factura')
    }
    return res.json({ data: r.data, meta: result })
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al aprobar pago' }) }
})
module.exports = router