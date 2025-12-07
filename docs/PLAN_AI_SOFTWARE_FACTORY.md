# AI Software Factory

**Actualizado**: 7 Diciembre 2025
**Estado**: Fase 1 Completa (Cipher/Qdrant)

---

## Concepto

Herramienta **interna** de desarrollo automatizado:

- **Claude Code (Opus)**: Arquitecto → analiza, descompone, crea tickets
- **Qwen Coder (Local)**: Implementador → escribe código, ejecuta tests
- **Cipher (Qdrant)**: Memoria → patrones, contexto, aprendizajes
- **Nexo Backend**: Coordinador → tickets, estados, webhooks

> **Nota**: Esto NO es un módulo para usuarios de Nexo. Es herramienta de desarrollo.

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────────┐
│                      CLAUDE CODE (Opus 4.5)                         │
│                         "Arquitecto"                                │
│                                                                     │
│  Tú: "Necesito feature X"                                          │
│           │                                                         │
│           ├── Consulta Cipher (patrones, contexto)                 │
│           ├── Analiza código existente                              │
│           ├── Descompone en tickets atómicos                        │
│           └── POST /api/factory/tickets                             │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                      NEXO BACKEND (API)                             │
│                       "Coordinador"                                 │
│                                                                     │
│  - Persiste ticket en PostgreSQL (schema: factory)                 │
│  - Dispara webhook al Qwen Agent                                   │
│  - Trackea: estado, intentos, resultados                           │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                   QWEN CODER AGENT (RTX 5070 Ti)                    │
│                       "Implementador"                               │
│                                                                     │
│  Recibe ticket completo:                                           │
│  ├── Descripción técnica                                           │
│  ├── Archivos a modificar                                          │
│  ├── Patrones obligatorios                                         │
│  └── Contexto pre-cargado                                          │
│           │                                                         │
│           ├── git pull proyecto                                     │
│           ├── Implementa código                                     │
│           ├── Ejecuta tests                                         │
│           ├── Si falla → reintenta (máx 3)                         │
│           ├── Si pasa → commit + push                              │
│           ├── Actualiza ticket (completed/failed)                  │
│           └── Guarda aprendizajes en Cipher                        │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE (Revisión)                           │
│                                                                     │
│  - Revisa código generado                                          │
│  - Merge a main o solicita ajustes                                 │
└────────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Componente | Tecnología | Ubicación |
|------------|------------|-----------|
| Claude Code | Opus 4.5 | API Anthropic |
| Qwen Coder | 2.5 Coder 14B/32B | Local (Ollama + RTX 5070 Ti) |
| Cipher | Qdrant + nomic-embed-text | Docker local |
| Backend API | Express + PostgreSQL | Docker local |
| Orquestación | Webhooks / n8n | Docker local |

---

## Fases

### Fase 1: Infraestructura Cipher ✅ COMPLETADA

- [x] Qdrant corriendo (puerto 6333)
- [x] Ollama con nomic-embed-text (768 dim)
- [x] Cipher MCP conectado a Claude Code
- [x] Script init-cipher-memory.sh
- [x] Variables en .env

### Fase 2: API Factory (Backend)

**Objetivo**: Endpoints para gestionar tickets

```
backend/app/modules/factory/
├── controllers/tickets.controller.js
├── models/tickets.model.js
├── routes/factory.routes.js
└── services/webhook.service.js
```

**Endpoints**:
```
POST   /api/factory/tickets      → Crear ticket
GET    /api/factory/tickets/:id  → Obtener ticket + resultado
PATCH  /api/factory/tickets/:id  → Actualizar estado
GET    /api/factory/tickets      → Listar (con filtros)
```

**Tabla**:
```sql
CREATE SCHEMA IF NOT EXISTS factory;

CREATE TABLE factory.dev_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Definición (Claude lo genera)
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'feature',
    prioridad INTEGER DEFAULT 3,
    archivos_modificar TEXT[],
    archivos_referencia TEXT[],
    patrones_obligatorios TEXT[],
    contexto_cipher TEXT,
    tests_requeridos TEXT[],

    -- Estado
    estado VARCHAR(50) DEFAULT 'pending',
    intentos INTEGER DEFAULT 0,

    -- Resultado (Qwen lo genera)
    branch_name VARCHAR(100),
    codigo_generado JSONB,
    tests_resultado JSONB,
    error_mensaje TEXT,

    -- Timestamps
    creado_en TIMESTAMP DEFAULT NOW(),
    iniciado_en TIMESTAMP,
    completado_en TIMESTAMP
);
```

**Tareas**:
- [ ] Crear schema y tabla
- [ ] Implementar CRUD
- [ ] Webhook a Qwen Agent

### Fase 3: Qwen Agent Local

**Objetivo**: Agente que implementa tickets en tu GPU

**Infraestructura**:
```bash
# Instalar modelo
ollama pull qwen2.5-coder:14b

# O versión más potente (cuantizada)
ollama pull qwen2.5-coder:32b-q4_K_M
```

**Componentes**:
```
tools/qwen-agent/
├── agent.js              # Loop principal
├── tools/
│   ├── git.js            # clone, pull, commit, push
│   ├── files.js          # read, write, search
│   ├── tests.js          # npm test, parse results
│   └── cipher.js         # consultar/guardar memoria
├── prompts/
│   └── implementer.md    # System prompt para Qwen
└── config.yml
```

**Flujo del agente**:
```
1. Recibe ticket (webhook o polling)
2. git pull proyecto
3. Lee archivos indicados
4. Genera código (usando contexto del ticket)
5. Escribe archivos
6. npm test
7. Si falla → analiza error, reintenta
8. Si pasa → git commit + push
9. PATCH /api/factory/tickets/:id (resultado)
10. Guarda aprendizajes en Cipher
```

**Tareas**:
- [ ] Instalar qwen2.5-coder en Ollama
- [ ] Crear estructura tools/qwen-agent/
- [ ] Implementar tools (git, files, tests)
- [ ] Implementar loop del agente
- [ ] Conectar con Cipher
- [ ] Probar flujo completo

### Fase 4: Integración Claude Code

**Objetivo**: Flujo seamless desde Claude Code

**Slash command** `.claude/commands/factory.md`:
```markdown
Analiza el siguiente requerimiento y crea tickets para la AI Factory:

$ARGUMENTS

Para cada ticket:
1. Consulta Cipher para contexto del proyecto
2. Identifica archivos a modificar
3. Define patrones obligatorios
4. Especifica tests requeridos
5. POST /api/factory/tickets con toda la info
```

**Tareas**:
- [ ] Crear comando /factory
- [ ] Documentar uso
- [ ] Probar ciclo completo

---

## Estructura de Ticket

```json
{
  "titulo": "Agregar GET /api/contabilidad/facturas/:id/pdf",
  "tipo": "feature",
  "prioridad": 2,

  "descripcion": "Endpoint que genera PDF de factura usando pdfkit...",

  "archivos_modificar": [
    "backend/app/modules/contabilidad/controllers/facturas.controller.js"
  ],

  "archivos_referencia": [
    "backend/app/modules/pos/controllers/ventas.controller.js"
  ],

  "patrones_obligatorios": [
    "Usar RLSContextManager.query()",
    "Envolver en asyncHandler"
  ],

  "contexto_cipher": "// Código relevante pre-cargado...",

  "tests_requeridos": [
    "200 con PDF válido",
    "404 si no existe",
    "403 si otro tenant"
  ]
}
```

---

## Memoria Compartida (Cipher)

Ambos modelos comparten conocimiento:

| Quién guarda | Qué guarda |
|--------------|------------|
| Claude | Decisiones arquitectónicas, patrones del proyecto |
| Qwen | Errores encontrados, soluciones que funcionaron |
| Script init | Contexto base (módulos, reglas RLS, troubleshooting) |

---

## Métricas Objetivo

| Métrica | Meta |
|---------|------|
| Tickets completados primer intento | > 60% |
| Tiempo promedio por ticket | < 10 min |
| Tests pasan primer intento | > 70% |

---

## Referencias

| Recurso | Ubicación |
|---------|-----------|
| Cipher config | `memAgent/cipher.yml` |
| Variables Cipher | `.env` (sección CIPHER) |
| Docker services | `docker-compose.dev.yml` |
| MCP config | `.mcp.json` |
