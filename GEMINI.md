# GEMINI.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Memoria Persistente (Cipher)

Tienes acceso a **Cipher** via MCP para memoria persistente del proyecto. **ÚSALO SIEMPRE**:

- **Guardar información**: Cuando descubras algo importante (bugs, decisiones, patrones), usa `ask_cipher` para almacenarlo
- **Consultar contexto**: Antes de responder preguntas sobre el proyecto, consulta `ask_cipher` para obtener contexto relevante
- **Actualizar estado**: Después de cambios significativos, actualiza la memoria con el nuevo estado

```
# Ejemplo de uso
ask_cipher("¿Cuál es el estado actual del proyecto Nexo?")
ask_cipher("Almacena: Se corrigió bug X en archivo Y")
```

---

## Nexo - Sistema de Gestión Empresarial

**Plataforma ERP SaaS Multi-Tenant** para el mercado latinoamericano con **IA Conversacional** integrada.

### Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite 7, Tailwind CSS 3, Zustand, TanStack Query |
| **Backend** | Node.js, Express.js, JWT, Joi, Winston |
| **Database** | PostgreSQL 17, pg_cron, RLS multi-tenant |
| **IA** | OpenRouter (Qwen3-32B), n8n workflows, MCP Server |
| **Storage** | MinIO (S3-compatible) |
| **Infra** | Docker Compose |

### Comandos

```bash
npm run dev              # Stack completo
npm run logs             # Logs tiempo real
docker restart front     # Aplicar cambios frontend
docker restart back      # Aplicar cambios backend
```

**Nota**: HMR NO funciona en Docker. Siempre reiniciar contenedor + Ctrl+Shift+R.

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **withBypass**: Solo para JOINs multi-tabla o super_admin
- **asyncHandler**: Obligatorio en todas las routes
- **Variable RLS**: `app.current_tenant_id`

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Limpiar cache**: `queryClient.clear()` en Login/Logout

### Orden Middlewares
```
auth.authenticateToken → tenant.setTenantContext → controller
```

---

## Archivos Clave

| Área | Archivos |
|------|----------|
| **RLS** | `backend/app/utils/rlsContextManager.js` |
| **Middlewares** | `backend/app/middleware/index.js` |
| **Auth** | `backend/app/modules/core/controllers/auth.controller.js` |
| **MCP Tools** | `backend/mcp-server/tools/*.js` |
| **Stores** | `frontend/src/store/authStore.js`, `onboardingStore.js` |
