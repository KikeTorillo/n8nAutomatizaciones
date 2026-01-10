# Comparativa POS: Odoo 19 vs Nexo

**Última actualización:** 10 Enero 2026

---

## Estado de Implementación

### Fase 1: Quick Wins - COMPLETADA ✅

| Funcionalidad | Estado | Archivos |
|---------------|--------|----------|
| Grid visual de productos | ✅ | `ProductosGridPOS.jsx`, `CategoriasPOS.jsx` |
| Categorías visuales con tabs | ✅ | `CategoriasPOS.jsx` |
| Apertura/cierre de caja formal | ✅ | `AperturaCajaModal.jsx`, `CierreCajaModal.jsx` |
| Entrada/salida efectivo mid-session | ✅ | `MovimientosCajaDrawer.jsx` |
| Teclado de billetes (efectivo) | ✅ | `TecladoBilletes.jsx` |
| Badge cantidad en productos | ✅ | `ProductosGridPOS.jsx` |

---

### Fase 2: Core Features - EN PROGRESO

| Funcionalidad | Estado | Archivos |
|---------------|--------|----------|
| **Pago split (múltiples métodos)** | ✅ | `venta_pagos` tabla, `MetodoPagoModal.jsx` |
| **Cupones de descuento** | ✅ | `cupones.model.js`, `InputCupon.jsx` |
| **Cuenta de cliente (fiado)** | 🔄 | SQL listo, falta integración UI |

#### Pago Split - Implementado
- Tabla `venta_pagos` para múltiples métodos por venta
- Trigger `sincronizar_pagos_venta` actualiza automáticamente `monto_pagado` y `estado_pago`
- UI permite agregar efectivo + tarjeta + transferencia en una sola venta
- Campo `metodo_pago = 'mixto'` cuando hay más de un método

#### Cupones de Descuento - Implementado
- Tablas: `cupones`, `uso_cupones`
- Tipos: porcentaje o monto fijo
- Validaciones: monto mínimo, fecha vigencia, usos máximos, usos por cliente
- Input en carrito con validación en tiempo real
- Registro automático de uso al crear venta

---

### Fase 3: Diferenciadores - PENDIENTE

| Funcionalidad | Esfuerzo | Descripción |
|--------------|----------|-------------|
| Programa de lealtad/puntos | Alta | Acumular puntos por compra, canjear por descuentos |
| PWA modo offline | Alta | Funcionar sin conexión, sincronizar al reconectar |
| Pantalla del cliente | Media | Segunda pantalla mostrando productos y total |
| Promociones automáticas | Alta | 2x1, 3x2, descuento por monto mínimo |

---

### Otros Gaps (Baja Prioridad)

| Funcionalidad | Esfuerzo | Notas |
|--------------|----------|-------|
| Combos/Paquetes | Alta | Producto compuesto de varios items |
| Modificadores de producto | Alta | Extras, sin cebolla, etc. (restaurantes) |
| Tarjetas de regalo | Media | Vender y canjear gift cards |
| Crear producto desde POS | Media | Modal rápido sin ir a Inventario |
| Modo restaurante (mesas) | Alta | Solo si se enfoca en ese vertical |

---

## Fortalezas de Nexo vs Odoo

| Fortaleza | Nexo | Odoo |
|-----------|------|------|
| IA Conversacional (WhatsApp/Telegram) | ✅ | ❌ |
| Walk-in Flow | ✅ | ❌ |
| Vista 360° Cliente | ✅ | Parcial |
| Escaneo GS1-128 con lotes/NS | ✅ | Parcial |
| Reservas de stock atómicas | ✅ | ❌ |
| Dark Mode nativo | ✅ | ❌ |
| Integración Comisiones | ✅ | Módulo separado |
| **Pago Split nativo** | ✅ | ✅ |
| **Cupones integrados** | ✅ | ✅ |

---

## Archivos del Módulo POS

```
frontend/src/
├── pages/pos/
│   └── VentaPOSPage.jsx        # Página principal (toggle Grid/Búsqueda)
├── components/pos/
│   ├── ProductosGridPOS.jsx    # Grid visual de productos
│   ├── CategoriasPOS.jsx       # Tabs horizontales categorías
│   ├── BuscadorProductosPOS.jsx
│   ├── CarritoVenta.jsx        # Incluye InputCupon
│   ├── InputCupon.jsx          # Validación cupones en tiempo real
│   ├── MetodoPagoModal.jsx     # Pago split + TecladoBilletes
│   ├── TecladoBilletes.jsx     # Botones $1000, $500, etc.
│   ├── AperturaCajaModal.jsx   # Abrir sesión de caja
│   ├── CierreCajaModal.jsx     # Cerrar con validación diferencia
│   └── MovimientosCajaDrawer.jsx
└── hooks/
    ├── usePOS.js               # useSesionCajaActiva, useCategoriasPOS
    └── useCupones.js           # useValidarCupon, useCupones

backend/app/modules/pos/
├── controllers/
│   ├── ventas.controller.js
│   ├── cupones.controller.js
│   └── sesiones-caja.controller.js
├── models/
│   ├── ventas.model.js         # Incluye registro uso_cupones
│   ├── cupones.model.js
│   └── sesiones-caja.model.js
├── routes/pos.js
└── schemas/pos.schemas.js      # Incluye cupon_id, descuento_cupon

sql/pos/
├── 07-sesiones-caja.sql        # sesiones_caja, movimientos_caja
├── 08-venta-pagos.sql          # venta_pagos + trigger sincronización
└── 09-cupones.sql              # cupones, uso_cupones
```

---

## Próximos Pasos

1. **Cuenta de cliente (fiado)** - Completar integración
   - SQL `08-credito-cliente.sql` ya existe
   - Falta: UI en MetodoPagoModal para método "A cuenta"
   - Falta: Vista de saldos pendientes por cliente

2. **Fase 3** - Evaluar prioridad según feedback usuarios

---

*Documento actualizado: 10 Enero 2026*
