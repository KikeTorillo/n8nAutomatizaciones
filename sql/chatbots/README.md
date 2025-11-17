# Módulo: Chatbots IA Multi-Plataforma

## 📋 Descripción

Sistema completo de chatbots de **IA conversacional** para múltiples plataformas de mensajería. Integración profunda con **n8n workflows** y **MCP Server** para autenticación multi-tenant y acceso a herramientas del backend.

## 🎯 Propósito

- **Chatbots IA** conversacionales para cada organización
- **Multi-plataforma**: Telegram, WhatsApp, Instagram, Facebook Messenger, Slack, Discord
- **Integración n8n**: Workflows automatizados por organización
- **MCP Server**: Autenticación JWT multi-tenant para tools
- **System prompts**: Personalizables por organización
- **Métricas en tiempo real**: Mensajes procesados, citas creadas
- **Soft delete**: Preservar historial al eliminar chatbots

## 🗂️ Tablas

### `chatbot_config`
Configuración principal de chatbots por organización y plataforma.

**Características:**
- **1 chatbot por plataforma** por organización (UNIQUE parcial)
- **Config JSONB flexible** por plataforma (tokens, keys, etc.)
- **Soft delete** preserva historial (deleted_at)
- **JWT multi-tenant** por chatbot para MCP Server
- **Métricas de uso** (mensajes, citas creadas)
- **System prompts** personalizables

**Campos clave:**
- `plataforma`: ENUM (telegram, whatsapp_oficial, instagram, etc.)
- `config_plataforma`: JSONB con datos específicos de cada plataforma
- `n8n_workflow_id`: UUID del workflow en n8n
- `mcp_jwt_token`: Token JWT para autenticación MCP Server
- `mcp_credential_id`: ID credential compartida por org
- `system_prompt`: Prompt personalizado del AI Agent
- `activo`: Mapeo 1:1 con workflow.active en n8n

### `chatbot_credentials`
Auditoría de credentials creadas en n8n para chatbots.

**Características:**
- **Tracking de credentials** n8n por chatbot
- **Validación de estado** (is_valid)
- **Última uso** para detección de credentials obsoletas

**Campos clave:**
- `n8n_credential_id`: ID de credential en n8n
- `credential_type`: telegramApi, httpHeaderAuth, etc.
- `is_valid`: Si la credential sigue activa en n8n

## 📊 Archivos del Módulo

```
chatbots/
├── 01-tablas.sql          (2 tablas: chatbot_config + chatbot_credentials)
├── 02-indices.sql         (8 índices especializados)
├── 03-rls-policies.sql    (4 políticas RLS multi-tenant)
├── 04-triggers.sql        (1 trigger updated_at)
└── README.md              (este archivo)
```

## 📊 Índices Especializados (8)

### Tabla `chatbot_config` (6 índices)

1. **idx_chatbot_organizacion** - Búsqueda por organización
2. **idx_chatbot_workflow** - Búsqueda por n8n workflow ID (parcial)
3. **idx_chatbot_mcp_credential** - Búsqueda por credential MCP compartida (parcial)
4. **idx_chatbot_deleted_activo** - Filtrado activos no eliminados (parcial)
5. **idx_chatbot_ultimo_mensaje** - Ordenamiento por actividad reciente (parcial)
6. **idx_chatbot_plataforma** - Filtrado por plataforma (parcial)

**Índice UNIQUE parcial:**
- **uq_chatbot_org_plataforma_active** - Solo 1 chatbot activo por plataforma/org

### Tabla `chatbot_credentials` (2 índices)

1. **idx_chatbot_cred_config** - Búsqueda por chatbot
2. **idx_chatbot_cred_type** - Filtrado por tipo de credential

## 🛡️ Row Level Security (RLS)

### Tabla `chatbot_config` (2 políticas)

- **chatbot_config_tenant_isolation** - Aislamiento multi-tenant estándar
- **chatbot_config_system_bypass** - Bypass para funciones de sistema

### Tabla `chatbot_credentials` (2 políticas)

- **chatbot_credentials_tenant_isolation** - Aislamiento indirecto vía FK
- **chatbot_credentials_system_bypass** - Bypass para funciones de sistema

## 🔄 Triggers Automáticos (1)

### `trigger_actualizar_timestamp_chatbot_config`
- **Disparo:** BEFORE UPDATE en `chatbot_config`
- **Función:** Actualiza `actualizado_en` automáticamente
- **Uso:** Auditoría de modificaciones de configuración

## 📱 Plataformas Soportadas (7)

| Plataforma | ENUM | Integración |
|------------|------|-------------|
| **Telegram** | `telegram` | Bot API (bot_token) |
| **WhatsApp Oficial** | `whatsapp_oficial` | Business API via BSP |
| **Instagram** | `instagram` | Direct Messages via Graph API |
| **Facebook Messenger** | `facebook_messenger` | Messenger via Graph API |
| **Slack** | `slack` | Bot API |
| **Discord** | `discord` | Bot API |
| **Otro** | `otro` | Plataformas personalizadas |

## 🔐 Configuración por Plataforma (JSONB)

### Telegram
```json
{
  "bot_token": "123456789:ABCdef...",
  "bot_username": "mibarberia_bot",
  "bot_id": 123456789
}
```

### WhatsApp (Evolution API)
```json
{
  "phone_number": "+5215512345678",
  "instance_id": "instance-uuid-xxx",
  "api_key": "evolution-api-key-xxx"
}
```

### Instagram
```json
{
  "access_token": "instagram-access-token-xxx",
  "page_id": "123456789",
  "username": "@mibarberia"
}
```

## 🔐 Autenticación MCP Server

### Estrategia Multi-Tenant
- **1 JWT por chatbot** con `organizacion_id` embebido
- **1 credential httpHeaderAuth** por organización (compartida)
- **Rotación de tokens** sin rebuild de workflows

### Flujo de Autenticación
1. Backend genera JWT con `organizacion_id` y `usuario_bot_id`
2. JWT se guarda en `mcp_jwt_token`
3. Backend crea credential httpHeaderAuth en n8n
4. Credential se asocia a MCP Server node
5. MCP Server envía JWT en header Authorization
6. Backend valida JWT y extrae `organizacion_id`
7. Backend ejecuta tools con contexto multi-tenant correcto

## 📦 Dependencias

### Requiere (Orden de carga)
1. `fundamentos/` - ENUM `plataforma_chatbot`, función `actualizar_timestamp()`
2. `nucleo/` - Tabla `organizaciones`

### Usado por
- Backend API - Endpoints CRUD de chatbots
- n8n workflows - Configuración dinámica por organización
- MCP Server - Autenticación y ejecución de tools
- Dashboard - Monitoreo de métricas y estado

## 🔧 Uso desde Backend

### Crear Chatbot Telegram
```javascript
await RLSContextManager.query(orgId, async (db) => {
  const result = await db.query(`
    INSERT INTO chatbot_config (
      organizacion_id, nombre, plataforma,
      config_plataforma, system_prompt, ai_model
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    orgId,
    'Chatbot Atención al Cliente',
    'telegram',
    JSON.stringify({
      bot_token: '123456789:ABCdef...',
      bot_username: 'mibarberia_bot',
      bot_id: 123456789
    }),
    'Eres un asistente virtual de [NOMBRE_NEGOCIO]...',
    'deepseek-chat'
  ]);

  return result.rows[0];
});
```

### Actualizar Métricas (desde Webhook n8n)
```javascript
await RLSContextManager.query(orgId, async (db) => {
  await db.query(`
    UPDATE chatbot_config
    SET total_mensajes_procesados = total_mensajes_procesados + 1,
        ultimo_mensaje_recibido = NOW()
    WHERE id = $1
  `, [chatbotId]);
});
```

### Incrementar Contador de Citas
```javascript
await RLSContextManager.query(orgId, async (db) => {
  await db.query(`
    UPDATE chatbot_config
    SET total_citas_creadas = total_citas_creadas + 1
    WHERE id = $1
  `, [chatbotId]);
});
```

### Soft Delete (Preservar Historial)
```javascript
await RLSContextManager.query(orgId, async (db) => {
  await db.query(`
    UPDATE chatbot_config
    SET deleted_at = NOW(),
        activo = false
    WHERE id = $1
  `, [chatbotId]);
});
```

## 📊 Consultas Útiles

### Listar Chatbots Activos de una Organización
```sql
SELECT
  id,
  nombre,
  plataforma,
  activo,
  total_mensajes_procesados,
  total_citas_creadas,
  ultimo_mensaje_recibido
FROM chatbot_config
WHERE organizacion_id = 1
  AND deleted_at IS NULL
ORDER BY creado_en DESC;
```

### Buscar Chatbot por Workflow ID (desde n8n)
```sql
SELECT
  cc.id,
  cc.organizacion_id,
  cc.nombre,
  cc.plataforma,
  cc.activo
FROM chatbot_config cc
WHERE cc.n8n_workflow_id = 'workflow-uuid-xxx'
  AND cc.deleted_at IS NULL;
```

### Chatbots con Credential MCP Compartida
```sql
SELECT
  id,
  organizacion_id,
  nombre,
  plataforma
FROM chatbot_config
WHERE mcp_credential_id = 'mcp-cred-123'
  AND deleted_at IS NULL
ORDER BY creado_en ASC;
```

### Estadísticas de Uso por Plataforma
```sql
SELECT
  plataforma,
  COUNT(*) as total_chatbots,
  SUM(total_mensajes_procesados) as mensajes_totales,
  SUM(total_citas_creadas) as citas_totales,
  AVG(total_mensajes_procesados) as promedio_mensajes
FROM chatbot_config
WHERE deleted_at IS NULL
GROUP BY plataforma
ORDER BY total_chatbots DESC;
```

### Detectar Chatbots Inactivos (>30 días)
```sql
SELECT
  id,
  organizacion_id,
  nombre,
  plataforma,
  ultimo_mensaje_recibido,
  EXTRACT(DAY FROM (NOW() - ultimo_mensaje_recibido)) as dias_inactivo
FROM chatbot_config
WHERE deleted_at IS NULL
  AND activo = true
  AND ultimo_mensaje_recibido < NOW() - INTERVAL '30 days'
ORDER BY ultimo_mensaje_recibido ASC;
```

## 🧪 Testing

### Test de Constraint UNIQUE Parcial
```sql
-- Insertar chatbot Telegram (OK)
INSERT INTO chatbot_config (
  organizacion_id, nombre, plataforma, config_plataforma
) VALUES (
  1, 'Bot Telegram 1', 'telegram', '{"bot_token": "xxx"}'::jsonb
);

-- Intentar insertar segundo chatbot Telegram (FALLA)
INSERT INTO chatbot_config (
  organizacion_id, nombre, plataforma, config_plataforma
) VALUES (
  1, 'Bot Telegram 2', 'telegram', '{"bot_token": "yyy"}'::jsonb
);
-- ERROR: duplicate key value violates unique constraint "uq_chatbot_org_plataforma_active"
```

### Test de Soft Delete + Recreación
```sql
-- Soft delete del primer chatbot
UPDATE chatbot_config
SET deleted_at = NOW(), activo = false
WHERE id = 1;

-- Ahora SÍ se puede crear otro (UNIQUE excluye deleted_at IS NOT NULL)
INSERT INTO chatbot_config (
  organizacion_id, nombre, plataforma, config_plataforma
) VALUES (
  1, 'Bot Telegram Nuevo', 'telegram', '{"bot_token": "zzz"}'::jsonb
);
-- SUCCESS - UNIQUE constraint solo aplica a chatbots activos
```

### Test de RLS Multi-Tenant
```sql
-- Configurar tenant 1
SET rls.organizacion_id = '1';

-- Insertar chatbot org 1
INSERT INTO chatbot_config (organizacion_id, nombre, plataforma, config_plataforma)
VALUES (1, 'Bot Org 1', 'telegram', '{}'::jsonb);

-- Cambiar a tenant 2
SET rls.organizacion_id = '2';

-- Intentar ver chatbot de org 1 (NO VISIBLE)
SELECT COUNT(*) FROM chatbot_config WHERE nombre = 'Bot Org 1';
-- Resultado: 0 (RLS funciona correctamente)
```

## 🤖 Integración con n8n

### Flujo Completo de Creación

1. **Frontend**: Usuario configura chatbot Telegram
2. **Backend**: Crea registro en `chatbot_config`
3. **Backend**: Genera JWT multi-tenant
4. **Backend**: Crea credential httpHeaderAuth en n8n (MCP)
5. **Backend**: Crea credential telegramApi en n8n
6. **Backend**: Crea workflow desde template
7. **Backend**: Activa workflow en n8n
8. **Backend**: Actualiza `n8n_workflow_id` en `chatbot_config`
9. **n8n**: Chatbot listo para recibir mensajes

### Campos Sincronizados con n8n

| Campo BD | Campo n8n | Sincronización |
|----------|-----------|----------------|
| `activo` | `workflow.active` | Bidireccional |
| `n8n_workflow_id` | `workflow.id` | Unidireccional (n8n → BD) |
| `n8n_credential_id` | `credential.id` | Unidireccional (n8n → BD) |
| `ultimo_error` | `lastError.message` | Unidireccional (n8n → BD) |

## 📈 Métricas y Monitoreo

### Dashboard de Métricas
```sql
-- Métricas globales de chatbots
SELECT
  COUNT(*) as total_chatbots,
  COUNT(*) FILTER (WHERE activo = true) as activos,
  SUM(total_mensajes_procesados) as mensajes_totales,
  SUM(total_citas_creadas) as citas_totales,
  ROUND(AVG(total_mensajes_procesados), 2) as promedio_mensajes
FROM chatbot_config
WHERE deleted_at IS NULL;
```

### Tasa de Conversión (Mensajes → Citas)
```sql
SELECT
  plataforma,
  SUM(total_mensajes_procesados) as mensajes,
  SUM(total_citas_creadas) as citas,
  ROUND(
    100.0 * SUM(total_citas_creadas) / NULLIF(SUM(total_mensajes_procesados), 0),
    2
  ) as tasa_conversion_pct
FROM chatbot_config
WHERE deleted_at IS NULL
GROUP BY plataforma
ORDER BY tasa_conversion_pct DESC;
```

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ **NUNCA exponer** `mcp_jwt_token` en APIs públicas
- ✅ **Rotar JWT** periódicamente (recomendado: cada 90 días)
- ✅ **Validar origen** de webhooks n8n
- ✅ **Encriptar** tokens sensibles en `config_plataforma`

### Performance
- ✅ Índices parciales excluyen soft deletes
- ✅ JSONB indexado solo cuando necesario
- ✅ Métricas incrementales (no recalculadas)

### Mantenimiento
- ✅ **Soft delete** preserva historial y métricas
- ✅ **Limpieza periódica** de chatbots eliminados >6 meses
- ✅ **Monitoreo** de chatbots inactivos

## 🔧 Troubleshooting

### Chatbot No Recibe Mensajes
```sql
-- Verificar estado del chatbot
SELECT
  id, nombre, plataforma, activo,
  n8n_workflow_id, ultimo_error
FROM chatbot_config
WHERE id = 123;

-- Si activo = false → Activar en n8n
-- Si ultimo_error IS NOT NULL → Revisar logs n8n
-- Si n8n_workflow_id IS NULL → Workflow no creado
```

### Credential MCP No Funciona
```sql
-- Verificar JWT y credential
SELECT
  id, organizacion_id, mcp_credential_id,
  LENGTH(mcp_jwt_token) as jwt_length
FROM chatbot_config
WHERE id = 123;

-- Si mcp_jwt_token IS NULL → Regenerar JWT
-- Si mcp_credential_id IS NULL → Crear credential en n8n
```

## 📚 Referencias

- **n8n Docs:** https://docs.n8n.io/
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp
- **MCP Server:** Documentación interna del proyecto

---

**Versión:** 1.0.0
**Fecha:** 17 Noviembre 2025
**Estado:** ✅ Listo para Producción
**Plataformas:** 7 canales soportados
**Integración:** n8n + MCP Server + DeepSeek
