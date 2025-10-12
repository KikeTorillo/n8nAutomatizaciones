# Backend API - Sistema SaaS Multi-Tenant de Agendamiento

**Versión:** 1.0.0
**Estado:** Production Ready | 481/482 tests pasando (99.8%)
**Stack:** Node.js 18+ | Express.js | PostgreSQL 17 | JWT
**Arquitectura:** Multi-Tenant con Row Level Security (RLS)

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Multi-Tenancy](#multi-tenancy)
- [Endpoints Principales](#endpoints-principales)
- [Flujos de Negocio](#flujos-de-negocio)
- [Esquemas de Datos](#esquemas-de-datos)
- [Códigos de Estado](#códigos-de-estado)
- [Ejemplos de Integración](#ejemplos-de-integración)
- [Mejores Prácticas](#mejores-prácticas)

---

## Visión General

Backend RESTful API para sistema SaaS multi-tenant de agendamiento empresarial con IA conversacional (WhatsApp).

### Características Principales

- ✅ **Multi-Tenant Seguro** - Aislamiento total con RLS a nivel BD
- ✅ **Autenticación JWT** - Access tokens (15min) + Refresh tokens (7d)
- ✅ **Validación Robusta** - Schemas Joi en todos los endpoints
- ✅ **Rate Limiting** - Protección anti-abuso (100 req/15min)
- ✅ **Logging Estructurado** - Winston con contexto completo
- ✅ **Testing Exhaustivo** - 481/482 tests (99.8% coverage)

### Stack Tecnológico

```
Node.js 18 + Express.js
├── Autenticación: JWT (jsonwebtoken)
├── Base de Datos: PostgreSQL 17 (pg)
├── Validación: Joi
├── Testing: Jest + Supertest
├── Logging: Winston
├── Seguridad: Helmet + express-rate-limit
└── Documentación: Swagger (pendiente)
```

### Variables de Entorno Requeridas

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=postgres_db
DB_PORT=5432
DB_NAME=postgres
DB_USER=saas_app
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

---

## Autenticación y Seguridad

### Flujo de Autenticación

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend API
    participant DB as PostgreSQL

    Note over F,DB: 1. LOGIN
    F->>B: POST /api/v1/auth/login<br/>{email, password}
    B->>DB: Verificar credenciales
    DB-->>B: Usuario + organizacion_id
    B-->>F: {accessToken, refreshToken, user}

    Note over F,DB: 2. REQUEST AUTENTICADO
    F->>B: GET /api/v1/citas<br/>Authorization: Bearer {accessToken}<br/>X-Organization-Id: 123
    B->>B: Validar JWT
    B->>B: setTenantContext(org_id)
    B->>DB: SELECT * FROM citas<br/>(RLS filtra por org_id)
    DB-->>B: Solo citas de org 123
    B-->>F: {success: true, data: [...]}

    Note over F,DB: 3. TOKEN EXPIRADO
    F->>B: GET /api/v1/citas<br/>Authorization: Bearer {expired}
    B-->>F: {success: false, error: "Token expirado"}
    F->>B: POST /api/v1/auth/refresh<br/>{refreshToken}
    B->>DB: Validar refresh token
    DB-->>B: OK
    B-->>F: {accessToken, refreshToken}

    Note over F,DB: 4. LOGOUT
    F->>B: POST /api/v1/auth/logout<br/>{refreshToken}
    B->>DB: Invalidar refresh token
    B-->>F: {success: true}
```

### Headers Requeridos

#### Autenticación (Todos los endpoints protegidos)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Multi-Tenancy (Super Admin)

```http
X-Organization-Id: 123
```

**IMPORTANTE:**
- Usuarios regulares NO necesitan `X-Organization-Id` (usa su org del JWT)
- Super admin DEBE enviar `X-Organization-Id` en TODAS las peticiones

### Endpoints de Autenticación

#### POST /api/v1/auth/login

```javascript
// Request
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "Password123!"
}

// Response 200 OK
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@empresa.com",
      "nombre_completo": "Juan Perez",
      "rol": "admin",
      "organizacion_id": 123,
      "organizacion": {
        "id": 123,
        "nombre_comercial": "Barberia El Clasico"
      }
    }
  },
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

#### POST /api/v1/auth/refresh

```javascript
// Request
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response 200 OK
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2025-10-09T12:15:00.000Z"
}
```

#### POST /api/v1/auth/logout

```javascript
// Request
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response 200 OK
{
  "success": true,
  "message": "Sesión cerrada exitosamente",
  "timestamp": "2025-10-09T12:30:00.000Z"
}
```

---

## Multi-Tenancy

### Arquitectura Multi-Tenant

```mermaid
flowchart TB
    subgraph Frontend
        A[Usuario se autentica]
        B[Recibe JWT con organizacion_id]
    end

    subgraph Backend
        C[Middleware: authenticateToken]
        D[Middleware: setTenantContext]
        E[Extrae organizacion_id del JWT]
        F{Es super_admin?}
        G[Usa X-Organization-Id header]
        H[Usa organizacion_id del JWT]
        I[Configura RLS: set_config]
    end

    subgraph PostgreSQL
        J[RLS Policy Activo]
        K[WHERE organizacion_id = current_setting]
        L[Solo retorna datos del tenant]
    end

    A --> B --> C --> D --> E --> F
    F -->|Si| G --> I
    F -->|No| H --> I
    I --> J --> K --> L
```

### Patrón de Request Multi-Tenant

**Usuario Regular:**
```http
GET /api/v1/citas
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
> Backend usa `organizacion_id` del JWT automáticamente

**Super Admin:**
```http
GET /api/v1/citas
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Organization-Id: 123
```
> Backend usa `organizacion_id` del header

### Ejemplo de Aislamiento

```mermaid
flowchart LR
    subgraph Org1[Organización 123]
        U1[Usuario A<br/>org_id: 123]
        C1[Citas de Org 123]
    end

    subgraph Org2[Organización 456]
        U2[Usuario B<br/>org_id: 456]
        C2[Citas de Org 456]
    end

    subgraph DB[PostgreSQL RLS]
        RLS[Row Level Security]
        Q1[Query con org_id = 123]
        Q2[Query con org_id = 456]
    end

    U1 -->|JWT| Q1 -->|RLS Filter| C1
    U2 -->|JWT| Q2 -->|RLS Filter| C2

    style C1 fill:#90EE90
    style C2 fill:#87CEEB
    style RLS fill:#FFD700
```

---

## Endpoints Principales

### Base URL

```
http://localhost:3000/api/v1
```

### Módulos Disponibles

| Módulo | Base Path | Descripción |
|--------|-----------|-------------|
| **Auth** | `/auth` | Login, refresh, logout, registro |
| **Usuarios** | `/usuarios` | Gestión de usuarios |
| **Organizaciones** | `/organizaciones` | Configuración de empresas |
| **Profesionales** | `/profesionales` | Personal que atiende |
| **Clientes** | `/clientes` | Base de clientes |
| **Servicios** | `/servicios` | Catálogo de servicios |
| **Citas** | `/citas` | Sistema de agendamiento |
| **Bloqueos** | `/bloqueos-horarios` | Vacaciones, feriados |

### Endpoints CRUD Estándar

Todos los módulos siguen el patrón RESTful:

```http
GET    /api/v1/{modulo}           # Listar (con filtros y paginación)
POST   /api/v1/{modulo}           # Crear
GET    /api/v1/{modulo}/:id       # Obtener por ID
PUT    /api/v1/{modulo}/:id       # Actualizar
DELETE /api/v1/{modulo}/:id       # Eliminar
```

### Paginación y Filtros

```http
GET /api/v1/citas?page=1&limit=20&fecha_desde=2025-10-01&fecha_hasta=2025-10-31
```

**Response con paginación:**
```json
{
  "success": true,
  "message": "Citas obtenidas exitosamente",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

---

## Flujos de Negocio

### 1. Flujo de Onboarding (Nueva Organización)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL

    Note over F,DB: 1. CREAR ORGANIZACIÓN
    F->>B: POST /api/v1/organizaciones<br/>{nombre, industria, plan}
    B->>DB: INSERT organizaciones
    DB->>DB: Trigger auto-genera codigo_org
    DB-->>B: organización creada
    B->>DB: INSERT subscripcion (plan trial)
    B-->>F: {organizacion, subscripcion}

    Note over F,DB: 2. CREAR USUARIO PROPIETARIO
    F->>B: POST /api/v1/usuarios<br/>{email, password, organizacion_id, rol: propietario}
    B->>DB: Validar email único
    B->>DB: Hash password (bcrypt)
    B->>DB: INSERT usuario
    DB-->>B: usuario creado
    B-->>F: {usuario, accessToken, refreshToken}

    Note over F,DB: 3. CREAR PROFESIONALES
    F->>B: POST /api/v1/profesionales<br/>{nombre, especialidades, organizacion_id}
    B->>DB: INSERT profesionales<br/>(RLS filtra por org)
    DB-->>B: profesional creado
    B-->>F: {profesional}

    Note over F,DB: 4. CREAR SERVICIOS
    F->>B: POST /api/v1/servicios<br/>{nombre, duracion, precio}
    B->>DB: INSERT servicios
    B->>DB: INSERT servicios_profesionales
    DB-->>B: servicio creado
    B-->>F: {servicio}

    Note over F,DB: 5. CONFIGURAR HORARIOS
    F->>B: POST /api/v1/profesionales/:id/horarios<br/>{dia_semana, hora_inicio, hora_fin}
    B->>DB: INSERT horarios_profesionales
    DB-->>B: horarios base creados
    B-->>F: {horarios_profesionales}

    Note: Disponibilidad se calcula dinámicamente<br/>desde horarios_profesionales al consultar citas
```

### 2. Flujo de Agendamiento Manual

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL

    Note over F,DB: 1. BUSCAR/CREAR CLIENTE
    F->>B: GET /api/v1/clientes/buscar?telefono=5551234567
    B->>DB: SELECT * FROM clientes<br/>WHERE telefono % '5551234567'<br/>(similarity search)
    DB-->>B: Cliente encontrado
    B-->>F: {cliente}

    alt Cliente no existe
        F->>B: POST /api/v1/clientes<br/>{nombre, telefono, email}
        B->>DB: INSERT clientes
        DB-->>B: cliente creado
        B-->>F: {cliente}
    end

    Note over F,DB: 2. CONSULTAR DISPONIBILIDAD
    F->>B: GET /api/v1/citas/disponibilidad<br/>?profesional_id=1&fecha=2025-10-15&servicio_id=2
    B->>DB: Validar horarios_profesionales<br/>+ bloqueos_horarios + citas existentes
    DB-->>B: slots calculados en tiempo real
    B-->>F: [{hora_inicio: "09:00", hora_fin: "09:30"}, ...]

    Note over F,DB: 3. CREAR CITA
    F->>B: POST /api/v1/citas<br/>{cliente_id, profesional_id, servicio_id, fecha, hora}
    B->>DB: BEGIN TRANSACTION
    B->>DB: Validar entidades relacionadas
    B->>DB: Validar horario permitido (horarios_profesionales)
    B->>DB: Validar conflicto de citas
    B->>DB: INSERT citas
    DB->>DB: Trigger auto-genera codigo_cita<br/>(ORG001-20251015-001)
    B->>DB: COMMIT
    DB-->>B: cita creada
    B-->>F: {cita con codigo_cita}

    Note over F,DB: 4. CONFIRMACIÓN
    F->>B: PATCH /api/v1/citas/:id/confirmar-asistencia
    B->>DB: UPDATE citas SET estado = 'confirmada'
    DB-->>B: cita confirmada
    B-->>F: {cita actualizada}
```

### 3. Flujo Operacional (Día de Trabajo)

```mermaid
stateDiagram-v2
    [*] --> Pendiente: Cita creada
    Pendiente --> Confirmada: Cliente confirma
    Confirmada --> Check_In: Cliente llega
    Check_In --> En_Curso: Profesional inicia
    En_Curso --> Completada: Servicio terminado
    Completada --> [*]

    Pendiente --> Cancelada: Cliente cancela
    Confirmada --> Cancelada: Cliente cancela
    Confirmada --> No_Asistio: Cliente no llega (15min)

    Cancelada --> [*]
    No_Asistio --> [*]

    note right of Pendiente
        Estado inicial
        codigo_cita auto-generado
    end note

    note right of Check_In
        POST /api/v1/citas/:id/check-in
        Marca hora_llegada
    end note

    note right of En_Curso
        POST /api/v1/citas/:id/start-service
        Marca hora_inicio_real
    end note

    note right of Completada
        POST /api/v1/citas/:id/complete
        Marca hora_fin_real
        Actualiza ingresos
    end note
```

### 4. Flujo Walk-In (Cliente sin Cita)

```mermaid
sequenceDiagram
    participant R as Recepcionista
    participant B as Backend
    participant DB as PostgreSQL

    Note over R,DB: CLIENTE LLEGA SIN CITA
    R->>B: GET /api/v1/citas/disponibilidad-inmediata<br/>?servicio_id=1&profesional_id=2
    B->>DB: Buscar horario disponible inmediato
    DB-->>B: Próximo slot: 10:15-10:45
    B-->>R: {disponible: true, slot: {...}}

    R->>B: POST /api/v1/citas/walk-in<br/>{cliente_id, servicio_id, profesional_id}
    B->>DB: BEGIN TRANSACTION
    B->>DB: Buscar slot inmediato
    B->>DB: INSERT cita con estado 'confirmada'
    B->>DB: UPDATE horario SET ocupado
    B->>DB: COMMIT
    DB-->>B: cita creada
    B-->>R: {cita, codigo_cita, hora_asignada}

    Note over R,DB: OPCIÓN: CREAR CLIENTE EN EL MOMENTO
    alt Cliente nuevo
        R->>B: POST /api/v1/clientes/rapido<br/>{nombre, telefono}
        B->>DB: INSERT cliente (datos mínimos)
        DB-->>B: cliente creado
        B-->>R: {cliente_id}
    end
```

### 5. Dashboard y Métricas Tiempo Real

```mermaid
flowchart TB
    subgraph Frontend
        A[Dashboard Component]
        B[useEffect polling cada 30s]
    end

    subgraph Backend_Endpoints[Backend Endpoints]
        C[GET /api/v1/citas/dashboard/today]
        D[GET /api/v1/citas/cola-espera]
        E[GET /api/v1/citas/metricas-tiempo-real]
    end

    subgraph PostgreSQL
        F[Vista optimizada con índices]
        G[Query < 50ms]
    end

    A --> B
    B --> C
    B --> D
    B --> E

    C --> F --> G
    D --> F --> G
    E --> F --> G

    G --> H["{<br/>total_citas: 45,<br/>pendientes: 12,<br/>completadas: 20,<br/>ingresos: 15680,<br/>tiempo_promedio: 28min<br/>}"]

    H --> A
```

---

## Esquemas de Datos

### Cita (Endpoint: /api/v1/citas)

```typescript
interface Cita {
  // IDs
  id: number;
  codigo_cita: string;           // Auto-generado: ORG001-20251015-001
  organizacion_id: number;
  cliente_id: number;
  profesional_id: number;
  servicio_id: number;
  horario_id?: number;

  // Datos de agendamiento
  fecha_cita: string;            // YYYY-MM-DD
  hora_inicio: string;           // HH:MM
  hora_fin: string;              // HH:MM
  duracion_estimada: number;     // minutos

  // Estado y control
  estado: 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio';
  origen: 'manual' | 'whatsapp' | 'web' | 'walk_in';

  // Operacional
  hora_llegada?: string;         // Check-in
  hora_inicio_real?: string;     // Start service
  hora_fin_real?: string;        // Complete
  duracion_real?: number;        // minutos

  // Financiero
  precio_servicio: number;       // Precio base del servicio
  descuento?: number;            // % descuento aplicado
  precio_final: number;          // Precio con descuento

  // Recordatorios
  recordatorio_enviado: boolean;
  fecha_recordatorio?: string;

  // Calificación
  calificacion_cliente?: number; // 1-5 estrellas
  comentario_cliente?: string;

  // Metadata
  notas?: string;
  metadata?: object;

  // Auditoría
  creado_por?: number;
  actualizado_por?: number;
  creado_en: string;            // ISO 8601
  actualizado_en: string;       // ISO 8601
}
```

### Cliente

```typescript
interface Cliente {
  id: number;
  organizacion_id: number;
  nombre: string;
  telefono: string;
  email?: string;
  fecha_nacimiento?: string;
  genero?: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';

  // Marketing
  como_nos_conocio?: string;
  preferencias_comunicacion?: object;

  // Historial
  total_citas: number;
  total_gastado: number;
  ultima_visita?: string;

  // Control
  activo: boolean;
  notas?: string;

  creado_en: string;
  actualizado_en: string;
}
```

### Profesional

```typescript
interface Profesional {
  id: number;
  organizacion_id: number;
  nombre_completo: string;
  tipo_profesional: 'barbero' | 'estilista' | 'esteticista' | 'masajista' | 'doctor_general' | 'otro';
  especialidades: string[];      // Array JSON

  // Contacto
  telefono?: string;
  email?: string;

  // Configuración
  color_calendario?: string;     // Hex color
  permite_walk_in: boolean;
  tiempo_preparacion: number;    // minutos entre citas

  // Comisiones
  tipo_comision?: 'porcentaje' | 'fijo';
  valor_comision?: number;

  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}
```

### Servicio

```typescript
interface Servicio {
  id: number;
  organizacion_id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;

  // Duración y precio
  duracion_minutos: number;
  precio: number;

  // Configuración
  permite_walk_in: boolean;
  requiere_deposito: boolean;
  monto_deposito?: number;

  // Profesionales asignados
  profesionales?: number[];      // IDs de profesionales que ofrecen este servicio

  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}
```

---

## Códigos de Estado

### Respuestas Exitosas

| Código | Significado | Uso |
|--------|-------------|-----|
| **200** | OK | GET, PUT exitoso |
| **201** | Created | POST exitoso (recurso creado) |
| **204** | No Content | DELETE exitoso |

### Errores del Cliente

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| **400** | Bad Request | Datos de validación inválidos |
| **401** | Unauthorized | Token JWT inválido o expirado |
| **403** | Forbidden | Sin permisos para el recurso |
| **404** | Not Found | Recurso no existe |
| **409** | Conflict | Conflicto (ej: horario ocupado, email duplicado) |
| **422** | Unprocessable Entity | Lógica de negocio no permite la operación |
| **423** | Locked | Usuario bloqueado por intentos fallidos |
| **429** | Too Many Requests | Rate limit excedido |

### Errores del Servidor

| Código | Significado |
|--------|-------------|
| **500** | Internal Server Error |
| **503** | Service Unavailable |

### Formato de Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {
    "campo": "Mensaje de validación específico"
  },
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

---

## Ejemplos de Integración

### React/Vue/Angular - Setup Básico

```javascript
// config/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Si es super_admin, agregar X-Organization-Id
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const selectedOrgId = localStorage.getItem('selectedOrgId');

    if (user.rol === 'super_admin' && selectedOrgId) {
      config.headers['X-Organization-Id'] = selectedOrgId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es el endpoint de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        // Reintentar request original
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló, redirigir a login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Ejemplo: Login y Manejo de Sesión

```javascript
// services/authService.js
import api from '../config/api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });

    // Guardar tokens y usuario
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    return data.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.clear();
      window.location.href = '/login';
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
};
```

### Ejemplo: CRUD de Citas

```javascript
// services/citasService.js
import api from '../config/api';

export const citasService = {
  // Listar con filtros y paginación
  async listar(filtros = {}) {
    const { data } = await api.get('/citas', { params: filtros });
    return data;
  },

  // Crear cita
  async crear(citaData) {
    const { data } = await api.post('/citas', citaData);
    return data;
  },

  // Obtener por ID
  async obtener(id) {
    const { data } = await api.get(`/citas/${id}`);
    return data;
  },

  // Actualizar
  async actualizar(id, citaData) {
    const { data } = await api.put(`/citas/${id}`, citaData);
    return data;
  },

  // Eliminar
  async eliminar(id) {
    const { data } = await api.delete(`/citas/${id}`);
    return data;
  },

  // Operacionales
  async checkIn(id, datosCheckIn = {}) {
    const { data } = await api.post(`/citas/${id}/check-in`, datosCheckIn);
    return data;
  },

  async startService(id, datosInicio = {}) {
    const { data } = await api.post(`/citas/${id}/start-service`, datosInicio);
    return data;
  },

  async complete(id, datosCompletado) {
    const { data } = await api.post(`/citas/${id}/complete`, datosCompletado);
    return data;
  },

  // Dashboard
  async dashboardToday(profesionalId = null) {
    const { data } = await api.get('/citas/dashboard/today', {
      params: { profesional_id: profesionalId }
    });
    return data;
  },

  async colaEspera(profesionalId = null) {
    const { data } = await api.get('/citas/cola-espera', {
      params: { profesional_id: profesionalId }
    });
    return data;
  }
};
```

### Ejemplo: Componente React con Polling

```javascript
// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { citasService } from '../services/citasService';

function Dashboard() {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar métricas cada 30 segundos
  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const data = await citasService.dashboardToday();
        setMetricas(data.data);
      } catch (error) {
        console.error('Error cargando métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetricas(); // Carga inicial

    const interval = setInterval(fetchMetricas, 30000); // Cada 30s

    return () => clearInterval(interval); // Cleanup
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard del Día</h1>

      <div className="metricas">
        <div className="card">
          <h3>Citas Hoy</h3>
          <p className="value">{metricas.total_citas}</p>
        </div>

        <div className="card">
          <h3>Completadas</h3>
          <p className="value">{metricas.completadas}</p>
        </div>

        <div className="card">
          <h3>Ingresos</h3>
          <p className="value">${metricas.ingresos_totales}</p>
        </div>

        <div className="card">
          <h3>Tiempo Promedio</h3>
          <p className="value">{metricas.tiempo_promedio_servicio} min</p>
        </div>
      </div>

      <div className="cola-espera">
        <h2>Cola de Espera ({metricas.en_espera.length})</h2>
        {metricas.en_espera.map(cita => (
          <div key={cita.id} className="cita-card">
            <span>{cita.cliente_nombre}</span>
            <span>{cita.servicio_nombre}</span>
            <span>Llegada: {cita.hora_llegada}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
```

---

## Mejores Prácticas

### 1. Manejo de Tokens

```javascript
// ✅ CORRECTO - Refresh token antes de expirar
const TOKEN_EXPIRY_BUFFER = 60000; // 1 minuto antes

function scheduleTokenRefresh(expiresIn) {
  const refreshTime = (expiresIn * 1000) - TOKEN_EXPIRY_BUFFER;

  setTimeout(async () => {
    await authService.refreshToken();
  }, refreshTime);
}

// ❌ INCORRECTO - Esperar a que expire
// El token expira y el usuario ve error 401
```

### 2. Optimistic Updates

```javascript
// ✅ CORRECTO - UI se actualiza inmediatamente
async function actualizarCita(id, cambios) {
  // 1. Actualizar UI inmediatamente
  setCitas(prev => prev.map(c =>
    c.id === id ? { ...c, ...cambios } : c
  ));

  try {
    // 2. Guardar en backend
    await citasService.actualizar(id, cambios);
  } catch (error) {
    // 3. Revertir en caso de error
    setCitas(prev => prev.map(c =>
      c.id === id ? cita_original : c
    ));
    showError('No se pudo actualizar la cita');
  }
}
```

### 3. Debouncing de Búsquedas

```javascript
// ✅ CORRECTO - Evita requests innecesarios
import { debounce } from 'lodash';

const buscarClientes = debounce(async (query) => {
  if (query.length < 3) return;

  const { data } = await api.get('/clientes/buscar', {
    params: { q: query }
  });

  setResultados(data.data);
}, 500); // Espera 500ms después del último keystroke
```

### 4. Cache de Datos Estáticos

```javascript
// ✅ CORRECTO - Cachear datos que no cambian frecuentemente
let serviciosCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function obtenerServicios(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && serviciosCache &&
      (now - cacheTimestamp) < CACHE_TTL) {
    return serviciosCache;
  }

  const { data } = await api.get('/servicios');
  serviciosCache = data.data;
  cacheTimestamp = now;

  return serviciosCache;
}
```

### 5. Manejo de Errores Consistente

```javascript
// ✅ CORRECTO - Función helper para errores
function handleApiError(error) {
  if (error.response) {
    // Error del servidor (4xx, 5xx)
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return { type: 'validation', message: data.message, errors: data.errors };
      case 401:
        return { type: 'auth', message: 'Sesión expirada' };
      case 403:
        return { type: 'permission', message: 'No tienes permisos' };
      case 404:
        return { type: 'notfound', message: 'Recurso no encontrado' };
      case 409:
        return { type: 'conflict', message: data.message };
      case 429:
        return { type: 'ratelimit', message: 'Demasiadas solicitudes' };
      default:
        return { type: 'server', message: 'Error del servidor' };
    }
  } else if (error.request) {
    // Request enviado pero sin respuesta
    return { type: 'network', message: 'Error de conexión' };
  } else {
    // Error en la configuración del request
    return { type: 'client', message: error.message };
  }
}

// Uso:
try {
  await citasService.crear(datos);
} catch (error) {
  const errorInfo = handleApiError(error);
  showNotification(errorInfo.message, errorInfo.type);
}
```

### 6. Validación del Lado del Cliente

```javascript
// ✅ CORRECTO - Validar antes de enviar
const validarCita = (datos) => {
  const errores = {};

  if (!datos.cliente_id) {
    errores.cliente_id = 'Cliente es requerido';
  }

  if (!datos.fecha_cita) {
    errores.fecha_cita = 'Fecha es requerida';
  } else {
    const fecha = new Date(datos.fecha_cita);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha < hoy) {
      errores.fecha_cita = 'La fecha no puede ser pasada';
    }
  }

  if (!datos.hora_inicio || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(datos.hora_inicio)) {
    errores.hora_inicio = 'Hora inválida (formato HH:MM)';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
};

// Uso antes de enviar:
const { valido, errores } = validarCita(formData);
if (!valido) {
  setFormErrors(errores);
  return;
}

await citasService.crear(formData);
```

---

## Endpoints Especializados

### Recordatorios

```http
GET /api/v1/citas/recordatorios?horas_anticipacion=2
```

Obtiene citas que necesitan recordatorio (2 horas antes por defecto).

```javascript
// Response
{
  "success": true,
  "data": [
    {
      "id": 123,
      "codigo_cita": "ORG001-20251015-003",
      "cliente_nombre": "Juan Perez",
      "cliente_telefono": "5551234567",
      "profesional_nombre": "Maria Garcia",
      "servicio_nombre": "Corte de Cabello",
      "fecha_cita": "2025-10-15",
      "hora_inicio": "14:00",
      "hora_fin": "14:30"
    }
  ]
}
```

### Walk-In (Cliente sin Cita)

```http
POST /api/v1/citas/walk-in
Content-Type: application/json

{
  "cliente_id": 45,
  "servicio_id": 2,
  "profesional_id": 3,
  "notas": "Cliente sin cita previa"
}
```

Backend busca automáticamente el próximo slot disponible.

### Reagendar Cita

```http
POST /api/v1/citas/:id/reagendar
Content-Type: application/json

{
  "nueva_fecha": "2025-10-16",
  "nueva_hora_inicio": "15:00",
  "motivo": "Cliente solicitó cambio"
}
```

---

## Testing del API

### Colección Bruno (Recomendado)

```bash
# Ubicación de la colección
/bruno-collection/SaaS-Agendamiento-API/
```

**Endpoints de prueba incluidos:**
- ✅ Autenticación (login, refresh, logout)
- ✅ Onboarding completo
- ✅ Agendamiento manual
- ✅ Operaciones de citas (check-in, start, complete)
- ✅ Walk-in flow

### Ejecutar Tests Backend

```bash
# Todos los tests
docker exec back npm test

# Tests específicos
docker exec back npm test -- __tests__/endpoints/citas.test.js

# Tests E2E
docker exec back npm run test:e2e

# Coverage
docker exec back npm run test:coverage
```

---

## Troubleshooting

### Error: "organizacion_id es requerido"

**Causa:** Header `X-Organization-Id` faltante (super_admin)

**Solución:**
```javascript
// Asegurar header en todas las peticiones (super_admin)
const user = getCurrentUser();
if (user.rol === 'super_admin') {
  api.defaults.headers.common['X-Organization-Id'] = selectedOrgId;
}
```

### Error: "Token expirado"

**Causa:** Access token expiró (15 minutos)

**Solución:** Implementar refresh automático (ver ejemplo arriba)

### Error 409: "Horario ocupado"

**Causa:** Conflicto de horario (otro cliente ya reservó)

**Solución:**
```javascript
// Refrescar disponibilidad antes de confirmar
const disponibilidad = await horariosService.consultarDisponibilidad({
  profesional_id,
  fecha,
  servicio_id
});

// Mostrar solo slots realmente disponibles
const slotsLibres = disponibilidad.data.filter(s => s.estado === 'disponible');
```

### Error: RLS no filtra correctamente

**Causa:** organizacion_id no configurado en backend

**Diagnóstico:**
- Verificar que `setTenantContext` middleware está en la ruta
- Verificar orden: `auth.authenticateToken` → `tenant.setTenantContext` → controller

---

## Recursos Adicionales

### Documentación del Proyecto

- **Base de Datos:** `/sql/README.md` - Documentación completa de PostgreSQL
- **Guía General:** `/CLAUDE.md` - Visión general del proyecto
- **Evaluación Backend:** `/backend/EVALUACION_BACKEND.md` - Análisis técnico

### Archivos Importantes

```
backend/
├── app.js                    # Aplicación principal
├── config/
│   ├── database.js          # Configuración BD multi-pool
│   └── auth.js              # Configuración JWT
├── middleware/
│   ├── auth.js              # Autenticación JWT
│   ├── tenant.js            # Multi-tenancy RLS
│   ├── validation.js        # Validación Joi
│   └── asyncHandler.js      # Manejo errores automático
├── schemas/                 # Validaciones Joi por módulo
├── __tests__/              # Suite de tests (481/482)
└── package.json            # Scripts y dependencias
```

### Comandos Útiles

```bash
# Iniciar backend (desarrollo)
docker exec -it back npm run dev

# Ver logs en tiempo real
docker logs -f back

# Health check
curl http://localhost:3000/api/v1/health

# Ejecutar tests
docker exec back npm test

# Ver estado de contenedores
docker ps
```

---

## Versionado del API

**Versión Actual:** v1

**URL Base:** `/api/v1`

**Deprecation Policy:**
- Versiones anteriores se mantienen 6 meses después de nueva versión
- Headers de deprecation en respuestas:
  ```
  Deprecation: true
  Sunset: 2026-04-01T00:00:00Z
  ```

---

## Soporte

**Issues/Bugs:** Reportar en `/backend/ISSUES.md`
**Actualizaciones:** Ver `/backend/CHANGELOG.md`
**Contacto:** backend-team@empresa.com

---

**Versión:** 1.0.0
**Última Actualización:** 09 Octubre 2025
**Mantenido por:** Backend Team
