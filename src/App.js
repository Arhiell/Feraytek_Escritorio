import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Contexto de autenticación
export const AuthContext = React.createContext();

// Componente principal
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay usuario en sessionStorage
    const savedUser = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/*" 
              element={
                user ? (
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/productos" element={<Productos />} />
                      <Route path="/facturas" element={<Facturas />} />
                      <Route path="/pedidos" element={<Pedidos />} />
                      <Route path="/usuarios" element={<Usuarios />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

// Login
function Login() {
  const { login } = React.useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (_) {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        // Verificar que sea admin o superadmin
        if (data.user && (data.user.rol === 'admin' || data.user.rol === 'superadmin')) {
          login(data.user, data.token);
        } else {
          setError('Usuario no autenticado o sin permisos');
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          setError('Usuario no autenticado o sin permisos');
        } else {
          setError(data?.message || data?.error || 'Error al iniciar sesión');
        }
      }
    } catch (error) {
      setError('Error de conexión con la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Feraytek Admin</h2>
        <p>Inicia sesión en tu panel de administración</p>
        
        {error && <div className="error-box">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email o nombre de usuario:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              placeholder="email@feraytek.com o usuario123"
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="login-hint">Demo: admin@feraytek.com / cualquier contraseña</div>
      </div>
    </div>
  );
}

// Layout principal
function Layout({ children }) {
  const { user, logout } = React.useContext(AuthContext);
  
  return (
    <div className="app-container">
      <nav className="sidebar">
        <h3 style={{color: 'white', marginBottom: '30px'}}>Feraytek Admin</h3>
        <ul className="nav-menu">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/productos">Productos</Link></li>
          <li><Link to="/facturas">Facturas</Link></li>
          <li><Link to="/pedidos">Pedidos</Link></li>
          {user?.rol === 'superadmin' && <li><Link to="/usuarios">Usuarios</Link></li>}
        </ul>
        
        <div style={{marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #34495e'}}>
          <p style={{color: '#bdc3c7', fontSize: '14px'}}>
            {user?.nombre} {user?.apellido}
          </p>
          <p style={{color: '#95a5a6', fontSize: '12px'}}>{user?.rol}</p>
          <button onClick={logout} className="btn" style={{marginTop: '10px', background: '#e74c3c', color: 'white'}}>
            Cerrar Sesión
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

// Páginas principales
function Dashboard() {
  const { user } = React.useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [yearMonth, setYearMonth] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  });

  useEffect(() => {
    const fetchStats = async () => {
      setStatsError('');
      setStatsLoading(true);
      const token = sessionStorage.getItem('token');
      try {
        const endpoint = user?.rol === 'superadmin'
          ? `${API_BASE}/superadmin/system-stats`
          : `${API_BASE}/facturas/admin/estadisticas`;
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        });
        let raw;
        try {
          raw = await res.json();
        } catch (_) {
          const t = await res.text();
          raw = { message: t };
        }
        if (res.ok) {
          let normalized = normalizeStats(raw);
          const hdr = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
          const fetchArr = async (url) => {
            const r = await fetch(url, { headers: hdr });
            let j; try { j = await r.json(); } catch { j = {}; }
            return extractArray(j, ['data', 'users', 'result', 'results', 'items']);
          };
          const tasks = [];
          if (!(normalized.total_usuarios > 0)) tasks.push(fetchArr(`${API_BASE}/users`).then(a => { normalized.total_usuarios = a.length; }));
          if (!(normalized.total_productos > 0)) tasks.push(fetchArr(`${API_BASE}/productos`).then(a => { normalized.total_productos = a.length; }));
          if (!(normalized.total_facturas > 0)) tasks.push(fetchArr(`${API_BASE}/facturas/admin/todas`).then(a => { normalized.total_facturas = a.length; }));
          if (!(normalized.pedidos_pendientes > 0)) tasks.push(fetchArr(`${API_BASE}/pedidos`).then(a => { normalized.pedidos_pendientes = a.length; }));
          const [yy, mm] = yearMonth.split('-');
          tasks.push((async () => {
            const url = `${API_BASE}/admin/stats/revenue-month?year=${yy}&month=${mm}`;
            const r = await fetch(url, { headers: hdr });
            let j; try { j = await r.json(); } catch { j = {}; }
            const rawVal = j?.ingresos_mes ?? j?.ingresos ?? j?.monto ?? j?.total ?? j?.revenue;
            const numVal = typeof rawVal === 'string' ? parseFloat(rawVal) : (typeof rawVal === 'number' ? rawVal : null);
            if (numVal != null && numVal > 0) { normalized.ingresos_mes = numVal; return; }
            const start = `${yearMonth}-01`;
            const endDate = new Date(parseInt(yy), parseInt(mm), 0).getDate();
            const end = `${yy}-${mm}-${String(endDate).padStart(2, '0')}`;
            const r2 = await fetch(`${API_BASE}/facturas/admin/buscar?fecha_inicio=${start}&fecha_fin=${end}`, { headers: hdr });
            let j2; try { j2 = await r2.json(); } catch { j2 = {}; }
            const arr = extractArray(j2, ['data', 'facturas', 'result', 'results', 'items']);
            const sum = sumAmounts(arr);
            if (!isNaN(sum)) normalized.ingresos_mes = sum;
          })());
          if (tasks.length) await Promise.allSettled(tasks);
          setStats(normalized);
        } else {
          if (res.status === 401 || res.status === 403) {
            setStatsError('Sin permisos para ver estadísticas');
          } else {
            setStatsError(raw?.message || raw?.error || 'Error al cargar estadísticas');
          }
        }
      } catch (e) {
        setStatsError('Error de conexión con la API');
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user?.rol, yearMonth]);

  const normalizeStats = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const fromRoot = {
      total_usuarios: raw.total_usuarios ?? raw.users_count ?? raw.usuarios ?? 0,
      total_productos: raw.total_productos ?? raw.productos ?? raw.products_count ?? 0,
      total_facturas: raw.total_facturas ?? raw.facturas ?? raw.invoices_count ?? 0,
      pedidos_pendientes: raw.pedidos_pendientes ?? raw.pedidos ?? raw.orders_pending ?? 0,
      ingresos_mes: raw.ingresos_mes ?? raw.ingresos ?? raw.sales_month ?? 0,
    };
    const fromData = raw.data && typeof raw.data === 'object' ? {
      total_usuarios: raw.data.total_usuarios ?? raw.data.users_count ?? fromRoot.total_usuarios,
      total_productos: raw.data.total_productos ?? raw.data.productos ?? raw.data.products_count ?? fromRoot.total_productos,
      total_facturas: raw.data.total_facturas ?? raw.data.facturas ?? raw.data.invoices_count ?? fromRoot.total_facturas,
      pedidos_pendientes: raw.data.pedidos_pendientes ?? raw.data.pedidos ?? raw.data.orders_pending ?? fromRoot.pedidos_pendientes,
      ingresos_mes: raw.data.ingresos_mes ?? raw.data.ingresos ?? raw.data.sales_month ?? fromRoot.ingresos_mes,
    } : fromRoot;
    return fromData;
  };

  const extractArray = (raw, keys) => {
    if (Array.isArray(raw)) return raw;
    for (const k of keys) {
      const v = raw?.[k];
      if (Array.isArray(v)) return v;
    }
    if (raw && typeof raw === 'object') {
      const maybe = Object.values(raw).find(v => Array.isArray(v));
      if (Array.isArray(maybe)) return maybe;
    }
    return [];
  };

  const sumAmounts = (arr) => {
    if (!Array.isArray(arr)) return 0;
    const amountKeys = ['total', 'monto', 'importe_total', 'precio_total', 'amount', 'subtotal', 'valor', 'precio', 'importe'];
    const readValue = (obj) => {
      for (const k of amountKeys) {
        const v = obj?.[k];
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && !isNaN(parseFloat(v))) return parseFloat(v);
      }
      // buscar en nivel 1 anidado
      if (obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          const v = obj[key];
          if (v && typeof v === 'object') {
            const nested = readValue(v);
            if (typeof nested === 'number') return nested;
          }
        }
      }
      return 0;
    };
    return arr.reduce((acc, item) => acc + readValue(item), 0);
  };
  
  const displayName = (user?.nombre && user?.apellido)
    ? `${user.nombre} ${user.apellido}`
    : (user?.nombre_usuario || user?.username || user?.email || '');

  return (
    <div>
      <h1>Bienvenido, {displayName}!</h1>
      <p>Panel de administración Feraytek</p>
      <div className="card" style={{marginBottom: 16}}>
        <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <input type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
          <button className="btn" onClick={() => setYearMonth(yearMonth)}>Actualizar</button>
        </div>
      </div>
      
      {statsLoading && <div>Cargando estadísticas...</div>}
      {statsError && <div className="error-box">{statsError}</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Productos</h3>
          <div className="stat-number">{stats?.total_productos ?? 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Facturas</h3>
          <div className="stat-number">{stats?.total_facturas ?? 0}</div>
        </div>
        <div className="stat-card">
          <h3>Pedidos Pendientes</h3>
          <div className="stat-number">{stats?.pedidos_pendientes ?? 0}</div>
        </div>
        <div className="stat-card">
          <h3>Ingresos del Mes</h3>
          <div className="stat-number">{stats?.ingresos_mes != null ? `$${stats.ingresos_mes}` : '$0'}</div>
        </div>
        <div className="stat-card">
          <h3>Total Usuarios</h3>
          <div className="stat-number">{stats?.total_usuarios ?? 0}</div>
        </div>
      </div>
    </div>
  );
}

function Productos() {
  return (
    <div>
      <h1>Gestión de Productos</h1>
      <p>Acá va el módulo de productos que hace tu compañero</p>
      {/* Tu compañero implementa esto */}
    </div>
  );
}

function Facturas() {
  return (
    <div>
      <h1>Gestión de Facturas</h1>
      <p>Acá va el módulo de facturas que hace tu compañero</p>
      {/* Tu compañero implementa esto */}
    </div>
  );
}

function Pedidos() {
  return (
    <div>
      <h1>Gestión de Pedidos</h1>
      <p>Acá va el módulo de pedidos que hace tu compañero</p>
      {/* Tu compañero implementa esto */}
    </div>
  );
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadUsuarios = async () => {
    setError('');
    setLoading(true);
    const token = sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      let raw;
      try {
        raw = await res.json();
      } catch (_) {
        const t = await res.text();
        raw = { message: t };
      }
      if (res.ok) {
        const arr = extractArray(raw, ['users', 'data', 'result', 'results']);
        setUsuarios(arr);
      } else {
        if (res.status === 401 || res.status === 403) {
          setError('Sin permisos para ver usuarios');
        } else {
          setError(raw?.message || raw?.error || 'Error al cargar usuarios');
        }
      }
    } catch (e) {
      setError('Error de conexión con la API');
    } finally {
      setLoading(false);
    }
  };

  const getUsuarioId = (u) => u?.id ?? u?.id_usuario ?? u?.user_id ?? u?.idCliente ?? u?.idClienteUsuario;

  const desactivarUsuario = async (u) => {
    const token = sessionStorage.getItem('token');
    const id = getUsuarioId(u);
    try {
      const resStatus = await fetch(`${API_BASE}/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'inactivo' })
      });
      if (resStatus.ok) { await loadUsuarios(); return; }

      const alt = await fetch(`${API_BASE}/users/profile/cliente/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'inactivo' })
      });
      if (alt.ok) { await loadUsuarios(); return; }

      const resDel = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (resDel.ok) { await loadUsuarios(); return; }

      let errText = 'No se pudo desactivar';
      try { const j = await resStatus.json(); errText = j?.message || j?.error || errText; } catch {}
      setError(errText);
    } catch (_) {
      setError('Error de conexión con la API');
    }
  };

  const activarUsuario = async (u) => {
    const token = sessionStorage.getItem('token');
    const id = getUsuarioId(u);
    try {
      const resStatus = await fetch(`${API_BASE}/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'activo' })
      });
      if (resStatus.ok) { await loadUsuarios(); return; }
      const alt = await fetch(`${API_BASE}/users/profile/cliente/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'activo' })
      });
      if (alt.ok) { await loadUsuarios(); return; }
      let errText = 'No se pudo activar';
      try { const j = await resStatus.json(); errText = j?.message || j?.error || errText; } catch {}
      setError(errText);
    } catch (_) {
      setError('Error de conexión con la API');
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const filtered = usuarios.filter(u => {
    const t = `${u.nombre || ''} ${u.apellido || ''} ${u.email || ''} ${u.nombre_usuario || ''}`.toLowerCase();
    return t.includes(query.toLowerCase());
  });

  const extractArray = (raw, keys) => {
    if (Array.isArray(raw)) return raw;
    for (const k of keys) {
      const v = raw?.[k];
      if (Array.isArray(v)) return v;
    }
    if (raw && typeof raw === 'object') {
      const maybe = Object.values(raw).find(v => Array.isArray(v));
      if (Array.isArray(maybe)) return maybe;
    }
    return [];
  };

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      {error && <div className="error-box" style={{marginTop: 10}}>{error}</div>}
      <div className="card" style={{marginTop: 16}}>
        <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <input
            type="text"
            placeholder="Buscar por nombre, email o usuario"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{flex: 1}}
          />
          <button className="btn" onClick={loadUsuarios}>Actualizar</button>
        </div>
      </div>

      {loading ? (
        <div>Cargando usuarios...</div>
      ) : (
        <div className="table">
          <table style={{width: '100%'}}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: 20}}>Sin resultados</td>
                </tr>
              ) : (
                filtered.map((u, idx) => (
                  <tr key={getUsuarioId(u) ?? u.email ?? u.nombre_usuario ?? idx}>
                    <td>{(u.nombre && u.apellido) ? `${u.nombre} ${u.apellido}` : (u.nombre_usuario || u.username || u.email || '')}</td>
                    <td>{u.email}</td>
                    <td>{u.nombre_usuario || '-'}</td>
                    <td>{u.rol}</td>
                    <td>
                      <span className={`badge ${u.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                        {u.estado || 'desactivado'}
                      </span>
                    </td>
                    <td>
                      {u.estado === 'activo' ? (
                        <button className="btn" onClick={() => desactivarUsuario(u)} style={{background: '#7f1d1d', color: 'white'}}>Desactivar</button>
                      ) : (
                        <button className="btn" onClick={() => activarUsuario(u)} style={{background: '#065f46', color: 'white'}}>Activar</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;