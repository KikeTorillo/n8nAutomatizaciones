# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 23 Diciembre 2025
> **Estado**: Fase 1 Workflows - E2E Validado

---

## Estado Actual del Proyecto

| Fase | Nombre | SQL | Backend | Frontend | Estado |
|------|--------|-----|---------|----------|--------|
| 1 | Workflows de Aprobación | ✅ | ✅ | ✅ | **E2E Validado** |
| 2A | Reportes Multi-Sucursal | ⬜ | ⬜ | ⬜ | Pendiente |
| 2B | Centros de Costo | 🟡 | ⬜ | ⬜ | SQL parcial |
| 3A | Departamentos por Sucursal | ⬜ | ⬜ | ⬜ | Pendiente |
| 3B | Permisos Normalizados | ✅ | ✅ | ⬜ | Backend listo |

**Leyenda**: ⬜ Pendiente | 🟡 En Progreso | ✅ Completado

---

## Fase 1: Workflows - COMPLETADA

### Flujo E2E Validado (23 Dic 2025)

```
Orden Compra → Enviar → pendiente_aprobacion → Aprobar → enviada ✅
```

### Fixes Aplicados Durante Validación

| # | Archivo | Problema | Solución |
|---|---------|----------|----------|
| 1 | `workflow.engine.js:112` | Transacciones anidadas | Parámetro `dbExterno` opcional |
| 2 | `workflow.engine.js:314` | `inconsistent types $2` | Parámetro `$5` separado para CASE |
| 3 | `usuario.model.js:170` | JWT sin `sucursalId` | Agregar al payload de `generarTokens()` |
| 4 | `usuario.model.js:78` | Query login sin `sucursal_id` | Subconsulta a `usuarios_sucursales` + bypass |
| 5 | `auth.js:256` | `req.user` sin `sucursal_id` | Agregar desde `decoded.sucursalId` |
| 6 | `01-tablas.sql` (workflows) | RLS sin bypass | Agregar `app.bypass_rls` a 6 policies |
| 7 | `03-funciones.sql` | `VARCHAR(150)` vs `TEXT` | Casts `::TEXT` en `obtener_aprobadores_paso` |

### Componentes Implementados

**SQL** (`sql/workflows/`):
- `01-tablas.sql` - 6 tablas + RLS + triggers
- `02-indices.sql` - Índices optimizados
- `03-funciones.sql` - Motor de evaluación

**Backend** (`backend/app/modules/workflows/`):
- WorkflowEngine - Motor de aprobaciones
- Rutas: pendientes, historial, aprobar, rechazar

**Frontend** (`frontend/src/pages/aprobaciones/`):
- Bandeja de aprobaciones
- Modal aprobar/rechazar

---

## Gap Identificado: Activación de Módulos

### Problema

Durante la validación del workflow, el endpoint `/api/v1/workflows/pendientes` retornaba **403 Forbidden** porque el módulo `workflows` no estaba en `subscripciones.modulos_activos`.

### Solución Manual Aplicada

```sql
UPDATE subscripciones
SET modulos_activos = modulos_activos || '{"workflows": true}'::jsonb
WHERE organizacion_id = 1;
```

### Gap: No Existe API para Activar Módulos

Actualmente no hay forma desde el backend/frontend de:
1. Listar módulos disponibles por plan
2. Activar/desactivar módulos para una organización
3. Gestionar el campo `modulos_activos` de subscripciones

### Acción Requerida

Crear endpoints en el módulo `subscripciones`:

```
GET  /api/v1/subscripciones/modulos           - Listar módulos del plan
POST /api/v1/subscripciones/modulos/:codigo   - Activar módulo
DELETE /api/v1/subscripciones/modulos/:codigo - Desactivar módulo
```

Y UI en `/configuracion/modulos` para gestionar activación.

---

## Próximos Pasos

### 1. Auditoría de Base de Datos (Prioridad Alta)

Revisar detalladamente toda la implementación SQL para validar:

- [ ] **Consistencia de tipos**: Verificar que no haya más casos de `VARCHAR` vs `TEXT` en funciones
- [ ] **RLS Policies**: Confirmar que todas las tablas tengan soporte para `app.bypass_rls`
- [ ] **Índices**: Validar que existan índices para queries frecuentes
- [ ] **Foreign Keys**: Verificar integridad referencial correcta
- [ ] **Triggers**: Confirmar que no haya conflictos o loops
- [ ] **Funciones**: Revisar manejo de errores y tipos de retorno

### 2. API de Gestión de Módulos

- [ ] Crear endpoints para activar/desactivar módulos
- [ ] Agregar validación de plan (qué módulos permite cada plan)
- [ ] UI de configuración de módulos activos

### 3. Completar Fases Pendientes

**Fase 2A - Reportes Multi-Sucursal:**
- Vistas materializadas para consolidación
- Dashboard comparativo

**Fase 2B - Centros de Costo:**
- Completar tabla `centros_costo`
- Integrar con contabilidad

**Fase 3B - Permisos (Frontend):**
- UI de gestión de permisos por rol
- UI de override por usuario/sucursal

---

## Archivos Clave Modificados (Fase 1)

| Archivo | Cambios |
|---------|---------|
| `backend/app/modules/core/models/usuario.model.js` | `sucursalId` en JWT + bypass RLS en login |
| `backend/app/middleware/auth.js` | `sucursal_id` en `req.user` |
| `backend/app/middleware/permisos.js` | Lee `req.user.sucursal_id` |
| `backend/app/modules/workflows/services/workflow.engine.js` | `dbExterno` + fix tipos SQL |
| `sql/workflows/01-tablas.sql` | RLS con bypass |
| `sql/workflows/03-funciones.sql` | Casts `::TEXT` |

---

## Notas Importantes

### Inicio desde Cero
Este proyecto se levanta desde cero. No hay datos legacy ni necesidad de migraciones.

### HMR en Docker
Hot Module Reload NO funciona en Docker. Siempre reiniciar contenedor + Ctrl+Shift+R.

### RLS Context
Usar siempre `RLSContextManager.query()` o `.transaction()`. Solo usar `withBypass()` para JOINs multi-tabla o super_admin.
