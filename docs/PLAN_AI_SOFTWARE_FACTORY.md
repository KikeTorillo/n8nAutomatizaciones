# Plan: AI Software Factory con Cipher

**Actualizado**: 5 Diciembre 2025
**Estado**: Fase 1 Completa - Pendiente reiniciar Claude Code

---

## Objetivo

Sistema automatizado de desarrollo donde:
- **Claude Opus 4.5**: Arquitecto (genera tickets atómicos)
- **Qwen 2.5 32B**: Implementador (escribe código)
- **Cipher + Qdrant**: Memoria semántica persistente
- **n8n**: Orquestación de workflows

---

## Estado Actual

### Infraestructura ✅

| Servicio | Puerto | Estado |
|----------|--------|--------|
| Qdrant | 6333 | ✅ Corriendo |
| Ollama | 11434 | ✅ Corriendo |
| nomic-embed-text | - | ✅ Instalado (768 dim) |
| Cipher MCP | - | ✅ Conectado |

### Archivos Configurados

```
.mcp.json                    → Cipher como MCP Server
memAgent/cipher.yml          → LLM (Qwen) + Embeddings (Ollama) + Qdrant
docker-compose.dev.yml       → Servicios Qdrant + Ollama
~/.bashrc                    → OPENROUTER_API_KEY, OPENAI_BASE_URL
```

### Memoria Cargada en Cipher

- Contexto proyecto Nexo (stack, 10 módulos)
- Patrones críticos (RLS, middlewares, validaciones)
- Errores comunes y soluciones

---

## Arquitectura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Claude Code │────▶│    Cipher    │────▶│    Qdrant    │
│              │     │  (MCP Server)│     │  (vectores)  │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    ▲
                     ┌──────┴──────┐             │
                     ▼             ▼             │
              ┌──────────┐  ┌──────────┐         │
              │  Qwen    │  │  Ollama  │─────────┘
              │  (chat)  │  │(embeddings)
              └──────────┘  └──────────┘
```

---

## Próximo Paso Inmediato

**Reiniciar Claude Code** para que Cipher use la nueva configuración con embeddings:

```bash
exit
claude
```

Después probar:
```
ask_cipher("Guarda: El módulo X tiene la función Y")
ask_cipher("¿Qué sabes del módulo X?")
```

---

## Fases Pendientes

### Fase 2: Sistema de Tickets
- [ ] Crear tabla `dev_tickets` en PostgreSQL
- [ ] Endpoints API `/api/factory/*`

### Fase 3: Prompts
- [ ] Prompt arquitecto (Opus)
- [ ] Prompt implementador (Qwen)

### Fase 4: Workflows n8n
- [ ] Crear tickets desde requerimiento
- [ ] Implementar tickets automáticamente
- [ ] Notificaciones Telegram

---

## Referencias

| Recurso | Ubicación |
|---------|-----------|
| SQL tickets | `sql/factory/01-tablas-tickets.sql` (por crear) |
| Config Cipher | `memAgent/cipher.yml` |
| Docker services | `docker-compose.dev.yml` |
| MCP config | `.mcp.json` |

---

## Métricas Objetivo

| Métrica | Meta |
|---------|------|
| Tickets auto-completados | > 70% |
| Tiempo por ticket | < 15 min |
| Tests primer intento | > 60% |
