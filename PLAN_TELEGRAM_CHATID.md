# Plan: Usar Telegram chat_id como Identificador Principal (SIMPLIFICADO)

**Fecha:** 2025-11-05 (Actualizado)
**Objetivo:** Eliminar la necesidad de pedir número de teléfono al usuario, usando el `telegram_chat_id` como identificador único.

---

## 🎯 Problema Actual

1. **Telegram** NO proporciona el número de teléfono del usuario (solo `chat_id`)
2. El bot **pide teléfono manualmente** → mala UX
3. **Riesgo de error**: Usuario puede escribir mal su teléfono
4. **No podemos enviar recordatorios** si el teléfono está mal

---

## 💡 Descubrimiento Clave

**Los workflows YA tienen el identificador correcto:**

- **Telegram**: `sender = "1700200086"` (chat_id de Telegram)
- **WhatsApp**: `sender = "5215512345678"` (número de teléfono WhatsApp)

**NO necesitamos modificar las plantillas de n8n.** El campo `sender` ya contiene exactamente lo que necesitamos.

---

## ✅ Solución Simplificada

### Estrategia
1. Agregar campos `telegram_chat_id` y `whatsapp_phone` a tabla `clientes`
2. Modificar MCP tools para aceptar `sender` y **detectar automáticamente** la plataforma
3. Actualizar system prompt para NO pedir teléfono

### Detección Automática de Plataforma

**Basado en el formato de `sender`:**

| Plataforma | Formato `sender` | Ejemplo | Detección |
|------------|------------------|---------|-----------|
| Telegram | Número de 9-10 dígitos | `"1700200086"` | `sender.length <= 10` |
| WhatsApp | Número de 12-15 dígitos (código país + número) | `"5215512345678"` | `sender.length >= 11` |

**Lógica:**
```javascript
function detectPlatform(sender) {
  if (!sender) return null;

  // Telegram chat_id: normalmente 9-10 dígitos
  if (sender.length <= 10 && /^\d+$/.test(sender)) {
    return 'telegram';
  }

  // WhatsApp: 11-15 dígitos (código país + número)
  if (sender.length >= 11 && sender.length <= 15 && /^\d+$/.test(sender)) {
    return 'whatsapp';
  }

  return null;
}
```

---

## 📋 Cambios Necesarios

### 1. Base de Datos (SQL Schema)

**Archivo:** `sql/schema/05-business-tables.sql`

**Modificar tabla `clientes`:**

```sql
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),

    -- 🆕 NUEVOS CAMPOS para identificadores de plataforma
    telegram_chat_id VARCHAR(50),           -- ID de Telegram (ej: "1700200086")
    whatsapp_phone VARCHAR(50),             -- Teléfono WhatsApp (ej: "5215512345678")

    -- ✅ MODIFICADO: telefono ahora es completamente OPCIONAL
    telefono VARCHAR(20),                   -- Teléfono tradicional (OPCIONAL)

    fecha_nacimiento DATE,
    profesional_preferido_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
    notas_especiales TEXT,
    alergias TEXT,
    direccion TEXT,
    como_conocio VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    marketing_permitido BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 🆕 CONSTRAINTS: Índices únicos por organización
    CONSTRAINT unique_telegram_por_org UNIQUE (organizacion_id, telegram_chat_id),
    CONSTRAINT unique_whatsapp_por_org UNIQUE (organizacion_id, whatsapp_phone)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_clientes_telegram ON clientes(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX idx_clientes_whatsapp ON clientes(whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN clientes.telegram_chat_id IS 'Chat ID de Telegram del cliente (ej: "1700200086"). Obtenido automáticamente del campo sender del workflow.';
COMMENT ON COLUMN clientes.whatsapp_phone IS 'Número de teléfono WhatsApp en formato internacional (ej: "5215512345678"). Obtenido automáticamente del campo sender del workflow.';
COMMENT ON COLUMN clientes.telefono IS 'Teléfono tradicional (OPCIONAL). Solo si el negocio necesita llamar al cliente.';
```

---

### 2. MCP Server Tools

#### 2.1. Modificar `buscarCliente`

**Archivo:** `mcp-server/src/tools/buscarCliente.js`

**Cambios:**

```javascript
const schema = {
    busqueda: { type: 'string', required: true },
    tipo: {
        type: 'string',
        enum: ['telefono', 'nombre', 'telegram_chat_id', 'whatsapp_phone', 'auto'],
        default: 'auto'
    },
    // 🆕 NUEVO: sender del workflow (opcional)
    sender: { type: 'string' }
};

async function execute({ busqueda, tipo, sender }, { organizacionId, db }) {
    // Si tenemos sender, detectar plataforma automáticamente
    let searchField = tipo;
    let searchValue = busqueda;

    if (sender && tipo === 'auto') {
        const platform = detectPlatform(sender);

        if (platform === 'telegram') {
            searchField = 'telegram_chat_id';
            searchValue = sender;
        } else if (platform === 'whatsapp') {
            searchField = 'whatsapp_phone';
            searchValue = sender;
        }
    }

    // Construir query según el campo de búsqueda
    let query;
    let params;

    switch (searchField) {
        case 'telegram_chat_id':
            query = 'SELECT * FROM clientes WHERE organizacion_id = $1 AND telegram_chat_id = $2 AND activo = true';
            params = [organizacionId, searchValue];
            break;

        case 'whatsapp_phone':
            query = 'SELECT * FROM clientes WHERE organizacion_id = $1 AND whatsapp_phone = $2 AND activo = true';
            params = [organizacionId, searchValue];
            break;

        case 'telefono':
            // Normalizar teléfono (quitar espacios, guiones, etc)
            const telefonoNormalizado = searchValue.replace(/\D/g, '');
            query = 'SELECT * FROM clientes WHERE organizacion_id = $1 AND telefono LIKE $2 AND activo = true';
            params = [organizacionId, `%${telefonoNormalizado}%`];
            break;

        case 'nombre':
        default:
            // Búsqueda fuzzy por nombre (trigram similarity)
            query = `
                SELECT *, similarity(nombre, $2) as sim
                FROM clientes
                WHERE organizacion_id = $1
                  AND activo = true
                  AND similarity(nombre, $2) > 0.3
                ORDER BY sim DESC
                LIMIT 10
            `;
            params = [organizacionId, searchValue];
            break;
    }

    const result = await db.query(query, params);
    return result.rows;
}

// Función helper para detectar plataforma
function detectPlatform(sender) {
    if (!sender || typeof sender !== 'string') return null;

    // Solo dígitos
    if (!/^\d+$/.test(sender)) return null;

    // Telegram: 9-10 dígitos típicamente
    if (sender.length <= 10) return 'telegram';

    // WhatsApp: 11-15 dígitos (código país + número)
    if (sender.length >= 11 && sender.length <= 15) return 'whatsapp';

    return null;
}
```

---

#### 2.2. Modificar `buscarCitasCliente`

**Archivo:** `mcp-server/src/tools/buscarCitasCliente.js`

**Cambios:**

```javascript
const schema = {
    // ❌ ANTES: telefono era REQUERIDO
    // telefono: { type: 'string', required: true }

    // ✅ AHORA: Múltiples opciones (una requerida)
    telefono: { type: 'string' },
    telegram_chat_id: { type: 'string' },
    whatsapp_phone: { type: 'string' },

    // 🆕 NUEVO: sender del workflow (automático)
    sender: { type: 'string' },

    // Filtros opcionales
    estado: { type: 'string' },
    incluir_pasadas: { type: 'boolean', default: false }
};

async function execute({ telefono, telegram_chat_id, whatsapp_phone, sender, estado, incluir_pasadas }, { organizacionId, db }) {
    // 1. Detectar plataforma automáticamente si tenemos sender
    let searchField;
    let searchValue;

    if (sender) {
        const platform = detectPlatform(sender);

        if (platform === 'telegram') {
            searchField = 'telegram_chat_id';
            searchValue = sender;
        } else if (platform === 'whatsapp') {
            searchField = 'whatsapp_phone';
            searchValue = sender;
        }
    } else if (telegram_chat_id) {
        searchField = 'telegram_chat_id';
        searchValue = telegram_chat_id;
    } else if (whatsapp_phone) {
        searchField = 'whatsapp_phone';
        searchValue = whatsapp_phone;
    } else if (telefono) {
        searchField = 'telefono';
        searchValue = telefono;
    } else {
        throw new Error('Debe proporcionar sender, telegram_chat_id, whatsapp_phone o telefono');
    }

    // 2. Buscar cliente
    const clienteQuery = `
        SELECT id, nombre
        FROM clientes
        WHERE organizacion_id = $1
          AND ${searchField} = $2
          AND activo = true
    `;

    const clienteResult = await db.query(clienteQuery, [organizacionId, searchValue]);

    if (clienteResult.rows.length === 0) {
        return {
            success: false,
            message: 'No se encontró cliente con ese identificador'
        };
    }

    const cliente = clienteResult.rows[0];

    // 3. Buscar citas del cliente
    let citasQuery = `
        SELECT
            c.id as cita_id,
            c.codigo_cita,
            c.fecha,
            c.hora,
            c.estado,
            c.notas,
            p.nombre as profesional_nombre,
            array_agg(s.nombre) as servicios,
            CASE
                WHEN c.estado IN ('pendiente', 'confirmada') THEN true
                ELSE false
            END as puede_reagendar
        FROM citas c
        JOIN profesionales p ON c.profesional_id = p.id
        JOIN citas_servicios cs ON c.id = cs.cita_id
        JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.cliente_id = $1
          AND c.organizacion_id = $2
    `;

    const params = [cliente.id, organizacionId];

    // Filtrar por estado si se especifica
    if (estado) {
        citasQuery += ` AND c.estado = $${params.length + 1}`;
        params.push(estado);
    }

    // Filtrar por fecha (solo futuras por defecto)
    if (!incluir_pasadas) {
        citasQuery += ` AND c.fecha >= CURRENT_DATE`;
    }

    citasQuery += `
        GROUP BY c.id, c.codigo_cita, c.fecha, c.hora, c.estado, c.notas, p.nombre
        ORDER BY c.fecha, c.hora
    `;

    const citasResult = await db.query(citasQuery, params);

    return {
        success: true,
        cliente: cliente.nombre,
        citas: citasResult.rows,
        total: citasResult.rows.length
    };
}

// Función helper (misma que en buscarCliente)
function detectPlatform(sender) {
    if (!sender || typeof sender !== 'string') return null;
    if (!/^\d+$/.test(sender)) return null;
    if (sender.length <= 10) return 'telegram';
    if (sender.length >= 11 && sender.length <= 15) return 'whatsapp';
    return null;
}
```

---

#### 2.3. Modificar `crearCita`

**Archivo:** `mcp-server/src/tools/crearCita.js`

**Cambios:**

```javascript
const schema = {
    fecha: { type: 'string', required: true, pattern: '^\\d{2}/\\d{2}/\\d{4}$' },
    hora: { type: 'string', required: true, pattern: '^\\d{2}:\\d{2}$' },
    profesional_id: { type: 'number', required: true },
    servicios_ids: { type: 'array', items: { type: 'number' }, minItems: 1, maxItems: 10, required: true },

    cliente: {
        type: 'object',
        properties: {
            nombre: { type: 'string', required: true },
            // ❌ ANTES: telefono era REQUERIDO
            // telefono: { type: 'string', required: true },

            // ✅ AHORA: telefono es OPCIONAL
            telefono: { type: 'string' },
            email: { type: 'string' }
        },
        required: ['nombre']
    },

    // 🆕 NUEVO: sender del workflow (automático)
    sender: { type: 'string' },

    notas: { type: 'string' }
};

async function execute({ fecha, hora, profesional_id, servicios_ids, cliente, sender, notas }, { organizacionId, db }) {
    // ... validaciones de fecha, hora, servicios ...

    // 1. Detectar plataforma del sender
    const platform = sender ? detectPlatform(sender) : null;

    // 2. Buscar cliente existente (por sender si está disponible, sino por teléfono)
    let clienteExistente;

    if (sender && platform) {
        const searchField = platform === 'telegram' ? 'telegram_chat_id' : 'whatsapp_phone';

        const query = `
            SELECT * FROM clientes
            WHERE organizacion_id = $1
              AND ${searchField} = $2
              AND activo = true
        `;

        const result = await db.query(query, [organizacionId, sender]);
        clienteExistente = result.rows[0];
    } else if (cliente.telefono) {
        // Fallback: buscar por teléfono tradicional
        const query = `
            SELECT * FROM clientes
            WHERE organizacion_id = $1
              AND telefono = $2
              AND activo = true
        `;

        const result = await db.query(query, [organizacionId, cliente.telefono]);
        clienteExistente = result.rows[0];
    }

    let clienteId;

    // 3. Crear cliente si no existe
    if (!clienteExistente) {
        const clienteData = {
            organizacion_id: organizacionId,
            nombre: cliente.nombre,
            email: cliente.email || null,
            telefono: cliente.telefono || null,

            // 🆕 Registrar identificador de plataforma automáticamente
            telegram_chat_id: platform === 'telegram' ? sender : null,
            whatsapp_phone: platform === 'whatsapp' ? sender : null
        };

        const insertQuery = `
            INSERT INTO clientes (
                organizacion_id, nombre, email, telefono,
                telegram_chat_id, whatsapp_phone
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;

        const result = await db.query(insertQuery, [
            clienteData.organizacion_id,
            clienteData.nombre,
            clienteData.email,
            clienteData.telefono,
            clienteData.telegram_chat_id,
            clienteData.whatsapp_phone
        ]);

        clienteId = result.rows[0].id;

        logger.info(`✅ Cliente creado automáticamente: ${clienteId} - ${cliente.nombre} (${platform || 'telefono'})`);
    } else {
        clienteId = clienteExistente.id;
        logger.info(`✅ Cliente encontrado: ${clienteId} - ${clienteExistente.nombre}`);
    }

    // 4. Crear cita (resto del código igual)
    // ...
}

// Función helper
function detectPlatform(sender) {
    if (!sender || typeof sender !== 'string') return null;
    if (!/^\d+$/.test(sender)) return null;
    if (sender.length <= 10) return 'telegram';
    if (sender.length >= 11 && sender.length <= 15) return 'whatsapp';
    return null;
}
```

---

### 3. System Prompt

**Archivo:** `backend/app/controllers/chatbot.controller.js` (método `_generarSystemPrompt`)

**Cambios en flujo de agendamiento:**

```markdown
**PASO 2: RECOPILAR INFORMACIÓN DEL HORARIO DESEADO** ⚠️ CRÍTICO
- Servicio deseado (ya obtenido en Paso 1)
- Fecha preferida (OBLIGATORIO)
- Hora preferida (OBLIGATORIO)
- Profesional preferido (OPCIONAL)

⚠️ NO PIDAS TELÉFONO - Ya tengo tu identificador de Telegram/WhatsApp automáticamente
⚠️ SOLO PEDIRÉ TU NOMBRE cuando confirme que hay disponibilidad

**PASO 3: USA "verificarDisponibilidad" INMEDIATAMENTE** ⚠️ CRÍTICO
[... resto igual ...]

Si el horario NO está disponible:
  ❌ NO pidas nombre ni teléfono
  ❌ Informa que ese horario está ocupado
  ✅ Sugiere 2-3 horarios alternativos
  ✅ Espera a que el cliente elija un horario disponible

Si el horario SÍ está disponible:
  ✅ Confirma que el horario está libre
  ✅ Procede al PASO 4

**PASO 4: AHORA SÍ, PIDE SOLO EL NOMBRE** ⚠️ SOLO SI HAY DISPONIBILIDAD
- Nombre completo del cliente (OBLIGATORIO)

⚠️ IMPORTANTE:
- NO pidas número de teléfono - Ya lo tengo automáticamente de Telegram/WhatsApp
- Solo necesito tu NOMBRE para crear la cita
- El sistema registrará automáticamente tu identificador de plataforma

**PASO 5: USA "crearCita"**
- Solo cuando tengas NOMBRE y el horario esté CONFIRMADO disponible
- Proporciona todos los parámetros requeridos
- El sistema asociará automáticamente tu chat_id de Telegram/WhatsApp
- Informa al cliente el código de cita generado
```

**Cambios en flujo de reagendamiento:**

```markdown
**PASO 1: USA "buscarCitasCliente" AUTOMÁTICAMENTE** ⚠️ CRÍTICO
- NO pidas teléfono ni ningún identificador al cliente
- El sistema buscará automáticamente sus citas usando su chat_id de Telegram/WhatsApp
- Llama a buscarCitasCliente sin parámetros (el sistema usa tu identificador automáticamente)
- Muestra TODAS las citas reagendables que encuentres

⚠️ IMPORTANTE:
- NUNCA preguntes "¿Cuál es tu teléfono?" para reagendar
- Ya tengo tu identificador de Telegram/WhatsApp
- Solo busca las citas directamente

**PASO 2: CLIENTE SELECCIONA QUÉ CITA CAMBIAR**
[... resto igual ...]
```

---

### 4. Workflows n8n

**✅ NO REQUIERE CAMBIOS**

Los workflows actuales YA están pasando el campo `sender` correctamente:

**Telegram** (`plantilla.json`):
```json
{
  "name": "sender",
  "value": "={{ $json.message.from.id }}",
  "type": "string"
}
```

**WhatsApp** (`plantilla-whatsapp.json`):
```json
{
  "name": "sender",
  "value": "={{ $json.entry[0].changes[0].value.messages[0].from }}",
  "type": "string"
}
```

Los MCP tools ahora aceptarán `sender` automáticamente del contexto del workflow.

---

## 🧪 Testing

### Escenario 1: Agendamiento nuevo (Telegram)

**Input usuario:** "Hola, quiero una cita de corte para mañana a las 3pm"

**Flujo esperado:**
1. Bot lista servicios
2. Bot verifica disponibilidad (15:00 disponible)
3. Bot pide SOLO nombre: "¿Cuál es tu nombre completo?"
4. Usuario: "Juan Pérez"
5. Bot crea cita con:
   - `nombre: "Juan Pérez"`
   - `telegram_chat_id: "1700200086"` (del `sender` automático)
   - `telefono: NULL`
6. ✅ Cita creada exitosamente

### Escenario 2: Reagendamiento (Telegram)

**Input usuario:** "Quiero reagendar mi cita para el viernes a las 2pm"

**Flujo esperado:**
1. Bot busca citas con `sender: "1700200086"` (automático)
2. Bot detecta plataforma: `telegram` → busca por `telegram_chat_id`
3. Bot muestra citas encontradas
4. Usuario selecciona cita
5. Bot verifica disponibilidad para viernes 14:00
6. Bot reagenda directamente (sin pedir datos)
7. ✅ Cita reagendada exitosamente

### Escenario 3: Cliente existente regresa (WhatsApp)

**Input usuario:** "Hola, quiero otra cita"

**Flujo esperado:**
1. Bot recibe `sender: "5215512345678"`
2. Bot detecta plataforma: `whatsapp` (11+ dígitos)
3. Bot busca cliente con `whatsapp_phone: "5215512345678"`
4. Cliente encontrado: "María González"
5. Bot saluda: "¡Hola María! ¿Qué servicio necesitas?"
6. ✅ Experiencia personalizada sin pedir nombre

---

## 🚀 Orden de Implementación

1. ✅ **Base de datos** (modificar `05-business-tables.sql`)
   - Agregar `telegram_chat_id` y `whatsapp_phone`
   - Crear índices únicos
   - Hacer `telefono` completamente opcional

2. ✅ **MCP tools** (3 archivos)
   - Agregar función `detectPlatform(sender)` en cada tool
   - Modificar `buscarCliente.js` para aceptar `sender`
   - Modificar `buscarCitasCliente.js` para usar `sender` automático
   - Modificar `crearCita.js` para registrar `telegram_chat_id`/`whatsapp_phone`

3. ✅ **System prompt** (chatbot.controller.js)
   - Actualizar flujo de agendamiento (no pedir teléfono)
   - Actualizar flujo de reagendamiento (búsqueda automática)

4. ✅ **Testing** (probar escenarios completos)
   - Agendamiento nuevo Telegram
   - Reagendamiento Telegram
   - Agendamiento WhatsApp
   - Cliente existente

---

## ✅ Resultado Final

### Experiencia Usuario (Telegram)
```
Usuario: "Hola, quiero una cita de corte mañana a las 3pm"
Bot: "✅ Perfecto, hay disponibilidad. ¿Cuál es tu nombre completo?"
Usuario: "Juan Pérez"
Bot: "✅ ¡Listo! Tu cita está confirmada para mañana a las 15:00"
```

### Experiencia Usuario (Reagendamiento)
```
Usuario: "Quiero cambiar mi cita para el viernes a las 2pm"
Bot: [busca automáticamente con sender]
Bot: "Encontré tu cita: Corte el 06/11 a las 14:00"
Bot: "✅ ¡Disponibilidad confirmada para viernes 07/11 a las 14:00!"
Usuario: "Perfecto"
Bot: "✅ ¡Cita reagendada exitosamente!"
```

**Sin pedir teléfono en ningún momento** 🎉

---

## 📊 Resumen de Cambios

| Componente | Cambios | Complejidad |
|------------|---------|-------------|
| Base de datos | +2 columnas, +2 índices | Baja |
| MCP tools | +1 función helper, modificar 3 tools | Media |
| System prompt | Actualizar instrucciones | Baja |
| Workflows n8n | **Sin cambios** ✅ | Ninguna |

**Total: ~100 líneas de código**
**Impacto: Elimina completamente la necesidad de pedir teléfono** 🎉
