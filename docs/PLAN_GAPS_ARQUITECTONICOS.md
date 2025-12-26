# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 26 Diciembre 2025 - Fase 5.2: ✅ Gestión de Usuarios Completada

---

## Estado del Proyecto

| Fase | Nombre | Estado | Notas |
|------|--------|--------|-------|
| 1 | Workflows de Aprobación | ✅ Completado | ~4,200 líneas, E2E validado |
| 2 | Gestión de Módulos | ✅ Completado | 11 módulos con dependencias |
| 3 | Permisos Normalizados | ✅ Completado | 72 permisos, 5 roles |
| 4 | Multi-Moneda | ✅ Completado | Precios, conversión POS |
| 5 | Listas de Precios | ✅ Completado | Modelo Odoo, prioridad por especificidad |
| 5.1 | Roles en Invitaciones | ✅ Completado | Selector rol al crear profesional |
| 5.2 | Gestión de Usuarios | ✅ Completado | Página usuarios, cambio de roles |
| 6 | Webhooks Salientes | ⬜ Pendiente | - |
| 7 | Internacionalización | ⬜ Pendiente | BD preparada |
| 8 | Reportes Multi-Sucursal | ⬜ Pendiente | - |
| 9 | Centros de Costo | ⬜ Pendiente | - |
| 10 | API Pública | ⬜ Futuro | Baja prioridad |

---

## Fases Completadas (Resumen)

### Fase 1-4: Core Funcional
- **Workflows**: Aprobaciones OC basadas en límites por rol
- **Módulos**: 11 módulos activables con dependencias
- **Permisos**: 72 permisos normalizados, función SQL `tiene_permiso()`
- **Multi-Moneda**: MXN/COP/USD, jerarquía sucursal→organización

### Fase 5: Listas de Precios (Dic 2025)
Sistema estilo Odoo con prioridad: Producto > Categoría > Global.
- Items con precio fijo o descuento porcentual
- `obtener_precio_producto()` resuelve precio final en POS
- Descuentos NO acumulativos (modelo Odoo)

### Fase 5.1: Roles en Invitaciones (25 Dic 2025)
Selector de rol (empleado/propietario/admin) al crear profesional con invitación.

### Fase 5.2: Gestión de Usuarios (26 Dic 2025)

**Página `/configuracion/usuarios`**:
- Listar usuarios de la organización con filtros
- Crear usuarios directos (sin profesional vinculado)
- Cambiar rol de usuarios existentes
- Toggle activar/desactivar usuario

**Invitaciones para usuarios directos**:
- Tipo `usuario_directo` vs `profesional`
- Admin ingresa nombre/apellidos al crear invitación
- Registro muestra campos pre-llenados (solo pide contraseña)
- Columna `apellidos_sugerido` agregada a `invitaciones_profesionales`

**Edición de profesional con usuario vinculado**:
- Muestra usuario vinculado y su rol actual
- Selector para cambiar rol en tiempo real
- Query retorna `usuario_rol` del JOIN con usuarios

**Archivos principales**:
| Tipo | Archivos |
|------|----------|
| Backend | `usuario.model.js`, `usuario.controller.js`, `usuarios.js` (rutas) |
| Frontend | `UsuariosPage.jsx`, `UsuarioFormDrawer.jsx`, `useUsuarios.js` |
| SQL | `06-invitaciones.sql` (columna `apellidos_sugerido`) |

---

## Fases Futuras

| Fase | Descripción |
|------|-------------|
| 6. Webhooks | Notificar sistemas externos (cita.creada, venta.completada) |
| 7. i18n | Multi-idioma con i18next (BD preparada) |
| 8. Reportes | Vistas materializadas multi-sucursal con pg_cron |
| 9. Centros de Costo | Análisis de rentabilidad |
| 10. API Pública | OpenAPI/Swagger + API Keys |

---

## Notas Técnicas

### RLS Multi-Tenant
- Usar `RLSContextManager.query()` siempre
- `withBypass()` solo para JOINs multi-tabla o super_admin
- 122 políticas RLS activas

### Adapters de Servicios
Patrón para desacoplar módulos sin dependencias directas:
- `clienteAdapter`, `workflowAdapter`, `profesionalAdapter`
- `notificacionAdapter`, `chatbotConfigAdapter`

### Docker
- HMR NO funciona, usar `docker restart <contenedor>` + Ctrl+Shift+R

### Estadísticas
- 19 módulos backend
- 60+ páginas frontend
- 130+ componentes UI
- 35+ hooks React
