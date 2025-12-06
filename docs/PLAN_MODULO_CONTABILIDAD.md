# Módulo de Contabilidad - México

**Estado**: ✅ Producción
**Verificado**: 6 Diciembre 2025

---

## Resumen

Contabilidad electrónica para México basada en el catálogo SAT (Anexo 24). Soporta partida doble, asientos automáticos desde POS/Compras y reportes financieros.

---

## Estructura

| Capa | Ubicación | Contenido |
|------|-----------|-----------|
| **SQL** | `sql/contabilidad/` | 7 archivos (tablas, RLS, funciones, triggers, catálogo SAT) |
| **Backend** | `app/modules/contabilidad/` | 3 controllers, 3 models, 1 route, 1 schema |
| **Frontend** | `pages/contabilidad/` | 5 páginas + 22 hooks |

---

## Tablas

| Tabla | Descripción |
|-------|-------------|
| `cuentas_contables` | Catálogo jerárquico SAT (24 cuentas base) |
| `periodos_contables` | Control mensual abierto/cerrado |
| `asientos_contables` | Libro diario (particionada mensual) |
| `movimientos_contables` | Líneas debe/haber por asiento |
| `config_contabilidad` | Cuentas default y configuración por org |
| `saldos_cuentas` | Cache de saldos mensuales (actualizado por triggers) |

---

## Integraciones Automáticas

| Origen | Trigger | Asiento Generado |
|--------|---------|------------------|
| **Venta POS** | `trigger_asiento_venta_pos` | DEBE: Caja, HABER: Ingresos (+IVA si aplica) |
| **Orden Compra** | `trigger_asiento_compra` | DEBE: Inventario (+IVA), HABER: Proveedores |

Habilitado en: Configuración → Asientos Automáticos

---

## Reportes

| Reporte | Endpoint | Función SQL |
|---------|----------|-------------|
| Balanza de Comprobación | `/reportes/balanza` | `obtener_balanza_comprobacion()` |
| Libro Mayor | `/reportes/libro-mayor` | `obtener_libro_mayor()` |
| Estado de Resultados | `/reportes/estado-resultados` | Query directo |
| Balance General | `/reportes/balance-general` | Query directo |

---

## Flujo de Balanza

```
Frontend (periodoId)
    → Model (obtiene fechas del período)
    → SQL: obtener_balanza_comprobacion(org_id, fecha_inicio, fecha_fin)
    → Retorna: código, cuenta, saldo_inicial, debe, haber, saldo_final
    → Valida: total_debe = total_haber (cuadrada)
```

---

## Pendiente

| Prioridad | Feature |
|-----------|---------|
| **Media** | Exportación PDF/Excel de reportes |
| **Baja** | Asiento de cierre anual automático |
| **Futuro** | CFDI 4.0 integración |
| **Futuro** | Contabilidad electrónica SAT (XML) |

---

## Acceso

- **Ruta**: `/contabilidad`
- **Rol mínimo**: admin/propietario
