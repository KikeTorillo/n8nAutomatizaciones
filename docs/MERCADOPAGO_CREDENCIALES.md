# MercadoPago - Guía de Credenciales

> **Fecha**: Enero 2026
> **Importante**: Esta documentación aplica específicamente a la integración con **Preapproval API** (suscripciones recurrentes).

---

## Tipos de Credenciales

MercadoPago tiene dos tipos de credenciales:

| Tipo | Prefijo Access Token | Uso |
|------|---------------------|-----|
| **Producción** | `APP-` | Transacciones reales con dinero real |
| **Prueba** | `TEST-` | Desarrollo y testing |

---

## Limitación Importante: Credenciales de Prueba

Las credenciales de prueba (`TEST-`) **solo funcionan completamente** con:
- Checkout API
- Checkout Bricks

**NO funcionan igual** con:
- **Preapproval API (Suscripciones)** ← Lo que usamos en Nexo

### ¿Qué significa esto?

Cuando usas la Preapproval API con credenciales `TEST-` de tu cuenta principal:
- El checkout puede redirigir a `www.mercadopago.com.mx` (no sandbox)
- Recibirás el error: `"Both payer and collector must be real or test users"`
- No puedes mezclar usuarios reales con credenciales de prueba

---

## Solución: Usar Cuentas de Prueba

Para probar suscripciones en sandbox necesitas crear **cuentas de prueba completas**:

### Paso 1: Crear Cuenta Vendedor de Prueba

1. Ve a: https://www.mercadopago.com.mx/developers/panel/test-users
2. Crea un usuario de prueba tipo **Vendedor**
3. Inicia sesión con ese usuario en MercadoPago
4. Ve al panel de desarrolladores de ESA cuenta
5. Obtén las credenciales `TEST-` de esa cuenta de prueba

### Paso 2: Crear Cuenta Comprador de Prueba

1. Desde la misma página de test-users
2. Crea un usuario de prueba tipo **Comprador**
3. Guarda el email generado (ej: `test_user_123456789@testuser.com`)

### Paso 3: Configurar en Nexo

1. Crea un conector con las credenciales `TEST-` de la **cuenta vendedor de prueba**
2. En `.env` configura:
   ```env
   MERCADOPAGO_TEST_PAYER_EMAIL=test_user_123456789@testuser.com
   ```

---

## Cómo Funciona en Nexo

El sistema detecta automáticamente el entorno por el prefijo del access token:

```javascript
// mercadopago.service.js
isSandbox() {
    return this.credentials.accessToken?.startsWith('TEST-') || false;
}
```

### Flujo de Email del Pagador

```
┌─────────────────────────────────────────────────────────┐
│                    Token del Conector                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ ¿Empieza con TEST-? │
                 └─────────────────────┘
                    │              │
                   Sí              No
                    │              │
                    ▼              ▼
    ┌───────────────────┐  ┌───────────────────┐
    │ MERCADOPAGO_TEST_ │  │  Email real del   │
    │   PAYER_EMAIL     │  │     usuario       │
    └───────────────────┘  └───────────────────┘
```

### Flujo de URL de Checkout

```
┌─────────────────────────────────────────────────────────┐
│              Respuesta de MercadoPago API               │
│  {                                                      │
│    init_point: "www.mercadopago.com.mx/...",           │
│    sandbox_init_point: "sandbox.mercadopago.com.mx/..."│
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ ¿Token es TEST-?    │
                 └─────────────────────┘
                    │              │
                   Sí              No
                    │              │
                    ▼              ▼
    ┌───────────────────┐  ┌───────────────────┐
    │ sandbox_init_point│  │    init_point     │
    └───────────────────┘  └───────────────────┘
```

---

## Resumen de Configuraciones

### Para Desarrollo/Testing

| Variable | Valor |
|----------|-------|
| Access Token del Conector | `TEST-...` (de cuenta de prueba vendedor) |
| `MERCADOPAGO_TEST_PAYER_EMAIL` | Email del comprador de prueba |

### Para Producción

| Variable | Valor |
|----------|-------|
| Access Token del Conector | `APP-...` (de cuenta real) |
| `MERCADOPAGO_TEST_PAYER_EMAIL` | No se usa (puede estar vacío) |

---

## Tarjetas de Prueba

Para testing, usa estas tarjetas en el checkout de MercadoPago:

| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| Mastercard (aprobada) | 5474 9254 3267 0366 | 123 | 11/25 |
| Visa (aprobada) | 4075 5957 1648 3764 | 123 | 11/25 |
| Visa (rechazada) | 4000 0000 0000 0002 | 123 | 11/25 |

> Más tarjetas en: https://www.mercadopago.com.mx/developers/es/docs/checkout-api/additional-content/test-cards

---

## Errores Comunes

### "Both payer and collector must be real or test users"

**Causa**: Estás mezclando credenciales de prueba con emails reales, o viceversa.

**Solución**:
- Si usas token `TEST-`, asegúrate que `MERCADOPAGO_TEST_PAYER_EMAIL` tenga un email de comprador de prueba
- Si usas token `APP-`, el sistema usará el email real del usuario

### "No se pudo obtener enlace de pago"

**Causa**: Posible problema con las credenciales o la API.

**Solución**:
1. Verifica que el conector esté marcado como principal
2. Verifica que las credenciales sean válidas (botón "Verificar Conectividad")
3. Revisa los logs del backend: `docker logs back --tail 100`

---

## Referencias

- [Documentación Preapproval API](https://www.mercadopago.com.mx/developers/es/reference/subscriptions/_preapproval/post)
- [Crear usuarios de prueba](https://www.mercadopago.com.mx/developers/panel/test-users)
- [Tarjetas de prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/additional-content/test-cards)
- [Credenciales](https://www.mercadopago.com.mx/developers/panel/credentials)
