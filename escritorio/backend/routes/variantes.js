// Rutas de validación para Variantes
const express = require('express')
const router = express.Router()
const { apiClient } = require('../lib/apiClient')

router.post('/variantes', async (req, res) => {
  try {
    const { id_producto, nombre_variante, valor_variante, precio_adicional, stock } = req.body || {}
    const idsane = Number(id_producto)
    if (!Number.isFinite(idsane) || idsane <= 0) return res.status(400).json({ error: 'id_producto inválido' })
    const nums = { precio_adicional, stock }
    for (const [k, v] of Object.entries(nums)) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `${k} debe ser un número positivo` })
    }
    if (!nombre_variante || !valor_variante) return res.status(400).json({ error: 'nombre_variante y valor_variante requeridos' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const prod = await apiClient.get(`/productos/${idsane}`, { headers: hdr }).catch(() => null)
    if (!prod || !(prod.data?.data || prod.data)) return res.status(400).json({ error: 'Debes guardar el producto antes de agregar variantes' })
    const payload = { id_producto: idsane, nombre_variante, valor_variante, precio_adicional: Number(precio_adicional), stock: Number(stock) }
    const r = await apiClient.post('/variantes', payload, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al crear variante' }) }
})

router.put('/variantes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_variante, valor_variante, precio_adicional, stock } = req.body || {}
    const nums = { precio_adicional, stock }
    for (const [k, v] of Object.entries(nums)) {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `${k} debe ser un número positivo` })
    }
    if (!nombre_variante || !valor_variante) return res.status(400).json({ error: 'nombre_variante y valor_variante requeridos' })
    const auth = req.headers.authorization
    const hdr = auth ? { Authorization: auth } : {}
    const payload = { nombre_variante, valor_variante, precio_adicional: Number(precio_adicional), stock: Number(stock) }
    const r = await apiClient.put(`/variantes/${id}`, payload, { headers: hdr })
    return res.json(r.data)
  } catch (e) { return res.status(400).json({ error: e?.response?.data?.error || e?.message || 'Error al actualizar variante' }) }
})

module.exports = router