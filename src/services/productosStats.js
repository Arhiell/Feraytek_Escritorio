// Estadísticas derivadas del módulo de Productos
// - Calcula métricas: activos, inactivos, críticos, top categorías.
// - Cruza datos de variantes e imágenes para enriquecer el dashboard.

import { productosService } from './productosService'
import { variantesService } from './variantesService'
import { imagenesService } from './imagenesService'

export const productosStats = async () => {
  const [productos, variantes, imagenes] = await Promise.all([
    productosService.listar(),
    variantesService.listar().catch(() => []),
    imagenesService.listar().catch(() => [])
  ])
  const activos = productos.filter(p => (p.estado ?? p.activo ?? 'activo') === 'activo').length
  const inactivos = productos.filter(p => (p.estado ?? p.activo ?? 'inactivo') !== 'activo').length
  const criticos = productos.filter(p => {
    const stock = p.stock ?? 0
    const min = p.stock_minimo ?? p.stockMinimo ?? 0
    return typeof stock === 'number' && typeof min === 'number' && stock <= min
  }).length
  const byCat = {}
  for (const p of productos) {
    const cid = p.id_categoria ?? p.categoria_id ?? p.categoria?.id ?? 'sin'
    byCat[cid] = (byCat[cid] || 0) + 1
  }
  const categoriasTop = Object.entries(byCat)
    .sort((a,b) => b[1]-a[1])
    .slice(0,5)
    .map(([id,count]) => ({ id, count }))
  const variantsByProduct = {}
  for (const v of variantes) {
    const pid = v.id_producto ?? v.producto_id
    if (pid != null) variantsByProduct[pid] = (variantsByProduct[pid] || 0) + 1
  }
  const imagesByProduct = {}
  for (const img of imagenes) {
    const pid = img.id_producto ?? img.producto_id
    if (pid != null) imagesByProduct[pid] = (imagesByProduct[pid] || 0) + 1
  }
  return { activos, inactivos, criticos, categoriasTop, variantsByProduct, imagesByProduct }
}