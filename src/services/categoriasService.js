import axios from 'axios'

// Servicio de Categorías
// - Lectura de categorías activas, todas y detalle por ID.
// - Normaliza respuestas y agrega token desde sessionStorage.

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

const client = axios.create({ baseURL: API_BASE })
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

export const categoriasService = {
  // Categorías activas
  activas: async () => {
    const { data } = await client.get('/categorias/activas')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  // Todas las categorías
  todas: async () => {
    const { data } = await client.get('/categorias')
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (Array.isArray(data?.result) ? data.result : []))
  },
  // Detalle por ID
  obtener: async (id) => {
    const { data } = await client.get(`/categorias/${id}`)
    return data?.data ?? data
  }
}