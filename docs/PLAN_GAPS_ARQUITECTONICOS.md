# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 26 Diciembre 2025 - Fase 5.2 corregida

---

## Estado del Proyecto

| Fase | Nombre | Estado | Notas |
|------|--------|--------|-------|
| 1 | Workflows de Aprobación | ✅ Completado | ~4,200 líneas |
| 2 | Gestión de Módulos | ✅ Completado | 11 módulos con dependencias |
| 3 | Permisos Normalizados | ✅ Completado | 72 permisos, 5 roles |
| 4 | Multi-Moneda | ✅ Completado | Precios, conversión POS |
| 5 | Listas de Precios | ✅ Completado | Modelo Odoo |
| 5.1 | Roles en Invitaciones | ✅ Completado | Selector rol al crear profesional |
| 5.2 | Gestión de Usuarios | ✅ Completado | Vincular/desvincular profesional funcional |
| 5.3 | Configuración POS | ✅ Completado | Requerir profesional para ventas |
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
- Listar usuarios con filtros (rol, estado, búsqueda)
- Crear usuarios directos (sin profesional)
- Cambiar rol, activar/desactivar usuario
- Vincular/desvincular profesional a usuario

**Modelo de datos** (estilo Odoo):
- `usuarios` = acceso al sistema (`res.users`)
- `profesionales` = datos laborales (`hr.employee`)
- Relación bidireccional: `usuarios.profesional_id` ↔ `profesionales.usuario_id`

**Bug crítico corregido**:
- `RLSContextManager.withBypass({ useTransaction: true })` NO persistía cambios
- Solución: Remover `useTransaction: true`, usar auto-commit por query

### Fase 5.3: Configuración POS (26 Dic 2025)

**Nueva configuración organizacional**:
- Toggle "Requerir profesional para ventas" en Configuración > Mi Negocio
- Columna `pos_requiere_profesional BOOLEAN` en tabla `organizaciones`
- Si está activado, usuarios sin profesional vinculado reciben error 403

**Flujo de validación**:
1. Usuario intenta crear venta en POS
2. Backend auto-asigna `profesional_id` si usuario tiene uno vinculado
3. Si no tiene profesional y config está activa → Error con mensaje claro
4. Mensaje: "Para realizar ventas necesitas tener un perfil de profesional vinculado"

**Archivos modificados**:
| Archivo | Cambio |
|---------|--------|
| `organizacion.constants.js` | Campo en SELECT_FIELDS y CAMPOS_ACTUALIZABLES |
| `organizacion.schemas.js` | Validación Joi para boolean |
| `ventas.controller.js` | Validación pre-creación de venta |
| `NegocioPage.jsx` | Toggle UI + fix boolean trim() |

**Bugs corregidos en esta fase**:
- `BuscadorProductosPOS.jsx`: crash al buscar (productos?.length)
- `VentaPOSPage.jsx`: mensaje error genérico (message vs mensaje)
- `invitacionProfesional.js`: colores email verde → Nexo purple #753572

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
- **⚠️ NUNCA usar `{ useTransaction: true }` con `withBypass()`** - los cambios no persisten
- Sin `useTransaction`, cada query hace auto-commit (comportamiento correcto)
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
