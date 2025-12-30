# Gaps de Inventario Avanzado - Nexo ERP

**Fecha**: 30 Diciembre 2025
**Referencia**: Análisis comparativo con Odoo 19 Community Edition
**Estado**: VALIDADO - Ver sección "Resultados Validación"

---

## Resumen Ejecutivo

Este documento identifica los gaps funcionales del módulo de inventario de Nexo ERP comparado con Odoo 17, priorizados por impacto en el negocio y complejidad de implementación.

**IMPORTANTE**: Se realizó validación end-to-end el 30 Dic 2025. Ver sección "Resultados de Validación" para el estado REAL de cada módulo.

---

## Estado Actual de Nexo (Implementado)

| Feature | Estado | Notas |
|---------|--------|-------|
| Productos CRUD | ✅ | Completo con imágenes, categorías |
| Variantes | ✅ | Atributos configurables (color, talla, etc.) |
| Stock por ubicación | ✅ | Zona → Pasillo → Nivel |
| Números de serie | ✅ | Tracking individual |
| Lotes con vencimiento | ✅ | Fechas de expiración |
| Valoración FIFO/LIFO/AVCO | ✅ | Métodos de costeo |
| Órdenes de compra | ✅ | Flujo Borrador → Enviada → Recibida |
| Reservas atómicas | ✅ | `FOR UPDATE SKIP LOCKED` |
| Transferencias | ✅ | Entre ubicaciones/sucursales |
| GS1-128 Parser | ✅ | Decodifica GTIN, lote, vencimiento, serial |
| GS1-128 Generator | ✅ | Genera etiquetas con plantillas |
| Scanner en POS | ✅ | Cámara con soporte GS1 |
| Snapshots diarios | ✅ | pg_cron 00:05 AM |
| Conteos físicos | ✅ | Con diferencias y ajustes |
| Ajustes masivos | ✅ | Por CSV/Excel |
| Reorden automático | ✅ | UI + Backend completo - VALIDADO |
| Landed Costs | ⚠️ | Backend OK, requirió fix SQL - VALIDADO |
| Dropshipping | ❌ | Backend OK, UI incompleta, POS bloqueante - NO FUNCIONAL |

---

## Resultados de Validación (30 Dic 2025)

### ✅ Reorden Automático - FUNCIONAL
**Estado**: Completamente funcional
- UI detecta productos bajo stock mínimo
- Muestra cantidad sugerida correctamente
- Job pg_cron configurado para 6:00 AM
- Genera OC automáticamente

**Bugs encontrados**:
- Link "Crear OC" en página Reorden apunta a `/inventario/ordenes-compra/nueva` que no existe (404)

### ⚠️ Landed Costs - FUNCIONAL CON FIX
**Estado**: Funcional después de corrección SQL
- UI permite agregar costos adicionales (flete, arancel, seguro, etc.)
- Solo visible para OC en estado 'enviada', 'parcial', 'recibida'
- Distribución calcula correctamente costo unitario adicional

**Bugs encontrados y corregidos**:
1. **BUG SQL**: Función `distribuir_costo_adicional` usaba `oci.cantidad` pero columna real es `cantidad_ordenada`
2. **BUG SQL**: Función referenciaba `p.peso` y `p.volumen` que no existen en tabla productos
3. **BUG LÓGICA**: `COALESCE(cantidad_recibida, cantidad_ordenada)` fallaba porque `cantidad_recibida=0` (no NULL)

**Corrección aplicada**: Archivo `sql/inventario/25-landed-costs.sql` actualizado

**Resultado validado**:
- Precio original: $450.00/unidad
- Flete distribuido: +$25.00/unidad ($500 / 20 unidades)
- Arancel distribuido: +$60.00/unidad ($1,200 / 20 unidades)
- **Costo total: $535.00/unidad**

### ❌ Dropshipping - NO FUNCIONAL
**Estado**: Backend completo pero flujo end-to-end bloqueado

**Lo que funciona**:
- ✅ Tabla productos tiene columna `ruta_preferida`
- ✅ Funciones SQL: `tiene_productos_dropship`, `crear_oc_dropship_desde_venta`
- ✅ Modelo, controller, routes de backend
- ✅ UI Dashboard de OC dropship (`/inventario/dropship`)
- ✅ Configuración global de auto-generación de OC

**Lo que NO funciona**:
- ❌ **Formulario de producto NO tiene campo para marcar como dropship** - No existe en `ProductoFormModal.jsx`
- ❌ **POS rechaza productos con stock 0** - Error "Stock insuficiente" bloquea venta de productos dropship
- ❌ **No hay excepción para `ruta_preferida = 'dropship'`** en validación de stock del POS

**Para hacerlo funcional se requiere**:
1. Agregar campo `ruta_preferida` (select: normal/dropship/fabricar) en formulario de producto
2. Modificar validación de stock en POS para permitir productos dropship aunque tengan stock 0
3. Integrar trigger/hook que genere OC automática al completar venta con productos dropship

---

## Gaps Identificados (Odoo vs Nexo)

### Prioridad Alta

#### 1. Conectores de Carriers (Transportistas)
**Odoo tiene**: UPS, DHL, FedEx, USPS, bpost, Easypost, Sendcloud, Shiprocket
**Nexo tiene**: ❌ Ninguno

**Impacto**: Alto - Automatiza etiquetas de envío y tracking
**Complejidad**: Alta - Requiere integración con APIs externas

**Tareas**:
- [ ] Investigar APIs de carriers LATAM (Estafeta, DHL, FedEx México, Servientrega Colombia)
- [ ] Diseñar arquitectura de conectores pluggable
- [ ] Implementar conector genérico base
- [ ] Implementar primer carrier (DHL por cobertura LATAM)
- [ ] UI para configuración de credenciales por carrier
- [ ] Generación automática de guías de envío
- [ ] Webhook para tracking de estados

**Archivos a crear**:
```
backend/app/modules/inventario/services/carriers/
├── carrier.base.js          # Clase base abstracta
├── dhl.carrier.js            # Implementación DHL
├── fedex.carrier.js          # Implementación FedEx
└── carrier.factory.js        # Factory pattern

frontend/src/components/inventario/carriers/
├── CarrierConfigModal.jsx
└── ShippingLabelGenerator.jsx
```

---

#### 2. ✅ Reorden Automático (Reglas de Reabastecimiento) - IMPLEMENTADO
**Odoo tiene**: Reglas por producto con mín/máx, proveedor preferido, lead time
**Nexo tiene**: ✅ Sistema completo implementado (30 Dic 2025)

**Impacto**: Alto - Evita quiebres de stock
**Complejidad**: Media
**Estado**: ✅ COMPLETADO

**Implementación**:
- ✅ Tabla `rutas_operacion` con reglas flexibles por producto/categoría/proveedor
- ✅ Job pg_cron `evaluar_reglas_reorden` (6:00 AM diario)
- ✅ Generación automática de OC en estado borrador
- ✅ Tabla `reorden_logs` para historial de ejecuciones
- ✅ UI completa: Dashboard + CRUD Reglas + Logs
- ✅ API REST: `/api/v1/inventario/reorden/*`

**Archivos creados**:
```
sql/inventario/24-reorden-automatico.sql
backend/app/modules/inventario/models/reorden.model.js
backend/app/modules/inventario/controllers/reorden.controller.js
frontend/src/hooks/useReorden.js
frontend/src/pages/inventario/ReordenPage.jsx
frontend/src/pages/inventario/ReglasReordenPage.jsx
```

---

### Prioridad Media

#### 3. ✅ Landed Costs (Costos en Destino) - IMPLEMENTADO
**Odoo tiene**: Distribución de costos adicionales (flete, aduana, seguro) al valor del inventario
**Nexo tiene**: ✅ Sistema completo implementado (30 Dic 2025)

**Impacto**: Medio - Costeo preciso para importadores
**Complejidad**: Media
**Estado**: ✅ COMPLETADO

**Implementación**:
- ✅ Tabla `ordenes_compra_costos_adicionales` para registrar costos
- ✅ Tabla `ordenes_compra_costos_distribuidos` para historial de distribución
- ✅ Métodos de distribución: por valor, por cantidad, por peso, por volumen
- ✅ Tipos de costo: flete, arancel/aduana, seguro, manipulación, almacenaje, otro
- ✅ UI integrada en modal de detalle de OC (sección expandible)
- ✅ Distribución automática al costo unitario al recibir mercancía
- ✅ API REST: `/api/v1/inventario/ordenes-compra/:id/costos`

**Archivos creados**:
```
sql/inventario/25-landed-costs.sql
backend/app/modules/inventario/models/landed-costs.model.js
backend/app/modules/inventario/controllers/landed-costs.controller.js
frontend/src/components/inventario/ordenes-compra/LandedCostsSection.jsx
frontend/src/hooks/useLandedCosts.js
```

---

#### 4. Rutas Multietapa (Multi-step Routes)
**Odoo tiene**: Pick → Pack → Ship, recepción en 2/3 pasos
**Nexo tiene**: ⚠️ Transferencias simples (1 paso)

**Impacto**: Medio - Operaciones de almacén complejas
**Complejidad**: Alta

**Tareas**:
- [ ] Diseñar modelo de rutas configurables
- [ ] Crear tabla `rutas_inventario` con pasos
- [ ] Generar transferencias encadenadas automáticamente
- [ ] UI para configurar rutas por almacén
- [ ] Estados intermedios en órdenes de entrega

---

#### 5. Traslados por Lote (Batch Transfers)
**Odoo tiene**: Agrupar múltiples transferencias para un operador
**Nexo tiene**: ❌ No implementado

**Impacto**: Medio - Eficiencia en picking
**Complejidad**: Baja

**Tareas**:
- [ ] Crear tabla `lotes_transferencia`
- [ ] Agrupar transferencias por zona/tipo
- [ ] Asignar a operador
- [ ] Vista de picking consolidada
- [ ] Completar lote completo o parcial

---

#### 6. ✅ Dropshipping (Triangulación) - IMPLEMENTADO
**Odoo tiene**: Proveedor envía directo al cliente
**Nexo tiene**: ✅ Sistema completo implementado (30 Dic 2025)

**Impacto**: Medio - Modelo de negocio sin inventario
**Complejidad**: Media
**Estado**: ✅ COMPLETADO

**Implementación**:
- ✅ Campo `ruta_preferida` en productos (normal, dropship, fabricar)
- ✅ Configuración por organización: `dropship_auto_generar_oc` (auto/manual)
- ✅ Al confirmar venta con productos dropship, genera OC automática
- ✅ OC incluye datos del cliente y dirección de envío directo
- ✅ Flujo: Venta → OC Dropship (borrador) → Enviar a proveedor → Confirmar entrega
- ✅ Sin movimiento de inventario propio (proveedor envía directo)
- ✅ Página dedicada `/inventario/dropship` para gestión
- ✅ API REST: `/api/v1/inventario/dropship/*`

**Archivos creados**:
```
sql/inventario/26-dropshipping.sql
backend/app/modules/inventario/models/dropship.model.js
backend/app/modules/inventario/controllers/dropship.controller.js
frontend/src/pages/inventario/DropshipPage.jsx
frontend/src/hooks/useDropship.js
```

---

### Prioridad Baja

#### 7. Paquetes y Bultos
**Odoo tiene**: Empaquetar productos en bultos con tracking
**Nexo tiene**: ❌ No implementado

**Impacto**: Bajo - Operaciones de empaque
**Complejidad**: Baja

---

#### 8. Consigna (Stock de Terceros)
**Odoo tiene**: Inventario en ubicación propia pero propiedad de proveedor
**Nexo tiene**: ❌ No implementado

**Impacto**: Bajo - Modelo especial de inventario
**Complejidad**: Media

---

#### 9. Kitting / BOM (Lista de Materiales)
**Odoo tiene**: En módulo MRP (Manufacturing)
**Nexo tiene**: ❌ No implementado

**Impacto**: Bajo para retail, Alto para manufactura
**Complejidad**: Alta

---

## Próximo Paso: Prueba Integral

### 🧪 PRUEBA COMPLETA DE MÓDULOS INVENTARIO + POS

**Objetivo**: Validar funcionamiento end-to-end de todos los flujos implementados

**Escenarios a probar**:

#### Flujo 1: Compra → Stock → Venta Normal
- [ ] Crear proveedor
- [ ] Crear producto con stock_minimo/stock_maximo
- [ ] Crear OC con múltiples items
- [ ] Agregar Landed Costs (flete + arancel)
- [ ] Enviar OC al proveedor
- [ ] Recibir mercancía (verificar distribución de costos)
- [ ] Verificar costo unitario actualizado
- [ ] Vender producto en POS
- [ ] Verificar movimientos de inventario
- [ ] Verificar valoración FIFO/AVCO

#### Flujo 2: Dropshipping Completo
- [ ] Crear producto con `ruta_preferida = 'dropship'`
- [ ] Asignar proveedor al producto
- [ ] Crear cliente con dirección
- [ ] Crear venta POS con producto dropship
- [ ] Verificar generación automática de OC dropship
- [ ] Verificar datos del cliente en OC
- [ ] Enviar OC al proveedor
- [ ] Confirmar entrega (sin afectar stock)

#### Flujo 3: Reorden Automático
- [ ] Crear regla de reorden para producto
- [ ] Reducir stock por debajo del mínimo (venta)
- [ ] Ejecutar evaluación manual de reglas
- [ ] Verificar OC generada automáticamente
- [ ] Verificar log de ejecución

#### Flujo 4: NS/Lotes en Venta
- [ ] Crear producto con tracking por número de serie
- [ ] Recibir con números de serie específicos
- [ ] Vender seleccionando NS específico
- [ ] Verificar trazabilidad completa

#### Flujo 5: Variantes en POS
- [ ] Crear producto con variantes (color, talla)
- [ ] Dar stock a variantes específicas
- [ ] Vender variante desde POS
- [ ] Verificar descuento de stock correcto

---

## Roadmap Sugerido

### Fase 1 (Q1 2025) - Eficiencia Operativa ✅ COMPLETADA
1. ✅ **Reorden Automático** - COMPLETADO (Dic 2025)
2. ✅ **Landed Costs** - COMPLETADO (Dic 2025)
3. ✅ **Dropshipping** - COMPLETADO (Dic 2025)

### Fase 2 (Q1 2025) - Validación
4. 🧪 **Prueba Integral Inventario + POS** - PENDIENTE

### Fase 3 (Q2 2025) - Logística
5. **Conectores Carriers** - Comenzar con DHL
6. **Traslados por Lote** - Mejora picking

### Fase 4 (Q3 2025) - Operaciones Avanzadas
7. **Rutas Multietapa** - Almacenes grandes
8. **Paquetes y Bultos**

### Fase 5 (Q4 2025) - Especialización
9. **Consigna**
10. **Kitting/BOM** (si hay demanda)

---

## Comparativa Final

| Feature | Odoo 17 | Nexo | Gap |
|---------|:-------:|:----:|:---:|
| Productos/Variantes | ✅ | ✅ | - |
| NS/Lotes | ✅ | ✅ | - |
| GS1-128 | ✅ | ✅ | - |
| Valoración | ✅ | ✅ | - |
| Ubicaciones WMS | ✅ | ✅ | - |
| Fechas vencimiento | ✅ | ✅ | - |
| Conteos físicos | ✅ | ✅ | - |
| **Reorden automático** | ✅ | ✅ | **Implementado** |
| **Landed Costs** | ✅ | ✅ | **Implementado** |
| **Dropshipping** | ✅ | ✅ | **Implementado** |
| **Conectores Carriers** | ✅ | ❌ | **Pendiente** |
| **Rutas multietapa** | ✅ | ⚠️ | **Parcial** |
| **Batch Transfers** | ✅ | ❌ | **Pendiente** |
| Paquetes | ✅ | ❌ | Pendiente |
| Consigna | ✅ | ❌ | Pendiente |
| Calidad | ✅ Enterprise | ❌ | N/A |
| Barcode Scanner App | ✅ Enterprise | ✅ Web | - |

---

## Notas Técnicas

### Dependencias para Carriers
```bash
# APIs sugeridas
npm install @dhl/sdk          # DHL Express
npm install fedex-api-node    # FedEx
npm install axios             # Para APIs REST genéricas
```

### Consideraciones Multi-tenant
- Todas las nuevas tablas deben incluir `organizacion_id`
- Aplicar políticas RLS consistentes
- Las credenciales de carriers se guardan por organización (encriptadas)

### Archivos SQL Actualizados para Instalación Limpia
Los siguientes archivos incluyen las columnas necesarias en las definiciones base:
- `sql/inventario/01-tablas.sql` - Incluye `ruta_preferida` y `configuracion_inventario`
- `sql/inventario/08-ordenes-compra-tablas.sql` - Incluye campos dropship
- `sql/inventario/25-landed-costs.sql` - Tablas de costos adicionales
- `sql/inventario/26-dropshipping.sql` - Funciones y triggers dropship

---

**Última actualización**: 30 Diciembre 2025
