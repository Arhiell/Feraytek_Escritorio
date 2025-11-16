// Rutas de pagos: validación, consulta, listado admin y simulación
const express = require('express')
const router = express.Router()
const { apiClient } = require('../lib/apiClient')

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
    return res.json(r.data)
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
    const total = arr.length
    const start = (p-1)*l
    const pageItems = arr.slice(start, start+l)
    return res.json({ data: pageItems, total, page: p, limit: l })
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al listar pagos' }) }
})

router.post('/pagos/simular-aprobacion', async (req, res) => {
  try {
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const created = await apiClient.post('/pagos', req.body, { headers: hdr })
    const data = created.data?.data ?? created.data
    const enriched = { ...(data || {}), estado: 'aprobado', simulacion: true }
    const pid = Number(req.body?.id_pedido)
    if (Number.isFinite(pid) && pid > 0) {
      try { await apiClient.put(`/pedidos/${pid}/estado`, { estado: 'procesando' }, { headers: hdr }) } catch {}
    }
    return res.json({ data: enriched })
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error en simulación de aprobación' }) }
})

module.exports = router