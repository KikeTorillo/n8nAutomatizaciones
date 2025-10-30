# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 30 Octubre 2025

| Componente | Estado | Métricas |
|------------|--------|----------|
| **Backend API** | ✅ Operativo | 13 módulos, 545 tests (100%) |
| **Frontend React** | ✅ Operativo | 45 componentes, 12 hooks |
| **Base de Datos** | ✅ Operativo | 20 tablas, 24 RLS policies |
| **Sistema IA** | ✅ Operativo | n8n + DeepSeek + MCP Server |
| **MCP Server** | ✅ Operativo | 6 tools, JSON-RPC 2.0, JWT multi-tenant |
| **Deployment** | ✅ Listo | Scripts bash dev/prod |

---

## 🛠 Stack Técnico

### Frontend
- React 19 + Vite 7 + Tailwind CSS 3
- Zustand + TanStack Query
- React Hook Form + Zod
- Axios (auto-refresh JWT)

### Backend
- Node.js + Express.js
- JWT (7d access + 30d refresh)
- Joi schemas + Winston logs
- Jest + Supertest (545 tests, 100%)

### Base de Datos
- PostgreSQL 17 Alpine
- Row Level Security (24 políticas)
- 165 índices + 30 triggers + 38 funciones PL/pgSQL

### IA Conversacional
- n8n workflows (15 nodos)
- Telegram Bot API
- DeepSeek (modelo IA)
- PostgreSQL Chat Memory (RLS)
- Redis Anti-flood (20s debouncing)
- MCP Server (6 tools)

---

## 📝 Comandos Esenciales

### Desarrollo (npm)

```bash
npm run dev              # Levantar stack completo
npm run logs             # Ver logs
npm run test:backend     # 545 tests
npm run status           # Ver estado
npm run clean            # Limpiar contenedores
```

### Producción Local (testing)

```bash
bash deploy.local.sh deploy    # Deployment completo
bash deploy.local.sh restart   # Reiniciar servicios
bash deploy.local.sh logs      # Ver logs
```

### VPS (producción real)

```bash
bash deploy.sh deploy    # Deployment completo
bash deploy.sh update    # Git pull + rebuild + restart
bash deploy.sh backup    # Backup BD
```

---

## 🏗 Arquitectura

### Backend - 13 Módulos

1. **auth** - JWT + password recovery
2. **usuarios** - Gestión usuarios + RBAC
3. **organizaciones** - Multi-tenancy
4. **tipos-profesional** - Tipos dinámicos (33 sistema + custom)
5. **tipos-bloqueo** - Tipos bloqueo dinámicos
6. **profesionales** - Prestadores servicios
7. **servicios** - Catálogo servicios
8. **clientes** - Base clientes (búsqueda fuzzy)
9. **horarios-profesionales** - Disponibilidad semanal
10. **citas** - Agendamiento (múltiples servicios por cita)
11. **bloqueos-horarios** - Bloqueos temporales
12. **planes** - Planes y suscripciones
13. **chatbots** - Chatbots IA multi-plataforma

**Helpers Críticos:**
- `RLSContextManager` (v2.0) - **USAR SIEMPRE** para queries multi-tenant
- `helpers.js` - 8 clases helper (ResponseHelper, ValidationHelper, etc.)

### Frontend - 12 Hooks Personalizados

`useAuth`, `useCitas`, `useClientes`, `useBloqueos`, `useProfesionales`, `useServicios`, `useHorarios`, `useEstadisticas`, `useTiposProfesional`, `useTiposBloqueo`, `useChatbots`, `useToast`

### Base de Datos - 20 Tablas

**Core:** organizaciones, usuarios, planes_subscripcion
**Catálogos:** tipos_profesional, tipos_bloqueo
**Negocio:** profesionales, servicios, clientes, servicios_profesionales, horarios_profesionales
**Operaciones:** citas, citas_servicios, bloqueos_horarios
**Chatbots:** chatbot_config, chatbot_credentials
**Sistema:** eventos_sistema, subscripciones, metricas_uso_organizacion

**ENUMs principales:**
- `rol_usuario`: super_admin, admin, propietario, empleado, cliente, bot
- `estado_cita`: pendiente, confirmada, en_curso, completada, cancelada, no_asistio

---

## 🤖 Sistema de Chatbots IA

### MCP Server - 6 Tools

1. **listarServicios** - Lista servicios activos con precios
2. **verificarDisponibilidad** - Verifica horarios libres (soporta múltiples servicios)
3. **buscarCliente** - Busca clientes por teléfono o nombre
4. **buscarCitasCliente** - Busca citas de un cliente por teléfono (para reagendamiento)
5. **crearCita** - Crea citas validadas (soporta múltiples servicios)
6. **reagendarCita** - Reagenda citas existentes

### System Prompt Personalizado

- **Ubicación**: `chatbot.controller.js` → método `_generarSystemPrompt()`
- **Generación**: Dinámica por organización
- **Contenido**: Fechas calculadas (Luxon), 6 tools MCP, flujos agendamiento/reagendamiento
- **Placeholder**: `plantilla.json` solo tiene placeholder (se reemplaza al crear bot)

### Features

- ✅ Creación automática 100% sin intervención manual
- ✅ Webhooks automáticos (fix n8n bug #14646)
- ✅ Credentials dinámicas multi-plataforma
- ✅ Rollback automático en errores
- ✅ Anti-flood Redis (20s debouncing)
- ✅ Chat Memory persistente (PostgreSQL + RLS)
- ✅ Multi-tenant seguro (JWT)
- ✅ Múltiples servicios por cita
- ✅ Reagendamiento conversacional

---

## 🔒 Seguridad Multi-Tenant (RLS)

### Stack de Middleware Obligatorio

```javascript
router.post('/endpoint',
    auth.authenticateToken,       // 1. JWT
    tenant.setTenantContext,      // 2. RLS ⚠️ CRÍTICO
    rateLimiting.apiRateLimit,    // 3. Rate limiting
    validation.validate(schema),  // 4. Joi validation
    asyncHandler(Controller.fn)   // 5. Business logic
);
```

### Patrón RLS en Models

```javascript
// Query simple
const data = await RLSContextManager.query(orgId, async (db) => {
    return await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
});

// Transacción
await RLSContextManager.transaction(orgId, async (db) => {
    await db.query('INSERT INTO clientes ...');
    await db.query('INSERT INTO citas ...');
});

// Bypass (JOINs multi-tabla)
const data = await RLSContextManager.withBypass(async (db) => {
    return await db.query('SELECT * FROM org o LEFT JOIN sub s ...');
});
```

### RBAC - Matriz de Permisos

| Recurso | super_admin | admin/propietario | empleado | bot |
|---------|-------------|-------------------|----------|-----|
| Organizaciones | ALL | SU ORG | READ | - |
| Usuarios | ALL | CRUD (su org) | - | - |
| Profesionales | ALL | ALL | READ | READ |
| Servicios | ALL | ALL | READ | READ |
| Clientes | ALL | ALL | ALL | READ |
| Citas | ALL | ALL | ALL | CRUD |
| Chatbots | ALL | ALL | - | - |

---

## ⚡ Reglas Críticas

### Backend

**1. Controllers confían en RLS (no filtrar manualmente)**
```javascript
// ✅ CORRECTO
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO (redundante)
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

**2. NO enviar campos auto-generados**
- `codigo_cita`, `codigo_bloqueo` → Triggers
- `created_at`, `updated_at` → Automáticos
- `organizacion_id` → Tenant middleware

**3. Usar asyncHandler para async/await**
```javascript
// ✅ CORRECTO
router.get('/:id', asyncHandler(Controller.obtener));
```

### Frontend

**1. Sanitizar campos opcionales (Joi rechaza "")**
```javascript
const sanitizedData = {
  ...data,
  email: data.email?.trim() || undefined,
};
```

**2. Invalidar cache React Query**
```javascript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['clientes'] });
}
```

**3. Limpiar cache al cambiar organización**
```javascript
// Login/Logout: SIEMPRE ejecutar
queryClient.clear();
```

---

## 🎯 Características Clave

### 1. Tipos Dinámicos con Filtrado Automático

Sistema híbrido: 33 tipos sistema + tipos custom por organización.
Filtrado automático por industria.

### 2. Auto-generación de Códigos

```javascript
// NO enviar codigo_cita (auto-generado por trigger)
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    fecha_cita: '2025-10-21'
});
// Resultado: cita.codigo_cita = "ORG001-20251021-001"
```

### 3. Búsqueda Fuzzy

Clientes: Trigram similarity + normalización telefónica.
Índices GIN + función `normalizar_telefono()`.

### 4. Múltiples Servicios por Cita

Tabla `citas_servicios` (M:N con snapshot pricing).
Backend soporta 1-10 servicios por cita.
MCP tools soportan múltiples servicios.

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] Routes: Stack middleware (auth → tenant → rateLimit → validation)
- [ ] Controller: `asyncHandler` + `ResponseHelper`
- [ ] Model: `RLSContextManager.query()`
- [ ] Schema: Joi modular
- [ ] Tests: Min 10 tests (unit + integration + multi-tenant)

### Frontend
- [ ] Página: React Query (loading/error/success)
- [ ] Forms: React Hook Form + Zod + sanitización
- [ ] Hook: Custom hook con React Query
- [ ] API: Endpoints en `services/api/endpoints.js`

---

## 📚 Archivos Clave

### Backend
- `backend/app/utils/rlsContextManager.js` - RLS Manager v2.0 (**USAR SIEMPRE**)
- `backend/app/controllers/chatbot.controller.js` - System prompt en `_generarSystemPrompt()`
- `backend/app/flows/plantilla/plantilla.json` - Template workflow (15 nodos)

### MCP Server
- `backend/mcp-server/index.js` - Servidor JSON-RPC 2.0
- `backend/mcp-server/tools/*.js` - 6 tools implementados

### Frontend
- `frontend/src/services/api/client.js` - Axios + auto-refresh JWT
- `frontend/src/store/authStore.js` - Zustand state

### Base de Datos
- `sql/schema/08-rls-policies.sql` - 24 políticas RLS
- `sql/schema/09-triggers.sql` - 30 triggers (códigos, timestamps, etc.)

---

## 🔧 Troubleshooting

### "Organización no encontrada" en queries
```javascript
// JOINs multi-tabla requieren bypass RLS
const data = await RLSContextManager.withBypass(async (db) => {
    return await db.query(`
        SELECT o.*, s.plan_id
        FROM organizaciones o
        LEFT JOIN subscripciones s ON o.id = s.organizacion_id
        WHERE o.id = $1
    `, [orgId]);
});
```

### Backend 400 "field is not allowed to be empty"
```javascript
// Joi no acepta "" - Sanitizar a undefined
const payload = {
  nombre: data.nombre,
  email: data.email?.trim() || undefined,
};
```

---

**Versión**: 10.0
**Última actualización**: 30 Octubre 2025
**Estado**: ✅ Production Ready
