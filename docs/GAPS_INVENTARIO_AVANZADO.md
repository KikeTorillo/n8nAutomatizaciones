# Gaps de Inventario Avanzado - Nexo ERP

**Última actualización**: 30 Diciembre 2025

---

## Estado Actual

| Feature | Estado | Notas |
|---------|:------:|-------|
| Productos/Variantes | ✅ | Atributos configurables, stock independiente |
| Stock por ubicación | ✅ | Zona → Pasillo → Nivel (WMS) |
| Números de serie/Lotes | ✅ | Tracking individual, vencimientos |
| Valoración FIFO/LIFO/AVCO | ✅ | Métodos de costeo |
| Órdenes de compra | ✅ | Borrador → Enviada → Recibida |
| Reservas atómicas | ✅ | `FOR UPDATE SKIP LOCKED` |
| GS1-128 | ✅ | Parser + Generator + Scanner POS |
| Conteos físicos | ✅ | Diferencias y ajustes |
| **Reorden automático** | ✅ | Reglas + pg_cron 6AM + OC auto |
| **Landed Costs** | ✅ | Prorrateo por valor/peso/cantidad/volumen |
| **Peso/Volumen productos** | ✅ | Columnas `peso`, `volumen` en tabla productos |
| **Dropshipping** | ✅ | Venta sin stock → OC al proveedor |
| **Venta NS en POS** | ✅ | Selección NS + trazabilidad automática |
| **Venta Variantes en POS** | ✅ | Stock independiente por variante |

---

## Validación Integral Completada (30 Dic 2025)

### Escenarios Validados

| # | Escenario | Estado | Resultado |
|---|-----------|:------:|-----------|
| 1 | Compra → Stock → Venta con Landed Costs | ✅ | Prorrateo correcto por valor/peso/cantidad |
| 2 | Dropshipping completo | ✅ | OC automática con datos de cliente |
| 3 | Reorden automático | ✅ | Reglas + evaluación + OC generadas |
| 4 | NS/Lotes en venta | ✅ | `numero_serie_id` guardado, NS → vendido |
| 5 | Variantes en POS | ✅ | `variante_id` guardado, stock reducido |

### Fixes Aplicados

| Archivo | Problema | Solución |
|---------|----------|----------|
| `backend/app/modules/pos/schemas/pos.schemas.js` | Joi filtraba campos NS/reserva | Agregados `numero_serie_id`, `numero_serie`, `reserva_id` |
| `backend/app/modules/pos/models/ventas.model.js` | Doble marcado NS causaba error | Removida llamada duplicada a `vender_numero_serie()` (trigger lo maneja) |

### Ventas de Prueba

- **POS-2025-0008**: Venta con NS HP-PB450-SN001 → NS marcado como 'vendido'
- **POS-2025-0009**: Venta variante Negro/M → Stock reducido de 20 a 19

---

## Gaps Pendientes vs Odoo

### Prioridad Alta

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| **Conectores Carriers** | DHL, FedEx, Estafeta - etiquetas automáticas | Alta |

### Prioridad Media

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| Rutas Multietapa | Pick → Pack → Ship | Alta |
| Traslados por Lote | Agrupar transfers para picking | Baja |

### Prioridad Baja

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| Paquetes/Bultos | Empaque con tracking | Baja |
| Consigna | Stock de terceros en ubicación propia | Media |
| Kitting/BOM | Lista de materiales (manufactura) | Alta |

---

## Archivos Principales

```
sql/inventario/
├── 24-reorden-automatico.sql    # Reglas + job pg_cron
├── 25-landed-costs.sql          # Costos adicionales OC
└── 26-dropshipping.sql          # Flujo dropship

backend/app/modules/inventario/
├── models/reorden.model.js
├── models/landed-costs.model.js
├── models/dropship.model.js
└── controllers/*.controller.js

backend/app/modules/pos/
├── schemas/pos.schemas.js       # Validación con NS/variantes
└── models/ventas.model.js       # Lógica de venta POS

frontend/src/
├── pages/inventario/ReordenPage.jsx
├── pages/inventario/DropshipPage.jsx
├── pages/pos/VentaPOSPage.jsx
├── components/pos/SeleccionarNSModal.jsx
├── components/inventario/ordenes-compra/LandedCostsSection.jsx
└── hooks/use{Reorden,LandedCosts,Dropship,NumerosSerie}.js
```

---

## Roadmap

| Fase | Alcance | Estado |
|------|---------|:------:|
| 1 | Reorden, Landed Costs, Dropshipping | ✅ |
| 2 | Validación integral flujos | ✅ |
| 3 | Conectores Carriers (DHL) | **Próxima** |
| 4 | Rutas multietapa, Batch transfers | Pendiente |

---

## Próxima Sesión

### Conectores de Carriers

**Objetivo**: Integrar generación automática de etiquetas de envío

**Carriers prioritarios**:
1. **Estafeta** - México
2. **DHL Express** - Internacional
3. **FedEx** - Internacional

**Funcionalidades**:
- Cotización de envío en tiempo real
- Generación de guías/etiquetas
- Tracking automático
- Notificaciones al cliente
