# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 13 Octubre 2025

| Componente | Estado | Métricas Reales |
|------------|--------|-----------------|
| **Backend API** | ✅ Operativo | 10 módulos, RLS activo |
| **Frontend React** | ✅ Operativo | Onboarding 9 pasos |
| **Base de Datos** | ✅ Operativo | 15 tablas, 20 RLS policies, 133 índices |
| **Tests Backend** | ✅ **475/475 (100%)** | 22 suites, ~47s |
| **Sistema IA** | ✅ Operativo | n8n + Evolution API |
| **Docker** | ✅ Running | 7 contenedores |

---

## 🛠 Stack Técnico

### Frontend
- **Framework**: React 19.1.1 + Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **State**: Zustand 5.0.8 + TanStack React Query 5.90.2
- **Forms**: React Hook Form 7.64.0 + Zod 4.1.12
- **HTTP**: Axios 1.12.2 (interceptores JWT)
- **UI**: Tailwind CSS 3.4.18 + Lucide Icons + Framer Motion 12.23.22

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (7d access + 30d refresh)
- **Validación**: Joi schemas modulares
- **Testing**: Jest + Supertest
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (RLS)
- **Índices**: 133 (covering, GIN, GIST)
- **Triggers**: 23 (auto-generación, timestamps)

### IA Conversacional
- **Orquestación**: n8n + Redis Queue
- **WhatsApp**: Evolution API
- **NLP**: Claude/GPT vía n8n workflows

---

## 📝 Comandos Esenciales

### Tests Backend
```bash
# Suite completa (SIEMPRE usar "npm test")
docker exec back npm test

# Test específico
docker exec back npm test -- __tests__/endpoints/auth.test.js
```

### Docker
```bash
npm run start     # docker compose up -d
npm run stop      # docker compose down
npm run restart   # Reiniciar servicios

docker logs -f back
docker logs -f postgres_db
```

### Base de Datos
```bash
# Consola PostgreSQL
docker exec postgres_db psql -U admin -d postgres

# Ver tablas
docker exec postgres_db psql -U admin -d postgres -c "\dt"
```

### Frontend
```bash
cd frontend

npm run dev          # Desarrollo (http://localhost:3001)
npm run build        # Build producción
npm run lint:fix     # Auto-fix ESLint
npm run format       # Aplicar Prettier
```

---

## 🏗 Arquitectura del Sistema

### Módulos Backend (10)

**Controllers/Models/Routes/Schemas:**
- `auth` - Autenticación y tokens JWT
- `usuarios` - Gestión de usuarios
- `organizaciones` - Multi-tenancy
- `profesionales` - Prestadores de servicios
- `servicios` - Catálogo de servicios
- `clientes` - Base de clientes
- `horarios-profesionales` - Disponibilidad
- `citas` - Operaciones de agendamiento (modular: base, operacional, recordatorios)
- `bloqueos-horarios` - Bloqueos de disponibilidad
- `planes` - Planes y suscripciones

**Patrones Implementados:**
- ✅ 100% controllers usan `asyncHandler`
- ✅ 100% endpoints usan schemas Joi
- ✅ RLS directo en entidades simples
- ✅ `RLSHelper.withBypass()` en queries multi-tabla

### Base de Datos (15 Tablas)

```
Core:           organizaciones, usuarios, planes_subscripcion
Negocio:        profesionales, servicios, clientes, horarios_profesionales
Operaciones:    citas, bloqueos_horarios, servicios_profesionales
Subscripciones: subscripciones, historial_subscripciones, metricas_uso_organizacion
Sistema:        eventos_sistema, eventos_sistema_archivo
```

**Seguridad:**
- 20 Políticas RLS (multi-tenant + anti SQL-injection REGEX `^[0-9]+$`)
- 23 Triggers (auto-generación códigos `ORG001-20251013-001`)
- 133 Índices optimizados

### Arquitectura Frontend

**Estructura:**
```
src/
├── app/              # Router y queryClient
├── components/
│   ├── auth/         # Login/ProtectedRoute
│   ├── clientes/     # Gestión clientes
│   ├── dashboard/    # Widgets
│   ├── forms/        # FormField reutilizable
│   └── ui/           # Button, Input, Modal, Toast
├── hooks/            # useAuth, useClientes, useDashboard, useToast
├── pages/
│   ├── auth/         # Login
│   ├── clientes/     # CRUD clientes
│   ├── dashboard/    # Dashboard principal
│   └── onboarding/   # 9 pasos: Info → Plan → Cuenta → Profesionales
│                     # → Horarios → Servicios → WhatsApp → Review → Welcome
├── services/api/     # client.js (Axios) + endpoints.js
└── store/            # authStore, onboardingStore (Zustand)
```

**Patrones:**
- ✅ React Query para datos del servidor
- ✅ Zustand para estado UI local
- ✅ Axios interceptor para auto-refresh JWT
- ✅ Zod schemas consistentes con Joi backend

---

## 🔒 Seguridad Multi-Tenant

### Row Level Security (RLS)

**Middleware obligatorio:**
```javascript
router.post('/endpoint',
    auth.authenticateToken,      // 1. JWT
    tenant.setTenantContext,     // 2. RLS ⚠️ CRÍTICO
    rateLimiting.apiRateLimit,   // 3. Rate limit
    validation.validate(schema), // 4. Joi validation
    Controller.metodo            // 5. Business logic
);
```

**Patrón RLS en Models:**
```javascript
// Patrón 1: Entidades simples (una tabla)
const db = await getDb();
try {
    await db.query('SELECT set_config($1, $2, false)',
        ['app.current_tenant_id', organizacion_id.toString()]);
    const result = await db.query(query, values);
    return result.rows[0];
} finally {
    db.release();
}

// Patrón 2: Queries multi-tabla (JOINs)
const db = await getDb();
try {
    return await RLSHelper.withBypass(db, async (db) => {
        const result = await db.query(query, values);
        return result.rows[0];
    });
} finally {
    db.release();
}
```

**⚠️ CRÍTICO**: Queries con JOINs de múltiples tablas DEBEN usar `RLSHelper.withBypass()`.

### RBAC (Roles)

| Recurso | super_admin | propietario/admin | empleado | solo_lectura |
|---------|-------------|-------------------|----------|--------------|
| Organizaciones | ALL (todas) | ALL (su org) | READ | READ |
| Usuarios | ALL | CREATE/UPDATE | - | - |
| Profesionales | ALL | ALL | READ | READ |
| Servicios | ALL | ALL | READ | READ |
| Clientes | ALL | ALL | ALL | READ |
| Citas | ALL | ALL | ALL | READ |

---

## ⚡ Reglas Críticas

### Backend

**1. Controllers confían en RLS**
```javascript
// ✅ CORRECTO (RLS filtra automáticamente)
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO (redundante)
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

**2. Códigos auto-generados**
```javascript
// ✅ CORRECTO - NO enviar codigo_cita
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    fecha_cita: '2025-10-13'
});
// cita.codigo_cita = "ORG001-20251013-001" (auto-generado por trigger)
```

**3. Wrapping de métodos en rutas**
```javascript
// ✅ CORRECTO - Wrap con arrow function si usa `this`
router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    (req, res, next) => Controller.obtenerEstadisticas(req, res, next)
);
```

### Frontend

**1. Sanitización de campos opcionales**
```javascript
// ✅ CORRECTO - Backend Joi rechaza ""
const createMutation = useMutation({
  mutationFn: async (data) => {
    const sanitizedData = {
      ...data,
      email: data.email?.trim() || undefined,
      telefono: data.telefono?.trim() || undefined,
    };
    return api.crear(sanitizedData);
  }
});
```

**2. Invalidación de cache**
```javascript
// ✅ CORRECTO - Refrescar datos después de mutation
const createMutation = useMutation({
  mutationFn: api.crear,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['recursos'] });
  }
});
```

**3. Separación de concerns**
```javascript
// ✅ Datos servidor → React Query
const { data: profesionales } = useQuery({
  queryKey: ['profesionales'],
  queryFn: profesionalesApi.listar,
});

// ✅ Estado UI → Zustand
const { user, setAuth } = useAuthStore();
```

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] **Routes**: Middleware correcto (auth → tenant → rateLimit → validation)
- [ ] **Controller**: Usa `asyncHandler` y `ResponseHelper`
- [ ] **Model**: RLS directo o `RLSHelper.withBypass()` según caso
- [ ] **Schema**: Joi modular con `commonSchemas`
- [ ] **Tests**: Happy path + edge cases con `db-helper`

### Frontend
- [ ] **Página**: React Query + estados (loading, error, success)
- [ ] **Componentes**: Pequeños, reutilizables, props tipadas
- [ ] **Forms**: React Hook Form + Zod + sanitización
- [ ] **API**: Métodos en `endpoints.js` + invalidación cache

---

## 🔧 Troubleshooting

### Error: Tests con timeout
```bash
# ✅ Usar npm test (configura NODE_ENV=test)
docker exec back npm test

# ❌ NO usar npx jest directamente
```

### Error: "Organización no encontrada" en queries multi-tabla
```javascript
// ✅ Solución: Usar RLSHelper.withBypass()
return await RLSHelper.withBypass(db, async (db) => {
    const query = `SELECT ... FROM org o LEFT JOIN sub s ON ...`;
    return await db.query(query, [id]);
});
```

### Error: Backend 400 "field is not allowed to be empty"
```javascript
// ✅ Solución: Sanitizar "" a undefined antes de enviar
const sanitized = {
  ...data,
  email: data.email?.trim() || undefined
};
```

---

## 📚 Archivos Clave

| Ruta | Descripción |
|------|-------------|
| `/CLAUDE.md` | Esta guía |
| `/backend/app/utils/rlsHelper.js` | Helper RLS multi-tenant |
| `/backend/app/__tests__/helpers/db-helper.js` | Helpers de testing |
| `/frontend/src/services/api/client.js` | Axios con interceptor JWT |
| `/frontend/src/pages/onboarding/OnboardingFlow.jsx` | 9 pasos del onboarding |
| `/sql/schema/*.sql` | 14 archivos SQL del schema |

---

**Versión**: 3.0
**Última actualización**: 13 Octubre 2025
**Estado**: ✅ Production Ready | 475/475 tests (100%)
