# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual del Proyecto

**Última verificación**: 24 Noviembre 2025

| Componente | Estado | Métricas Reales |
|------------|--------|-----------------|
| **Backend API** | ✅ Operativo | 40 controllers, 226 endpoints, 32 models, 7 middleware |
| **Frontend React** | ✅ Operativo | 99 componentes, 43 páginas, 23 hooks TanStack Query |
| **Base de Datos** | ✅ Optimizada | 18 módulos SQL, 97 archivos, 3 tablas particionadas, 76+ RLS |
| **Sistema IA** | ✅ Operativo | 7 MCP tools, Telegram + WhatsApp, DeepSeek Chat |
| **Marketplace** | ✅ 100% | Backend + Frontend + Agendamiento Público sin auth |
| **Comisiones** | ✅ Operativo | Cálculo automático trigger, 12 endpoints, Dashboard |
| **Inventario** | ✅ Operativo | 7 tablas (1 particionada), 33 endpoints, Análisis ABC |
| **POS** | ✅ Operativo | 2 tablas, 13 endpoints, Reportes de caja |
| **Email & Pagos** | ✅ Operativo | AWS SES, Mercado Pago Trial + Checkout Pro |
| **Deployment** | ✅ Listo | Docker Compose 7 contenedores, VPS Hostinger |
| **Tests** | ✅ Cobertura | 30 archivos test, Jest + Supertest |

---

## 🛠 Stack Técnico

### Frontend
- **React 18** + Vite 7 + Tailwind CSS 3
- **State**: Zustand (2 stores) + TanStack Query (22 hooks)
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios (auto-refresh JWT con queue)

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (1h access + 7d refresh) + Token blacklist
- **Validación**: Joi schemas (19 archivos)
- **Logs**: Winston
- **Tests**: Jest + Supertest (30 archivos)

### Base de Datos
- **PostgreSQL 17** con pg_cron (Dockerfile personalizado)
- **Particionamiento**: citas, eventos_sistema, movimientos_inventario (Range mensual)
- **Seguridad**: Row Level Security (76+ políticas multi-tenant)
- **Optimización**: 232+ índices, 47+ triggers, 57+ funciones PL/pgSQL
- **Automatización**: 5 jobs pg_cron (mantenimiento, archivado, particiones)

### IA Conversacional
- **Plataformas**: Telegram Bot API + WhatsApp Business Cloud API
- **LLM**: DeepSeek Chat con PostgreSQL Chat Memory (RLS)
- **Orchestration**: n8n workflows + MCP Server (7 tools)
- **Seguridad**: JWT multi-tenant + Redis anti-flood (20s)

---

## 📝 Comandos Esenciales

### Desarrollo
```bash
npm run dev              # Stack completo (7 contenedores)
npm run logs             # Logs en tiempo real
npm run test:backend     # 30 archivos de tests
npm run status           # Estado contenedores
npm run clean            # Limpiar todo
```

### Producción
```bash
bash deploy.sh deploy    # Deployment VPS completo
bash deploy.sh update    # Git pull + rebuild + restart
bash deploy.sh backup    # Backup PostgreSQL
```

---

## 🏗 Arquitectura del Sistema

### Backend - Estructura Verificada

**Controllers (39 archivos totales):**
- Core: 8 controllers (auth, organizaciones, usuarios, planes, subscripciones, superadmin, pagos, webhooks)
- Negocio: 9 controllers (profesionales, servicios, clientes, horarios, tipos, bloqueos, disponibilidad)
- Modulares: Citas (3), Comisiones (3), Marketplace (3), Inventario (6), POS (2)
- Index proxies: 5 archivos

**Models (31 archivos):**
- 97% usan RLSContextManager (30 de 31 models)
- planes.model.js NO usa RLS (tabla catálogo, no multi-tenant)
- Arquitectura modular: Citas (7), Comisiones (4), Marketplace (4), Inventario (6), POS (3)

**Routes (24 archivos - 213 endpoints HTTP):**
- Top 5 por endpoints: Inventario (33), Citas (18), Marketplace (16), Servicios (15), POS (13)
- Rutas públicas: 8 (marketplace, perfil, agendamiento, auth, onboarding)
- Rutas protegidas: Admin/Propietario (25+), Super Admin (6)

**Middleware (7 archivos):**
1. `auth.js` - JWT + roles + **optionalAuth** (API pública)
2. `tenant.js` - RLS context (setTenantContext + **setTenantContextFromQuery**)
3. `subscription.js` - Validación límites del plan
4. `rateLimiting.js` - Rate limiting por rol
5. `validation.js` - Joi schemas
6. `asyncHandler.js` - Manejo async/await
7. `index.js` - ⚠️ **CRÍTICO**: Todos los middleware DEBEN estar exportados aquí

**Servicios (12 archivos):**
- mercadopago.service.js (20KB)
- emailService.js + email/transporter.js + email/templates/
- n8n services (3): workflows, credentials, MCP
- tokenBlacklistService.js, configService.js
- platformValidators/ (2 archivos)

**Utils (9 archivos críticos):**
- **rlsContextManager.js** - RLS Manager v2.0 (USAR SIEMPRE)
- **helpers.js** - 8 clases: Response, Validation, Date, CodeGenerator, Sanitize, Pagination, Error, Organizacion
- **passwordHelper.js** - Evaluador fortaleza (score 0-120)
- **cita-validacion.util.js** - Algoritmo solapamiento horarios
- logger.js, n8nSetupHelper.js, mcpTokenGenerator.js, rlsHelper.js

**Schemas Joi (19 archivos):**
- Core (5): auth, organizacion, pagos, subscripciones, usuario
- Scheduling-SaaS (14): citas, comisiones, disponibilidad, inventario, marketplace, pos, etc.

### Frontend - Estructura Verificada

**Componentes (98 totales):**
- Marketplace: 18 (14 base + 4 agendamiento público)
- Citas: 10 | Comisiones: 9 | UI: 8 | Dashboard: 7
- Inventario: 7 | POS: 6 | Bloqueos: 6 | Profesionales: 5
- Clientes: 5 | Chatbots: 4 | Otros: 13

**Páginas (43 totales):**
- Super Admin: 6 | Inventario: 6 | POS: 4 | Marketplace: 4
- Onboarding: 4 | Comisiones: 3 | Clientes: 3 | Auth: 3
- Otras: 10 (Dashboard, Citas, Bloqueos, Chatbots, etc.)

**Hooks personalizados (22 totales):**
- useMarketplace.js (614 líneas - 8 queries + 6 mutations)
- useCitas.js (585 líneas) | useComisiones.js (419 líneas - 11 hooks)
- usePOS.js (414 líneas) | useInventario.js (289 líneas)
- 17 hooks adicionales (auth, bloqueos, clientes, profesionales, servicios, etc.)

**API Collections (20 en endpoints.js - 1395 líneas):**
- authApi, organizacionesApi, usuariosApi, profesionalesApi, serviciosApi
- citasApi, clientesApi, bloqueosApi, chatbotsApi, subscripcionesApi
- comisionesApi, marketplaceApi, inventarioApi, posApi, etc.

**Stores Zustand (2):**
- authStore.js (user, tokens, isAuthenticated)
- onboardingStore.js (steps, formData, progress)

### Base de Datos - Estructura Verificada

**Módulos SQL (18 carpetas):**
1. core/ - Extensiones, ENUMs, funciones utilidad
2. nucleo/ - Organizaciones, usuarios, planes, subscripciones
3. catalogos/ - Tipos profesional, tipos bloqueo, **ubicaciones geográficas**
4. negocio/ - Profesionales, servicios, clientes, horarios
5. agendamiento/ - Infraestructura base
6. citas/ - **Particionada** (mensual), citas_servicios
7. bloqueos/ - Bloqueos horarios, vistas
8. comisiones/ - Config, comisiones, historial
9. marketplace/ - Perfiles, reseñas, analytics (GDPR)
10. inventario/ - Productos, proveedores, **movimientos particionados**
11. pos/ - Ventas, items
12. pagos/ - Métodos, pagos MP
13. chatbots/ - Config, credentials
14. auditoria/ - **Eventos particionados**, archivado
15. mantenimiento/ - Tablas sistema, pg_cron jobs
16. suscripciones/ - (separado de nucleo si existe)
17. templates/ - ENUMs dominio, seeds

**Archivos SQL (95 totales):**
- 13 módulos con tablas (01-tablas*.sql)
- Índices, RLS policies, funciones, triggers, datos iniciales
- Tests: 6 archivos (validación, onboarding, seguridad, performance, comisiones)
- Setup: 3 archivos (init, users, permissions)

**Tablas principales por categoría:**
- Core: organizaciones, usuarios, planes_subscripcion, subscripciones
- Negocio: profesionales, servicios, clientes, horarios_profesionales
- Operaciones: citas ⚡, citas_servicios, bloqueos_horarios
- Comisiones: configuracion_comisiones, comisiones_profesionales, historial
- Marketplace: perfiles, reseñas, analytics, categorias
- Inventario: productos, proveedores, movimientos ⚡, inventario_actual, alertas
- POS: ventas, items_venta
- Sistema: eventos_sistema ⚡, chatbot_config, metodos_pago

### MCP Server - 7 Tools Verificados

**Ubicación**: `backend/mcp-server/tools/`

1. **listarServicios.js** - Catálogo con precios
2. **verificarDisponibilidad.js** - Slots libres + **excluir_cita_id** (reagendamiento)
3. **buscarCliente.js** - Por teléfono o nombre
4. **buscarCitasCliente.js** - Historial del cliente
5. **crearCita.js** - Creación validada (múltiples servicios)
6. **reagendarCita.js** - Modificar citas existentes
7. **modificarServiciosCita.js** - Cambiar servicios de cita

**Características críticas:**
- ✅ Prevención alucinaciones (system prompt obliga verificar disponibilidad real)
- ✅ Parámetro `excluir_cita_id` evita auto-bloqueo al reagendar
- ✅ Multi-tenant seguro (JWT + RLS + Chat Memory separada)

---

## 🔄 Orden de Middleware (CRÍTICO)

### Requests Autenticados
```
auth.authenticateToken
→ tenant.setTenantContext
→ subscription.checkResourceLimit (solo en POST/PUT/DELETE)
→ rateLimiting.apiRateLimit
→ validation.validate(schema)
→ asyncHandler(controller)
```

### Requests Públicos (API Marketplace)
```
auth.optionalAuth
→ (req.user ? tenant.setTenantContext : tenant.setTenantContextFromQuery)
→ rateLimiting.apiRateLimit
→ validation.validate(schema)
→ asyncHandler(controller)
```

**⚠️ REGLA CRÍTICA**: Todos los middleware en archivos individuales DEBEN estar exportados en `middleware/index.js`

---

## 🌐 Marketplace Público (100% Completo)

### Características
- ✅ Directorio público SEO (ciudad + categoría + rating)
- ✅ Perfiles con slug único `{ciudad}-{timestamp36}`
- ✅ **Agendamiento público sin autenticación** (crea cliente automáticamente)
- ✅ Verificación disponibilidad en tiempo real
- ✅ Sistema reseñas validadas (1 por cita completada)
- ✅ Analytics GDPR (IPs hasheadas SHA256 en backend)
- ✅ Panel Super Admin (activar/desactivar perfiles)

### API Pública - Implementación

**Middleware crítico**: `setTenantContextFromQuery`
- Extrae `organizacion_id` de query params (no de JWT)
- Establece contexto RLS temporalmente para validar org activa
- Limpia bypass en finally block (seguridad)
- **DEBE estar exportado** en `middleware/index.js` línea 33

**Patrón middleware condicional**:
```javascript
router.get('/',
  auth.optionalAuth,  // Permite requests con y sin token
  (req, res, next) => {
    if (req.user) return tenant.setTenantContext(req, res, next);
    else return tenant.setTenantContextFromQuery(req, res, next);
  },
  // ... resto de middleware
);
```

**Endpoints públicos** (sin autenticación):
- `GET /marketplace/perfiles/buscar` - Directorio con filtros
- `GET /marketplace/perfiles/slug/:slug` - Perfil público
- `POST /marketplace/analytics` - Tracking (fire-and-forget)
- `GET /api/v1/disponibilidad?organizacion_id=X` - Slots disponibles
- `POST /api/v1/citas/publico` - Agendamiento público

### Componentes Frontend Marketplace

**Páginas (4):**
- DirectorioMarketplacePage (`/marketplace`)
- PerfilPublicoPage (`/:slug`)
- AgendarPublicoPage (`/agendar/:slug`) - Stepper 4 pasos
- MiMarketplacePage (`/marketplace/mi-perfil`) - Panel admin

**Componentes agendamiento público (4):**
- SelectorServiciosPublico - Multi-selección con cálculo duración/precio
- SelectorFechaHoraPublico - Grid slots con verificación tiempo real
- FormularioClientePublico - Captura datos (crea cliente auto)
- ConfirmacionCitaPublico - Resumen y confirmación

**Hooks**:
- useMarketplace.js - 8 queries + 6 mutations (incluye useDisponibilidadPublica)
- useSuperAdminMarketplace.js - 3 queries para gestión

---

## 💼 Modelo de Negocio (Nov 2025)

### Planes Disponibles
- **Free**: 1 app gratuita (agendamiento, inventario o POS) - sin límite de tiempo
- **Pro**: Todas las apps + funciones avanzadas - $299 MXN/mes (14 días trial)

### Onboarding Simplificado (3 pasos)
1. **Información del Negocio** - Nombre, industria, ubicación (selector cascada estado→ciudad)
2. **Selección de Plan** - Free (elegir 1 app) o Pro (todas incluidas)
3. **Crear Cuenta** - Email, contraseña, términos

### Catálogos Geográficos (México)
- **4 tablas**: paises, estados (32), ciudades (~2,500), codigos_postales
- **13 endpoints públicos**: `/api/v1/ubicaciones/*`
- **Normalización**: organizaciones, marketplace_perfiles, proveedores usan FKs
- **Componente**: `SelectorUbicacion.jsx` (cascada estado→ciudad)
- **Hook**: `useUbicaciones.js` con staleTime optimizado para datos estáticos

---

## 💵 Sistema de Comisiones

### Funcionamiento
- **Trigger automático**: `calcular_comision_cita()` dispara al completar cita
- **Tipos**: porcentaje (0-100%), monto_fijo, mixto (auto cuando hay mix)
- **Prioridad config**: Específica (servicio_id) > Global (NULL fallback)

### Endpoints (12 total)
- Dashboard (3): /dashboard, /estadisticas, /grafica/por-dia
- Configuración (4): CRUD + historial auditoría
- Consultas (4): por profesional, por periodo, detalle, pagar
- Reportes (1): exportación CSV/JSON

### Características
- ✅ JSONB `detalle_servicios` con breakdown por servicio
- ✅ RLS: Admin ve todo, empleado solo sus comisiones
- ✅ Índice GIN en JSONB para analíticas
- ⚠️ **NO usar JSON.parse()** - PostgreSQL JSONB ya retorna parseado

---

## 🔒 Seguridad y Validación

### Row Level Security (RLS)
- **76+ políticas** activas en todas las tablas multi-tenant
- **RLSContextManager v2.0** - USAR SIEMPRE:
  - `query(orgId, async (db) => {...})`
  - `transaction(orgId, async (db) => {...})`
  - `withBypass(async (db) => {...})` - Solo para JOINs multi-tabla

### Roles y Permisos (RBAC)
- **super_admin**: Acceso total + gestión planes/organizaciones
- **admin/propietario**: CRUD completo en su organización
- **empleado**: READ servicios/profesionales, CRUD citas/clientes
- **bot**: READ + CRUD citas (MCP Server)
- **cliente**: Solo sus propios datos

### Política Contraseñas (Homologada 100%)
**Requisitos obligatorios:**
- Mínimo 8 caracteres
- 1 mayúscula + 1 minúscula + 1 número
- ✅ Especiales opcionales (mejoran score)
- ✅ Internacionales permitidos (ñ, é, ü)

**Validación:**
- Frontend: Zod schema + PasswordStrengthIndicator.jsx
- Backend: Joi schema + passwordHelper.js (score 0-120)

### Validación Bidireccional Horarios
**Crear Bloqueo** → Valida contra citas (pendiente/confirmada)
**Crear Cita** → Valida contra bloqueos activos

**Algoritmo solapamiento**: `i1 < f2 && f1 > i2`
⚠️ Touching borders (14:00 == 14:00) NO es solapamiento

**Ubicación**: `backend/app/utils/cita-validacion.util.js`

---

## ⚡ Reglas Críticas de Desarrollo

### Backend
1. **RLS SIEMPRE** - Usar `RLSContextManager.query()` o `.transaction()`
2. **NO filtrar por organizacion_id** - Controllers confían en RLS
3. **NO enviar auto-generados** - `codigo_cita`, `codigo_bloqueo`, `created_at`, `organizacion_id`
4. **asyncHandler obligatorio** - En todas las routes
5. **Middleware subscription** - Valida límites automáticamente (no validar manual)
6. **Reagendamiento** - SIEMPRE usar `excluir_cita_id` en verificarDisponibilidad
7. **Exports middleware** - SIEMPRE exportar en `middleware/index.js`
8. **API pública** - Usar `auth.optionalAuth` + middleware condicional
9. **IPs Analytics** - Hashear SHA256 en BACKEND antes de almacenar

### Frontend
1. **Sanitizar opcionales** - Joi rechaza `""`, usar `undefined`
2. **Invalidar queries** - Tras mutaciones: `queryClient.invalidateQueries()`
3. **Limpiar cache** - Login/Logout: `queryClient.clear()`
4. **Vite HMR** - Si falla: `docker restart front` + Ctrl+Shift+R
5. **Arrays en enabled** - Verificar longitud: `array.length > 0` (arrays vacíos son truthy)

---

## 📧 Sistema de Emails

**Producción**: AWS SES (us-east-1) - $0.10/1,000 emails
**Desarrollo**: Gmail SMTP (localhost)

**Variables críticas en docker-compose**:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `EMAIL_FROM` - Remitente
- `FRONTEND_URL` - **CRÍTICO** para construir URLs en emails

**Emails implementados**:
- Recuperación contraseña (template HTML, link 1h expiración)

**Archivos**:
- `services/emailService.js`
- `services/email/transporter.js` (singleton con pool)
- `services/email/templates/passwordReset.js`

---

## 🎯 Características Destacadas

### 1. Múltiples Servicios por Cita
- Tabla M:N `citas_servicios` (1-10 servicios)
- Cálculo auto duración + precio
- Soporte completo: backend + MCP + chatbots

### 2. Particionamiento PostgreSQL
- **3 tablas particionadas** (Range mensual):
  - citas por `fecha_cita` (mejora 10x queries históricas)
  - eventos_sistema por `creado_en` (mejora 100x)
  - movimientos_inventario por fecha
- Gestión automática con pg_cron (5 jobs)

### 3. Búsqueda Fuzzy Clientes
- Trigram similarity + normalización telefónica
- Índices GIN para tolerancia a typos

### 4. Setup Checklist Inteligente
- 4 pasos: profesionales → horarios → servicios → asignaciones
- Estado calculado en tiempo real (PostgreSQL)
- Auto-oculta al completar
- Endpoint: `GET /api/v1/organizaciones/:id/setup-progress`

### 5. Bulk Operations Transaccionales
- Profesionales y Servicios: 1-50 items
- Pre-validación límites del plan
- ACID garantizado (rollback completo en error)

---

## 🔧 Troubleshooting Común

### "Organización no encontrada" en queries
- **Causa**: JOINs multi-tabla sin RLS context
- **Solución**: Usar `RLSContextManager.withBypass()`

### Backend 400 "field is not allowed to be empty"
- **Causa**: Joi rechaza strings vacíos `""`
- **Solución**: Sanitizar a `undefined`: `email: data.email?.trim() || undefined`

### Vite HMR no detecta cambios
- **Solución**: `docker restart front` → esperar 5-10s → Ctrl+Shift+R

### Chatbot sugiere horarios ocupados
- **Causa**: No llama `verificarDisponibilidad` sin `hora` para obtener slots reales
- **Solución**: System prompt actualizado obliga verificar antes de sugerir

### Reagendamiento rechazado incorrectamente
- **Causa**: Cita actual bloquea los slots que se van a liberar
- **Solución**: Usar parámetro `excluir_cita_id` en verificarDisponibilidad

### API Pública - "tenant.setTenantContextFromQuery is not a function"
- **Causa**: Middleware definido pero NO exportado en `middleware/index.js`
- **Solución**: Agregar export + reiniciar contenedor backend

### React Query no ejecuta (API pública)
- **Causa**: Condition `enabled` incorrecta (arrays vacíos son truthy)
- **Solución**: `Array.isArray(params.servicios_ids) && params.servicios_ids.length > 0`

---

## 📚 Archivos Críticos por Módulo

### Core Backend
- `utils/rlsContextManager.js` - RLS Manager v2.0
- `utils/helpers.js` - 8 clases helper
- `utils/passwordHelper.js` - Evaluador fortaleza
- `utils/cita-validacion.util.js` - Algoritmo solapamiento
- `middleware/index.js` - ⚠️ EXPORTS CENTRALIZADOS

### Email
- `services/emailService.js`
- `services/email/transporter.js`
- `services/email/templates/passwordReset.js`

### Disponibilidad y Validación
- `database/disponibilidad.model.js` - Parámetro `excluir_cita_id`
- `controllers/disponibilidad.controller.js` - Soporte requests públicos
- `schemas/disponibilidad.schemas.js` - Validación dual servicios_ids
- `database/bloqueos-horarios.model.js` - Validación bidireccional

### Chatbots
- `controllers/chatbot.controller.js` - System prompt
- `mcp-server/tools/verificarDisponibilidad.js` - Excluir cita

### Comisiones
- `routes/api/v1/comisiones.js` - 12 endpoints
- `controllers/comisiones/` - 3 controllers
- `schemas/comisiones.schemas.js`
- `sql/comisiones/04-funciones.sql` - Trigger calcular_comision_cita()

### Marketplace
- `routes/api/v1/marketplace.js` - 16 endpoints
- `controllers/marketplace/` - 3 controllers
- `middleware/tenant.js` - setTenantContextFromQuery (líneas 459-537)
- `hooks/useMarketplace.js` - 8 queries + 6 mutations
- `pages/marketplace/AgendarPublicoPage.jsx`

### Inventario & POS
- `routes/api/v1/inventario.js` - 33 endpoints
- `routes/api/v1/pos.js` - 13 endpoints
- `sql/inventario/06-particionamiento.sql`

---

## 📊 Métricas del Proyecto

**Backend:** 40 controllers, 226 endpoints, 32 models, 20 schemas Joi, 12 servicios, 30 tests

**Frontend:** 99 componentes, 43 páginas, 23 hooks, 21 API collections, 2 stores Zustand

**Base de Datos:** 18 módulos SQL, 97 archivos, 76+ RLS, 235+ índices, 3 particionadas

**Deployment:** 7 contenedores Docker, 3 docker-compose, deploy.sh automatizado

---

**Versión**: 23.0 | **Última actualización**: 24 Noviembre 2025 | **Estado**: ✅ Production Ready
