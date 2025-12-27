# Comparativa Detallada: Inventario Nexo vs Odoo 18

> **Fecha**: 27 Diciembre 2025
> **Versiones**: Nexo ERP v1.0 | Odoo 18.0

---

## Resumen Ejecutivo

| Aspecto | Nexo | Odoo | Veredicto |
|---------|------|------|-----------|
| **Productos** | Completo | Muy completo | Odoo +variantes |
| **Ubicaciones/WMS** | Básico (4 niveles) | Avanzado (n niveles) | Odoo más flexible |
| **Órdenes Compra** | Completo con workflows | Completo con RFQ | Similar |
| **Trazabilidad** | NS + Lotes | NS + Lotes + Expiraciones | Similar |
| **Reabastecimiento** | Alertas + Auto-OC | Reglas + Dashboard + MTO/MTS | Odoo más sofisticado |
| **Valoración** | FIFO/AVCO/Promedio | Standard/FIFO/AVCO | Similar |
| **Multi-almacén** | Por sucursal | Por almacén con rutas | Odoo más flexible |
| **Reportes** | Básicos | Muy completos | Odoo superior |

---

## 1. Gestión de Productos

### 1.1 Tipos de Productos

| Característica | Nexo | Odoo |
|----------------|------|------|
| Productos almacenables | ✅ `productos` | ✅ Storable |
| Consumibles | ❌ No diferenciado | ✅ Consumable |
| Servicios | ✅ Separado en `servicios` | ✅ Service |
| Diferenciación de tipo | Por flags (`permite_venta`, `permite_uso_servicio`) | Por campo `type` |

**Gap Nexo**: No hay tipo "consumible" que no requiera tracking de stock.

### 1.2 Variantes de Productos

| Característica | Nexo | Odoo |
|----------------|------|------|
| Variantes (color, talla) | ❌ No soportado | ✅ Completo |
| Atributos configurables | ❌ | ✅ Con valores múltiples |
| Creación dinámica | ❌ | ✅ Instant/Dynamic/Never |
| Precio por variante | ❌ | ✅ Extra price por atributo |

**Gap Nexo**: Sin sistema de variantes. Cada variante requiere producto separado.

### 1.3 Unidades de Medida

| Característica | Nexo | Odoo |
|----------------|------|------|
| UoM básicas | ✅ (unidad, kg, litro, caja) | ✅ Categorías completas |
| Conversión automática | ❌ Manual | ✅ Automática |
| UoM compra vs venta | ❌ Una sola | ✅ Separadas |
| Categorías de UoM | ❌ | ✅ (Length, Weight, Volume, etc.) |

**Gap Nexo**: No hay conversión automática entre unidades.

### 1.4 Precios

| Característica | Nexo | Odoo |
|----------------|------|------|
| Precio compra/venta | ✅ | ✅ |
| Multi-moneda | ✅ (MXN, COP, USD) | ✅ |
| Listas de precios | ✅ `listas_precios` | ✅ Pricelists |
| Reglas de precio | ❌ Básico | ✅ Avanzadas (%, fijo, fórmula) |

**Nexo OK**: Multi-moneda bien implementado.

### 1.5 Campos del Producto

| Campo | Nexo | Odoo |
|-------|------|------|
| SKU | ✅ | ✅ Internal Reference |
| Código de barras | ✅ | ✅ + múltiples |
| Categoría jerárquica | ✅ | ✅ |
| Imagen | ✅ Una | ✅ Múltiples |
| Peso/Volumen | ❌ | ✅ |
| Responsable | ❌ | ✅ |
| Notas internas | ✅ | ✅ |

---

## 2. Gestión de Almacén (WMS)

### 2.1 Estructura de Ubicaciones

| Característica | Nexo | Odoo |
|----------------|------|------|
| Jerarquía | ✅ 4 niveles fijos (zona→pasillo→estante→bin) | ✅ N niveles flexibles |
| Tipos de ubicación | ✅ (picking, recepción, despacho, cuarentena) | ✅ + View, Vendor, Customer, Transit |
| Ubicaciones virtuales | ❌ | ✅ (Vendor, Customer, Scrap) |
| Path automático | ✅ `path_completo` | ✅ `complete_name` |

**Gap Nexo**: Jerarquía rígida de 4 niveles. Odoo permite cualquier profundidad.

### 2.2 Multi-Almacén

| Característica | Nexo | Odoo |
|----------------|------|------|
| Múltiples almacenes | ✅ Por `sucursal_id` | ✅ Warehouses independientes |
| Stock por ubicación | ✅ `stock_ubicaciones` | ✅ `stock.quant` |
| Transferencias entre almacenes | ⚠️ Básico | ✅ Con ubicación Transit |
| Rutas configurables | ❌ | ✅ Push/Pull rules |

**Gap Nexo**: Sin rutas configurables ni ubicaciones de tránsito.

### 2.3 Capacidades y Restricciones

| Característica | Nexo | Odoo |
|----------------|------|------|
| Capacidad máxima | ✅ | ✅ Storage Categories |
| Peso máximo | ✅ | ✅ |
| Volumen | ✅ | ✅ |
| Control de temperatura | ✅ (min/max) | ⚠️ Via campos custom |
| Humedad controlada | ✅ | ⚠️ Via campos custom |

**Nexo OK**: Buen control de condiciones ambientales.

### 2.4 Reglas de Almacenamiento

| Característica | Nexo | Odoo |
|----------------|------|------|
| Putaway rules | ❌ | ✅ Por producto/categoría |
| Removal strategies | ❌ | ✅ FIFO/LIFO/FEFO |
| Estrategia por ubicación | ❌ | ✅ Closest location |

**Gap Nexo**: Sin reglas automáticas de ubicación.

---

## 3. Operaciones de Stock

### 3.1 Tipos de Movimientos

| Tipo | Nexo | Odoo |
|------|------|------|
| Entrada compra | ✅ `entrada_compra` | ✅ Receipt |
| Salida venta | ✅ `salida_venta` | ✅ Delivery |
| Ajuste | ✅ `entrada_ajuste`, `salida_ajuste` | ✅ Inventory Adjustment |
| Devolución cliente | ✅ `entrada_devolucion` | ✅ Return |
| Devolución proveedor | ✅ `salida_devolucion` | ✅ Return to Vendor |
| Merma | ✅ `salida_merma` | ✅ Scrap |
| Robo | ✅ `salida_robo` | ⚠️ Via Inventory Loss |
| Transferencia interna | ⚠️ Básico | ✅ Internal Transfer |
| Uso en servicio | ✅ `salida_uso_servicio` | ⚠️ Via Manufacturing |

**Nexo OK**: Buenos tipos de movimiento específicos para el negocio.

### 3.2 Flujos de Recepción

| Pasos | Nexo | Odoo |
|-------|------|------|
| 1 paso (directo a stock) | ✅ | ✅ |
| 2 pasos (input → stock) | ❌ | ✅ |
| 3 pasos (input → QC → stock) | ❌ | ✅ |

**Gap Nexo**: Solo flujo de 1 paso. Sin zona de recepción ni QC.

### 3.3 Flujos de Despacho

| Pasos | Nexo | Odoo |
|-------|------|------|
| 1 paso (directo) | ✅ | ✅ |
| 2 pasos (pick → ship) | ❌ | ✅ |
| 3 pasos (pick → pack → ship) | ❌ | ✅ |

**Gap Nexo**: Sin proceso de picking/packing separado.

### 3.4 Operaciones Especiales

| Operación | Nexo | Odoo |
|-----------|------|------|
| Cross-dock | ❌ | ✅ |
| Dropshipping | ❌ | ✅ |
| Consignment | ❌ | ✅ |
| Wave picking | ❌ | ✅ |
| Batch transfers | ❌ | ✅ |

**Gap Nexo**: Sin operaciones avanzadas de logística.

---

## 4. Órdenes de Compra

### 4.1 Ciclo de Vida

| Estado | Nexo | Odoo |
|--------|------|------|
| Borrador | ✅ `borrador` | ✅ Draft/RFQ |
| Pendiente aprobación | ✅ `pendiente_aprobacion` | ✅ To Approve |
| Enviada/Confirmada | ✅ `enviada` | ✅ Purchase Order |
| Parcialmente recibida | ✅ `parcial` | ✅ (calculado) |
| Completamente recibida | ✅ `recibida` | ✅ Done |
| Cancelada | ✅ `cancelada` | ✅ Cancelled |

**Similar**: Ambos tienen ciclo completo.

### 4.2 Funcionalidades

| Característica | Nexo | Odoo |
|----------------|------|------|
| Folio automático | ✅ (OC-YYYY-####) | ✅ (PO00001) |
| Múltiples items | ✅ | ✅ |
| Recepción parcial | ✅ | ✅ |
| Historial de recepciones | ✅ `ordenes_compra_recepciones` | ✅ |
| Días de crédito | ✅ | ✅ Payment Terms |
| Descuentos | ✅ % y monto | ✅ % por línea |
| Impuestos | ✅ Global | ✅ Por línea |
| Workflows aprobación | ✅ Integrado | ✅ Via Studio/custom |
| RFQ (solicitud cotización) | ❌ | ✅ |
| Múltiples proveedores por producto | ❌ Uno por producto | ✅ Vendor Pricelist |

**Gap Nexo**: Sin RFQ ni múltiples proveedores por producto.

### 4.3 Auto-Generación

| Característica | Nexo | Odoo |
|----------------|------|------|
| Desde alerta stock bajo | ✅ `generarDesdeAlerta()` | ✅ Desde Replenishment |
| Automática por regla | ✅ `auto_generar_oc` flag | ✅ Reordering Rules |
| Agrupación por proveedor | ✅ | ✅ |
| Cantidad sugerida | ✅ `cantidad_oc_sugerida` | ✅ Max - Forecasted |

**Similar**: Ambos tienen auto-generación.

---

## 5. Trazabilidad

### 5.1 Números de Serie

| Característica | Nexo | Odoo |
|----------------|------|------|
| Tracking individual | ✅ | ✅ |
| Estados del ciclo de vida | ✅ (disponible, reservado, vendido, etc.) | ⚠️ Básico |
| Historial de movimientos | ✅ `numeros_serie_historial` | ✅ |
| Garantía | ✅ (fechas inicio/fin) | ⚠️ Via campos custom |
| Búsqueda rápida | ✅ | ✅ |

**Nexo OK**: Mejor gestión de garantías.

### 5.2 Lotes

| Característica | Nexo | Odoo |
|----------------|------|------|
| Tracking por lote | ✅ Campo `lote` | ✅ Objeto separado |
| Fecha vencimiento | ✅ | ✅ |
| Múltiples productos por lote | ❌ | ✅ |
| Alertas vencimiento | ✅ `proximo_vencimiento`, `vencido` | ✅ |

**Gap Nexo**: Lote como campo, no como entidad independiente.

### 5.3 Fechas de Expiración

| Característica | Nexo | Odoo |
|----------------|------|------|
| Fecha expiración | ✅ | ✅ Expiration Date |
| Best before | ❌ | ✅ Best Before Date |
| Removal date | ❌ | ✅ Removal Date |
| Alert date | ✅ (7 días antes) | ✅ Configurable |

**Gap Nexo**: Sin fechas intermedias (best before, removal).

---

## 6. Reabastecimiento

### 6.1 Alertas vs Reglas de Reorden

| Característica | Nexo | Odoo |
|----------------|------|------|
| **Concepto** | Alertas reactivas | Reglas proactivas |
| **Trigger** | Stock actual <= mínimo | Stock proyectado < mínimo |
| **Proyección** | ❌ | ✅ Considera PO/SO/MO pendientes |
| **Dashboard** | ✅ Alertas | ✅ Replenishment Dashboard |
| **Desaparición automática** | ❌ Alerta persiste | ✅ Desaparece al crear PO |

**Gap Nexo**: No calcula stock proyectado. Alertas no se resuelven automáticamente.

### 6.2 Estrategias

| Estrategia | Nexo | Odoo |
|------------|------|------|
| MTS (Make to Stock) | ✅ Via alertas | ✅ Reordering Rules |
| MTO (Make to Order) | ❌ | ✅ |
| MPS (Master Production Schedule) | ❌ | ✅ |

**Gap Nexo**: Sin MTO ni MPS.

### 6.3 Parámetros

| Parámetro | Nexo | Odoo |
|-----------|------|------|
| Cantidad mínima | ✅ `stock_minimo` | ✅ Min Quantity |
| Cantidad máxima | ✅ `stock_maximo` | ✅ Max Quantity |
| Múltiplo de orden | ❌ | ✅ Multiple Quantity |
| Lead time | ❌ | ✅ |
| Visibility days | ❌ | ✅ |
| Safety stock | ❌ | ⚠️ Via mínimo |

**Gap Nexo**: Sin lead time ni visibility days.

---

## 7. Valoración de Inventario

### 7.1 Métodos de Costeo

| Método | Nexo | Odoo |
|--------|------|------|
| FIFO | ✅ `calcular_costo_fifo()` | ✅ |
| AVCO | ✅ `calcular_costo_avco()` | ✅ |
| Promedio simple | ✅ | ❌ |
| Standard (costo fijo) | ❌ | ✅ |

**Similar**: Ambos soportan los métodos principales.

### 7.2 Integración Contable

| Característica | Nexo | Odoo |
|----------------|------|------|
| Valoración automática | ⚠️ Cálculo disponible | ✅ Asientos automáticos |
| Cuentas configurables | ❌ | ✅ Por categoría |
| Stock Input Account | ❌ | ✅ |
| Stock Output Account | ❌ | ✅ |
| Stock Valuation Account | ❌ | ✅ |

**Gap Nexo**: Sin integración contable automática.

### 7.3 Reportes de Valoración

| Reporte | Nexo | Odoo |
|---------|------|------|
| Valor total inventario | ✅ | ✅ |
| Por producto | ✅ | ✅ |
| Por categoría | ⚠️ Básico | ✅ |
| Stock aging | ❌ | ✅ |
| Comparación métodos | ✅ `comparar_metodos_valoracion()` | ❌ |

**Nexo OK**: Buena comparación de métodos.

---

## 8. Reservas de Stock

| Característica | Nexo | Odoo |
|----------------|------|------|
| Reservas temporales | ✅ `reservas_stock` | ✅ Reservations |
| Expiración automática | ✅ `expira_en` + pg_cron | ✅ |
| Por origen (venta, cita) | ✅ `tipo_origen` | ✅ |
| Stock disponible calculado | ✅ `stock_disponible()` | ✅ Free Qty |
| Confirmar/Cancelar | ✅ | ✅ |

**Similar**: Ambos tienen buen sistema de reservas.

---

## 9. Reportes

### 9.1 Reportes Disponibles

| Reporte | Nexo | Odoo |
|---------|------|------|
| Kardex/Historial movimientos | ✅ | ✅ Moves History |
| Stock actual | ✅ | ✅ Stock Report |
| Stock proyectado | ❌ | ✅ Forecasted |
| Valoración | ✅ | ✅ |
| Rotación de productos | ✅ | ⚠️ Via análisis |
| Productos por vencer | ✅ | ✅ |
| Aging report | ❌ | ✅ |
| Dashboard ejecutivo alertas | ✅ | ⚠️ |

**Gap Nexo**: Sin forecast report ni aging report.

### 9.2 Conteo de Inventario

| Característica | Nexo | Odoo |
|----------------|------|------|
| Ajuste manual | ✅ `ajustarStock()` | ✅ |
| Conteo físico | ⚠️ Manual | ✅ Physical Inventory |
| Conteo cíclico | ❌ | ✅ Cycle Counts |
| Por ubicación | ⚠️ | ✅ |
| Programación | ❌ | ✅ |

**Gap Nexo**: Sin conteo cíclico programado.

---

## 10. Integraciones

### 10.1 Con Otros Módulos

| Integración | Nexo | Odoo |
|-------------|------|------|
| POS | ✅ Descuenta stock, NS | ✅ |
| Ventas | ⚠️ Básico | ✅ Completo |
| Compras | ✅ OC integrada | ✅ |
| Contabilidad | ⚠️ Manual | ✅ Automático |
| Manufactura | ❌ | ✅ MRP |
| Servicios/Citas | ✅ Uso de productos | ⚠️ Via Field Service |

### 10.2 Código de Barras

| Característica | Nexo | Odoo |
|----------------|------|------|
| Lectura en POS | ✅ | ✅ |
| Lectura en operaciones | ❌ | ✅ Barcode app |
| Múltiples códigos por producto | ❌ | ✅ |
| Generación | ❌ | ✅ |

**Gap Nexo**: Sin app de código de barras para operaciones.

---

## 11. Resumen de Gaps Críticos

### Alta Prioridad (Impacto en operaciones)

| Gap | Descripción | Complejidad |
|-----|-------------|-------------|
| **Stock proyectado** | No considera PO/SO pendientes en alertas | Media |
| **Flujos multi-paso** | Sin recepción/despacho en pasos | Alta |
| **Variantes de producto** | Cada variante es producto separado | Alta |
| **Conteo cíclico** | Sin programación de inventarios | Media |

### Media Prioridad (Mejoras operativas)

| Gap | Descripción | Complejidad |
|-----|-------------|-------------|
| **Putaway rules** | Sin asignación automática de ubicación | Media |
| **Lead times** | Sin tiempos de entrega en reabastecimiento | Baja |
| **RFQ** | Sin solicitudes de cotización | Media |
| **Múltiples proveedores** | Un proveedor por producto | Media |

### Baja Prioridad (Nice to have)

| Gap | Descripción | Complejidad |
|-----|-------------|-------------|
| **Cross-dock** | Operación avanzada | Alta |
| **Dropshipping** | Envío directo proveedor→cliente | Media |
| **Batch/Wave picking** | Optimización de picking | Alta |
| **Integración contable automática** | Asientos por movimiento | Alta |

---

## 12. Ventajas de Nexo sobre Odoo

| Ventaja | Descripción |
|---------|-------------|
| **Control ambiental** | Temperatura y humedad en ubicaciones |
| **Tipos de movimiento específicos** | Robo, merma, uso en servicio |
| **Garantías en NS** | Fechas inicio/fin de garantía |
| **Comparación de valoración** | Compara FIFO vs AVCO vs Promedio |
| **Alertas dashboard** | Vista ejecutiva de alertas por nivel |
| **Multi-moneda nativo** | MXN, COP, USD sin configuración |
| **Simplicidad** | Menos curva de aprendizaje |

---

## 13. Recomendaciones de Implementación

### Fase 1: Quick Wins (1-2 semanas)
1. **Stock proyectado en alertas** - Considerar OC pendientes
2. **Lead times en productos** - Campo para calcular fechas
3. **Conteo cíclico básico** - Programación por ubicación

### Fase 2: Mejoras Medianas (1-2 meses)
4. **Putaway rules** - Asignación automática
5. **Flujo de 2 pasos** - Zona de recepción/despacho
6. **Múltiples proveedores** - Vendor pricelist

### Fase 3: Mejoras Mayores (3+ meses)
7. **Variantes de producto** - Sistema de atributos
8. **Integración contable** - Asientos automáticos
9. **Barcode app** - Operaciones con escáner

---

## Conclusión

**Nexo ERP** tiene un módulo de inventario **funcional y bien implementado** para PyMEs, con características únicas como control ambiental y garantías de números de serie.

**Odoo** es más completo en funcionalidades avanzadas de logística (flujos multi-paso, variantes, putaway rules) pero con mayor complejidad.

**Recomendación**: Priorizar el **gap de stock proyectado** ya que es el más visible para usuarios y afecta directamente la operación de reabastecimiento.
