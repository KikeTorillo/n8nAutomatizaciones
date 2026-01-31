# Módulo Website - Nexo ERP

Constructor de sitios web integrado con ERP. Ventaja competitiva: CRM, citas, servicios y facturación nativos.

---

## Estado Actual

### Funcionalidades ✅

| Funcionalidad | Detalle |
|---------------|---------|
| Editor Visual | 16 bloques, drag & drop (@dnd-kit), inline editing |
| AI Site Generator | 21 industrias, OpenRouter (qwen3-235b), circuit breaker |
| AI Writer | Generación por campo con tono (5) y longitud (3), preview + aplicar |
| Unsplash | Búsqueda de imágenes integrada en PropertiesPanel |
| Acciones de Bloque | Duplicar, eliminar, toggle visibilidad, reordenamiento |
| Autosave | 3s debounce, mutex, reintentos, bloqueo optimista (409) |
| Responsive Preview | Desktop/Tablet/Mobile con zoom |
| SEO | Score tiempo real, 7 reglas |
| Undo/Redo | Ctrl+Z/Y con Zustand temporal |

### Arquitectura

```
FRONTEND                              BACKEND (53 endpoints)
├── WebsiteEditorPage                 ├── /config/* (9)
├── EditorCanvas + CanvasBlock        ├── /paginas/* (6)
├── BlockEditor (vista lista)         ├── /bloques/* (10)
├── PropertiesPanel (4 tabs)          ├── /ai/* (6) - OpenRouter
├── BlockPalette                      └── /public/* (8) - Sin auth
└── AIWriter/
    ├── AIWriterPopover.jsx           # Popover (bottom sheet en móvil)
    ├── ToneSelector.jsx              # Tono + Longitud
    └── useAIWriter.js                # Hook generación

HOOKS: useBlockEditor, useArrayItems, useAutosave, useEstadoGuardado
STORE: websiteEditorStore.js + temporal middleware
```

### Estructura Backend

```
backend/app/modules/website/
├── controllers/
│   ├── ai.controller.js          # Generación IA (usa models, sin SQL directo)
│   ├── config.controller.js      # CRUD configuración sitio
│   ├── paginas.controller.js     # Gestión páginas
│   ├── bloques.controller.js     # Gestión bloques
│   └── public.controller.js      # Rutas públicas sin auth
├── models/
│   ├── config.model.js           # + verificarExistente(), crearDesdeGenerador()
│   ├── paginas.model.js          # + crearConBloques(), reordenar con FOR UPDATE
│   ├── bloques.model.js          # + reordenar con FOR UPDATE
│   └── ...
├── services/
│   ├── ai.service.js             # OpenRouter + fallback
│   ├── site-generator.service.js # Generación sitio completo
│   └── websiteCache.service.js   # Redis cache + Pub/Sub
├── data/
│   └── block-defaults.json       # Templates de bloques (16 tipos)
└── routes/
    └── website.routes.js
```

### AI Writer - Tonos y Longitudes

```javascript
// Tonos disponibles
TONOS = ['profesional', 'casual', 'persuasivo', 'informativo', 'emotivo']

// Longitudes
LONGITUDES = ['corto', 'medio', 'largo']

// Endpoint
POST /api/v1/website/ai/generate-content
Body: { campo, industria, contexto: { nombreNegocio, tono, longitud } }
```

---

## Endpoints Públicos (Sin Auth)

```
GET  /api/v1/public/sitio/:slug           # Sitio completo
GET  /api/v1/public/sitio/:slug/:pagina   # Página específica
POST /api/v1/public/sitio/:slug/contacto  # Formulario contacto
GET  /api/v1/public/preview/:token        # Preview no publicado
```

---

## Mejoras Recientes (30 Enero 2026)

### Deuda Técnica Resuelta

| Cambio | Archivos | Beneficio |
|--------|----------|-----------|
| SQL movido de controller a models | `ai.controller.js`, `config.model.js`, `paginas.model.js` | Mejor separación de responsabilidades, código más testeable |
| SELECT FOR UPDATE en reordenar | `paginas.model.js`, `bloques.model.js` | Previene race conditions en edición concurrente |
| Templates extraídos a JSON | `bloques.model.js` → `data/block-defaults.json` | De 230 líneas hardcodeadas a 25 líneas + archivo JSON reutilizable |

### Métodos Agregados

```javascript
// config.model.js
ConfigModel.verificarExistente(orgId)           // Verifica si ya existe sitio
ConfigModel.crearDesdeGenerador(datos, orgId, db) // Crear config desde IA

// paginas.model.js
PaginasModel.crearConBloques(datos, websiteId, db) // Crear página + bloques en transacción
```

---

## Pendientes

| Prioridad | Feature |
|-----------|---------|
| Alta | AI Chat Conversacional - Wizard para crear sitio |
| Alta | AI Image Generator - Integrar DALL-E o Stable Diffusion |
| Media | Undo/Redo global - Conectar editores inline al temporal middleware |
| Media | Ecommerce básico - Bloque productos, carrito |
| Baja | Más templates (de 17 a 50+ industrias) |

---

*Actualizado: 30 Enero 2026*
