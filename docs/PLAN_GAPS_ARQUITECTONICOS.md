# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 26 Diciembre 2025

---

## Estado del Proyecto

| Fase | Nombre | Estado | Notas |
|------|--------|--------|-------|
| 1 | Workflows de Aprobación | ✅ Completado | 6 tablas |
| 2 | Gestión de Módulos | ✅ Completado | 11 módulos con dependencias |
| 3 | Permisos Normalizados | ✅ Completado | 86 permisos, 13 módulos |
| 4 | Multi-Moneda | ✅ Completado | 7 monedas |
| 5 | Listas de Precios | ✅ Completado | Modelo Odoo |
| 5.1-5.3 | Usuarios/Profesionales/POS | ✅ Completado | Modelo bidireccional |
| **INV-1** | **Reservas de Stock** | ✅ Completado | Evita sobreventa |
| **INV-2** | **Auto-generación OC** | ✅ Completado | Stock bajo → OC automática |
| **INV-3** | **Ubicaciones WMS** | ✅ Completado | Zona→Pasillo→Estante→Bin |
| 6 | Webhooks Salientes | ⬜ Pendiente | - |
| 7 | Internacionalización | ⬜ Pendiente | BD preparada |
| 8 | Reportes Multi-Sucursal | ⬜ Pendiente | - |
| 9 | Centros de Costo | ⬜ Pendiente | - |
| 10 | API Pública | ⬜ Futuro | Baja prioridad |

---

## Comparativa vs Odoo 17

### Paridad Actual

| Módulo | Nexo vs Odoo | Ventaja Nexo |
|--------|--------------|--------------|
| Usuarios | 85% | OAuth nativo, soft delete auditado |
| Profesionales | 90% | 5 estados laborales, comisiones integradas |
| Departamentos | 95% | Código único por org |
| Puestos | 80% | Rango salarial integrado |
| **Permisos** | **95%** | **RLS PostgreSQL, numéricos, vigencia temporal** |
| **Inventario** | **80%** | **Kardex, alertas, reservas, OC auto, WMS** |

### Gaps vs Odoo (Priorizado)

#### 🔴 Alta Prioridad
| Gap | Módulo | Estado | Esfuerzo |
|-----|--------|--------|----------|
| ~~Ubicaciones almacén~~ | Inventario | ✅ Completado | - |
| Valoración FIFO/AVCO | Inventario | ⬜ Pendiente | Alto |
| 2FA/MFA | Usuarios | ⬜ Pendiente | Alto |
| CRUD granular | Permisos | ⬜ Pendiente | Alto |

#### 🟡 Media Prioridad
| Gap | Módulo | Estado | Esfuerzo |
|-----|--------|--------|----------|
| Transferencias internas | Inventario | ⬜ Pendiente | Medio |
| ~~Auto-generación OC~~ | Inventario | ✅ Completado | - |
| Números de serie | Inventario | ⬜ Pendiente | Alto |
| ~~Reservas de stock~~ | Inventario | ✅ Completado | - |
| hr.contract | RRHH | ⬜ Pendiente | Alto |
| Horarios normalizados | RRHH | ⬜ Pendiente | Medio |
| Auditoría cambios | Core | ⬜ Pendiente | Medio |

#### 🟢 Baja Prioridad
| Gap | Módulo | Estado | Esfuerzo |
|-----|--------|--------|----------|
| App móvil/Barcode | Inventario | ⬜ Pendiente | Alto |
| Caducidad/Lotes | Inventario | ⬜ Pendiente | Medio |
| API Keys usuario | Usuarios | ⬜ Pendiente | Medio |
| Portal usuario | Usuarios | ⬜ Pendiente | Medio |

---

## Arquitectura Actual

### Modelo Usuario-Profesional (estilo Odoo)
```
usuarios.profesional_id ↔ profesionales.usuario_id
```
- Relación bidireccional opcional
- Usuario sin profesional = admin puro, contador
- Profesional sin usuario = empleado sin acceso sistema

### Sistema de Permisos (Ventaja vs Odoo)
```
permisos_catalogo (86) → permisos_rol (5 roles) → permisos_usuario_sucursal (overrides)
                                                          ↓
                                                  RLS PostgreSQL (122 políticas)
```
- **Permisos numéricos**: `pos.max_descuento`, `inventario.limite_aprobacion`
- **Vigencia temporal**: `fecha_inicio/fecha_fin` en overrides
- **Granularidad**: Por usuario + sucursal específica

### Jerarquía Organizacional
```
departamentos (recursivo via parent_id)
    └── puestos (con salario_min/max)
        └── profesionales (con supervisor_id)
```

---

## Notas Técnicas

### RLS Multi-Tenant
- `RLSContextManager.query()` siempre
- `withBypass()` solo para JOINs o super_admin
- **⚠️ NUNCA `{ useTransaction: true }` con `withBypass()`**

### Bugs Corregidos (Dic 2025)
- `OrganigramaPage.jsx`: `useState` → `useEffect` para expandir nodos
- `pos_requiere_profesional`: Columna agregada a organizaciones
- `ubicaciones.model.js`: Patrón RLSContextManager corregido (`query(orgId, callback)` no `query(sql, params, orgId)`)

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Módulos backend | 19 |
| Permisos | 86 en 13 módulos |
| Políticas RLS | 122 |
| Monedas | 7 |
| Páginas frontend | 100+ |
| Hooks React | 37+ |
| Tablas inventario | 15 (incluye reservas, ubicaciones) |
