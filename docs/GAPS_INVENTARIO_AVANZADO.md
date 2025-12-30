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
| **Landed Costs** | ✅ | Prorrateo por valor/peso/cantidad |
| **Dropshipping** | ✅ | Venta sin stock → OC al proveedor |

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

frontend/src/
├── pages/inventario/ReordenPage.jsx
├── pages/inventario/DropshipPage.jsx
├── components/inventario/ordenes-compra/LandedCostsSection.jsx
└── hooks/use{Reorden,LandedCosts,Dropship}.js
```

---

## Próxima Sesión

### Revisión Completa Flujos Inventario + POS

**Objetivo**: Validar funcionamiento end-to-end de todos los módulos

**Escenarios a probar**:

1. **Compra → Stock → Venta**
   - Crear OC con landed costs
   - Recibir mercancía
   - Verificar costo unitario distribuido
   - Vender en POS
   - Validar movimientos y valoración

2. **Dropshipping**
   - Producto con `ruta_preferida = 'dropship'`
   - Vender en POS (stock = 0)
   - Verificar OC automática con datos cliente
   - Confirmar entrega sin afectar inventario

3. **Reorden Automático**
   - Crear regla por producto
   - Reducir stock bajo mínimo
   - Ejecutar evaluación
   - Verificar OC generada

4. **NS/Lotes en Venta**
   - Producto con tracking
   - Recibir con seriales
   - Vender seleccionando NS
   - Validar trazabilidad

5. **Variantes en POS**
   - Producto con variantes
   - Stock por variante
   - Vender variante específica

---

## Roadmap

| Fase | Alcance | Estado |
|------|---------|:------:|
| 1 | Reorden, Landed Costs, Dropshipping | ✅ |
| 2 | Validación integral flujos | **Próxima** |
| 3 | Conectores Carriers (DHL) | Pendiente |
| 4 | Rutas multietapa, Batch transfers | Pendiente |
