# Admin Desktop App

Aplicación de escritorio para administradores y superadmin construida con Electron y React.

## 🚀 Tecnologías

- **Electron** - Framework para apps de escritorio
- **React** - Biblioteca de interfaz de usuario
- **TypeScript** - Superset de JavaScript con tipado estático
- **Tailwind CSS** - Framework de CSS utility-first
- **Zustand** - Gestión de estado ligera
- **React Router** - Enrutamiento para React

## 📋 Requisitos previos

- Node.js (v16 o superior)
- npm o pnpm

## 🔧 Instalación

1. Clona el repositorio
2. Instala las dependencias:
```bash
npm install
```

## 🏃‍♂️ Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
# Inicia React y Electron simultáneamente
npm run electron-dev
```

Esto iniciará:
- Servidor de desarrollo de React en http://localhost:3000
- Aplicación Electron que se conecta automáticamente

## 📦 Construcción

Para crear una versión de producción:

```bash
# Construye la aplicación
npm run build

# Empaqueta para tu sistema operativo
npm run dist

# O específicamente para:
npm run dist-win  # Windows
npm run dist-mac  # macOS
npm run dist-linux # Linux
```

## 🎯 Características

- ✅ Autenticación de usuarios (admin/superadmin)
- ✅ Panel de control con estadísticas
- ✅ Gestión de usuarios (CRUD)
- ✅ Configuración de perfil
- ✅ Interfaz responsive
- ✅ Temas claro/oscuro
- ✅ Notificaciones integradas

## 🔐 Roles de usuario

### Admin
- Acceso al dashboard
- Gestión básica de usuarios
- Configuración de perfil

### Superadmin
- Todos los permisos de admin
- Crear/editar/eliminar usuarios
- Acceso completo a configuraciones

## 🔗 Integración con API

Para conectar con tu API existente:

1. Actualiza la URL base en `src/utils/api.ts`:
```typescript
const API_BASE_URL = 'https://tu-api.com/api';
```

2. Modifica el store de autenticación en `src/stores/authStore.ts` para usar tus endpoints reales.

## 📁 Estructura del proyecto

```
src/
├── components/          # Componentes React reutilizables
├── pages/              # Vistas/páginas de la aplicación
├── stores/             # Estado global con Zustand
├── utils/              # Funciones de utilidad
├── App.tsx             # Componente principal
└── index.tsx           # Punto de entrada de React

public/
├── electron.js         # Configuración principal de Electron
├── preload.js          # API segura entre procesos
└── index.html          # Archivo HTML principal
```

## 🚀 Próximos pasos

1. **Conectar con tu API**: Reemplaza los datos mock con llamadas reales a tu backend
2. **Personalizar**: Adapta los colores, logos y textos a tu marca
3. **Agregar funcionalidades**: Implementa las características específicas de tu negocio
4. **Testing**: Agrega pruebas unitarias y de integración
5. **Despliegue**: Configura CI/CD para builds automáticos

## 📝 Notas

- La aplicación usa datos mock para demostración
- Asegúrate de configurar correctamente las variables de entorno
- Revisa la seguridad antes de desplegar a producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.