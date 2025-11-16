# 🚀 DIVISIÓN DE TAREAS - FERAYTEK ADMIN DESKTOP

## 📊 **ANÁLISIS DE LA API**

### **FUNCIONALIDADES ADMIN/SUPERADMIN EN TU API:**

#### **👥 Gestión de Usuarios**
- ✅ Login: `POST /users/login`
- ✅ Listar usuarios: `GET /users`
- ✅ Ver usuario: `GET /users/profile/{id}`
- ✅ Actualizar usuario: `PUT /users/profile/cliente/{id}`
- ✅ Inhabilitar usuario: `DELETE /users/{id}`

#### **🛍️ Gestión de Productos**
- ✅ Listar productos: `GET /productos`
- ✅ Crear producto: `POST /productos`
- ✅ Actualizar producto: `PUT /productos/{id}`
- ✅ Inhabilitar producto: `DELETE /productos/{id}`
- ✅ Categorías: `GET /categorias/activas`

#### **📄 Gestión de Facturas**
- ✅ Listar facturas: `GET /facturas/admin/todas`
- ✅ Crear factura: `POST /facturas/admin`
- ✅ Marcar enviada: `PATCH /facturas/admin/{id}/marcar-enviada`
- ✅ Enviar email: `POST /facturas/admin/{id}/enviar-email`
- ✅ Generar PDF: `POST /facturas/admin/{id}/generar-pdf`
- ✅ Buscar facturas: `GET /facturas/admin/buscar?{filtros}`

#### **📦 Gestión de Pedidos**
- ✅ Listar pedidos: `GET /pedidos`
- ✅ Cambiar estado: `PUT /pedidos/{id}/estado`
- ✅ Ver envíos: `GET /envios`
- ✅ Historial: `GET /historial_pedidos`

#### **📊 Dashboard & Estadísticas**
- ✅ Stats del sistema: `GET /superadmin/system-stats`
- ✅ Stats facturas: `GET /facturas/admin/estadisticas`
- ✅ Stats categorías: `GET /categorias/stats`

#### **⚡ Solo Superadmin**
- ✅ Registrar admin: `POST /superadmin/register-admin`
- ✅ Listar admins: `GET /superadmin/admins`
- ✅ Inhabilitar admin: `PUT /superadmin/admin/{id}/status`

---

## 👥 **DIVISIÓN DE TRABAJO**

### **🔐 TÚ - MÓDULOS ASIGNADOS:**

#### **1. AUTENTICACIÓN & LOGIN**
- ✅ Login con tu API (`POST /users/login`)
- ✅ JWT token management
- ✅ Role-based access (solo admin/superadmin)
- ✅ Logout

#### **2. DASHBOARD PRINCIPAL**
- ✅ Estadísticas generales del sistema
- ✅ Cards con números clave
- ✅ Gráficos simples de ventas
- ✅ Vista rápida de actividad

#### **3. GESTIÓN DE USUARIOS**
- ✅ Lista de todos los usuarios
- ✅ CRUD usuarios clientes
- ✅ Gestión de roles (si es superadmin)
- ✅ Activar/desactivar usuarios

### **🛍️ TU COMPAÑERO - MÓDULOS ASIGNADOS:**

#### **1. GESTIÓN DE PRODUCTOS**
- ✅ Catálogo de productos completo
- ✅ CRUD productos
- ✅ Gestión de categorías
- ✅ Control de stock
- ✅ Alertas de stock bajo

#### **2. GESTIÓN DE FACTURAS**
- ✅ Lista de facturas
- ✅ Crear nueva factura
- ✅ Enviar factura por email
- ✅ Generar PDF
- ✅ Búsqueda y filtros

#### **3. GESTIÓN DE PEDIDOS**
- ✅ Lista de pedidos
- ✅ Cambiar estados de pedido
- ✅ Gestión de envíos
- ✅ Tracking de pedidos
- ✅ Historial de cambios

---

## 📁 **ESTRUCTURA BASE SIMPLE**

```
src/
├── components/
│   ├── Login.js              # ✅ TÚ - Login básico
│   ├── Dashboard.js          # ✅ TÚ - Dashboard con stats
│   ├── Usuarios.js           # ✅ TÚ - Gestión usuarios
│   ├── Productos.js          # 🔄 COMPAÑERO - Productos
│   ├── Facturas.js           # 🔄 COMPAÑERO - Facturas
│   ├── Pedidos.js            # 🔄 COMPAÑERO - Pedidos
│   └── Layout.js             # ✅ COMPARTIDO - Layout
├── services/
│   ├── api.js                # ✅ COMPARTIDO - Cliente API
│   ├── authService.js        # ✅ TÚ - Servicios auth
│   ├── productosService.js   # 🔄 COMPAÑERO
│   ├── facturasService.js    # 🔄 COMPAÑERO
│   └── pedidosService.js     # 🔄 COMPAÑERO
├── context/
│   └── AuthContext.js        # ✅ TÚ - Contexto auth
└── App.js                    # ✅ COMPARTIDO - App principal
```

---

## 🎯 **TAREAS INMEDIATAS**

### **TÚ - EMPEZAR HOY:**

#### **Día 1: Login Funcional**
```javascript
// Crear Login.js basico
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && (data.user.rol === 'admin' || data.user.rol === 'superadmin')) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        alert('Acceso denegado');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Feraytek Admin</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### **Día 2: Dashboard con Stats**
```javascript
// Crear Dashboard.js
import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/superadmin/system-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando estadísticas...</div>;

  return (
    <div>
      <h1>Dashboard Feraytek</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Usuarios</h3>
          <div className="stat-number">{stats?.total_usuarios || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Productos</h3>
          <div className="stat-number">{stats?.total_productos || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Facturas</h3>
          <div className="stat-number">{stats?.total_facturas || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Pedidos Pendientes</h3>
          <div className="stat-number">{stats?.pedidos_pendientes || 0}</div>
        </div>
      </div>
    </div>
  );
}
```

#### **Día 3: Lista de Usuarios**
```javascript
// Crear Usuarios.js
import React, { useState, useEffect } from 'react';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(usuario => (
            <tr key={usuario.id}>
              <td>{usuario.nombre} {usuario.apellido}</td>
              <td>{usuario.email}</td>
              <td>{usuario.rol}</td>
              <td>{usuario.estado}</td>
              <td>
                <button>Editar</button>
                <button style={{marginLeft: '10px', background: '#e74c3c'}}>
                  Desactivar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### **TU COMPAÑERO - EMPIEZA CON:**

#### **Día 1-2: Productos**
- Crear `Productos.js` con tabla de productos
- Conectar con `GET /productos`
- Formulario para nuevo producto
- Conectar con `POST /productos`

#### **Día 3-4: Facturas**
- Crear `Facturas.js` con lista
- Formulario de nueva factura
- Integración con email y PDF

#### **Día 5: Pedidos**
- Crear `Pedidos.js` con tabla
- Sistema de cambio de estados
- Vista de envíos

---

## 🚀 **PARA EMPEZAR:**

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar app
npm run electron-dev

# 3. Tu API debe estar corriendo en:
# http://localhost:3000
```

## 📋 **ARCHIVOS QUE TENÉS QUE CREAR:**

### **TÚ:**
1. `src/components/Login.js`
2. `src/components/Dashboard.js`
3. `src/components/Usuarios.js`
4. `src/context/AuthContext.js`

### **COMPAÑERO:**
1. `src/components/Productos.js`
2. `src/components/Facturas.js`
3. `src/components/Pedidos.js`

---

## ✅ **LISTO PARA CODEAR!**

**¿Empezás con el Login o querés que te ayude con algo específico?**

**¿Tu compañero ya sabe qué tiene que hacer?**