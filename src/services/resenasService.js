// =====================================================================
// Reseñas Service (Frontend)
// Consume endpoints locales para reseñas de productos
// =====================================================================

const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const resenasService = {
  async crear(payload) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/resenas`, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al crear reseña'); return j
  },
  async listar() {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/resenas`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al listar reseñas'); return Array.isArray(j?.data)? j.data : (Array.isArray(j)? j : [])
  },
  async obtener(id) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/resenas/obtener?id=${encodeURIComponent(id)}`, { headers: token?{ Authorization:`Bearer ${token}` }:{} })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al obtener reseña'); return j?.data ?? j
  },
  async actualizar(id, payload) {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/resenas/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(payload) })
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Error al actualizar reseña'); return j
  }
}