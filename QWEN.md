# Qwen Code Context - n8nAutomatizaciones

## Resumen del Proyecto

Este es un sistema integral de **scheduling de citas SaaS** llamado "n8n-whatsapp-bot" que combina múltiples tecnologías para crear una plataforma automatizada de gestión empresarial. El sistema está construido alrededor de:

- **n8n** para automatización de flujos de trabajo
- **Evolution API** para integración de WhatsApp
- **Google Calendar** para programación
- **Agente de IA DeepSeek** para respuestas inteligentes
- **PostgreSQL** para gestión de datos multi-inquilino
- **Backend Node.js** para lógica de negocio

## Arquitectura

### Servicios Principales (Docker Compose)

1. **Base de datos PostgreSQL** - Arquitectura multi-inquilino con Seguridad a Nivel de Fila (RLS)
   - Base de datos SaaS principal con 15+ tablas
   - Bases de datos separadas para flujos de n8n, datos de WhatsApp y memorias de chat
   - Soporta 4+ bases de datos diferentes en el ecosistema

2. **Redis** - Gestión de caché y colas

3. **n8n-main & n8n-worker** - Motor de automatización de flujos de trabajo
   - Modo de ejecución basado en colas
   - Concurrencia de trabajadores de 20

4. **Evolution API** - Integración de WhatsApp Business API
   - Maneja mensajería y conversaciones de WhatsApp

5. **pgAdmin** - Interfaz de administración de base de datos

6. **Backend Node.js** - Lógica de negocio SaaS personalizada
   - Servidor API Express.js
   - Autenticación y autorización multi-inquilino
   - Integración con todos los demás servicios

### Esquema de Base de Datos

El sistema implementa una arquitectura SaaS multi-inquilino sofisticada con:
- Seguridad a Nivel de Fila (RLS) para aislamiento de datos
- 15+ tablas normalizadas en múltiples dominios
- Sistema de gestión de suscripciones con 4 niveles de planes
- Seguimiento automático de métricas y límites de uso
- Sistema completo de auditoría

Categorías principales de tablas:
- Core: `usuarios`, `organizaciones`
- Negocio: `profesionales`, `clientes`, `servicios`
- Operaciones: `citas`, `horarios_disponibilidad`
- Suscripciones: `planes_subscripcion`, `subscripciones`, `metricas_uso_organizacion`

## Características Principales

### Sistema SaaS Multi-Inquilino
- Aislamiento completo de inquilinos usando PostgreSQL RLS
- 4 planes de suscripción (Prueba, Básico, Profesional, Empresarial)
- Límites de uso y seguimiento de métricas por organización
- Facturación automatizada y gestión de suscripciones

### Integración de WhatsApp
- Potenciada por Evolution API
- Flujos de trabajo automatizados de mensajería vía n8n
- Compromiso con clientes y confirmaciones de citas

### Automatización de Flujos de Trabajo
- Flujos de n8n para automatización de procesos empresariales
- Disparadores para creación de citas, confirmaciones, cancelaciones
- Integración con servicios externos (Google Calendar, WhatsApp)

### Programación de Citas
- Sistema de programación multi-profesional
- Gestión de disponibilidad con prevención de conflictos
- Plantillas específicas por industria (peluquerías, spas, consultorios médicos)

## Estructura de Archivos

```
n8nAutomatizaciones/
├── backend/           # API Express Node.js
├── bruno-collection/  # Colección de pruebas de API
├── flows/             # Archivos de flujo de n8n
├── sql/              # Scripts y esquemas PostgreSQL
├── docker-compose.yml # Configuración de servicios Docker
├── init-data.sh      # Script de inicialización de base de datos
├── package.json      # Metadatos y scripts del proyecto
└── ...
```

## Comandos de Desarrollo

### Ejecutar el Sistema
```bash
# Iniciar todos los servicios
npm start
# o
docker compose up -d

# Detener servicios  
npm stop
docker compose down

# Modo desarrollo con reinicio automático
npm run dev

# Ver registros
npm run logs
npm run logs:n8n    # Registros de n8n
npm run logs:evolution  # Registros de API de WhatsApp
npm run logs:postgres   # Registros de base de datos
```

### Comandos de Gestión
```bash
# Limpiar todos los datos y reiniciar desde cero
npm run clean:data

# Crear instancia nueva
npm run fresh:clean

# Copia de seguridad de base de datos
npm run backup:db

# Conectar a base de datos
npm run db:connect
```

### Desarrollo Backend
El backend está ubicado en `backend/app/` e incluye:
- API Express.js con autenticación JWT
- Conexión PostgreSQL con agrupación de conexiones
- Registro completo con Winston
- Documentación de API con Swagger
- Middleware de seguridad (helmet, limitación de tasa, CORS)

## Configuración de Entorno

El sistema utiliza variables de entorno gestionadas a través de archivos `.env`. Las variables clave incluyen:
- Credenciales y detalles de conexión de base de datos
- Configuración de n8n (claves de cifrado, autenticación)
- Claves y configuraciones de Evolution API
- Configuración de Redis
- Secretos JWT
- Configuraciones de limitación de tasa de API

## Características de Seguridad

1. **Seguridad a Nivel de Fila (RLS)** - Aislamiento completo de inquilinos
2. **Autenticación multinivel** - 5 tipos de roles desde super_admin hasta cliente
3. **Limitación de Tasa de API** - Protección contra abusos
4. **Gestión Segura de Sesiones** - Variables de sesión PostgreSQL para contexto RLS
5. **Comunicación Cifrada** - HTTPS y cabeceras seguras
6. **Segregación de Usuarios de Base de Datos** - Usuarios separados para diferentes servicios

## Puntos de Integración

1. **Flujos de n8n** - Disparados por eventos de base de datos, acciones de usuario
2. **WhatsApp vía Evolution API** - Comunicación automatizada con clientes
3. **Google Calendar** - Sincronización de citas
4. **Puertas de Enlace de Pago Externas** - Integración de Stripe, PayPal, Conekta
5. **Agente de IA (DeepSeek)** - Manejo de conversaciones inteligentes
6. **Webhooks de Base de Datos** - Notificaciones en tiempo real para eventos del sistema

## Notas de Desarrollo

- El sistema está validado y listo para producción (a partir de septiembre de 2025)
- Soporta 1000+ organizaciones y 10M+ citas por mes
- Pruebas completas con 3 organizaciones reales ya validadas
- 59+ plantillas de servicios en 11 industrias diferentes
- Seguimiento automatizado de métricas y límites de uso por inquilino

## Solución de Problemas

Problemas comunes:
- Contexto RLS de base de datos no configurado - asegurar que el backend configure variables de sesión PostgreSQL
- Flujos de n8n no se disparan - verificar URLs de webhook y autenticación
- Mensajes de WhatsApp no se envían - verificar configuración de Evolution API
- Problemas de rendimiento - asegurar que los 69+ índices de base de datos estén creados

Para depuración, verificar registros de servicio usando los comandos `npm run logs:*`.