# 🚀 DEPLOYMENT GUÍA - MCP SERVER (FASE 6)

**Versión:** 2.0 - Multi-Tenant
**Fecha:** 23 Octubre 2025
**Tiempo Estimado:** 15 minutos

---

## 📋 PRE-REQUISITOS

✅ Sistema actual funcionando (Fase 5 completada)
✅ Docker y Docker Compose instalados
✅ Backend API operativo en puerto 3000
✅ PostgreSQL con datos de al menos 1 organización
✅ Schema SQL actualizado con columna `mcp_jwt_token` en `chatbot_config`

---

## 🎯 ARQUITECTURA MULTI-TENANT

**IMPORTANTE:** A partir de la versión 2.0, el MCP Server es **multi-tenant**:

- ✅ **No requiere token fijo en .env** (se eliminó `MCP_JWT_TOKEN`)
- ✅ **Cada chatbot tiene su propio token JWT** (generado automáticamente)
- ✅ **Token almacenado en BD** (`chatbot_config.mcp_jwt_token`)
- ✅ **Token pasado dinámicamente** (via Authorization header por request)
- ✅ **Aislamiento RLS automático** (cada token embebe `organizacion_id`)

### Flujo de Autenticación

```
1. Usuario crea chatbot → Backend genera token JWT único
2. Token se guarda en chatbot_config.mcp_jwt_token
3. Token se inyecta en workflow de n8n (header Authorization)
4. n8n llama MCP Server con token en cada request
5. MCP Server valida token y extrae organizacion_id
6. MCP Server llama Backend API con mismo token
7. Backend RLS filtra automáticamente por organizacion_id
```

**Beneficio:** Múltiples organizaciones pueden usar el mismo MCP Server sin conflictos.

---

## 🐳 PASO 1: CONSTRUIR E INICIAR MCP SERVER

```bash
# 1. Construir la imagen del MCP Server
docker-compose build mcp-server

# 2. Iniciar el contenedor
docker-compose up -d mcp-server

# 3. Verificar que esté corriendo
docker ps | grep mcp-server

# Salida esperada:
# mcp-server    Up 10 seconds (healthy)   0.0.0.0:3100->3100/tcp
```

---

## ✅ PASO 2: VERIFICAR HEALTH CHECK

```bash
# Verificar logs del contenedor
docker logs mcp-server

# Salida esperada:
# 🚀 MCP Server iniciado en puerto 3100
# 📍 Health check: http://localhost:3100/health
# 🔧 Herramientas disponibles: 4
# 🌍 Entorno: production
# 🔗 Backend API: http://back:3000

# Verificar health check
curl http://localhost:3100/health

# Salida esperada (JSON):
{
  "status": "healthy",
  "timestamp": "2025-10-23T...",
  "uptime": 10.5,
  "memory": {
    "used": 45,
    "total": 128,
    "unit": "MB"
  },
  "connections": {
    "backend": "connected"
  },
  "environment": "production"
}
```

**✅ Si `backend: "connected"` → Todo está funcionando correctamente!**

---

## 🔍 PASO 3: LISTAR HERRAMIENTAS DISPONIBLES

```bash
curl http://localhost:3100/mcp/tools

# Salida esperada:
{
  "tools": [
    {
      "name": "crearCita",
      "description": "Crea una nueva cita en el sistema de agendamiento...",
      "inputSchema": { ... }
    },
    {
      "name": "verificarDisponibilidad",
      "description": "Verifica los horarios disponibles...",
      "inputSchema": { ... }
    },
    {
      "name": "listarServicios",
      "description": "Lista todos los servicios activos...",
      "inputSchema": { ... }
    },
    {
      "name": "buscarCliente",
      "description": "Busca un cliente existente...",
      "inputSchema": { ... }
    }
  ],
  "total": 4
}
```

---

## 🧪 PASO 4: PROBAR HERRAMIENTAS (REQUIERE CHATBOT CON TOKEN)

**⚠️ IMPORTANTE:** Las herramientas MCP ahora requieren autenticación JWT.

Para probar directamente el MCP Server (sin n8n), necesitas obtener el token de un chatbot existente:

```bash
# 1. Obtener token JWT de un chatbot en la BD
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT id, nombre, LEFT(mcp_jwt_token, 50) || '...' as token_preview
   FROM chatbot_config
   WHERE organizacion_id = 1
   LIMIT 1;"

# Salida esperada:
#  id | nombre          | token_preview
# ----+-----------------+------------------------------------
#   1 | Bot Barbería    | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2...

# 2. Copiar el token completo (sin el LEFT, ejecutar query completa)
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT mcp_jwt_token FROM chatbot_config WHERE id = 1;"

# 3. Probar herramienta con el token
curl -X POST http://localhost:3100/mcp/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_COMPLETO_AQUI>" \
  -d '{
    "tool": "listarServicios",
    "arguments": {
      "activo": true
    }
  }'

# Salida esperada:
{
  "tool": "listarServicios",
  "success": true,
  "data": {
    "servicios": [
      {
        "id": 1,
        "nombre": "Corte de Cabello",
        "duracion_minutos": 30,
        "precio": 150,
        "activo": true,
        "profesionales": [...]
      }
    ],
    "total": 3
  },
  "message": "Se encontraron 3 servicios",
  "duration": "45ms"
}
```

**✅ Si obtienes servicios de tu organización → La integración funciona!**

**Nota:** Si no tienes chatbots creados aún, continúa con el Paso 5 para crear uno.

---

## 🤖 PASO 5: CREAR CHATBOT Y PROBAR CON TELEGRAM

Ahora que el MCP Server está funcionando, puedes crear un chatbot:

### 5.1 Desde el Frontend (Onboarding)

1. Ir a http://localhost:5173 (frontend)
2. Completar onboarding hasta el Step 7 (Telegram)
3. Configurar bot con token de @BotFather
4. El sistema automáticamente:
   - Genera token JWT único para este chatbot
   - Crea workflow en n8n desde template
   - Configura MCP Client Tools con Authorization header
   - Almacena token en `chatbot_config.mcp_jwt_token`

### 5.2 Verificar Workflow en n8n

1. Ir a http://localhost:5678 (n8n UI)
2. Abrir el workflow del chatbot creado
3. Verificar que los 3 nodos MCP Client estén configurados:
   - **MCP Client - Crear Cita** → `http://mcp-server:3100` → tool: `crearCita`
   - **MCP Client - Verificar Disponibilidad** → `http://mcp-server:3100` → tool: `verificarDisponibilidad`
   - **MCP Client - Listar Servicios** → `http://mcp-server:3100` → tool: `listarServicios`

4. **IMPORTANTE:** Verificar que cada nodo MCP Client tenga configurado el header:
   - En cada nodo → Options → Headers → `Authorization: Bearer <token-jwt>`
   - El token debe estar presente (agregado automáticamente por el controller)

### 5.3 Verificar Token en Base de Datos

```bash
# Verificar que el token fue almacenado correctamente
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT id, nombre, plataforma, estado,
          LENGTH(mcp_jwt_token) as token_length,
          mcp_jwt_token IS NOT NULL as has_token
   FROM chatbot_config
   WHERE organizacion_id = 1;"

# Salida esperada:
#  id | nombre       | plataforma | estado | token_length | has_token
# ----+--------------+------------+--------+--------------+-----------
#   1 | Bot Telegram | telegram   | activo |          543 | t
```

### 5.4 Probar con Telegram

1. Abrir Telegram y buscar tu bot
2. Enviar mensaje: "Hola"
3. El bot debería responder (IA conversacional)
4. Enviar: "¿Qué servicios ofrecen?"
   - **Esperado:** El AI Agent usa la tool `listarServicios` y responde con los servicios
5. Enviar: "Quiero agendar un corte para mañana a las 10am"
   - **Esperado:** El AI Agent:
     - Usa `verificarDisponibilidad` para verificar el horario
     - Usa `crearCita` para crear la cita
     - Responde con confirmación

---

## 📊 PASO 6: MONITOREO

### Ver logs en tiempo real

```bash
docker logs -f mcp-server
```

### Ver logs de una tool específica

```bash
docker logs mcp-server | grep "Ejecutando tool"

# Salida:
# Ejecutando tool: listarServicios - arguments: {"activo":true}
# Tool listarServicios ejecutado exitosamente - duration: 45ms
```

### Ver estadísticas de memoria

```bash
docker stats mcp-server

# Salida:
# CONTAINER    CPU %   MEM USAGE / LIMIT   MEM %
# mcp-server   0.5%    45MB / 512MB        8.8%
```

---

## 🛠️ TROUBLESHOOTING

### Problema 1: Backend no accesible

**Síntoma:**
```json
{
  "connections": {
    "backend": "disconnected"
  }
}
```

**Solución:**
```bash
# 1. Verificar que el backend esté corriendo
docker ps | grep back

# 2. Verificar red Docker
docker network inspect backend_network

# 3. Probar conectividad desde dentro del contenedor
docker exec mcp-server curl http://back:3000/health

# 4. Reiniciar MCP Server
docker-compose restart mcp-server
```

---

### Problema 2: JWT Token inválido o faltante

**Síntoma:**
```json
{
  "error": "Unauthorized",
  "message": "Token JWT no proporcionado. Header Authorization: Bearer <token> es requerido."
}
```

**Solución:**
```bash
# 1. Verificar que el chatbot tenga token en BD
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT id, nombre, mcp_jwt_token IS NOT NULL as has_token
   FROM chatbot_config WHERE id = 1;"

# 2. Si has_token = false, regenerar token para ese chatbot
# Opción A: Desde el backend con helper
docker exec back node -e "
const { generarTokenMCP } = require('./app/utils/mcpTokenGenerator');
const db = require('./app/database/db');
(async () => {
  const token = await generarTokenMCP(1); // organizacion_id
  await db.query(
    'UPDATE chatbot_config SET mcp_jwt_token = \$1 WHERE id = \$2',
    [token, 1]
  );
  console.log('Token regenerado:', token);
  process.exit(0);
})();
"

# 3. Actualizar workflow en n8n con el nuevo token
# (Ir a n8n UI y actualizar headers de nodos MCP Client)

# 4. No es necesario reiniciar MCP Server (tokens se validan por request)
```

**Nota Multi-Tenant:**
- Cada chatbot tiene su propio token
- Si un chatbot tiene error 401, solo afecta a ese chatbot
- Los demás chatbots siguen funcionando normalmente

---

### Problema 3: Herramienta no responde

**Síntoma:**
```
Error al ejecutar tool: timeout
```

**Solución:**
```bash
# 1. Verificar logs del backend
docker logs back | tail -50

# 2. Verificar que el endpoint exista
curl http://localhost:3000/api/v1/servicios \
  -H "Authorization: Bearer <token>"

# 3. Aumentar timeout en .env del MCP Server
# BACKEND_TIMEOUT=30000

# 4. Reiniciar
docker-compose restart mcp-server
```

---

### Problema 4: MCP Client en n8n no conecta

**Síntoma:** En n8n, el nodo MCP Client muestra error de conexión

**Solución:**
```bash
# 1. Verificar que MCP Server esté en la misma red que n8n
docker network inspect backend_network | grep -A 5 "mcp-server\|n8n-main"

# 2. Verificar URL en el nodo n8n:
# Debe ser: http://mcp-server:3100 (NO localhost:3100)

# 3. Probar desde n8n-main
docker exec n8n-main curl http://mcp-server:3100/health
```

---

## 📚 COMANDOS ÚTILES

```bash
# Reiniciar solo MCP Server
docker-compose restart mcp-server

# Ver logs de los últimos 100 líneas
docker logs --tail 100 mcp-server

# Entrar al contenedor
docker exec -it mcp-server sh

# Rebuild completo
docker-compose build --no-cache mcp-server
docker-compose up -d mcp-server

# Detener MCP Server
docker-compose stop mcp-server

# Eliminar contenedor y volumen
docker-compose down mcp-server
docker volume prune
```

---

## ✅ CHECKLIST DE DEPLOYMENT - MULTI-TENANT

**Infraestructura:**
- [ ] Schema SQL actualizado con columna `mcp_jwt_token` en `chatbot_config`
- [ ] MCP Server construido e iniciado
- [ ] Health check retorna `"backend": "connected"`
- [ ] Las 4 tools se listan correctamente

**Chatbot Individual:**
- [ ] Chatbot creado desde frontend (Step 7)
- [ ] Token JWT generado automáticamente para el chatbot
- [ ] Token almacenado en `chatbot_config.mcp_jwt_token` (verificar en BD)
- [ ] Workflow de chatbot creado con nodos MCP configurados
- [ ] Nodos MCP Client tienen header `Authorization: Bearer <token>`
- [ ] Chatbot en Telegram responde a mensajes
- [ ] AI Agent puede llamar a las tools (probar "¿qué servicios ofrecen?")
- [ ] Logs del MCP Server no muestran errores 401

**Multi-Tenant (Opcional - Validar con 2+ organizaciones):**
- [ ] Crear chatbot para Organización 1 → Verifica que solo ve sus datos
- [ ] Crear chatbot para Organización 2 → Verifica que solo ve sus datos
- [ ] Ambos chatbots funcionan simultáneamente sin conflictos
- [ ] RLS filtra correctamente por `organizacion_id` del token

---

## 🎯 PRÓXIMOS PASOS

Una vez que el MCP Server esté funcionando:

1. **Entrenar al AI Agent:**
   - Mejorar el system prompt para usar las tools correctamente
   - Agregar ejemplos de uso en el prompt

2. **Agregar herramienta `buscarCliente`:**
   - Actualmente el workflow tiene 3 tools
   - Puedes agregar un 4to nodo MCP Client para buscarCliente

3. **Monitoreo avanzado:**
   - Configurar alertas si el health check falla
   - Dashboards de métricas (Grafana + Prometheus)

4. **Expandir herramientas:**
   - `cancelarCita`
   - `reagendarCita`
   - `listarCitasCliente`

---

## 📞 SOPORTE

Si encuentras problemas:

1. Revisar logs: `docker logs mcp-server`
2. Verificar .env tiene todas las variables
3. Probar health check: `curl localhost:3100/health`
4. Consultar README del MCP Server: `backend/mcp-server/README.md`

---

## 🔄 MIGRACIÓN DESDE VERSIÓN 1.0 (TOKEN FIJO)

Si estás actualizando desde la versión 1.0 que usaba `MCP_JWT_TOKEN` fijo en `.env`:

### Cambios Requeridos

**1. Schema SQL:**
```sql
-- Ya incluido en 06-operations-tables.sql
ALTER TABLE chatbot_config
ADD COLUMN mcp_jwt_token TEXT;
```

**2. Eliminar token fijo del .env:**
```bash
# Editar .env y ELIMINAR esta línea:
# MCP_JWT_TOKEN=...  ← YA NO SE USA
```

**3. Regenerar tokens para chatbots existentes:**
```bash
# Para cada chatbot existente, generar token individual
docker exec back node -e "
const { generarTokenMCP } = require('./app/utils/mcpTokenGenerator');
const ChatbotConfigModel = require('./app/database/chatbot-config.model');
const db = require('./app/database/db');

(async () => {
  // Obtener todos los chatbots
  const result = await db.query('SELECT id, organizacion_id FROM chatbot_config');

  for (const chatbot of result.rows) {
    const token = await generarTokenMCP(chatbot.organizacion_id);
    await db.query(
      'UPDATE chatbot_config SET mcp_jwt_token = \$1 WHERE id = \$2',
      [token, chatbot.id]
    );
    console.log(\`✅ Token generado para chatbot ID: \${chatbot.id}\`);
  }

  console.log('✅ Migración completada!');
  process.exit(0);
})();
"
```

**4. Actualizar workflows en n8n:**
- Abrir cada workflow de chatbot en n8n UI
- Para cada nodo MCP Client:
  - Ir a Options → Headers
  - Agregar: `Authorization: Bearer <token-del-chatbot>`
  - Obtener token desde BD o regenerarlo

**5. Reiniciar MCP Server:**
```bash
docker-compose restart mcp-server
```

**6. Verificar:**
```bash
# Todos los chatbots deben tener token
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT id, nombre, organizacion_id,
          mcp_jwt_token IS NOT NULL as has_token
   FROM chatbot_config;"

# Todos deben mostrar has_token = t
```

---

**¡Felicidades! 🎉 Has completado la Fase 6 del sistema de chatbots con IA en modo Multi-Tenant.**

---

## 📚 RECURSOS ADICIONALES

- **Código fuente MCP Server:** `backend/mcp-server/`
- **Helper de tokens:** `backend/app/utils/mcpTokenGenerator.js`
- **Schema SQL:** `sql/schema/06-operations-tables.sql`
- **Plan de implementación:** `PLAN_IMPLEMENTACION_CHATBOTS.md`
- **Anexo técnico:** `ANEXO_CODIGO_CHATBOTS.md`
