# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para el mercado latinoamericano con IA Conversacional integrada.

---

## Memoria Persistente (Cipher)

Tienes acceso a **Cipher** via MCP para memoria persistente. **ÚSALO SIEMPRE**:
- **Guardar**: Cuando descubras bugs, decisiones arquitectónicas o patrones importantes
- **Consultar**: Antes de responder preguntas sobre el proyecto
- **Actualizar**: Después de cambios significativos

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite 7, Tailwind CSS 3, Zustand 5, TanStack Query 5 |
| **Backend** | Node.js, Express 4, JWT, Joi, Winston |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron |
| **IA** | OpenRouter (DeepSeek v3.2), n8n workflows, MCP Server |
| **Storage** | MinIO (S3-compatible) |
| **Infra** | Docker Compose |

---

## Diseño Visual

| Aspecto | Valor |
|---------|-------|
| **Color primario** | `#753572` (Nexo Purple) |
| **Filosofía** | Un solo color de marca (modelo Nubank) |
| **Dark mode** | ✅ Completo con `themeStore` + `ThemeToggle` |
| **Tema default** | `dark` |

### Patrones de Color
```
Fondos:   bg-gray-50 dark:bg-gray-900 | bg-white dark:bg-gray-800
Textos:   text-gray-900 dark:text-gray-100 | text-gray-600 dark:text-gray-400
Bordes:   border-gray-200 dark:border-gray-700
Marca:    primary-400 a primary-800 (variaciones por contexto)
```

---

## Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **core** | Auth, usuarios, organizaciones, suscripciones |
| **agendamiento** | Citas, profesionales, servicios, horarios |
| **inventario** | Productos, categorías, proveedores, órdenes compra |
| **pos** | Ventas, corte caja, reportes |
| **comisiones** | Cálculo y pago a profesionales |
| **contabilidad** | Cuentas contables, asientos, reportes SAT |
| **marketplace** | Perfiles públicos, reseñas, analytics |
| **chatbots** | Telegram, WhatsApp con IA |
| **eventos-digitales** | Invitaciones, mesas, QR check-in |
| **website** | Constructor de páginas con bloques |
| **storage** | Archivos MinIO, presigned URLs |

---

## Comandos

```bash
npm run dev              # Stack completo
docker restart front     # Aplicar cambios frontend
docker restart back      # Aplicar cambios backend
```

**Nota**: HMR NO funciona en Docker. Siempre reiniciar contenedor + Ctrl+Shift+R.

---

## Arquitectura

### Middlewares (orden)
```
auth.authenticateToken → tenant.setTenantContext → controller
```

### Roles
| Rol | Permisos |
|-----|----------|
| `super_admin` | Plataforma completa, bypass RLS |
| `admin/propietario` | CRUD completo en su organización |
| `empleado` | Solo módulos en `modulos_acceso` |
| `bot` | READ + CRUD citas (MCP) |

### MCP Server (Chatbots)
```
Usuario (Telegram/WhatsApp) → n8n → AI Agent → MCP Server → Backend API
```

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **withBypass**: Solo para JOINs multi-tabla o super_admin
- **asyncHandler**: Obligatorio en todas las routes

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Usar siempre variantes `dark:` en clases Tailwind
- **Colores de marca**: Usar `primary-*` (no blue, indigo, purple, etc.)

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| Avatar/icono azul | Cambiar fallback a `#753572` |

---

## Estructura

```
backend/app/
├── modules/           # 12 módulos de negocio
├── middleware/        # 9 middlewares
└── utils/             # RLSContextManager, helpers

frontend/src/
├── components/        # ~120 componentes
├── pages/             # ~90 páginas
├── hooks/             # ~35 hooks
├── store/             # authStore, themeStore, onboardingStore
└── services/api/      # Endpoints centralizados
```

---

**Actualizado**: 13 Diciembre 2025
