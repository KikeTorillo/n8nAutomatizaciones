# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 23 Diciembre 2025

---

## Estado del Proyecto

| Fase | Nombre | Estado | Notas |
|------|--------|--------|-------|
| 1 | Workflows de Aprobación | ✅ Completado | E2E validado |
| 2 | Gestión de Módulos | ✅ Completado | 9 módulos con dependencias |
| 3 | Permisos Normalizados | ✅ Completado | 65+ permisos, 4 roles |
| 4 | Multi-Moneda | 🟡 **En progreso** | Infraestructura lista, pendiente integración |
| 5 | Webhooks Salientes | ⬜ Pendiente | - |
| 6 | Internacionalización | ⬜ Pendiente | BD preparada |
| 7 | Reportes Multi-Sucursal | ⬜ Pendiente | - |
| 8 | Centros de Costo | ⬜ Pendiente | - |
| 9 | API Pública | ⬜ Futuro | Baja prioridad |

---

## Fase 4: Multi-Moneda (En Progreso)

### Completado

| Componente | Descripción |
|------------|-------------|
| SQL | 4 tablas: `monedas`, `tasas_cambio`, `precios_servicio_moneda`, `precios_producto_moneda` |
| Backend | API `/api/v1/monedas` con 6 endpoints (listar, tasas, conversión) |
| Frontend | `formatCurrency()` dinámico, hook `useCurrency()`, selector en configuración |
| Monedas | MXN, COP, USD activas (+ ARS, CLP, PEN, EUR en catálogo) |

### Pendiente para completar fase

- [ ] **Precios multi-moneda en productos**: Usar tabla `precios_producto_moneda` en formularios
- [ ] **Precios multi-moneda en servicios**: Usar tabla `precios_servicio_moneda` en formularios
- [ ] **Conversión en POS**: Mostrar equivalente en moneda secundaria
- [ ] **Tasas automáticas** (opcional): Integrar API Banxico/BCE para actualización diaria

### Archivos clave

```
sql/nucleo/15-tablas-monedas.sql
backend/app/modules/core/models/monedas.model.js
backend/app/modules/core/controllers/monedas.controller.js
frontend/src/utils/currency.js
frontend/src/hooks/useCurrency.js
frontend/src/pages/configuracion/NegocioPage.jsx (selector moneda/timezone)
```

---

## Fases Completadas (Referencia)

### Fase 1: Workflows de Aprobación
Sistema de aprobaciones para órdenes de compra basado en límites por rol.
- `sql/workflows/` | `backend/app/modules/workflows/` | `frontend/src/pages/aprobaciones/`

### Fase 2: Gestión de Módulos
Activar/desactivar módulos por organización con validación de dependencias.
- `backend/app/modules/core/controllers/modulos.controller.js` | `frontend/src/pages/configuracion/ModulosPage.jsx`

### Fase 3: Permisos Normalizados
Catálogo de permisos con asignación por rol y overrides por usuario/sucursal.
- `sql/nucleo/11-tablas-permisos.sql` | `backend/app/modules/permisos/` | `frontend/src/pages/configuracion/PermisosPage.jsx`

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
