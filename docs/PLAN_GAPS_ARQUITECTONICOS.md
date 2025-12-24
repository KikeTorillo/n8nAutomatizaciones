# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 23 Diciembre 2025 (noche)

---

## Estado del Proyecto

| Fase | Nombre | Estado | Notas |
|------|--------|--------|-------|
| 1 | Workflows de Aprobación | ✅ Completado | E2E validado |
| 2 | Gestión de Módulos | ✅ Completado | 9 módulos con dependencias |
| 3 | Permisos Normalizados | ✅ Completado | 65+ permisos, 4 roles |
| 4 | Multi-Moneda | ✅ Completado | Precios, conversión POS, tasas manuales |
| 5 | Webhooks Salientes | ⬜ Pendiente | - |
| 6 | Internacionalización | ⬜ Pendiente | BD preparada |
| 7 | Reportes Multi-Sucursal | ⬜ Pendiente | - |
| 8 | Centros de Costo | ⬜ Pendiente | - |
| 9 | API Pública | ⬜ Futuro | Baja prioridad |

---

## Fases Completadas (Referencia)

### Fase 1: Workflows de Aprobación
Sistema de aprobaciones para órdenes de compra basado en límites por rol.
- Condición: `total > limite_aprobacion` del usuario
- Flujos validados E2E: aprobación → enviada, rechazo → borrador
- Bandeja de aprobaciones con historial filtrable
- `workflowAdapter.js` para desacoplar integración

### Fase 2: Gestión de Módulos
Activar/desactivar módulos por organización con validación de dependencias.
- `backend/app/modules/core/controllers/modulos.controller.js` | `frontend/src/pages/configuracion/ModulosPage.jsx`

### Fase 3: Permisos Normalizados
Catálogo de permisos con asignación por rol y overrides por usuario/sucursal.
- Permisos booleanos: toggle on/off
- Permisos numéricos: input editable (limite_aprobacion, max_descuento)
- Guardado inmediato al perder foco o Enter

### Fase 4: Multi-Moneda
Soporte completo para múltiples monedas con conversión en tiempo real.
- Catálogo: MXN, COP, USD activas (+4 en catálogo)
- Precios multi-moneda en productos/servicios (UI colapsable)
- Conversión en POS: equivalente USD debajo del total
- Tasas de cambio manuales (automáticas opcional futuro)
- `useCurrency.js` hook para formateo

---

## Fases Futuras (Alto Nivel)

### Fase 5: Webhooks Salientes
Notificar sistemas externos cuando ocurren eventos (cita.creada, venta.completada, etc.).

### Fase 6: Internacionalización (i18n)
Soporte multi-idioma con i18next. BD ya tiene campos `idioma`, `zona_horaria` en organizaciones.

### Fase 7: Reportes Multi-Sucursal
Vistas materializadas para comparar métricas entre sucursales con pg_cron.

### Fase 8: Centros de Costo
Asignar gastos/ingresos a centros de costo para análisis de rentabilidad.

### Fase 9: API Pública Documentada
OpenAPI/Swagger + API Keys para integraciones externas. Baja prioridad.

---

## Notas Técnicas

- **RLS**: Usar `RLSContextManager.query()`. Solo `withBypass()` para JOINs multi-tabla o super_admin.
- **HMR**: No funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.
- **Multi-Tenant**: 122 políticas RLS, 4 tablas particionadas.

### Adapters de Servicios
Patrón para desacoplar módulos sin dependencias directas (lazy loading):

| Adapter | Uso |
|---------|-----|
| `clienteAdapter` | Crear/buscar clientes desde agendamiento público |
| `workflowAdapter` | Evaluar aprobaciones desde órdenes de compra |
| `organizacionAdapter` | Acceso a datos de organización desde chatbots |
| `profesionalAdapter` | Buscar profesionales desde marketplace |
| `notificacionAdapter` | Enviar notificaciones desde cualquier módulo |
| `chatbotConfigAdapter` | Config de chatbots desde notificaciones |
