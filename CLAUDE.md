# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## Preferencia de Idioma

**IMPORTANTE**: Toda la comunicación debe ser en español. El usuario prefiere recibir respuestas, explicaciones y documentación en español.

## Resumen General

Este repositorio contiene una **plataforma SaaS multi-tenant** para automatización de agendamiento en múltiples industrias (barberías, consultorios médicos, spas, etc.). El sistema utiliza **comunicación multi-canal** (WhatsApp, Telegram, SMS, redes sociales) potenciado por **IA conversacional** y **automatización con n8n**.

### 🎯 Objetivo del Proyecto
Crear una plataforma escalable que automatice completamente el proceso de agendamiento de citas para pequeñas y medianas empresas de servicios, eliminando la fricción entre negocios y clientes a través de conversaciones naturales en cualquier canal digital.

### 🏗️ Arquitectura SaaS Multi-Tenant
- **Multi-tenant**: Aislamiento completo de datos por organización
- **Multi-industria**: Soporte para 10+ tipos de negocio con plantillas especializadas
- **Multi-canal**: WhatsApp, Telegram, SMS, Facebook, Instagram, Email
- **Escalable**: Diseñado para 1000+ organizaciones y 10M+ citas/mes

## Arquitectura Completa

### 🐳 Servicios Docker Actuales
- **PostgreSQL**: Base de datos compartida con múltiples DBs especializadas (puerto 5432)
  - `postgres_db`: SaaS principal (organizaciones, citas, clientes)
  - `n8n_db`: Workflows y automatizaciones
  - `evolution_db`: Datos de WhatsApp y sesiones
  - `chat_memories_db`: Historiales de IA conversacional
- **Redis**: Sistema de caché y colas para n8n (puerto 6379)
- **n8n-main**: Servicio principal de n8n (puerto 5678)
- **n8n-worker**: Worker de n8n para procesamiento en cola (concurrencia 20)
- **Evolution API**: Gateway de WhatsApp (puerto 8000)
- **pgAdmin**: Interfaz de administración de base de datos (puerto 8001)

### 🚀 Backend API Node.js (EN DESARROLLO - 70% COMPLETADO)
**Ubicación**: `./backend/`

#### 🏗️ Arquitectura Implementada:
- **Express.js**: API RESTful con middlewares de seguridad enterprise
- **PostgreSQL Nativo**: Queries SQL nativas (sin ORM) para máximo control
- **JWT Auth**: Sistema completo con access + refresh tokens
- **Multi-DB Pools**: 4 pools de conexión especializados por uso
- **Logging Estructurado**: Winston con contexto multi-tenant
- **Graceful Shutdown**: Manejo robusto de señales del sistema

#### ✅ Componentes Completados:
- **Database Config**: Pools optimizados para 4 bases de datos
- **Auth System**: JWT + bcrypt + validación de contraseñas
- **Utilities**: Helpers para validación, fechas, códigos únicos
- **Application**: Express con seguridad, CORS, rate limiting
- **Health Checks**: Monitoreo automático de todas las dependencias

#### 🔄 En Desarrollo (Sprint 1):
- **Middleware**: Autenticación y aislamiento multi-tenant
- **Models**: Queries SQL nativas para cada entidad
- **Controllers**: APIs CRUD para citas, clientes, disponibilidad
- **Validators**: Schemas Joi para todas las entradas
- **Testing**: Setup Jest con tests unitarios e integración

### 📱 Canales de Comunicación Soportados
- **WhatsApp** (Prioritario): Evolution API
- **Telegram**: Bot API de Telegram
- **SMS**: Twilio/AWS SNS
- **Facebook Messenger**: Graph API
- **Instagram Direct**: Basic Display API
- **Email**: SMTP/SendGrid/AWS SES

Todos los servicios se comunican a través de una red backend compartida con aislamiento completo de datos por tenant (Row Level Security).

## Comandos de Desarrollo

### 🐳 Docker Services (Infraestructura)
```bash
npm run start       # Iniciar todos los servicios
npm run stop        # Detener todos los servicios
npm run restart     # Reiniciar todos los servicios
npm run dev         # Construir e iniciar servicios
npm run dev:fresh   # Inicio limpio con reconstrucción y volúmenes limpios
```

### 🚀 Backend Node.js (./backend/)
```bash
cd backend
npm install         # Instalar dependencias
npm run dev         # Desarrollo con nodemon
npm start           # Producción
npm test            # Ejecutar tests
npm run test:watch  # Tests en modo watch
npm run test:coverage # Tests con coverage
```

### 📊 Monitoreo y Logs
```bash
npm run status         # Verificar estado de servicios
npm run logs           # Ver logs de todos los servicios
npm run logs:n8n       # Ver logs específicos de n8n
npm run logs:evolution # Ver logs de Evolution API
npm run logs:postgres  # Ver logs de PostgreSQL

# Backend logs
cd backend && npm run logs  # Ver logs del backend
```

### 🗄️ Operaciones de Base de Datos
```bash
npm run backup:db   # Respaldar base de datos PostgreSQL
npm run db:connect  # Conectar a CLI de PostgreSQL

# Backend database operations
cd backend
npm run db:migrate  # Ejecutar migraciones
npm run db:seed     # Cargar datos de prueba
```

### 🧹 Limpieza
```bash
npm run clean       # Remover contenedores y limpieza del sistema
npm run clean:data  # Remover todos los volúmenes de datos (postgres, n8n, evolution, pgadmin, redis)
npm run fresh:clean # Instalación completamente limpia con reconstrucción
```

### 🧪 Testing y Documentación
```bash
# Backend testing
cd backend
npm test            # Todos los tests
npm run test:unit   # Tests unitarios
npm run test:integration # Tests de integración
npm run docs        # Generar documentación Swagger
```

## Configuración de Entorno

El sistema usa archivos de entorno (.env, .env.dev, .env.prod) con estas variables clave:

### Variables de Base de Datos
- `POSTGRES_DB`: Nombre de la base de datos principal del SaaS
- `POSTGRES_USER`: Usuario administrador de PostgreSQL
- `POSTGRES_PASSWORD`: Contraseña del usuario PostgreSQL

### Usuarios Específicos por Aplicación (Configurados automáticamente)
- **`saas_app`**: Usuario para la aplicación SaaS principal
- **`n8n_app`**: Usuario para n8n workflows
- **`evolution_app`**: Usuario para Evolution API
- **`chat_app`**: Usuario para historiales de chat AI
- **`readonly_user`**: Usuario de solo lectura para analytics
- **`integration_user`**: Usuario para integraciones cross-database

### Variables de n8n
- `N8N_ENCRYPTION_KEY`: Clave de encriptación para n8n (no cambiar después de configuración inicial)
- `N8N_BASIC_AUTH_USER`: Usuario para autenticación básica del editor web
- `N8N_BASIC_AUTH_PASSWORD`: Contraseña para autenticación básica del editor web
- `WEBHOOK_URL`: URL externa donde n8n recibirá webhooks (ngrok o dominio público)
- `N8N_EDITOR_BASE_URL`: URL base del editor de n8n

### Variables de Evolution API
- `AUTHENTICATION_API_KEY`: Clave de autenticación para endpoints de Evolution API
- `SERVER_URL`: URL donde Evolution API está ejecutándose
- `CONFIG_SESSION_PHONE_VERSION`: Versión de WhatsApp que Evolution API simulará

### Variables de Sistema
- `TZ`: Zona horaria para todos los servicios
- `PGADMIN_DEFAULT_EMAIL`: Email de acceso para pgAdmin
- `PGADMIN_DEFAULT_PASSWORD`: Contraseña de acceso para pgAdmin

## Base de Datos SaaS Multi-Tenant

### 🗄️ Diseño de Base de Datos
El sistema utiliza un diseño **multi-tenant** con una sola instancia PostgreSQL pero **aislamiento completo** de datos por organización:

#### Tablas Principales:
- **`organizaciones`**: Tenants principales del sistema (cada negocio)
- **`citas`**: Sistema de agendamiento con código único por cita
- **`clientes`**: Base de clientes con integración multi-canal
- **`profesionales`**: Barberos, estilistas, doctores, etc.
- **`servicios`**: Servicios ofrecidos por cada organización
- **`franjas_horarias`**: Disponibilidad granular para agendamiento
- **`subscripciones`**: Planes y límites por organización
- **`plantillas_servicios`**: Servicios pre-configurados por industria

#### Características Técnicas:
- **Row Level Security (RLS)**: Aislamiento automático por `organizacion_id`
- **Índices optimizados**: Performance para 10M+ citas/mes
- **Multi-industria**: 10+ tipos de negocio soportados (barbería, spa, consultorio, etc.)
- **Escalabilidad**: Diseñado para 1000+ organizaciones
- **Auditoría completa**: Versionado y logs de cambios

#### Archivos de Esquema:
- **`diseno_base_datos_saas.sql`**: Schema completo de la base de datos
- **`plantillas_servicios_industrias.sql`**: Servicios predefinidos por industria
- **`docs_base_datos_saas.md`**: Documentación técnica completa (50+ páginas)
- **`init-data.sh`**: Inicialización automática de usuarios y permisos

## Estructura de Flujos de n8n

El directorio flows contiene archivos JSON de flujos de trabajo de n8n organizados por proyectos:

### flows/Barberia/
- **Barberia.json**: Flujo principal de automatización para citas de barbería
- **promtAgenteBarberia.md**: Prompt y documentación del agente AI especializado para barbería
- **Configuracion.csv**: Configuración del sistema de barbería
- **Citas_Agendadas_Headers.csv**: Estructura de datos para citas agendadas
- **Horarios_Disponibles.csv**: Horarios disponibles para agendamiento

### Características de los Flujos:
- **Comunicación multi-canal**: WhatsApp (Evolution API), Telegram, SMS, email
- **Integración de IA**: Modelos DeepSeek con prompts especializados por industria
- **Backend API**: Integración con backend Node.js para sincronización bidireccional
- **Nodos HTTP Request**: Integraciones de API personalizadas por canal
- **Transformación de datos**: Routing inteligente de mensajes según canal
- **Google Calendar API**: Gestión automatizada de citas y eventos
- **Sistema de webhooks**: Comunicación en tiempo real con backend SaaS

## Componentes Técnicos Clave

### 🔧 Infraestructura Core
1. **Base de Datos SaaS Multi-Tenant**: PostgreSQL con Row Level Security para aislamiento completo
2. **Sistema de Colas Redis**: Manejo de ejecuciones distribuidas y caché de alta performance
3. **Arquitectura de Workers**: n8n-main (editor) + n8n-worker (concurrencia 20) para escalabilidad
4. **Proxy Reverso Nginx**: SSL/TLS para producción con certificados Let's Encrypt

### 📱 Comunicación Multi-Canal
5. **Evolution API**: Gateway principal para WhatsApp Business
6. **Channel Gateway**: Abstracción para múltiples canales (Telegram, SMS, redes sociales)
7. **Sistema de Webhooks**: Procesamiento bidireccional en tiempo real

### 🤖 Inteligencia y Automatización
8. **Sistema de Agente IA**: DeepSeek con prompts especializados por industria
9. **Backend API Node.js**: Orquestador central con PostgreSQL nativo y JWT auth
10. **Google Calendar API**: Sincronización automática de citas y eventos

### 🔐 Seguridad y Escalabilidad
11. **Row Level Security (RLS)**: Aislamiento automático de datos por tenant
12. **Usuarios especializados**: 6 usuarios con permisos mínimos por servicio
13. **Índices optimizados**: Performance enterprise para millones de registros

## Configuración de Nginx

El proyecto incluye configuración de Nginx para proxy reverso:
- **nginx.conf**: Configuración para producción con SSL/TLS en dominio n8nflowautomat.com
- **nginx.conf.local**: Configuración para desarrollo local
- Maneja tanto HTTP (puerto 80) como HTTPS (puerto 443)
- Certificados SSL administrados por Let's Encrypt
- Proxy hacia n8n en puerto 5678

## Contexto de Negocio

### 🎯 Modelo de Negocio SaaS
Esta infraestructura técnica soporta una **plataforma SaaS multi-tenant** enfocada en:

#### Mercado Objetivo:
- **Pequeñas y medianas empresas** de servicios (barberías, spas, consultorios)
- **Múltiples industrias**: 10+ tipos de negocio con plantillas especializadas
- **Expansión global**: Adaptable a diferentes mercados y canales locales

#### Propuesta de Valor:
- **Automatización completa** de agendamiento sin apps para clientes
- **Comunicación natural** por canales que los clientes ya usan
- **IA conversacional** especializada por industria
- **Implementación rápida** con plantillas pre-configuradas
- **Escalabilidad** desde 1 negocio hasta 1000+ organizaciones

#### Diferenciadores Competitivos:
- **Multi-canal agnóstico**: No limitado a WhatsApp únicamente
- **Multi-tenant nativo**: Aislamiento completo y seguridad enterprise
- **IA especializada**: Agentes entrenados por tipo de industria
- **Open source core**: Basado en n8n con extensiones propietarias

### 📈 Estrategia de Crecimiento
- **Fase 1 (Q1-Q2 2025)**: MVP con WhatsApp + 3 negocios piloto
- **Fase 2 (Q3-Q4 2025)**: Expansión multi-canal + 100+ organizaciones
- **Fase 3 (2026+)**: API pública + ecosistema de partners

### 🏗️ Arquitectura de Documentación
- **`PLAN_PROYECTO_SAAS.md`**: Plan completo del proyecto y roadmap (actualizado)
- **`docs_base_datos_saas.md`**: Documentación técnica de base de datos
- **`backend/ESTRUCTURA_BACKEND.md`**: Documentación técnica del backend Node.js
- **`backend/README.md`**: Guía de desarrollo del backend
- **Flujos n8n especializados**: Templates por industria
- **Backend APIs**: Documentación Swagger/OpenAPI (en desarrollo)

### 📊 Estado Actual del Proyecto
- **✅ Fase 1 - Base de Datos**: 100% completado
- **🔄 Fase 2 - Backend Node.js**: 70% completado (Sprint 1)
- **🔄 Fase 3 - Integraciones n8n**: Próximamente
- **🔄 Fase 4 - Frontend Dashboard**: Planificado

El proyecto evoluciona de una **agencia de automatización** hacia una **plataforma SaaS escalable** que democratiza la automatización de agendamiento para cualquier negocio de servicios.