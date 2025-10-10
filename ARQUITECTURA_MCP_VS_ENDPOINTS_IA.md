# 🏗️ Arquitectura: MCP Server vs Endpoints IA Dedicados

## 💡 Propuesta: MCP Server para Agente IA

### La Idea

**En lugar de**:
```
Agente IA → Endpoints /automatica (sin auth) → Backend
```

**Usar**:
```
Agente IA → MCP Server → Endpoints manuales (con auth) → Backend
```

---

## ✅ Ventajas de Usar MCP + Endpoints Manuales

### 1️⃣ **Elimina Duplicación de Código**

**Problema actual**: Dos endpoints para lo mismo

```javascript
// Manual
POST /api/v1/citas
- Requiere: cliente_id, profesional_id, fecha exacta, hora exacta

// IA
POST /api/v1/citas/automatica
- Requiere: telefono_cliente, servicio_id, fecha_solicitada, turno_preferido
- Hace: buscar/crear cliente, buscar profesional, buscar horario
```

**Con MCP**: Un solo endpoint + tools del agente

```javascript
// Solo un endpoint
POST /api/v1/citas

// El MCP server provee tools para:
- buscarClientePorTelefono(telefono)
- crearCliente(nombre, telefono, email)
- buscarServicioPorDescripcion(descripcion)
- buscarHorariosDisponibles(servicio_id, fecha, turno)
- crearCita(cliente_id, profesional_id, servicio_id, fecha, hora)
```

---

### 2️⃣ **Agente IA con Más Control y Contexto**

**Arquitectura actual** (IA ciega):
```
Cliente: "Necesito un corte mañana en la tarde"
    ↓
Agente extrae: servicio="corte", fecha="mañana", turno="tarde"
    ↓
POST /automatica → Backend decide todo
    ↓
Backend responde: "Cita a las 16:00 con Carlos"
    ↓
Agente: "Ok, te confirmé a las 16:00 con Carlos" (sin saber por qué)
```

**Con MCP** (IA informada):
```
Cliente: "Necesito un corte mañana en la tarde"
    ↓
Agente piensa: "Voy a buscar opciones"
    ↓
Tool: buscarHorariosDisponibles("corte", "mañana", "tarde")
    ↓
Response: [
  {hora: "14:00", profesional: "Carlos", disponible: true},
  {hora: "15:00", profesional: "Juan", disponible: true},
  {hora: "16:00", profesional: "Carlos", disponible: true}
]
    ↓
Agente al cliente: "Tengo disponible a las 14:00, 15:00 o 16:00.
                    Carlos está libre a las 14:00 y 16:00.
                    ¿Cuál prefieres?"
    ↓
Cliente: "A las 16:00 está bien"
    ↓
Tool: crearCita(cliente_id, carlos_id, corte_id, "mañana", "16:00")
    ↓
Agente: "Perfecto! Confirmado a las 16:00 con Carlos.
         Código: ORG001-20251010-001"
```

**Ventaja**: El agente puede **conversar** y **negociar** con el cliente en lugar de solo confirmar.

---

### 3️⃣ **Reutilización de Toda la API Existente**

Con MCP, el agente puede usar **TODOS** los endpoints:

```javascript
// El agente puede:
- Listar servicios disponibles
- Buscar profesionales por especialidad
- Ver historial de citas del cliente
- Consultar disponibilidad de múltiples días
- Modificar citas existentes
- Cancelar citas
- Confirmar asistencia
- Y cualquier endpoint futuro automáticamente
```

**Sin necesidad de crear endpoints especiales de IA para cada operación.**

---

### 4️⃣ **Autenticación Simplificada**

**Arquitectura actual**:
- Endpoints manual: JWT requerido
- Endpoints IA: Sin auth, validación manual de `organizacion_id`
- Problema: Dos flujos de seguridad diferentes

**Con MCP**:
- Un solo flujo: JWT para todo
- El MCP server se autentica como un "usuario bot"
- Toda la auditoría y RLS funciona normal
- Logs muestran: "creado_por: usuario_bot_whatsapp"

```javascript
// Crear usuario bot para cada organización
{
  "email": "bot.whatsapp@barberia.com",
  "rol": "bot",
  "organizacion_id": 1
}

// MCP server usa este usuario
const jwt = await login("bot.whatsapp@barberia.com", "password");

// Todas las llamadas usan ese JWT
headers: { "Authorization": `Bearer ${jwt}` }
```

---

## 🏗️ Diseño del MCP Server

### Estructura del MCP

```typescript
// mcp-server/tools.ts

export const tools = [
  {
    name: "buscar_cliente_por_telefono",
    description: "Busca un cliente existente por su número de teléfono",
    inputSchema: {
      type: "object",
      properties: {
        telefono: {
          type: "string",
          description: "Número de teléfono en formato internacional (+52...)"
        }
      },
      required: ["telefono"]
    }
  },

  {
    name: "crear_cliente",
    description: "Crea un nuevo cliente en el sistema",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        telefono: { type: "string" },
        email: { type: "string" }
      },
      required: ["nombre", "telefono"]
    }
  },

  {
    name: "buscar_servicios",
    description: "Busca servicios por descripción o categoría",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Descripción del servicio (ej: 'corte', 'barba', 'manicure')"
        }
      },
      required: ["query"]
    }
  },

  {
    name: "buscar_horarios_disponibles",
    description: "Busca horarios disponibles para un servicio en una fecha y turno",
    inputSchema: {
      type: "object",
      properties: {
        servicio_id: { type: "number" },
        fecha: {
          type: "string",
          description: "Fecha en formato YYYY-MM-DD"
        },
        turno: {
          type: "string",
          enum: ["mañana", "tarde", "noche", "cualquiera"],
          description: "Turno preferido"
        }
      },
      required: ["servicio_id", "fecha"]
    }
  },

  {
    name: "crear_cita",
    description: "Crea una nueva cita con datos específicos",
    inputSchema: {
      type: "object",
      properties: {
        cliente_id: { type: "number" },
        profesional_id: { type: "number" },
        servicio_id: { type: "number" },
        fecha_cita: { type: "string" },
        hora_inicio: { type: "string" },
        hora_fin: { type: "string" }
      },
      required: ["cliente_id", "profesional_id", "servicio_id", "fecha_cita", "hora_inicio", "hora_fin"]
    }
  },

  {
    name: "listar_citas_cliente",
    description: "Lista las citas de un cliente por teléfono",
    inputSchema: {
      type: "object",
      properties: {
        telefono: { type: "string" },
        estados: {
          type: "array",
          items: { type: "string" },
          description: "Estados de citas a incluir"
        }
      },
      required: ["telefono"]
    }
  },

  {
    name: "cancelar_cita",
    description: "Cancela una cita por código",
    inputSchema: {
      type: "object",
      properties: {
        codigo_cita: { type: "string" },
        motivo: { type: "string" }
      },
      required: ["codigo_cita"]
    }
  }
];
```

---

### Implementación del MCP Server

```typescript
// mcp-server/server.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api/v1";
let authToken: string | null = null;

// Autenticación al iniciar
async function authenticate() {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: process.env.BOT_EMAIL,
    password: process.env.BOT_PASSWORD
  });
  authToken = response.data.data.token;
}

// Helper para hacer requests autenticados
async function apiRequest(method: string, endpoint: string, data?: any) {
  if (!authToken) await authenticate();

  return axios({
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: { Authorization: `Bearer ${authToken}` },
    data
  });
}

// Implementación de tools
const toolHandlers = {

  async buscar_cliente_por_telefono({ telefono }: { telefono: string }) {
    try {
      // Usar endpoint de búsqueda de clientes
      const response = await apiRequest('GET', `/clientes/buscar-por-telefono?telefono=${encodeURIComponent(telefono)}`);

      if (response.data.success) {
        return {
          encontrado: true,
          cliente: response.data.data
        };
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { encontrado: false };
      }
      throw error;
    }
  },

  async crear_cliente({ nombre, telefono, email }: any) {
    const response = await apiRequest('POST', '/clientes', {
      nombre,
      telefono,
      email,
      activo: true
    });
    return response.data.data;
  },

  async buscar_servicios({ query }: { query: string }) {
    const response = await apiRequest('GET', '/servicios');
    const servicios = response.data.data.servicios;

    // Filtrar por query (simple)
    const filtrados = servicios.filter((s: any) =>
      s.nombre.toLowerCase().includes(query.toLowerCase()) ||
      s.descripcion?.toLowerCase().includes(query.toLowerCase())
    );

    return filtrados;
  },

  async buscar_horarios_disponibles({ servicio_id, fecha, turno = 'cualquiera' }: any) {
    // Aquí necesitarías un endpoint nuevo o usar uno existente
    // Opción 1: Crear endpoint GET /servicios/:id/disponibilidad
    // Opción 2: Buscar en horarios_disponibilidad directamente

    // Por ahora, simulado:
    const response = await apiRequest('GET', `/horarios/disponibilidad?servicio_id=${servicio_id}&fecha=${fecha}&turno=${turno}`);
    return response.data.data;
  },

  async crear_cita(params: any) {
    const response = await apiRequest('POST', '/citas', params);
    return response.data.data;
  },

  async listar_citas_cliente({ telefono, estados = ['pendiente', 'confirmada'] }: any) {
    // Primero buscar cliente
    const cliente = await toolHandlers.buscar_cliente_por_telefono({ telefono });
    if (!cliente.encontrado) {
      return { citas: [] };
    }

    // Luego listar sus citas
    const response = await apiRequest('GET', `/citas?cliente_id=${cliente.cliente.id}&estado=${estados.join(',')}`);
    return response.data.data;
  },

  async cancelar_cita({ codigo_cita, motivo }: any) {
    // Primero buscar cita por código
    const citasResponse = await apiRequest('GET', `/citas?busqueda=${codigo_cita}`);
    const cita = citasResponse.data.data.citas[0];

    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    // Cancelar (DELETE)
    await apiRequest('DELETE', `/citas/${cita.id}`);

    return { cancelada: true, codigo: codigo_cita };
  }
};

// Server MCP
const server = new Server(
  {
    name: "agendamiento-saas",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler("tools/list", async () => ({
  tools: tools
}));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolHandlers[name as keyof typeof toolHandlers];
  if (!handler) {
    throw new Error(`Tool not found: ${name}`);
  }

  const result = await handler(args as any);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
});

async function main() {
  await authenticate();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
```

---

## 🎨 Flujo Conversacional con MCP

### Ejemplo: Cliente solicita cita

```
Cliente: "Hola! Necesito un corte de cabello para mañana en la tarde"
    ↓
╔══════════════════════════════════════════════════════════╗
║  AGENTE IA (Claude con MCP tools)                        ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Pensamiento del agente:                                 ║
║  1. Necesito identificar al cliente                      ║
║  2. Necesito encontrar el servicio "corte de cabello"    ║
║  3. Necesito buscar horarios disponibles mañana tarde    ║
║  4. Necesito crear la cita                               ║
║                                                          ║
║  Ejecuta tools:                                          ║
║                                                          ║
║  🔧 buscar_cliente_por_telefono("+5215544332211")       ║
║     → { encontrado: false }                              ║
║                                                          ║
║  [Agente decide crear cliente]                           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    ↓
Agente → Cliente: "¡Hola! Veo que es tu primera vez con nosotros.
                   ¿Cómo te llamas?"
    ↓
Cliente: "Me llamo María"
    ↓
╔══════════════════════════════════════════════════════════╗
║  AGENTE IA                                               ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  🔧 crear_cliente({                                      ║
║       nombre: "María",                                   ║
║       telefono: "+5215544332211",                        ║
║       email: null                                        ║
║     })                                                   ║
║     → { id: 123, nombre: "María", ... }                  ║
║                                                          ║
║  🔧 buscar_servicios({ query: "corte de cabello" })     ║
║     → [                                                  ║
║         { id: 8, nombre: "Corte Premium", precio: 350 }, ║
║         { id: 9, nombre: "Corte Básico", precio: 200 }   ║
║       ]                                                  ║
║                                                          ║
║  [Agente decide preguntar cuál servicio]                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    ↓
Agente → Cliente: "Perfecto María! Tenemos:
                   - Corte Premium ($350)
                   - Corte Básico ($200)
                   ¿Cuál prefieres?"
    ↓
Cliente: "El premium está bien"
    ↓
╔══════════════════════════════════════════════════════════╗
║  AGENTE IA                                               ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  🔧 buscar_horarios_disponibles({                       ║
║       servicio_id: 8,                                    ║
║       fecha: "2025-10-10",                               ║
║       turno: "tarde"                                     ║
║     })                                                   ║
║     → [                                                  ║
║         {                                                ║
║           hora_inicio: "14:00",                          ║
║           hora_fin: "14:45",                             ║
║           profesional: "Carlos Martínez",                ║
║           profesional_id: 2                              ║
║         },                                               ║
║         {                                                ║
║           hora_inicio: "16:00",                          ║
║           hora_fin: "16:45",                             ║
║           profesional: "Juan López",                     ║
║           profesional_id: 3                              ║
║         }                                                ║
║       ]                                                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    ↓
Agente → Cliente: "Tengo disponible:
                   - 2:00 PM con Carlos Martínez
                   - 4:00 PM con Juan López
                   ¿Cuál te acomoda mejor?"
    ↓
Cliente: "A las 4 está perfecto"
    ↓
╔══════════════════════════════════════════════════════════╗
║  AGENTE IA                                               ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  🔧 crear_cita({                                         ║
║       cliente_id: 123,                                   ║
║       profesional_id: 3,                                 ║
║       servicio_id: 8,                                    ║
║       fecha_cita: "2025-10-10",                          ║
║       hora_inicio: "16:00:00",                           ║
║       hora_fin: "16:45:00"                               ║
║     })                                                   ║
║     → {                                                  ║
║         codigo_cita: "ORG001-20251010-001",              ║
║         estado: "pendiente",                             ║
║         ...                                              ║
║       }                                                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    ↓
Agente → Cliente: "¡Listo María! ✂️

                   Tu Corte Premium está confirmado:
                   📅 Mañana 10 de octubre
                   🕓 4:00 PM
                   👤 Con Juan López
                   💰 $350

                   📋 Código: ORG001-20251010-001

                   💡 Llega 5 min antes

                   ¿Necesitas algo más?"
```

---

## 📊 Comparación de Arquitecturas

| Aspecto | Endpoints IA Dedicados | MCP + Endpoints Manuales |
|---------|------------------------|--------------------------|
| **Duplicación de código** | ❌ Alta (2 endpoints por operación) | ✅ Baja (1 endpoint, tools reutilizables) |
| **Flexibilidad del agente** | ⚠️ Limitada (usa lo que tiene) | ✅ Total (puede usar cualquier endpoint) |
| **Conversación interactiva** | ❌ No (respuesta directa) | ✅ Sí (negociación con cliente) |
| **Autenticación** | ⚠️ Dual (JWT + validación manual) | ✅ Unificada (solo JWT) |
| **Auditoría** | ⚠️ Sin usuario identificado | ✅ Usuario bot registrado |
| **Complejidad backend** | ⚠️ Media (2 controllers) | ✅ Baja (1 controller) |
| **Complejidad n8n** | ⚠️ Media (prompt + HTTP) | ⚠️ Media (MCP config) |
| **Mantenimiento futuro** | ❌ Alto (2 lugares) | ✅ Bajo (1 lugar) |
| **Capacidad del agente** | ⚠️ Limitada a endpoints IA | ✅ Acceso a toda la API |

---

## 🎯 Recomendación

### ✅ **Usar MCP + Endpoints Manuales**

**Razones**:

1. **Menos código**: Eliminas ~400 líneas de código duplicado
2. **Más flexible**: El agente puede usar TODOS los endpoints
3. **Conversación real**: El agente puede negociar opciones con el cliente
4. **Mejor auditoría**: Usuario bot identificado en logs
5. **Futuro-proof**: Nuevos endpoints automáticamente disponibles para IA

### ⚠️ **Mantener un endpoint especial** (opcional)

Podrías mantener UN endpoint de conveniencia para crear citas que:
- Busca/crea cliente automáticamente
- Busca horario compatible
- Crea cita

Pero que el agente lo use como una tool MCP, no directamente.

---

## 🏗️ Arquitectura Recomendada

```
┌─────────────────────────────────────────────────────────┐
│  WhatsApp (Cliente)                                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Evolution API (Webhook)                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│  n8n Workflow                                           │
│  ────────────                                           │
│  ┌───────────────────────────────────────────────┐     │
│  │  Nodo: AI Agent (Claude)                      │     │
│  │  ───────────────────────                      │     │
│  │  Usa MCP tools:                               │     │
│  │  - buscar_cliente_por_telefono                │     │
│  │  - crear_cliente                              │     │
│  │  - buscar_servicios                           │     │
│  │  - buscar_horarios_disponibles                │     │
│  │  - crear_cita                                 │     │
│  │  - listar_citas_cliente                       │     │
│  │  - cancelar_cita                              │     │
│  └───────────────────┬───────────────────────────┘     │
│                      │                                  │
│                      ↓                                  │
│  ┌───────────────────────────────────────────────┐     │
│  │  MCP Server (agendamiento-saas)               │     │
│  │  ───────────────────────────────              │     │
│  │  - Autenticación como usuario bot             │     │
│  │  - Tools que llaman API REST                  │     │
│  └───────────────────┬───────────────────────────┘     │
└────────────────────────┼────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Backend API (Express + PostgreSQL)                     │
│  ─────────────────────────────────                      │
│  Endpoints Manuales (protegidos con JWT):               │
│  - POST   /api/v1/clientes                              │
│  - GET    /api/v1/clientes/buscar-por-telefono          │
│  - GET    /api/v1/servicios                             │
│  - GET    /api/v1/horarios/disponibilidad               │
│  - POST   /api/v1/citas                                 │
│  - GET    /api/v1/citas                                 │
│  - DELETE /api/v1/citas/:id                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Plan de Migración

### Fase 1: Crear MCP Server

1. Crear proyecto MCP:
```bash
mkdir mcp-agendamiento
cd mcp-agendamiento
npm init -y
npm install @modelcontextprotocol/sdk axios dotenv
```

2. Implementar tools básicos:
   - buscar_cliente_por_telefono
   - crear_cliente
   - buscar_servicios
   - crear_cita

3. Probar en n8n

### Fase 2: Agregar Endpoints Faltantes

1. Crear endpoint `GET /horarios/disponibilidad`
2. Modificar `GET /clientes/buscar-por-telefono` (si no existe)

### Fase 3: Migrar Flujo IA a MCP

1. Configurar MCP en n8n
2. Reemplazar nodos HTTP por AI Agent con MCP
3. Probar flujo completo

### Fase 4: Deprecar Endpoints IA (opcional)

1. Marcar endpoints `/automatica` como deprecated
2. Mantener por compatibilidad
3. Eventualmente eliminar

---

## 🎯 Conclusión

**SÍ, tu idea es EXCELENTE** y es la arquitectura más limpia y mantenible.

**Ventajas clave**:
- ✅ Menos código duplicado
- ✅ Agente más inteligente (puede negociar)
- ✅ Una sola fuente de verdad
- ✅ Mejor auditoría
- ✅ Más flexible para futuro

**Único requisito nuevo**:
- Crear usuario bot por organización
- Implementar MCP server
- Posiblemente agregar endpoint de disponibilidad de horarios

**¿Quieres que te ayude a implementar el MCP server y configurarlo en n8n?**
