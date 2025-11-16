import React, { useEffect, useState } from 'react'
import { enviosService } from '../../services/enviosService'

export default function EnviosPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const j = await enviosService.listar()
      setItems(Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []))
    } catch (e) { setError(e.message || 'Error al listar envios') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Envios</h2>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={cargar}>Actualizar</button>
        </div>
      </div>

      {error && <div className="error-box" style={{marginTop:8}}>{error}</div>}
      {loading ? <div>Cargando envios...</div> : (
        <div className="table" style={{marginTop:12}}>
          <table style={{width:'100%'}}>
            <thead>
              <tr>
                <th>ID Envio</th>
                <th>ID Pedido</th>
                <th>Destinatario</th>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th>Provincia</th>
                <th>Estado</th>
                <th>Fecha envio</th>
                <th>Fecha entrega</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 ? (
                <tr><td colSpan="9" style={{textAlign:'center', padding:20}}>No hay envios</td></tr>
              ) : items.map(e => (
                <tr key={e.id_envio ?? e.id ?? (e.id_pedido+'-'+e.estado_envio)}>
                  <td>{e.id_envio ?? e.id}</td>
                  <td>{e.id_pedido ?? '-'}</td>
                  <td>{e.destinatario ?? '-'}</td>
                  <td>{e.direccion_envio ?? '-'}</td>
                  <td>{e.ciudad ?? '-'}</td>
                  <td>{e.provincia ?? '-'}</td>
                  <td>{e.estado_envio ?? '-'}</td>
                  <td>{e.fecha_envio ? new Date(e.fecha_envio).toLocaleString() : '-'}</td>
                  <td>{e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}