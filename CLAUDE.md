# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## Preferencia de Idioma

**IMPORTANTE**: Toda la comunicación debe ser en español. El usuario prefiere recibir respuestas, explicaciones y documentación en español.

## Resumen General

Este repositorio contiene un sistema de automatización de WhatsApp con n8n usando contenedores Docker. El proyecto consiste en un bot de WhatsApp con integración de Agente AI DeepSeek, integración con Google Calendar, configuración Nginx para proxy reverso con SSL, y está diseñado para servir como base de una agencia de automatización especializada en flujos de trabajo de n8n.

## Arquitectura

El sistema funciona con Docker Compose con los siguientes servicios:
- **PostgreSQL**: Base de datos compartida para todos los servicios
- **n8n**: Plataforma principal de automatización (disponible en puerto 5678)
- **Evolution API**: Integración con API de WhatsApp (disponible en puerto 8000)
- **pgAdmin**: Interfaz de administración de base de datos (disponible en puerto 8001)
- **Nginx**: Proxy reverso con configuración SSL para dominio n8nflowautomat.com

Todos los servicios se comunican a través de una red backend compartida y usan PostgreSQL como base de datos principal.

## Comandos de Desarrollo

### Iniciar/Detener Servicios
```bash
npm run start       # Iniciar todos los servicios
npm run stop        # Detener todos los servicios
npm run restart     # Reiniciar todos los servicios
npm run dev         # Construir e iniciar servicios
npm run dev:fresh   # Inicio limpio con reconstrucción y volúmenes limpios
```

### Monitoreo y Logs
```bash
npm run status      # Verificar estado de servicios
npm run logs        # Ver logs de todos los servicios
npm run logs:n8n    # Ver logs específicos de n8n
npm run logs:evolution # Ver logs de Evolution API
npm run logs:postgres  # Ver logs de PostgreSQL
```

### Operaciones de Base de Datos
```bash
npm run backup:db   # Respaldar base de datos PostgreSQL
npm run db:connect  # Conectar a CLI de PostgreSQL
```

### Limpieza
```bash
npm run clean       # Remover contenedores y limpieza del sistema
npm run clean:data  # Remover todos los volúmenes de datos y limpieza
npm run fresh:clean # Instalación completamente limpia
```

## Configuración de Entorno

El sistema usa archivos de entorno (.env, .env.dev, .env.prod) con estas variables clave:
- `AUTHENTICATION_API_KEY`: Clave de autenticación de Evolution API
- `WEBHOOK_URL`: URL del webhook externo (típicamente túnel ngrok)
- `N8N_EDITOR_BASE_URL`: URL base del editor de n8n
- `POSTGRES_*`: Credenciales de la base de datos
- `SERVER_URL`: URL del servidor Evolution API

## Estructura de Flujos de n8n

El directorio flows contiene archivos JSON de flujos de trabajo de n8n organizados por proyectos:

### flows/Barberia/
- **Barberia.json**: Flujo principal de automatización para citas de barbería
- **promtAgenteBarberia.md**: Prompt y documentación del agente AI especializado para barbería

### flows/ejemploDeepseekGoggleCalendar/
- Ejemplos de integración entre DeepSeek AI y Google Calendar

### Características de los Flujos:
- Los flujos integran Evolution API para mensajería de WhatsApp
- Integración de AI a través de modelos DeepSeek con prompts especializados
- Nodos HTTP Request para integraciones de API personalizadas
- Transformación de datos y enrutamiento de mensajes
- Integración con Google Calendar para gestión de citas

## Componentes Técnicos Clave

1. **Integración Evolution API**: Manejo de mensajes de WhatsApp a través de endpoints HTTP
2. **Sistema de Agente AI**: Integración DeepSeek para respuestas inteligentes con prompts especializados
3. **Persistencia de Base de Datos**: PostgreSQL para almacenamiento de sesiones y conversaciones
4. **Sistema de Webhooks**: Procesamiento de mensajes en tiempo real a través de webhooks
5. **Proxy Reverso Nginx**: Configuración SSL/TLS para dominio público con certificados Let's Encrypt
6. **Google Calendar API**: Integración para gestión automatizada de citas y eventos

## Configuración de Nginx

El proyecto incluye configuración de Nginx para proxy reverso:
- **nginx.conf**: Configuración para producción con SSL/TLS en dominio n8nflowautomat.com
- **nginx.conf.local**: Configuración para desarrollo local
- Maneja tanto HTTP (puerto 80) como HTTPS (puerto 443)
- Certificados SSL administrados por Let's Encrypt
- Proxy hacia n8n en puerto 5678

## Contexto de Negocio

Esta infraestructura técnica soporta un modelo de negocio de agencia de automatización enfocado en:
- Desarrollo de flujos de trabajo personalizados de n8n
- Soluciones de bots de WhatsApp especializados (ej: barberías)
- Automatización impulsada por IA con agentes especializados
- Integraciones multiplataforma (WhatsApp, Google Calendar, APIs diversas)
- Automatización de procesos de negocio (BPA)
- Gestión de citas y reservas automatizadas

El proyecto sirve tanto como base técnica como escaparate para clientes potenciales que buscan soluciones de automatización personalizadas.