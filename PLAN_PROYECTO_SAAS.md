# 🚀 Plan de Proyecto: Sistema SaaS de Agendamiento Multi-Tenant

**Proyecto:** Plataforma SaaS de automatización de citas con integración WhatsApp y AI
**Fecha de inicio:** Enero 2025
**Versión del documento:** 1.0

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Visión y Objetivos](#visión-y-objetivos)
3. [Arquitectura Actual](#arquitectura-actual)
4. [Progreso Completado](#progreso-completado)
5. [Próximos Pasos: Backend Node.js](#próximos-pasos-backend-nodejs)
6. [Roadmap Técnico](#roadmap-técnico)
7. [Especificaciones del Backend](#especificaciones-del-backend)
8. [Integraciones Planificadas](#integraciones-planificadas)
9. [Timeline del Proyecto](#timeline-del-proyecto)
10. [Consideraciones Técnicas](#consideraciones-técnicas)

---

## 🎯 Resumen Ejecutivo

Estamos desarrollando una **plataforma SaaS multi-tenant** que automatiza sistemas de agendamiento para múltiples industrias (barberías, consultorios médicos, spas, etc.) utilizando **múltiples canales de comunicación** (WhatsApp, Telegram, SMS, redes sociales, etc.), potenciado por **IA conversacional** y **automatización con n8n**.

### 🎪 Propuesta de Valor
- **🤖 Automatización completa** de agendamiento multi-canal
- **🏢 Multi-tenant** para servir múltiples negocios
- **🧠 IA conversacional** con agentes especializados por industria
- **📱 Sin apps** para clientes - comunicación por sus canales preferidos
- **🔗 Multi-canal** - WhatsApp, Telegram, SMS, Facebook, Instagram
- **⚡ Implementación rápida** con plantillas por industria

---

## 🎯 Visión y Objetivos

### **Visión a Largo Plazo**
Convertirnos en la **plataforma líder de automatización de agendamiento** para pequeñas y medianas empresas de servicios, eliminando la fricción entre negocios y clientes a través de conversaciones naturales en **cualquier canal digital** que prefieran usar.

### **Objetivos del MVP (Q1-Q2 2025)**
1. ✅ **Base de datos SaaS robusta** (COMPLETADO)
2. 🔄 **Backend API Node.js** para integraciones
3. 🤖 **Flujos n8n** funcionales con IA
4. 📱 **Integración multi-canal** (WhatsApp como prioritario)
5. 🎨 **Dashboard básico** para administración
6. 🧪 **3 negocios piloto** funcionando

### **Objetivos a Mediano Plazo (Q3-Q4 2025)**
- 🏢 **100+ organizaciones** en la plataforma
- 💰 **Modelo de monetización** implementado
- 📊 **Analytics avanzados** y reportes
- 🔧 **API pública** para integraciones terceros
- 🌐 **Multi-idioma** (español, inglés)

---

## 🏗️ Arquitectura Actual

### **Stack Tecnológico Confirmado**

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA SAAS MULTI-CANAL           │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Frontend  │    │   Backend   │    │  Databases  │    │
│  │             │    │   Node.js   │    │ PostgreSQL  │    │
│  │ React/Next  │◄──►│   Express   │◄──►│ Multi-DB    │    │
│  │ Dashboard   │    │  Multi-API  │    │ Multi-User  │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                              │                             │
│  ┌─────────────┐    ┌─────────────────────────────────┐   │
│  │    n8n      │    │     CANALES DE COMUNICACIÓN     │   │
│  │ Workflows   │◄──►│                                 │   │
│  │ + AI Agent  │    │ ┌─────────┐ ┌─────────┐ ┌─────┐ │   │
│  └─────────────┘    │ │WhatsApp │ │Telegram │ │ SMS │ │   │
│                     │ │Evolution│ │   Bot   │ │ API │ │   │
│  ┌─────────────┐    │ └─────────┘ └─────────┘ └─────┘ │   │
│  │    Redis    │◄──►│                                 │   │
│  │   Queue     │    │ ┌─────────┐ ┌─────────┐ ┌─────┐ │   │
│  │   Cache     │    │ │Facebook │ │Instagram│ │Email│ │   │
│  └─────────────┘    │ │Messenger│ │ Direct  │ │SMTP │ │   │
│                     │ └─────────┘ └─────────┘ └─────┘ │   │
│                     └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Componentes Principales**

#### **🗄️ Base de Datos (PostgreSQL Multi-DB)**
- **`postgres_db`** - SaaS principal (organizaciones, citas, clientes)
- **`n8n_db`** - Workflows y automatizaciones
- **`evolution_db`** - Datos de WhatsApp
- **`chat_memories_db`** - Historiales de IA

#### **🔧 Infraestructura de Automatización**
- **n8n-main** - Editor de workflows
- **n8n-worker** - Procesamiento distribuido (concurrencia 20)
- **Channel Gateway** - Abstracción multi-canal
- **Redis** - Colas y cache

#### **📱 Canales de Comunicación**
- **WhatsApp** - Evolution API (prioritario para MVP)
- **Telegram** - Bot API de Telegram
- **SMS** - Twilio/AWS SNS
- **Facebook Messenger** - Facebook Graph API
- **Instagram Direct** - Instagram Basic Display API
- **Email** - SMTP/SendGrid/AWS SES

#### **🔐 Seguridad Multi-Tenant**
- **Row Level Security (RLS)** implementado
- **Usuarios específicos** por aplicación
- **Aislamiento completo** de datos por organización

---

## ✅ Progreso Completado

### **🎯 Fase 1: Fundación de Datos (COMPLETADO - 100%)**

#### **📊 Base de Datos SaaS Multi-Tenant**
- ✅ **Diseño completo** con 15+ tablas optimizadas
- ✅ **Multi-tenant** con RLS y aislamiento perfecto
- ✅ **Multi-industria** soportando 10+ tipos de negocio
- ✅ **Optimizaciones DBA** con índices críticos
- ✅ **Escalabilidad** para 10M+ citas/mes
- ✅ **Plantillas de servicios** por industria
- ✅ **Sistema de suscripciones** y límites

#### **🔐 Seguridad Robusta**
- ✅ **6 usuarios específicos** con permisos mínimos
- ✅ **Row Level Security** en todas las tablas
- ✅ **Aislamiento por tenant** automático
- ✅ **Usuario readonly** para analytics
- ✅ **Usuario integration** para sincronización

#### **📈 Performance Enterprise**
- ✅ **Índices optimizados** para consultas críticas
- ✅ **Búsqueda full-text** en español
- ✅ **Prevención de conflictos** temporales
- ✅ **Mantenimiento automático** configurado
- ✅ **Métricas de uso** implementadas

#### **📚 Documentación Completa**
- ✅ **Documentación técnica** de 50+ páginas
- ✅ **Diagramas de arquitectura** detallados
- ✅ **Guías de uso** y ejemplos
- ✅ **Configuración de desarrollo** lista

---

### **🚀 Fase 2: Backend Node.js Foundation (EN PROGRESO - 40%)**

#### **🏗️ Arquitectura y Estructura**
- ✅ **Estructura de proyecto** completa con carpetas organizadas
- ✅ **Configuración multi-DB** con pools de conexión PostgreSQL nativo
- ✅ **Sistema de autenticación** JWT con refresh tokens
- ✅ **Logging estructurado** con Winston y contexto multi-tenant
- ✅ **Aplicación Express** con middlewares de seguridad

#### **🔧 Configuración Técnica**
- ✅ **Package.json** con dependencias optimizadas
- ✅ **Variables de entorno** configuradas para multi-BD
- ✅ **Database config** con 4 pools de conexión especializados
- ✅ **Auth config** con validación de contraseñas y JWT
- ✅ **Utilities** completas (validación, fechas, helpers)

#### **🛡️ Seguridad y Performance**
- ✅ **Rate limiting** configurado por ambiente
- ✅ **CORS** multi-origen configurado
- ✅ **Helmet** para headers de seguridad
- ✅ **Graceful shutdown** implementado
- ✅ **Health checks** para todas las bases de datos

#### **🔄 Pendientes Sprint 1 (Semana 1)**
- 🔄 **Middleware de autenticación** y tenant isolation
- 🔄 **Modelos de datos** sin ORM (queries SQL nativas)
- 🔄 **Controladores básicos** (auth, citas, clientes)
- 🔄 **Validadores** con Joi para APIs
- 🔄 **Tests unitarios** iniciales con Jest

---

## 🚀 Próximos Pasos: Backend Node.js

### **🎯 Objetivo Inmediato**

Desarrollar un **backend API RESTful en Node.js con Express** que sirva como **orquestador central** del ecosistema, conectando:
- Frontend dashboard ↔ Backend ↔ Base de datos SaaS
- n8n workflows ↔ Backend ↔ Sincronización de datos
- Integraciones externas ↔ Backend ↔ Lógica de negocio

### **🏗️ Arquitectura del Backend**

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS                         │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │    API      │    │  Business   │    │    Data     │    │
│  │   Layer     │    │   Logic     │    │   Access    │    │
│  │             │    │             │    │             │    │
│  │ • Auth      │    │ • Citas     │    │ • Sequelize │    │
│  │ • CRUD      │    │ • Clientes  │    │ • Models    │    │
│  │ • Webhooks  │    │ • n8n Sync  │    │ • Migrations│    │
│  │ • Upload    │    │ • Analytics │    │ • Seeders   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │ Integration │    │   Utils     │    │   Config    │    │
│  │   Layer     │    │  Services   │    │  Management │    │
│  │             │    │             │    │             │    │
│  │ • n8n API   │    │ • Email     │    │ • Multi-DB  │    │
│  │ • WhatsApp  │    │ • SMS       │    │ • Multi-Env │    │
│  │ • Calendar  │    │ • Files     │    │ • Secrets   │    │
│  │ • Payments  │    │ • Crypto    │    │ • Logging   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Especificaciones del Backend

### **🛠️ Stack Tecnológico Propuesto**

```javascript
{
  "runtime": "Node.js 20 LTS",
  "framework": "Express.js 4.x",
  "database": {
    "orm": "Sequelize 6.x",
    "driver": "pg (PostgreSQL)",
    "connections": "Multi-database pool"
  },
  "authentication": "JWT + bcrypt",
  "validation": "Joi + express-validator",
  "documentation": "Swagger/OpenAPI 3.0",
  "testing": "Jest + Supertest",
  "monitoring": "Winston + Morgan",
  "security": "Helmet + CORS + Rate Limiting"
}
```

### **📁 Estructura de Proyecto Propuesta**

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración multi-DB
│   │   ├── auth.js              # JWT y autenticación
│   │   └── app.js               # Configuración Express
│   │
│   ├── models/                  # Modelos Sequelize
│   │   ├── index.js             # Inicialización ORM
│   │   ├── Organizacion.js      # Modelo principal tenant
│   │   ├── Cita.js              # Modelo de citas
│   │   ├── Cliente.js           # Modelo de clientes
│   │   └── ...                  # Otros modelos
│   │
│   ├── controllers/             # Lógica de controladores
│   │   ├── AuthController.js    # Autenticación
│   │   ├── CitasController.js   # CRUD de citas
│   │   ├── ClientesController.js # CRUD de clientes
│   │   └── WebhooksController.js # Webhooks n8n
│   │
│   ├── services/                # Lógica de negocio
│   │   ├── CitasService.js      # Lógica de agendamiento
│   │   ├── N8nService.js        # Integración n8n
│   │   ├── WhatsAppService.js   # Integración WhatsApp
│   │   └── AnalyticsService.js  # Métricas y reportes
│   │
│   ├── middleware/              # Middlewares personalizados
│   │   ├── auth.js              # Verificación JWT
│   │   ├── tenant.js            # Aislamiento multi-tenant
│   │   ├── validation.js        # Validación de datos
│   │   └── rateLimiting.js      # Rate limiting
│   │
│   ├── routes/                  # Definición de rutas
│   │   ├── api/                 # Rutas API versioned
│   │   │   ├── v1/
│   │   │   │   ├── auth.js      # Rutas de autenticación
│   │   │   │   ├── citas.js     # Rutas de citas
│   │   │   │   ├── clientes.js  # Rutas de clientes
│   │   │   │   └── webhooks.js  # Webhooks n8n
│   │   │   └── index.js         # Router principal API
│   │   └── index.js             # Router principal
│   │
│   ├── utils/                   # Utilidades generales
│   │   ├── logger.js            # Sistema de logs
│   │   ├── validator.js         # Validaciones custom
│   │   ├── crypto.js            # Funciones crypto
│   │   └── helpers.js           # Helpers generales
│   │
│   └── app.js                   # Punto de entrada principal
│
├── tests/                       # Tests automatizados
│   ├── integration/             # Tests de integración
│   ├── unit/                    # Tests unitarios
│   └── fixtures/                # Datos de prueba
│
├── docs/                        # Documentación
│   ├── api.yml                  # Swagger/OpenAPI spec
│   └── development.md           # Guía de desarrollo
│
├── scripts/                     # Scripts de utilidad
│   ├── migrate.js               # Migraciones DB
│   ├── seed.js                  # Datos de prueba
│   └── deploy.js                # Script de deploy
│
├── .env.example                 # Variables de entorno ejemplo
├── package.json                 # Dependencias Node.js
├── docker-compose.dev.yml       # Docker para desarrollo
└── README.md                    # Documentación principal
```

### **🔗 APIs Principales a Desarrollar**

#### **1. API de Autenticación**
```javascript
POST   /api/v1/auth/login         # Login de usuarios
POST   /api/v1/auth/register      # Registro de organizaciones
POST   /api/v1/auth/refresh       # Refresh de tokens
POST   /api/v1/auth/logout        # Logout
GET    /api/v1/auth/me            # Info del usuario actual
```

#### **2. API de Citas (Core Business)**
```javascript
GET    /api/v1/citas              # Listar citas (con filtros)
POST   /api/v1/citas              # Crear nueva cita
GET    /api/v1/citas/:id          # Obtener cita específica
PUT    /api/v1/citas/:id          # Actualizar cita
DELETE /api/v1/citas/:id          # Cancelar cita
GET    /api/v1/citas/:id/historia # Historial de cambios
```

#### **3. API de Disponibilidad**
```javascript
GET    /api/v1/disponibilidad         # Consultar disponibilidad
POST   /api/v1/disponibilidad/reservar # Reservar franja temporal
POST   /api/v1/disponibilidad/liberar # Liberar reserva temporal
GET    /api/v1/disponibilidad/profesional/:id # Disponibilidad específica
```

#### **4. API de Clientes**
```javascript
GET    /api/v1/clientes           # Listar clientes
POST   /api/v1/clientes           # Crear cliente
GET    /api/v1/clientes/:id       # Obtener cliente
PUT    /api/v1/clientes/:id       # Actualizar cliente
GET    /api/v1/clientes/buscar    # Buscar por teléfono/nombre
GET    /api/v1/clientes/:id/citas # Historial de citas
```

#### **5. API de Gestión de Canales**
```javascript
GET    /api/v1/canales                   # Listar canales de la organización
POST   /api/v1/canales                   # Configurar nuevo canal
PUT    /api/v1/canales/:id               # Actualizar configuración de canal
DELETE /api/v1/canales/:id               # Desactivar canal
POST   /api/v1/canales/:id/test          # Probar configuración de canal
GET    /api/v1/canales/tipos             # Tipos de canales disponibles
```

#### **6. API de Integración n8n**
```javascript
POST   /api/v1/webhooks/n8n/cita-creada     # Webhook para cita creada
POST   /api/v1/webhooks/n8n/cita-confirmada # Webhook para confirmación
POST   /api/v1/webhooks/n8n/cita-cancelada  # Webhook para cancelación
POST   /api/v1/webhooks/n8n/recordatorio    # Webhook para recordatorios
GET    /api/v1/integration/n8n/status       # Estado de integración
POST   /api/v1/webhooks/channel/:tipo       # Webhook genérico por canal
```

#### **6. API de Analytics y Reportes**
```javascript
GET    /api/v1/analytics/dashboard       # Métricas del dashboard
GET    /api/v1/analytics/citas          # Estadísticas de citas
GET    /api/v1/analytics/clientes       # Estadísticas de clientes
GET    /api/v1/analytics/ingresos       # Reporte de ingresos
GET    /api/v1/analytics/profesionales  # Performance por profesional
```

### **🔐 Sistema de Autenticación Multi-Tenant**

```javascript
// Middleware de autenticación y tenant
const authenticateAndSetTenant = async (req, res, next) => {
  try {
    // 1. Verificar JWT
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Obtener usuario y organización
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Organizacion }]
    });

    // 3. Configurar tenant en sesión de DB
    await sequelize.query('SET app.current_tenant_id = ?', {
      replacements: [user.organizacion_id]
    });

    // 4. Agregar a request
    req.user = user;
    req.tenant = user.Organizacion;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
```

---

## 🔌 Integraciones Planificadas

### **🌐 Estrategia Multi-Canal**

#### **Principio de Diseño: Channel Agnostic**
La plataforma está diseñada para ser **agnóstica de canal**, permitiendo que cada organización configure los canales que prefiera usar para comunicarse con sus clientes.

```
┌─────────────────────────────────────────────────────────────┐
│                ABSTRACCIÓN DE CANALES                      │
│                                                             │
│  Cliente ──► Canal ──► Gateway ──► n8n ──► Backend ──► DB  │
│                 │                                           │
│                 ▼                                           │
│        ┌─────────────────┐                                 │
│        │ Canal Interface │ ◄─ Implementaciones específicas │
│        │   (Abstract)    │                                 │
│        └─────────────────┘                                 │
│                 │                                           │
│        ┌─────────────────┐                                 │
│        │ WhatsApp        │ ◄─ Evolution API                │
│        │ Telegram        │ ◄─ Telegram Bot API             │
│        │ SMS             │ ◄─ Twilio/AWS SNS               │
│        │ Facebook        │ ◄─ Graph API                    │
│        │ Instagram       │ ◄─ Basic Display API            │
│        │ Email           │ ◄─ SMTP/SendGrid                │
│        └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

#### **Configuración por Organización**
```sql
-- Tabla para configurar canales por organización
CREATE TABLE canales_organizacion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    tipo_canal VARCHAR(50) NOT NULL, -- 'whatsapp', 'telegram', 'sms', etc.
    configuracion JSONB NOT NULL,    -- Configuración específica del canal
    activo BOOLEAN DEFAULT TRUE,
    prioridad INTEGER DEFAULT 1,     -- Orden de preferencia
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplos de configuración por canal
INSERT INTO canales_organizacion (organizacion_id, tipo_canal, configuracion) VALUES
(1, 'whatsapp', '{"instance_id": "barberia_001", "phone": "+52123456789"}'),
(1, 'telegram', '{"bot_token": "123456:ABC-DEF...", "chat_id": "@barberia_channel"}'),
(1, 'sms', '{"provider": "twilio", "phone": "+52123456789", "account_sid": "AC..."}');
```

### **🤖 Integración n8n (Prioritaria)**

#### **Flujo de Sincronización Multi-Canal**
```
Cliente (Cualquier Canal) → Channel Gateway → n8n → Backend API → DB SaaS
                                               ↓
Respuesta (Mismo Canal) ← Channel Gateway ← n8n ← Backend API ← DB SaaS
```

#### **Canales Soportados (Roadmap)**
| Canal | Prioridad | Estado | API/Provider |
|-------|-----------|--------|--------------|
| **WhatsApp** | 🔴 Alta | MVP | Evolution API |
| **Telegram** | 🟡 Media | Q2 2025 | Telegram Bot API |
| **SMS** | 🟡 Media | Q2 2025 | Twilio/AWS SNS |
| **Facebook** | 🟢 Baja | Q3 2025 | Graph API |
| **Instagram** | 🟢 Baja | Q3 2025 | Basic Display API |
| **Email** | 🟡 Media | Q2 2025 | SMTP/SendGrid |

#### **Webhooks n8n → Backend**
```javascript
// Ejemplo: Webhook para crear cita desde n8n
app.post('/api/v1/webhooks/n8n/crear-cita', async (req, res) => {
  try {
    const { cliente_telefono, servicio_id, fecha_deseada, organizacion_id } = req.body;

    // 1. Configurar tenant
    await setTenant(organizacion_id);

    // 2. Buscar o crear cliente
    const cliente = await findOrCreateCliente(cliente_telefono);

    // 3. Buscar disponibilidad
    const disponibilidad = await buscarDisponibilidad(servicio_id, fecha_deseada);

    // 4. Crear cita
    const cita = await crearCita({
      cliente_id: cliente.id,
      servicio_id,
      fecha_cita: disponibilidad.fecha,
      hora_inicio: disponibilidad.hora_inicio,
      origen_cita: 'whatsapp'
    });

    // 5. Responder a n8n con datos para WhatsApp
    res.json({
      success: true,
      cita_codigo: cita.codigo_cita,
      mensaje_confirmacion: `✅ Cita confirmada para ${cita.fecha_cita} a las ${cita.hora_inicio}. Código: ${cita.codigo_cita}`
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

#### **Backend → n8n Notifications**
```javascript
// Servicio para notificar a n8n
class N8nService {
  static async notificarCitaCreada(cita) {
    try {
      await axios.post(`${process.env.N8N_WEBHOOK_URL}/cita-creada`, {
        cita_id: cita.id,
        codigo_cita: cita.codigo_cita,
        cliente_telefono: cita.cliente.telefono,
        cliente_nombre: cita.cliente.nombre,
        servicio_nombre: cita.servicio.nombre,
        fecha_cita: cita.fecha_cita,
        hora_inicio: cita.hora_inicio,
        organizacion_id: cita.organizacion_id,
        template: 'confirmacion_cita'
      });
    } catch (error) {
      // Encolar para reintentos
      await encolarReintentoNotificacion('cita_creada', cita);
    }
  }
}
```

### **📱 Integración Multi-Canal**

```javascript
// Servicio abstracto para canales de comunicación
class ChannelService {
  constructor(tipo_canal, configuracion) {
    this.tipo = tipo_canal;
    this.config = configuracion;
  }

  async enviarMensaje(destinatario, mensaje) {
    throw new Error('Método enviarMensaje debe ser implementado');
  }
}

// Implementación específica para WhatsApp
class WhatsAppService extends ChannelService {
  async enviarMensaje(telefono, mensaje) {
    return await axios.post(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${this.config.instance_id}`,
      { number: telefono, text: mensaje },
      { headers: { 'Authorization': `Bearer ${this.config.api_key}` } }
    );
  }
}

// Implementación específica para Telegram
class TelegramService extends ChannelService {
  async enviarMensaje(chat_id, mensaje) {
    return await axios.post(
      `https://api.telegram.org/bot${this.config.bot_token}/sendMessage`,
      { chat_id, text: mensaje }
    );
  }
}

// Implementación específica para SMS
class SMSService extends ChannelService {
  async enviarMensaje(telefono, mensaje) {
    const twilio = require('twilio')(this.config.account_sid, this.config.auth_token);
    return await twilio.messages.create({
      body: mensaje,
      from: this.config.phone_number,
      to: telefono
    });
  }
}

// Factory para crear servicios de canal
class ChannelFactory {
  static crear(tipo_canal, configuracion) {
    switch (tipo_canal) {
      case 'whatsapp':
        return new WhatsAppService(tipo_canal, configuracion);
      case 'telegram':
        return new TelegramService(tipo_canal, configuracion);
      case 'sms':
        return new SMSService(tipo_canal, configuracion);
      default:
        throw new Error(`Canal no soportado: ${tipo_canal}`);
    }
  }
}

// Servicio principal multi-canal
class CommunicationService {
  static async enviarMensaje(organizacion_id, destinatario, mensaje, canal_preferido = null) {
    // Obtener canales activos de la organización
    const canales = await getCanalesActivos(organizacion_id);

    // Usar canal preferido o el de mayor prioridad
    const canal = canal_preferido
      ? canales.find(c => c.tipo_canal === canal_preferido)
      : canales.sort((a, b) => a.prioridad - b.prioridad)[0];

    if (!canal) {
      throw new Error('No hay canales configurados para esta organización');
    }

    // Crear servicio específico del canal
    const channelService = ChannelFactory.crear(canal.tipo_canal, canal.configuracion);

    // Enviar mensaje
    const resultado = await channelService.enviarMensaje(destinatario, mensaje);

    // Log del envío
    await logEnvioMensaje(organizacion_id, canal.tipo_canal, destinatario, mensaje, resultado);

    return resultado;
  }
}
```

### **📅 Integración Google Calendar**

```javascript
// Servicio para sincronizar con Google Calendar
class CalendarService {
  static async crearEventoCalendar(cita) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const evento = {
      summary: `${cita.servicio.nombre} - ${cita.cliente.nombre}`,
      start: {
        dateTime: `${cita.fecha_cita}T${cita.hora_inicio}:00`,
        timeZone: cita.organizacion.zona_horaria
      },
      end: {
        dateTime: calcularHoraFin(cita),
        timeZone: cita.organizacion.zona_horaria
      },
      attendees: [
        { email: cita.cliente.email },
        { email: cita.profesional.email }
      ]
    };

    return await calendar.events.insert({
      calendarId: cita.profesional.calendar_id,
      resource: evento
    });
  }
}
```

---

## 📅 Timeline del Proyecto

### **🚀 Sprint 1: Backend Foundation (Semanas 1-2) - ACTUALIZADO**

#### **Semana 1: Setup y Configuración (PARCIALMENTE COMPLETADO)**
- ✅ **Inicializar proyecto Node.js + Express** - Estructura completa creada
- ✅ **Configurar PostgreSQL nativo** (sin Sequelize por decisión del equipo)
- ✅ **Implementar sistema de autenticación JWT** - Config completa
- ✅ **Estructura de proyecto** con utilities, logging y helpers
- 🔄 **Crear modelos de datos** con queries SQL nativas
- 🔄 **Setup de testing con Jest** - Pendiente

**PROGRESO SEMANA 1: 70% completado**

#### **Semana 2: APIs Core (PENDIENTE)**
- 🔄 **Implementar CRUD de citas** con SQL nativo
- 🔄 **Implementar CRUD de clientes** con búsqueda por teléfono
- 🔄 **Implementar API de disponibilidad** usando índices optimizados
- 🔄 **Middleware de multi-tenant** con RLS automático
- 🔄 **Documentación Swagger básica** para APIs principales

**ESTIMADO SEMANA 2: Inicio próximamente**

### **🔌 Sprint 2: Integraciones n8n (Semanas 3-4)**

#### **Semana 3: Webhooks Bidireccionales**
- [ ] Webhooks para recibir de n8n
- [ ] Servicio para notificar a n8n
- [ ] Manejo de errores y reintentos
- [ ] Testing de integración

#### **Semana 4: Sincronización Avanzada**
- [ ] Cola de mensajes para n8n
- [ ] Logging y observabilidad
- [ ] Configuración de ambientes
- [ ] Deploy en Docker

### **🎨 Sprint 3: Dashboard Frontend (Semanas 5-6)**

#### **Semana 5: Frontend Básico**
- [ ] Setup React/Next.js
- [ ] Sistema de autenticación frontend
- [ ] Dashboard de citas del día
- [ ] Listado de clientes

#### **Semana 6: Funcionalidades Avanzadas**
- [ ] Calendario de disponibilidad
- [ ] Creación manual de citas
- [ ] Configuración de organización
- [ ] Reportes básicos

### **🧪 Sprint 4: Testing y Piloto (Semanas 7-8)**

#### **Semana 7: Testing Integral**
- [ ] Tests end-to-end
- [ ] Performance testing
- [ ] Security testing
- [ ] Optimización de queries

#### **Semana 8: Piloto con Negocio Real**
- [ ] Configuración de 1er negocio piloto
- [ ] Flujos n8n específicos
- [ ] Monitoreo en producción
- [ ] Feedback y ajustes

---

## 🔧 Consideraciones Técnicas

### **⚡ Performance y Escalabilidad**

#### **Database Connection Pooling**
```javascript
// Configuración optimizada de Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  pool: {
    max: 20,          // Máximo 20 conexiones
    min: 5,           // Mínimo 5 conexiones
    acquire: 30000,   // Timeout de 30s
    idle: 10000       // Idle timeout de 10s
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});
```

#### **Caching Strategy**
```javascript
// Redis para cache de sesiones y datos frecuentes
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// Cache de disponibilidad por 5 minutos
const cacheDisponibilidad = async (profesional_id, fecha) => {
  const key = `disponibilidad:${profesional_id}:${fecha}`;
  const cached = await client.get(key);

  if (cached) return JSON.parse(cached);

  const disponibilidad = await calcularDisponibilidad(profesional_id, fecha);
  await client.setex(key, 300, JSON.stringify(disponibilidad)); // 5min TTL

  return disponibilidad;
};
```

### **🔐 Seguridad Multi-Tenant**

#### **Row Level Security Automático**
```javascript
// Middleware que configura RLS automáticamente
const setTenantContext = async (req, res, next) => {
  if (req.user?.organizacion_id) {
    await sequelize.query('SET app.current_tenant_id = ?', {
      replacements: [req.user.organizacion_id]
    });
  }
  next();
};
```

#### **Validación de Permisos**
```javascript
// Middleware para validar acceso a recursos
const validateResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    const resourceId = req.params.id;
    const tenantId = req.user.organizacion_id;

    const hasAccess = await checkResourceOwnership(resourceType, resourceId, tenantId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Acceso denegado al recurso' });
    }

    next();
  };
};
```

### **📊 Observabilidad y Monitoring**

#### **Structured Logging**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'saas-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

#### **Health Checks**
```javascript
// Endpoint de health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      n8n: await checkN8nHealth()
    }
  };

  const isHealthy = Object.values(health.services).every(s => s.status === 'ok');

  res.status(isHealthy ? 200 : 503).json(health);
});
```

---

## 🎯 Criterios de Éxito

### **📈 Métricas Técnicas**
- **⚡ Response Time**: < 200ms para APIs críticas
- **🔄 Uptime**: > 99.5% disponibilidad
- **📊 Throughput**: > 1000 requests/segundo
- **🗄️ Database Performance**: < 50ms query time promedio

### **💼 Métricas de Negocio**
- **🏢 3 negocios piloto** funcionando exitosamente
- **📱 100+ citas/día** procesadas automáticamente
- **🤖 90% automatización** de agendamiento vía WhatsApp
- **😊 95% satisfacción** de clientes piloto

### **🔧 Métricas de Desarrollo**
- **🧪 90% test coverage** en código crítico
- **📚 100% APIs documentadas** en Swagger
- **🚀 Deployment automático** configurado
- **📊 Monitoring completo** implementado

---

## 🚨 Riesgos y Mitigaciones

### **🔴 Riesgos Técnicos**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Performance de DB con múltiples tenants** | Media | Alto | Índices optimizados, connection pooling, cache Redis |
| **Rate limiting de WhatsApp/Evolution** | Alta | Medio | Cola de mensajes, reintentos exponenciales |
| **Inconsistencia de datos cross-DB** | Baja | Alto | Transacciones, locks, validaciones estrictas |
| **Escalabilidad de n8n workers** | Media | Medio | Monitoreo de colas, auto-scaling horizontal |

### **🟡 Riesgos de Negocio**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Adopción lenta de clientes piloto** | Media | Alto | Onboarding personalizado, soporte dedicado |
| **Complejidad UX para negocios pequeños** | Alta | Medio | UX simple, tutoriales, plantillas predefinidas |
| **Dependencia de WhatsApp Business API** | Baja | Alto | Multiple providers, backup SMS |

---

## 📞 Próximos Pasos Inmediatos

### **🎯 Estado Actual (Semana 1 - 70% Completado)**
1. ✅ **Validar plan** con stakeholders
2. ✅ **Inicializar proyecto** Node.js backend
3. ✅ **Configurar entorno** de desarrollo
4. ✅ **Conectar con bases** de datos existentes
5. ✅ **Implementar autenticación** básica

### **🚀 Próximos Pasos Inmediatos (Esta Semana)**
1. **🔐 Crear middleware** de autenticación y tenant isolation
2. **🗄️ Implementar modelos** de datos con queries SQL nativas
3. **📋 Crear controladores** básicos (auth, citas, clientes)
4. **✅ Agregar validadores** con Joi para APIs
5. **🧪 Setup testing inicial** con Jest

### **📅 Plan Siguiente Semana (Semana 2)**
1. **📱 APIs CRUD completas** para citas y clientes
2. **⏰ API de disponibilidad** usando índices optimizados
3. **📚 Documentación Swagger** para todas las APIs
4. **🔗 Integración básica** con n8n webhooks
5. **🧪 Tests de integración** con base de datos

### **📞 Coordinación Necesaria**
- **👨‍💼 Product Owner**: Validar prioridades de APIs
- **🎨 UX/UI Designer**: Definir interfaces del dashboard
- **🧪 QA Tester**: Definir estrategia de testing
- **🏢 Business Pilot**: Identificar primer negocio piloto

### **📋 Decisiones Pendientes**
- [ ] **Framework frontend**: React puro vs Next.js vs Vite
- [ ] **Hosting strategy**: AWS vs Digital Ocean vs local
- [ ] **CI/CD pipeline**: GitHub Actions vs Jenkins
- [ ] **Monitoring tools**: DataDog vs New Relic vs open source

---

## 📚 Recursos y Referencias

### **📖 Documentación Técnica**
- [Documentación Base de Datos SaaS](./docs_base_datos_saas.md)
- [CLAUDE.md - Configuración del Proyecto](./CLAUDE.md)
- [Configuración Docker](./docker-compose.yml)

### **🔧 Herramientas de Desarrollo**
- **PostgreSQL**: Base de datos principal
- **n8n**: Automatización de workflows
- **Evolution API**: Gateway de WhatsApp
- **Redis**: Cache y colas
- **Docker**: Containerización

### **🌐 APIs Externas**
- **WhatsApp Business API** (vía Evolution)
- **Google Calendar API**
- **DeepSeek AI API** (para agentes conversacionales)
- **Stripe API** (para pagos - futuro)

---

**📝 Documento vivo** - Se actualiza con el progreso del proyecto
**🔄 Última actualización**: Enero 2025
**👨‍💻 Mantenido por**: Equipo de desarrollo SaaS

---

## 🎯 Call to Action

**¿Estás listo para empezar con el backend Node.js?**

1. **✅ Review este plan** y confirma que estás de acuerdo
2. **🛠️ Setup del proyecto** siguiendo la estructura propuesta
3. **📞 Coordinemos** el primer sprint de desarrollo
4. **🚀 ¡Vamos a construir** este SaaS increíble!

**El futuro de la automatización de agendamiento está en nuestras manos. ¡Hagámoslo realidad! 🚀**