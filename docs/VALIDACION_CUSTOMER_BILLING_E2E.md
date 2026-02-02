# Validacion Customer Billing E2E

Checklist paso a paso para validar el flujo completo de Customer Billing (Organizaciones vendiendo a sus clientes).

---

## Requisitos Previos

- Acceso a una organizacion de prueba (NO org 1 / Nexo Team)
- Usuario con rol admin o superior en la organizacion
- Cuenta de MercadoPago sandbox configurada

---

## Paso 1: Configurar Conector MercadoPago

### 1.1 Crear cuenta de prueba en MercadoPago

1. Ir a [MercadoPago Developers](https://www.mercadopago.com.mx/developers/panel/test-users)
2. Crear un **Test User Vendedor** (el que recibe pagos)
3. Crear un **Test User Comprador** (el que paga)
4. Guardar las credenciales:
   - Access Token del vendedor
   - Email y password del comprador

### 1.2 Configurar conector en Nexo

1. Navegar a `/suscripciones-negocio/conectores`
2. Crear nuevo conector con:
   - **Gateway**: MercadoPago
   - **Entorno**: Sandbox
   - **Access Token**: Token del Test User Vendedor
   - **Test Payer Email**: Email del Test User Comprador (REQUERIDO en sandbox)
3. Activar el conector

### Verificacion SQL

```sql
-- Verificar conector configurado
SELECT id, organizacion_id, gateway, entorno, activo,
       CASE WHEN access_token IS NOT NULL THEN 'configurado' ELSE 'falta' END as token_status
FROM conectores_pago_org
WHERE organizacion_id = <ORG_ID>;
```

---

## Paso 2: Crear Plan de Suscripcion

### 2.1 Crear plan desde UI

1. Navegar a `/suscripciones-negocio/planes`
2. Crear nuevo plan con:
   - **Nombre**: Plan Prueba Customer
   - **Codigo**: prueba-customer
   - **Precio Mensual**: $100.00
   - **Moneda**: MXN
   - **Dias Trial**: 0 (para prueba directa)
   - **Activo**: Si

### Verificacion SQL

```sql
-- Verificar plan creado
SELECT id, codigo, nombre, precio_mensual, moneda, activo
FROM planes_suscripcion_org
WHERE organizacion_id = <ORG_ID>
  AND codigo = 'prueba-customer';
```

---

## Paso 3: Crear Cliente en CRM

### 3.1 Crear cliente de prueba

1. Navegar a `/clientes`
2. Crear cliente con:
   - **Nombre**: Cliente Prueba E2E
   - **Email**: Usar el email del Test User Comprador de MP
   - **Telefono**: Cualquier numero valido

**IMPORTANTE**: El email DEBE coincidir con el Test User Comprador para pruebas en sandbox.

### Verificacion SQL

```sql
-- Verificar cliente creado (sin organizacion_vinculada_id = Customer Billing)
SELECT id, nombre, email, organizacion_vinculada_id
FROM clientes
WHERE organizacion_id = <ORG_ID>
  AND email = '<EMAIL_COMPRADOR>';

-- Confirmar que organizacion_vinculada_id es NULL (Customer Billing)
-- Si tiene valor, es Platform Billing (org como cliente de Nexo)
```

---

## Paso 4: Generar Link de Checkout Publico

### 4.1 Crear link desde UI

1. Navegar a `/suscripciones-negocio/clientes`
2. Hacer clic en "Crear Suscripcion"
3. Seleccionar:
   - **Cliente**: Cliente Prueba E2E
   - **Plan**: Plan Prueba Customer
   - **Periodo**: Mensual
4. Copiar el link generado

### 4.2 Verificar token creado

```sql
-- Verificar token de checkout
SELECT
    ct.id, ct.token, ct.cliente_id, ct.plan_id,
    ct.usado, ct.expira_en,
    c.nombre as cliente_nombre,
    p.nombre as plan_nombre
FROM checkout_tokens_org ct
INNER JOIN clientes c ON ct.cliente_id = c.id
INNER JOIN planes_suscripcion_org p ON ct.plan_id = p.id
WHERE ct.organizacion_id = <ORG_ID>
ORDER BY ct.creado_en DESC
LIMIT 1;
```

---

## Paso 5: Completar Pago en Sandbox

### 5.1 Acceder al checkout publico

1. Abrir el link en una ventana de incognito
2. Verificar que muestra:
   - Nombre del plan
   - Precio correcto
   - Periodo de facturacion

### 5.2 Completar pago en MercadoPago

1. Hacer clic en "Suscribirme"
2. Se redirige a MercadoPago
3. Iniciar sesion con el **Test User Comprador**
4. Usar tarjeta de prueba:
   - **Mastercard**: 5474 9254 3267 0366
   - **CVV**: 123
   - **Vencimiento**: 11/27
   - **Titular**: APRO (para aprobar)
5. Completar el pago

### Tarjetas de prueba adicionales

| Resultado | Titular | Tarjeta |
|-----------|---------|---------|
| Aprobado | APRO | 5474 9254 3267 0366 |
| Rechazado | OTHE | 5474 9254 3267 0366 |
| Pendiente | CONT | 5474 9254 3267 0366 |

---

## Paso 6: Verificar Webhook Procesado

### 6.1 Verificar en logs

```bash
# Ver logs del backend en tiempo real
docker logs -f back --since 5m | grep -i webhook

# Buscar procesamiento del webhook
docker logs back --since 30m 2>&1 | grep -E "(subscription_preapproval|authorized)"
```

### 6.2 Verificar en base de datos

```sql
-- Verificar webhook registrado (idempotencia)
SELECT id, webhook_id, tipo, procesado_en, resultado
FROM webhooks_procesados
WHERE organizacion_id = <ORG_ID>
ORDER BY procesado_en DESC
LIMIT 5;

-- Verificar que no hay duplicados
SELECT webhook_id, COUNT(*) as veces
FROM webhooks_procesados
WHERE organizacion_id = <ORG_ID>
GROUP BY webhook_id
HAVING COUNT(*) > 1;
```

---

## Paso 7: Verificar Suscripcion Activa

### 7.1 Verificar en UI

1. Navegar a `/suscripciones-negocio/clientes`
2. Ver que la suscripcion aparece con estado "Activa"
3. Verificar detalles:
   - Cliente correcto
   - Plan correcto
   - Fechas de inicio y proximo cobro

### 7.2 Verificar en base de datos

```sql
-- Verificar suscripcion activa
SELECT
    s.id, s.estado, s.fecha_inicio, s.fecha_proximo_cobro,
    s.mp_preapproval_id, s.periodo,
    c.nombre as cliente_nombre,
    p.nombre as plan_nombre
FROM suscripciones_org s
INNER JOIN clientes c ON s.cliente_id = c.id
INNER JOIN planes_suscripcion_org p ON s.plan_id = p.id
WHERE s.organizacion_id = <ORG_ID>
  AND c.email = '<EMAIL_COMPRADOR>'
ORDER BY s.creado_en DESC
LIMIT 1;

-- Verificar que tiene mp_preapproval_id (vinculo con MercadoPago)
-- Estado debe ser 'activa'
```

---

## Paso 8: Verificar Emails Enviados

### 8.1 Verificar en logs

```bash
# Buscar envio de email
docker logs back --since 30m 2>&1 | grep -i "email\|correo\|notificacion"
```

### 8.2 Verificar configuracion de email

```sql
-- Verificar que la organizacion tiene email configurado
SELECT id, nombre, email
FROM organizaciones
WHERE id = <ORG_ID>;
```

**NOTA**: En ambiente de desarrollo/sandbox, los emails pueden estar deshabilitados o redirigidos a un servicio de prueba como Mailtrap.

---

## Paso 9: Probar Renovacion

### 9.1 Simular paso del tiempo (solo desarrollo)

La renovacion es automatica por MercadoPago. Para probar en sandbox:

1. Esperar al siguiente ciclo de cobro (no recomendado)
2. O verificar que la configuracion de preapproval es correcta

### 9.2 Verificar preapproval en MercadoPago

```bash
# Consultar estado del preapproval
curl -X GET \
  "https://api.mercadopago.com/preapproval/<MP_PREAPPROVAL_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 9.3 Verificar configuracion de cobro automatico

```sql
-- Verificar que auto_cobro esta activo
SELECT id, auto_cobro, fecha_proximo_cobro, mp_preapproval_id
FROM suscripciones_org
WHERE id = <SUSCRIPCION_ID>;
```

---

## Paso 10: Probar Cancelacion

### 10.1 Cancelar desde UI

1. Navegar al detalle de la suscripcion
2. Hacer clic en "Cancelar Suscripcion"
3. Confirmar la cancelacion

### 10.2 Verificar cancelacion

```sql
-- Verificar estado cancelada
SELECT id, estado, fecha_fin, razon_cancelacion, cancelado_por
FROM suscripciones_org
WHERE id = <SUSCRIPCION_ID>;

-- Estado debe ser 'cancelada'
-- fecha_fin debe tener valor
```

### 10.3 Verificar webhook de cancelacion (si aplica)

Si la cancelacion se hizo desde MercadoPago:

```sql
SELECT webhook_id, tipo, resultado
FROM webhooks_procesados
WHERE organizacion_id = <ORG_ID>
  AND tipo LIKE '%cancel%'
ORDER BY procesado_en DESC
LIMIT 1;
```

---

## Comandos Utiles para Debugging

### Logs del Backend

```bash
# Ver todos los logs recientes
docker logs back --since 1h

# Filtrar por modulo de suscripciones
docker logs back --since 1h 2>&1 | grep -i suscripcion

# Ver errores
docker logs back --since 1h 2>&1 | grep -i error

# Seguir logs en tiempo real
docker logs -f back
```

### Queries SQL de Diagnostico

```sql
-- Estado general de suscripciones por organizacion
SELECT
    estado,
    COUNT(*) as cantidad,
    MIN(creado_en) as primera,
    MAX(creado_en) as ultima
FROM suscripciones_org
WHERE organizacion_id = <ORG_ID>
GROUP BY estado;

-- Webhooks recientes
SELECT
    id, webhook_id, tipo,
    resultado, procesado_en
FROM webhooks_procesados
WHERE organizacion_id = <ORG_ID>
ORDER BY procesado_en DESC
LIMIT 10;

-- Pagos registrados
SELECT
    p.id, p.monto, p.moneda, p.estado, p.fecha_pago,
    s.id as suscripcion_id
FROM pagos_suscripcion p
INNER JOIN suscripciones_org s ON p.suscripcion_id = s.id
WHERE s.organizacion_id = <ORG_ID>
ORDER BY p.fecha_pago DESC
LIMIT 10;

-- Tokens de checkout
SELECT
    token, usado, expira_en, creado_en
FROM checkout_tokens_org
WHERE organizacion_id = <ORG_ID>
ORDER BY creado_en DESC
LIMIT 5;
```

### Verificar Conexion con MercadoPago

```bash
# Verificar que el access token es valido
curl -X GET \
  "https://api.mercadopago.com/users/me" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## Troubleshooting Comun

### Error: "Webhook no procesado"

**Causa**: El webhook no llega a Nexo

**Soluciones**:
1. Verificar URL del webhook en MercadoPago Dashboard
2. Verificar que el servidor es accesible publicamente
3. Usar ngrok para desarrollo local:
   ```bash
   ngrok http 3000
   # Usar la URL https de ngrok en MP
   ```

### Error: "Token invalido o expirado"

**Causa**: El token de checkout expiro (24 horas por defecto)

**Soluciones**:
1. Generar nuevo link de checkout
2. Verificar configuracion de expiracion en `checkout_tokens_org`

### Error: "Conector no encontrado"

**Causa**: No hay conector activo para la organizacion

**Soluciones**:
1. Verificar que existe conector en `/suscripciones-negocio/conectores`
2. Verificar que el conector esta activo
3. Query de diagnostico:
   ```sql
   SELECT * FROM conectores_pago_org
   WHERE organizacion_id = <ORG_ID> AND activo = true;
   ```

### Error: "Pago rechazado en MercadoPago"

**Causa**: Tarjeta invalida o titular incorrecto

**Soluciones**:
1. Usar tarjeta de prueba correcta
2. Usar titular "APRO" para aprobar
3. Verificar que el email coincide con Test User Comprador

### Error: "Suscripcion no cambia a activa"

**Causa**: Webhook no procesado o error en handler

**Soluciones**:
1. Revisar logs del backend
2. Verificar `webhooks_procesados`
3. Ejecutar polling manualmente:
   ```bash
   # En psql
   SELECT * FROM cron.job WHERE jobname LIKE '%polling%';
   ```

### Error: "Email no enviado"

**Causa**: Configuracion de email incompleta

**Soluciones**:
1. Verificar variables de entorno de email
2. Verificar logs de envio
3. En desarrollo, usar servicio como Mailtrap

---

## Checklist Resumen

| Paso | Descripcion | Verificado |
|------|-------------|------------|
| 1 | Conector MP configurado y activo | [ ] |
| 2 | Plan de suscripcion creado | [ ] |
| 3 | Cliente en CRM con email correcto | [ ] |
| 4 | Link de checkout generado | [ ] |
| 5 | Pago completado en sandbox | [ ] |
| 6 | Webhook procesado correctamente | [ ] |
| 7 | Suscripcion activa en sistema | [ ] |
| 8 | Email de confirmacion enviado | [ ] |
| 9 | Renovacion configurada | [ ] |
| 10 | Cancelacion funciona | [ ] |

---

## Diferencias con Platform Billing

| Aspecto | Platform Billing | Customer Billing |
|---------|------------------|------------------|
| **Vendor** | Nexo Team (org 1) | La organizacion del usuario |
| **Cliente** | org_vinculada_id != NULL | org_vinculada_id = NULL |
| **Conector MP** | Conector de org 1 | Conector de la org |
| **Entitlements** | Se aplican limites y modulos | NO se aplican |
| **Webhook handler** | CustomerBillingStrategy | CustomerBillingStrategy |

---

**Ultima actualizacion**: 1 Febrero 2026
