# Plan: Integración Google Reserve (Reserve with Google)

**Fecha:** Diciembre 2025
**Estado:** Pendiente
**Prioridad:** Alta
**Dependencias:** Módulo agendamiento, Google Cloud Project

---

## Resumen Ejecutivo

Integrar Nexo con **Reserve with Google** para permitir que los clientes de nuestros usuarios reserven citas directamente desde:
- Google Search (búsqueda)
- Google Maps
- Google My Business

Esto aumenta significativamente la visibilidad y conversión de reservas.

---

## ¿Qué es Reserve with Google?

Reserve with Google permite a los usuarios reservar servicios directamente desde los resultados de búsqueda de Google y Google Maps, sin salir del ecosistema de Google.

### Beneficios
- **Visibilidad:** Botón "Reservar" en Google Maps/Search
- **Conversión:** Flujo sin fricción (no requiere visitar sitio web)
- **Confianza:** Respaldo de Google
- **SEO:** Mejor posicionamiento en búsquedas locales

---

## Requisitos de Elegibilidad

### Para el Negocio (Merchant)
| Requisito | Descripción |
|-----------|-------------|
| Ubicación física | Dirección verificable en Google Maps |
| Google My Business | Perfil verificado y activo |
| Categoría soportada | Belleza, salud, fitness, wellness (soportado) |
| País soportado | México, LATAM (verificar disponibilidad) |

### Para la Plataforma (Nexo como Partner)
| Requisito | Descripción |
|-----------|-------------|
| Disponibilidad real-time | Respuesta < 1 segundo |
| Inventario completo | Todos los horarios disponibles |
| 30+ días disponibilidad | Ventana de reserva amplia |
| Cancelación online | Soportar cancelación desde Google |
| Confirmación automática | Sin intervención manual |

### Servicios NO Soportados
- Membresías/suscripciones
- Servicios médicos regulados (dentistas, healthcare)
- Servicios legales
- Servicios a domicilio (salvo Google Guaranteed)
- Entretenimiento adulto

---

## Arquitectura de Integración

### Tipo de Integración: Business Link

Google ofrece dos tipos:
1. **End-to-End (E2E):** Reserva completa dentro de Google
2. **Business Link:** Redirige al sitio de reservas del negocio

**Recomendación:** Iniciar con **Business Link** (más simple), migrar a E2E después.

### Flujo Business Link

```
Usuario busca "barbería cerca de mí"
        │
        ▼
Google Maps muestra negocios
        │
        ▼
Click en negocio → Perfil GMB
        │
        ▼
Botón "Reservar" → Redirige a Nexo
        │
        ▼
Página pública de reservas Nexo
        │
        ▼
Usuario completa reserva
```

### Flujo End-to-End (Futuro)

```
Usuario busca negocio
        │
        ▼
Click "Reservar" en Google
        │
        ▼
Widget de Google muestra:
  - Servicios disponibles
  - Horarios disponibles
  - Profesionales
        │
        ▼
Usuario selecciona y confirma
        │
        ▼
Google llama API de Nexo
        │
        ▼
Reserva creada en Nexo
        │
        ▼
Confirmación en Google
```

---

## Implementación Fase 1: Business Link

### Requisitos
1. Página pública de reservas funcional
2. URL con estructura predecible
3. Registro como Partner en Actions Center

### Estructura de URLs

```
# URL de reservas por organización
https://app.nexo.com/reservar/{slug}

# URL con servicio preseleccionado
https://app.nexo.com/reservar/{slug}?servicio={id}

# URL con profesional preseleccionado
https://app.nexo.com/reservar/{slug}?profesional={id}
```

### Feed de Merchants

Google requiere un feed con los negocios participantes:

```json
{
  "merchants": [
    {
      "merchant_id": "org-123",
      "name": "Barbería El Clásico",
      "phone": "+52 55 1234 5678",
      "url": "https://app.nexo.com/reservar/barberia-el-clasico",
      "geo": {
        "latitude": 19.4326,
        "longitude": -99.1332
      },
      "address": {
        "street_address": "Av. Insurgentes Sur 123",
        "locality": "Ciudad de México",
        "region": "CDMX",
        "country": "MX",
        "postal_code": "06600"
      },
      "category": "barber_shop",
      "action_link": [
        {
          "url": "https://app.nexo.com/reservar/barberia-el-clasico",
          "language": "es",
          "label": "Reservar cita"
        }
      ]
    }
  ]
}
```

### Pasos de Implementación

1. **Crear cuenta en Actions Center**
   - https://partnerdash.google.com/apps/actions
   - Registrar Nexo como plataforma partner

2. **Configurar proyecto en Google Cloud**
   - Habilitar Maps Booking API
   - Configurar OAuth

3. **Generar feed de merchants**
   - Endpoint: `GET /api/v1/integrations/google/merchants-feed`
   - Solo orgs con GMB vinculado y reservas públicas activas

4. **Subir feed a Actions Center**
   - Inicialmente manual
   - Después automático via API

5. **Verificación y Go-Live**
   - Google verifica merchants
   - Período de prueba (sandbox)
   - Activación producción

---

## Implementación Fase 2: End-to-End (Futuro)

### API Booking Server

Nexo debe implementar un servidor gRPC que exponga:

| Método | Descripción |
|--------|-------------|
| `CheckAvailability` | Verificar disponibilidad de slots |
| `CreateBooking` | Crear reserva |
| `UpdateBooking` | Modificar reserva |
| `GetBookingStatus` | Estado de reserva |
| `ListBookings` | Listar reservas |

### Schema de Datos

```protobuf
// Servicio disponible
message Service {
  string service_id = 1;
  string name = 2;
  int32 duration_minutes = 3;
  Money price = 4;
  repeated StaffMember staff = 5;
}

// Slot de disponibilidad
message Slot {
  string slot_id = 1;
  Timestamp start_time = 2;
  Timestamp end_time = 3;
  string service_id = 4;
  string staff_id = 5;
  Availability availability = 6;
}

// Reserva
message Booking {
  string booking_id = 1;
  string merchant_id = 2;
  string service_id = 3;
  Slot slot = 4;
  UserInfo user = 5;
  BookingStatus status = 6;
}
```

### Endpoint de Disponibilidad

```javascript
// POST /api/v1/integrations/google/check-availability
{
  "merchant_id": "org-123",
  "service_id": "srv-456",
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T18:00:00Z"
}

// Response
{
  "slots": [
    {
      "slot_id": "slot-001",
      "start_time": "2025-01-15T10:00:00Z",
      "end_time": "2025-01-15T10:30:00Z",
      "availability": "AVAILABLE"
    },
    // ...
  ]
}
```

### Endpoint de Reserva

```javascript
// POST /api/v1/integrations/google/create-booking
{
  "merchant_id": "org-123",
  "slot_id": "slot-001",
  "user": {
    "email": "cliente@gmail.com",
    "given_name": "Juan",
    "family_name": "Pérez",
    "phone": "+52 55 9876 5432"
  },
  "idempotency_token": "abc123xyz"
}

// Response
{
  "booking": {
    "booking_id": "cita-789",
    "status": "CONFIRMED",
    "confirmation_number": "NEXO-789"
  }
}
```

---

## Cambios en Base de Datos

### Nueva Tabla: `google_reserve_config`

```sql
CREATE TABLE google_reserve_config (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER UNIQUE NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Estado
    habilitado BOOLEAN DEFAULT FALSE,
    estado estado_google_reserve DEFAULT 'pendiente',

    -- Vinculación GMB
    gmb_account_id VARCHAR(100),
    gmb_location_id VARCHAR(100),
    gmb_verificado BOOLEAN DEFAULT FALSE,
    fecha_verificacion TIMESTAMPTZ,

    -- Configuración
    servicios_habilitados INTEGER[],        -- IDs de servicios a mostrar
    profesionales_habilitados INTEGER[],    -- IDs de profesionales
    anticipacion_minima_horas INTEGER DEFAULT 2,
    anticipacion_maxima_dias INTEGER DEFAULT 30,

    -- Métricas
    reservas_totales INTEGER DEFAULT 0,
    ultima_reserva TIMESTAMPTZ,

    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE estado_google_reserve AS ENUM (
    'pendiente',      -- Configuración inicial
    'en_revision',    -- Enviado a Google
    'aprobado',       -- Activo
    'rechazado',      -- No cumple requisitos
    'suspendido'      -- Temporalmente inactivo
);
```

### Nueva Tabla: `google_reserve_bookings`

```sql
CREATE TABLE google_reserve_bookings (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    cita_id INTEGER REFERENCES citas(id),

    -- IDs de Google
    google_booking_id VARCHAR(100) UNIQUE,
    google_slot_id VARCHAR(100),
    idempotency_token VARCHAR(100),

    -- Estado sync
    estado_sync estado_sync_google DEFAULT 'pendiente',
    ultimo_sync TIMESTAMPTZ,
    errores_sync JSONB DEFAULT '[]',

    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE estado_sync_google AS ENUM ('pendiente', 'sincronizado', 'error');
```

### Modificación: `citas`

```sql
-- Agregar origen de la cita
ALTER TABLE citas ADD COLUMN origen origen_cita DEFAULT 'web';

CREATE TYPE origen_cita AS ENUM (
    'web',          -- Reserva desde web Nexo
    'app',          -- App móvil
    'admin',        -- Creada por admin
    'chatbot',      -- Via Telegram/WhatsApp
    'google',       -- Google Reserve
    'marketplace'   -- Marketplace Nexo
);
```

---

## Nuevos Endpoints API

### Configuración

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/integraciones/google-reserve` | Estado de config |
| `PUT` | `/api/v1/integraciones/google-reserve` | Actualizar config |
| `POST` | `/api/v1/integraciones/google-reserve/vincular-gmb` | Iniciar vinculación |
| `POST` | `/api/v1/integraciones/google-reserve/activar` | Solicitar activación |

### Booking Server (E2E)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/google/check-availability` | Verificar disponibilidad |
| `POST` | `/api/v1/google/create-booking` | Crear reserva |
| `POST` | `/api/v1/google/update-booking` | Actualizar reserva |
| `GET` | `/api/v1/google/booking/:id` | Estado de reserva |

### Feed

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/google/merchants-feed` | Feed de merchants |
| `GET` | `/api/v1/google/services-feed/:merchantId` | Servicios de merchant |
| `GET` | `/api/v1/google/availability-feed/:merchantId` | Disponibilidad |

---

## Estructura de Archivos

### Backend

```
backend/app/modules/integraciones/
├── google-reserve/
│   ├── controllers/
│   │   ├── config.controller.js
│   │   └── booking.controller.js
│   ├── models/
│   │   └── googleReserve.model.js
│   ├── routes/
│   │   ├── config.routes.js
│   │   └── booking.routes.js
│   ├── services/
│   │   ├── feedGenerator.js
│   │   ├── availabilityService.js
│   │   └── bookingSyncService.js
│   ├── schemas/
│   │   └── googleReserve.schemas.js
│   └── manifest.json
```

### Frontend

```
frontend/src/
├── pages/
│   └── configuracion/
│       └── integraciones/
│           └── GoogleReservePage.jsx
├── components/
│   └── integraciones/
│       ├── GoogleReserveStatus.jsx
│       ├── GMBVinculacion.jsx
│       └── ServiciosSelector.jsx
```

---

## Plan de Implementación

### Fase 1: Business Link (Semana 1-2)
- [ ] Registro en Actions Center
- [ ] Proyecto Google Cloud configurado
- [ ] Tabla `google_reserve_config`
- [ ] Endpoint generador de feed
- [ ] Página de configuración frontend
- [ ] Documentación para usuarios

### Fase 2: Vinculación GMB (Semana 2-3)
- [ ] OAuth con Google My Business API
- [ ] Flujo de vinculación cuenta GMB
- [ ] Verificación de ubicación
- [ ] Sincronización datos básicos

### Fase 3: Testing y Go-Live (Semana 3-4)
- [ ] Ambiente sandbox
- [ ] Pruebas con merchants reales
- [ ] Corrección de issues
- [ ] Solicitud de aprobación
- [ ] Go-live gradual

### Fase 4: End-to-End (Futuro - Q2 2025)
- [ ] Implementar gRPC server
- [ ] CheckAvailability endpoint
- [ ] CreateBooking endpoint
- [ ] Webhook de actualizaciones
- [ ] Sync bidireccional

---

## Requisitos Técnicos

### Performance
- Respuesta de disponibilidad: < 1 segundo
- 99.9% uptime
- Rate limiting adecuado

### Seguridad
- SSL/TLS obligatorio
- Autenticación mutua (mTLS) para E2E
- Validación de tokens de Google

### Monitoreo
- Alertas de fallos de sync
- Dashboard de métricas
- Logs de todas las interacciones

---

## Consideraciones por País

| País | Estado Google Reserve |
|------|----------------------|
| México | ✅ Disponible |
| Colombia | ✅ Disponible |
| Argentina | ⚠️ Limitado |
| Chile | ✅ Disponible |
| Perú | ⚠️ Verificar |

---

## Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Orgs con Google Reserve | 30% de Profesional+ |
| Reservas desde Google | 15% del total |
| Tasa conversión Google | > 40% |
| Tiempo activación | < 7 días |

---

## Recursos y Referencias

- [Actions Center Partner Portal](https://partnerdash.google.com/apps/actions)
- [Reserve with Google Developer Docs](https://developers.google.com/actions-center/verticals/reservations)
- [Business Link Overview](https://developers.google.com/actions-center/verticals/reservations/bl/overview)
- [Integration Policies](https://developers.google.com/actions-center/verticals/reservations/e2e/policies/integration-policies)
- [Reserve with Google Help](https://support.google.com/reserve/answer/9172607)
- [Trafft Guide](https://trafft.com/reserve-with-google-guide/)

---

**Estimación Fase 1 (Business Link):** 2-3 semanas
**Estimación Fase 2 (E2E):** 6-8 semanas adicionales
