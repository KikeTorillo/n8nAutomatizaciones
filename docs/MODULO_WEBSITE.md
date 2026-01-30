# Modulo Website - Nexo ERP

## Resumen

Constructor de sitios web integrado con ERP. Ventaja competitiva: CRM, citas, servicios y facturacion nativos.

---

## Estado Actual (29 Enero 2026)

### Arquitectura

```
FRONTEND                              BACKEND
├── WebsiteEditorPage                 ├── /api/v1/website/* (auth)
├── DndEditorProvider (@dnd-kit)      ├── /api/v1/website/ai/* (IA)
├── BlockPalette (16 bloques)         ├── /api/v1/website/images/* (Unsplash)
├── EditorCanvas + CanvasBlock        └── /api/v1/public/sitio/* (publico)
├── PropertiesPanel
├── OnboardingTour (driver.js)        BASE DE DATOS
├── AIWizard (21 industrias)          ├── website_config (+ version)
├── SEOTips/ (componentes)            ├── website_paginas (+ version)
├── AIWriter/ (componentes)           ├── website_bloques (+ version)
├── DragPreview/ (componentes)        ├── website_versiones
└── UnsplashPicker/ (componentes)     └── website_analytics

HOOKS (frontend/src/hooks/otros/website/)
├── constants.js      # WEBSITE_KEYS, ANALYTICS_KEYS
├── queries.js        # 8 hooks de lectura
├── mutations.js      # 12 hooks de escritura (manejo 409)
├── manager.js        # useWebsiteEditor (combinado)
└── useWebsiteAnalytics.js

SERVICIOS BACKEND
├── ai.service.js              # IA con Circuit Breaker distribuido
├── circuitBreaker.service.js  # Redis Pub/Sub (nuevo)
├── websiteCache.service.js    # Cache Redis DB 5
└── site-generator.service.js  # 21 industrias
```

### Funcionalidades Core

| Feature | Estado |
|---------|--------|
| Editor Drag & Drop | ✅ |
| 16 tipos de bloques | ✅ |
| AI Site Generator (21 industrias) | ✅ |
| Bloqueo Optimista (version) | ✅ Nuevo |
| Circuit Breaker Distribuido | ✅ Nuevo |
| Persistencia Store (localStorage) | ✅ Nuevo |
| Manejo conflictos 409 (toast) | ✅ Nuevo |
| Preview/Staging | ✅ |
| Versionado/Rollback | ✅ |
| Autosave (3s debounce) | ✅ |

---

## Mejoras Arquitectonicas (29 Enero 2026)

### 1. Bloqueo Optimista

Evita perdida de datos cuando 2 usuarios editan simultaneamente.

**Implementacion:**
- Campo `version INTEGER NOT NULL DEFAULT 1` en 3 tablas SQL
- UPDATE incluye `WHERE version = $N` y `version = version + 1`
- Error 409 si version no coincide
- Frontend muestra toast con opcion de recargar

**Archivos:**
- `sql/website/01-tablas.sql`
- `models/bloques.model.js`, `paginas.model.js`, `config.model.js`
- `schemas/website.schemas.js`
- `hooks/otros/website/mutations.js`

### 2. Circuit Breaker Distribuido

Comparte estado entre instancias via Redis.

**Configuracion:**
- Timeout: 10s
- Umbral fallas: 5 consecutivas
- Reset: 30s
- Redis DB 5 + Pub/Sub canal `circuit:ai:sync`

**Archivos:**
- `services/circuitBreaker.service.js` (nuevo)
- `services/ai.service.js` (actualizado)

### 3. Reorganizacion Hooks

Estructura modular siguiendo patrones del proyecto.

**Estructura:**
```
hooks/otros/website/
├── constants.js   # Query keys centralizadas
├── queries.js     # Hooks de lectura
├── mutations.js   # Hooks de escritura + manejo 409
├── manager.js     # useWebsiteEditor
└── index.js       # Barrel exports
```

### 4. Persistencia Store

Recupera estado del editor al recargar pagina.

**Persiste:**
- `bloques`, `paginaActivaId`, `zoom`, `breakpoint`

**Archivo:**
- `store/websiteEditorStore.js` (middleware persist)

---

## Pendientes

### Proximo Paso: Prueba Completa Frontend

Verificar funcionamiento end-to-end del modulo:

1. **Flujo de creacion de sitio**
   - Crear config con AIWizard
   - Verificar que campo `version` se retorna

2. **Edicion de bloques**
   - Editar bloque y guardar
   - Verificar incremento de version
   - Simular conflicto (2 pestanas) - debe mostrar toast 409

3. **Persistencia**
   - Editar bloques sin guardar
   - Recargar pagina
   - Verificar que estado se recupera de localStorage

4. **Circuit Breaker**
   - Verificar logs de estado en backend
   - Confirmar fallback a templates cuando IA falla

5. **Hooks reorganizados**
   - Verificar que imports existentes siguen funcionando
   - Probar nuevos imports desde `index.js`

### Integraciones Pendientes

| Componente | Estado | Accion |
|------------|--------|--------|
| SEOTipsPanel | Creado | Agregar 4to tab en PropertiesPanel |
| AIWriterPopover | Creado | Agregar boton en campos texto |
| UnsplashModal | Creado | Agregar boton en campos imagen |
| BlockDragPreview | Creado | Integrar en DragOverlay |

### Configuracion Requerida

```bash
# Variables de entorno
UNSPLASH_ACCESS_KEY=<pendiente>  # Usuario debe configurar
REDIS_HOST=redis                 # Para circuit breaker distribuido
```

---

## Endpoints

```
# Config
GET    /api/v1/website/config
POST   /api/v1/website/config
PUT    /api/v1/website/config/:id      # Requiere version

# Paginas
GET    /api/v1/website/paginas
POST   /api/v1/website/paginas
PUT    /api/v1/website/paginas/:id     # Requiere version

# Bloques
GET    /api/v1/website/paginas/:id/bloques
POST   /api/v1/website/bloques
PUT    /api/v1/website/bloques/:id     # Requiere version

# IA
POST   /api/v1/website/ai/generar-texto
POST   /api/v1/website/ai/generar-sitio

# Imagenes (Unsplash)
GET    /api/v1/website/images/search
POST   /api/v1/website/images/download
GET    /api/v1/website/images/random

# Publico
GET    /api/v1/public/sitio/:slug
GET    /api/v1/public/sitio/:slug/:pagina
```

---

*Actualizado: 29 Enero 2026*
