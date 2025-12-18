# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para el mercado latinoamericano con IA Conversacional integrada.

---

## Memoria Persistente (Cipher)

Tienes acceso a **Cipher** via MCP para memoria persistente. **ÚSALO SIEMPRE**:
- **Guardar**: Bugs, decisiones arquitectónicas, patrones importantes
- **Consultar**: Antes de responder preguntas sobre el proyecto
- **Actualizar**: Después de cambios significativos

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, Zustand 5, TanStack Query 5 |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron |
| **IA** | OpenRouter (DeepSeek), n8n workflows, MCP Server (8 tools) |
| **Storage** | MinIO (S3-compatible) |
| **Cache** | Redis 7 |
| **Vectors** | Qdrant + Ollama (embeddings) |

---

## Servicios Docker (11)

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| postgres | 5432 | PostgreSQL 17 + pg_cron |
| redis | 6379 | Cache y cola n8n |
| backend | 3000 | API Express |
| frontend | 8080 | React + Vite |
| mcp-server | 3100 | Tools para AI Agent |
| n8n-main | 5678 | Orquestador workflows |
| n8n-worker | - | Worker de cola |
| minio | 9000/9001 | Object storage |
| qdrant | 6333/6334 | Vector DB |
| ollama | 11434 | LLM local |
| pgadmin | 8001 | Admin BD |

---

## Diseño Visual

| Aspecto | Valor |
|---------|-------|
| **Color primario** | `#753572` (primary-700) |
| **Dark mode** | Default `dark`, via `themeStore` |

```
Fondos:   bg-gray-50 dark:bg-gray-900 | bg-white dark:bg-gray-800
Textos:   text-gray-900 dark:text-gray-100 | text-gray-600 dark:text-gray-400
Bordes:   border-gray-200 dark:border-gray-700
Marca:    primary-400 a primary-800
```

---

## Módulos Backend (12)

| Módulo | Descripción |
|--------|-------------|
| **core** | Auth (JWT + OAuth Google + Magic Links), usuarios, organizaciones, suscripciones |
| **agendamiento** | Profesionales, servicios, horarios |
| **inventario** | Productos, categorías, proveedores, órdenes compra |
| **pos** | Ventas, corte caja, reportes |
| **comisiones** | Cálculo y pago a profesionales |
| **contabilidad** | Cuentas, asientos (particionados), reportes |
| **marketplace** | Perfiles públicos, reseñas, analytics |
| **eventos-digitales** | Invitaciones, mesas, QR check-in, seating chart |
| **website** | Constructor de páginas con bloques |
| **storage** | Archivos MinIO, presigned URLs |
| **recordatorios** | Notificaciones de citas |
| **chatbots** | Integración Telegram/WhatsApp |

---

## Base de Datos

| Métrica | Valor |
|---------|-------|
| Tablas | 68 |
| Particionadas | 4 (citas, asientos, eventos, movimientos) |
| Políticas RLS | 122 |
| Funciones | 120 |
| Triggers | 79 |

---

## Comandos

```bash
# Stack
npm run dev              # Levantar todo
npm run logs:all         # Logs backend + frontend + mcp

# Desarrollo
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend

# Base de datos
npm run db:connect       # psql directo
npm run clean:data       # Reset completo (DESTRUCTIVO)

# Tests
npm run test:quick       # Tests rápidos
npm run test:backend     # Suite completa

# Cipher
npm run cipher:status    # Estado de memoria
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

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

### MCP Server (8 herramientas)
```
Usuario → Telegram/WhatsApp → n8n → AI Agent → MCP Server → Backend API
```
Tools: buscarCliente, buscarCitasCliente, crearCita, reagendarCita, confirmarCita, listarServicios, verificarDisponibilidad, modificarServiciosCita

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **withBypass**: Solo para JOINs multi-tabla o super_admin
- **asyncHandler**: Obligatorio en todas las routes

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (nunca blue, indigo, purple)
- **Formularios móviles**: Usar `Drawer` (no Modal) - bug iOS Safari

### Componentes UI
| Componente | Uso |
|------------|-----|
| `Drawer` | Formularios (bottom sheet, Vaul) |
| `Modal` | Confirmaciones y visualización |
| `ConfirmDialog` | Acciones destructivas |

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| Avatar/icono azul | Fallback a `#753572` |

---

## Estructura

```
backend/app/
├── modules/        # 12 módulos (48 archivos routes)
├── middleware/     # 9 middlewares
└── utils/          # RLSContextManager, RLSHelper, logger

frontend/src/
├── components/     # 126 componentes
├── pages/          # 96 páginas
├── hooks/          # 33 hooks
├── store/          # authStore, themeStore, onboardingStore
└── services/api/   # client.js, endpoints.js

sql/
├── 18 módulos      # 127 archivos SQL
└── README.md       # Documentación esquema
```

---

**Actualizado**: 17 Diciembre 2025
