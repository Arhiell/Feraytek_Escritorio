const LOCAL_BACKEND = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://localhost:4001'

export const enviosService = {
  listar: async () => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al listar envios')
    return j
  },
  obtener: async (id) => {
    const token = sessionStorage.getItem('token')
    const res = await fetch(`${LOCAL_BACKEND}/envios/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const j = await res.json()
    if (!res.ok) throw new Error(j?.message || j?.error || 'Error al obtener envio')
    return j?.data ?? j
  },
}