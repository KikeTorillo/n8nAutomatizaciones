# 🔧 Plan de Refactor: Backend para SaaS Starter Kit

**Fecha de creación:** 19 Noviembre 2025
**Objetivo:** Revisar y desacoplar el backend para extraer un starter kit reutilizable
**Estado Base de Datos:** ✅ Completo (tabla `categorias` genérica, seeds separados por template)

---

## 📋 Contexto

### ✅ Lo que ya está listo (SQL)

- ✅ Tabla `categorias` genérica (sin datos hardcodeados)
- ✅ Tabla `organizaciones` sin campo `tipo_cuenta` (genérica)
- ✅ Seeds separados por dominio:
  - `sql/templates/scheduling-saas/seeds/categorias-agendamiento.sql` (11 categorías)
  - Futuro: `sql/templates/invitations-saas/seeds/categorias-eventos.sql`
- ✅ Nomenclatura consistente:
  - `categoria_id` (no `categoria_industria_id`)
  - `configuracion_categoria` (no `configuracion_industria`)

### 🎯 Objetivo de Esta Revisión

Identificar qué código del backend debe estar en:

1. **Core Reutilizable** - Se copia a cada nuevo proyecto SaaS
2. **Template Específico** - Solo para proyectos de agendamiento (scheduling-saas)

---

## 🗂 Estructura Propuesta del Starter Kit

```
saas-starter-kit/
├── backend/
│   ├── core/                          # ✅ Se reutiliza (universal)
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── services/
│   │   └── controllers/
│   │       ├── auth.controller.js
│   │       ├── organizacion.controller.js
│   │       ├── usuario.controller.js
│   │       ├── plan.controller.js
│   │       └── superadmin.controller.js
│   │
│   └── templates/
│       ├── scheduling-saas/           # ❌ Específico de agendamiento
│       │   ├── controllers/
│       │   │   ├── citas/
│       │   │   ├── profesionales.controller.js
│       │   │   ├── servicios.controller.js
│       │   │   ├── clientes.controller.js
│       │   │   ├── horarios-profesionales.controller.js
│       │   │   ├── bloqueos-horarios.controller.js
│       │   │   ├── disponibilidad.controller.js
│       │   │   ├── comisiones/
│       │   │   ├── tipos-profesional.controller.js
│       │   │   ├── tipos-bloqueo.controller.js
│       │   │   └── chatbot.controller.js
│       │   │
│       │   ├── models/
│       │   │   ├── cita/
│       │   │   ├── profesional.model.js
│       │   │   ├── servicio.model.js
│       │   │   └── ...
│       │   │
│       │   ├── schemas/
│       │   │   ├── cita.schemas.js
│       │   │   ├── profesional.schemas.js
│       │   │   └── ...
│       │   │
│       │   └── routes/
│       │       └── api/v1/
│       │           ├── citas.js
│       │           ├── profesionales.js
│       │           └── ...
│       │
│       └── invitations-saas/          # 🆕 Futuro: Específico de invitaciones
│           ├── controllers/
│           │   ├── invitaciones.controller.js
│           │   ├── plantillas.controller.js
│           │   └── rsvp.controller.js
│           └── ...
```

---

## 🔍 Checklist de Revisión por Módulo

### 1. Middleware (backend/app/middleware/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `auth.js` | ✅ CORE | Universal (JWT, roles genéricos) |
| `tenant.js` | ✅ CORE | Multi-tenant RLS (universal) |
| `subscription.js` | ⚠️ REVISAR | ¿Límites hardcodeados para agendamiento? |
| `rateLimiting.js` | ✅ CORE | Universal |
| `validation.js` | ✅ CORE | Universal (wrapper de Joi) |
| `asyncHandler.js` | ✅ CORE | Universal |
| `errorHandler.js` | ✅ CORE | Universal |
| `index.js` | ⚠️ REVISAR | ¿Exporta middleware específico? |

**Acciones:**
- [ ] Revisar `subscription.js`: ¿límites genéricos o específicos de agendamiento?
- [ ] Validar que `middleware/index.js` solo exporte middleware core

---

### 2. Utils (backend/app/utils/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `rlsContextManager.js` | ✅ CORE | Universal (RLS multi-tenant) |
| `helpers.js` | ✅ CORE | 8 clases helper genéricas |
| `passwordHelper.js` | ✅ CORE | Universal (score de contraseña) |
| `cita-validacion.util.js` | ❌ TEMPLATE | Específico de agendamiento (solapamiento horarios) |

**Acciones:**
- [ ] Mover `cita-validacion.util.js` a `templates/scheduling-saas/utils/`
- [ ] Validar que `helpers.js` no tenga lógica específica de agendamiento

---

### 3. Controllers (backend/app/controllers/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `auth.controller.js` | ✅ CORE | Universal (login, register, refresh, reset password) |
| `organizacion.controller.js` | ⚠️ REVISAR | ¿Lógica específica de agendamiento? |
| `usuario.controller.js` | ✅ CORE | Universal (CRUD usuarios) |
| `plan.controller.js` | ✅ CORE | Universal (gestión planes) |
| `superadmin.controller.js` | ✅ CORE | Universal (gestión organizaciones) |
| `webhook.controller.js` | ✅ CORE | Universal (Mercado Pago) |
| `pagos.controller.js` | ✅ CORE | Universal (Mercado Pago) |
| **Específicos de Agendamiento:** | | |
| `citas/` | ❌ TEMPLATE | 3 controllers modulares (base, operacional, recordatorios) |
| `profesionales.controller.js` | ❌ TEMPLATE | Específico |
| `servicios.controller.js` | ❌ TEMPLATE | Específico |
| `clientes.controller.js` | ❌ TEMPLATE | Específico |
| `horarios-profesionales.controller.js` | ❌ TEMPLATE | Específico |
| `bloqueos-horarios.controller.js` | ❌ TEMPLATE | Específico |
| `disponibilidad.controller.js` | ❌ TEMPLATE | Específico |
| `comisiones/` | ❌ TEMPLATE | 3 controllers (configuracion, comisiones, estadisticas) |
| `tipos-profesional.controller.js` | ❌ TEMPLATE | Específico |
| `tipos-bloqueo.controller.js` | ❌ TEMPLATE | Específico |
| `chatbot.controller.js` | ⚠️ REVISAR | ¿Puede ser genérico? |
| `marketplace/` | ⚠️ REVISAR | ¿Genérico o específico de agendamiento? |

**Acciones:**
- [ ] Revisar `organizacion.controller.js`: ¿tiene lógica de setup específica de agendamiento?
- [ ] Revisar `chatbot.controller.js`: ¿system prompt es genérico o específico?
- [ ] Revisar `marketplace/`: ¿funciona para cualquier dominio o solo agendamiento?
- [ ] Mover controllers específicos a `templates/scheduling-saas/controllers/`

---

### 4. Models (backend/app/database/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `organizacion.model.js` | ⚠️ REVISAR | ¿Queries específicas de agendamiento? |
| `usuario.model.js` | ✅ CORE | Universal |
| `plan.model.js` | ✅ CORE | Universal |
| `subscripcion.model.js` | ✅ CORE | Universal |
| `pago.model.js` | ✅ CORE | Universal |
| `chatbot-config.model.js` | ⚠️ REVISAR | ¿Genérico o específico? |
| **Específicos de Agendamiento:** | | |
| `cita/` | ❌ TEMPLATE | 7 archivos modulares |
| `profesional.model.js` | ❌ TEMPLATE | Específico |
| `servicio.model.js` | ❌ TEMPLATE | Específico |
| `cliente.model.js` | ❌ TEMPLATE | Específico |
| `horarios-profesionales.model.js` | ❌ TEMPLATE | Específico |
| `bloqueos-horarios.model.js` | ❌ TEMPLATE | Específico |
| `disponibilidad.model.js` | ❌ TEMPLATE | Específico |
| `comisiones/` | ❌ TEMPLATE | 3 models |
| `tipos-profesional.model.js` | ❌ TEMPLATE | Específico |
| `tipos-bloqueo.model.js` | ❌ TEMPLATE | Específico |
| `marketplace/` | ⚠️ REVISAR | ¿Genérico o específico? |

**Acciones:**
- [ ] Revisar `organizacion.model.js`: ¿método `obtenerProgresoSetup()` es genérico?
- [ ] Revisar `chatbot-config.model.js`: ¿estructura genérica o específica?
- [ ] Revisar `marketplace/`: ¿tablas pueden usarse para otros dominios?
- [ ] Mover models específicos a `templates/scheduling-saas/models/`

---

### 5. Schemas (backend/app/schemas/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `auth.schemas.js` | ✅ CORE | Universal |
| `organizacion.schemas.js` | ⚠️ REVISAR | ¿Validaciones específicas de agendamiento? |
| `usuario.schemas.js` | ✅ CORE | Universal |
| `plan.schemas.js` | ✅ CORE | Universal |
| `subscripcion.schemas.js` | ✅ CORE | Universal |
| **Específicos de Agendamiento:** | | |
| `cita.schemas.js` | ❌ TEMPLATE | Específico |
| `profesional.schemas.js` | ❌ TEMPLATE | Específico |
| `servicio.schemas.js` | ❌ TEMPLATE | Específico |
| `cliente.schemas.js` | ❌ TEMPLATE | Específico |
| `horarios-profesionales.schemas.js` | ❌ TEMPLATE | Específico |
| `bloqueos-horarios.schemas.js` | ❌ TEMPLATE | Específico |
| `disponibilidad.schemas.js` | ❌ TEMPLATE | Específico |
| `comisiones.schemas.js` | ❌ TEMPLATE | Específico |
| `chatbot.schemas.js` | ⚠️ REVISAR | ¿Genérico o específico? |
| `marketplace.schemas.js` | ⚠️ REVISAR | ¿Genérico o específico? |

**Acciones:**
- [ ] Revisar `organizacion.schemas.js`: ¿campos opcionales dependen del dominio?
- [ ] Mover schemas específicos a `templates/scheduling-saas/schemas/`

---

### 6. Routes (backend/app/routes/api/v1/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `auth.js` | ✅ CORE | Universal |
| `organizaciones.js` | ⚠️ REVISAR | ¿Endpoints específicos de agendamiento? |
| `usuarios.js` | ✅ CORE | Universal |
| `planes.js` | ✅ CORE | Universal |
| `subscripciones.js` | ✅ CORE | Universal |
| `webhooks.js` | ✅ CORE | Universal (Mercado Pago) |
| `pagos.js` | ✅ CORE | Universal (Mercado Pago) |
| `superadmin.js` | ✅ CORE | Universal |
| **Específicos de Agendamiento:** | | |
| `citas.js` | ❌ TEMPLATE | Específico |
| `profesionales.js` | ❌ TEMPLATE | Específico |
| `servicios.js` | ❌ TEMPLATE | Específico |
| `clientes.js` | ❌ TEMPLATE | Específico |
| `horarios-profesionales.js` | ❌ TEMPLATE | Específico |
| `bloqueos-horarios.js` | ❌ TEMPLATE | Específico |
| `disponibilidad.js` | ❌ TEMPLATE | Específico |
| `comisiones.js` | ❌ TEMPLATE | Específico |
| `tipos-profesional.js` | ❌ TEMPLATE | Específico |
| `tipos-bloqueo.js` | ❌ TEMPLATE | Específico |
| `chatbots.js` | ⚠️ REVISAR | ¿Genérico o específico? |
| `marketplace.js` | ⚠️ REVISAR | ¿Genérico o específico? |

**Acciones:**
- [ ] Revisar `organizaciones.js`: ¿endpoint `/setup-progress` es genérico?
- [ ] Revisar `chatbots.js`: ¿endpoints genéricos o específicos?
- [ ] Revisar `marketplace.js`: ¿endpoints funcionan para otros dominios?
- [ ] Mover routes específicas a `templates/scheduling-saas/routes/`

---

### 7. Services (backend/app/services/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `mercadopago.service.js` | ✅ CORE | Universal (integración MP) |
| `emailService.js` | ✅ CORE | Universal (envío emails) |
| `email/transporter.js` | ✅ CORE | Universal (nodemailer pool) |
| `email/templates/passwordReset.js` | ✅ CORE | Universal (template HTML) |
| `n8nService.js` | ⚠️ REVISAR | ¿Lógica específica de agendamiento? |
| `n8nCredentialService.js` | ⚠️ REVISAR | ¿Genérico o específico? |
| `n8nGlobalCredentialsService.js` | ✅ CORE | Universal (DeepSeek) |
| `n8nMcpCredentialsService.js` | ⚠️ REVISAR | ¿Genérico o específico? |
| `tokenBlacklistService.js` | ✅ CORE | Universal (JWT blacklist) |
| `configService.js` | ✅ CORE | Universal (configuración sistema) |
| `platformValidators/` | ⚠️ REVISAR | ¿Validadores genéricos o específicos? |

**Acciones:**
- [ ] Revisar `n8nService.js`: ¿workflows hardcodeados para agendamiento?
- [ ] Revisar `n8nMcpCredentialsService.js`: ¿MCP tools específicos?
- [ ] Revisar `platformValidators/`: ¿validadores Telegram/WhatsApp genéricos?

---

### 8. Constants (backend/app/constants/)

| Archivo | ¿Core o Template? | Notas |
|---------|-------------------|-------|
| `organizacion.constants.js` | ⚠️ REVISAR | ¿Constantes específicas de agendamiento? |
| `usuarios.constants.js` | ✅ CORE | Universal |
| `plan.constants.js` | ✅ CORE | Universal |
| **Específicos de Agendamiento:** | | |
| `cita.constants.js` | ❌ TEMPLATE | Específico |
| `profesional.constants.js` | ❌ TEMPLATE | Específico |
| `servicio.constants.js` | ❌ TEMPLATE | Específico |

**Acciones:**
- [ ] Revisar `organizacion.constants.js`: ¿`SELECT_FIELDS` incluye campos específicos?
- [ ] Mover constants específicas a `templates/scheduling-saas/constants/`

---

## 🚨 Puntos Críticos a Revisar

### 1. Middleware `subscription.js` - Validación de Límites

**Problema potencial:** ¿Los límites están hardcodeados para agendamiento?

```javascript
// ¿Así está ahora? (hardcoded para agendamiento)
const LIMITES_PLAN = {
  basico: {
    profesionales: 3,    // ❌ Específico de agendamiento
    servicios: 20,       // ❌ Específico de agendamiento
    citas_mes: 300       // ❌ Específico de agendamiento
  }
};

// ¿Debería ser así? (genérico, configurable por proyecto)
const LIMITES_PLAN = {
  basico: {
    recursos: 3,         // ✅ Genérico (profesionales, plantillas, productos, etc.)
    items: 20,           // ✅ Genérico (servicios, invitaciones, productos, etc.)
    operaciones_mes: 300 // ✅ Genérico (citas, envíos, ventas, etc.)
  }
};
```

**Acciones:**
- [ ] Revisar implementación actual de `subscription.js`
- [ ] Determinar si debe ser genérico o específico por template
- [ ] Opciones:
  - Opción A: Middleware genérico con límites configurables (en `planes` table)
  - Opción B: Middleware específico por template (cada proyecto define sus límites)

---

### 2. `organizacion.controller.js` - Setup Progress

**Problema potencial:** ¿El endpoint `/setup-progress` es específico de agendamiento?

```javascript
// ¿Así está ahora? (hardcoded steps de agendamiento)
GET /api/v1/organizaciones/:id/setup-progress
{
  "pasos_totales": 4,
  "pasos_completados": 2,
  "pasos": [
    { "nombre": "crear_profesionales", "completado": true },   // ❌ Específico
    { "nombre": "configurar_horarios", "completado": true },   // ❌ Específico
    { "nombre": "crear_servicios", "completado": false },      // ❌ Específico
    { "nombre": "asignar_servicios", "completado": false }     // ❌ Específico
  ]
}

// ¿Debería ser así? (genérico, configurable)
{
  "pasos_totales": 4,
  "pasos_completados": 2,
  "configuracion": "agendamiento",  // ✅ Template identifier
  "pasos": [...] // Definidos por el template
}
```

**Acciones:**
- [ ] Revisar SQL function `obtener_progreso_setup_organizacion()`
- [ ] Determinar si debe ser genérico o específico por template
- [ ] Opciones:
  - Opción A: Remover del core, mover a template
  - Opción B: Hacer genérico con pasos configurables en metadata JSONB

---

### 3. Chatbot Controller/Service - System Prompt

**Problema potencial:** ¿El system prompt está hardcodeado para agendamiento?

**Acciones:**
- [ ] Revisar `chatbot.controller.js`: ¿system prompt dinámico o hardcoded?
- [ ] Revisar MCP tools: ¿específicos de agendamiento (`verificarDisponibilidad`, `crearCita`)?
- [ ] Determinar si chatbots pueden ser genéricos
- [ ] Opciones:
  - Opción A: Core tiene estructura, template define tools y system prompt
  - Opción B: Chatbots completamente en template (específicos del dominio)

---

### 4. Marketplace Module

**Problema potencial:** ¿El marketplace está diseñado solo para negocios de agendamiento?

```sql
-- marketplace_perfiles
-- ¿Funciona para otros dominios?

-- Agendamiento: Barberías, Spas → marketplace de profesionales
-- Invitaciones: Diseñadores freelance → marketplace de diseñadores
-- E-commerce: Tiendas → marketplace de productos

-- ¿La estructura actual es genérica?
```

**Acciones:**
- [ ] Revisar tablas `marketplace_perfiles`, `marketplace_reseñas`, `marketplace_analytics`
- [ ] Revisar controllers: ¿lógica específica de agendamiento?
- [ ] Determinar si marketplace es reutilizable
- [ ] Opciones:
  - Opción A: Marketplace genérico (core) - funciona para cualquier dominio
  - Opción B: Marketplace específico (template) - solo para agendamiento

---

## 📝 Plan de Acción (Sesión Siguiente)

### Fase 1: Auditoría (2-3 horas)

1. **Revisar Middleware** (30 min)
   - [ ] `subscription.js` - Límites hardcodeados
   - [ ] `index.js` - Exports innecesarios

2. **Revisar Controllers Core** (1 hora)
   - [ ] `organizacion.controller.js` - Setup progress
   - [ ] `chatbot.controller.js` - System prompt
   - [ ] `marketplace/` - Lógica genérica vs específica

3. **Revisar Services** (45 min)
   - [ ] `n8nService.js` - Workflows hardcodeados
   - [ ] `n8nMcpCredentialsService.js` - MCP tools

4. **Revisar Models** (45 min)
   - [ ] `organizacion.model.js` - Queries específicas
   - [ ] `chatbot-config.model.js` - Estructura

### Fase 2: Clasificación (1 hora)

5. **Crear inventario**
   - [ ] Listar archivos CORE confirmados
   - [ ] Listar archivos TEMPLATE confirmados
   - [ ] Listar archivos AMBIGUOS (necesitan refactor)

### Fase 3: Propuesta de Refactor (1 hora)

6. **Documentar cambios necesarios**
   - [ ] Archivos a mover
   - [ ] Código a generalizar
   - [ ] Variables de entorno necesarias
   - [ ] Estructura final del starter kit

### Fase 4: Decisión (30 min)

7. **Validar con usuario**
   - [ ] Presentar propuesta
   - [ ] Acordar alcance del refactor
   - [ ] Priorizar cambios críticos

---

## ✅ Criterios de Éxito

Un backend está **correctamente desacoplado** cuando:

### ✅ Core Reutilizable

1. **Sin lógica de dominio específico**
   - ❌ No menciona "profesionales", "servicios", "citas", "invitaciones", etc.
   - ✅ Usa términos genéricos: "recursos", "items", "operaciones"

2. **Sin constantes hardcodeadas de dominio**
   - ❌ `ESTADOS_CITA = ['pendiente', 'confirmada', 'completada']`
   - ✅ Constantes configurables en variables de entorno o metadata

3. **Sin validaciones específicas de dominio**
   - ❌ Validar solapamiento de horarios (específico de agendamiento)
   - ✅ Validar tipos de datos genéricos (email, teléfono, JSONB)

4. **Sin queries que asumen tablas de dominio**
   - ❌ `JOIN profesionales ON ...`
   - ✅ Queries solo a tablas core (organizaciones, usuarios, planes)

### ✅ Templates Específicos

1. **Contienen TODA la lógica de dominio**
   - Controllers, Models, Schemas, Routes, Constants específicos

2. **Pueden copiarse independientemente**
   - No dependen de archivos fuera del template

3. **Definen sus propios seeds**
   - Categorías, catálogos, datos iniciales

4. **Documentan sus dependencias del core**
   - README.md explica qué módulos core requiere

---

## 📚 Referencias

- **Tabla `categorias`:** `sql/core/schema/01-tabla-categorias.sql`
- **Seeds agendamiento:** `sql/templates/scheduling-saas/seeds/categorias-agendamiento.sql`
- **CLAUDE.md:** Documentación técnica completa del proyecto
- **README.md SQL Core:** `sql/core/README.md`

---

## 🔄 Próximos Pasos

Después de esta auditoría y refactor, el siguiente paso será:

1. **Extraer el Starter Kit** - Crear repositorio `saas-starter-kit` con core limpio
2. **Documentar Template de Agendamiento** - README explicando cómo usar el template
3. **Crear Template de Invitaciones** - Validar reutilización con un segundo dominio
4. **Automatizar Setup** - Script `create-saas.sh` que inicializa proyecto desde template

---

**Fecha de última actualización:** 19 Noviembre 2025
**Siguiente sesión:** Auditoría completa del backend
**Responsable:** Claude Code + Equipo Desarrollo
