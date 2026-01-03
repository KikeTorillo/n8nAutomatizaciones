# Plan de Mejoras - Módulo Agendamiento Nexo

## Estado Actual del Módulo (Enero 2026)

### ✅ Implementado y Funcionando

| Componente | Estado | Notas |
|------------|--------|-------|
| **Citas** | ✅ Completo | CRUD, estados (pendiente→confirmada→en_curso→completada/cancelada/no_show), múltiples servicios por cita, walk-in |
| **Profesionales** | ✅ Completo | Gestión de horarios, horarios flexibles/temporales, capacidad máxima simultánea |
| **Bloqueos** | ✅ Completo | Día completo y horario parcial, vacaciones/ausencias, recurrencia |
| **Clientes** | ✅ Completo | Base de datos, historial de citas, notas/preferencias |
| **Comisiones** | ✅ Completo | Cálculo automático al completar citas, reportes por profesional |
| **Recordatorios** | ✅ Completo | Email y WhatsApp configurables, múltiples tiempos de anticipación |
| **Dashboard** | ✅ Completo | Métricas tiempo real, tasa no-show, ingresos del día |
| **Auditoría** | ✅ Completo | Registro IP, User-Agent, timestamps en todas las acciones |

### ⏳ En Desarrollo

| Componente | Estado | Próximo paso |
|------------|--------|--------------|
| **Google Calendar Sync** | 📋 Planificado | Implementar OAuth2 + sincronización bidireccional |

---

## Análisis Competitivo: Nexo vs Mercado

**Fecha:** 2 Enero 2026

---

## 1. Comparativa de Funcionalidades

### Leyenda
- ✅ Implementado completo
- ⚡ Implementado parcial
- ❌ No implementado
- 🔄 En desarrollo

| Funcionalidad | Nexo | AgendaPro | Cal.com | Easy!Appointments |
|--------------|------|-----------|---------|-------------------|
| **RESERVAS ONLINE** |
| Agenda online pública | ✅ | ✅ | ✅ | ✅ |
| Link de reserva personalizable | ⚡ | ✅ | ✅ | ✅ |
| Widget embebible en web | ❌ | ✅ | ✅ | ✅ |
| Múltiples servicios por cita | ✅ | ⚡ | ❌ | ❌ |
| Walk-in (sin cita previa) | ✅ | ❌ | ❌ | ❌ |
| Reagendamiento online | ✅ | ✅ | ✅ | ✅ |
| Cancelación online por cliente | ⚡ | ✅ | ✅ | ✅ |
| **CALENDARIO** |
| Vista diaria/semanal/mensual | ✅ | ✅ | ✅ | ✅ |
| Sincronización Google Calendar | ❌ | ✅ | ✅ | ✅ |
| Calendario público compartible | ❌ | ✅ | ✅ | ✅ |
| Detección de zona horaria | ⚡ | ✅ | ✅ | ⚡ |
| **PROFESIONALES** |
| Gestión de horarios | ✅ | ✅ | ✅ | ✅ |
| Horarios flexibles/temporales | ✅ | ⚡ | ✅ | ⚡ |
| Bloqueos (vacaciones/ausencias) | ✅ | ✅ | ✅ | ⚡ |
| Asignación automática | ✅ | ⚡ | ✅ | ❌ |
| Round-robin distribución | ❌ | ❌ | ✅ | ❌ |
| Capacidad máxima simultánea | ✅ | ⚡ | ❌ | ❌ |
| **CLIENTES** |
| Base de datos clientes | ✅ | ✅ | ⚡ | ✅ |
| Creación automática de cliente | ✅ | ✅ | ✅ | ✅ |
| Historial de citas por cliente | ✅ | ✅ | ✅ | ✅ |
| Segmentación de clientes | ⚡ | ✅ | ❌ | ❌ |
| Notas/preferencias cliente | ✅ | ✅ | ⚡ | ⚡ |
| Recordatorio de cumpleaños | ❌ | ✅ | ❌ | ❌ |
| **RECORDATORIOS** |
| Email automático | ⚡ | ✅ | ✅ | ✅ |
| SMS automático | ❌ | ✅ | ✅ | ⚡ |
| WhatsApp automático | ⚡ | ✅ | ❌ | ❌ |
| Confirmación requerida | ✅ | ✅ | ✅ | ⚡ |
| Recordatorio configurable (horas) | ✅ | ✅ | ✅ | ✅ |
| **PAGOS** |
| Registro de pagos | ✅ | ✅ | ✅ | ⚡ |
| Gift cards / Cupones | ❌ | ✅ | ❌ | ❌ |
| **COMISIONES** |
| Cálculo automático | ✅ | ✅ | ❌ | ❌ |
| Reportes de comisiones | ✅ | ✅ | ❌ | ❌ |
| **REPORTES** |
| Dashboard tiempo real | ✅ | ✅ | ⚡ | ❌ |
| Métricas del día | ✅ | ✅ | ⚡ | ❌ |
| Tasa de no-show | ✅ | ✅ | ⚡ | ❌ |
| Ingresos por período | ⚡ | ✅ | ⚡ | ❌ |
| Reportes exportables | ❌ | ✅ | ✅ | ❌ |
| **MARKETING** |
| Email marketing | ❌ | ✅ | ❌ | ❌ |
| Encuestas satisfacción | ❌ | ✅ | ❌ | ❌ |
| Campañas automatizadas | ❌ | ✅ | ❌ | ❌ |
| **INTEGRACIONES** |
| API REST | ✅ | ✅ | ✅ | ✅ |
| Webhooks | ✅ | ✅ | ✅ | ❌ |
| Chatbots (Telegram/WhatsApp) | ✅ | ❌ | ❌ | ❌ |
| CRM integración | ⚡ | ✅ | ✅ | ❌ |
| **MULTI-UBICACIÓN** |
| Múltiples sucursales | ✅ | ✅ | ✅ | ⚡ |
| Configuración por sucursal | ✅ | ✅ | ✅ | ❌ |
| **APP MÓVIL** |
| PWA responsive | ✅ | ✅ | ✅ | ⚡ |
| **WORKFLOWS** |
| Automatizaciones multi-paso | ⚡ | ✅ | ✅ | ❌ |
| Triggers personalizables | ⚡ | ✅ | ✅ | ❌ |

---

## 2. Fortalezas Actuales de Nexo

### Ventajas Competitivas Únicas

1. **Múltiples servicios por cita** - Ni Cal.com ni Easy!Appointments lo soportan
2. **Walk-in support** - Único en el mercado comparado
3. **Chatbots IA integrados** - Telegram/WhatsApp con IA conversacional
4. **Capacidad máxima simultánea** - Control fino de slots
5. **Comisiones integradas** - Módulo completo incluido
6. **Multi-tenant robusto** - RLS con 243+ políticas
7. **Particionamiento automático** - Performance para alto volumen
8. **Auditoría completa** - IP, User-Agent, timestamps

---

## 3. Gaps Críticos a Cerrar

### Prioridad ALTA (Impacto directo en competitividad)

| Gap | Impacto | Esfuerzo | Justificación |
|-----|---------|----------|---------------|
| **Sincronización Google Calendar** | Alto | Medio | Estándar en todos los competidores |
| **Widget embebible** | Alto | Bajo | Facilita adopción en sitios web existentes |
| **SMS automático** | Alto | Bajo | Mayor tasa apertura que email |
| **Encuestas satisfacción** | Medio | Bajo | Feedback loop para mejora continua |

### Prioridad MEDIA (Diferenciación)

| Gap | Impacto | Esfuerzo | Justificación |
|-----|---------|----------|---------------|
| **Round-robin distribución** | Medio | Medio | Equipos grandes |
| **Reportes exportables (PDF/Excel)** | Medio | Bajo | Contabilidad/auditoría |
| **Email marketing básico** | Medio | Medio | Retención de clientes |
| **Gift cards/Cupones** | Medio | Medio | Promociones |

### Prioridad BAJA (Nice to have)

| Gap | Impacto | Esfuerzo | Justificación |
|-----|---------|----------|---------------|
| **Recordatorio cumpleaños** | Bajo | Bajo | Marketing automation |

---

## 4. Plan de Implementación

### Fase 1: Fundamentos (2-3 semanas)

#### 1.1 Widget Embebible de Reservas
```
Objetivo: Permitir incrustar booking en cualquier sitio web
Archivos a crear:
- frontend/src/components/public/BookingWidget.jsx
- frontend/src/pages/public/EmbedBooking.jsx
- backend/app/modules/agendamiento/routes/embed.routes.js

Características:
- Script JS embebible (<script src="nexo.com/widget/ORG_ID">)
- iFrame responsive
- Personalización de colores/logo
- Sin autenticación requerida
```

#### 1.2 Sincronización Google Calendar (PLAN DETALLADO)

**Objetivo:** Sincronización bidireccional entre citas de Nexo y Google Calendar del profesional

**Arquitectura:**
```
PROFESIONAL conecta Google Calendar (OAuth2 Authorization Code Flow)
        ↓
Tokens cifrados en BD (AES-256-GCM)
        ↓
┌─────────────────────────────────────────┐
│         SYNC NEXO → GOOGLE              │
├─────────────────────────────────────────┤
│ Crear cita    → calendar.events.insert  │
│ Actualizar    → calendar.events.update  │
│ Cancelar      → calendar.events.delete  │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│         SYNC GOOGLE → NEXO              │
├─────────────────────────────────────────┤
│ Leer eventos Google (pg_cron 15 min)    │
│ Crear bloqueos_horarios automáticos     │
│ Evitar conflictos de disponibilidad     │
└─────────────────────────────────────────┘
```

**Estado Actual OAuth Google:**
- Existe OAuth para LOGIN (google-auth-library, ID Token)
- NO existe integración con Google Calendar API
- NO se almacenan refresh tokens (solo google_id en usuarios)
- Requiere implementar Authorization Code Flow con scope calendar

**Archivos a CREAR (7 nuevos):**
| Archivo | Descripción |
|---------|-------------|
| `sql/agendamiento/06-integraciones-calendario.sql` | Tabla para tokens OAuth cifrados |
| `backend/app/utils/tokenEncryption.js` | Cifrado AES-256-GCM para tokens |
| `backend/app/services/googleCalendar.service.js` | Servicio singleton principal |
| `backend/app/modules/agendamiento/controllers/calendar.controller.js` | Endpoints OAuth |
| `backend/app/modules/agendamiento/routes/calendar.js` | Rutas /calendar/* |
| `frontend/src/components/configuracion/GoogleCalendarConnect.jsx` | UI conexión |
| `frontend/src/hooks/useGoogleCalendar.js` | Hook React Query |

**Archivos a MODIFICAR (6 existentes):**
| Archivo | Cambio |
|---------|--------|
| `sql/citas/01-tablas-citas.sql` | Agregar columna `google_event_id` |
| `backend/app/modules/agendamiento/models/citas/cita.base.model.js` | Hooks sync en crear/actualizar/eliminar |
| `backend/app/modules/agendamiento/routes/index.js` | Registrar rutas /calendar |
| `frontend/src/pages/configuracion/` | Agregar sección Google Calendar |
| `frontend/src/services/api/index.js` | Agregar calendarApi |
| `backend/package.json` | Agregar googleapis |

**Nueva Tabla SQL:**
```sql
CREATE TABLE integraciones_calendario (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id),
    proveedor VARCHAR(20) DEFAULT 'google',

    -- Tokens cifrados AES-256-GCM
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_iv TEXT NOT NULL,
    token_auth_tag TEXT NOT NULL,

    -- Metadata
    google_email VARCHAR(255),
    calendar_id VARCHAR(255) DEFAULT 'primary',
    token_expiry TIMESTAMPTZ,

    -- Config sync
    sync_habilitado BOOLEAN DEFAULT true,
    sync_direccion VARCHAR(20) DEFAULT 'bidireccional',
    sync_ultimo TIMESTAMPTZ,

    -- Estado
    activo BOOLEAN DEFAULT true,
    error_ultimo TEXT,

    UNIQUE (profesional_id, proveedor)
);
-- RLS policy para multi-tenant
```

**Variables de Entorno Nuevas:**
```bash
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/v1/calendar/callback
CALENDAR_ENCRYPTION_KEY=<64 hex chars: openssl rand -hex 32>
```

**Dependencia npm:**
```json
{ "googleapis": "^131.0.0" }
```

**Fases de Implementación:**
| Fase | Descripción | Tiempo |
|------|-------------|--------|
| 1 | Base: tabla SQL, cifrado, columna google_event_id | 1-2 horas |
| 2 | Backend OAuth: servicio, controller, rutas | 2-3 horas |
| 3 | Sync Nexo → Google: hooks en CRUD citas | 2 horas |
| 4 | Frontend: UI conectar/desconectar | 2 horas |
| 5 | Sync Google → Nexo: pg_cron, bloqueos automáticos | 3-4 horas |
| **Total** | **Bidireccional completo** | **10-13 horas** |

**Seguridad:**
- Cifrado: AES-256-GCM con IV único por registro
- CSRF: State JWT en OAuth flow
- RLS: Política tenant en tabla integraciones
- Refresh: Automático cuando expira access_token

#### 1.3 SMS con Twilio
```
Objetivo: Recordatorios SMS automáticos
Archivos a crear:
- backend/app/services/sms.service.js
- backend/app/modules/agendamiento/controllers/recordatorios.controller.js

Integración:
- Twilio API (México, Colombia)
- Templates configurables por organización
- Fallback a WhatsApp si falla SMS
```

### Fase 2: Engagement (2 semanas)

#### 2.1 Encuestas Post-Servicio
```
Objetivo: Feedback automático después de cita completada
Archivos a crear:
- backend/app/modules/agendamiento/models/encuesta.model.js
- frontend/src/pages/public/EncuestaServicio.jsx
- sql/citas/06-encuestas.sql

Flujo:
1. Cita completada → trigger n8n
2. Enviar email/WhatsApp con link encuesta
3. Cliente responde (1-5 estrellas + comentario)
4. Agregar a métricas del profesional
```

#### 2.2 Reportes Exportables
```
Objetivo: Exportar a PDF/Excel
Archivos a modificar:
- backend/app/modules/agendamiento/controllers/reportes.controller.js
- Dependencias: pdfkit, exceljs

Reportes:
- Citas por período
- Ingresos por profesional
- No-shows por período
- Comisiones
```

### Fase 3: Distribución Inteligente (1-2 semanas)

#### 3.1 Round-Robin
```
Objetivo: Distribuir citas equitativamente entre profesionales
Archivos a modificar:
- backend/app/modules/agendamiento/services/asignacion.service.js

Algoritmos:
- Least Recently Booked (menos reciente)
- Weighted (por pesos configurables)
- Availability-based (quien tenga más slots)
```

#### 3.2 Routing por Servicio
```
Objetivo: Dirigir a profesional correcto automáticamente
Reglas configurables:
- Por tipo de servicio
- Por ubicación del cliente
- Por idioma preferido
- Por historial (mismo profesional)
```

### Fase 4: Gift Cards (1 semana)

#### 4.1 Gift Cards
```
Objetivo: Vender tarjetas de regalo
- Código único generado
- Monto fijo o abierto
- Vencimiento configurable
- Canjeable en checkout
```

---

## 5. Métricas de Éxito

### KPIs a Medir Post-Implementación

| Métrica | Baseline Actual | Meta |
|---------|-----------------|------|
| Tasa de no-show | ~15% | <5% (con abonos) |
| Conversión booking widget | N/A | >3% visitantes |
| NPS (encuestas) | N/A | >50 |
| Sync calendar activos | 0% | >40% usuarios |
| Citas via SMS confirm | 0% | >60% |

---

## 6. Dependencias Técnicas

### Nuevas Librerías Backend
```json
{
  "googleapis": "^131.0.0",
  "twilio": "^4.0.0",
  "pdfkit": "^0.14.0",
  "exceljs": "^4.4.0"
}
```

### Variables de Entorno Nuevas
```env
# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
CALENDAR_ENCRYPTION_KEY=<64 hex chars: openssl rand -hex 32>
```

---

## 7. Estimación de Esfuerzo Total

| Fase | Duración | Prioridad |
|------|----------|-----------|
| Fase 1: Fundamentos (Widget, Google Calendar, SMS) | 2-3 semanas | ALTA |
| Fase 2: Engagement (Encuestas, Reportes) | 2 semanas | MEDIA |
| Fase 3: Distribución Inteligente (Round-Robin) | 1-2 semanas | MEDIA |
| Fase 4: Gift Cards | 1 semana | BAJA |
| **TOTAL** | **6-8 semanas** | |

---

## 8. Alternativa: Instalar Competidor Open Source

### Easy!Appointments para Comparación
```bash
# Docker Compose para Easy!Appointments
docker run -d \
  --name easyappointments \
  -p 8070:80 \
  -e DB_HOST=postgres_db \
  -e DB_NAME=easyappointments \
  -e DB_USERNAME=admin \
  -e DB_PASSWORD=xxx \
  alextselegidis/easyappointments
```

### Cal.com para Comparación
```bash
# Cal.com requiere más setup
git clone https://github.com/calcom/cal.com.git
cd cal.com
cp .env.example .env
# Configurar PostgreSQL, Redis, etc.
yarn install
yarn dev
```

**Recomendación:** Instalar Easy!Appointments primero (más simple) para comparar UX y flujos.

---

## 9. Conclusión

### Nexo ya tiene ventajas únicas:
- Múltiples servicios por cita
- Walk-in support
- Chatbots IA integrados
- Comisiones completas

### Para ser líder del mercado, necesita:
1. **Google Calendar sync** - CRÍTICO
2. **Widget embebible** - ALTO
3. **SMS recordatorios** - ALTO
4. **Encuestas satisfacción** - MEDIO

Con estas mejoras, Nexo superaría a Easy!Appointments y estaría al nivel de AgendaPro, con la ventaja de ser self-hosted y sin costos mensuales por usuario.

---

**Fuentes de Investigación:**
- [AgendaPro](https://agendapro.com/)
- [Cal.com](https://cal.com/)
- [Easy!Appointments](https://easyappointments.org/)
- [Easy!Appointments GitHub](https://github.com/alextselegidis/easyappointments)

---

*Documento creado: 2 Enero 2026*
