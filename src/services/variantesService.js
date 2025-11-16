import axios from 'axios'

// Servicio de Variantes de Producto
// - CRUD de variantes con validación local para creación/edición.
// - Asegura que no se agreguen variantes si el producto no existe.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

const client = axios.create({ baseURL: API_BASE })
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

export const variantesService = {
  // Lista variantes
  listar: async () => {
    const { data } = await client.get('/variantes')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  // Obtiene una variante
  obtener: async (id) => {
    const { data } = await client.get(`/variantes/${id}`)
    return data?.data ?? data
  },
  // Crea variante: validador local
  crear: async (payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/variantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload)
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  // Actualiza variante
  actualizar: async (id, payload) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/validator/variantes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload)
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.error || 'Error de validación')
    return j?.data ?? j
  },
  // Elimina variante
  eliminar: async (id) => {
    const { data } = await client.delete(`/variantes/${id}`)
    return data?.data ?? data
  }
}