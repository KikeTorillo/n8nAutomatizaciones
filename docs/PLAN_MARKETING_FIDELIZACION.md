# Plan: Marketing y Fidelización

**Fecha:** Diciembre 2025
**Estado:** Pendiente
**Prioridad:** Alta
**Dependencias:** Módulo core (clientes, organizaciones)

---

## Resumen Ejecutivo

Implementar un sistema completo de marketing y fidelización que incluya:
- **Gift Cards**: Tarjetas de regalo digitales
- **Programa de Lealtad**: Puntos por compra/visita
- **Email Marketing**: Campañas automatizadas
- **Promociones**: Descuentos y ofertas especiales

Objetivo: Aumentar retención de clientes y ticket promedio.

---

## Módulos a Implementar

### 1. Gift Cards (Tarjetas de Regalo)
- Venta de tarjetas digitales
- Códigos QR únicos
- Saldo recargable
- Uso parcial permitido
- Envío por email/WhatsApp
- Diseños personalizables

### 2. Programa de Lealtad (Puntos)
- Acumulación por compra ($1 = X puntos)
- Acumulación por visita
- Canje por servicios/productos
- Niveles de membresía (Bronce, Plata, Oro)
- Puntos con expiración configurable

### 3. Email Marketing
- Campañas manuales
- Automatizaciones (cumpleaños, inactividad, post-visita)
- Templates prediseñados
- Segmentación de audiencia
- Métricas (apertura, clicks)

### 4. Promociones
- Descuentos por porcentaje o monto
- Códigos promocionales
- Ofertas por tiempo limitado
- Primera visita
- Referidos

---

## Diseño de Base de Datos

### Tabla: `gift_cards`

```sql
CREATE TABLE gift_cards (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(20) UNIQUE NOT NULL,     -- GC-XXXX-XXXX
    codigo_qr TEXT,                         -- Data URL del QR

    -- Valores
    monto_inicial DECIMAL(10,2) NOT NULL,
    saldo_actual DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Compra
    comprador_nombre VARCHAR(150),
    comprador_email VARCHAR(150),
    comprador_telefono VARCHAR(20),
    fecha_compra TIMESTAMPTZ DEFAULT NOW(),
    metodo_pago VARCHAR(50),

    -- Destinatario
    destinatario_nombre VARCHAR(150),
    destinatario_email VARCHAR(150),
    destinatario_telefono VARCHAR(20),
    mensaje_personalizado TEXT,

    -- Diseño
    template_id INTEGER,                    -- FK a templates_gift_card
    imagen_personalizada_url TEXT,

    -- Estado
    estado estado_gift_card DEFAULT 'activa',  -- activa, agotada, expirada, cancelada
    fecha_expiracion DATE,                  -- NULL = sin expiración
    fecha_primera_uso TIMESTAMPTZ,
    fecha_ultimo_uso TIMESTAMPTZ,

    -- Envío
    enviada BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMPTZ,
    canal_envio VARCHAR(20),                -- email, whatsapp, sms

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE estado_gift_card AS ENUM ('activa', 'agotada', 'expirada', 'cancelada');

-- Índices
CREATE INDEX idx_gift_cards_org ON gift_cards(organizacion_id);
CREATE INDEX idx_gift_cards_codigo ON gift_cards(codigo);
CREATE INDEX idx_gift_cards_estado ON gift_cards(estado) WHERE estado = 'activa';
```

### Tabla: `gift_cards_movimientos`

```sql
CREATE TABLE gift_cards_movimientos (
    id SERIAL PRIMARY KEY,
    gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,

    -- Movimiento
    tipo tipo_movimiento_gc NOT NULL,       -- compra, uso, recarga, ajuste
    monto DECIMAL(10,2) NOT NULL,
    saldo_anterior DECIMAL(10,2) NOT NULL,
    saldo_posterior DECIMAL(10,2) NOT NULL,

    -- Referencia
    venta_id INTEGER REFERENCES ventas_pos(id),
    cita_id INTEGER REFERENCES citas(id),
    usuario_id INTEGER REFERENCES usuarios(id),

    -- Detalles
    descripcion TEXT,

    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE tipo_movimiento_gc AS ENUM ('compra', 'uso', 'recarga', 'ajuste', 'expiracion');
```

### Tabla: `templates_gift_card`

```sql
CREATE TABLE templates_gift_card (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE CASCADE,  -- NULL = global

    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT NOT NULL,
    categoria VARCHAR(50),                  -- cumpleanos, navidad, general, etc.
    activo BOOLEAN DEFAULT TRUE,
    es_default BOOLEAN DEFAULT FALSE,

    creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `programa_lealtad`

```sql
CREATE TABLE programa_lealtad (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER UNIQUE NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Configuración general
    nombre VARCHAR(100) DEFAULT 'Programa de Puntos',
    activo BOOLEAN DEFAULT FALSE,

    -- Reglas de acumulación
    puntos_por_peso DECIMAL(5,2) DEFAULT 1,     -- 1 punto por cada $X gastados
    puntos_por_visita INTEGER DEFAULT 0,         -- Puntos bonus por visita
    puntos_primera_visita INTEGER DEFAULT 0,     -- Bonus primera vez
    puntos_cumpleanos INTEGER DEFAULT 0,         -- Bonus cumpleaños
    puntos_referido INTEGER DEFAULT 0,           -- Por referir nuevo cliente

    -- Reglas de canje
    valor_punto DECIMAL(5,2) DEFAULT 0.10,       -- Cada punto vale $X
    minimo_canje INTEGER DEFAULT 100,            -- Mínimo puntos para canjear
    maximo_canje_porcentaje INTEGER DEFAULT 50,  -- Máx % del total pagable con puntos

    -- Expiración
    puntos_expiran BOOLEAN DEFAULT TRUE,
    meses_expiracion INTEGER DEFAULT 12,

    -- Niveles
    niveles_activos BOOLEAN DEFAULT FALSE,

    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `niveles_lealtad`

```sql
CREATE TABLE niveles_lealtad (
    id SERIAL PRIMARY KEY,
    programa_id INTEGER NOT NULL REFERENCES programa_lealtad(id) ON DELETE CASCADE,

    nombre VARCHAR(50) NOT NULL,            -- Bronce, Plata, Oro, Platino
    puntos_requeridos INTEGER NOT NULL,     -- Puntos para alcanzar nivel
    color VARCHAR(7),                       -- #CD7F32 (bronce)
    icono VARCHAR(50),                      -- medal, star, crown

    -- Beneficios
    multiplicador_puntos DECIMAL(3,2) DEFAULT 1.0,  -- 1.5x puntos
    descuento_servicios INTEGER DEFAULT 0,           -- % descuento
    descuento_productos INTEGER DEFAULT 0,
    beneficios_adicionales JSONB DEFAULT '[]',       -- Lista de beneficios texto

    orden INTEGER DEFAULT 0,

    UNIQUE(programa_id, nombre)
);
```

### Tabla: `clientes_puntos`

```sql
CREATE TABLE clientes_puntos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    programa_id INTEGER NOT NULL REFERENCES programa_lealtad(id) ON DELETE CASCADE,

    -- Saldos
    puntos_actuales INTEGER DEFAULT 0,
    puntos_totales_ganados INTEGER DEFAULT 0,
    puntos_totales_canjeados INTEGER DEFAULT 0,
    puntos_expirados INTEGER DEFAULT 0,

    -- Nivel
    nivel_id INTEGER REFERENCES niveles_lealtad(id),
    fecha_nivel_alcanzado TIMESTAMPTZ,

    -- Referidos
    codigo_referido VARCHAR(10) UNIQUE,     -- MI-XXXX
    referido_por INTEGER REFERENCES clientes(id),

    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(cliente_id, programa_id)
);
```

### Tabla: `puntos_movimientos`

```sql
CREATE TABLE puntos_movimientos (
    id SERIAL PRIMARY KEY,
    cliente_puntos_id INTEGER NOT NULL REFERENCES clientes_puntos(id) ON DELETE CASCADE,

    -- Movimiento
    tipo tipo_movimiento_puntos NOT NULL,
    puntos INTEGER NOT NULL,                -- Positivo = ganado, Negativo = usado
    puntos_anteriores INTEGER NOT NULL,
    puntos_posteriores INTEGER NOT NULL,

    -- Referencia
    venta_id INTEGER REFERENCES ventas_pos(id),
    cita_id INTEGER REFERENCES citas(id),
    promocion_id INTEGER REFERENCES promociones(id),

    -- Detalles
    descripcion TEXT,
    fecha_expiracion DATE,                  -- Cuando expiran estos puntos

    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE tipo_movimiento_puntos AS ENUM (
    'compra', 'visita', 'referido', 'cumpleanos',
    'canje', 'ajuste_manual', 'expiracion', 'bonus'
);
```

### Tabla: `promociones`

```sql
CREATE TABLE promociones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(20) UNIQUE,              -- VERANO2025, PRIMERAVEZ
    codigo_requerido BOOLEAN DEFAULT FALSE, -- Debe ingresar código

    -- Tipo de descuento
    tipo_descuento tipo_descuento NOT NULL, -- porcentaje, monto_fijo, 2x1
    valor_descuento DECIMAL(10,2) NOT NULL, -- 15 (%) o 100 ($)

    -- Aplicación
    aplica_a aplica_promocion DEFAULT 'todo', -- todo, servicios, productos, categorias
    categorias_ids INTEGER[],                  -- Si aplica_a = categorias
    servicios_ids INTEGER[],                   -- Servicios específicos
    productos_ids INTEGER[],                   -- Productos específicos

    -- Condiciones
    compra_minima DECIMAL(10,2),            -- Mínimo de compra
    primera_visita_solo BOOLEAN DEFAULT FALSE,
    clientes_nuevos_solo BOOLEAN DEFAULT FALSE,

    -- Límites
    usos_maximos INTEGER,                   -- Total de usos permitidos
    usos_actuales INTEGER DEFAULT 0,
    usos_por_cliente INTEGER DEFAULT 1,     -- Veces que un cliente puede usar

    -- Vigencia
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    dias_validos JSONB,                     -- ["lunes", "martes"] o NULL = todos

    -- Estado
    activa BOOLEAN DEFAULT TRUE,

    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE tipo_descuento AS ENUM ('porcentaje', 'monto_fijo', '2x1', '3x2');
CREATE TYPE aplica_promocion AS ENUM ('todo', 'servicios', 'productos', 'categorias');
```

### Tabla: `promociones_usos`

```sql
CREATE TABLE promociones_usos (
    id SERIAL PRIMARY KEY,
    promocion_id INTEGER NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id),

    venta_id INTEGER REFERENCES ventas_pos(id),
    cita_id INTEGER REFERENCES citas(id),

    descuento_aplicado DECIMAL(10,2) NOT NULL,

    creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `campanas_email`

```sql
CREATE TABLE campanas_email (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Contenido
    nombre VARCHAR(150) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    contenido_html TEXT NOT NULL,
    contenido_texto TEXT,

    -- Tipo
    tipo tipo_campana NOT NULL,             -- manual, automatica
    trigger_automatico VARCHAR(50),         -- cumpleanos, inactividad_30d, post_visita

    -- Audiencia
    segmento_id INTEGER REFERENCES segmentos_clientes(id),
    filtros_audiencia JSONB,                -- Filtros dinámicos

    -- Programación
    fecha_envio TIMESTAMPTZ,                -- Para manuales
    enviada BOOLEAN DEFAULT FALSE,
    fecha_enviada TIMESTAMPTZ,

    -- Métricas
    total_enviados INTEGER DEFAULT 0,
    total_abiertos INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_rebotes INTEGER DEFAULT 0,
    total_desuscripciones INTEGER DEFAULT 0,

    -- Estado
    estado estado_campana DEFAULT 'borrador',

    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE tipo_campana AS ENUM ('manual', 'automatica');
CREATE TYPE estado_campana AS ENUM ('borrador', 'programada', 'enviando', 'enviada', 'cancelada');
```

### Tabla: `segmentos_clientes`

```sql
CREATE TABLE segmentos_clientes (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Criterios (JSONB para flexibilidad)
    criterios JSONB NOT NULL,
    /*
    Ejemplo:
    {
        "visitas_minimas": 5,
        "dias_sin_visita_max": 30,
        "gasto_minimo": 1000,
        "servicios_usados": [1, 2, 3],
        "nivel_lealtad": "oro"
    }
    */

    -- Cache
    clientes_count INTEGER DEFAULT 0,
    ultima_actualizacion TIMESTAMPTZ,

    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Nuevos Endpoints API

### Gift Cards

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/gift-cards` | Listar gift cards |
| `POST` | `/api/v1/gift-cards` | Crear/Vender gift card |
| `GET` | `/api/v1/gift-cards/:id` | Detalle de gift card |
| `GET` | `/api/v1/gift-cards/codigo/:codigo` | Buscar por código |
| `POST` | `/api/v1/gift-cards/:id/recargar` | Recargar saldo |
| `POST` | `/api/v1/gift-cards/:id/usar` | Usar saldo |
| `POST` | `/api/v1/gift-cards/:id/enviar` | Enviar por email/WhatsApp |
| `GET` | `/api/v1/gift-cards/:id/movimientos` | Historial |

### Programa de Lealtad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/lealtad/config` | Configuración del programa |
| `PUT` | `/api/v1/lealtad/config` | Actualizar configuración |
| `GET` | `/api/v1/lealtad/niveles` | Listar niveles |
| `POST` | `/api/v1/lealtad/niveles` | Crear nivel |
| `GET` | `/api/v1/clientes/:id/puntos` | Puntos de cliente |
| `POST` | `/api/v1/clientes/:id/puntos/ajustar` | Ajuste manual |
| `GET` | `/api/v1/clientes/:id/puntos/historial` | Historial movimientos |

### Promociones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/promociones` | Listar promociones |
| `POST` | `/api/v1/promociones` | Crear promoción |
| `PUT` | `/api/v1/promociones/:id` | Actualizar |
| `DELETE` | `/api/v1/promociones/:id` | Eliminar |
| `POST` | `/api/v1/promociones/validar` | Validar código |
| `GET` | `/api/v1/promociones/:id/estadisticas` | Stats de uso |

### Campañas Email

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/campanas` | Listar campañas |
| `POST` | `/api/v1/campanas` | Crear campaña |
| `PUT` | `/api/v1/campanas/:id` | Actualizar |
| `POST` | `/api/v1/campanas/:id/enviar` | Enviar/Programar |
| `GET` | `/api/v1/campanas/:id/preview` | Preview email |
| `GET` | `/api/v1/segmentos` | Listar segmentos |
| `POST` | `/api/v1/segmentos` | Crear segmento |

---

## Estructura de Archivos

### Backend

```
backend/app/modules/marketing/
├── controllers/
│   ├── giftCards.controller.js
│   ├── lealtad.controller.js
│   ├── promociones.controller.js
│   └── campanas.controller.js
├── models/
│   ├── giftCard.model.js
│   ├── lealtad.model.js
│   ├── promocion.model.js
│   └── campana.model.js
├── routes/
│   ├── giftCards.js
│   ├── lealtad.js
│   ├── promociones.js
│   └── campanas.js
├── schemas/
│   └── marketing.schemas.js
├── services/
│   ├── puntosService.js          # Cálculo de puntos
│   ├── emailCampaignService.js   # Envío masivo
│   └── qrGenerator.js            # QR para gift cards
└── manifest.json
```

### Frontend

```
frontend/src/
├── pages/
│   └── marketing/
│       ├── GiftCardsPage.jsx
│       ├── LealtadConfigPage.jsx
│       ├── PromocionesPage.jsx
│       └── CampanasPage.jsx
├── components/
│   └── marketing/
│       ├── GiftCardForm.jsx
│       ├── GiftCardPreview.jsx
│       ├── PuntosWidget.jsx      # Widget en perfil cliente
│       ├── PromocionForm.jsx
│       ├── CampanaEditor.jsx
│       └── SegmentoBuilder.jsx
└── hooks/
    ├── useGiftCards.js
    ├── useLealtad.js
    ├── usePromociones.js
    └── useCampanas.js
```

---

## Integraciones

### Con POS
- Aplicar gift card como método de pago
- Acumular puntos automáticamente
- Validar/aplicar códigos promocionales
- Mostrar nivel de lealtad del cliente

### Con Citas
- Puntos por visita completada
- Promociones aplicables a servicios
- Envío automático post-visita

### Con Email Service (existente)
- Nuevo provider para campañas masivas
- Templates marketing
- Tracking de aperturas/clicks

---

## Plan de Implementación

### Fase 1: Gift Cards (Semana 1-2)
- [ ] Tablas BD: gift_cards, movimientos, templates
- [ ] Modelo y controlador CRUD
- [ ] Generador QR
- [ ] Integración con POS (método de pago)
- [ ] Frontend: página y formularios
- [ ] Envío por email

### Fase 2: Programa de Lealtad (Semana 2-3)
- [ ] Tablas BD: programa, niveles, puntos
- [ ] Configuración de programa
- [ ] Servicio de cálculo de puntos
- [ ] Integración con POS (acumulación/canje)
- [ ] Widget puntos en perfil cliente
- [ ] Frontend: configuración

### Fase 3: Promociones (Semana 3-4)
- [ ] Tablas BD: promociones, usos
- [ ] CRUD promociones
- [ ] Validador de códigos
- [ ] Integración POS
- [ ] Frontend: gestión promociones

### Fase 4: Email Marketing (Semana 4-5)
- [ ] Tablas BD: campañas, segmentos
- [ ] Servicio envío masivo (batches)
- [ ] Templates prediseñados
- [ ] Builder de segmentos
- [ ] Automatizaciones básicas
- [ ] Tracking métricas

---

## Límites por Plan

| Funcionalidad | Free | Básico | Pro | Empresarial |
|---------------|------|--------|-----|-------------|
| Gift Cards | ❌ | 10/mes | 50/mes | Ilimitado |
| Programa Lealtad | ❌ | ❌ | ✅ | ✅ |
| Niveles Lealtad | ❌ | ❌ | 3 | Ilimitado |
| Promociones activas | 1 | 3 | 10 | Ilimitado |
| Campañas email/mes | ❌ | 2 | 10 | Ilimitado |
| Segmentos | ❌ | 2 | 10 | Ilimitado |

---

## Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Adopción gift cards | 30% de orgs Pro+ |
| Tasa canje puntos | 40% de puntos emitidos |
| Tasa apertura emails | > 25% |
| Reducción churn clientes | -15% |
| Aumento ticket promedio | +10% |

---

**Estimación:** 4-5 semanas de desarrollo
