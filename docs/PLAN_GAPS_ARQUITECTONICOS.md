# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 28 Diciembre 2025
> **Auditoría Frontend**: ✅ Completada

---

## Estado General

| Fase | Estado | Validación UI |
|------|--------|---------------|
| Core (Auth, Usuarios, Orgs, Permisos, Multi-Moneda) | ✅ | ✅ Validado |
| Inventario (WMS, FIFO/AVCO, NS/Lotes, Rutas, Transferencias) | ✅ | ✅ Validado |
| POS (Venta, Carrito, NS/Lotes, Reportes) | ✅ | ✅ Validado |
| Agendamiento (Citas, Bloqueos, Recordatorios) | ✅ | ✅ Validado |
| Sucursales (CRUD, Dashboard, Transferencias) | ✅ | ✅ Validado |
| Órdenes Compra (Flujo Borrador→Enviada→Recibida) | ✅ | ✅ Validado |
| Webhooks, i18n, API Pública | ⬜ | - |

---

## Hallazgos Auditoría Frontend (28 Dic 2025)

### ✅ Funcionalidades Validadas

| Módulo | Funcionalidad | Estado |
|--------|---------------|--------|
| **Core** | Login, Trial 14 días, 16 módulos en dashboard | ✅ |
| **Permisos** | 86 permisos CRUD granular por categoría, límites numéricos ($, %) | ✅ |
| **Multi-Moneda** | 7 monedas (MXN/COP/USD activas), tasas de cambio, calculadora | ✅ |
| **Clientes** | CRUD, Walk-in, historial citas, marketing opt-in | ✅ |
| **Servicios** | Multi-servicio, precios multi-moneda, duración, profesionales asignados | ✅ |
| **Inventario** | Productos con NS/Lotes, códigos barras EAN, stock min/max, auto-OC | ✅ |
| **WMS** | Ubicaciones jerárquicas (Zona→Pasillo→Estante→Bin), control ambiental | ✅ |
| **Proveedores** | RFC, términos comerciales (crédito, entrega, monto mínimo) | ✅ |
| **Órdenes Compra** | Flujo Borrador→Enviada, tracking recepción, estadísticas | ✅ |
| **Agendamiento** | Multi-servicio, validación horarios profesional, estados cita | ✅ |
| **POS** | Búsqueda SKU/barcode, validación NS obligatorio, cliente opcional | ✅ |

### ⚠️ Datos Requeridos para Pruebas Completas

| Dato | Requerido Para | Estado |
|------|----------------|--------|
| Horarios de profesional | Crear citas | ❌ Sin configurar |
| Números de serie | Venta POS de productos serializados | ❌ Sin registrar |
| Recepción de OC | Generar movimientos inventario | Pendiente |

---

## Gaps Pendientes (Actualizados)

| Gap | Prioridad | Notas |
|-----|-----------|-------|
| 2FA/MFA | Alta | TOTP, SMS o email como segundo factor |
| ~~Permisos CRUD granular~~ | ~~Alta~~ | ✅ **YA IMPLEMENTADO** - 86 permisos con separación crear/ver/editar/eliminar |
| Auditoría de cambios | Media | Historial de modificaciones por registro |
| Contratos laborales | Media | Módulo HR básico (hr.contract) |
| API Keys por usuario | Baja | Tokens programáticos con scopes |

---

## Validación UI Completada

| Módulo | Estado | Notas |
|--------|--------|-------|
| ~~Aprobaciones (workflows OC)~~ | ✅ Validado | Flujo Borrador→Enviada visible, tracking productos |
| ~~Clientes (historial compras)~~ | ✅ Validado | Historial de citas, estadísticas por cliente |
| ~~Agendamiento (citas)~~ | ✅ Validado | Validación horarios funciona, requiere config profesional |

---

## Referencia Técnica

```
RLS: RLSContextManager.query(orgId, cb) | withBypass() solo JOINs
Permisos: catalogo → rol → usuario_sucursal (overrides)
Stock Proyectado: stock_actual + OC_pendientes - reservas_activas
Particionamiento: movimientos_inventario por mes (pg_cron)
```

| Métrica | Valor |
|---------|-------|
| Módulos backend | 20 |
| Permisos catálogo | 86 |
| Políticas RLS | 140+ |
| Tablas BD | 135+ |
| Monedas configuradas | 7 |

---

## Comparación Inventario: Nexo vs Odoo (28 Dic 2025)

> Análisis comparativo del módulo de inventario de Nexo ERP vs Odoo 19.0

### Resumen Ejecutivo

| Aspecto | Nexo ERP | Odoo |
|---------|----------|------|
| **Productos** | ✅ Completo + Variantes | ✅ Más maduro |
| **NS/Lotes** | ✅ Con 6 estados | ⚠️ Sin estados |
| **WMS** | ✅ 4 niveles + control ambiental | ⚠️ Requiere habilitar |
| **Valoración** | ✅ FIFO/AVCO/Simple | ✅ + Landed Costs |
| **OC Workflow** | ✅ Motor aprobaciones | ⚠️ No visible |
| **Carriers envío** | ❌ No tiene | ✅ 10+ (UPS, FedEx, DHL) |
| **Multi-tenant** | ✅ RLS nativo | ⚠️ Multi-company |

### Ventajas de Nexo (mantener/promocionar)

| Ventaja | Impacto | Detalle |
|---------|---------|---------|
| **Multi-tenant RLS** | Alto | 140+ políticas, aislamiento real BD |
| **Estados NS/Lotes** | Alto | Disponible, Reservado, Vendido, Defectuoso, Devuelto, En tránsito |
| **WMS control ambiental** | Alto | Temperatura, humedad por ubicación |
| **Workflow aprobaciones OC** | Alto | Motor configurable por montos |
| **Multi-moneda** | Alto | 7 divisas con conversión automática |
| **IA conversacional** | Alto | Diferenciador único vs Odoo |
| **Comparación FIFO vs AVCO** | Medio | Vista side-by-side |

### Gaps a Implementar (vs Odoo)

| Gap | Prioridad | Esfuerzo | Notas |
|-----|-----------|----------|-------|
| ~~Variantes de producto~~ | ~~Alta~~ | ~~Medio~~ | ✅ **IMPLEMENTADO** (28 Dic 2025) - Atributos, valores, generación automática |
| **Integraciones carriers** | Alta | Alto | UPS, FedEx, DHL, USPS - Odoo tiene 10+ |
| **Inventory at Date** | Media | Bajo | Snapshot histórico del inventario |
| **Chatter/historial cambios** | Media | Medio | Log visual de modificaciones por registro |
| **Manufacturing/BOM** | Baja | Alto | Bill of Materials para producción |
| **Batch/Wave picking** | Baja | Medio | Optimización de picking |

---

## Plan de Implementación: Gaps Inventario

### 1. Variantes de Producto ✅ COMPLETADO (28 Dic 2025)

> Sistema de atributos para gestionar variantes como color, talla, material.

**Estado**: Implementación completa con atributos dinámicos, generación automática de variantes y soporte en POS.

**Archivos creados:**
- `sql/inventario/20-variantes-producto.sql` - 4 tablas, RLS, datos iniciales
- `backend/app/modules/inventario/models/atributos.model.js`
- `backend/app/modules/inventario/models/variantes.model.js`
- `backend/app/modules/inventario/controllers/atributos.controller.js`
- `backend/app/modules/inventario/controllers/variantes.controller.js`
- `frontend/src/components/inventario/variantes/*.jsx`
- `frontend/src/hooks/useAtributos.js`, `useVariantes.js`

**⚠️ NOTA IMPORTANTE - Sistema de Reservas:**
Las variantes actualmente **no usan el sistema de reservas** de stock del POS. Esto se hizo porque el sistema de reservas valida contra `productos.stock_actual` y las variantes tienen stock independiente en `variantes_producto.stock_actual`.

**Riesgo**: En escenarios de alta concurrencia, podrían ocurrir sobre-ventas de variantes.

**Siguiente paso**: Implementar sistema de reservas para variantes (crear `reservas_variante_id` o modificar lógica existente).

---

### 2. Integraciones Carriers Envío (Prioridad: Alta)

> Integración con UPS, FedEx, DHL para cotización y tracking de envíos.

#### Fase 1: Arquitectura Base
- [ ] Crear tabla `carriers` (id, nombre, codigo, activo, configuracion_json)
- [ ] Crear tabla `carriers_credenciales` (id, carrier_id, org_id, api_key_encrypted, sandbox)
- [ ] Crear tabla `envios` (id, venta_id, carrier_id, tracking, estado, costo)
- [ ] Crear tabla `tarifas_envio` (id, carrier_id, origen, destino, peso_max, precio)
- [ ] Service base `CarrierAdapter` con interfaz común

#### Fase 2: Adaptadores por Carrier
- [ ] `UPSAdapter` - API REST UPS (cotización, crear envío, tracking)
- [ ] `FedExAdapter` - API REST FedEx
- [ ] `DHLAdapter` - API REST DHL Express
- [ ] `EnviaComAdapter` - Para LATAM (99minutos, Estafeta)
- [ ] Factory pattern para seleccionar adaptador

#### Fase 3: API Backend
- [ ] POST `/api/v1/envios/cotizar` - cotizar con múltiples carriers
- [ ] POST `/api/v1/envios/crear` - crear envío con carrier seleccionado
- [ ] GET `/api/v1/envios/:id/tracking` - obtener estado
- [ ] Webhook `/api/v1/webhooks/carriers/:carrier` - recibir updates
- [ ] GET `/api/v1/carriers` - listar carriers configurados

#### Fase 4: Frontend
- [ ] Página configuración carriers (credenciales por org)
- [ ] Componente `CotizadorEnvio` - mostrar opciones de carriers
- [ ] Vista tracking en detalle de venta
- [ ] Notificaciones de cambio de estado
- [ ] Impresión de etiquetas (PDF)

#### Fase 5: Flujo Completo
- [ ] Integrar cotización en checkout POS
- [ ] Generar envío automático al confirmar venta
- [ ] Trigger notificación cuando cambia estado
- [ ] Dashboard de envíos pendientes/en tránsito

**Archivos a crear:**
```
sql/envios/01-carriers.sql
sql/envios/02-envios.sql
backend/app/modules/envios/ (nuevo módulo)
backend/app/services/carriers/UPSAdapter.js
backend/app/services/carriers/FedExAdapter.js
backend/app/services/carriers/CarrierFactory.js
frontend/src/pages/configuracion/carriers/
frontend/src/components/envios/CotizadorEnvio.jsx
```

---

### 3. Inventory at Date (Prioridad: Media)

> Snapshot histórico del inventario para auditorías y reportes.

#### Fase 1: Modelo de Datos
- [ ] Crear tabla `inventario_snapshots` (id, org_id, fecha, generado_por)
- [ ] Crear tabla `inventario_snapshot_lineas` (snapshot_id, producto_id, ubicacion_id, cantidad, costo_unitario, valor_total)
- [ ] Índices por fecha y producto para consultas rápidas
- [ ] Política de retención (ej: 2 años)

#### Fase 2: Generación de Snapshots
- [ ] Job pg_cron diario para snapshot automático (medianoche)
- [ ] Función `generar_snapshot_inventario(org_id, fecha)`
- [ ] Endpoint manual POST `/api/v1/inventario/snapshots`
- [ ] Opción de snapshot antes de cierre contable

#### Fase 3: Consulta Histórica
- [ ] GET `/api/v1/inventario/at-date?fecha=YYYY-MM-DD`
- [ ] Si hay snapshot exacto → usar snapshot
- [ ] Si no hay → calcular desde movimientos (más lento)
- [ ] Cache de consultas frecuentes

#### Fase 4: Frontend
- [ ] Selector de fecha en reporte de inventario
- [ ] Comparación inventario actual vs fecha anterior
- [ ] Exportación a Excel con datos históricos
- [ ] Gráfica de evolución de stock por producto

**Archivos a modificar:**
```
sql/inventario/XX-snapshots.sql (nuevo)
backend/app/modules/inventario/services/snapshots.service.js
backend/app/modules/inventario/controllers/reportes.controller.js
frontend/src/pages/inventario/reportes/InventarioHistorico.jsx
```

---

### 4. Chatter/Historial de Cambios (Prioridad: Media)

> Log visual de modificaciones por registro estilo timeline.

#### Fase 1: Modelo de Datos
- [ ] Crear tabla `historial_cambios` (id, org_id, tabla, registro_id, usuario_id, tipo_cambio, cambios_json, created_at)
- [ ] Tipos: crear, actualizar, eliminar, estado_cambio
- [ ] `cambios_json`: { campo: { antes, despues } }
- [ ] Índices por tabla+registro_id para consultas rápidas

#### Fase 2: Trigger Automático
- [ ] Función PL/pgSQL `registrar_cambio()` genérica
- [ ] Triggers AFTER INSERT/UPDATE/DELETE en tablas principales:
  - productos, clientes, proveedores, ordenes_compra, citas, usuarios
- [ ] Excluir campos sensibles (passwords, tokens)
- [ ] Capturar usuario desde `current_setting('app.current_user_id')`

#### Fase 3: API Backend
- [ ] GET `/api/v1/historial/:tabla/:id` - historial de un registro
- [ ] GET `/api/v1/historial/usuario/:id` - actividad de un usuario
- [ ] GET `/api/v1/historial/reciente` - últimos cambios en org
- [ ] Paginación y filtros por fecha/tipo

#### Fase 4: Frontend
- [ ] Componente `HistorialCambios` reutilizable (timeline)
- [ ] Integrar en drawer/modal de detalle de registros
- [ ] Vista de actividad reciente en dashboard
- [ ] Filtros por usuario, tipo de cambio, rango de fechas
- [ ] Diff visual para cambios de texto largo

**Archivos a crear:**
```
sql/core/XX-historial-cambios.sql
backend/app/modules/core/controllers/historial.controller.js
backend/app/modules/core/routes/historial.routes.js
frontend/src/components/common/HistorialCambios.jsx
frontend/src/hooks/useHistorial.js
```

---

### 5. Landed Costs (Prioridad: Media)

> Agregar costos adicionales (flete, aduanas) al costo de productos.

#### Fase 1: Modelo de Datos
- [ ] Crear tabla `costos_adicionales` (id, org_id, nombre, tipo: fijo/porcentaje)
- [ ] Crear tabla `oc_costos_adicionales` (oc_id, costo_id, monto, distribucion: peso/valor/cantidad)
- [ ] Modificar `movimientos_inventario` para incluir `costo_landed`
- [ ] Actualizar cálculo FIFO/AVCO para considerar landed costs

#### Fase 2: Backend
- [ ] CRUD `/api/v1/costos-adicionales`
- [ ] Endpoint `/api/v1/ordenes-compra/:id/costos` - agregar costos a OC
- [ ] Lógica de distribución automática (por peso, valor o cantidad)
- [ ] Recálculo de valoración al agregar costos

#### Fase 3: Frontend
- [ ] Componente en recepción de OC para agregar costos
- [ ] Selector de método de distribución
- [ ] Vista de costo landed vs costo original
- [ ] Reporte de landed costs por período

---

### 6. GS1 Barcodes (Prioridad: Baja)

> Soporte para códigos GS1-128 con información embebida.

#### Fase 1: Parser GS1
- [ ] Librería para parsear códigos GS1-128
- [ ] Extraer: GTIN, lote, fecha expiración, número serie
- [ ] Validación de dígitos verificadores

#### Fase 2: Integración
- [ ] Modificar scanner en recepción para detectar GS1
- [ ] Auto-completar campos desde código escaneado
- [ ] Generación de códigos GS1 para productos propios

---

### Cronograma Sugerido

| Trimestre | Gap | Entregable |
|-----------|-----|------------|
| ~~Q1 2026~~ | ~~Variantes de producto~~ | ✅ **COMPLETADO** (28 Dic 2025) |
| **Q1 2026** | Reservas variantes | Sistema anti sobre-ventas para variantes |
| **Q1 2026** | Inventory at Date | Snapshots diarios + consulta histórica |
| **Q2 2026** | Chatter/Historial | Timeline en productos, OC, clientes |
| **Q2 2026** | Carriers (Fase 1) | UPS + FedEx cotización |
| **Q3 2026** | Carriers (Fase 2) | DHL + Envia.com + tracking |
| **Q3 2026** | Landed Costs | Distribución de costos en OC |
| **Q4 2026** | GS1 Barcodes | Parser + generación |

---

### Comparación Detallada por Módulo

#### Productos
| Campo | Nexo | Odoo |
|-------|------|------|
| SKU, Barcode, Nombre | ✅ | ✅ |
| Precio/Costo | ✅ | ✅ |
| Stock actual/min/max | ✅ | ✅ |
| Stock proyectado | ✅ | ✅ Forecasted |
| Variantes (color, talla) | ✅ Atributos dinámicos | ✅ Avanzado |
| Multi-moneda precios | ✅ | ⚠️ Pricelist |
| Imagen | ✅ | ✅ |
| Auto-reorden OC | ✅ | ✅ |

#### NS/Lotes
| Campo | Nexo | Odoo |
|-------|------|------|
| Número serie | ✅ | ✅ |
| Estado ciclo vida | ✅ 6 estados | ❌ |
| Fecha expiración | ✅ | ⚠️ Opcional |
| Ubicación | ✅ | ✅ |
| Vínculo OC/Proveedor | ✅ | ⚠️ |
| Trazabilidad visual | ⚠️ | ✅ Smart button |
| GS1 Barcodes | ❌ | ✅ |

#### WMS/Ubicaciones
| Funcionalidad | Nexo | Odoo |
|---------------|------|------|
| Jerarquía | ✅ 4 niveles | ⚠️ Flat (WH/Stock/Shelf) |
| Tipos de zona | ✅ 6 tipos | ⚠️ Básico |
| Control ambiental | ✅ Temp/Humedad | ❌ |
| Capacidad ubicación | ✅ | ⚠️ |
| Multi-step routes | ❌ | ✅ |
| Batch picking | ❌ | ✅ |

#### Reportes
| Reporte | Nexo | Odoo |
|---------|------|------|
| Stock actual | ✅ | ✅ |
| Valoración FIFO/AVCO | ✅ | ✅ |
| Comparación métodos | ✅ | ❌ |
| Inventory at Date | ❌ | ✅ |
| Moves Analysis | ✅ | ✅ |
| Landed Costs | ❌ | ✅ |

### Conclusión

**Nexo está bien posicionado** para competir con Odoo en inventario, especialmente para:
- SaaS multi-tenant (RLS superior)
- Industrias reguladas (control ambiental WMS)
- Mercado LATAM (multi-moneda)
- Trazabilidad avanzada (estados NS/Lotes)

**Prioridad de mejoras:**
1. ~~Variantes de producto~~ ✅ (implementado 28 Dic 2025)
2. Reservas para variantes (evitar sobre-ventas)
3. Carriers de envío (competitividad)
4. Historial visual de cambios (UX)

---

## Próximos Pasos Sugeridos

1. **Implementar reservas para variantes** - Evitar sobre-ventas en alta concurrencia (las variantes actualmente bypasean el sistema de reservas)
2. **Configurar horarios profesional** - Para habilitar flujo completo de citas
3. **Recibir OC y registrar NS** - Para probar venta POS con productos serializados
4. **Implementar 2FA/MFA** - Gap de alta prioridad pendiente
5. **Agregar auditoría de cambios** - Historial de modificaciones
6. **Investigar integraciones carriers** - UPS/FedEx/DHL para envíos
