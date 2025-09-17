# 📁 Estructura del Backend - Documentación Técnica

**Proyecto:** Sistema SaaS de Agendamiento Multi-Tenant
**Fecha:** Enero 2025
**Estado:** Fundación Completada (70%)

---

## 🏗️ Resumen de la Implementación

El backend está diseñado con **PostgreSQL nativo** (sin ORM) para máximo control sobre las consultas SQL y aprovechamiento completo de los índices optimizados de la base de datos multi-tenant.

### 🎯 **Características Principales**
- **Multi-tenant** con Row Level Security automático
- **Multi-database** con pools de conexión especializados
- **JWT Authentication** con refresh tokens
- **Logging estructurado** para observabilidad
- **Rate limiting** y seguridad enterprise
- **Graceful shutdown** y health checks

---

## 📂 Estructura de Carpetas Detallada

```
backend/
├── src/                          # Código fuente principal
│   ├── config/                   # ✅ Configuraciones del sistema
│   │   ├── database.js           # Pool multi-DB con PostgreSQL nativo
│   │   └── auth.js               # JWT, bcrypt y validaciones
│   │
│   ├── database/                 # 🔄 Queries SQL y modelos de datos
│   │   ├── queries/              # Queries organizadas por entidad
│   │   ├── models/               # Definiciones de modelos (sin ORM)
│   │   └── migrations/           # Scripts de migración SQL
│   │
│   ├── controllers/              # 🔄 Lógica de controladores HTTP
│   │   ├── AuthController.js     # Login, registro, refresh tokens
│   │   ├── CitasController.js    # CRUD completo de citas
│   │   ├── ClientesController.js # CRUD con búsqueda por teléfono
│   │   └── WebhooksController.js # Webhooks para n8n
│   │
│   ├── services/                 # 🔄 Lógica de negocio
│   │   ├── CitasService.js       # Lógica de agendamiento
│   │   ├── N8nService.js         # Integración con n8n
│   │   ├── WhatsAppService.js    # Integración Evolution API
│   │   └── AnalyticsService.js   # Métricas y reportes
│   │
│   ├── middleware/               # 🔄 Middlewares personalizados
│   │   ├── auth.js               # Verificación JWT y tenant
│   │   ├── tenant.js             # Aislamiento multi-tenant
│   │   ├── validation.js         # Validación con Joi
│   │   └── rateLimiting.js       # Rate limiting personalizado
│   │
│   ├── routes/                   # 🔄 Definición de rutas API
│   │   ├── api/v1/               # APIs versionadas
│   │   │   ├── auth.js           # Rutas de autenticación
│   │   │   ├── citas.js          # Rutas de citas
│   │   │   ├── clientes.js       # Rutas de clientes
│   │   │   ├── disponibilidad.js # Rutas de disponibilidad
│   │   │   └── webhooks.js       # Rutas de webhooks
│   │   └── index.js              # Router principal
│   │
│   ├── utils/                    # ✅ Utilidades y helpers
│   │   ├── logger.js             # Logging estructurado Winston
│   │   └── helpers.js            # Helpers para validación, fechas, etc.
│   │
│   ├── validators/               # 🔄 Schemas de validación
│   │   ├── authSchemas.js        # Validaciones de autenticación
│   │   ├── citaSchemas.js        # Validaciones de citas
│   │   └── clienteSchemas.js     # Validaciones de clientes
│   │
│   └── app.js                    # ✅ Aplicación principal Express
│
├── tests/                        # 🔄 Tests automatizados
│   ├── unit/                     # Tests unitarios
│   ├── integration/              # Tests de integración
│   └── fixtures/                 # Datos de prueba
│
├── docs/                         # 📚 Documentación
│   ├── api.yml                   # Especificación OpenAPI/Swagger
│   └── development.md            # Guía de desarrollo
│
├── scripts/                      # 🔄 Scripts de utilidad
│   ├── migrate.js                # Migraciones de BD
│   ├── seed.js                   # Datos de prueba
│   └── deploy.js                 # Script de deploy
│
├── logs/                         # 📊 Logs de la aplicación
│   ├── app.log                   # Log general
│   ├── error.log                 # Log de errores
│   └── access.log                # Log de acceso
│
├── .env.example                  # ✅ Variables de entorno ejemplo
├── .gitignore                    # ✅ Archivos ignorados
├── package.json                  # ✅ Dependencias y scripts
└── README.md                     # ✅ Documentación principal
```

**Leyenda:**
- ✅ **Completado** - Archivo/carpeta implementado
- 🔄 **Pendiente** - Por implementar en siguientes sprints

---

## 🔧 Componentes Técnicos Implementados

### **1. Sistema de Base de Datos Multi-Pool**

```javascript
// database.js - Configuración especializada por uso
pools: {
  saas: 20 conexiones máx     // BD principal SaaS
  n8n: 10 conexiones máx      // Sincronización n8n
  evolution: 8 conexiones máx // WhatsApp Evolution API
  chat: 5 conexiones máx      // Historiales de IA
}
```

**Características:**
- **Connection pooling** optimizado por base de datos
- **Health checks** automáticos para todas las BDs
- **Logging** de performance para queries >100ms
- **Transactions** con soporte multi-tenant

### **2. Sistema de Autenticación JWT**

```javascript
// auth.js - Configuración enterprise
features: {
  jwt: "Access + Refresh tokens",
  bcrypt: "12 rounds de encriptación",
  validation: "Fortaleza de contraseña",
  tokens: "Verificación con issuer/audience"
}
```

**Características:**
- **JWT pair** (access + refresh tokens)
- **Password strength** validation con scores
- **Secure tokens** para reset de contraseña
- **Verification codes** para 2FA (futuro)

### **3. Sistema de Logging Estructurado**

```javascript
// logger.js - Logging contextual
contexts: {
  httpRequest: "Requests con duración y metadata",
  dbOperation: "Queries con performance tracking",
  auth: "Eventos de autenticación",
  integration: "Llamadas a APIs externas",
  webhook: "Webhooks enviados/recibidos",
  cita: "Operaciones de citas (core business)",
  tenant: "Operaciones multi-tenant",
  security: "Eventos de seguridad"
}
```

**Características:**
- **Structured logging** con Winston
- **Context-aware** para diferentes operaciones
- **Performance monitoring** automático
- **Security events** tracking

### **4. Aplicación Express Robusta**

```javascript
// app.js - Middlewares de seguridad
security: {
  helmet: "Headers de seguridad",
  cors: "Multi-origen configurado",
  rateLimit: "100 req/15min por IP",
  compression: "Compresión de respuestas",
  gracefulShutdown: "Cierre ordenado de conexiones"
}
```

**Características:**
- **Health checks** para todas las dependencias
- **Error handling** centralizado y contextual
- **Request logging** con duración y metadata
- **Graceful shutdown** para señales del sistema

---

## 🗄️ Estrategia de Base de Datos

### **Conexiones Especializadas por Uso**

| Base de Datos | Propósito | Pool Size | Usuario |
|---------------|-----------|-----------|---------|
| **postgres_db** | SaaS principal (citas, clientes, etc.) | 20 | `saas_app` |
| **n8n_db** | Sincronización de workflows | 10 | `n8n_app` |
| **evolution_db** | Datos de WhatsApp/sesiones | 8 | `evolution_app` |
| **chat_memories_db** | Historiales de IA conversacional | 5 | `chat_app` |

### **Multi-Tenant con RLS Automático**

```javascript
// Cada request configura automáticamente el tenant
await database.query('SET app.current_tenant_id = $1', [organizacion_id]);

// Todas las queries subsecuentes respetan RLS automáticamente
const citas = await database.query('SELECT * FROM citas WHERE activo = true');
// ↑ Solo ve citas de su organización debido a RLS
```

### **Performance y Monitoreo**

```javascript
// Logging automático de queries lentas
if (duration > 100) {
  logger.warn('Query lenta detectada', {
    query: query.substring(0, 100) + '...',
    duration,
    rowCount: result.rowCount,
    tenantId
  });
}
```

---

## 🛡️ Seguridad Multi-Tenant

### **Aislamiento Automático**
- **Row Level Security** en todas las tablas críticas
- **Tenant context** configurado por request
- **JWT verification** con tenant validation
- **Rate limiting** por IP y tenant

### **Validaciones Robustas**
- **Input sanitization** para prevenir SQL injection
- **Email/phone validation** con regex
- **Password strength** scoring automático
- **SQL input filtering** básico implementado

---

## 📊 Utilidades y Helpers

### **ResponseHelper** - Respuestas HTTP Estandarizadas
```javascript
ResponseHelper.success(res, data, message, statusCode);
ResponseHelper.error(res, message, statusCode, errors);
ResponseHelper.paginated(res, data, pagination);
ResponseHelper.validationError(res, errors);
```

### **ValidationHelper** - Validaciones de Negocio
```javascript
ValidationHelper.isValidEmail(email);
ValidationHelper.isValidMexicanPhone(phone);
ValidationHelper.normalizePhone(phone);
ValidationHelper.isValidDate(dateString);
ValidationHelper.isFutureDate(dateString);
```

### **DateHelper** - Manejo de Fechas y Horas
```javascript
DateHelper.getCurrentDate(timezone);
DateHelper.minutesBetween(startTime, endTime);
DateHelper.addMinutes(time, minutes);
DateHelper.formatDate(dateString);
```

### **CodeGenerator** - Códigos Únicos
```javascript
CodeGenerator.generateCitaCode();        // ABC12345
CodeGenerator.generateSlug(name);        // mi-negocio-slug
CodeGenerator.generateTenantCode(name);  // mi-negocio-abc
```

---

## 🚀 Próximos Pasos de Implementación

### **Sprint 1 - Completar Semana 1 (30% restante)**

#### **1. Middleware de Autenticación**
```javascript
// middleware/auth.js
const authenticateAndSetTenant = async (req, res, next) => {
  // 1. Verificar JWT
  // 2. Obtener usuario y organización
  // 3. Configurar tenant en BD
  // 4. Agregar a request context
};
```

#### **2. Modelos de Datos sin ORM**
```javascript
// database/models/CitaModel.js
class CitaModel {
  static async findByOrganizacion(organizacionId) {
    // Query SQL nativa con parámetros seguros
  }

  static async create(citaData, organizacionId) {
    // Insert con validaciones y tenant context
  }
}
```

#### **3. Controladores Básicos**
```javascript
// controllers/CitasController.js
class CitasController {
  async list(req, res) {
    // GET /api/v1/citas con paginación
  }

  async create(req, res) {
    // POST /api/v1/citas con validación
  }
}
```

#### **4. Validadores con Joi**
```javascript
// validators/citaSchemas.js
const createCitaSchema = Joi.object({
  cliente_id: Joi.number().required(),
  servicio_id: Joi.number().required(),
  fecha_cita: Joi.date().min('now').required()
});
```

#### **5. Setup de Testing**
```javascript
// tests/unit/auth.test.js
describe('AuthController', () => {
  test('should login with valid credentials', async () => {
    // Test de login exitoso
  });
});
```

---

## 📈 Métricas de Progreso

### **Estado Actual (Semana 1)**
- **Completado:** 70%
- **Arquitectura:** ✅ 100%
- **Configuración:** ✅ 100%
- **Utilities:** ✅ 100%
- **Aplicación base:** ✅ 100%
- **APIs:** 🔄 0% (próximo)
- **Tests:** 🔄 0% (próximo)

### **Target Semana 2**
- **APIs CRUD:** 🎯 100%
- **Middleware:** 🎯 100%
- **Validadores:** 🎯 100%
- **Tests básicos:** 🎯 80%
- **Documentación Swagger:** 🎯 60%

---

## 🔗 Integración con Ecosistema Existente

### **Base de Datos**
- ✅ **Conecta directamente** con esquemas SQL existentes
- ✅ **Respeta RLS** y políticas multi-tenant implementadas
- ✅ **Usa índices optimizados** para máximo rendimiento

### **n8n Workflows**
- 🔄 **Webhooks bidireccionales** para sincronización
- 🔄 **APIs específicas** para crear/actualizar citas desde n8n
- 🔄 **Event notifications** para flujos automatizados

### **Evolution API (WhatsApp)**
- 🔄 **Integración nativa** con base de datos de WhatsApp
- 🔄 **Sincronización de sesiones** y mensajes
- 🔄 **Multi-instancia** por organización

---

**📝 Documento técnico actualizado en tiempo real**
**🔄 Última actualización:** Enero 2025
**👨‍💻 Mantenido por:** Equipo Backend SaaS