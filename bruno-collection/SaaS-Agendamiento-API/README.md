# SaaS Agendamiento - Bruno API Collection

Esta colección de Bruno contiene todos los endpoints de la API SaaS para agendamiento multi-tenant, incluyendo pruebas automatizadas y documentación completa.

## 🚀 Configuración Inicial

### 1. Instalar Bruno
```bash
# Descargar desde: https://usebruno.com/
# O usando npm
npm install -g @usebruno/cli
```

### 2. Preparar el Backend
Asegúrate de que el backend esté ejecutándose:
```bash
# Desde la raíz del proyecto
npm run dev        # Iniciar servicios Docker
cd backend/app     # Navegar al backend
npm run dev        # Iniciar servidor Node.js
```

### 3. Abrir la Colección
1. Abrir Bruno
2. File → Open Collection
3. Seleccionar la carpeta: `bruno-collection/SaaS-Agendamiento-API/`

### 4. Configurar Entorno
- **Local**: http://localhost:3000 (desarrollo) ✅ Preconfigurado
- **Production**: https://tu-dominio.com (producción) ⚠️ Configurar URL

## 📁 Estructura de la Colección

### 🔐 Autenticación (`/Auth/`)
Endpoints completos para gestión de usuarios y sesiones:

1. **01 - Login** - Iniciar sesión
2. **02 - Get Me** - Información del usuario actual
3. **03 - Register** - Registro de nuevo usuario
4. **04 - Change Password** - Cambiar contraseña
5. **05 - Update Profile** - Actualizar perfil
6. **06 - Refresh Token** - Renovar token de acceso
7. **07 - Logout** - Cerrar sesión
8. **08 - Unlock User** - Desbloquear usuario (admin)
9. **09 - Get Blocked Users** - Lista de usuarios bloqueados (admin)
10. **10 - Check User Lock Status** - Verificar estado de bloqueo
11. **11 - Test Auth (Development)** - Prueba de autenticación (solo desarrollo)

### � Organizaciones (`/Organizaciones/`)
Endpoints completos para gestión multi-tenant de organizaciones:

1. **01 - Listar Organizaciones** - Lista con paginación y filtros
2. **02 - Obtener Organización por ID** - Detalle específico
3. **03 - Crear Organización** - Nueva organización (super_admin)
4. **04 - Actualizar Organización** - Modificar datos existentes
5. **05 - Desactivar Organización** - Soft delete (super_admin)
6. **06 - Verificar Organización Desactivada** - Confirma eliminación
7. **07 - Crear Organización Datos Inválidos** - Test validaciones
8. **08 - Obtener Organización Inexistente** - Error 404
9. **09 - Test sin Autenticación** - Error 401
10. **10 - Test Paginación** - Funcionalidad de paginación

### �🏥 Gestión de Citas (`/Citas/`)
- **Get Citas** - Obtener lista de citas

### 🩺 Salud del Sistema (`/Health/`)
- **Health Check** - Verificar estado de la API

## 🔧 Variables de Entorno

### Variables Globales
```javascript
baseUrl: http://localhost:3000  // URL base de la API
accessToken: [se configura automáticamente]  // JWT token
refreshToken: [se configura automáticamente]  // Refresh token
```

### Variables Dinámicas
Las siguientes variables se configuran automáticamente:
- `accessToken` - Token JWT después del login
- `refreshToken` - Token de renovación
- `userId` - ID del usuario logueado
- `organizacionId` - ID de la organización del usuario (desde Auth)
- `newOrganizacionId` - ID de organización creada (desde Organizaciones)

## 🧪 Flujo de Testing Recomendado

### 1. Verificación del Sistema
```
Health Check → Verificar que la API está funcionando
```

### 2. Autenticación Básica
```
Login → Get Me → [otros endpoints autenticados]
```

### 3. Gestión de Usuarios (Admin)
```
Login (admin) → Get Blocked Users → Check User Lock Status → Unlock User
```

### 4. Gestión de Perfil
```
Login → Get Me → Update Profile → Change Password
```

### 6. Gestión de Organizaciones (Super Admin)
```
Login (admin) → Listar Organizaciones → Crear Organización → Actualizar → Desactivar
```

### 7. Testing y Validaciones
```
Test sin Autenticación → Crear con Datos Inválidos → Obtener Inexistente → Test Paginación
```

## 🔐 Credenciales de Prueba

### Super Administrador
```json
{
  "email": "admin@saas-agendamiento.com",
  "password": "admin123"
}
```

### Usuario de Prueba (si está configurado)
```json
{
  "email": "test@ejemplo.com",
  "password": "test123456"
}
```

## ✅ Tests Automatizados

Cada endpoint incluye tests automatizados que verifican:

### Tests Básicos
- Status code correcto (200, 201, etc.)
- Estructura de respuesta válida
- Propiedades requeridas presentes

### Tests de Seguridad
- Autenticación requerida donde corresponde
- Validación de permisos
- Rate limiting funcional

### Tests de Datos
- Tipos de datos correctos
- Validaciones de campos
- Integridad referencial

## 📊 Monitoreo y Debugging

### Variables Post-Response
Cada request guarda variables útiles para debugging:
- `authWorking` - Estado de autenticación
- `userInfo` - Información del usuario
- `tenantInfo` - Contexto multi-tenant

### Logging
Revisa los logs del backend en:
```bash
cd backend/app
ls logs/
# app.log, error.log, exceptions.log, rejections.log
```

## 🔄 Rate Limiting

La API implementa rate limiting con diferentes límites:
- **Auth endpoints**: 5 requests/minuto
- **API general**: 100 requests/minuto
- **Operaciones pesadas**: 10 requests/minuto

## 🚨 Troubleshooting

### Error 401 - No Autorizado
1. Verificar que el token está configurado
2. Ejecutar Login para obtener nuevo token
3. Verificar que el token no ha expirado

### Error 403 - Sin Permisos
1. Verificar rol del usuario
2. Usar credenciales de administrador si es necesario
3. Verificar contexto multi-tenant

### Error 429 - Rate Limit
1. Esperar el tiempo de cooldown
2. Verificar logs del backend
3. Considerar usar rate limiting menos agresivo en desarrollo

### Error 404 - Endpoint No Encontrado
1. Verificar que el backend está ejecutándose
2. Verificar la URL base en el entorno
3. Para `/test-auth`, verificar que NODE_ENV !== 'production'

## 🎯 Próximos Endpoints Planificados

A medida que se desarrollen más controllers en el backend, se agregarán:

### 👨‍⚕️ Profesionales (`/Profesionales/`)
- CRUD de profesionales
- Asignar especialidades
- Gestionar disponibilidad

### 🛠️ Servicios (`/Servicios/`)
- Catálogo de servicios
- Precios y duración
- Categorías por industria

### 👥 Clientes (`/Clientes/`)
- Gestión de clientes
- Historial de citas
- Comunicación multi-canal

### 📅 Citas (`/Citas/`) - Expandir
- Agendar citas
- Disponibilidad en tiempo real
- Gestión de excepciones

## 🔗 Enlaces Útiles

- [Documentación del Backend](../../backend/README.md)
- [Guía de Desarrollo](../../CLAUDE.md)
- [Bruno Documentation](https://docs.usebruno.com/)
- [Base de Datos Schema](../../sql/02-saas-schema.sql)

## 📝 Notas de Desarrollo

### Añadir Nuevos Endpoints
1. Crear archivo `.bru` en la carpeta correspondiente
2. Seguir el patrón de naming: `NN - Nombre Descriptivo.bru`
3. Incluir tests y documentación
4. Actualizar este README

### Variables Personalizadas
```javascript
// En vars:pre-request
targetUserId: 2  // ID de usuario para testing

// En vars:post-response
responseData: res.body.data  // Guardar datos de respuesta
```

### Tests Personalizados
```javascript
test("Custom validation", function() {
  const data = res.getBody().data;
  expect(data).to.have.property('custom_field');
  expect(data.custom_field).to.be.a('string');
});
```

### Estructura de Archivos Recomendada
```
SaaS-Agendamiento-API/
├── Auth/              ✅ Completo (11 endpoints)
├── Health/            ✅ Básico
├── Organizaciones/    🔄 Próximamente
├── Profesionales/     🔄 Próximamente
├── Servicios/         🔄 Próximamente
├── Clientes/          🔄 Próximamente
├── Citas/             🔄 En desarrollo
└── environments/      ✅ Configurado
```