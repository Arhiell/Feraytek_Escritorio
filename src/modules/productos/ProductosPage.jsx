import React, { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Search, Plus } from 'lucide-react'
import { productosService } from '../../services/productosService'
import { categoriasService } from '../../services/categoriasService'
import { productosStats } from '../../services/productosStats'
import ProductoFormModal from './ProductoFormModal'
import ProductoDetailPanel from './ProductoDetailPanel'
import ProductosStatsPanel from './ProductosStatsPanel'
import ProductosTable from './ProductosTable'

export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [stats, setStats] = useState({ activos: 0, inactivos: 0, criticos: 0, categoriasTop: [] })
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ categoria: '', estado: '', precioMin: '', precioMax: '', stockMinimo: '', stockMax: '', id: '' })
  const [filterErrors, setFilterErrors] = useState({ precioMin: '', precioMax: '', stockMinimo: '', stockMax: '' })
  const [sort, setSort] = useState({ field: 'fecha_creacion', dir: 'desc' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [variantsByProduct, setVariantsByProduct] = useState({})
  const [imagesByProduct, setImagesByProduct] = useState({})

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [prods, cats, s] = await Promise.all([
        productosService.listar(),
        categoriasService.activas().catch(() => []),
        productosStats()
      ])
      setProductos(prods)
      setCategorias(cats)
      setStats(s)
      setVariantsByProduct(s.variantsByProduct || {})
      setImagesByProduct(s.imagesByProduct || {})
    } catch (e) {
      setError('Error al cargar productos')
    } finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [])

  const getId = (p) => p.id ?? p.id_producto ?? p.producto_id
  const getCategoriaId = (p) => p.id_categoria ?? p.categoria_id ?? p.categoria?.id
  const getEstado = (p) => p.estado ?? (p.activo === true ? 'activo' : 'inactivo')
  const getPrecio = (p) => p.precio_base ?? p.precio ?? p.valor ?? 0
  const isCritico = (p) => { const stock = p.stock ?? 0; const min = p.stock_minimo ?? p.stockMinimo ?? 0; return typeof stock === 'number' && typeof min === 'number' && stock <= min }

  const filtered = productos.filter(p => {
    const t = `${p.nombre || ''} ${getId(p) || ''} ${getEstado(p) || ''}`.toLowerCase()
    const matchQuery = t.includes(query.toLowerCase())
    const matchCat = filters.categoria ? String(getCategoriaId(p)) === String(filters.categoria) : true
    const matchEstado = filters.estado ? String(getEstado(p)) === String(filters.estado) : true
    const precio = Number(getPrecio(p))
    const matchPrecioMin = filters.precioMin ? precio >= Number(filters.precioMin) : true
    const matchPrecioMax = filters.precioMax ? precio <= Number(filters.precioMax) : true
    const matchStockMin = filters.stockMinimo ? (Number(p.stock ?? 0) <= Number(filters.stockMinimo)) : true
    const matchStockMax = filters.stockMax ? (Number(p.stock ?? 0) <= Number(filters.stockMax)) : true
    const matchId = filters.id ? String(getId(p)) === String(filters.id) : true
    return matchQuery && matchCat && matchEstado && matchPrecioMin && matchPrecioMax && matchStockMin && matchStockMax && matchId
  })
  const sorted = [...filtered].sort((a,b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    const f = sort.field
    const va = f === 'precio' ? getPrecio(a) : (f === 'stock' ? (a.stock ?? 0) : (f === 'estado' ? getEstado(a) : (f === 'fecha_creacion' ? new Date(a.created_at ?? a.fecha_creacion ?? a.fecha ?? 0).getTime() : String(a[f] ?? '').toLowerCase())))
    const vb = f === 'precio' ? getPrecio(b) : (f === 'stock' ? (b.stock ?? 0) : (f === 'estado' ? getEstado(b) : (f === 'fecha_creacion' ? new Date(b.created_at ?? b.fecha_creacion ?? b.fecha ?? 0).getTime() : String(b[f] ?? '').toLowerCase())))
    if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0
  })

  const openDetail = async (p) => { try { const full = await productosService.obtener(getId(p)); setDetail(full) } catch { setDetail(p) } }
  const startEdit = async (p) => { try { const full = await productosService.obtener(getId(p)); setEditItem(full) } catch { setEditItem(p) } }
  const handleDelete = async (p) => { try { await productosService.eliminar(getId(p)); toast.success('Producto eliminado'); await loadData() } catch { toast.error('No se pudo eliminar') } }
  const toggleSort = (field) => setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  const handlePositiveFilter = (key, val) => {
    const cleaned = val.replace(/[^0-9.]/g, '')
    const num = cleaned === '' ? '' : Number(cleaned)
    if (cleaned === '' || (Number.isFinite(num) && num >= 0)) { setFilters(f => ({ ...f, [key]: cleaned })); setFilterErrors(e => ({ ...e, [key]: '' })) }
    else { setFilters(f => ({ ...f, [key]: '' })); setFilterErrors(e => ({ ...e, [key]: 'No se permiten valores negativos' })) }
  }

  return (
    <div className="productos-module">
      <Toaster richColors position="top-right" />
      <h1 style={{color: '#FF7A00'}}>Productos</h1>
      <div className="card" style={{marginTop: 12}}>
        <div className="productos-filters" style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <div style={{position: 'relative', flex: 1}}>
            <Search size={18} style={{position: 'absolute', left: 10, top: 10, color: '#9ca3af'}} />
            <input style={{paddingLeft: 34}} type="text" placeholder="Buscar por nombre, ID, estado" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id ?? c.id_categoria} value={String(c.id ?? c.id_categoria)}>{c.nombre_categoria ?? c.nombre ?? `Cat ${c.id}`}</option>)}
          </select>
          <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <input type="number" placeholder="Precio mín" value={filters.precioMin} onChange={(e) => handlePositiveFilter('precioMin', e.target.value)} style={{width: 120}} />
          <input type="number" placeholder="Precio máx" value={filters.precioMax} onChange={(e) => handlePositiveFilter('precioMax', e.target.value)} style={{width: 120}} />
          <input type="number" placeholder="Stock ≤" value={filters.stockMinimo} onChange={(e) => handlePositiveFilter('stockMinimo', e.target.value)} style={{width: 120}} />
          <input type="number" placeholder="Stock máx" value={filters.stockMax} onChange={(e) => handlePositiveFilter('stockMax', e.target.value)} style={{width: 120}} />
          <button className="btn btn-orange" onClick={() => setShowCreate(true)}><Plus size={16} /> Nuevo</button>
        </div>
        <div style={{display:'flex', gap:12, marginTop:8}}>
          {filterErrors.precioMin && <small style={{color:'#FF7A00'}}>{filterErrors.precioMin}</small>}
          {filterErrors.precioMax && <small style={{color:'#FF7A00'}}>{filterErrors.precioMax}</small>}
          {filterErrors.stockMinimo && <small style={{color:'#FF7A00'}}>{filterErrors.stockMinimo}</small>}
          {filterErrors.stockMax && <small style={{color:'#FF7A00'}}>{filterErrors.stockMax}</small>}
        </div>
      </div>

      <ProductosStatsPanel stats={stats} />

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading ? <div>Cargando productos...</div> : (
        <ProductosTable
          items={sorted}
          sort={sort}
          toggleSort={toggleSort}
          getPrecio={getPrecio}
          getEstado={getEstado}
          isCritico={isCritico}
          variantsByProduct={variantsByProduct}
          imagesByProduct={imagesByProduct}
          openDetail={openDetail}
          startEdit={startEdit}
          handleDelete={handleDelete}
        />
      )}

      {showCreate && (
        <ProductoFormModal categorias={categorias} onClose={() => setShowCreate(false)} onSaved={async ()=>{ setShowCreate(false); await loadData(); toast.success('Producto creado') }} />
      )}
      {editItem && (
        <ProductoFormModal categorias={categorias} initial={editItem} onClose={() => setEditItem(null)} onSaved={async ()=>{ setEditItem(null); await loadData(); toast.success('Producto actualizado') }} />
      )}
      {detail && (
        <ProductoDetailPanel producto={detail} onClose={() => setDetail(null)} onChanged={async ()=>{ await loadData() }} />
      )}
    </div>
  )
}