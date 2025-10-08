# Backend API - Plataforma SaaS Multi-Tenant de Agendamiento

![Status](https://img.shields.io/badge/status-production%20ready-success)
![Tests](https://img.shields.io/badge/tests-464%2F464%20passing-success)
![Coverage](https://img.shields.io/badge/coverage-100%25-success)
![Node](https://img.shields.io/badge/node-v18+-blue)
![PostgreSQL](https://img.shields.io/badge/postgresql-17-blue)

Backend API REST para plataforma SaaS multi-tenant de automatización de agendamiento empresarial con IA conversacional integrada (WhatsApp).

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Stack Técnico](#-stack-técnico)
- [Arquitectura](#-arquitectura)
- [Workflows del Sistema](#-workflows-del-sistema)
  - [1. Registro e Inicio de Sesión](#1-flujo-de-registro-e-inicio-de-sesión)
  - [2. Creación de Profesionales](#2-flujo-de-creación-de-profesionales)
  - [3. Creación de Servicios](#3-flujo-de-creación-de-servicios-y-asociación-con-profesionales)
  - [4. Establecimiento de Horarios](#4-flujo-de-establecimiento-de-horarios)
  - [5. Creación de Clientes](#5-flujo-de-creación-de-clientes)
  - [6. Agendamiento de Citas](#6-flujo-completo-de-agendamiento-de-citas)
  - [7. IA Conversacional (WhatsApp)](#7-flujo-de-ia-conversacional-whatsapp)
  - [8. Arquitectura Multi-Tenant](#8-arquitectura-multi-tenant-con-rls)
  - [9. RBAC - Matriz de Permisos](#9-rbac---matriz-de-permisos)
- [Comandos Esenciales](#-comandos-esenciales)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Seguridad Multi-Tenant](#-seguridad-multi-tenant)
- [Variables de Entorno](#-variables-de-entorno)
- [Testing](#-testing)
- [Reglas Críticas de Desarrollo](#-reglas-críticas-de-desarrollo)
- [Performance](#-performance)
- [Troubleshooting](#-troubleshooting)
- [Documentación Adicional](#-documentación-adicional)

---

## 🎯 Descripción General

Plataforma SaaS Multi-Tenant para automatización de agendamiento empresarial con las siguientes características:

- **Multi-Tenancy Seguro**: Row Level Security (RLS) en PostgreSQL con aislamiento total de datos
- **Autenticación JWT**: Sistema de tokens con refresh tokens automáticos
- **RBAC Completo**: 5 roles con permisos granulares (super_admin, propietario, administrador, usuario, solo_lectura)
- **IA Conversacional**: Integración con WhatsApp vía n8n + Evolution API
- **Auto-generación**: Códigos únicos para organizaciones, clientes, profesionales y citas
- **Testing Completo**: 464/464 tests pasando (100% de cobertura)

### Estado del Proyecto (Actualizado: 08 Oct 2025)

| Componente | Estado | Métricas |
|------------|--------|----------|
| **Backend API** | ✅ **100%** | 2,040 LoC controllers, RLS activo |
| **Base de Datos** | ✅ **100%** | 17 tablas, 17 RLS policies, 40 funciones |
| **Suite Tests** | ✅ **464/464 (100%)** | 21 test suites, ~53s ejecución |
| **Sistema IA** | ✅ **Operativo** | n8n + Evolution API (WhatsApp) |

---

## 🛠 Stack Técnico

### Backend
- **Runtime**: Node.js + Express.js
- **Autenticación**: JWT con refresh tokens
- **Validación**: Joi schemas modulares
- **Testing**: Jest + Supertest
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (RLS)
- **Performance**: 152 índices (covering, GIN, GIST)
- **Auto-generación**: Códigos únicos con triggers

### IA Conversacional
- **Orquestación**: n8n (stable) + Redis Queue
- **WhatsApp**: Evolution API
- **NLP**: Claude/GPT vía n8n workflows

---

## 📐 Arquitectura

### Módulos Principales

| Módulo | Routes | Controller | Model | Schemas | Total LoC | Patrón RLS |
|--------|--------|------------|-------|---------|-----------|------------|
| **Auth** | 42 | 230 | 1,072* | 355 | 1,699 | RLSHelper |
| **Usuarios** | 73 | 144 | 1,072* | 162 | 1,451 | RLSHelper |
| **Organizaciones** | 107 | 261 | 718 | 291 | 1,377 | RLSHelper |
| **Profesionales** | 101 | 168 | 489 | 310 | 1,068 | RLS Directo |
| **Servicios** | 123 | 199 | 574 | 204 | 1,100 | RLS Directo |
| **Clientes** | 91 | 158 | 525 | 305 | 1,079 | RLS Directo |
| **Horarios** | 92 | 148 | 754 | 168 | 1,162 | RLS Directo |
| **Citas** | 213 | 529 | 1,916 | 450 | 3,108 | RLS Directo |
| **Bloqueos** | 16 | 74 | 366 | 190 | 646 | RLS Directo |

*Comparten `usuario.model.js`

**Total**: ~12,690 líneas de código backend

### Middleware Stack

| Middleware | LoC | Función |
|------------|-----|---------|
| `asyncHandler.js` | 96 | Manejo automático de errores async |
| `auth.js` | 352 | JWT authentication + refresh tokens |
| `tenant.js` | 407 | Configuración RLS multi-tenant |
| `rateLimiting.js` | 529 | Rate limiting por IP + endpoint |
| `validation.js` | 393 | Validación Joi con contexto de usuario |

### Helpers/Utils

| Helper | LoC | Función |
|--------|-----|---------|
| `helpers.js` | 520 | ResponseHelper, OrganizacionHelper |
| `rlsHelper.js` | 151 | Contextos RLS reutilizables |
| `passwordHelper.js` | 108 | Hash y validación de contraseñas |
| `horarioHelpers.js` | 266 | Lógica de horarios y slots |
| `logger.js` | 273 | Winston structured logging |

### Base de Datos PostgreSQL

**17 Tablas Principales**:
```
Core (3):           organizaciones, usuarios, planes_subscripcion
Catálogo (2):       plantillas_servicios, profesionales
Negocio (4):        servicios, clientes, horarios_profesionales, horarios_disponibilidad
Operaciones (3):    citas, bloqueos_horarios, servicios_profesionales
Subscripciones (3): subscripciones, historial_subscripciones, metricas_uso_organizacion
Sistema (2):        eventos_sistema, eventos_sistema_archivo
```

**Seguridad y Performance**:
- **17 Políticas RLS** (multi-tenant + anti SQL-injection con REGEX `^[0-9]+$`)
- **27 Triggers** (auto-generación de códigos, capacidad, timestamps)
- **40 Funciones PL/pgSQL** (validaciones, generación automática)
- **152 Índices** (covering, GIN full-text, GIST temporal)

**ENUMs de Dominio (7)**:
```sql
rol_usuario:         super_admin, propietario, administrador, usuario, solo_lectura
estado_cita:         pendiente, confirmada, en_curso, completada, cancelada, no_asistio
industria_tipo:      barberia, salon_belleza, estetica, spa, consultorio_medico, etc.
tipo_profesional:    barbero, estilista, esteticista, masajista, doctor_general, etc.
plan_type:           trial, basico, profesional, empresarial, personalizado
estado_horario:      disponible, reservado, bloqueado
estado_subscripcion: activa, cancelada, suspendida, expirada
```

---

## 🔄 Workflows del Sistema

### 1. Flujo de Registro e Inicio de Sesión

```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as Backend API
    participant Auth as Auth Middleware
    participant Valid as Validation
    participant DB as PostgreSQL
    participant RLS as RLS Context

    Note over U,RLS: REGISTRO DE NUEVA ORGANIZACIÓN
    U->>API: POST /api/v1/auth/register
    API->>Valid: Validar schema (email, password, org)
    Valid->>API: ✅ Datos válidos
    API->>DB: BEGIN TRANSACTION
    API->>RLS: withBypass() - Crear sin tenant
    RLS->>DB: INSERT organizaciones (código auto: ORG001)
    DB-->>RLS: organizacion_id: 1
    RLS->>DB: INSERT usuarios (rol: propietario)
    DB-->>RLS: usuario_id: 1
    RLS->>DB: INSERT subscripciones (plan: trial)
    DB-->>API: COMMIT
    API->>Auth: Generar JWT + Refresh Token
    Auth-->>API: tokens generados
    API-->>U: 201 { user, tokens, organizacion }

    Note over U,RLS: INICIO DE SESIÓN
    U->>API: POST /api/v1/auth/login
    API->>Valid: Validar schema (email, password)
    Valid->>API: ✅ Datos válidos
    API->>RLS: withRole('login_context') - Sin tenant
    RLS->>DB: SELECT * FROM usuarios WHERE email = ?
    DB-->>RLS: usuario encontrado
    API->>Auth: Verificar password (bcrypt)
    Auth-->>API: ✅ Password correcto
    API->>Auth: Generar JWT + Refresh Token
    Auth-->>API: tokens generados
    API-->>U: 200 { user, tokens }

    Note over U,RLS: PETICIÓN AUTENTICADA
    U->>API: GET /api/v1/profesionales (Authorization: Bearer TOKEN)
    API->>Auth: authenticateToken()
    Auth->>Auth: Verificar JWT
    Auth-->>API: ✅ req.user = { id, rol, organizacion_id }
    API->>RLS: setTenantContext(organizacion_id)
    RLS->>DB: set_config('app.current_tenant_id', '1')
    DB-->>RLS: ✅ Contexto RLS configurado
    API->>Valid: validate(schema)
    Valid-->>API: ✅ Validación OK
    API->>DB: SELECT * FROM profesionales
    Note over DB: RLS filtra automáticamente por organizacion_id = 1
    DB-->>API: resultados filtrados
    API-->>U: 200 { data: [...] }
```

### 2. Flujo de Creación de Profesionales

```mermaid
sequenceDiagram
    participant Admin as Admin/Propietario
    participant API as Backend API
    participant MW as Middleware Stack
    participant DB as PostgreSQL
    participant Trigger as DB Triggers

    Admin->>API: POST /api/v1/profesionales
    Note over Admin: Headers: Authorization, X-Organization-Id (opcional)

    API->>MW: 1. authenticateToken()
    MW-->>API: ✅ req.user configurado

    API->>MW: 2. setTenantContext()
    MW->>DB: set_config('app.current_tenant_id', organizacion_id)
    DB-->>MW: ✅ Contexto RLS activo

    API->>MW: 3. apiRateLimit()
    MW-->>API: ✅ Dentro del límite

    API->>MW: 4. validate(profesionalSchemas.crear)
    Note over MW: Validaciones:<br/>- nombre_completo requerido<br/>- especialidades array<br/>- telefono formato válido<br/>- email único
    MW-->>API: ✅ Schema válido

    API->>MW: 5. checkRole(['propietario', 'administrador'])
    MW-->>API: ✅ Rol autorizado

    API->>DB: INSERT INTO profesionales (...)
    Note over DB: RLS Policy: solo inserta si<br/>organizacion_id = current_tenant_id

    DB->>Trigger: BEFORE INSERT trigger
    Trigger->>Trigger: Generar codigo_profesional único<br/>Formato: PROF-{org_code}-{seq}
    Trigger->>Trigger: Validar email único en organización
    Trigger-->>DB: ✅ Validaciones OK

    DB->>Trigger: AFTER INSERT trigger
    Trigger->>DB: UPDATE metricas_uso_organizacion<br/>SET profesionales_activos++

    DB-->>API: profesional creado con código: PROF-ORG001-001
    API-->>Admin: 201 { success: true, data: profesional }
```

### 3. Flujo de Creación de Servicios y Asociación con Profesionales

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant API as Backend API
    participant MW as Middleware
    participant DB as PostgreSQL
    participant SP as Tabla servicios_profesionales

    Note over Admin,SP: CREAR SERVICIO
    Admin->>API: POST /api/v1/servicios
    Note over Admin: Body: {<br/>  nombre: "Corte de cabello",<br/>  precio: 150.00,<br/>  duracion: 30,<br/>  profesionales_ids: [1, 2, 3]<br/>}

    API->>MW: Middleware Stack (auth, tenant, validation)
    MW-->>API: ✅ Todo OK, contexto RLS activo

    API->>DB: BEGIN TRANSACTION

    API->>DB: INSERT INTO servicios (...)<br/>VALUES (nombre, precio, duracion)
    Note over DB: RLS Policy aplica organizacion_id automáticamente
    DB-->>API: servicio_id: 10

    loop Para cada profesional_id en array
        API->>DB: SELECT id FROM profesionales<br/>WHERE id = ? AND activo = true
        Note over DB: RLS filtra por organizacion_id
        DB-->>API: ✅ Profesional existe

        API->>SP: INSERT INTO servicios_profesionales<br/>(servicio_id, profesional_id)
        SP-->>API: ✅ Asociación creada
    end

    API->>DB: UPDATE metricas_uso_organizacion<br/>SET servicios_activos++

    API->>DB: COMMIT TRANSACTION
    DB-->>API: ✅ Transacción exitosa

    API-->>Admin: 201 { success: true, data: servicio }

    Note over Admin,SP: LISTAR SERVICIOS DE UN PROFESIONAL
    Admin->>API: GET /api/v1/profesionales/1/servicios
    API->>MW: Middleware Stack
    MW-->>API: ✅ Autenticado

    API->>DB: SELECT s.* FROM servicios s<br/>JOIN servicios_profesionales sp<br/>ON s.id = sp.servicio_id<br/>WHERE sp.profesional_id = 1
    Note over DB: RLS filtra servicios por organizacion_id
    DB-->>API: Lista de servicios
    API-->>Admin: 200 { data: [...] }
```

### 4. Flujo de Establecimiento de Horarios

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant API as Backend API
    participant MW as Middleware
    participant Helper as HorarioHelper
    participant DB as PostgreSQL

    Note over Admin,DB: CONFIGURAR HORARIO BASE DEL PROFESIONAL
    Admin->>API: POST /api/v1/horarios/profesionales
    Note over Admin: Body: {<br/>  profesional_id: 1,<br/>  dia_semana: "lunes",<br/>  hora_inicio: "09:00",<br/>  hora_fin: "18:00",<br/>  duracion_slot: 30<br/>}

    API->>MW: Middleware Stack
    MW-->>API: ✅ Contexto RLS activo

    API->>Helper: validarHorarios(hora_inicio, hora_fin)
    Helper-->>API: ✅ Horarios válidos (no se solapan)

    API->>DB: INSERT INTO horarios_profesionales
    Note over DB: Trigger genera slots automáticamente
    DB->>DB: AFTER INSERT Trigger:<br/>Generar slots de 30 min<br/>09:00, 09:30, 10:00, ... 17:30
    DB->>DB: INSERT INTO horarios_disponibilidad<br/>(múltiples filas, estado: disponible)

    DB-->>API: Horario creado + 18 slots generados
    API-->>Admin: 201 { success: true, data: horario }

    Note over Admin,DB: CONSULTAR SLOTS DISPONIBLES
    Admin->>API: GET /api/v1/horarios/disponibles?profesional_id=1&fecha=2025-10-15
    API->>MW: Middleware Stack
    MW-->>API: ✅ Autenticado

    API->>Helper: calcularSlotsDisponibles(profesional_id, fecha)
    Helper->>DB: SELECT * FROM horarios_disponibilidad<br/>WHERE profesional_id = 1<br/>AND fecha = '2025-10-15'<br/>AND estado = 'disponible'
    Note over DB: RLS filtra por organizacion_id
    DB-->>Helper: Lista de slots disponibles

    Helper->>DB: SELECT * FROM citas<br/>WHERE profesional_id = 1<br/>AND fecha_cita = '2025-10-15'<br/>AND estado IN ('confirmada', 'pendiente')
    DB-->>Helper: Citas existentes

    Helper->>Helper: Filtrar slots ocupados<br/>Aplicar lógica de solapamiento
    Helper-->>API: Slots disponibles finales
    API-->>Admin: 200 { data: [slots] }

    Note over Admin,DB: CREAR BLOQUEO DE HORARIO
    Admin->>API: POST /api/v1/bloqueos
    Note over Admin: Body: {<br/>  profesional_id: 1,<br/>  fecha_inicio: "2025-10-20 14:00",<br/>  fecha_fin: "2025-10-20 16:00",<br/>  motivo: "Reunión"<br/>}

    API->>MW: Middleware Stack
    MW-->>API: ✅ Autenticado

    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT INTO bloqueos_horarios
    DB-->>API: bloqueo_id: 5

    API->>DB: UPDATE horarios_disponibilidad<br/>SET estado = 'bloqueado'<br/>WHERE profesional_id = 1<br/>AND fecha BETWEEN '2025-10-20 14:00' AND '2025-10-20 16:00'

    API->>DB: COMMIT
    DB-->>API: ✅ Bloqueo aplicado
    API-->>Admin: 201 { success: true, data: bloqueo }
```

### 5. Flujo de Creación de Clientes

```mermaid
sequenceDiagram
    participant User as Usuario/Recepcionista
    participant API as Backend API
    participant MW as Middleware
    participant DB as PostgreSQL
    participant Trigger as DB Triggers

    Note over User,Trigger: CREAR CLIENTE MANUALMENTE
    User->>API: POST /api/v1/clientes
    Note over User: Body: {<br/>  nombre: "Juan Pérez",<br/>  telefono: "+5491112345678",<br/>  email: "juan@example.com"<br/>}

    API->>MW: Middleware Stack (auth, tenant, validation)
    MW->>MW: Validar formato de teléfono y email
    MW-->>API: ✅ Schema válido

    API->>DB: SELECT * FROM clientes<br/>WHERE telefono = '+5491112345678'<br/>OR email = 'juan@example.com'
    Note over DB: RLS filtra por organizacion_id
    DB-->>API: No existe (OK para crear)

    API->>DB: INSERT INTO clientes (...)
    DB->>Trigger: BEFORE INSERT
    Trigger->>Trigger: Generar codigo_cliente único<br/>Formato: CLI-{org_code}-{seq}
    Trigger->>Trigger: Validar teléfono único en org
    Trigger-->>DB: ✅ Validaciones OK

    DB->>Trigger: AFTER INSERT
    Trigger->>DB: UPDATE metricas_uso_organizacion<br/>SET clientes_activos++

    DB-->>API: cliente creado: CLI-ORG001-001
    API-->>User: 201 { success: true, data: cliente }

    Note over User,Trigger: CREAR CLIENTE VÍA WHATSAPP (IA)
    participant WA as WhatsApp User
    participant N8N as n8n + IA

    WA->>N8N: Mensaje: "Quiero agendar corte"
    N8N->>N8N: Procesar con Claude/GPT
    N8N->>API: GET /api/v1/clientes/buscar-por-telefono?telefono=+549...
    Note over N8N: Endpoint sin auth,<br/>validación por organizacion_id

    API->>DB: SELECT * FROM clientes<br/>WHERE telefono = ? AND organizacion_id = ?
    DB-->>API: Cliente NO existe
    API-->>N8N: 404 { exists: false }

    N8N->>N8N: IA: Solicitar nombre del cliente
    WA-->>N8N: "Mi nombre es María López"

    N8N->>API: POST /api/v1/clientes (sin auth)
    Note over N8N: Body: {<br/>  organizacion_id: 1,<br/>  nombre: "María López",<br/>  telefono: "+549...",<br/>  via_whatsapp: true<br/>}

    API->>DB: INSERT INTO clientes
    DB->>Trigger: Triggers de generación + métricas
    DB-->>API: cliente creado: CLI-ORG001-002
    API-->>N8N: 201 { data: cliente }

    N8N-->>WA: "¡Perfecto María! ¿Qué servicio necesitas?"
```

### 6. Flujo Completo de Agendamiento de Citas

```mermaid
sequenceDiagram
    participant User as Usuario/Cliente
    participant API as Backend API
    participant MW as Middleware
    participant Helper as CitaHelper
    participant DB as PostgreSQL
    participant Trigger as DB Triggers

    Note over User,Trigger: VERIFICAR DISPONIBILIDAD
    User->>API: GET /api/v1/citas/disponibilidad
    Note over User: Params: {<br/>  profesional_id: 1,<br/>  servicio_id: 5,<br/>  fecha: "2025-10-20"<br/>}

    API->>MW: Middleware Stack
    MW-->>API: ✅ Autenticado

    API->>Helper: verificarDisponibilidad(params)
    Helper->>DB: SELECT duracion FROM servicios WHERE id = 5
    DB-->>Helper: duracion: 60 minutos

    Helper->>DB: SELECT * FROM horarios_disponibilidad<br/>WHERE profesional_id = 1<br/>AND fecha::date = '2025-10-20'<br/>AND estado = 'disponible'
    DB-->>Helper: Lista de slots

    Helper->>DB: SELECT * FROM citas<br/>WHERE profesional_id = 1<br/>AND fecha_cita::date = '2025-10-20'<br/>AND estado NOT IN ('cancelada', 'no_asistio')
    DB-->>Helper: Citas existentes

    Helper->>Helper: Calcular slots libres considerando:<br/>- Duración del servicio (60 min)<br/>- Solapamiento con citas<br/>- Bloqueos de horarios
    Helper-->>API: Slots disponibles: [10:00, 11:00, 15:00]
    API-->>User: 200 { slots_disponibles: [...] }

    Note over User,Trigger: CREAR CITA
    User->>API: POST /api/v1/citas
    Note over User: Body: {<br/>  cliente_id: 10,<br/>  profesional_id: 1,<br/>  servicio_id: 5,<br/>  fecha_cita: "2025-10-20 10:00:00",<br/>  notas: "Primera visita"<br/>}

    API->>MW: Middleware Stack
    MW-->>API: ✅ Validación OK

    API->>DB: BEGIN TRANSACTION

    API->>Helper: validarDisponibilidad()
    Helper->>DB: Verificar que slot siga disponible<br/>(lock FOR UPDATE)
    DB-->>Helper: ✅ Disponible

    API->>DB: INSERT INTO citas (cliente_id, profesional_id, servicio_id, fecha_cita, notas)
    Note over API: NO enviar codigo_cita (auto-generado)

    DB->>Trigger: BEFORE INSERT
    Trigger->>Trigger: Generar codigo_cita único<br/>Formato: {org_code}-YYYYMMDD-NNN<br/>Ej: ORG001-20251020-001
    Trigger->>Trigger: Validar capacidad del profesional
    Trigger-->>DB: ✅ Validaciones OK

    DB->>Trigger: AFTER INSERT
    Trigger->>DB: UPDATE horarios_disponibilidad<br/>SET estado = 'reservado'<br/>WHERE matches cita slot
    Trigger->>DB: UPDATE metricas_uso_organizacion<br/>SET citas_agendadas++

    DB-->>API: COMMIT
    API-->>API: Programar recordatorio (24h antes)
    API-->>User: 201 { success: true, data: { codigo_cita: "ORG001-20251020-001", ... } }

    Note over User,Trigger: ACTUALIZAR ESTADO DE CITA
    User->>API: PATCH /api/v1/citas/ORG001-20251020-001/estado
    Note over User: Body: { estado: "confirmada" }

    API->>MW: Middleware Stack
    MW-->>API: ✅ Autenticado

    API->>DB: UPDATE citas SET estado = 'confirmada'<br/>WHERE codigo_cita = 'ORG001-20251020-001'
    Note over DB: RLS filtra por organizacion_id
    DB->>Trigger: AFTER UPDATE trigger_auditoria
    Trigger->>DB: INSERT INTO eventos_sistema<br/>(tipo: 'cita_confirmada', detalles)

    DB-->>API: ✅ Estado actualizado
    API-->>User: 200 { success: true }

    Note over User,Trigger: CANCELAR CITA
    User->>API: DELETE /api/v1/citas/ORG001-20251020-001
    Note over User: Query: motivo="Cliente canceló"

    API->>MW: Middleware Stack
    MW-->>API: ✅ Autenticado

    API->>DB: BEGIN TRANSACTION
    API->>DB: UPDATE citas SET estado = 'cancelada'
    DB->>Trigger: AFTER UPDATE
    Trigger->>DB: UPDATE horarios_disponibilidad<br/>SET estado = 'disponible'<br/>(liberar slot)
    Trigger->>DB: INSERT INTO eventos_sistema

    DB-->>API: COMMIT
    API-->>User: 200 { success: true, mensaje: "Cita cancelada, slot liberado" }
```

### 7. Flujo de IA Conversacional (WhatsApp)

```mermaid
sequenceDiagram
    participant WA as Cliente WhatsApp
    participant EVO as Evolution API
    participant N8N as n8n Workflow
    participant IA as Claude/GPT
    participant API as Backend API
    participant DB as PostgreSQL

    Note over WA,DB: INICIO DE CONVERSACIÓN
    WA->>EVO: "Hola, quiero un corte de cabello"
    EVO->>N8N: Webhook message event
    N8N->>N8N: Extraer: telefono, organizacion_id

    N8N->>API: GET /api/v1/clientes/buscar-por-telefono?telefono=+549...&organizacion_id=1
    Note over N8N: Endpoint sin auth
    API->>DB: SELECT * FROM clientes WHERE telefono = ? AND organizacion_id = ?
    DB-->>API: cliente encontrado: { id: 15, nombre: "Carlos" }
    API-->>N8N: 200 { exists: true, data: cliente }

    N8N->>IA: Prompt: "Cliente Carlos quiere corte de cabello.<br/>Contexto: Barbería XYZ.<br/>Servicios disponibles: [...]"
    IA-->>N8N: "¡Hola Carlos! ¿Prefieres corte clásico ($150) o premium ($250)?"
    N8N->>EVO: Send message
    EVO-->>WA: "¡Hola Carlos! ¿Prefieres..."

    Note over WA,DB: SELECCIÓN DE SERVICIO Y PROFESIONAL
    WA->>EVO: "Corte premium con Juan"
    EVO->>N8N: Webhook message

    N8N->>IA: Analizar mensaje
    IA->>IA: Extraer intención:<br/>- servicio: "corte premium"<br/>- profesional: "Juan"

    N8N->>API: GET /api/v1/servicios?nombre=corte premium&organizacion_id=1
    API->>DB: SELECT * FROM servicios WHERE nombre ILIKE '%corte premium%'
    DB-->>API: { id: 5, nombre: "Corte Premium", precio: 250, duracion: 60 }
    API-->>N8N: 200 { data: servicio }

    N8N->>API: GET /api/v1/profesionales?nombre=Juan&organizacion_id=1
    API->>DB: SELECT * FROM profesionales WHERE nombre_completo ILIKE '%Juan%'
    DB-->>API: { id: 1, nombre_completo: "Juan Pérez" }
    API-->>N8N: 200 { data: profesional }

    N8N->>API: GET /api/v1/citas/disponibilidad?profesional_id=1&servicio_id=5&fecha=2025-10-20
    API->>DB: Query complejo de disponibilidad
    DB-->>API: slots: ["10:00", "11:00", "15:00"]
    API-->>N8N: 200 { slots_disponibles }

    IA-->>N8N: "Perfecto! Juan tiene disponible:<br/>- Hoy 10:00<br/>- Hoy 11:00<br/>- Hoy 15:00<br/>¿Cuál prefieres?"
    N8N->>EVO: Send message
    EVO-->>WA: "Perfecto! Juan tiene..."

    Note over WA,DB: CONFIRMAR Y CREAR CITA
    WA->>EVO: "15:00 por favor"
    EVO->>N8N: Webhook message

    N8N->>IA: Extraer hora seleccionada
    IA-->>N8N: hora_seleccionada: "15:00"

    N8N->>API: POST /api/v1/citas/automatica
    Note over N8N: Body: {<br/>  organizacion_id: 1,<br/>  cliente_id: 15,<br/>  profesional_id: 1,<br/>  servicio_id: 5,<br/>  fecha_cita: "2025-10-20 15:00:00",<br/>  via_whatsapp: true<br/>}

    API->>DB: BEGIN TRANSACTION
    API->>DB: Validar disponibilidad (lock)
    API->>DB: INSERT INTO citas
    DB->>DB: Trigger: generar codigo_cita
    DB->>DB: Trigger: actualizar horarios_disponibilidad
    DB->>DB: Trigger: incrementar métricas
    DB-->>API: COMMIT { codigo_cita: "ORG001-20251020-003" }
    API-->>N8N: 201 { success: true, data: cita }

    N8N->>IA: Generar confirmación personalizada
    IA-->>N8N: "✅ ¡Listo Carlos!<br/><br/>Tu cita está confirmada:<br/>📅 20/10/2025 15:00<br/>💈 Corte Premium<br/>👨‍🦱 Con Juan Pérez<br/>💰 $250<br/><br/>Código: ORG001-20251020-003<br/><br/>Te enviaremos un recordatorio 24h antes."

    N8N->>EVO: Send message
    EVO-->>WA: "✅ ¡Listo Carlos!..."

    N8N->>N8N: Programar recordatorio en Redis Queue<br/>(ejecutar 24h antes)

    Note over WA,DB: MODIFICAR CITA (OPCIONAL)
    WA->>EVO: "Puedo cambiar la cita a las 11:00?"
    EVO->>N8N: Webhook message

    N8N->>IA: Analizar intención
    IA-->>N8N: Intención: modificar_cita, nueva_hora: "11:00"

    N8N->>API: PUT /api/v1/citas/automatica/ORG001-20251020-003
    Note over N8N: Body: {<br/>  organizacion_id: 1,<br/>  fecha_cita: "2025-10-20 11:00:00"<br/>}

    API->>DB: Validar nueva disponibilidad
    API->>DB: UPDATE citas SET fecha_cita = '2025-10-20 11:00:00'
    DB->>DB: Trigger: liberar slot anterior (15:00)
    DB->>DB: Trigger: reservar nuevo slot (11:00)
    DB-->>API: ✅ Cita actualizada
    API-->>N8N: 200 { success: true }

    N8N->>IA: Generar confirmación
    IA-->>N8N: "✅ Perfecto! Cambié tu cita a las 11:00"
    N8N->>EVO: Send message
    EVO-->>WA: "✅ Perfecto! Cambié..."
```

### 8. Arquitectura Multi-Tenant con RLS

```mermaid
flowchart TB
    subgraph Cliente["🌐 Cliente HTTP"]
        REQ[Request]
    end

    subgraph Middleware["🛡️ Middleware Stack"]
        AUTH[1. authenticateToken<br/>Verifica JWT]
        TENANT[2. setTenantContext<br/>Configura RLS]
        RATE[3. apiRateLimit<br/>Rate limiting]
        VALID[4. validate schema<br/>Joi validation]
    end

    subgraph Controller["⚙️ Controller Layer"]
        CTRL[Controller Method<br/>sin WHERE organizacion_id]
    end

    subgraph Model["📦 Model Layer"]
        RLS_DIR[RLS Directo]
        RLS_HELP[RLSHelper]
    end

    subgraph Database["🗄️ PostgreSQL"]
        CONFIG[set_config<br/>'app.current_tenant_id', '1']
        POLICY[RLS Policy<br/>WHERE organizacion_id =<br/>current_setting::int]
        TABLE[(Tabla<br/>organizacion_id)]
    end

    REQ --> AUTH
    AUTH -->|req.user| TENANT
    TENANT -->|req.tenant| RATE
    RATE --> VALID
    VALID --> CTRL

    CTRL -->|Entidades simples| RLS_DIR
    CTRL -->|Lógica compleja| RLS_HELP

    RLS_DIR --> CONFIG
    RLS_HELP -->|withBypass<br/>withRole<br/>withSelfAccess| CONFIG

    CONFIG --> POLICY
    POLICY --> TABLE
    TABLE -->|Datos filtrados| CTRL
    CTRL -->|Response| Cliente

    style AUTH fill:#e1f5ff
    style TENANT fill:#fff3e0
    style POLICY fill:#f3e5f5
    style CONFIG fill:#e8f5e9
```

### 9. RBAC - Matriz de Permisos

```mermaid
flowchart LR
    subgraph Roles["👥 Roles del Sistema"]
        SA[super_admin<br/>🔴 Acceso total]
        PROP[propietario<br/>🟠 Gestión completa org]
        ADMIN[administrador<br/>🟡 Operaciones + lectura]
        USER[usuario<br/>🟢 Operaciones básicas]
        RO[solo_lectura<br/>🔵 Solo consultas]
    end

    subgraph Recursos["📊 Recursos"]
        ORG[Organizaciones]
        USR[Usuarios]
        PROF[Profesionales]
        SERV[Servicios]
        CLI[Clientes]
        CIT[Citas]
        HOR[Horarios]
    end

    SA -.->|CRUD all orgs| ORG
    SA -.->|CRUD all| USR
    SA -.->|CRUD all| PROF
    SA -.->|CRUD all| SERV
    SA -.->|CRUD all| CLI
    SA -.->|CRUD all| CIT
    SA -.->|CRUD all| HOR

    PROP -->|CRUD su org| ORG
    PROP -->|CREATE/READ/UPDATE| USR
    PROP -->|CRUD| PROF
    PROP -->|CRUD| SERV
    PROP -->|CRUD| CLI
    PROP -->|CRUD| CIT
    PROP -->|CRUD| HOR

    ADMIN -->|READ| ORG
    ADMIN -->|READ| USR
    ADMIN -->|CRUD| PROF
    ADMIN -->|CRUD| SERV
    ADMIN -->|CRUD| CLI
    ADMIN -->|CRUD| CIT
    ADMIN -->|CRUD| HOR

    USER -->|READ| PROF
    USER -->|READ| SERV
    USER -->|CRUD| CLI
    USER -->|CRUD| CIT
    USER -->|READ| HOR

    RO -->|READ| PROF
    RO -->|READ| SERV
    RO -->|READ| CLI
    RO -->|READ| CIT
    RO -->|READ| HOR

    style SA fill:#ffcdd2
    style PROP fill:#ffe0b2
    style ADMIN fill:#fff9c4
    style USER fill:#c8e6c9
    style RO fill:#bbdefb
```

---

## 🚀 Comandos Esenciales

### Tests Backend

```bash
# Suite completa (SIEMPRE usar "npm test")
docker exec back npm test                                    # 464 tests

# Test específico
docker exec back npm test -- __tests__/endpoints/auth.test.js

# Con watch mode
docker exec back npm test -- --watch

# ❌ NO USAR: docker exec back npx jest ...
# Razón: No establece NODE_ENV=test correctamente
```

### Docker

```bash
# Iniciar servicios
npm run start            # docker compose up -d

# Detener servicios
npm run stop             # docker compose down

# Reiniciar
npm run restart

# Ver logs
docker logs -f back
docker logs -f postgres_db

# Estado de contenedores
docker ps | grep -E "(back|postgres|n8n)"
```

### Base de Datos

```bash
# Consola PostgreSQL
docker exec postgres_db psql -U admin -d postgres

# Ver tablas
docker exec postgres_db psql -U admin -d postgres -c "\dt"

# Ver políticas RLS de una tabla
docker exec postgres_db psql -U admin -d postgres -c "\d clientes"

# Ejecutar query
docker exec postgres_db psql -U admin -d postgres -c "SELECT * FROM organizaciones LIMIT 5;"
```

---

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── controllers/      # Lógica de negocio (asyncHandler)
│   │   ├── auth.controller.js
│   │   ├── usuario.controller.js
│   │   ├── organizacion.controller.js
│   │   ├── profesional.controller.js
│   │   ├── servicio.controller.js
│   │   ├── cliente.controller.js
│   │   ├── horario.controller.js
│   │   ├── cita.controller.js
│   │   └── bloqueo.controller.js
│   │
│   ├── database/         # Models con RLS
│   │   └── models/
│   │       ├── auth.model.js
│   │       ├── usuario.model.js
│   │       ├── organizacion.model.js
│   │       ├── profesional.model.js
│   │       ├── servicio.model.js
│   │       ├── cliente.model.js
│   │       ├── horario.model.js
│   │       ├── cita.model.js
│   │       └── bloqueo.model.js
│   │
│   ├── middleware/       # Stack de seguridad
│   │   ├── asyncHandler.js      # Manejo automático errores
│   │   ├── auth.js              # JWT authentication
│   │   ├── tenant.js            # RLS multi-tenant
│   │   ├── rateLimiting.js      # Rate limiting
│   │   └── validation.js        # Joi validation
│   │
│   ├── routes/api/v1/    # Definición de endpoints
│   │   ├── auth.js
│   │   ├── usuarios.js
│   │   ├── organizaciones.js
│   │   ├── profesionales.js
│   │   ├── servicios.js
│   │   ├── clientes.js
│   │   ├── horarios.js
│   │   ├── citas.js
│   │   └── bloqueos.js
│   │
│   ├── schemas/          # Validaciones Joi modulares
│   │   ├── common.schemas.js
│   │   ├── auth.schemas.js
│   │   ├── usuario.schemas.js
│   │   ├── organizacion.schemas.js
│   │   ├── profesional.schemas.js
│   │   ├── servicio.schemas.js
│   │   ├── cliente.schemas.js
│   │   ├── horario.schemas.js
│   │   ├── cita.schemas.js
│   │   └── bloqueo.schemas.js
│   │
│   ├── utils/            # Helpers reutilizables
│   │   ├── helpers.js           # ResponseHelper, OrganizacionHelper
│   │   ├── rlsHelper.js         # Contextos RLS
│   │   ├── passwordHelper.js    # Hash y validación
│   │   ├── horarioHelpers.js    # Lógica de slots
│   │   └── logger.js            # Winston structured logs
│   │
│   └── __tests__/        # Suite completa de testing
│       ├── endpoints/           # 216 tests de API
│       ├── integration/         # 64 tests de integración
│       ├── middleware/          # 15 tests de middleware
│       ├── rbac/               # 33 tests de permisos
│       ├── business-logic/     # 9 tests de lógica
│       ├── concurrency/        # 7 tests de concurrencia
│       ├── e2e/                # 120 tests end-to-end
│       └── helpers/
│           └── db-helper.js    # Helpers de testing
│
├── config/               # Configuración
│   ├── database.js
│   ├── jwt.js
│   └── logger.js
│
└── logs/                 # Winston logs (JSON structured)
```

---

## 🔒 Seguridad Multi-Tenant

### Patrón de Middleware (OBLIGATORIO)

Todas las rutas protegidas deben seguir este orden:

```javascript
router.post('/endpoint',
    auth.authenticateToken,      // 1. JWT
    tenant.setTenantContext,     // 2. RLS ⚡ CRÍTICO
    rateLimiting.apiRateLimit,   // 3. Rate limit
    validation.validate(schema), // 4. Validación
    Controller.metodo            // 5. Controller
);
```

### RLS en Models

**Patrón 1: RLS Directo** (módulos de entidades)

```javascript
const db = await getDb();
try {
    await db.query('SELECT set_config($1, $2, false)',
        ['app.current_tenant_id', organizacion_id.toString()]);

    const query = `INSERT INTO profesionales (...) VALUES (...) RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0];
} finally {
    db.release();
}
```

**Patrón 2: RLSHelper** (lógica compleja)

```javascript
const RLSHelper = require('../utils/rlsHelper');

// Bypass RLS (solo super_admin)
return await RLSHelper.withBypass(db, async (db) => {
    return await db.query('SELECT * FROM usuarios');
});

// Contexto de login (sin tenant)
return await RLSHelper.withRole(db, 'login_context', async (db) => {
    return await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
});

// Self-access (usuario accediendo sus propios datos)
return await RLSHelper.withSelfAccess(db, userId, async (db) => {
    return await db.query('UPDATE usuarios SET nombre = $1 WHERE id = $2', [nombre, userId]);
});
```

### Validaciones con Joi Schemas

**Schemas Modulares** (ubicación: `backend/app/schemas/`):

```javascript
// schemas/servicio.schemas.js
const crear = {
    body: Joi.object({
        nombre: Joi.string().trim().min(1).max(100).required(),
        precio: commonSchemas.price.required(),
        // organizacion_id con validación condicional
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

// routes/servicios.js
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.crear),  // ✅ Schema modular
    ServicioController.crear
);
```

### Patrón organizacion_id (Header Enterprise)

**Migración**: 2025-10-06 - Header `X-Organization-Id` como estándar

**SUPER_ADMIN** (Prioridad descendente):
1. **Header X-Organization-Id** (✅ RECOMENDADO)
2. Query param `organizacion_id` (⚠️ DEPRECATED)
3. Body `organizacion_id` (⚠️ DEPRECATED)

**USUARIOS REGULARES**:
- Siempre usa `req.tenant.organizacionId` del JWT
- Schemas **prohíben** pasar `organizacion_id` (validación condicional)

```bash
# ✅ RECOMENDADO (super_admin)
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Organization-Id: 123" \
     GET /api/v1/citas

# ⚠️ DEPRECATED (mantener por compatibilidad)
curl -H "Authorization: Bearer TOKEN" \
     GET /api/v1/citas?organizacion_id=123
```

---

## 🌍 Variables de Entorno

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=postgres_db
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=postgres

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🧪 Testing

### Estado de Tests

**Backend (Jest + Supertest)**: 464/464 tests pasando (100%)

| Suite | Tests | Descripción |
|-------|-------|-------------|
| **Endpoints** | 216 | Tests de API REST (auth, usuarios, org, prof, serv, citas, etc.) |
| **Integration** | 64 | RLS, auto-generación, triggers, CRUD |
| **Middleware** | 15 | Auth JWT, Tenant Context |
| **RBAC** | 33 | Control de acceso granular |
| **Business Logic** | 9 | Métricas organizaciones |
| **Concurrency** | 7 | Prevención double-booking |
| **E2E** | 120 | Flujos completos de negocio |

### Ejecutar Tests

```bash
# Backend completo (~53s)
docker exec back npm test

# Suite específica
docker exec back npm test -- __tests__/endpoints/auth.test.js

# Con coverage
docker exec back npm test -- --coverage

# Watch mode
docker exec back npm test -- --watch
```

### Helpers de Testing

**Archivo**: `backend/app/__tests__/helpers/db-helper.js`

```javascript
const {
    createTestOrganizacion,    // Crea org con RLS bypass
    createTestUsuario,          // Genera token JWT automático
    createTestProfesional,
    createTestServicio,         // Asocia con profesionales automáticamente
    createTestCita,             // NO enviar codigo_cita (auto-generado)
    cleanAllTables              // Limpia en orden correcto (evita FK violations)
} = require('../helpers/db-helper');

// Setup típico
beforeAll(async () => {
    client = await global.testPool.connect();
    await cleanAllTables(client);

    testOrg = await createTestOrganizacion(client);
    testUsuario = await createTestUsuario(client, testOrg.id, { rol: 'propietario' });
    testProfesional = await createTestProfesional(client, testOrg.id);
    testServicio = await createTestServicio(client, testOrg.id, {
        nombre: 'Test',
        precio: 100.00
    }, [testProfesional.id]);
});
```

---

## ⚠️ Reglas Críticas de Desarrollo

### 1. Arquitectura Multi-Tenant

**Controllers confían en RLS** - NO usar `WHERE organizacion_id` manual:

```javascript
// ✅ CORRECTO (RLS filtra automáticamente)
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO (redundante, RLS ya filtra)
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

**Backend NO envía `codigo_cita`** - Auto-generado por trigger:

```javascript
// ✅ CORRECTO
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    servicio_id: 3,
    fecha_cita: '2025-10-10',
    // NO enviar codigo_cita
});
// cita.codigo_cita = "ORG001-20251010-001" (auto-generado)

// ❌ INCORRECTO
const cita = await CitaModel.crear({
    codigo_cita: 'manual',  // ❌ Error: trigger sobreescribe
    cliente_id: 1,
    ...
});
```

### 2. Schemas de BD vs Código (Consistencia)

**CRÍTICO**: Nombres de columnas deben coincidir:

```javascript
// ✅ CORRECTO (nombres exactos de BD)
SELECT nombre_comercial FROM organizaciones;
SELECT nombre_completo, especialidades FROM profesionales;
UPDATE horarios_disponibilidad SET estado = 'disponible';
UPDATE citas SET estado = 'en_curso';

// ❌ INCORRECTO
SELECT nombre FROM organizaciones;              // ❌ No existe
SELECT nombre, especialidad FROM profesionales;  // ❌ No existe
UPDATE horarios SET disponible = true;          // ❌ columna incorrecta
UPDATE citas SET estado = 'en_proceso';         // ❌ ENUM inválido
```

### 3. Checklist para Nuevos Módulos

Al crear/refactorizar un módulo:

**Routes** (`routes/api/v1/[modulo].js`):
- [ ] 1 línea por endpoint (sin comentarios JSDoc redundantes)
- [ ] Middleware en orden: auth → tenant → rateLimit → validation → controller
- [ ] Agrupación lógica (públicas vs privadas)

**Controller** (`controllers/[modulo].controller.js`):
- [ ] Todos los métodos usan `asyncHandler`
- [ ] Sin try/catch manual (asyncHandler lo maneja)
- [ ] Usa `ResponseHelper` para respuestas
- [ ] Sin logs de éxito (solo errores críticos)

**Model** (`database/[modulo].model.js`):
- [ ] Usa RLS apropiado según complejidad:
  - RLS directo para entidades (Profesionales, Servicios, Citas)
  - RLSHelper para lógica compleja (Auth, Usuarios)
- [ ] `db.release()` en bloque finally

**Schemas** (`schemas/[modulo].schemas.js`):
- [ ] Constantes de validación centralizadas
- [ ] Reutiliza `commonSchemas` cuando sea posible
- [ ] Validación condicional para `organizacion_id`

**Tests** (`__tests__/endpoints/[modulo].test.js`):
- [ ] Usa helpers de `db-helper`
- [ ] Limpieza en beforeAll/afterAll
- [ ] Cobertura: happy path + edge cases
- [ ] 100% de tests pasando

---

## ⚡ Performance

- **152 índices** en BD (covering, GIN full-text, GIST temporal)
- **Rate limiting** por IP + endpoint
- **Queries optimizadas** (<100ms)
- **Auto-generación** de códigos únicos con triggers
- **RLS policies** con anti SQL-injection (REGEX `^[0-9]+$`)
- **Connection pooling** para PostgreSQL

### Métricas de Performance

| Operación | Tiempo Promedio |
|-----------|-----------------|
| Autenticación JWT | <10ms |
| Query con RLS | <50ms |
| Creación de cita | <100ms |
| Búsqueda full-text | <30ms |

---

## 🔧 Troubleshooting

### Error: Tests con timeout o "NODE_ENV debe ser test"

**Síntomas**:
```
Error: Command timed out after 1m 0s
❌ NODE_ENV debe ser "test" para ejecutar tests
```

**✅ SOLUCIÓN - Usar SIEMPRE `npm test`**:
```bash
docker exec back npm test                                    # ✅
docker exec back npm test -- __tests__/endpoints/auth.test.js  # ✅

# ❌ NO USAR: docker exec back npx jest ...
```

**Por qué**: El script `npm test` establece `NODE_ENV=test` y configura el pool correctamente.

### Error: "column does not exist"

```javascript
// ❌ INCORRECTO
SELECT nombre FROM organizaciones               // Error: column "nombre" does not exist
SELECT p.nombre, p.especialidad FROM profesionales  // Error: column "especialidad" does not exist

// ✅ CORRECTO
SELECT nombre_comercial FROM organizaciones
SELECT p.nombre_completo, p.especialidades FROM profesionales
```

### Error: "El profesional no está autorizado para realizar este servicio"

**Causa**: Falta asociación en `servicios_profesionales`

**Solución**: Usar helper que asocia automáticamente
```javascript
testServicio = await createTestServicio(client, testOrg.id, {
    nombre: 'Test',
    precio: 100.00
}, [profesionalId]);  // ✅ Array de profesionales autorizados
```

### Error: "RLS context not set"

**Causa**: Falta middleware `tenant.setTenantContext`

**Solución**:
```javascript
// ✅ CORRECTO
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,  // ⚡ CRÍTICO
    Controller.listar
);
```

---

## 📚 Documentación Adicional

| Archivo | Descripción |
|---------|-------------|
| [`/CLAUDE.md`](../CLAUDE.md) | Guía completa del proyecto |
| [`/sql/README.md`](../sql/README.md) | Documentación de base de datos (RLS, triggers, funciones) |
| [`/backend/app/__tests__/README.md`](./__tests__/README.md) | Plan de testing completo |
| [`/PROMPT_AGENTE_N8N.md`](../PROMPT_AGENTE_N8N.md) | Configuración de agente IA para n8n |

---

## 🤝 Contribución

### Patrones Implementados

- ✅ 100% controllers usan `asyncHandler` (manejo automático de errores)
- ✅ 100% endpoints usan schemas Joi modulares
- ✅ 100% responses usan `ResponseHelper` (formato consistente)
- ✅ Módulos de entidades usan RLS directo (más simple)
- ✅ Módulos con lógica compleja usan `RLSHelper` (Auth, Usuarios, Organizaciones)

### Próximos Pasos

1. **Módulo Clientes**: Aplicar patrón asyncHandler + RLS directo
2. **Módulo Horarios**: Optimizar controller (148 LoC actualmente)
3. **Consolidar helpers**: Unificar helpers comunes entre módulos
4. **Documentación API**: Generar OpenAPI/Swagger automático

---

## 📄 Licencia

Este proyecto es propietario y confidencial.

---

**Estado**: ✅ Production Ready | 464/464 tests pasando
**Versión**: 1.0
**Última actualización**: 08 Octubre 2025
**Mantenido por**: Equipo de Desarrollo
