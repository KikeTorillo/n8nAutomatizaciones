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

### 🎯 FLUJOS EMPRESARIALES (Casos de Uso Reales)

#### 🏗️ **00-Setup-Sistema/** - Verificación Inicial
Flujo completo de verificación del sistema SaaS:
1. **01 - Login Super Admin** - Autenticación administrador
2. **02 - Health Check Sistema** - Estado de infraestructura
3. **03 - Verificar Plantillas Servicios** - Catálogo de 370+ servicios
4. **04 - Verificar Infraestructura Docker** - Estado contenedores

#### 🏪 **01-Flujo-Barberia-Completo/** - Caso de Uso: Barbería
Flujo completo desde setup hasta operaciones diarias:
1. **01 - Setup Organización Barbería** - Crear "Barbería El Clásico"
2. **02 - Crear Usuario Manager Barbería** - Manager: Carlos Rodríguez
3. **03 - Login Manager Barbería** - Autenticación manager
4. **04 - Crear Barberos** - Juan Carlos (barbero)
5. **05 - Crear Segundo Barbero** - Miguel (estilista_masculino)
6. **06 - Crear Clientes Barbería** - Andrés (cliente regular)
7. **07 - Crear Cliente VIP** - Ricardo (cliente VIP)
8. **08 - Operaciones Diarias** - Resumen operacional completo

#### 🛡️ **04-Testing-Multi-Tenant/** - Validación Crítica
Validación exhaustiva del sistema multi-tenant enterprise:
1. **01 - Test Aislamiento Organizaciones** - RLS profesionales
2. **02 - Test Clientes Aislamiento** - RLS clientes
3. **03 - Test Permisos Super Admin** - Acceso global vs limitado
4. **04 - Test Validación Industria-Profesional** - Rechazo automático incompatibles
5. **05 - Test Acceso Negado Entre Organizaciones** - Seguridad entre tenants
6. **06 - Test Emails Únicos Por Organización** - Validación unicidad
7. **07 - Test Resumen Multi-Tenant** - Validación completa enterprise

### 🔧 ENDPOINTS TÉCNICOS (Testing Individual)

#### 🏢 **99-Endpoints-Tecnicos/** - Testing Granular por Entidad

##### 🔐 **Auth/** (11 endpoints)
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
11. **11 - Test Auth (Development)** - Prueba de autenticación

##### 🏢 **Organizaciones/** (10 endpoints)
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

##### 👥 **Profesionales/** (Super Admin - 10 endpoints)
1. **01 - Crear Profesional** - Nuevo profesional en organización
2. **02 - Listar Profesionales** - Lista con filtros y paginación
3. **03 - Obtener por ID** - Detalle específico de profesional
4. **04 - Actualizar Profesional** - Modificar datos existentes
5. **05 - Cambiar Estado** - Desactivar profesional (con motivo)
6. **06 - Buscar por Tipo** - Filtrar por tipo profesional
7. **07 - Validar Email** - Verificar disponibilidad de email
8. **08 - Eliminar Profesional** - Soft delete con motivo
9. **09 - Estadísticas Profesionales** - Métricas de profesionales
10. **10 - Activar Profesional** - Reactivar profesional

##### 👥 **Profesionales (Usuario Regular)/** (9 endpoints)
Endpoints para usuarios regulares con permisos limitados

##### 👨‍💼 **Clientes/** ✨ **NUEVO** (8 endpoints)
1. **01 - Crear Cliente** - Nuevo cliente en organización
2. **02 - Listar Clientes** - Lista con paginación
3. **03 - Obtener Cliente** - Detalle específico
4. **04 - Actualizar Cliente** - Modificar datos
5. **05 - Buscar Clientes** - Búsqueda por criterios
6. **06 - Estadísticas Clientes** - Métricas y analytics
7. **07 - Cambiar Estado Cliente** - Activar/Desactivar
8. **08 - Eliminar Cliente** - Soft delete con confirmación

##### 🩺 **Health/** (1 endpoint)
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
- `profesionalId` - ID del profesional creado (desde Profesionales/01 - Crear)

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

### 7. Gestión de Profesionales ✨ **NUEVO**
```
Login (admin) → Crear Profesional → Listar Profesionales → Obtener por ID →
Actualizar Profesional → Buscar por Tipo → Cambiar Estado → Activar → Eliminar
```

### 8. Testing y Validaciones
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