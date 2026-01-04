# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para LATAM con IA Conversacional.

---

## Memoria Persistente (Cipher)

Usar **Cipher** via MCP:
- **Guardar**: Bugs, decisiones arquitectónicas, patrones
- **Consultar**: Antes de responder preguntas del proyecto
- **Actualizar**: Después de cambios significativos

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, Zustand 5, TanStack Query 5, React Hook Form + Zod |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron (particionamiento automático) |
| **IA** | OpenRouter (DeepSeek), Ollama (embeddings), Qdrant (vector search), n8n workflows |

---

## Servicios Docker (13 contenedores)

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| backend | 3000 | API Express |
| frontend | 8080 | React + Vite |
| postgres | 5432 | PostgreSQL 17 + pg_cron |
| redis | 6379 | Cache, tokens blacklist, cola n8n |
| mcp-server | 3100 | Tools para AI Agent |
| n8n-main | 5678 | Orquestador workflows (UI) |
| n8n-worker | - | Worker (concurrencia=20) |
| minio | 9000/9001 | Object storage S3 |
| qdrant | 6333 | Vector DB (embeddings) |
| ollama | 11434 | LLM local |
| pgadmin | 8001 | Administración BD |
| **odoo** | 8069 | Competencia (análisis gaps) |
| odoo-postgres | 5433 | BD exclusiva para Odoo |

> **Nota**: Odoo es solo para desarrollo/comparación. `npm run clean:data` NO borra datos de Odoo.

### Credenciales Odoo 19 (análisis competitivo)
| Campo | Valor |
|-------|-------|
| URL | http://localhost:8069 |
| Email | admin |
| Password | admin |
| BD Postgres | odoo:odoo@odoo-postgres:5432/odoo |
| Idioma | Español (América Latina) |
| Módulos instalados | Ventas, CRM, Compras, Inventario, PdV, Facturación, Empleados, Calendario, Contactos, Conversaciones |

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
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

---

## Conexión a Base de Datos

**SIEMPRE usar estos comandos exactos** (no adivinar credenciales):

```bash
# Conexión principal (usar SIEMPRE este)
docker exec -it postgres_db psql -U admin -d postgres

# Listar tablas
\dt

# Describir tabla
\d nombre_tabla

# Salir
\q
```

### Credenciales
| Usuario | Password | Base de Datos | Uso |
|---------|----------|---------------|-----|
| `admin` | `sQCJg3erpXk8CXoB47Si3qOKlYLyCkem` | `postgres` | Admin general |
| `saas_app` | `saas_secure_K7mN9pQ2vX8sL4wE` | `postgres` | App backend (RLS) |
| `n8n_app` | `n8n_secure_R5jB7nM3kF9hP6zY` | `n8n_db` | Workflows n8n |

### Bases de Datos
- `postgres` - BD principal SaaS (183 tablas)
- `n8n_db` - Workflows y ejecuciones n8n
- `chat_memories_db` - Memorias de conversaciones IA

### Consultas Frecuentes
```sql
-- Usuarios del sistema
SELECT id, email, rol, organizacion_id FROM usuarios;

-- Organizaciones activas
SELECT id, nombre, estado FROM organizaciones WHERE activo = true;

-- Permisos de un usuario
SELECT * FROM permisos_usuario_sucursal WHERE usuario_id = X;

-- Productos con stock
SELECT id, nombre, stock_actual FROM productos WHERE organizacion_id = X;
```

---

## Arquitectura

### Chain de Middlewares
```
auth.authenticateToken → tenant.setTenantContext → [permisos] → controller
```

### Middlewares (11)
`asyncHandler`, `auth`, `tenant`, `permisos`, `rateLimiting`, `subscription`, `validation`, `modules`, `storage`, `onboarding`

### Roles
| Rol | Descripción |
|-----|-------------|
| `super_admin` | Bypass RLS, acceso total plataforma |
| `propietario/admin` | CRUD completo en su organización |
| `empleado` | Permisos vía `permisos_usuario_sucursal` |
| `bot` | READ + CRUD citas (MCP) |

### RLS (Row Level Security)
```javascript
// 80% de casos - gestión automática
await RLSContextManager.query(orgId, async (db) => { ... });

// 20% de casos - control fino
await RLSHelper.withRole(db, 'login_context', async () => { ... });

// Solo JOINs multi-tabla o super_admin
await RLSContextManager.withBypass(async (db) => { ... });
```

### Permisos Normalizados (86 códigos)
- Tablas: `permisos_catalogo` → `permisos_rol` → `permisos_usuario_sucursal` (override)
- SQL: `tiene_permiso(usuario_id, sucursal_id, codigo_permiso)`
- API: `/api/v1/permisos/verificar/:codigo`
- Cache: 5 min en memoria

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **withBypass**: Solo JOINs multi-tabla o super_admin
- **asyncHandler**: Obligatorio en routes
- **Validación**: Joi schemas en cada endpoint

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (nunca blue, indigo, purple) - primario: `#753572`
- **Formularios complejos**: React Hook Form + Zod para validación

### Componentes UI
| Componente | Uso |
|------------|-----|
| `Drawer` | Formularios móviles (bottom sheet) - iOS Safari compatible |
| `Modal` | Confirmaciones y visualización |
| `ConfirmDialog` | Acciones destructivas |
| `Tabs` | Navegación en vistas de detalle (ver Profesionales) |

---

## Módulos Backend (24)

| Módulo | Controllers | Descripción |
|--------|-------------|-------------|
| **core** | 12 | Auth, usuarios, organizaciones, planes, webhooks, superadmin, monedas |
| **inventario** | 24 | Productos, OC, movimientos, valoración, NS/Lotes, WMS, dropship, consigna, batch-picking |
| **agendamiento** | 10 | Citas, horarios, disponibilidad, bloqueos, recordatorios |
| **eventos-digitales** | 9 | Eventos, invitados, galerías, plantillas, mesas |
| **pos** | 3 | Punto de venta, ventas, reportes |
| **comisiones** | 4 | Configuración, cálculo, estadísticas |
| **contabilidad** | 4 | Asientos, cuentas, reportes |
| **clientes** | 1 | CRM clientes |
| **profesionales** | 5 | Gestión profesionales con arquitectura modular (tabs) |
| **sucursales** | 1 | Multi-sucursal, transferencias |
| **permisos** | 2 | Sistema normalizado 86 permisos |
| **marketplace** | 4 | Perfiles, reseñas, analytics |
| **workflows** | 2 | Motor de aprobaciones |
| **notificaciones** | 2 | Sistema de notificaciones |
| **recordatorios** | 1 | Recordatorios Telegram/WhatsApp |
| **storage** | 2 | Archivos MinIO |
| **website** | 4 | Editor sitio web |
| **custom-fields** | 2 | Campos personalizados |
| **precios** | 1 | Listas de precios |
| **organizacion** | 3 | Departamentos, puestos |
| **vacaciones** | 4 | Solicitudes, políticas, saldos, niveles antigüedad |
| **catalogos** | 2 | Catálogos del sistema (categorías de pago, motivos salida) |

**Totales**: 93 controllers, 90 models, 78 routes, 72 schemas Joi

---

## Módulos Frontend (17 en Dashboard)

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Agendamiento | `/citas` | Gestión de citas con calendario |
| Profesionales | `/profesionales` | Equipo con vista detalle en tabs |
| Servicios | `/servicios` | Catálogo y precios |
| Clientes | `/clientes` | CRM y base de clientes |
| Vacaciones | `/vacaciones` | Solicitudes y saldos |
| Inventario | `/inventario` | 20 submódulos (productos, stock, OC, etc.) |
| Punto de Venta | `/pos` | Ventas y cobros |
| Comisiones | `/comisiones` | Cálculo y pago a profesionales |
| Contabilidad | `/contabilidad` | Catálogo de cuentas y asientos |
| Chatbots IA | `/chatbots` | Telegram, WhatsApp con IA |
| Marketplace | `/marketplace` | Perfil público y reseñas |
| Invitaciones | `/eventos-digitales` | Bodas, XV años y más |
| Mi Sitio Web | `/website` | Editor de página web |
| Sucursales | `/sucursales` | Gestión multi-sucursal |
| Aprobaciones | `/aprobaciones` | Workflows pendientes |
| Estadísticas | `/dashboard` | Métricas y KPIs |
| Configuración | `/configuracion` | Módulos y preferencias |

---

## Módulo Profesionales (Arquitectura Modular con Tabs)

Vista de detalle con 7 tabs:
| Tab | Contenido |
|-----|-----------|
| **General** | Información básica, contacto, descripción, categorías |
| **Trabajo** | Puesto, departamento, tipo contrato, fecha ingreso |
| **Personal** | Datos personales, contacto emergencia |
| **Currículum** | Educación formal, experiencia laboral, habilidades |
| **Documentos** | Archivos del empleado (INE, comprobantes, etc.) |
| **Compensación** | Salario, cuentas bancarias, categorías de pago |
| **Configuración** | Preferencias, accesos, notificaciones |

- Indicador de completitud de perfil (%)
- Edición inline por campo
- Migración a React Hook Form + Zod

---

## Módulo Vacaciones (Nuevo Ene 2026)

| Feature | Descripción |
|---------|-------------|
| **Mis Vacaciones** | Dashboard con días disponibles, usados, en trámite |
| **Mi Equipo** | Vista de solicitudes del equipo (para managers) |
| **Solicitudes** | Filtros por estado (Todas, Pendientes, Aprobadas, Rechazadas, Canceladas) |
| **Políticas** | Configuración de días por año, antigüedad |
| **Niveles** | Días adicionales por antigüedad |
| **Saldos** | Cálculo automático por empleado |

---

## Módulo Inventario (20 submódulos)

| Submódulo | Funcionalidad |
|-----------|---------------|
| Productos | CRUD con variantes, atributos, SKU, código barras |
| Categorías | Jerárquicas con colores e iconos |
| Proveedores | RFC, términos comerciales, ubicación |
| Movimientos | Entradas, salidas, ajustes, kardex |
| Conteos | Inventario físico con diferencias |
| Ajustes CSV | Carga masiva de ajustes |
| Órdenes Compra | Borrador → Enviada → Recibida con NS/Lotes |
| Reorden | Reglas automáticas (pg_cron 6:00 AM) |
| Dropship | Proveedor envía directo al cliente |
| Consigna | Mercancía en consignación |
| Operaciones | Picking, recepción, despacho |
| Wave Pick | Batch/Wave picking |
| Alertas | Stock bajo, vencimientos |
| Reportes | Valoración, rotación, ABC |
| Listas Precios | Multi-lista con rangos |
| Ubicaciones | WMS (Zona → Pasillo → Nivel) |
| NS/Lotes | Tracking individual con vencimiento |
| Rutas | Rutas de operación multietapa |
| Histórico | Snapshots diarios (pg_cron 00:05 AM) |
| Transferencias | Entre sucursales |

---

## Capacidades Clave

### Inventario Completo
| Feature | Descripción |
|---------|-------------|
| Valoración | FIFO, LIFO, Promedio Ponderado |
| NS/Lotes | Tracking individual con fechas vencimiento |
| Variantes | Atributos configurables (color, talla, etc.) |
| Reservas | Atómicas con `FOR UPDATE SKIP LOCKED` |
| Snapshots | Histórico diario (pg_cron 00:05 AM) |
| WMS | Ubicaciones (Zona → Pasillo → Nivel) |
| OC | Flujo Borrador → Enviada → Recibida |
| GS1-128 | Parser + Generador + Scanner POS |
| Landed Costs | Distribución automática al recibir mercancía |
| Dropship | Proveedor envía directo al cliente |
| Consigna | Acuerdos con consignatarios |
| Batch Picking | Wave picking para múltiples órdenes |

### GS1-128
```
Parser:    parseGS1(code) → { gtin, lot, expirationDate, serial }
Generator: generateGS1Code({ gtin, lot, ... }) → { code, humanReadable }
Scanner:   BuscadorProductosPOS.jsx (botón "Escanear")
Etiquetas: GenerarEtiquetaGS1Modal.jsx (5 plantillas industria)
```

### POS (Punto de Venta)
| Feature | Descripción |
|---------|-------------|
| Métodos Pago | Efectivo, Tarjeta, Transferencia, QR MercadoPago |
| Buscador | Por nombre, SKU o código de barras |
| Escaneo | Integración con scanner códigos |
| Descuentos | Por producto y global (%) |
| Devoluciones | Procesamiento desde historial |
| Corte Caja | Cierre diario |
| Reportes | Ventas diarias |

### Workflows de Aprobación
Motor para OC basado en límites por rol.
- `backend/app/modules/workflows/services/workflow.engine.js`

### Multi-Moneda
MXN, COP, USD con conversión tiempo real (`useCurrency.js`)

### Multi-Tenancy
RLS enforced PostgreSQL (328 políticas), context: `current_tenant_id`

---

## Estructura

```
backend/app/
├── modules/        # 24 módulos (93 controllers)
├── middleware/     # 11 middlewares
├── services/       # 27 archivos (email, n8n, storage, adapters)
├── utils/          # 9 utils (RLSContextManager, helpers, tokens)
└── core/           # ModuleRegistry, RouteLoader (auto-discovery)

frontend/src/
├── components/     # 188 componentes (28 categorías)
├── pages/          # 128 páginas (31 categorías)
├── hooks/          # 69 hooks especializados
├── store/          # 4 stores Zustand (auth, theme, sucursal, onboarding)
└── services/api/   # endpoints.js centralizado (400+ métodos)

sql/
├── 35 directorios  # 199 archivos SQL
├── Particionadas   # citas, movimientos_inventario, eventos_sistema, asientos_contables
└── Tablas          # 183 tablas con RLS (328 políticas)
```

---

## Frontend - Hooks Principales (69 total)

### Inventario (14)
`useInventario`, `useProductos`, `useNumerosSerie`, `useVariantes`, `useAtributos`, `useCategorias`, `useProveedores`, `useOrdenesCompra`, `useValoracion`, `useUbicacionesAlmacen`, `useConteos`, `useAjustesMasivos`, `useLandedCosts`, `useInventoryAtDate`

### Operaciones Almacén (8)
`useOperacionesAlmacen`, `useBatchPicking`, `usePaquetes`, `useConsigna`, `useDropship`, `useReorden`, `useConfiguracionAlmacen`, `useRutasOperacion`

### POS & Ventas (3)
`usePOS`, `useVentas`, `useBarcodeScanner`

### Gestión Citas (5)
`useCitas`, `useHorarios`, `useBloqueos`, `useTiposBloqueo`, `useRecordatorios`

### Gestión Personas (16)
`useClientes`, `useProfesionales`, `useUsuarios`, `useOrganigrama`, `usePuestos`, `useDepartamentos`, `useVacaciones`, `useOnboardingEmpleados`, `useDocumentosEmpleado`, `useEducacionFormal`, `useExperienciaLaboral`, `useHabilidades`, `useCuentasBancarias`, `useCategoriasPago`, `useMotivosSalida`, `useUbicacionesTrabajo`

### Sistema (7)
`useModulos`, `useAccesoModulo`, `usePermisos`, `useNotificaciones`, `useCustomFields`, `useWorkflows`, `useSucursales`

### Otros (16)
`useAuth`, `useTheme`, `useToast`, `useStorage`, `useCurrency`, `useEstadisticas`, `useEventosDigitales`, `useMarketplace`, `useWebsite`, `useComisiones`, `useContabilidad`, `useSuperAdmin`, `useSuperAdminMarketplace`, `useChatbots`, `useAppNotifications`, `useUbicaciones`

---

## Stores Zustand (4)

| Store | Estado Principal | Persistencia |
|-------|-----------------|--------------|
| **authStore** | user, accessToken, refreshToken, isAuthenticated | localStorage |
| **sucursalStore** | sucursalActiva, sucursalesDisponibles | localStorage |
| **themeStore** | theme (light/dark/system), resolvedTheme | localStorage |
| **onboardingStore** | formData, registroEnviado, organizacion_id | localStorage |

---

## Tablas Particionadas (4)

| Tabla | Partición | Descripción |
|-------|-----------|-------------|
| `movimientos_inventario` | Mensual (fecha) | Entradas, salidas, ajustes |
| `citas` | Mensual (fecha_cita) | Citas agendadas |
| `eventos_sistema` | Mensual (creado_en) | Auditoría (43 tipos) |
| `asientos_contables` | Mensual (fecha_movimiento) | Contabilidad |

**Creación dinámica**: Los scripts SQL crean particiones para el mes actual + 6 meses adelante automáticamente al inicializar la BD (sin fechas hardcodeadas).

**pg_cron Jobs**:
- `mantener_particiones()` - 1º de cada mes, crea particiones futuras para las 4 tablas
- `snapshot_inventario_diario()` - 00:05 AM

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| API inventario NS/Lotes | Usar `inventarioApi`, no `ordenesCompraApi` |
| "Rendered fewer hooks than expected" | Mover returns condicionales DESPUÉS de todos los hooks |
| Validación ruta_preferida | Seleccionar opción válida (normal/dropship/fabricar) |
| "Perfil no encontrado" en navegación directa | Usar navegación desde Home, no URLs directas |

**Nota**: La auditoría (`registrarEventoAuditoria`) usa SAVEPOINT para que errores de logging no aborten transacciones principales.

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| Alta | 2FA/MFA, Integraciones Carriers (DHL, FedEx, Estafeta) |
| Media | Auditoría cambios detallada, Kitting/BOM |
| Baja | API Keys por usuario, Facturación electrónica CFDI |

### Implementados (Dic 2025 - Ene 2026)
- **Reorden Automático**: Reglas configurables, pg_cron 6:00 AM, generación OC
- **Landed Costs**: Distribución automática al recibir mercancía
- **Dropship**: Proveedor envía directo al cliente
- **Consigna**: Acuerdos con consignatarios, ventas POS integradas
- **Batch/Wave Picking**: Picking optimizado para múltiples órdenes
- **Rutas Operación**: Flujos multietapa configurables
- **Paquetes**: Gestión de paquetería
- **Particionamiento Dinámico**: SQL sin fechas hardcodeadas, SAVEPOINT en auditoría
- **Módulo Vacaciones**: Solicitudes, políticas, saldos, niveles antigüedad
- **Profesionales con Tabs**: Arquitectura modular RHF + Zod (General, Trabajo, Personal, Currículum, Documentos, Compensación, Configuración)
- **Catálogos Sistema**: Categorías de pago, motivos de salida, ubicaciones de trabajo

---

## Flujos Validados (Testing)

| Flujo | Estado | Notas |
|-------|--------|-------|
| Login/Auth | ✅ | JWT + refresh token |
| Inventario - Categorías | ✅ | Jerárquicas con colores |
| Inventario - Proveedores | ✅ | RFC, términos, ubicación México |
| Inventario - Productos | ✅ | SKU, código barras, variantes, rutas |
| Clientes | ✅ | CRM con foto, marketing opt-in |
| POS - Venta | ✅ | Búsqueda, carrito, métodos pago |
| Multi-moneda | ✅ | Conversión USD en tiempo real |
| Agendamiento - Servicios | ✅ | Crear servicio, asignar profesional, plantillas duración |
| Agendamiento - Horarios | ✅ | Plantillas (jornada completa, media jornada), días semana |
| Agendamiento - Citas UI | ✅ | Formulario completo, validación días laborales |
| Agendamiento - Calendario | ✅ | Vista mensual, navegación, estados visuales |
| Agendamiento - Citas E2E | ✅ | Crear cita desde frontend, persistencia BD, auditoría |
| Profesionales - Lista | ✅ | Cards con estadísticas, búsqueda, filtros |
| Profesionales - Detalle | ✅ | Vista con tabs, edición inline, indicador completitud |
| Vacaciones - Dashboard | ✅ | Días disponibles, usados, en trámite |
| Home - Dashboard | ✅ | 17 módulos, accesos rápidos, trial info |

---

**Actualizado**: 4 Enero 2026
