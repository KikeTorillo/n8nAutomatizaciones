# Módulo: Pagos (Mercado Pago)

## 📋 Descripción

Sistema completo de pagos e integración con **Mercado Pago** para el SaaS multi-tenant. Gestiona transacciones, suscripciones recurrentes y métodos de pago guardados con total seguridad **PCI Compliant**.

## 🎯 Propósito

- **Procesamiento de pagos** a través de Mercado Pago
- **Suscripciones recurrentes** SaaS con renovación automática
- **Métodos de pago guardados** (tarjetas) de forma segura
- **Conciliación financiera** con auditoría completa
- **Idempotencia** garantizada en webhooks
- **Multi-tenancy** con aislamiento total por organización

## 🗂️ Tablas

### `pagos`
Registro de todas las transacciones procesadas por Mercado Pago.

**Características:**
- **Idempotencia** garantizada con UNIQUE en `payment_id_mp`
- **Auditoría completa** de fechas y estados
- **Metadata JSONB** para datos adicionales de MP
- **RLS multi-tenant** para aislamiento total
- **Soporte multi-tipo**: suscripciones, upgrades, downgrades, pagos únicos

**Campos clave:**
- `payment_id_mp`: ID único de Mercado Pago (garantiza idempotencia)
- `subscription_id_mp`: ID de suscripción MP (si es pago recurrente)
- `monto`, `moneda`: Detalles financieros
- `estado`: approved, rejected, pending, refunded, cancelled, in_process, charged_back
- `tipo_pago`: subscription, upgrade, downgrade, manual, one_time
- `external_reference`: Formato `org_{organizacion_id}_{timestamp}`

### `metodos_pago`
Métodos de pago guardados de organizaciones (tarjetas, cuentas).

**Características:**
- **PCI Compliant**: Solo guarda últimos 4 dígitos
- **NUNCA guarda**: Número completo, CVV, PIN
- **Constraint EXCLUDE**: Solo un método principal por organización
- **Customer MP**: Vinculación con customer_id de Mercado Pago
- **Control de vigencia**: Validación de mes/año de expiración

**Campos seguros:**
- `card_last_digits`: Últimos 4 dígitos (PCI Safe)
- `card_brand`: visa, mastercard, amex, carnet
- `customer_id_mp`: ID del customer en Mercado Pago
- `es_principal`: Solo un método principal por org (EXCLUDE constraint)
- `activo`: Control de métodos activos/inactivos

## 📊 Archivos del Módulo

```
pagos/
├── 01-tablas.sql          (2 tablas: pagos + metodos_pago)
├── 02-indices.sql         (12 índices especializados)
├── 03-rls-policies.sql    (7 políticas RLS multi-tenant)
├── 04-triggers.sql        (2 triggers updated_at)
└── README.md              (este archivo)
```

## 📊 Índices Especializados (12)

### Tabla `pagos` (8 índices)

1. **idx_pagos_organizacion** - Búsqueda por organización
2. **idx_pagos_payment_mp** - Idempotencia en webhooks (búsqueda instantánea)
3. **idx_pagos_subscription_mp** - Filtrado por suscripción (índice parcial)
4. **idx_pagos_estado** - Filtrado por estado del pago
5. **idx_pagos_fecha** - Ordenamiento por fecha (DESC)
6. **idx_pagos_external_ref** - Búsqueda por referencia externa
7. **idx_pagos_tipo** - Filtrado por tipo de pago (índice parcial)
8. **idx_pagos_org_covering** - **Índice covering** optimizado (evita lookups)

### Tabla `metodos_pago` (4 índices)

1. **idx_metodos_pago_org** - Búsqueda por organización
2. **idx_metodos_pago_activo** - Métodos activos (índice parcial)
3. **idx_metodos_pago_principal** - Método principal por org (índice parcial)
4. **idx_metodos_pago_customer_mp** - Búsqueda por customer MP

## 🛡️ Row Level Security (RLS)

### Tabla `pagos` (3 políticas)

- **pagos_select_policy** - SELECT solo de pagos propios
- **pagos_insert_policy** - INSERT solo con organizacion_id propia
- **pagos_update_policy** - UPDATE solo de pagos propios (webhooks)

### Tabla `metodos_pago` (4 políticas)

- **metodos_pago_select_policy** - SELECT solo métodos propios
- **metodos_pago_insert_policy** - INSERT solo con organizacion_id propia
- **metodos_pago_update_policy** - UPDATE solo métodos propios
- **metodos_pago_delete_policy** - DELETE solo métodos propios

## 🔄 Triggers Automáticos (2)

### `update_pagos_updated_at`
- **Disparo:** BEFORE UPDATE en `pagos`
- **Función:** Actualiza `updated_at` automáticamente
- **Uso:** Rastrear cambios de estado desde webhooks MP

### `update_metodos_pago_updated_at`
- **Disparo:** BEFORE UPDATE en `metodos_pago`
- **Función:** Actualiza `updated_at` automáticamente
- **Uso:** Auditoría de activación/desactivación de métodos

## 💳 Estados de Pago

| Estado | Descripción | Acción Backend |
|--------|-------------|----------------|
| `approved` | Pago aprobado exitosamente | Activar suscripción |
| `rejected` | Pago rechazado | Notificar usuario |
| `pending` | Pago pendiente (ej: OXXO) | Esperar confirmación |
| `refunded` | Pago reembolsado | Desactivar suscripción |
| `cancelled` | Pago cancelado | Limpiar carrito |
| `in_process` | Pago en proceso | Mostrar loader |
| `charged_back` | Contracargo (fraude) | Suspender cuenta |

## 🎯 Tipos de Pago

| Tipo | Descripción | Recurrente |
|------|-------------|------------|
| `subscription` | Pago de suscripción mensual | ✅ Sí |
| `upgrade` | Cambio a plan superior | ❌ No |
| `downgrade` | Cambio a plan inferior | ❌ No |
| `manual` | Pago manual administrativo | ❌ No |
| `one_time` | Pago único (ej: addon) | ❌ No |

## 📦 Dependencias

### Requiere (Orden de carga)
1. `fundamentos/` - Funciones globales (actualizar_timestamp)
2. `nucleo/` - Tabla `organizaciones`
3. `nucleo/` - Tabla `subscripciones` (para vincular pagos)

### Usado por
- Backend API - Endpoints de pago y suscripciones
- Webhooks MP - Actualización de estados de pago
- Dashboard - Visualización de transacciones
- Reportes - Conciliación financiera

## 🔧 Uso desde Backend

### Registrar Pago desde Webhook MP
```javascript
const { payment } = req.body; // Webhook de Mercado Pago

await RLSContextManager.query(orgId, async (db) => {
  await db.query(`
    INSERT INTO pagos (
      organizacion_id, payment_id_mp, subscription_id_mp,
      monto, moneda, estado, tipo_pago,
      payment_method_id, payment_type_id,
      external_reference, metadata,
      fecha_pago, fecha_aprobacion
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (payment_id_mp) DO UPDATE
    SET estado = EXCLUDED.estado,
        fecha_aprobacion = EXCLUDED.fecha_aprobacion,
        updated_at = NOW()
  `, [
    orgId,
    payment.id,
    payment.subscription_id,
    payment.transaction_amount,
    payment.currency_id,
    payment.status,
    'subscription',
    payment.payment_method_id,
    payment.payment_type_id,
    payment.external_reference,
    JSON.stringify(payment),
    payment.date_created,
    payment.date_approved
  ]);
});
```

### Guardar Método de Pago
```javascript
await RLSContextManager.query(orgId, async (db) => {
  await db.query(`
    INSERT INTO metodos_pago (
      organizacion_id, customer_id_mp, card_id_mp,
      card_last_digits, card_brand, card_holder_name,
      expiration_month, expiration_year, es_principal
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    orgId,
    customerId,
    cardId,
    '4242', // Últimos 4 dígitos
    'visa',
    'JUAN PEREZ',
    12,
    2026,
    true
  ]);
});
```

### Consultar Pagos de Organización
```javascript
const pagos = await RLSContextManager.query(orgId, async (db) => {
  const result = await db.query(`
    SELECT
      id, payment_id_mp, monto, moneda,
      estado, tipo_pago, fecha_pago
    FROM pagos
    WHERE organizacion_id = $1
    ORDER BY fecha_pago DESC
    LIMIT 50
  `, [orgId]);

  return result.rows;
});
```

## 📊 Consultas Útiles

### Pagos Aprobados del Mes
```sql
SELECT
  id,
  payment_id_mp,
  monto,
  moneda,
  tipo_pago,
  fecha_aprobacion
FROM pagos
WHERE organizacion_id = 1
  AND estado = 'approved'
  AND fecha_aprobacion >= DATE_TRUNC('month', NOW())
ORDER BY fecha_aprobacion DESC;
```

### Total Recaudado por Organización
```sql
SELECT
  organizacion_id,
  COUNT(*) as total_pagos,
  SUM(monto) as total_recaudado,
  COUNT(*) FILTER (WHERE estado = 'approved') as pagos_exitosos,
  COUNT(*) FILTER (WHERE estado = 'rejected') as pagos_rechazados
FROM pagos
WHERE fecha_pago >= NOW() - INTERVAL '30 days'
GROUP BY organizacion_id
ORDER BY total_recaudado DESC;
```

### Métodos de Pago Activos
```sql
SELECT
  id,
  card_brand,
  card_last_digits,
  card_holder_name,
  expiration_month,
  expiration_year,
  es_principal,
  created_at
FROM metodos_pago
WHERE organizacion_id = 1
  AND activo = TRUE
ORDER BY es_principal DESC, created_at DESC;
```

### Pagos Pendientes (OXXO, SPEI)
```sql
SELECT
  id,
  payment_id_mp,
  monto,
  payment_method_id,
  payment_type_id,
  external_reference,
  fecha_pago,
  EXTRACT(EPOCH FROM (NOW() - fecha_pago))/3600 as horas_pendiente
FROM pagos
WHERE organizacion_id = 1
  AND estado = 'pending'
ORDER BY fecha_pago DESC;
```

## 🧪 Testing

### Test de Idempotencia (Webhook Duplicado)
```sql
-- Primera inserción (OK)
INSERT INTO pagos (
  organizacion_id, payment_id_mp, monto, moneda, estado
) VALUES (1, 'MP_123456', 299.00, 'MXN', 'pending');

-- Segunda inserción (ON CONFLICT DO UPDATE)
INSERT INTO pagos (
  organizacion_id, payment_id_mp, monto, moneda, estado
) VALUES (1, 'MP_123456', 299.00, 'MXN', 'approved')
ON CONFLICT (payment_id_mp) DO UPDATE
SET estado = EXCLUDED.estado,
    updated_at = NOW();

-- Verificar que solo existe 1 registro
SELECT COUNT(*) FROM pagos WHERE payment_id_mp = 'MP_123456';
-- Resultado: 1 (idempotencia garantizada)
```

### Test de Constraint EXCLUDE (Método Principal)
```sql
-- Insertar primer método como principal (OK)
INSERT INTO metodos_pago (
  organizacion_id, card_last_digits, card_brand, es_principal
) VALUES (1, '4242', 'visa', TRUE);

-- Intentar insertar segundo método principal (FALLA)
INSERT INTO metodos_pago (
  organizacion_id, card_last_digits, card_brand, es_principal
) VALUES (1, '1234', 'mastercard', TRUE);
-- ERROR: conflicting key value violates exclusion constraint
```

### Test de RLS Multi-Tenant
```sql
-- Configurar tenant 1
SET rls.organizacion_id = '1';

-- Insertar pago org 1
INSERT INTO pagos (organizacion_id, payment_id_mp, monto, moneda, estado)
VALUES (1, 'MP_ORG1', 100, 'MXN', 'approved');

-- Cambiar a tenant 2
SET rls.organizacion_id = '2';

-- Intentar ver pago de org 1 (NO VISIBLE)
SELECT COUNT(*) FROM pagos WHERE payment_id_mp = 'MP_ORG1';
-- Resultado: 0 (RLS funciona correctamente)
```

## 💰 Integración con Mercado Pago

### Flujo Completo de Pago

1. **Frontend**: Usuario inicia checkout
2. **Backend**: Crea preferencia de pago en MP
3. **MP**: Redirige a Checkout Pro
4. **Usuario**: Completa pago en MP
5. **MP**: Envía webhook a backend
6. **Backend**: Registra/actualiza pago en tabla `pagos` (idempotente)
7. **Backend**: Activa/actualiza suscripción según estado
8. **Backend**: Notifica al usuario vía email

### Campos Importantes de Webhooks

```javascript
// Webhook de Mercado Pago
{
  "id": 12345678,               // payment_id_mp
  "transaction_amount": 299.00, // monto
  "currency_id": "MXN",         // moneda
  "status": "approved",         // estado
  "status_detail": "accredited",// status_detail
  "payment_method_id": "visa",  // payment_method_id
  "payment_type_id": "credit_card", // payment_type_id
  "external_reference": "org_1_1700000000", // external_reference
  "date_created": "2025-11-17T10:00:00Z",   // fecha_pago
  "date_approved": "2025-11-17T10:00:05Z",  // fecha_aprobacion
  "metadata": {...}             // metadata JSONB
}
```

## ⚠️ Consideraciones de Seguridad

### PCI Compliance
- ✅ **NUNCA** guardar número de tarjeta completo
- ✅ **NUNCA** guardar CVV/CVC
- ✅ **SOLO** guardar últimos 4 dígitos
- ✅ Usar tokens de Mercado Pago (`card_id_mp`)
- ✅ Validar HTTPS en webhooks

### Idempotencia
- ✅ Usar `ON CONFLICT (payment_id_mp) DO UPDATE`
- ✅ Validar `payment_id_mp` en todos los webhooks
- ✅ Evitar pagos duplicados

### Conciliación
- ✅ Guardar metadata completa en JSONB
- ✅ Mantener `external_reference` único por transacción
- ✅ Auditar con `created_at` y `updated_at`

## 📈 Métricas y Monitoreo

### Estadísticas de Pagos
```sql
-- Dashboard de pagos (último mes)
SELECT
  DATE_TRUNC('day', fecha_pago) as dia,
  COUNT(*) as total_transacciones,
  SUM(monto) FILTER (WHERE estado = 'approved') as recaudacion,
  COUNT(*) FILTER (WHERE estado = 'rejected') as rechazados,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE estado = 'approved') / COUNT(*),
    2
  ) as tasa_aprobacion
FROM pagos
WHERE organizacion_id = 1
  AND fecha_pago >= NOW() - INTERVAL '30 days'
GROUP BY dia
ORDER BY dia DESC;
```

### Métodos de Pago Más Usados
```sql
SELECT
  payment_method_id,
  payment_type_id,
  COUNT(*) as total_usos,
  SUM(monto) FILTER (WHERE estado = 'approved') as volumen_total,
  ROUND(AVG(monto), 2) as ticket_promedio
FROM pagos
WHERE fecha_pago >= NOW() - INTERVAL '90 days'
GROUP BY payment_method_id, payment_type_id
ORDER BY total_usos DESC
LIMIT 10;
```

## 🔧 Mantenimiento

### Limpieza de Pagos Antiguos
```sql
-- Archivar pagos >1 año (ejecutar mensualmente)
-- ADVERTENCIA: Solo en producción con backup previo
DELETE FROM pagos
WHERE fecha_pago < NOW() - INTERVAL '1 year'
  AND estado IN ('rejected', 'cancelled');

VACUUM ANALYZE pagos;
```

### Desactivar Tarjetas Vencidas
```sql
-- Ejecutar mensualmente
UPDATE metodos_pago
SET activo = FALSE
WHERE (expiration_year < EXTRACT(YEAR FROM NOW()))
   OR (expiration_year = EXTRACT(YEAR FROM NOW())
       AND expiration_month < EXTRACT(MONTH FROM NOW()));
```

## 📚 Referencias

- **Mercado Pago Docs:** https://www.mercadopago.com.mx/developers/es/docs
- **Webhooks MP:** https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
- **PCI Compliance:** https://www.pcisecuritystandards.org/

---

**Versión:** 1.0.0
**Fecha:** 17 Noviembre 2025
**Estado:** ✅ Listo para Producción
**Integración:** Mercado Pago API v1
**Seguridad:** PCI Compliant
