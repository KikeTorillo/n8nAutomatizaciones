# Flujo 7: Agendamiento IA WhatsApp

Este flujo representa las operaciones que el sistema de IA conversacional (n8n + Evolution API) realiza para gestionar citas a través de WhatsApp.

## Características Especiales

- **SIN AUTENTICACIÓN JWT**: Estos endpoints NO requieren token de autenticación
- **Validación por organizacion_id**: Se incluye en body o query params para identificar la organización
- **Uso exclusivo de n8n workflows**: Estos endpoints están diseñados para ser consumidos por flujos automatizados

## Secuencia de requests

1. **Buscar Cliente por Teléfono** - Verifica si el cliente ya existe
2. **Crear Cliente vía WhatsApp** - Registra un nuevo cliente desde WhatsApp
3. **Consultar Disponibilidad (IA)** - Muestra slots disponibles para agendar
4. **Crear Cita Automática** - Agenda una cita vía conversación de WhatsApp
5. **Modificar Cita WhatsApp** - Cambia la fecha/hora de una cita existente
6. **Cancelar Cita WhatsApp** - Cancela una cita solicitada por el cliente

## Arquitectura del Sistema IA

```
WhatsApp (Cliente)
    ↓
Evolution API
    ↓
n8n Workflow (Claude/GPT)
    ↓
Backend API (/api/v1/citas/automatica)
    ↓
PostgreSQL (RLS multi-tenant)
```

## Variables guardadas

Las mismas del Flujo 6, pero obtenidas de forma conversacional:
- `clienteId` - ID del cliente (buscado o creado)
- `codigoCita` - Código de cita auto-generado

## Seguridad

Aunque no usan autenticación JWT, estos endpoints están protegidos por:

1. **Validación de organizacion_id**: Solo pueden acceder a datos de su organización
2. **RLS de PostgreSQL**: Aislamiento total de datos por tenant
3. **Rate Limiting**: Protección contra abuso
4. **Validación de datos**: Schemas Joi estrictos

## Prerequisitos

- Sistema n8n configurado y corriendo
- Evolution API conectada a WhatsApp Business
- Workflows de n8n creados (ver /PROMPT_AGENTE_N8N.md)
- Organización configurada con profesionales y servicios

## Diferencias con Agendamiento Manual

| Aspecto | Manual (Flujo 6) | IA WhatsApp (Flujo 7) |
|---------|------------------|----------------------|
| Autenticación | JWT Bearer Token | Sin auth (organizacion_id) |
| Iniciador | Staff de la organización | Cliente final |
| Interfaz | Panel administrativo | Conversación WhatsApp |
| Validación | Middleware auth | organizacion_id en payload |
| Endpoints | `/api/v1/citas` | `/api/v1/citas/automatica` |
