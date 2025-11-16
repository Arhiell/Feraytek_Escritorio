import React, { useState, useEffect } from 'react'
import { pedidosService } from '../../services/pedidosService'

// Panel lateral de detalle de un pedido. Muestra datos del cliente,
// dirección, totales, ítems y historial. Permite cambiar el estado
// del pedido con validación de opciones permitidas.
export default function PedidoDetailPanel({ pedido, onClose, onChanged }) {
  // ID del pedido. Se acepta `id` o `id_pedido` para compatibilidad
  const id = pedido?.id ?? pedido?.id_pedido
  // Historial de cambios del pedido
  const [hist, setHist] = useState([])
  // Estado editable del pedido
  const [estado, setEstado] = useState(String(pedido?.estado || ''))
  // Flag de guardado para deshabilitar el botón mientras se actualiza
  const [saving, setSaving] = useState(false)
  // Carga el historial al montar y cuando cambia el ID
  useEffect(() => { pedidosService.historial(id).then(setHist).catch(()=>setHist([])) }, [id])
  // Estados válidos según el backend
  const states = ['pendiente','procesando','enviado','entregado','cancelado']
  // Acción de guardado: llama a `actualizarEstado` y notifica al padre
  const save = async () => {
    setSaving(true)
    try { await pedidosService.actualizarEstado(id, estado); await onChanged() } finally { setSaving(false) }
  }
  // Datos derivados del payload de pedido, tolerando estructuras distintas
  const cliente = pedido.cliente || {}
  const direccion = pedido.direccion || pedido.envio?.direccion || {}
  const items = Array.isArray(pedido.items) ? pedido.items : []
  // Fechas y montos calculados con fallback seguro
  const creado = new Date(pedido.created_at ?? pedido.fecha_creacion ?? Date.now()).toLocaleString()
  const actualizado = new Date(pedido.updated_at ?? pedido.fecha_actualizacion ?? Date.now()).toLocaleString()
  const total = Number(pedido.total_final ?? pedido.total ?? 0).toFixed(2)
  const iva = Number(pedido.total_iva ?? pedido.iva ?? 0).toFixed(2)
  const subtotal = Number(pedido.subtotal ?? (Number(total)-Number(iva))).toFixed(2)
  const metodo = pedido.metodo_pago ?? pedido.payment_method ?? '-'
  const envio = pedido.tipo_envio ?? pedido.envio?.tipo ?? '-'
  return (
    <div className="side-panel">
      {/* Encabezado del panel con acción de cierre */}
      <div className="side-panel-header">
        <h3 style={{color:'#FF7A00'}}>Detalle de pedido</h3>
        <button className="btn" onClick={onClose} style={{background:'#1f2937', color:'#fff'}}>Cerrar</button>
      </div>
      {/* Contenido principal con tarjetas informativas */}
      <div style={{padding:16}}>
        {/* Resumen del cliente y metadatos del pedido */}
        <div className="card" style={{marginBottom:12}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div>
              <p>ID: {id}</p>
              <p>Cliente: {cliente.nombre || cliente.email || '-'}</p>
              <p>Email: {cliente.email || '-'}</p>
              <p>Teléfono: {cliente.telefono || '-'}</p>
            </div>
            <div>
              <p>Dirección: {direccion.calle ? `${direccion.calle} ${direccion.numero || ''}` : '-'}</p>
              <p>Creado: {creado}</p>
              <p>Actualizado: {actualizado}</p>
            </div>
          </div>
        </div>
        {/* Totales y selector de estado */}
        <div className="card" style={{marginBottom:12}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
            <div><p>Estado: <span className={`badge ${estado==='cancelado'?'badge-danger':'badge-success'}`}>{estado}</span></p></div>
            <div><p>Total: ${total}</p><p>IVA: ${iva}</p><p>Subtotal: ${subtotal}</p></div>
            <div><p>Método: {metodo}</p><p>Envío: {envio}</p></div>
          </div>
          {/* Acciones para cambiar el estado del pedido */}
          <div style={{display:'flex', gap:8, alignItems:'center', marginTop:12}}>
            <select value={estado} onChange={(e)=> setEstado(e.target.value)}>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-orange" onClick={save} disabled={saving}>{saving?'Guardando...':'Actualizar estado'}</button>
          </div>
        </div>
        {/* Tabla de ítems del pedido */}
        <div className="table" style={{marginBottom:12}}>
          <table style={{width:'100%'}}>
            <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
            <tbody>
              {items.length===0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:16}}>Sin ítems</td></tr> : items.map((it, idx) => (
                <tr key={it.id ?? idx}><td>{it.nombre || it.producto?.nombre || '-'}</td><td>${Number(it.precio_unitario ?? it.precio ?? 0).toFixed(2)}</td><td>{it.cantidad ?? 1}</td><td>${Number(it.subtotal ?? (Number(it.precio_unitario ?? it.precio ?? 0) * Number(it.cantidad ?? 1))).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Historial de cambios del pedido */}
        <div className="table">
          <table style={{width:'100%'}}>
            <thead><tr><th>Fecha</th><th>Acción</th><th>Previo</th><th>Nuevo</th><th>Rol</th></tr></thead>
            <tbody>
              {hist.length===0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:16}}>Sin historial</td></tr> : hist.map((h, idx) => (
                <tr key={h.id ?? idx}><td>{new Date(h.fecha ?? h.created_at ?? Date.now()).toLocaleString()}</td><td>{h.accion ?? h.action}</td><td>{h.estado_previo ?? h.from}</td><td>{h.estado_nuevo ?? h.to}</td><td>{h.rol ?? h.role}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}