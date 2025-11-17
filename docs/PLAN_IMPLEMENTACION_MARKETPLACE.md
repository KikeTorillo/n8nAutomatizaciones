# 🛍️ PLAN DE IMPLEMENTACIÓN - MARKETPLACE DE CLIENTES

**Fecha Creación:** 16 Noviembre 2025
**Prioridad:** 🔴 CRÍTICA - Primera prioridad tras completar Sistema de Comisiones
**Impacto:** Fuente de clientes orgánicos + Network effects
**Esfuerzo Estimado:** 3-4 semanas (120-160 horas)
**Objetivo:** Competir con marketplace de AgendaPro (2M usuarios)

---

## 📑 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Objetivos y Métricas](#objetivos-y-métricas)
3. [Fase 1: Base de Datos](#fase-1-base-de-datos)
4. [Fase 2: Backend API](#fase-2-backend-api)
5. [Fase 3: Frontend Público](#fase-3-frontend-público)
6. [Fase 4: SEO y Analytics](#fase-4-seo-y-analytics)
7. [Testing y Validación](#testing-y-validación)
8. [Cronograma](#cronograma)
9. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

---

## 🎯 RESUMEN EJECUTIVO

### Problema a Resolver

**AgendaPro tiene:**
- 2M usuarios buscando servicios
- Directorio público indexado en Google
- Fuente constante de clientes nuevos para negocios
- Network effects: más negocios → más clientes → más negocios

**Nosotros tenemos:**
- ❌ Cero visibilidad pública
- ❌ Cero tráfico orgánico
- ❌ Negocios dependen 100% de su marketing propio
- ❌ Sin network effects

### Solución Propuesta

**Marketplace Público de Negocios:**
- Directorio SEO-optimizado de negocios por ciudad + industria
- Página pública de cada negocio con agendamiento directo
- Sistema de reseñas para generar confianza
- Analytics de tráfico para negocios
- **Sin cobro adicional** - Incluido en todos los planes

### Ventaja Competitiva vs AgendaPro

1. **Gratis en todos los planes** - AgendaPro limita visibilidad por tier
2. **SEO first** - URLs optimizadas: `/[ciudad]/[industria]/[negocio]`
3. **Agendamiento más rápido** - Sin registro obligatorio
4. **Analytics transparentes** - Negocios ven vistas/clics en tiempo real

---

## 📊 OBJETIVOS Y MÉTRICAS

### Objetivos de Negocio

| Objetivo | Meta 3 Meses | Meta 6 Meses |
|----------|-------------|--------------|
| **Negocios en Marketplace** | 50 | 200 |
| **Tráfico Orgánico Mensual** | 1,000 visitas | 5,000 visitas |
| **Citas desde Marketplace** | 10% de total | 20% de total |
| **Páginas Indexadas Google** | 50 | 200 |
| **Reseñas Totales** | 100 | 500 |

### Métricas de Éxito

**Conversión:**
- Vista de negocio → Clic en "Agendar": > 20%
- Clic en "Agendar" → Cita creada: > 50%
- Conversión total: > 10%

**SEO:**
- 50% de páginas en primeras 3 páginas de Google (3 meses)
- 30% de tráfico desde búsqueda orgánica

**Satisfacción:**
- NPS de negocios con marketplace: > 60
- Rating promedio de negocios: > 4.0/5.0

---

## 🗄️ FASE 1: BASE DE DATOS

**Duración:** 5 días (40 horas)
**Prioridad:** 🔴 CRÍTICA

**⚠️ IMPORTANTE - Estrategia de Implementación:**
- Se creará un **único archivo** `sql/schema/10-marketplace.sql` con TODO el código del marketplace
- **NO se requieren migraciones** - El proyecto se levanta desde cero con `npm run dev`
- El archivo se ejecutará automáticamente siguiendo el orden numérico del esquema
- Se trabaja directamente en rama `main` (no se crea feature branch)

### 1.1 Tablas Nuevas (4 tablas)

#### **Tabla 1: `marketplace_perfiles`**

Configuración del perfil público de cada negocio.

```sql
CREATE TABLE marketplace_perfiles (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER UNIQUE NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Estado del Perfil
    activo BOOLEAN DEFAULT false,  -- Admin activa/desactiva manualmente
    visible_en_directorio BOOLEAN DEFAULT true,  -- Aparece en búsquedas

    -- SEO y URLs
    slug VARCHAR(100) UNIQUE NOT NULL,  -- URL amigable: /guadalajara/barberia/salon-juan
    meta_titulo VARCHAR(70),  -- SEO title tag (max 70 chars)
    meta_descripcion VARCHAR(160),  -- SEO meta description (max 160 chars)

    -- Información Pública
    descripcion_corta VARCHAR(200),  -- Tagline del negocio
    descripcion_larga TEXT,  -- Descripción completa (markdown)

    -- Ubicación Geográfica (para SEO local)
    pais VARCHAR(50) DEFAULT 'México',
    estado VARCHAR(100),  -- Estado/Provincia
    ciudad VARCHAR(100) NOT NULL,  -- Ciudad principal
    codigo_postal VARCHAR(10),
    direccion_completa TEXT,
    latitud DECIMAL(10, 8),  -- Para mapas
    longitud DECIMAL(11, 8),

    -- Contacto Público
    telefono_publico VARCHAR(20),
    email_publico VARCHAR(150),
    sitio_web VARCHAR(255),

    -- Redes Sociales
    instagram VARCHAR(100),  -- @username
    facebook VARCHAR(255),  -- URL completa
    tiktok VARCHAR(100),  -- @username

    -- Galería de Fotos
    logo_url VARCHAR(500),  -- URL de logo principal
    portada_url VARCHAR(500),  -- Imagen de portada/banner
    galeria_urls JSONB DEFAULT '[]',  -- Array de URLs: ["url1", "url2", ...]

    -- Horarios de Atención Públicos
    horarios_atencion JSONB DEFAULT '{}',  -- { "lunes": "9:00-18:00", ... }

    -- Estadísticas (calculadas)
    total_reseñas INTEGER DEFAULT 0,
    rating_promedio DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating_promedio >= 0 AND rating_promedio <= 5),
    total_citas_completadas INTEGER DEFAULT 0,

    -- Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    publicado_en TIMESTAMPTZ,  -- Timestamp de primera publicación

    -- Índices full-text search
    search_vector tsvector,  -- Para búsqueda de texto completo

    -- Constraints
    CHECK (LENGTH(slug) >= 3),
    CHECK (ciudad IS NOT NULL AND ciudad != '')
);

-- Índices para performance
CREATE INDEX idx_marketplace_perfiles_org ON marketplace_perfiles(organizacion_id);
CREATE INDEX idx_marketplace_perfiles_ciudad ON marketplace_perfiles(ciudad);
CREATE INDEX idx_marketplace_perfiles_estado ON marketplace_perfiles(estado);
CREATE INDEX idx_marketplace_perfiles_activo ON marketplace_perfiles(activo) WHERE activo = true;
CREATE INDEX idx_marketplace_perfiles_visible ON marketplace_perfiles(visible_en_directorio) WHERE visible_en_directorio = true;
CREATE INDEX idx_marketplace_perfiles_slug ON marketplace_perfiles(slug);

-- Índice GIN para búsqueda full-text
CREATE INDEX idx_marketplace_search ON marketplace_perfiles USING GIN(search_vector);

-- Índice compuesto para búsquedas por ciudad + industria
CREATE INDEX idx_marketplace_ciudad_industria ON marketplace_perfiles(ciudad, activo, visible_en_directorio)
    WHERE activo = true AND visible_en_directorio = true;

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION actualizar_search_vector_marketplace()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('spanish', COALESCE(NEW.meta_titulo, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.descripcion_corta, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.descripcion_larga, '')), 'C') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.ciudad, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.estado, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_search_vector
    BEFORE INSERT OR UPDATE ON marketplace_perfiles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_search_vector_marketplace();

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_marketplace_updated_at
    BEFORE UPDATE ON marketplace_perfiles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Comentarios
COMMENT ON TABLE marketplace_perfiles IS 'Perfiles públicos de negocios en el marketplace';
COMMENT ON COLUMN marketplace_perfiles.activo IS 'Admin puede activar/desactivar perfil (moderación)';
COMMENT ON COLUMN marketplace_perfiles.slug IS 'URL amigable única. Ej: guadalajara-barberia-el-corte';
COMMENT ON COLUMN marketplace_perfiles.search_vector IS 'Vector de búsqueda full-text actualizado por trigger';
COMMENT ON COLUMN marketplace_perfiles.rating_promedio IS 'Calculado automáticamente desde reseñas (0.00-5.00)';
```

---

#### **Tabla 2: `marketplace_reseñas`**

Sistema de reseñas 5 estrellas para negocios.

```sql
CREATE TABLE marketplace_reseñas (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Relaciones
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cita_id INTEGER NOT NULL,  -- FK compuesta a citas
    fecha_cita DATE NOT NULL,
    FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE,

    profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,  -- Opcional

    -- Contenido de la Reseña
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    titulo VARCHAR(100),  -- Título corto de la reseña
    comentario TEXT,  -- Comentario completo (opcional)

    -- Respuesta del Negocio
    respuesta_negocio TEXT,
    respondido_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    respondido_en TIMESTAMPTZ,

    -- Estado y Moderación
    estado VARCHAR(20) DEFAULT 'publicada' CHECK (estado IN ('pendiente', 'publicada', 'reportada', 'oculta')),
    motivo_reporte TEXT,  -- Si estado = 'reportada'
    moderada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    moderada_en TIMESTAMPTZ,

    -- Utilidad (votos de otros usuarios)
    votos_util INTEGER DEFAULT 0,
    votos_no_util INTEGER DEFAULT 0,

    -- Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(cita_id, fecha_cita),  -- Una reseña por cita
    CHECK (LENGTH(comentario) <= 1000)  -- Máximo 1000 caracteres
);

-- Índices
CREATE INDEX idx_marketplace_reseñas_org ON marketplace_reseñas(organizacion_id);
CREATE INDEX idx_marketplace_reseñas_cliente ON marketplace_reseñas(cliente_id);
CREATE INDEX idx_marketplace_reseñas_cita ON marketplace_reseñas(cita_id);
CREATE INDEX idx_marketplace_reseñas_profesional ON marketplace_reseñas(profesional_id);
CREATE INDEX idx_marketplace_reseñas_estado ON marketplace_reseñas(estado) WHERE estado = 'publicada';
CREATE INDEX idx_marketplace_reseñas_rating ON marketplace_reseñas(rating);
CREATE INDEX idx_marketplace_reseñas_creado ON marketplace_reseñas(creado_en DESC);

-- Trigger para actualizar estadísticas del perfil
CREATE OR REPLACE FUNCTION actualizar_stats_perfil_marketplace()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id INTEGER;
    v_total_reseñas INTEGER;
    v_rating_promedio DECIMAL(3,2);
BEGIN
    -- Obtener organizacion_id de la cita
    SELECT organizacion_id INTO v_org_id
    FROM citas
    WHERE id = NEW.cita_id;

    -- Calcular estadísticas actualizadas
    SELECT
        COUNT(*),
        COALESCE(ROUND(AVG(rating), 2), 0)
    INTO v_total_reseñas, v_rating_promedio
    FROM marketplace_reseñas
    WHERE organizacion_id = v_org_id
      AND estado = 'publicada';

    -- Actualizar perfil
    UPDATE marketplace_perfiles
    SET
        total_reseñas = v_total_reseñas,
        rating_promedio = v_rating_promedio,
        actualizado_en = NOW()
    WHERE organizacion_id = v_org_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_actualizar_stats_insert
    AFTER INSERT ON marketplace_reseñas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stats_perfil_marketplace();

CREATE TRIGGER trigger_marketplace_actualizar_stats_update
    AFTER UPDATE OF rating, estado ON marketplace_reseñas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stats_perfil_marketplace();

-- Comentarios
COMMENT ON TABLE marketplace_reseñas IS 'Reseñas de clientes sobre negocios (solo si tienen cita completada)';
COMMENT ON COLUMN marketplace_reseñas.estado IS 'publicada: visible | pendiente: moderación | reportada: flagged | oculta: no visible';
COMMENT ON COLUMN marketplace_reseñas.votos_util IS 'Cantidad de usuarios que marcaron la reseña como útil';
```

---

#### **Tabla 3: `marketplace_analytics`**

Tracking de vistas y clics del perfil público.

```sql
CREATE TABLE marketplace_analytics (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Datos del Evento
    evento_tipo VARCHAR(30) NOT NULL CHECK (evento_tipo IN ('vista_perfil', 'clic_agendar', 'clic_telefono', 'clic_sitio_web', 'clic_instagram', 'clic_facebook')),

    -- Información de Tráfico
    fuente VARCHAR(50),  -- 'google', 'directo', 'facebook', etc.
    ip_hash VARCHAR(64),  -- Hash SHA256 de IP (para contar únicos, GDPR-friendly)
    user_agent TEXT,

    -- Geolocalización (del visitante)
    pais_visitante VARCHAR(50),
    ciudad_visitante VARCHAR(100),

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    fecha DATE GENERATED ALWAYS AS (creado_en::DATE) STORED  -- Para particionamiento
);

-- Índices
CREATE INDEX idx_marketplace_analytics_org ON marketplace_analytics(organizacion_id);
CREATE INDEX idx_marketplace_analytics_tipo ON marketplace_analytics(evento_tipo);
CREATE INDEX idx_marketplace_analytics_fecha ON marketplace_analytics(fecha DESC);
CREATE INDEX idx_marketplace_analytics_org_fecha ON marketplace_analytics(organizacion_id, fecha DESC);

-- Índice compuesto para queries de dashboard
CREATE INDEX idx_marketplace_analytics_org_tipo_fecha
    ON marketplace_analytics(organizacion_id, evento_tipo, fecha DESC);

-- Comentarios
COMMENT ON TABLE marketplace_analytics IS 'Eventos de analytics del marketplace (vistas, clics)';
COMMENT ON COLUMN marketplace_analytics.ip_hash IS 'Hash SHA256 de IP para contar visitantes únicos sin almacenar IPs reales (GDPR)';
COMMENT ON COLUMN marketplace_analytics.evento_tipo IS 'Tipo de interacción del usuario con el perfil';

-- OPCIONAL: Particionamiento por fecha (si el volumen crece mucho)
-- Se puede implementar después con pg_partman
```

---

#### **Tabla 4: `marketplace_categorias`**

Categorías de servicios para facilitar navegación.

```sql
CREATE TABLE marketplace_categorias (
    id SERIAL PRIMARY KEY,

    -- Jerarquía
    nombre VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icono VARCHAR(50),  -- Nombre de ícono (ej: 'scissors', 'spa')

    -- SEO
    meta_titulo VARCHAR(70),
    meta_descripcion VARCHAR(160),

    -- Estado
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,  -- Para ordenar en UI

    -- Metadata
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_marketplace_categorias_activo ON marketplace_categorias(activo) WHERE activo = true;
CREATE INDEX idx_marketplace_categorias_orden ON marketplace_categorias(orden);

-- Datos iniciales (basados en tipos_profesional existentes)
INSERT INTO marketplace_categorias (nombre, slug, icono, orden) VALUES
('Belleza y Estética', 'belleza-estetica', 'sparkles', 1),
('Salud y Bienestar', 'salud-bienestar', 'heart-pulse', 2),
('Barberías', 'barberias', 'scissors', 3),
('Spas y Relajación', 'spas-relajacion', 'spa', 4),
('Fitness y Deporte', 'fitness-deporte', 'dumbbell', 5),
('Medicina y Consultas', 'medicina-consultas', 'stethoscope', 6),
('Veterinaria', 'veterinaria', 'paw-print', 7),
('Servicios Técnicos', 'servicios-tecnicos', 'wrench', 8),
('Educación y Formación', 'educacion-formacion', 'graduation-cap', 9),
('Otros Servicios', 'otros-servicios', 'briefcase', 10);

COMMENT ON TABLE marketplace_categorias IS 'Categorías principales para organizar el directorio del marketplace';
```

---

### 1.2 Modificaciones a Tablas Existentes

#### **Agregar columnas a `organizaciones`**

```sql
-- Agregar columna para vincular con marketplace
ALTER TABLE organizaciones
ADD COLUMN tiene_perfil_marketplace BOOLEAN DEFAULT false,
ADD COLUMN fecha_activacion_marketplace TIMESTAMPTZ;

-- Índice
CREATE INDEX idx_organizaciones_marketplace ON organizaciones(tiene_perfil_marketplace)
    WHERE tiene_perfil_marketplace = true;

COMMENT ON COLUMN organizaciones.tiene_perfil_marketplace IS 'True si la organización tiene perfil activo en marketplace';
```

---

### 1.3 Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE marketplace_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reseñas ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categorias ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- POLÍTICAS: marketplace_perfiles
-- ===================================================================

-- Lectura pública: Solo perfiles activos y visibles (SIN RLS)
CREATE POLICY marketplace_perfiles_public_read
ON marketplace_perfiles
FOR SELECT
TO PUBLIC  -- Acceso público sin autenticación
USING (activo = true AND visible_en_directorio = true);

-- Gestión: Solo admin/propietario de su organización
CREATE POLICY marketplace_perfiles_tenant_manage
ON marketplace_perfiles
FOR ALL
TO saas_app
USING (
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
    organizacion_id = current_setting('app.current_tenant_id')::INTEGER
);

-- ===================================================================
-- POLÍTICAS: marketplace_reseñas
-- ===================================================================

-- Lectura pública: Solo reseñas publicadas
CREATE POLICY marketplace_reseñas_public_read
ON marketplace_reseñas
FOR SELECT
TO PUBLIC
USING (estado = 'publicada');

-- Creación: Cliente autenticado solo para su organización
CREATE POLICY marketplace_reseñas_cliente_create
ON marketplace_reseñas
FOR INSERT
TO saas_app
WITH CHECK (
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
    organizacion_id = current_setting('app.current_tenant_id')::INTEGER
);

-- Gestión: Admin puede responder y moderar
CREATE POLICY marketplace_reseñas_admin_manage
ON marketplace_reseñas
FOR ALL
TO saas_app
USING (
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
    organizacion_id = current_setting('app.current_tenant_id')::INTEGER
);

-- ===================================================================
-- POLÍTICAS: marketplace_analytics
-- ===================================================================

-- Solo lectura para la organización dueña
CREATE POLICY marketplace_analytics_tenant_read
ON marketplace_analytics
FOR SELECT
TO saas_app
USING (
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
    organizacion_id = current_setting('app.current_tenant_id')::INTEGER
);

-- Insert público (para tracking)
CREATE POLICY marketplace_analytics_public_insert
ON marketplace_analytics
FOR INSERT
TO PUBLIC
WITH CHECK (true);  -- Cualquiera puede insertar eventos

-- ===================================================================
-- POLÍTICAS: marketplace_categorias
-- ===================================================================

-- Lectura pública
CREATE POLICY marketplace_categorias_public_read
ON marketplace_categorias
FOR SELECT
TO PUBLIC
USING (activo = true);

-- Solo super_admin puede modificar
CREATE POLICY marketplace_categorias_superadmin_manage
ON marketplace_categorias
FOR ALL
TO saas_app
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE id = current_setting('app.current_user_id', true)::INTEGER
        AND rol = 'super_admin'
    )
);
```

---

### 1.4 Funciones Adicionales

```sql
-- ===================================================================
-- FUNCIÓN: obtener_perfil_publico_por_slug()
-- ===================================================================
-- Obtiene perfil completo de un negocio por su slug
-- Incluye: perfil + servicios + profesionales + horarios
-- ===================================================================

CREATE OR REPLACE FUNCTION obtener_perfil_publico_por_slug(p_slug VARCHAR)
RETURNS TABLE (
    -- Datos del perfil
    perfil JSONB,
    -- Servicios disponibles
    servicios JSONB,
    -- Profesionales
    profesionales JSONB,
    -- Reseñas recientes
    reseñas JSONB,
    -- Estadísticas
    stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH perfil_data AS (
        SELECT mp.*
        FROM marketplace_perfiles mp
        WHERE mp.slug = p_slug
          AND mp.activo = true
          AND mp.visible_en_directorio = true
        LIMIT 1
    ),
    servicios_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'nombre', s.nombre,
                'descripcion', s.descripcion,
                'categoria', s.categoria,
                'precio', s.precio,
                'duracion_minutos', s.duracion_minutos
            )
        ) as servicios
        FROM servicios s
        INNER JOIN perfil_data pd ON s.organizacion_id = pd.organizacion_id
        WHERE s.activo = true
    ),
    profesionales_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'nombre_completo', p.nombre_completo,
                'tipo_profesional', p.tipo_profesional,
                'biografia', p.biografia
            )
        ) as profesionales
        FROM profesionales p
        INNER JOIN perfil_data pd ON p.organizacion_id = pd.organizacion_id
        WHERE p.activo = true
    ),
    reseñas_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', r.id,
                'rating', r.rating,
                'titulo', r.titulo,
                'comentario', r.comentario,
                'respuesta_negocio', r.respuesta_negocio,
                'creado_en', r.creado_en
            )
            ORDER BY r.creado_en DESC
        ) as reseñas
        FROM marketplace_reseñas r
        INNER JOIN perfil_data pd ON r.organizacion_id = pd.organizacion_id
        WHERE r.estado = 'publicada'
        LIMIT 10
    ),
    stats_data AS (
        SELECT jsonb_build_object(
            'total_reseñas', pd.total_reseñas,
            'rating_promedio', pd.rating_promedio,
            'total_citas_completadas', pd.total_citas_completadas
        ) as stats
        FROM perfil_data pd
    )
    SELECT
        row_to_json(pd.*)::jsonb as perfil,
        COALESCE(sd.servicios, '[]'::jsonb) as servicios,
        COALESCE(prd.profesionales, '[]'::jsonb) as profesionales,
        COALESCE(rd.reseñas, '[]'::jsonb) as reseñas,
        std.stats
    FROM perfil_data pd
    CROSS JOIN servicios_data sd
    CROSS JOIN profesionales_data prd
    CROSS JOIN reseñas_data rd
    CROSS JOIN stats_data std;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_perfil_publico_por_slug IS 'Obtiene perfil público completo de un negocio por slug (para página pública)';
```

---

### 1.5 Ubicación en Código

**IMPORTANTE:** Se trabajará sobre los archivos SQL existentes del proyecto. Todo el código del marketplace se consolidará en un único archivo nuevo que seguirá la numeración del esquema actual.

```
sql/schema/
└── 10-marketplace.sql            → Archivo único con TODO el marketplace
    ├── 4 tablas nuevas
    ├── 20+ índices
    ├── 8 políticas RLS
    ├── 3 funciones PL/pgSQL
    └── 3 triggers
```

**Orden de ejecución:** Este archivo se ejecutará automáticamente al levantar el proyecto desde cero con `npm run dev`, siguiendo el orden numérico establecido (después de `09-triggers.sql`).

**NO se requieren migraciones** - El proyecto se levanta desde cero cada vez, por lo que el nuevo archivo se ejecutará automáticamente.

---

## 🔌 FASE 2: BACKEND API

**Duración:** 8 días (64 horas)
**Prioridad:** 🔴 CRÍTICA

### 2.1 Endpoints (15 endpoints)

#### **Módulo: Perfiles Públicos (5 endpoints)**

```javascript
// ===================================================================
// PÚBLICOS (sin autenticación)
// ===================================================================

GET    /api/v1/marketplace/perfiles                    // Listar perfiles (directorio)
GET    /api/v1/marketplace/perfiles/:slug              // Detalle de perfil por slug
GET    /api/v1/marketplace/categorias                  // Listar categorías
GET    /api/v1/marketplace/search                      // Búsqueda full-text

// ===================================================================
// PRIVADOS (requieren autenticación)
// ===================================================================

GET    /api/v1/marketplace/mi-perfil                   // Obtener mi perfil
POST   /api/v1/marketplace/mi-perfil                   // Crear/actualizar mi perfil
DELETE /api/v1/marketplace/mi-perfil                   // Desactivar mi perfil
```

#### **Módulo: Reseñas (4 endpoints)**

```javascript
// PÚBLICAS
GET    /api/v1/marketplace/reseñas                     // Listar reseñas de un negocio

// PRIVADAS
POST   /api/v1/marketplace/reseñas                     // Crear reseña (solo con cita completada)
POST   /api/v1/marketplace/reseñas/:id/responder      // Responder reseña (admin)
PATCH  /api/v1/marketplace/reseñas/:id/reportar       // Reportar reseña
```

#### **Módulo: Analytics (3 endpoints)**

```javascript
// PÚBLICOS
POST   /api/v1/marketplace/analytics/evento            // Registrar evento (vista, clic)

// PRIVADOS
GET    /api/v1/marketplace/analytics/dashboard         // Dashboard de analytics
GET    /api/v1/marketplace/analytics/reporte           // Reporte detallado
```

#### **Módulo: Agendamiento Público (3 endpoints)**

```javascript
// PÚBLICOS (sin autenticación - flujo de agendamiento desde marketplace)
GET    /api/v1/marketplace/disponibilidad/:slug        // Ver disponibilidad de negocio
POST   /api/v1/marketplace/agendar                     // Crear cita desde marketplace
GET    /api/v1/marketplace/confirmar/:token            // Confirmar cita por email
```

---

### 2.2 Arquitectura Backend

```
backend/app/
├── routes/api/v1/
│   └── marketplace.js                    // Router principal (15 rutas)
│
├── controllers/marketplace/
│   ├── index.js                          // Exportador
│   ├── perfiles.controller.js            // 7 métodos (CRUD perfil)
│   ├── reseñas.controller.js             // 4 métodos (crear, listar, responder, reportar)
│   ├── analytics.controller.js           // 3 métodos (evento, dashboard, reporte)
│   └── agendamiento-publico.controller.js // 3 métodos (disponibilidad, agendar, confirmar)
│
├── database/marketplace/
│   ├── index.js                          // Exportador
│   ├── perfiles.model.js                 // Queries perfiles (con RLSContextManager)
│   ├── reseñas.model.js                  // Queries reseñas
│   ├── analytics.model.js                // Queries analytics
│   └── busqueda.model.js                 // Full-text search + filtros
│
├── schemas/marketplace.schemas.js         // Validación Joi (10 schemas)
│
└── middleware/
    └── public-auth.middleware.js          // Middleware para rutas públicas (opcional)
```

---

### 2.3 Schemas de Validación Joi

```javascript
// schemas/marketplace.schemas.js

const Joi = require('joi');

const marketplaceSchemas = {

  // ========== PERFIL ==========

  crearActualizarPerfil: {
    body: Joi.object({
      // Estado
      activo: Joi.boolean().optional(),
      visible_en_directorio: Joi.boolean().optional(),

      // SEO
      slug: Joi.string().min(3).max(100).pattern(/^[a-z0-9-]+$/).optional(),
      meta_titulo: Joi.string().max(70).optional(),
      meta_descripcion: Joi.string().max(160).optional(),

      // Información
      descripcion_corta: Joi.string().max(200).optional(),
      descripcion_larga: Joi.string().max(5000).optional(),

      // Ubicación
      pais: Joi.string().max(50).optional(),
      estado: Joi.string().max(100).optional(),
      ciudad: Joi.string().max(100).required(),
      codigo_postal: Joi.string().max(10).optional(),
      direccion_completa: Joi.string().optional(),
      latitud: Joi.number().min(-90).max(90).optional(),
      longitud: Joi.number().min(-180).max(180).optional(),

      // Contacto
      telefono_publico: Joi.string().max(20).optional(),
      email_publico: Joi.string().email().max(150).optional(),
      sitio_web: Joi.string().uri().max(255).optional(),

      // Redes sociales
      instagram: Joi.string().max(100).optional(),
      facebook: Joi.string().max(255).optional(),
      tiktok: Joi.string().max(100).optional(),

      // Galería
      logo_url: Joi.string().uri().max(500).optional(),
      portada_url: Joi.string().uri().max(500).optional(),
      galeria_urls: Joi.array().items(Joi.string().uri()).max(10).optional(),

      // Horarios
      horarios_atencion: Joi.object().optional()
    })
  },

  listarPerfiles: {
    query: Joi.object({
      ciudad: Joi.string().max(100).optional(),
      estado: Joi.string().max(100).optional(),
      categoria_id: Joi.number().integer().positive().optional(),
      search: Joi.string().max(100).optional(),  // Búsqueda texto
      pagina: Joi.number().integer().min(1).default(1),
      limite: Joi.number().integer().min(1).max(50).default(12),
      orden: Joi.string().valid('rating', 'reciente', 'nombre').default('rating')
    })
  },

  // ========== RESEÑAS ==========

  crearReseña: {
    body: Joi.object({
      cita_id: Joi.number().integer().positive().required(),
      rating: Joi.number().integer().min(1).max(5).required(),
      titulo: Joi.string().max(100).optional(),
      comentario: Joi.string().max(1000).optional()
    })
  },

  responderReseña: {
    body: Joi.object({
      respuesta_negocio: Joi.string().max(500).required()
    })
  },

  listarReseñas: {
    query: Joi.object({
      organizacion_id: Joi.number().integer().positive().optional(),
      slug: Joi.string().optional(),
      rating: Joi.number().integer().min(1).max(5).optional(),
      pagina: Joi.number().integer().min(1).default(1),
      limite: Joi.number().integer().min(1).max(50).default(10),
      orden: Joi.string().valid('reciente', 'rating_alto', 'rating_bajo', 'util').default('reciente')
    })
  },

  // ========== ANALYTICS ==========

  registrarEvento: {
    body: Joi.object({
      organizacion_id: Joi.number().integer().positive().required(),
      evento_tipo: Joi.string().valid(
        'vista_perfil',
        'clic_agendar',
        'clic_telefono',
        'clic_sitio_web',
        'clic_instagram',
        'clic_facebook'
      ).required(),
      fuente: Joi.string().max(50).optional(),
      ip_hash: Joi.string().max(64).optional(),  // Se calcula en backend
      user_agent: Joi.string().optional()
    })
  },

  dashboardAnalytics: {
    query: Joi.object({
      fecha_desde: Joi.date().iso().optional(),
      fecha_hasta: Joi.date().iso().optional()
    })
  },

  // ========== AGENDAMIENTO PÚBLICO ==========

  agendarPublico: {
    body: Joi.object({
      slug: Joi.string().required(),

      // Datos del cliente
      nombre_completo: Joi.string().max(150).required(),
      email: Joi.string().email().max(150).required(),
      telefono: Joi.string().max(20).required(),

      // Datos de la cita
      servicios_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(10).required(),
      profesional_id: Joi.number().integer().positive().optional(),
      fecha_cita: Joi.date().iso().required(),
      hora_inicio: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),

      // Notas
      notas: Joi.string().max(500).optional()
    })
  }

};

module.exports = marketplaceSchemas;
```

---

### 2.4 Controllers Clave

#### **perfiles.controller.js** (ejemplo)

```javascript
const PerfilesModel = require('../../database/marketplace/perfiles.model');
const ResponseHelper = require('../../utils/helpers').ResponseHelper;

/**
 * GET /api/v1/marketplace/perfiles/:slug
 * Obtener perfil público completo por slug
 */
exports.obtenerPerfilPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const perfil = await PerfilesModel.obtenerPorSlug(slug);

    if (!perfil) {
      return ResponseHelper.notFound(res, 'Perfil no encontrado');
    }

    // Registrar vista (async, no bloquea respuesta)
    AnalyticsModel.registrarEvento({
      organizacion_id: perfil.organizacion_id,
      evento_tipo: 'vista_perfil',
      ip_hash: hashIP(req.ip),
      user_agent: req.get('User-Agent'),
      fuente: req.query.ref || 'directo'
    }).catch(err => console.error('Error registrando analytics:', err));

    return ResponseHelper.success(res, perfil, 'Perfil obtenido exitosamente');

  } catch (error) {
    return ResponseHelper.error(res, 'Error al obtener perfil', error);
  }
};

/**
 * POST /api/v1/marketplace/mi-perfil
 * Crear o actualizar perfil propio
 */
exports.crearActualizarMiPerfil = async (req, res) => {
  try {
    const { organizacion_id } = req.user;
    const dataPerfil = req.body;

    // Generar slug automáticamente si no existe
    if (!dataPerfil.slug) {
      const organizacion = await OrganizacionesModel.obtenerPorId(organizacion_id);
      dataPerfil.slug = generarSlug(organizacion.nombre_comercial, organizacion.ciudad);
    }

    const perfil = await PerfilesModel.crearOActualizar(organizacion_id, dataPerfil);

    return ResponseHelper.success(res, perfil, 'Perfil actualizado exitosamente');

  } catch (error) {
    return ResponseHelper.error(res, 'Error al actualizar perfil', error);
  }
};

// Helper: Generar slug único
function generarSlug(nombreNegocio, ciudad) {
  const slugBase = `${ciudad}-${nombreNegocio}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Agregar timestamp para unicidad
  return `${slugBase}-${Date.now().toString(36)}`;
}

// Helper: Hash de IP (GDPR-compliant)
function hashIP(ip) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex');
}
```

---

### 2.5 Models con RLS

```javascript
// database/marketplace/perfiles.model.js

const RLSContextManager = require('../../utils/rlsContextManager');
const db = require('../db');

exports.obtenerPorSlug = async (slug) => {
  // Consulta pública (sin RLS - usa PUBLIC role)
  const query = `
    SELECT * FROM obtener_perfil_publico_por_slug($1)
  `;

  const result = await db.query(query, [slug]);
  return result.rows[0] || null;
};

exports.crearOActualizar = async (organizacionId, dataPerfil) => {
  return await RLSContextManager.transaction(organizacionId, async (trx) => {

    // Verificar si ya existe perfil
    const existente = await trx('marketplace_perfiles')
      .where({ organizacion_id: organizacionId })
      .first();

    if (existente) {
      // Actualizar
      const [perfil] = await trx('marketplace_perfiles')
        .where({ organizacion_id: organizacionId })
        .update({
          ...dataPerfil,
          actualizado_en: trx.fn.now()
        })
        .returning('*');

      return perfil;
    } else {
      // Crear
      const [perfil] = await trx('marketplace_perfiles')
        .insert({
          organizacion_id: organizacionId,
          ...dataPerfil
        })
        .returning('*');

      // Marcar organización con perfil
      await trx('organizaciones')
        .where({ id: organizacionId })
        .update({
          tiene_perfil_marketplace: true,
          fecha_activacion_marketplace: trx.fn.now()
        });

      return perfil;
    }
  });
};

exports.listar = async (filtros = {}) => {
  // Consulta pública con filtros
  let query = db('marketplace_perfiles as mp')
    .select([
      'mp.id',
      'mp.slug',
      'mp.ciudad',
      'mp.estado',
      'mp.meta_titulo',
      'mp.descripcion_corta',
      'mp.logo_url',
      'mp.rating_promedio',
      'mp.total_reseñas',
      'o.nombre_comercial',
      'o.tipo_industria'
    ])
    .leftJoin('organizaciones as o', 'mp.organizacion_id', 'o.id')
    .where('mp.activo', true)
    .where('mp.visible_en_directorio', true);

  // Aplicar filtros
  if (filtros.ciudad) {
    query = query.where('mp.ciudad', 'ilike', `%${filtros.ciudad}%`);
  }

  if (filtros.estado) {
    query = query.where('mp.estado', filtros.estado);
  }

  if (filtros.search) {
    // Búsqueda full-text
    query = query.whereRaw(
      `mp.search_vector @@ plainto_tsquery('spanish', ?)`,
      [filtros.search]
    );
  }

  // Ordenamiento
  switch (filtros.orden) {
    case 'rating':
      query = query.orderBy('mp.rating_promedio', 'desc');
      break;
    case 'reciente':
      query = query.orderBy('mp.publicado_en', 'desc');
      break;
    case 'nombre':
      query = query.orderBy('o.nombre_comercial', 'asc');
      break;
  }

  // Paginación
  const pagina = filtros.pagina || 1;
  const limite = filtros.limite || 12;
  const offset = (pagina - 1) * limite;

  const [resultados, [{ total }]] = await Promise.all([
    query.limit(limite).offset(offset),
    db('marketplace_perfiles')
      .where('activo', true)
      .where('visible_en_directorio', true)
      .count('* as total')
  ]);

  return {
    data: resultados,
    paginacion: {
      pagina,
      limite,
      total: parseInt(total),
      paginas_totales: Math.ceil(total / limite)
    }
  };
};
```

---

### 2.6 Rutas

```javascript
// routes/api/v1/marketplace.js

const express = require('express');
const MarketplaceController = require('../../../controllers/marketplace');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const marketplaceSchemas = require('../../../schemas/marketplace.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ===================================================================

/**
 * GET /api/v1/marketplace/perfiles
 * Listar perfiles del directorio
 */
router.get('/perfiles',
  rateLimiting.publicRateLimit,  // Rate limit más permisivo
  validate(marketplaceSchemas.listarPerfiles),
  MarketplaceController.listarPerfiles
);

/**
 * GET /api/v1/marketplace/perfiles/:slug
 * Detalle de perfil público
 */
router.get('/perfiles/:slug',
  rateLimiting.publicRateLimit,
  MarketplaceController.obtenerPerfilPorSlug
);

/**
 * GET /api/v1/marketplace/categorias
 * Listar categorías
 */
router.get('/categorias',
  rateLimiting.publicRateLimit,
  MarketplaceController.listarCategorias
);

/**
 * GET /api/v1/marketplace/search
 * Búsqueda full-text
 */
router.get('/search',
  rateLimiting.publicRateLimit,
  validate(marketplaceSchemas.listarPerfiles),
  MarketplaceController.buscar
);

/**
 * POST /api/v1/marketplace/analytics/evento
 * Registrar evento de analytics
 */
router.post('/analytics/evento',
  rateLimiting.publicRateLimit,
  validate(marketplaceSchemas.registrarEvento),
  MarketplaceController.registrarEvento
);

/**
 * GET /api/v1/marketplace/disponibilidad/:slug
 * Ver disponibilidad
 */
router.get('/disponibilidad/:slug',
  rateLimiting.publicRateLimit,
  MarketplaceController.verDisponibilidad
);

/**
 * POST /api/v1/marketplace/agendar
 * Agendar desde marketplace (sin registro)
 */
router.post('/agendar',
  rateLimiting.publicRateLimit,
  validate(marketplaceSchemas.agendarPublico),
  MarketplaceController.agendarPublico
);

// ===================================================================
// RUTAS PRIVADAS (requieren autenticación)
// ===================================================================

/**
 * GET /api/v1/marketplace/mi-perfil
 * Obtener mi perfil
 */
router.get('/mi-perfil',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  MarketplaceController.obtenerMiPerfil
);

/**
 * POST /api/v1/marketplace/mi-perfil
 * Crear/actualizar mi perfil
 */
router.post('/mi-perfil',
  auth.authenticateToken,
  tenant.setTenantContext,
  tenant.verifyTenantActive,
  rateLimiting.apiRateLimit,
  validate(marketplaceSchemas.crearActualizarPerfil),
  MarketplaceController.crearActualizarMiPerfil
);

/**
 * GET /api/v1/marketplace/reseñas
 * Listar reseñas
 */
router.get('/reseñas',
  rateLimiting.publicRateLimit,
  validate(marketplaceSchemas.listarReseñas),
  MarketplaceController.listarReseñas
);

/**
 * POST /api/v1/marketplace/reseñas
 * Crear reseña
 */
router.post('/reseñas',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(marketplaceSchemas.crearReseña),
  MarketplaceController.crearReseña
);

/**
 * GET /api/v1/marketplace/analytics/dashboard
 * Dashboard de analytics
 */
router.get('/analytics/dashboard',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validate(marketplaceSchemas.dashboardAnalytics),
  MarketplaceController.dashboardAnalytics
);

module.exports = router;
```

**Integrar en index.js:**
```javascript
// routes/api/v1/index.js

const marketplaceRouter = require('./marketplace');

router.use('/marketplace', marketplaceRouter);
```

---

## 🎨 FASE 3: FRONTEND PÚBLICO

**Duración:** 10 días (80 horas)
**Prioridad:** 🔴 CRÍTICA

### 3.1 Estructura de Rutas

```
SITIO PÚBLICO (sin autenticación):
├── /marketplace                          → Directorio principal
├── /marketplace/[ciudad]                 → Filtrar por ciudad
├── /marketplace/[ciudad]/[categoria]     → Filtrar por ciudad + categoría
├── /[slug]                               → Página pública de negocio
└── /agendar/[slug]                       → Flujo de agendamiento

PANEL ADMIN (con autenticación):
├── /mi-marketplace                       → Gestión de perfil
├── /mi-marketplace/reseñas               → Ver y responder reseñas
└── /mi-marketplace/analytics             → Dashboard de analytics
```

---

### 3.2 Páginas Principales (6 páginas)

#### **1. DirectorioMarketplacePage.jsx**

Página principal del directorio con búsqueda y filtros.

```jsx
// frontend/src/pages/marketplace/DirectorioMarketplacePage.jsx

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePerfilesMarketplace } from '@/hooks/useMarketplace';
import DirectorioFiltros from '@/components/marketplace/DirectorioFiltros';
import DirectorioGrid from '@/components/marketplace/DirectorioGrid';
import DirectorioPaginacion from '@/components/marketplace/DirectorioPaginacion';

export default function DirectorioMarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filtros = {
    ciudad: searchParams.get('ciudad') || '',
    categoria_id: searchParams.get('categoria') || '',
    search: searchParams.get('q') || '',
    pagina: parseInt(searchParams.get('pagina')) || 1,
    orden: searchParams.get('orden') || 'rating'
  };

  const { data, isLoading } = usePerfilesMarketplace(filtros);

  const handleFiltrosChange = (nuevosFiltros) => {
    setSearchParams(nuevosFiltros);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">
            Encuentra los Mejores Servicios Cerca de Ti
          </h1>
          <p className="text-xl mb-8">
            Miles de profesionales listos para atenderte
          </p>

          {/* Barra de búsqueda */}
          <div className="max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Buscar barberías, spas, clínicas..."
              className="w-full px-6 py-4 rounded-lg text-gray-900 text-lg"
              value={filtros.search}
              onChange={(e) => handleFiltrosChange({ ...filtros, search: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Filtros y Resultados */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filtros */}
          <aside className="w-64 flex-shrink-0">
            <DirectorioFiltros
              filtros={filtros}
              onChange={handleFiltrosChange}
            />
          </aside>

          {/* Grid de Negocios */}
          <main className="flex-1">
            {isLoading ? (
              <div>Cargando...</div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    {data?.paginacion?.total} negocios encontrados
                  </p>
                  <select
                    value={filtros.orden}
                    onChange={(e) => handleFiltrosChange({ ...filtros, orden: e.target.value })}
                    className="border rounded-lg px-4 py-2"
                  >
                    <option value="rating">Mejor valorados</option>
                    <option value="reciente">Más recientes</option>
                    <option value="nombre">Nombre A-Z</option>
                  </select>
                </div>

                <DirectorioGrid perfiles={data?.data || []} />

                <DirectorioPaginacion
                  paginacion={data?.paginacion}
                  onChange={(pagina) => handleFiltrosChange({ ...filtros, pagina })}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
```

---

#### **2. PerfilPublicoPage.jsx**

Página pública de un negocio específico.

```jsx
// frontend/src/pages/marketplace/PerfilPublicoPage.jsx

import { useParams, useNavigate } from 'react-router-dom';
import { usePerfilPublico } from '@/hooks/useMarketplace';
import ServiciosGrid from '@/components/marketplace/ServiciosGrid';
import ProfesionalesCarousel from '@/components/marketplace/ProfesionalesCarousel';
import ReseñasSection from '@/components/marketplace/ReseñasSection';
import MapaUbicacion from '@/components/marketplace/MapaUbicacion';

export default function PerfilPublicoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: perfil, isLoading } = usePerfilPublico(slug);

  if (isLoading) return <div>Cargando...</div>;
  if (!perfil) return <div>Negocio no encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con Portada */}
      <div className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600">
        {perfil.portada_url && (
          <img
            src={perfil.portada_url}
            alt="Portada"
            className="w-full h-full object-cover"
          />
        )}

        {/* Logo flotante */}
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <img
            src={perfil.logo_url || '/default-logo.png'}
            alt={perfil.meta_titulo}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
          />
        </div>
      </div>

      {/* Información Principal */}
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{perfil.meta_titulo}</h1>
            <p className="text-gray-600 text-lg mb-4">{perfil.descripcion_corta}</p>

            {/* Rating y Estadísticas */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="font-bold text-xl">{perfil.rating_promedio}</span>
                <span className="text-gray-600">({perfil.total_reseñas} reseñas)</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{perfil.total_citas_completadas}+ citas completadas</span>
            </div>
          </div>

          {/* Botón CTA */}
          <button
            onClick={() => navigate(`/agendar/${slug}`)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition"
          >
            Agendar Cita
          </button>
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-3 gap-8">
          {/* Columna Principal */}
          <div className="col-span-2 space-y-8">
            {/* Descripción */}
            <section className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">Acerca de Nosotros</h2>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: perfil.descripcion_larga }}
              />
            </section>

            {/* Servicios */}
            <section className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">Nuestros Servicios</h2>
              <ServiciosGrid servicios={perfil.servicios} />
            </section>

            {/* Profesionales */}
            {perfil.profesionales?.length > 0 && (
              <section className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-2xl font-bold mb-4">Nuestro Equipo</h2>
                <ProfesionalesCarousel profesionales={perfil.profesionales} />
              </section>
            )}

            {/* Reseñas */}
            <section className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-2xl font-bold mb-4">Reseñas de Clientes</h2>
              <ReseñasSection
                slug={slug}
                ratingPromedio={perfil.rating_promedio}
                totalReseñas={perfil.total_reseñas}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Contacto */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-bold text-lg mb-4">Contacto</h3>
              <div className="space-y-3">
                {perfil.telefono_publico && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${perfil.telefono_publico}`} className="text-indigo-600 hover:underline">
                      {perfil.telefono_publico}
                    </a>
                  </div>
                )}
                {perfil.email_publico && (
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${perfil.email_publico}`} className="text-indigo-600 hover:underline">
                      {perfil.email_publico}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Redes Sociales */}
            {(perfil.instagram || perfil.facebook) && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-bold text-lg mb-4">Síguenos</h3>
                <div className="space-y-2">
                  {perfil.instagram && (
                    <a href={`https://instagram.com/${perfil.instagram}`} target="_blank" className="flex items-center gap-2 text-pink-600 hover:underline">
                      Instagram @{perfil.instagram}
                    </a>
                  )}
                  {perfil.facebook && (
                    <a href={perfil.facebook} target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline">
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Horarios */}
            {perfil.horarios_atencion && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-bold text-lg mb-4">Horarios</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(perfil.horarios_atencion).map(([dia, horario]) => (
                    <div key={dia} className="flex justify-between">
                      <span className="capitalize">{dia}:</span>
                      <span className="font-medium">{horario}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mapa */}
            {perfil.latitud && perfil.longitud && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="font-bold text-lg mb-4">Ubicación</h3>
                <MapaUbicacion
                  lat={perfil.latitud}
                  lng={perfil.longitud}
                  nombre={perfil.meta_titulo}
                />
                <p className="text-sm text-gray-600 mt-2">{perfil.direccion_completa}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
```

---

#### **3. AgendarPublicoPage.jsx**

Flujo de agendamiento sin registro.

```jsx
// frontend/src/pages/marketplace/AgendarPublicoPage.jsx

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePerfilPublico, useAgendarPublico } from '@/hooks/useMarketplace';
import FormularioDatosCliente from '@/components/marketplace/FormularioDatosCliente';
import SelectorServicios from '@/components/marketplace/SelectorServicios';
import SelectorFechaHora from '@/components/marketplace/SelectorFechaHora';
import ResumenCita from '@/components/marketplace/ResumenCita';

export default function AgendarPublicoPage() {
  const { slug } = useParams();
  const { data: perfil } = usePerfilPublico(slug);
  const agendarMutation = useAgendarPublico();

  const [paso, setPaso] = useState(1); // 1: Servicios, 2: Fecha/Hora, 3: Datos, 4: Confirmación
  const [datosReserva, setDatosReserva] = useState({
    servicios_ids: [],
    profesional_id: null,
    fecha_cita: null,
    hora_inicio: null,
    nombre_completo: '',
    email: '',
    telefono: '',
    notas: ''
  });

  const handleSubmit = async () => {
    try {
      await agendarMutation.mutateAsync({
        slug,
        ...datosReserva
      });
      setPaso(4); // Ir a confirmación
    } catch (error) {
      console.error('Error al agendar:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <h1 className="text-3xl font-bold mb-2">Agendar Cita</h1>
          <p className="text-gray-600">{perfil?.meta_titulo}</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between mb-8">
          {['Servicios', 'Fecha y Hora', 'Tus Datos', 'Confirmación'].map((label, index) => (
            <div key={index} className={`flex-1 text-center ${index + 1 <= paso ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${index + 1 <= paso ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
                {index + 1}
              </div>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>

        {/* Contenido por Paso */}
        <div className="bg-white rounded-lg p-6 shadow">
          {paso === 1 && (
            <SelectorServicios
              servicios={perfil?.servicios || []}
              seleccionados={datosReserva.servicios_ids}
              onChange={(ids) => setDatosReserva({ ...datosReserva, servicios_ids: ids })}
              onNext={() => setPaso(2)}
            />
          )}

          {paso === 2 && (
            <SelectorFechaHora
              slug={slug}
              servicios_ids={datosReserva.servicios_ids}
              profesionales={perfil?.profesionales || []}
              onSelect={(fecha, hora, profesionalId) => {
                setDatosReserva({
                  ...datosReserva,
                  fecha_cita: fecha,
                  hora_inicio: hora,
                  profesional_id: profesionalId
                });
                setPaso(3);
              }}
              onBack={() => setPaso(1)}
            />
          )}

          {paso === 3 && (
            <FormularioDatosCliente
              datos={datosReserva}
              onChange={(datos) => setDatosReserva({ ...datosReserva, ...datos })}
              onSubmit={handleSubmit}
              onBack={() => setPaso(2)}
              isLoading={agendarMutation.isLoading}
            />
          )}

          {paso === 4 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold mb-4">¡Cita Agendada!</h2>
              <p className="text-gray-600 mb-6">
                Hemos enviado un correo de confirmación a {datosReserva.email}
              </p>
              <ResumenCita datos={datosReserva} perfil={perfil} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 3.3 Componentes (15 componentes)

```
frontend/src/components/marketplace/
├── DirectorioFiltros.jsx              # Sidebar con filtros
├── DirectorioGrid.jsx                 # Grid de tarjetas de negocios
├── DirectorioPaginacion.jsx           # Paginación
├── NegocioCard.jsx                    # Tarjeta individual de negocio
├── ServiciosGrid.jsx                  # Grid de servicios
├── ProfesionalesCarousel.jsx          # Carousel de profesionales
├── ReseñasSection.jsx                 # Sección de reseñas
├── ReseñaCard.jsx                     # Tarjeta individual de reseña
├── FormularioReseña.jsx               # Form para crear reseña
├── MapaUbicacion.jsx                  # Mapa de Google Maps
├── FormularioDatosCliente.jsx         # Form de datos personales
├── SelectorServicios.jsx              # Selector de múltiples servicios
├── SelectorFechaHora.jsx              # Calendario + horarios disponibles
├── ResumenCita.jsx                    # Resumen de cita agendada
└── EstrellaRating.jsx                 # Componente de estrellas
```

---

### 3.4 Hooks TanStack Query (8 hooks)

```javascript
// frontend/src/hooks/useMarketplace.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/api/endpoints';

// ========== PERFILES ==========

export function usePerfilesMarketplace(filtros = {}) {
  return useQuery({
    queryKey: ['marketplace', 'perfiles', filtros],
    queryFn: async () => {
      const response = await marketplaceApi.listarPerfiles(filtros);
      return response.data?.data || { data: [], paginacion: {} };
    },
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true
  });
}

export function usePerfilPublico(slug) {
  return useQuery({
    queryKey: ['marketplace', 'perfil', slug],
    queryFn: async () => {
      const response = await marketplaceApi.obtenerPerfilPorSlug(slug);
      return response.data?.data || null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000
  });
}

export function useMiPerfilMarketplace() {
  return useQuery({
    queryKey: ['marketplace', 'mi-perfil'],
    queryFn: async () => {
      const response = await marketplaceApi.obtenerMiPerfil();
      return response.data?.data || null;
    },
    staleTime: 5 * 60 * 1000
  });
}

export function useActualizarPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataPerfil) => {
      const response = await marketplaceApi.actualizarMiPerfil(dataPerfil);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marketplace', 'mi-perfil']);
    }
  });
}

// ========== RESEÑAS ==========

export function useReseñasNegocio(slug, filtros = {}) {
  return useQuery({
    queryKey: ['marketplace', 'reseñas', slug, filtros],
    queryFn: async () => {
      const response = await marketplaceApi.listarReseñas({ slug, ...filtros });
      return response.data?.data || { data: [], paginacion: {} };
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000
  });
}

export function useCrearReseña() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataReseña) => {
      const response = await marketplaceApi.crearReseña(dataReseña);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marketplace', 'reseñas']);
      queryClient.invalidateQueries(['marketplace', 'perfil']);
    }
  });
}

// ========== AGENDAMIENTO PÚBLICO ==========

export function useDisponibilidadPublica(slug, servicios_ids, fecha) {
  return useQuery({
    queryKey: ['marketplace', 'disponibilidad', slug, servicios_ids, fecha],
    queryFn: async () => {
      const response = await marketplaceApi.verDisponibilidad(slug, { servicios_ids, fecha });
      return response.data?.data || [];
    },
    enabled: !!slug && !!servicios_ids?.length && !!fecha,
    staleTime: 30 * 1000 // 30 segundos
  });
}

export function useAgendarPublico() {
  return useMutation({
    mutationFn: async (dataCita) => {
      const response = await marketplaceApi.agendarPublico(dataCita);
      return response.data?.data;
    }
  });
}

// ========== ANALYTICS ==========

export function useDashboardAnalytics(filtros = {}) {
  return useQuery({
    queryKey: ['marketplace', 'analytics', 'dashboard', filtros],
    queryFn: async () => {
      const response = await marketplaceApi.obtenerDashboardAnalytics(filtros);
      return response.data?.data || {};
    },
    staleTime: 5 * 60 * 1000
  });
}

// Helper: Registrar evento de analytics (fire-and-forget)
export function registrarEventoMarketplace(evento) {
  marketplaceApi.registrarEvento(evento).catch(err =>
    console.error('Error registrando analytics:', err)
  );
}
```

---

### 3.5 API Endpoints (Frontend)

```javascript
// frontend/src/services/api/endpoints.js

export const marketplaceApi = {
  // ========== Perfiles ==========

  listarPerfiles: (params = {}) =>
    apiClient.get('/marketplace/perfiles', { params }),

  obtenerPerfilPorSlug: (slug) =>
    apiClient.get(`/marketplace/perfiles/${slug}`),

  obtenerMiPerfil: () =>
    apiClient.get('/marketplace/mi-perfil'),

  actualizarMiPerfil: (data) =>
    apiClient.post('/marketplace/mi-perfil', data),

  // ========== Reseñas ==========

  listarReseñas: (params = {}) =>
    apiClient.get('/marketplace/reseñas', { params }),

  crearReseña: (data) =>
    apiClient.post('/marketplace/reseñas', data),

  responderReseña: (id, data) =>
    apiClient.post(`/marketplace/reseñas/${id}/responder`, data),

  // ========== Agendamiento Público ==========

  verDisponibilidad: (slug, params) =>
    apiClient.get(`/marketplace/disponibilidad/${slug}`, { params }),

  agendarPublico: (data) =>
    apiClient.post('/marketplace/agendar', data),

  // ========== Analytics ==========

  registrarEvento: (data) =>
    apiClient.post('/marketplace/analytics/evento', data),

  obtenerDashboardAnalytics: (params = {}) =>
    apiClient.get('/marketplace/analytics/dashboard', { params }),

  // ========== Categorías ==========

  listarCategorias: () =>
    apiClient.get('/marketplace/categorias')
};

// Agregar a exports
export default {
  // ... otros
  marketplace: marketplaceApi
};
```

---

## 🔍 FASE 4: SEO Y ANALYTICS

**Duración:** 3 días (24 horas)
**Prioridad:** 🔴 ALTA

### 4.1 SEO On-Page

#### **Meta Tags Dinámicos**

```jsx
// frontend/src/components/marketplace/SEOHead.jsx

import { Helmet } from 'react-helmet-async';

export default function SEOHead({ perfil }) {
  const {
    meta_titulo,
    meta_descripcion,
    slug,
    ciudad,
    tipo_industria,
    rating_promedio,
    total_reseñas,
    logo_url
  } = perfil;

  const url = `${window.location.origin}/${slug}`;

  return (
    <Helmet>
      {/* Meta Tags Básicos */}
      <title>{meta_titulo} - Reserva Online</title>
      <meta name="description" content={meta_descripcion} />
      <link rel="canonical" href={url} />

      {/* Open Graph (Facebook) */}
      <meta property="og:type" content="business.business" />
      <meta property="og:title" content={meta_titulo} />
      <meta property="og:description" content={meta_descripcion} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={logo_url} />
      <meta property="og:locale" content="es_MX" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta_titulo} />
      <meta name="twitter:description" content={meta_descripcion} />
      <meta name="twitter:image" content={logo_url} />

      {/* Schema.org Local Business */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": meta_titulo,
          "description": meta_descripcion,
          "url": url,
          "telephone": perfil.telefono_publico,
          "email": perfil.email_publico,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": ciudad,
            "addressCountry": "MX"
          },
          "geo": perfil.latitud && perfil.longitud ? {
            "@type": "GeoCoordinates",
            "latitude": perfil.latitud,
            "longitude": perfil.longitud
          } : undefined,
          "aggregateRating": total_reseñas > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": rating_promedio,
            "reviewCount": total_reseñas
          } : undefined,
          "image": logo_url
        })}
      </script>
    </Helmet>
  );
}
```

---

#### **Sitemap Dinámico**

```javascript
// backend/app/controllers/marketplace/sitemap.controller.js

exports.generarSitemap = async (req, res) => {
  try {
    const perfiles = await db('marketplace_perfiles')
      .select('slug', 'actualizado_en')
      .where('activo', true)
      .where('visible_en_directorio', true);

    const baseUrl = process.env.FRONTEND_URL;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Página principal del directorio
    xml += `
      <url>
        <loc>${baseUrl}/marketplace</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `;

    // Cada perfil de negocio
    perfiles.forEach(perfil => {
      xml += `
        <url>
          <loc>${baseUrl}/${perfil.slug}</loc>
          <lastmod>${new Date(perfil.actualizado_en).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Error generando sitemap:', error);
    res.status(500).send('Error generando sitemap');
  }
};

// Ruta
router.get('/sitemap.xml', sitemapController.generarSitemap);
```

---

### 4.2 Google Analytics 4

```jsx
// frontend/src/utils/analytics.js

export const trackMarketplaceEvent = (eventName, params = {}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, {
      event_category: 'marketplace',
      ...params
    });
  }
};

// Eventos específicos
export const trackVerPerfil = (slug, ciudad) => {
  trackMarketplaceEvent('view_profile', {
    profile_slug: slug,
    city: ciudad
  });
};

export const trackClicAgendar = (slug) => {
  trackMarketplaceEvent('click_agendar', {
    profile_slug: slug
  });
};

export const trackCitaCreada = (slug, servicios, precio) => {
  trackMarketplaceEvent('cita_creada', {
    profile_slug: slug,
    num_servicios: servicios.length,
    precio_total: precio,
    value: precio,
    currency: 'MXN'
  });
};
```

---

## ✅ TESTING Y VALIDACIÓN

**Duración:** 2 días (16 horas)

### Tests Backend (Jest + Supertest)

```javascript
// backend/app/__tests__/endpoints/marketplace.test.js

describe('Endpoints de Marketplace', () => {

  describe('GET /api/v1/marketplace/perfiles', () => {
    it('debería listar perfiles públicos sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/perfiles')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('debería filtrar por ciudad', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/perfiles?ciudad=guadalajara')
        .expect(200);

      expect(response.body.data.every(p => p.ciudad.toLowerCase().includes('guadalajara'))).toBe(true);
    });
  });

  describe('POST /api/v1/marketplace/agendar', () => {
    it('debería crear cita desde marketplace sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/agendar')
        .send({
          slug: 'guadalajara-barberia-test',
          nombre_completo: 'Juan Pérez',
          email: 'juan@example.com',
          telefono: '3312345678',
          servicios_ids: [1],
          fecha_cita: '2025-12-01',
          hora_inicio: '10:00'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('codigo_cita');
    });
  });

  describe('POST /api/v1/marketplace/reseñas', () => {
    it('debería rechazar reseña si no tiene cita completada', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/reseñas')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          cita_id: 999,
          rating: 5,
          comentario: 'Excelente'
        })
        .expect(404);
    });
  });

});
```

---

## 📅 CRONOGRAMA

| Fase | Duración | Inicio | Fin |
|------|----------|--------|-----|
| **Fase 1: Base de Datos** | 5 días | Día 1 | Día 5 |
| **Fase 2: Backend API** | 8 días | Día 6 | Día 13 |
| **Fase 3: Frontend** | 10 días | Día 14 | Día 23 |
| **Fase 4: SEO** | 3 días | Día 24 | Día 26 |
| **Testing** | 2 días | Día 27 | Día 28 |
| **TOTAL** | **28 días** | - | - |

**Esfuerzo Total:** ~224 horas (28 días x 8h)

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **SEO lento** | Media | Alto | Implementar Server-Side Rendering (SSR) con Next.js |
| **Spam de reseñas** | Media | Medio | Validar cita completada + moderación |
| **Carga lenta con muchos perfiles** | Alta | Medio | Paginación + lazy loading + CDN para imágenes |
| **Duplicados de slug** | Baja | Alto | UNIQUE constraint + timestamp en slug |
| **Problemas GDPR** | Baja | Alto | Hash IPs + no almacenar IPs reales |

---

## 🎯 CRITERIOS DE ÉXITO

### Técnicos
- [ ] 4 tablas creadas con RLS
- [ ] 15 endpoints funcionando
- [ ] 6 páginas frontend operativas
- [ ] 15 componentes React
- [ ] 8 hooks TanStack Query
- [ ] Tests con > 80% cobertura
- [ ] Sitemap.xml generándose automáticamente
- [ ] Schema.org en todas las páginas

### Negocio
- [ ] Al menos 10 perfiles publicados en primera semana
- [ ] Indexado en Google Search Console
- [ ] Primera cita agendada desde marketplace
- [ ] Dashboard de analytics funcional
- [ ] NPS > 60 de negocios

---

## 📚 RECURSOS Y DEPENDENCIAS

### NPM Packages Nuevos

**Backend:**
- `crypto` (nativo) - Para hash de IPs

**Frontend:**
- `react-helmet-async` - Meta tags dinámicos
- `leaflet` o `@react-google-maps/api` - Mapas
- `date-fns` - Manejo de fechas

### APIs Externas

- **Google Maps JavaScript API** - Mapas de ubicación
- **Google Search Console** - Monitoreo SEO

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

**Nota:** Se trabajará directamente en la rama principal (`main`). No se requieren migraciones ya que el proyecto se levanta desde cero.

### Fase 1: Base de Datos (Día 1-5)
1. ✅ **Crear archivo `sql/schema/10-marketplace.sql`**
2. ✅ **Agregar las 4 tablas** (marketplace_perfiles, marketplace_reseñas, marketplace_analytics, marketplace_categorias)
3. ✅ **Agregar 20+ índices optimizados**
4. ✅ **Agregar 8 políticas RLS**
5. ✅ **Agregar 3 funciones PL/pgSQL**
6. ✅ **Agregar 3 triggers**
7. ✅ **Modificar tabla `organizaciones`** (columnas marketplace)
8. ✅ **Probar**: `docker-compose down -v && npm run dev` (levanta desde cero)

### Fase 2: Backend API (Día 6-13)
1. ✅ **Crear estructura de carpetas** (controllers, database, schemas)
2. ✅ **Implementar 15 endpoints**
3. ✅ **Integrar router en `routes/api/v1/index.js`**
4. ✅ **Escribir tests** (`__tests__/endpoints/marketplace.test.js`)

### Fase 3: Frontend Público (Día 14-23)
1. ✅ **Crear 6 páginas React**
2. ✅ **Crear 15 componentes**
3. ✅ **Implementar 8 hooks TanStack Query**
4. ✅ **Integrar rutas públicas en router**

### Fase 4: SEO y Analytics (Día 24-26)
1. ✅ **Implementar meta tags dinámicos**
2. ✅ **Crear sitemap.xml endpoint**
3. ✅ **Configurar Google Analytics**
4. ✅ **Testing SEO completo**

### Testing y Validación (Día 27-28)
1. ✅ **Ejecutar suite de tests completa**
2. ✅ **Testing manual de flujo completo**
3. ✅ **Validar con 5 negocios reales**
4. ✅ **Indexar en Google Search Console**

### Lanzamiento
1. ✅ **Commit a main** con mensaje descriptivo
2. ✅ **Deploy a producción** (VPS Hostinger)
3. ✅ **Campaña de lanzamiento**
4. ✅ **Monitoreo primeros 7 días**

---

**Fecha Última Actualización:** 16 Noviembre 2025
**Versión:** 1.0
**Estado:** ✅ Listo para Iniciar Desarrollo
**Próxima Revisión:** Al completar Fase 1
