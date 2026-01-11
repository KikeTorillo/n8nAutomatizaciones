# Comparativa POS: Odoo 19 vs Nexo

**Última actualización:** 11 Enero 2026

---

## Estado de Implementación

| Fase | Estado | Funcionalidades |
|------|--------|-----------------|
| **Fase 1: Quick Wins** | ✅ | Grid visual, categorías, sesiones caja, teclado billetes |
| **Fase 2: Core Features** | ✅ | Pago split, cupones, crédito cliente (fiado) |
| **Fase 3: Diferenciadores** | ✅ | Promociones, lealtad, pantalla cliente, combos/modificadores |

---

## Funcionalidades Implementadas

### Promociones Automáticas

**Tipos:** `cantidad` (2x1), `porcentaje`, `monto_fijo`, `precio_especial`, `regalo`

**Condiciones:** Monto mín/máx, productos/categorías, horario, límite de usos, sucursales, solo primera compra, exclusiva/acumulable.

**Motor:** Función SQL `evaluar_promociones_carrito()` evalúa automáticamente al cambiar el carrito.

---

### Programa de Lealtad

- Acumulación de puntos por compra (configurable $/punto)
- 4 niveles: Bronze, Silver, Gold, Platinum con multiplicadores
- Canje de puntos por descuento en POS
- Expiración configurable (default 12 meses)

---

### Pantalla del Cliente

**Arquitectura:** BroadcastChannel API (mismo origen, sin servidor)

```
VentaPOSPage ──► BroadcastChannel 'nexo-pos-display' ──► CustomerDisplayPage
```

**Estados:** Idle → Cart (tiempo real) → Payment → Complete

**Indicador:** Icono en header del POS muestra si display está conectado.

---

### Combos y Modificadores

**Combos:** Producto compuesto, 3 tipos de precio (fijo, suma, descuento %), descuento automático de stock de componentes.

**Modificadores:** Grupos (Tamaño, Extras), selección única/múltiple, precio adicional, obligatorios/opcionales, prefijos (Add, No, Extra).

---

## Fortalezas Nexo vs Odoo

| Fortaleza | Nexo | Odoo |
|-----------|:----:|:----:|
| IA Conversacional (WhatsApp/Telegram) | ✅ | ❌ |
| Walk-in Flow | ✅ | ❌ |
| Vista 360° Cliente | ✅ | Parcial |
| Escaneo GS1-128 con lotes/NS | ✅ | Parcial |
| Reservas de stock atómicas | ✅ | ❌ |
| Dark Mode nativo | ✅ | ❌ |
| Pantalla cliente (sin IoT) | ✅ | ❌ |
| Pago Split, Cupones, Promociones | ✅ | ✅ |
| Lealtad, Combos, Modificadores | ✅ | ✅ |

---

## Arquitectura Técnica

### Rate Limiting - RESUELTO
POS físico no necesita reservas durante el carrito. Backend valida stock y reserva atómicamente al confirmar venta (`FOR UPDATE SKIP LOCKED`). Cache local de precios 5min.

### Estructura de Archivos

```
frontend/src/
├── pages/pos/
│   ├── VentaPOSPage.jsx        # Principal + broadcast
│   ├── PromocionesPage.jsx     # CRUD promociones
│   └── CustomerDisplayPage.jsx # Display cliente
├── components/pos/             # 12 componentes
└── hooks/
    ├── usePOS.js, useCupones.js, usePromociones.js
    ├── useLealtad.js, useCombosModificadores.js
    └── usePOSBroadcast.js      # BroadcastChannel

backend/app/modules/pos/
├── controllers/                # 6 controllers
├── models/                     # 6 models
├── routes/pos.js
└── schemas/pos.schemas.js

sql/pos/
├── 07-sesiones-caja.sql
├── 08-venta-pagos.sql, 08-credito-cliente.sql
├── 09-cupones.sql, 10-promociones.sql
├── 11-programa-lealtad.sql
└── 12-combos-modificadores.sql
```

---

## Próximos Pasos

| Prioridad | Funcionalidad | Notas |
|-----------|---------------|-------|
| **Alta** | Revisión detallada POS | Probar todos los tipos de promociones, validar puntos de lealtad, flujo completo de venta |
| Media | Tarjetas de regalo | Gift cards |
| Media | Impresoras térmicas | ESC/POS nativo |
| Media | Crear producto desde POS | Modal rápido |
| Baja | Modo restaurante | Gestión de mesas |
| Baja | PWA Offline | Sincronizar al reconectar |

---

*Documento actualizado: 11 Enero 2026*
