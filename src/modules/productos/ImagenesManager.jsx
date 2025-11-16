import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { imagenesService } from '../../services/imagenesService'

// Gestión de imágenes (URL y archivos locales) para productos
export default function ImagenesManager({ imagenes, productoId, onChanged }) {
  const [local, setLocal] = useState(imagenes || [])
  const [form, setForm] = useState({ url_imagen:'', posicion:'1', alt_text:'', id_variante:'', file:null, files:[] })
  const [error, setError] = useState('')
  const [source, setSource] = useState('url')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { setLocal(imagenes || []) }, [imagenes])
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const numSanitize = (name, val) => setForm(f => ({ ...f, [name]: val.replace(/[^0-9]/g, '') }))

  useEffect(() => {
    const taken = new Set((local||[]).map(i => Number(i.posicion)))
    const next = [1,2,3].find(p => !taken.has(p)) || 1
    setForm(f => ({ ...f, posicion: String(next) }))
  }, [local])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return
    if (local.length >= 3) { setError('Máximo permitido: 3 imágenes'); return }
    setSource('file')
    setForm(f => ({ ...f, files: files.slice(0, 3 - local.length), file: files[0] || null }))
  }

  const save = async () => {
    setError('')
    if (local.length >= 3) { setError('Máximo permitido: 3 imágenes'); return }
    if (!productoId) { setError('Falta el identificador del producto'); return }
    const pos = Number(form.posicion || '0')
    if (!Number.isFinite(pos) || pos < 1 || pos > 3) { setError('Posición debe ser 1, 2 o 3'); return }
    if (!form.alt_text.trim()) { setError('Alt text es obligatorio'); return }
    try {
      if (source === 'file' && (form.files?.length || form.file)) {
        if (form.files && form.files.length > 1) {
          await imagenesService.crearArchivos(productoId, form.alt_text || (form.file?.name || 'Imagen'), form.files, form.id_variante ? Number(form.id_variante) : undefined)
        } else {
          await imagenesService.crearArchivo(productoId, pos, form.alt_text, form.file, form.id_variante ? Number(form.id_variante) : undefined)
        }
      } else {
        if (!form.url_imagen) { setError('Debe ingresar URL válida o seleccionar archivo'); return }
        await imagenesService.crearUrl({ url_imagen: form.url_imagen, posicion: pos, alt_text: form.alt_text, id_producto: productoId, id_variante: form.id_variante ? Number(form.id_variante) : undefined })
      }
      toast.success('Imagen agregada')
      setForm({ url_imagen:'', posicion:'1', alt_text:'', id_variante:'', file:null, files:[] })
      await onChanged()
    } catch (e) { toast.error(e?.message || 'Error al agregar imagen') }
  }

  const remove = async (img) => {
    try { await imagenesService.eliminar(img.id ?? img.id_imagen); toast.success('Imagen eliminada'); await onChanged() } catch { toast.error('No se pudo eliminar imagen') }
  }

  return (
    <div>
      {error && <div className="error-box" style={{marginBottom:8}}>{error}</div>}
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:8}}>
          <select value={source} onChange={(e)=> setSource(e.target.value)} disabled={local.length>=3}>
            <option value="url">Usar URL</option>
            <option value="file">Subir archivo</option>
          </select>
          {source==='url' ? (
            <input name="url_imagen" placeholder="URL imagen" value={form.url_imagen} onChange={handleChange} />
          ) : (
            <div className={`dropzone ${dragging?'dragging':''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={()=> fileInputRef.current && fileInputRef.current.click()}>
              {form.files && form.files.length>0 ? (`${form.files.length} archivo(s) listo(s)`) : (form.file ? (form.file.name) : ('Arrastra aquí la imagen o haz click para seleccionar'))}
              <input ref={fileInputRef} name="file" type="file" accept="image/*" multiple onChange={(e)=> {
                const arr = Array.from(e.target.files || [])
                setForm(f => ({ ...f, files: arr.slice(0, 3 - local.length), file: arr[0] || null }))
              }} style={{display:'none'}} />
            </div>
          )}
          <input name="posicion" inputMode="numeric" placeholder="Posición" value={form.posicion} onChange={(e)=>numSanitize('posicion', e.target.value)} />
          <input name="alt_text" placeholder="Alt text" value={form.alt_text} onChange={handleChange} />
          <input name="id_variante" inputMode="numeric" placeholder="ID variante (opcional)" value={form.id_variante} onChange={(e)=> setForm(f => ({ ...f, id_variante: e.target.value.replace(/[^0-9]/g, '') })) } />
          {source==='file' && <button className="btn btn-view" onClick={()=> fileInputRef.current && fileInputRef.current.click()}>Seleccionar archivo(s)</button>}
          <button className="btn btn-orange" onClick={save}>{source==='file' ? (form.files && form.files.length>1 ? 'Guardar archivos' : 'Guardar archivo') : 'Agregar URL'}</button>
        </div>
        <div style={{marginTop:8, color:'#FF7A00'}}>{local.length}/3 imágenes</div>
      </div>
      <div className="table">
        <table style={{width:'100%'}}>
          <thead><tr><th>URL</th><th>Posición</th><th>Alt</th><th>Acciones</th></tr></thead>
          <tbody>
            {local.length===0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:20}}>Sin imágenes</td></tr> : local.map(img => (
              <tr key={img.id ?? img.id_imagen}><td>{img.url_imagen}</td><td>{img.posicion}</td><td>{img.alt_text}</td><td>
                <div className="actions">
                  <a href={img.url_imagen} target="_blank" rel="noreferrer" className="btn btn-view">Abrir</a>
                  <button className="btn btn-delete" onClick={()=>remove(img)}>Eliminar</button>
                </div>
              </td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}