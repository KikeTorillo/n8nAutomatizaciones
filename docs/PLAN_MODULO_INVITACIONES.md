# Plan: Módulo de Invitaciones Digitales

**Fecha**: 3 Diciembre 2025
**Estado**: Propuesta Revisada
**Versión**: 2.0 (Revisión Arquitectura)

---

## 1. Resumen Ejecutivo

Crear un módulo de **Invitaciones Digitales** para eventos (bodas, XV años, bautizos, cumpleaños, eventos corporativos) que permita a las organizaciones crear, personalizar y gestionar invitaciones con sistema RSVP integrado.

### Investigación de Competencia

| Plataforma | Precio | Características Destacadas |
|------------|--------|---------------------------|
| **Brides & Grooms** | $3,222 - $6,888 MXN | Panel organización, RSVP tiempo real, recordatorios automáticos, libro felicitaciones |
| **miBoda.love** | $2,499 - $3,499 MXN | Dominio personalizado, QR únicos, integración tiendas departamentales |
| **Invitio** | No disponible | Multi-evento, animaciones, diseño responsive |

### Propuesta de Valor Diferenciadora

1. **Integración con Nexo**: Clientes, recordatorios automáticos ya existentes
2. **Multi-tenant**: Cada organización gestiona sus propios eventos
3. **Chatbot RSVP Dedicado**: Bot separado para confirmar asistencia vía Telegram/WhatsApp
4. **Sin límite de invitados en Pro**: Modelo por suscripción, no por evento
5. **URLs amigables**: `nexo.app/i/{slug-evento}`

---

## 2. Funcionalidades por Prioridad

### 2.1 Fase 1 - MVP (P0)

| Área | Funcionalidad | Descripción |
|------|---------------|-------------|
| **Eventos** | CRUD básico | Nombre, fecha, tipo, ubicación, descripción |
| **Eventos** | Tipos de evento | boda, xv_anos, bautizo, cumpleanos, corporativo, otro |
| **Eventos** | Estados | borrador, publicado, finalizado, cancelado |
| **Eventos** | Slug único | URL pública: `nexo.app/i/boda-juan-y-maria` |
| **Invitados** | CRUD completo | Nombre, email, teléfono, grupo familiar |
| **Invitados** | Importar CSV | Carga masiva con validación |
| **Invitados** | Link único | Token por invitado para acceso personalizado |
| **Invitados** | Max acompañantes | Límite de personas por invitación |
| **RSVP** | Confirmación web | Formulario público responsive |
| **RSVP** | Estados | pendiente, confirmado, declinado |
| **RSVP** | Contador asistentes | Confirmar cantidad real |
| **RSVP** | Dashboard | Estadísticas en tiempo real |
| **Diseño** | 3 plantillas boda | Plantillas prediseñadas básicas |
| **Compartir** | Botón WhatsApp | Compartir link con mensaje predefinido |

### 2.2 Fase 2 - Personalización (P1)

| Área | Funcionalidad | Descripción |
|------|---------------|-------------|
| **Eventos** | Múltiples ubicaciones | Ceremonia, recepción, after party |
| **Eventos** | Itinerario | Timeline del evento con horarios |
| **Eventos** | Cuenta regresiva | Widget automático basado en fecha |
| **Diseño** | +10 plantillas | XV años, bautizo, cumpleaños, corporativo |
| **Diseño** | Paleta de colores | Personalización de colores |
| **Diseño** | Tipografías | 5-10 fuentes elegantes |
| **Diseño** | Galería fotos | Hasta 50 fotos por evento |
| **Invitados** | Códigos QR | QR único para check-in |
| **Invitados** | Etiquetas | familia_novio, trabajo, amigos, mesa_1 |
| **Invitados** | Exportar CSV | Lista para catering/mesa |
| **RSVP** | Fecha límite | Bloquear después de fecha |
| **RSVP** | Recordatorios auto | WhatsApp/Email a pendientes |
| **Extras** | Mesa de regalos | Lista de deseos + sobre digital |
| **Extras** | Libro felicitaciones | Mensajes públicos de invitados |
| **Extras** | Agregar calendario | Google, Apple, Outlook |
| **Extras** | Mapa interactivo | Google Maps/Waze |
| **Extras** | Código vestimenta | Con referencia visual |

### 2.3 Fase 3 - IA y Avanzado (P2)

| Área | Funcionalidad | Descripción |
|------|---------------|-------------|
| **Chatbot** | Bot RSVP dedicado | Chatbot separado para invitaciones |
| **Chatbot** | Confirmar vía chat | RSVP por Telegram/WhatsApp |
| **Chatbot** | Consultar detalles | Fecha, ubicación, itinerario |
| **Diseño** | Video principal | Embed YouTube/Vimeo |
| **Diseño** | Animaciones | Transiciones suaves, parallax |
| **Diseño** | Historia pareja | Sección narrativa timeline |
| **Extras** | Save the Date | Versión previa simplificada |
| **Extras** | Playlist Spotify | Embed o sugerencias |
| **Extras** | Check-in QR | Escaneo en evento |
| **Extras** | Restricciones dietéticas | Campo en RSVP |

---

## 3. Arquitectura Técnica

### 3.1 Estructura de Archivos

```
backend/app/modules/invitaciones/
├── manifest.json
├── controllers/
│   ├── eventos.controller.js
│   ├── invitados.controller.js
│   ├── rsvp.controller.js
│   ├── galeria.controller.js
│   ├── mesa-regalos.controller.js
│   ├── felicitaciones.controller.js
│   └── chatbot-invitaciones.controller.js
├── models/
│   ├── evento.model.js
│   ├── invitado.model.js
│   ├── galeria.model.js
│   ├── mesa-regalos.model.js
│   ├── felicitaciones.model.js
│   └── plantilla.model.js
├── routes/
│   ├── index.js
│   ├── eventos.routes.js
│   ├── invitados.routes.js
│   ├── public.routes.js
│   └── chatbot.routes.js
├── schemas/
│   ├── evento.schema.js
│   ├── invitado.schema.js
│   └── rsvp.schema.js
└── services/
    ├── qr-generator.service.js
    ├── csv-import.service.js
    └── reminder.service.js

sql/invitaciones/
├── 01-tablas.sql
├── 02-rls.sql
├── 03-funciones.sql
├── 04-triggers.sql
├── 05-indices.sql
└── 06-datos-iniciales.sql

frontend/src/
├── pages/invitaciones/
│   ├── EventosPage.jsx
│   ├── EventoDetallePage.jsx
│   ├── InvitadosPage.jsx
│   ├── RSVPDashboardPage.jsx
│   └── MesaRegalosPage.jsx
├── pages/public/
│   └── InvitacionPublicaPage.jsx
├── components/invitaciones/
│   ├── EventoForm.jsx
│   ├── InvitadosList.jsx
│   ├── ImportarInvitadosModal.jsx
│   ├── PlantillasSelector.jsx
│   ├── PersonalizacionPanel.jsx
│   ├── RSVPStats.jsx
│   ├── GaleriaUploader.jsx
│   ├── UbicacionesEditor.jsx
│   └── PreviewInvitacion.jsx
└── hooks/
    └── useInvitaciones.js
```

### 3.2 Manifest del Módulo

```json
{
  "name": "invitaciones",
  "display_name": "Invitaciones Digitales",
  "version": "1.0.0",
  "description": "Invitaciones digitales para eventos con RSVP integrado",
  "depends": ["core"],
  "routes": {
    "eventos": "/api/v1/invitaciones/eventos",
    "invitados": "/api/v1/invitaciones/invitados",
    "public": "/api/v1/public/invitacion"
  },
  "resources": {
    "eventos": {
      "table": "eventos_invitacion",
      "limit_field": "limite_eventos_activos"
    },
    "invitados": {
      "table": "invitados_evento",
      "limit_field": "limite_invitados_evento"
    }
  },
  "tables": [
    "plantillas_invitacion",
    "eventos_invitacion",
    "ubicaciones_evento",
    "galeria_evento",
    "invitados_evento",
    "mesa_regalos",
    "felicitaciones_evento",
    "chatbot_invitaciones_config"
  ],
  "features": [
    "Crear eventos con múltiples tipos",
    "Gestión de invitados con importación CSV",
    "Sistema RSVP con dashboard en tiempo real",
    "Plantillas personalizables",
    "Galería de fotos",
    "Mesa de regalos digital",
    "Libro de felicitaciones",
    "Chatbot RSVP dedicado",
    "Códigos QR para check-in"
  ],
  "priority": 8,
  "required": false,
  "can_disable": true
}
```

### 3.3 Tablas SQL

```sql
-- =============================================
-- MÓDULO INVITACIONES DIGITALES
-- =============================================
-- Convenciones:
-- • IDs: SERIAL (INTEGER) - consistente con arquitectura
-- • RLS: app.current_tenant_id::integer
-- • Timestamps: creado_en, actualizado_en
-- • Soft delete: activo BOOLEAN
-- =============================================

-- ---------------------------------------------
-- PLANTILLAS DE INVITACIÓN (datos del sistema)
-- ---------------------------------------------
CREATE TABLE plantillas_invitacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL, -- boda, xv_anos, bautizo, cumpleanos, corporativo, otro
    descripcion TEXT,
    preview_url TEXT,
    configuracion_default JSONB DEFAULT '{}',
    -- Configuración visual
    colores_default JSONB DEFAULT '{"primario": "#000000", "secundario": "#ffffff", "acento": "#gold"}',
    fuente_default VARCHAR(50) DEFAULT 'Playfair Display',
    -- Control
    es_premium BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------
-- EVENTOS DE INVITACIÓN
-- ---------------------------------------------
CREATE TABLE eventos_invitacion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    plantilla_id INTEGER REFERENCES plantillas_invitacion(id),
    -- Información básica
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- boda, xv_anos, bautizo, cumpleanos, corporativo, otro
    slug VARCHAR(100) NOT NULL,
    descripcion TEXT,
    -- Fechas
    fecha_evento TIMESTAMPTZ NOT NULL,
    hora_evento TIME,
    fecha_fin_evento TIMESTAMPTZ, -- Para eventos de varios días
    fecha_limite_rsvp TIMESTAMPTZ,
    -- Diseño
    imagen_portada TEXT,
    configuracion JSONB DEFAULT '{}', -- colores, fuentes, secciones activas
    -- Estado
    estado VARCHAR(20) DEFAULT 'borrador', -- borrador, publicado, finalizado, cancelado
    activo BOOLEAN DEFAULT true,
    -- Metadata
    metadata JSONB DEFAULT '{}', -- hashtag, codigo_vestimenta, notas_adicionales
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    publicado_en TIMESTAMPTZ,
    -- Constraints
    UNIQUE(organizacion_id, slug),
    CONSTRAINT estado_valido CHECK (estado IN ('borrador', 'publicado', 'finalizado', 'cancelado')),
    CONSTRAINT tipo_valido CHECK (tipo IN ('boda', 'xv_anos', 'bautizo', 'cumpleanos', 'corporativo', 'otro'))
);

-- ---------------------------------------------
-- UBICACIONES DEL EVENTO
-- ---------------------------------------------
CREATE TABLE ubicaciones_evento (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_invitacion(id) ON DELETE CASCADE,
    -- Información
    nombre VARCHAR(100) NOT NULL, -- "Ceremonia Religiosa", "Recepción", "After Party"
    direccion TEXT,
    lugar VARCHAR(150), -- "Hacienda San Gabriel"
    -- Geolocalización
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    google_maps_url TEXT,
    waze_url TEXT,
    -- Horario
    hora_inicio TIME,
    hora_fin TIME,
    -- Extras
    notas TEXT,
    codigo_vestimenta VARCHAR(100),
    -- Control
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true
);

-- ---------------------------------------------
-- GALERÍA DE FOTOS
-- ---------------------------------------------
CREATE TABLE galeria_evento (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_invitacion(id) ON DELETE CASCADE,
    -- Imagen
    url_imagen TEXT NOT NULL,
    thumbnail_url TEXT,
    titulo VARCHAR(100),
    descripcion TEXT,
    -- Control
    es_principal BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------
-- INVITADOS (con RSVP embebido)
-- ---------------------------------------------
CREATE TABLE invitados_evento (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    evento_id INTEGER NOT NULL REFERENCES eventos_invitacion(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id), -- Opcional: vincular a cliente existente
    -- Información del invitado
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    -- Agrupación
    grupo_familiar VARCHAR(100), -- "Familia García López"
    etiquetas TEXT[] DEFAULT '{}', -- ['familia_novio', 'mesa_5', 'niños']
    -- Invitación
    max_acompanantes INTEGER DEFAULT 0,
    token VARCHAR(64) UNIQUE NOT NULL,
    codigo_qr TEXT,
    -- RSVP (embebido para simplificar queries)
    estado_rsvp VARCHAR(20) DEFAULT 'pendiente', -- pendiente, confirmado, declinado
    num_asistentes INTEGER, -- Cantidad confirmada
    mensaje_rsvp TEXT, -- Mensaje del invitado
    restricciones_dieteticas TEXT,
    confirmado_en TIMESTAMPTZ,
    confirmado_via VARCHAR(20), -- web, whatsapp, telegram, manual
    -- Notas
    notas TEXT,
    -- Control
    activo BOOLEAN DEFAULT true,
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints
    CONSTRAINT estado_rsvp_valido CHECK (estado_rsvp IN ('pendiente', 'confirmado', 'declinado'))
);

-- ---------------------------------------------
-- MESA DE REGALOS
-- ---------------------------------------------
CREATE TABLE mesa_regalos (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_invitacion(id) ON DELETE CASCADE,
    -- Información
    tipo VARCHAR(20) NOT NULL, -- producto, sobre_digital, link_externo
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    -- Enlaces
    url_externa TEXT, -- Link a tienda
    imagen_url TEXT,
    -- Estado
    comprado BOOLEAN DEFAULT FALSE,
    comprado_por VARCHAR(200),
    comprado_en TIMESTAMPTZ,
    -- Para sobre digital
    datos_bancarios JSONB, -- {banco, clabe, titular}
    -- Control
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints
    CONSTRAINT tipo_regalo_valido CHECK (tipo IN ('producto', 'sobre_digital', 'link_externo'))
);

-- ---------------------------------------------
-- LIBRO DE FELICITACIONES
-- ---------------------------------------------
CREATE TABLE felicitaciones_evento (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_invitacion(id) ON DELETE CASCADE,
    invitado_id INTEGER REFERENCES invitados_evento(id) ON DELETE SET NULL,
    -- Contenido
    nombre_autor VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    -- Moderación
    aprobado BOOLEAN DEFAULT true,
    moderado_en TIMESTAMPTZ,
    moderado_por INTEGER REFERENCES usuarios(id),
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------
-- CHATBOT INVITACIONES (separado del de citas)
-- ---------------------------------------------
CREATE TABLE chatbot_invitaciones_config (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    evento_id INTEGER REFERENCES eventos_invitacion(id) ON DELETE CASCADE, -- NULL = config general org
    -- Configuración plataforma
    plataforma VARCHAR(20) NOT NULL, -- telegram, whatsapp
    nombre VARCHAR(100) NOT NULL,
    -- Credenciales (encriptadas o referencia)
    config_plataforma JSONB NOT NULL, -- bot_token, phone_number_id, etc.
    -- Configuración IA
    ai_provider VARCHAR(50) DEFAULT 'openrouter',
    ai_model VARCHAR(100) DEFAULT 'qwen/qwen3-32b',
    ai_temperature DECIMAL(2,1) DEFAULT 0.7,
    system_prompt TEXT,
    -- n8n
    n8n_workflow_id VARCHAR(100),
    n8n_workflow_activo BOOLEAN DEFAULT false,
    webhook_url TEXT,
    -- Estado
    activo BOOLEAN DEFAULT true,
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints
    UNIQUE(organizacion_id, evento_id, plataforma),
    CONSTRAINT plataforma_valida CHECK (plataforma IN ('telegram', 'whatsapp'))
);

-- ---------------------------------------------
-- RECORDATORIOS INVITACIONES
-- ---------------------------------------------
CREATE TABLE recordatorios_invitacion (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_invitacion(id) ON DELETE CASCADE,
    invitado_id INTEGER REFERENCES invitados_evento(id) ON DELETE CASCADE,
    -- Configuración
    tipo VARCHAR(30) NOT NULL, -- rsvp_pendiente, evento_proximo, agradecimiento
    canal VARCHAR(20) NOT NULL, -- email, whatsapp, telegram
    -- Programación
    dias_antes INTEGER, -- NULL si es tipo agradecimiento (post-evento)
    programado_para TIMESTAMPTZ NOT NULL,
    -- Estado
    enviado BOOLEAN DEFAULT FALSE,
    enviado_en TIMESTAMPTZ,
    error TEXT,
    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Políticas RLS

```sql
-- =============================================
-- POLÍTICAS RLS - MÓDULO INVITACIONES
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE eventos_invitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitados_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa_regalos ENABLE ROW LEVEL SECURITY;
ALTER TABLE felicitaciones_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_invitaciones_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorios_invitacion ENABLE ROW LEVEL SECURITY;

-- Función helper para tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), '')::integer,
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Función helper para bypass
CREATE OR REPLACE FUNCTION is_rls_bypassed() RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('app.bypass_rls', true) = 'true';
END;
$$ LANGUAGE plpgsql STABLE;

-- Eventos
CREATE POLICY eventos_invitacion_tenant ON eventos_invitacion
    USING (organizacion_id = get_current_tenant_id() OR is_rls_bypassed());

-- Ubicaciones (heredan del evento)
CREATE POLICY ubicaciones_evento_tenant ON ubicaciones_evento
    USING (
        evento_id IN (SELECT id FROM eventos_invitacion WHERE organizacion_id = get_current_tenant_id())
        OR is_rls_bypassed()
    );

-- Galería (heredan del evento)
CREATE POLICY galeria_evento_tenant ON galeria_evento
    USING (
        evento_id IN (SELECT id FROM eventos_invitacion WHERE organizacion_id = get_current_tenant_id())
        OR is_rls_bypassed()
    );

-- Invitados (tienen organizacion_id directo para mejor performance)
CREATE POLICY invitados_evento_tenant ON invitados_evento
    USING (organizacion_id = get_current_tenant_id() OR is_rls_bypassed());

-- Mesa de regalos
CREATE POLICY mesa_regalos_tenant ON mesa_regalos
    USING (
        evento_id IN (SELECT id FROM eventos_invitacion WHERE organizacion_id = get_current_tenant_id())
        OR is_rls_bypassed()
    );

-- Felicitaciones
CREATE POLICY felicitaciones_evento_tenant ON felicitaciones_evento
    USING (
        evento_id IN (SELECT id FROM eventos_invitacion WHERE organizacion_id = get_current_tenant_id())
        OR is_rls_bypassed()
    );

-- Chatbot config
CREATE POLICY chatbot_invitaciones_tenant ON chatbot_invitaciones_config
    USING (organizacion_id = get_current_tenant_id() OR is_rls_bypassed());

-- Recordatorios
CREATE POLICY recordatorios_invitacion_tenant ON recordatorios_invitacion
    USING (
        evento_id IN (SELECT id FROM eventos_invitacion WHERE organizacion_id = get_current_tenant_id())
        OR is_rls_bypassed()
    );
```

### 3.5 Endpoints API

```
# =============================================
# EVENTOS (autenticado)
# =============================================
POST   /api/v1/invitaciones/eventos                    # Crear evento
GET    /api/v1/invitaciones/eventos                    # Listar eventos
GET    /api/v1/invitaciones/eventos/:id                # Obtener evento
PUT    /api/v1/invitaciones/eventos/:id                # Actualizar evento
DELETE /api/v1/invitaciones/eventos/:id                # Eliminar evento (soft)
POST   /api/v1/invitaciones/eventos/:id/publicar       # Cambiar a publicado
POST   /api/v1/invitaciones/eventos/:id/finalizar      # Cambiar a finalizado
GET    /api/v1/invitaciones/eventos/:id/estadisticas   # Dashboard RSVP

# =============================================
# UBICACIONES (autenticado)
# =============================================
POST   /api/v1/invitaciones/eventos/:eventoId/ubicaciones
GET    /api/v1/invitaciones/eventos/:eventoId/ubicaciones
PUT    /api/v1/invitaciones/ubicaciones/:id
DELETE /api/v1/invitaciones/ubicaciones/:id

# =============================================
# INVITADOS (autenticado)
# =============================================
POST   /api/v1/invitaciones/eventos/:eventoId/invitados           # Crear invitado
GET    /api/v1/invitaciones/eventos/:eventoId/invitados           # Listar invitados
GET    /api/v1/invitaciones/invitados/:id                         # Obtener invitado
PUT    /api/v1/invitaciones/invitados/:id                         # Actualizar
DELETE /api/v1/invitaciones/invitados/:id                         # Eliminar (soft)
POST   /api/v1/invitaciones/eventos/:eventoId/invitados/importar  # Importar CSV
GET    /api/v1/invitaciones/eventos/:eventoId/invitados/exportar  # Exportar CSV
POST   /api/v1/invitaciones/invitados/:id/regenerar-qr            # Regenerar QR
PATCH  /api/v1/invitaciones/invitados/:id/rsvp                    # RSVP manual (admin)

# =============================================
# GALERÍA (autenticado)
# =============================================
POST   /api/v1/invitaciones/eventos/:eventoId/galeria             # Subir imagen
GET    /api/v1/invitaciones/eventos/:eventoId/galeria             # Listar
PUT    /api/v1/invitaciones/galeria/:id                           # Actualizar orden/titulo
DELETE /api/v1/invitaciones/galeria/:id                           # Eliminar

# =============================================
# MESA DE REGALOS (autenticado)
# =============================================
POST   /api/v1/invitaciones/eventos/:eventoId/mesa-regalos
GET    /api/v1/invitaciones/eventos/:eventoId/mesa-regalos
PUT    /api/v1/invitaciones/mesa-regalos/:id
DELETE /api/v1/invitaciones/mesa-regalos/:id

# =============================================
# PLANTILLAS (autenticado - lectura)
# =============================================
GET    /api/v1/invitaciones/plantillas                            # Listar disponibles
GET    /api/v1/invitaciones/plantillas/:id                        # Detalle plantilla

# =============================================
# RUTAS PÚBLICAS (sin auth, con token)
# =============================================
GET    /api/v1/public/invitacion/:slug                            # Ver evento (info general)
GET    /api/v1/public/invitacion/:slug/:token                     # Ver invitación personalizada
POST   /api/v1/public/invitacion/:slug/:token/rsvp                # Confirmar asistencia
GET    /api/v1/public/invitacion/:slug/mesa-regalos               # Ver mesa de regalos
POST   /api/v1/public/invitacion/:slug/:token/felicitacion        # Enviar felicitación
GET    /api/v1/public/invitacion/:slug/felicitaciones             # Ver libro de felicitaciones

# =============================================
# CHATBOT INVITACIONES (autenticado)
# =============================================
POST   /api/v1/invitaciones/chatbot/configurar                    # Configurar bot
GET    /api/v1/invitaciones/chatbot                               # Listar configs
GET    /api/v1/invitaciones/chatbot/:id                           # Obtener config
PUT    /api/v1/invitaciones/chatbot/:id                           # Actualizar
DELETE /api/v1/invitaciones/chatbot/:id                           # Eliminar
PATCH  /api/v1/invitaciones/chatbot/:id/estado                    # Activar/desactivar
```

---

## 4. Sistema de Chatbot RSVP (Separado)

### 4.1 Justificación

El chatbot de invitaciones debe ser **completamente separado** del chatbot de agendamiento:

| Aspecto | Chatbot Agendamiento | Chatbot Invitaciones |
|---------|---------------------|---------------------|
| **Contexto** | Citas, servicios, horarios | Eventos, RSVP, felicitaciones |
| **Usuarios** | Clientes del negocio | Invitados a eventos |
| **Frecuencia** | Uso recurrente | Uso puntual (1 evento) |
| **System Prompt** | Asistente de reservas | Asistente de evento social |
| **MCP Tools** | 8 tools de citas | 4-5 tools de RSVP |
| **Tono** | Profesional/servicio | Cálido/celebración |

### 4.2 Herramientas MCP para Invitaciones

```javascript
// backend/mcp-server/tools/invitaciones/

/**
 * Tool: buscarInvitacionPorTelefono
 * Busca la invitación de un usuario por su número de teléfono
 */
{
  name: "buscarInvitacionPorTelefono",
  description: "Busca la invitación de un usuario por teléfono para un evento específico",
  parameters: {
    telefono: "string - Número de teléfono del invitado",
    evento_id: "number - ID del evento (opcional si solo hay uno activo)"
  },
  returns: {
    invitado: "object - Datos del invitado",
    evento: "object - Datos del evento",
    estado_rsvp: "string - Estado actual de confirmación"
  }
}

/**
 * Tool: confirmarAsistenciaEvento
 * Confirma o declina asistencia a un evento
 */
{
  name: "confirmarAsistenciaEvento",
  description: "Registra la confirmación o declinación de asistencia",
  parameters: {
    invitado_id: "number - ID del invitado",
    confirma: "boolean - true para confirmar, false para declinar",
    num_asistentes: "number - Cantidad de personas que asistirán",
    mensaje: "string - Mensaje opcional del invitado",
    restricciones_dieteticas: "string - Restricciones alimenticias (opcional)"
  }
}

/**
 * Tool: consultarDetallesEvento
 * Obtiene información detallada del evento
 */
{
  name: "consultarDetallesEvento",
  description: "Consulta fecha, ubicaciones, itinerario y detalles del evento",
  parameters: {
    evento_id: "number - ID del evento"
  },
  returns: {
    evento: "object - Información completa",
    ubicaciones: "array - Lista de ubicaciones con mapas",
    itinerario: "array - Timeline del evento"
  }
}

/**
 * Tool: enviarFelicitacion
 * Agrega un mensaje al libro de felicitaciones
 */
{
  name: "enviarFelicitacion",
  description: "Envía un mensaje de felicitación para el libro del evento",
  parameters: {
    evento_id: "number - ID del evento",
    invitado_id: "number - ID del invitado (opcional)",
    nombre_autor: "string - Nombre de quien envía",
    mensaje: "string - Mensaje de felicitación"
  }
}

/**
 * Tool: consultarMesaRegalos
 * Obtiene la lista de regalos disponibles
 */
{
  name: "consultarMesaRegalos",
  description: "Consulta los regalos disponibles en la mesa de regalos",
  parameters: {
    evento_id: "number - ID del evento",
    solo_disponibles: "boolean - Filtrar solo no comprados"
  }
}
```

### 4.3 System Prompt del Bot

```
Eres el asistente virtual para el evento "{nombre_evento}" de {nombre_organizacion}.

Tu rol es ayudar a los invitados a:
1. Confirmar su asistencia (RSVP)
2. Consultar detalles del evento (fecha, lugar, horario)
3. Ver la mesa de regalos
4. Enviar felicitaciones a los anfitriones

INFORMACIÓN DEL EVENTO:
- Evento: {nombre_evento}
- Fecha: {fecha_evento}
- Tipo: {tipo_evento}
- Fecha límite RSVP: {fecha_limite_rsvp}

INSTRUCCIONES:
- Sé cálido y amigable, es una celebración especial
- Siempre verifica la identidad del invitado por su teléfono
- Si no encuentras al invitado, sugiere contactar a los anfitriones
- No reveles información de otros invitados
- Responde en español
```

---

## 5. Modelo de Negocio

### 5.1 Integración con Planes Actuales

| Plan | Precio | Límites Invitaciones |
|------|--------|---------------------|
| **Trial** | $0 (14 días) | 1 evento, 50 invitados, 3 plantillas básicas |
| **Pro** | $249/usuario/mes | Eventos ilimitados, invitados ilimitados, todas las plantillas |
| **Custom** | Negociado | Sin límites + soporte dedicado |

### 5.2 Features por Plan

| Característica | Trial | Pro |
|----------------|-------|-----|
| Eventos activos | 1 | Ilimitados |
| Invitados por evento | 50 | Ilimitados |
| Fotos en galería | 5 | 50 |
| Plantillas disponibles | 3 básicas | Todas |
| Personalización colores | Limitada | Completa |
| Múltiples ubicaciones | 1 | Ilimitadas |
| Recordatorios automáticos | ❌ | ✅ |
| Chatbot RSVP | ❌ | ✅ |
| Mesa de regalos | ❌ | ✅ |
| QR por invitado | ❌ | ✅ |
| Exportar CSV | ❌ | ✅ |
| Libro de felicitaciones | ✅ (solo ver) | ✅ (completo) |

### 5.3 Límites en Base de Datos

Agregar a `planes_subscripcion`:
```sql
ALTER TABLE planes_subscripcion ADD COLUMN
    limite_eventos_activos INTEGER,
    limite_invitados_evento INTEGER,
    limite_fotos_galeria INTEGER DEFAULT 5;

-- Actualizar planes
UPDATE planes_subscripcion SET
    limite_eventos_activos = 1,
    limite_invitados_evento = 50,
    limite_fotos_galeria = 5
WHERE codigo_plan = 'trial';

UPDATE planes_subscripcion SET
    limite_eventos_activos = NULL, -- Sin límite
    limite_invitados_evento = NULL,
    limite_fotos_galeria = 50
WHERE codigo_plan = 'pro';
```

---

## 6. Fases de Implementación

### Fase 1: MVP (Estimado: 2-3 semanas)

| Componente | Items | Detalle |
|------------|-------|---------|
| **SQL** | 6 tablas | eventos, ubicaciones, galeria, invitados, felicitaciones, plantillas |
| **Backend** | ~20 endpoints | CRUD + públicos + stats |
| **Frontend** | 5 páginas | Lista, detalle, invitados, RSVP dashboard, público |
| **Plantillas** | 3 | Bodas elegante, moderno, rústico |

**Entregables MVP:**
- [ ] Estructura SQL + RLS + índices
- [ ] Modelo + Controller eventos
- [ ] Modelo + Controller invitados
- [ ] Importación CSV básica
- [ ] Endpoints públicos RSVP
- [ ] Vista pública invitación
- [ ] Dashboard estadísticas RSVP
- [ ] 3 plantillas de boda
- [ ] Compartir por WhatsApp
- [ ] Página lista eventos
- [ ] Página detalle/edición evento
- [ ] Página gestión invitados

### Fase 2: Personalización (Estimado: 2 semanas)

- [ ] +7 plantillas (XV, bautizo, cumple, corp)
- [ ] Editor colores y fuentes
- [ ] Galería de fotos + upload
- [ ] Múltiples ubicaciones + mapa
- [ ] Generador QR
- [ ] Exportar CSV invitados
- [ ] Mesa de regalos completa
- [ ] Libro de felicitaciones
- [ ] Agregar a calendario
- [ ] Recordatorios automáticos

### Fase 3: Chatbot RSVP (Estimado: 1-2 semanas)

- [ ] Tabla chatbot_invitaciones_config
- [ ] 5 MCP tools nuevos
- [ ] Workflow n8n dedicado
- [ ] System prompt por evento
- [ ] Configuración desde UI
- [ ] Estadísticas de uso

---

## 7. Almacenamiento de Imágenes

### Recomendación: Cloudinary

| Opción | Pros | Contras |
|--------|------|---------|
| **Cloudinary** | CDN global, transformaciones, tier gratis 25GB | Dependencia externa |
| MinIO (self-hosted) | Control total, sin costos | Requiere infra, sin CDN |
| S3 | Escalable, económico | Config compleja, sin transformaciones |

**Implementación sugerida:**
```javascript
// backend/app/utils/imageUploader.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(file, folder = 'invitaciones') {
  const result = await cloudinary.uploader.upload(file, {
    folder: `nexo/${folder}`,
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  });
  return {
    url: result.secure_url,
    thumbnail: cloudinary.url(result.public_id, {
      width: 300,
      height: 200,
      crop: 'thumb'
    })
  };
}
```

---

## 8. Dependencias a Reutilizar

| Componente Existente | Uso en Invitaciones | Adaptación |
|---------------------|---------------------|------------|
| Sistema de Clientes | Vincular invitado → cliente | FK opcional |
| Ubicaciones (estados/ciudades) | Dirección de ubicaciones | Directo |
| Sistema de Email | Notificaciones RSVP | Templates nuevos |
| Middleware Auth | Proteger rutas admin | Directo |
| Middleware RLS | Multi-tenant | Directo |
| Rate Limiting | Proteger endpoints públicos | Config ajustada |

---

## 9. Métricas de Éxito

| Métrica | Cómo medir | Meta inicial |
|---------|------------|--------------|
| Eventos creados/mes | COUNT eventos | 10/mes |
| Tasa RSVP | confirmados/total invitados | >60% |
| Tiempo respuesta RSVP | AVG(confirmado_en - creado_en) | <48h |
| Uso chatbot | mensajes procesados | 100/evento |
| Conversión Trial→Pro | usuarios que upgradearon | >10% |

---

## 10. Checklist Pre-Desarrollo

- [x] Definir modelo de datos (SQL)
- [x] Definir políticas RLS
- [x] Definir endpoints API
- [x] Definir estructura frontend
- [x] Definir chatbot separado
- [x] Definir límites por plan
- [ ] **Decisión**: Proveedor de imágenes (Cloudinary recomendado)
- [ ] **Decisión**: Confirmar fases y prioridades
- [ ] Crear branch `feature/modulo-invitaciones`
- [ ] Crear carpeta SQL `sql/invitaciones/`
- [ ] Crear módulo backend `backend/app/modules/invitaciones/`

---

**Próximo paso**: Confirmar decisiones pendientes e iniciar Fase 1.
