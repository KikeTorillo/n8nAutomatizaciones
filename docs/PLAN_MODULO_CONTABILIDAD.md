# Módulo de Contabilidad - México

**Estado**: ✅ Producción
**Verificado**: 5 Diciembre 2025 (desde cero)

---

## Resumen

Contabilidad para México con catálogo SAT (Anexo 24), partida doble y reportes financieros.

---

## Archivos

| Capa | Archivos |
|------|----------|
| **SQL** | `sql/contabilidad/` - 7 archivos (tablas, índices, RLS, funciones, triggers, catálogo SAT) |
| **Backend** | `modules/contabilidad/` - 4 controllers, 4 models, 1 route, 1 schema |
| **Frontend** | `pages/contabilidad/` - 4 páginas + `useContabilidad.js` hook |

---

## Tablas

| Tabla | Descripción |
|-------|-------------|
| `cuentas_contables` | Catálogo jerárquico SAT (24 cuentas base) |
| `periodos_contables` | Control mensual abierto/cerrado |
| `asientos_contables` | Libro diario (particionada) |
| `movimientos_contables` | Líneas debe/haber |
| `config_contabilidad` | Cuentas default por org |
| `saldos_cuentas` | Cache saldos mensuales |

---

## API Endpoints

| Grupo | Endpoints |
|-------|-----------|
| Dashboard | `GET /dashboard` |
| Cuentas | `GET /cuentas`, `/arbol`, `/afectables`, `POST /cuentas`, `/inicializar-sat` |
| Asientos | `GET/POST /asientos`, `POST /:id/publicar`, `/:id/anular` |
| Reportes | `GET /balanza/:periodoId`, `/libro-mayor/:cuentaId`, `/estado-resultados`, `/balance-general` |
| Períodos | `GET /periodos` |

Base: `/api/v1/contabilidad`

---

## Funcionalidades

| Feature | Estado |
|---------|--------|
| Inicializar catálogo SAT | ✅ |
| Crear asiento (partida doble) | ✅ |
| Publicar/Anular asiento | ✅ |
| Libro Mayor por cuenta | ✅ |
| Estado de Resultados | ✅ |
| Balance General | ✅ |
| Balanza de Comprobación | ✅ |

---

## Correcciones RLS Críticas

Las políticas RLS de INSERT/UPDATE solo verifican `tenant_id` (el rol se valida en middleware):

```sql
-- 04-rls-policies.sql
asientos_tenant_insert   -- WITH CHECK (tenant_id)
asientos_tenant_update   -- USING (tenant_id)
movimientos_tenant_modify -- USING/WITH CHECK (tenant_id)
```

---

## Pendiente

**Alta**: Asientos automáticos desde POS y compras
**Media**: Exportación PDF/Excel, cierre de período
**Futuro**: CFDI 4.0, contabilidad electrónica SAT

---

## Acceso

- **Ruta**: `/contabilidad`
- **Permisos**: `adminOnly: true`
