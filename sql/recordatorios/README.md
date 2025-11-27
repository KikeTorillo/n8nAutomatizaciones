# Módulo de Recordatorios - Documentación

## Descripción

Sistema de recordatorios automáticos para citas con inyección en memoria del chat para que el chatbot IA tenga contexto cuando el cliente responda.

## Archivos SQL

| Archivo | Descripción |
|---------|-------------|
| `01-tablas.sql` | Tablas de configuración e historial |
| `02-indices.sql` | Índices optimizados |
| `03-rls.sql` | Políticas Row Level Security |
| `04-pg-cron.sql` | Job automático y vistas de debugging |

## Configuración del Job Automático

El sistema necesita un job que se ejecute cada 5 minutos para procesar recordatorios pendientes.

### Opción 1: n8n Schedule Trigger (Recomendada)

1. Crear un workflow en n8n con:
   - **Trigger**: Schedule Trigger (cada 5 minutos)
   - **Node HTTP**: POST a `http://backend:3000/internal/recordatorios/procesar`

```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{"field": "minutes", "minutesInterval": 5}]
        }
      }
    },
    {
      "name": "Procesar Recordatorios",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://backend:3000/internal/recordatorios/procesar",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [{"name": "limite", "value": "100"}]
        }
      }
    }
  ]
}
```

### Opción 2: Cron del Sistema

Agregar al crontab del servidor:

```bash
# Procesar recordatorios cada 5 minutos
*/5 * * * * curl -X POST http://localhost:3000/internal/recordatorios/procesar -H "Content-Type: application/json" -d '{"limite": 100}' >> /var/log/recordatorios.log 2>&1
```

### Opción 3: pg_cron + pg_net

Si tienes las extensiones instaladas, descomenta el job en `04-pg-cron.sql`.

## Flujo de Procesamiento

```
┌─────────────────────────────────────────────────────────────────┐
│  Job (cada 5 min)                                               │
│       │                                                         │
│       ▼                                                         │
│  POST /internal/recordatorios/procesar                          │
│       │                                                         │
│       ▼                                                         │
│  RecordatorioService.procesarBatch()                           │
│       │                                                         │
│       ├─► 1. Obtener citas pendientes de recordatorio          │
│       │       (JOIN chatbot_config, configuracion_recordatorios)│
│       │                                                         │
│       ├─► 2. Para cada cita:                                   │
│       │       a. Construir mensaje personalizado               │
│       │       b. Inyectar en n8n_chat_histories                │
│       │       c. Enviar via Telegram/WhatsApp                  │
│       │       d. Registrar en historial_recordatorios          │
│       │       e. Marcar cita.recordatorio_enviado = TRUE       │
│       │                                                         │
│       └─► 3. Retornar estadísticas del batch                   │
└─────────────────────────────────────────────────────────────────┘
```

## Variables de Plantilla

La plantilla de mensaje soporta las siguientes variables:

| Variable | Descripción |
|----------|-------------|
| `{{cliente_nombre}}` | Nombre del cliente |
| `{{negocio_nombre}}` | Nombre de la organización |
| `{{fecha}}` | Fecha de la cita (formato largo) |
| `{{hora}}` | Hora de la cita (HH:MM) |
| `{{servicios}}` | Lista de servicios separados por coma |
| `{{precio}}` | Precio total formateado |
| `{{profesional_nombre}}` | Nombre del profesional |
| `{{codigo_cita}}` | Código único de la cita |

## Debugging

### Ver recordatorios pendientes

```sql
SELECT * FROM v_recordatorios_pendientes;
```

### Ver historial de envíos

```sql
SELECT
    hr.*,
    c.codigo_cita
FROM historial_recordatorios hr
JOIN citas c ON hr.cita_id = c.id
WHERE hr.organizacion_id = 1
ORDER BY hr.creado_en DESC
LIMIT 20;
```

### Ver configuración actual

```sql
SELECT * FROM configuracion_recordatorios WHERE organizacion_id = 1;
```

## Endpoints API

### Configuración

- `GET /api/v1/recordatorios/configuracion` - Obtener config
- `PUT /api/v1/recordatorios/configuracion` - Actualizar config

### Estadísticas

- `GET /api/v1/recordatorios/estadisticas` - Estadísticas de envíos
- `GET /api/v1/recordatorios/historial?cita_id=X` - Historial por cita

### Testing

- `POST /api/v1/recordatorios/test` - Enviar mensaje de prueba

### Interno

- `POST /internal/recordatorios/procesar` - Procesar batch (solo red interna)

## MCP Tool: confirmarCita

El sistema incluye un MCP Tool para que el chatbot pueda confirmar citas cuando el cliente responde afirmativamente a un recordatorio:

```javascript
// Uso en el chatbot
confirmarCita({ cita_id: 123 })
```

## Requisitos

1. **Chatbot activo**: La organización debe tener un chatbot configurado y activo
2. **Teléfono del cliente**: El cliente debe tener teléfono registrado
3. **Configuración habilitada**: `configuracion_recordatorios.habilitado = TRUE`
4. **Dentro de ventana horaria**: Los recordatorios solo se envían dentro del horario configurado

## Troubleshooting

### No se envían recordatorios

1. Verificar que el chatbot está activo:
   ```sql
   SELECT * FROM chatbot_config WHERE organizacion_id = X AND activo = TRUE;
   ```

2. Verificar configuración de recordatorios:
   ```sql
   SELECT * FROM configuracion_recordatorios WHERE organizacion_id = X;
   ```

3. Verificar vista de pendientes:
   ```sql
   SELECT * FROM v_recordatorios_pendientes WHERE organizacion = 'Tu Org';
   ```

### Error al inyectar en memoria del chat

La tabla `n8n_chat_histories` es creada automáticamente por n8n cuando se usa el nodo Postgres Chat Memory. Si no existe, los recordatorios se envían pero sin inyección de contexto.
