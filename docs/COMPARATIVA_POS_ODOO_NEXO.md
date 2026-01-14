# Comparativa POS: Odoo 19 vs Nexo

**Última actualización:** 14 Enero 2026

---

## Estado de Implementación

| Fase | Estado | Funcionalidades |
|------|--------|-----------------|
| **Fase 1: Quick Wins** | ✅ | Grid visual, categorías, sesiones caja, teclado billetes |
| **Fase 2: Core Features** | ✅ | Pago split, cupones, crédito cliente (fiado) |
| **Fase 3: Diferenciadores** | ✅ | Promociones, lealtad, pantalla cliente, combos/modificadores |
| **Fase 4: Operaciones** | ✅ | Devoluciones parciales/totales, tickets PDF térmico |
| **Fase 5: Admin UIs** | ✅ | UI administración combos y lealtad |
| **Fase 6: Testing E2E** | ✅ | Pruebas funcionales completas de Combos y Lealtad |
| **Fase 7: Refactor Arquitectónico** | ✅ | Migración de Combos a módulo Inventario (frontend + backend) |

**Todas las fases completadas y verificadas.** El módulo POS está en estado funcional y productivo.

### UIs de Administración

| Página | Ruta | Módulo | Funcionalidad |
|--------|------|--------|---------------|
| **LealtadPage** | `/pos/lealtad` | POS | 3 tabs: Configuración, Niveles, Estadísticas |
| **CombosPage** | `/inventario/combos` | Inventario | CRUD de combos/kits |

> **Nota arquitectónica:** Los combos fueron migrados al módulo **Inventario** el 14 Enero 2026, similar a cómo Odoo maneja los "Kits/BOM". Esto incluye frontend, backend (controller, model, routes) y API (`/api/v1/inventario/combos`).

---

## Fortalezas Nexo vs Odoo

| Fortaleza | Nexo | Odoo |
|-----------|:----:|:----:|
| IA Conversacional (WhatsApp/Telegram) | ✅ | ❌ |
| Walk-in Flow | ✅ | ❌ |
| Escaneo GS1-128 con lotes/NS | ✅ | Parcial |
| Reservas de stock atómicas | ✅ | ❌ |
| Dark Mode nativo | ✅ | ❌ |
| Pantalla cliente (sin IoT) | ✅ | ❌ |
| Devoluciones con reversión de puntos | ✅ | ❌ |
| Combos con descuento automático de componentes | ✅ | Parcial |

---

## Estructura de Archivos

### Frontend

```
frontend/src/
├── pages/pos/
│   ├── VentaPOSPage.jsx        # Principal + broadcast
│   ├── VentasListPage.jsx      # Historial de ventas
│   ├── PromocionesPage.jsx     # CRUD promociones
│   ├── CuponesPage.jsx         # CRUD cupones
│   ├── LealtadPage.jsx         # Admin programa lealtad (3 tabs)
│   └── CustomerDisplayPage.jsx # Display cliente
├── pages/inventario/
│   ├── CombosPage.jsx          # Admin combos/kits
│   └── ... (20+ páginas más)
├── components/pos/ (26 componentes)
│   ├── DevolverItemsModal.jsx
│   ├── VentaDetalleModal.jsx
│   ├── ModificadoresProductoModal.jsx
│   ├── PuntosCliente.jsx
│   ├── CanjePuntosModal.jsx
│   ├── NivelLealtadDrawer.jsx
│   ├── ProductoSelectorInline.jsx  # Compartido con inventario
│   └── ... (19 componentes más)
├── components/inventario/
│   ├── ComboFormDrawer.jsx     # Crear/editar combos
│   └── ... (30+ componentes más)
└── hooks/
    ├── useVentas.js            # useDevolverItems()
    ├── useLealtad.js           # Programa de puntos completo
    └── useCombosModificadores.js # Usa API /inventario/combos
```

### Backend

```
backend/app/modules/pos/
├── controllers/
│   ├── ventas.controller.js    # Integra LealtadModel + devoluciones
│   ├── cupones.controller.js
│   ├── promociones.controller.js
│   └── sesiones-caja.controller.js
├── models/
│   ├── lealtad.model.js        # Acumulación/canje/reversión puntos
│   └── ventas.model.js         # devolver() con reversión de puntos
└── schemas/pos.schemas.js

backend/app/modules/inventario/
├── controllers/
│   ├── combos.controller.js    # CRUD combos + modificadores (migrado desde POS)
│   └── ... (25 controllers más)
├── models/
│   ├── combos.model.js         # Lógica combos + modificadores (migrado desde POS)
│   └── ... (25 models más)
└── routes/inventario.js        # Incluye /combos y /modificadores

sql/pos/ (12 archivos)
├── 01-tablas.sql
├── 04-funciones.sql            # Triggers con soporte combos
├── 11-programa-lealtad.sql     # revertir_puntos_devolucion()
└── 12-combos-modificadores.sql # descontar_stock_combo()
```

### API Endpoints - Combos (en Inventario)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/inventario/combos` | Listar combos |
| GET | `/api/v1/inventario/combos/:productoId` | Obtener combo |
| POST | `/api/v1/inventario/combos` | Crear combo |
| PUT | `/api/v1/inventario/combos/:productoId` | Actualizar combo |
| DELETE | `/api/v1/inventario/combos/:productoId` | Eliminar combo |
| GET | `/api/v1/inventario/combos/:productoId/precio` | Calcular precio |
| GET | `/api/v1/inventario/combos/:productoId/stock` | Verificar stock componentes |
| GET | `/api/v1/inventario/modificadores/grupos` | Listar grupos modificadores |
| POST | `/api/v1/inventario/modificadores/grupos` | Crear grupo |
| GET | `/api/v1/inventario/productos/:id/modificadores` | Modificadores de producto |

---

## Funcionalidades Críticas Implementadas

### Descuento de Stock en Combos
Implementado en `sql/pos/04-funciones.sql:182-196`:
```sql
-- Dentro de calcular_totales_venta_pos()
IF EXISTS (
    SELECT 1 FROM productos_combo
    WHERE producto_id = item.producto_id
    AND activo = true
    AND manejo_stock = 'descontar_componentes'
) THEN
    PERFORM descontar_stock_combo(producto_id, cantidad, sucursal_id, venta_id);
END IF;
```

### Reversión de Puntos en Devoluciones
Implementado en `backend/app/modules/pos/models/ventas.model.js:1252-1275`:
```javascript
// Dentro de devolver()
if (venta.cliente_id) {
    await LealtadModel.revertirPuntosDevolucion({
        cliente_id: venta.cliente_id,
        venta_pos_id: id,
        monto_devuelto: totalDevuelto,
        monto_original: parseFloat(venta.total)
    }, organizacionId, usuarioId);
}
```

---

## Bugs Corregidos

| Fecha | Bug | Solución |
|-------|-----|----------|
| 13-Ene-2026 | Canje puntos calculaba $0.01 por punto en vez de $1 | Corregir nombre campo `pesos_por_punto_descuento` → `puntos_por_peso_descuento` en frontend |
| 14-Ene-2026 | Frontend devoluciones error 400 | Agregar `sucursal_id: sucursalActiva?.id` al body |
| 14-Ene-2026 | Devoluciones solo en estado `completada` | `ventas.model.js` ahora acepta `devolucion_parcial` |
| 13-Ene-2026 | Combos no descontaban stock de componentes | Invocación de `descontar_stock_combo()` en triggers |
| 13-Ene-2026 | Devoluciones no revertían puntos de lealtad | Implementación de `revertirPuntosDevolucion()` |
| 14-Ene-2026 | Error 400 al crear combos desde UI | API búsqueda devuelve `producto_id` no `id`. Fix: normalización en `ProductoSelectorInline.jsx` |

---

## Consultas de Verificación

```sql
-- Verificar puntos de un cliente
SELECT * FROM puntos_cliente WHERE cliente_id = X;

-- Verificar transacciones de puntos de una venta
SELECT * FROM transacciones_puntos WHERE venta_pos_id = Y ORDER BY creado_en;

-- Verificar stock de componentes de combo
SELECT p.nombre, p.stock_actual
FROM productos_combo_items pci
JOIN productos p ON p.id = pci.producto_id
WHERE pci.combo_id = Z;

-- Verificar si un producto es combo
SELECT producto_es_combo(producto_id);
```

---

## Pruebas Funcionales Completadas (14 Enero 2026)

### Combos - Flujo Verificado ✅
| Paso | Resultado |
|------|-----------|
| Crear combo "Sandwich Jamón" desde `/inventario/combos` | ✅ Funcionando |
| Configurar tipo precio "suma_componentes" | ✅ |
| Agregar componentes (Coca-Cola, Papas Fritas) | ✅ |
| Vender combo en POS | ✅ Stock componentes descontado |
| Verificar stock post-venta | ✅ Coca-Cola: 12→11, Papas: 12→11 |

### Lealtad - Flujo Verificado ✅
| Paso | Resultado |
|------|-----------|
| Configurar programa (1pt/$1, máx 50%) | ✅ Guardado |
| Niveles: Bronce, Plata(x1.25), Oro(x1.5), Platino(x2) | ✅ 4 niveles |
| Crear cliente "Juan Pérez" | ✅ |
| Venta $40 → Acumular puntos | ✅ +40 puntos |
| Canjear 11 puntos → $11 descuento | ✅ Total $22→$11 |
| Verificar saldo post-canje | ✅ 40-11+11=40 pts (neto pagado) |

### Migración Combos a Inventario - Verificado ✅
| Paso | Resultado |
|------|-----------|
| Frontend `/inventario/combos` carga correctamente | ✅ |
| Navegación desde dropdown "Catálogo" | ✅ |
| API `/api/v1/inventario/combos` responde | ✅ |
| Listar 3 combos existentes | ✅ |
| Crear/Editar/Eliminar combos | ✅ |

---

## Próximos Pasos

### Baja Prioridad - Features Futuros
| Funcionalidad | Notas |
|---------------|-------|
| Pantalla Cliente | Probar CustomerDisplayPage en segundo monitor |
| ESC/POS nativo | Impresión directa (actualmente PDF print dialog) |
| Modo restaurante | Gestión de mesas |
| Integración fiscal | CFDI México |

### Limpieza Técnica ✅ (14-Ene-2026)

| Archivo Eliminado | Ubicación | Líneas |
|-------------------|-----------|--------|
| `combos.controller.js` | `pos/controllers/` | ~396 |
| `combos.model.js` | `pos/models/` | ~744 |
| Rutas `/pos/combos` y `/pos/modificadores` | `pos/routes/pos.js` | ~260 |

**Total eliminado:** ~1,400 líneas de código legacy duplicado.

Se dejó un comentario en `pos.js` indicando la migración a inventario.

---

## Historial de Cambios

| Fecha | Cambio |
|-------|--------|
| 14-Ene-2026 | Limpieza: eliminados archivos legacy de combos en módulo POS |
| 14-Ene-2026 | Migración completa de Combos: frontend + backend a módulo Inventario |
| 14-Ene-2026 | Fase 7 completada: Refactor arquitectónico |
| 14-Ene-2026 | Pruebas E2E de Combos y Lealtad completadas |
| 13-Ene-2026 | Fases 1-6 implementadas y verificadas |

---

*Documento actualizado: 14 Enero 2026 - Migración completa de Combos a Inventario (frontend + backend)*
