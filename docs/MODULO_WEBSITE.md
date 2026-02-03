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
GET  /api/v1/public/sitio/:slug              # Sitio completo
GET  /api/v1/public/sitio/:slug/:pagina      # Página específica
POST /api/v1/public/sitio/:slug/contacto     # Formulario contacto
GET  /api/v1/public/sitio/:slug/servicios    # Servicios para bloque dinámico
GET  /api/v1/public/sitio/:slug/profesionales # Profesionales para bloque equipo
GET  /api/v1/public/preview/:token           # Preview no publicado
```

---

## Mejoras Recientes

### Bloque Equipo - Origen Profesionales ERP (3 Feb 2026)

| Funcionalidad | Detalle |
|---------------|---------|
| **Origen de datos** | Selector: "Manual" o "Módulo Profesionales" |
| **Carga dinámica ERP** | Query a tabla `profesionales` con JOINs a `puestos` y `departamentos` |
| **Filtros** | Por departamento o selección manual de profesionales |
| **Indicador visual** | Badge azul "Profesionales desde ERP" en modo edición |
| **Endpoint privado** | `GET /api/v1/website/profesionales-erp` |
| **Endpoint público** | `GET /api/v1/public/sitio/:slug/profesionales` |

**Archivos modificados:**
- `bloques.controller.js` - Agregado `obtenerProfesionalesERP()`
- `website.routes.js` - Ruta `/profesionales-erp`
- `public.controller.js` - Agregado `obtenerProfesionales()` público
- `public.routes.js` - Ruta `/sitio/:slug/profesionales`
- `website.api.js` - Método `obtenerProfesionalesERP()`
- `EquipoCanvasBlock.jsx` - Query + manejo origen + indicador ERP
- `EquipoPublico.jsx` - Carga dinámica según origen

**Patrón:** Idéntico a Servicios ERP, pero consulta tabla `profesionales`.

---

### Timeline Block - Editor Avanzado (2 Feb 2026)

| Funcionalidad | Detalle |
|---------------|---------|
| **Disposición** | 3 layouts: alternado (zigzag), izquierda, derecha |
| **Color de línea** | Selector de color con fallback al tema primario |
| **Editor de hitos** | Drawer dedicado (no abarrota PropertiesPanel) |
| **Drag & drop** | Reordenar hitos con @dnd-kit |
| **Selector de iconos** | 10 opciones: rocket, flag, star, zap, award, users, building, target, heart, map-pin |
| **Campos por hito** | Fecha, icono, título, descripción |

**Archivos modificados:**
- `PropertiesPanel.jsx` - Agregado `itemsEditor` type + integración con drawer
- `TimelineCanvasBlock.jsx` - Soporte layouts + color personalizable + fix edición inline items
- `TimelineItemsDrawer.jsx` - Nuevo componente para edición de hitos
- `InlineEditor.jsx` - Fix sincronización de valores en contentEditable

**Bug fix (2 Feb 2026):** Edición inline de fechas/títulos de hitos ahora guarda correctamente.
El problema era un conflicto entre React children y contentEditable. Se corrigió usando refs
para inicializar y sincronizar el contenido.

### Deuda Técnica Resuelta (30 Enero 2026)

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

| Prioridad | Feature | Detalle |
|-----------|---------|---------|
| **Alta** | Validación bloque a bloque | Probar cada uno de los 16 bloques en profundidad: campos, estilos, responsivo |
| Alta | AI Chat Conversacional | Wizard para crear sitio |
| Alta | AI Image Generator | Integrar DALL-E o Stable Diffusion |
| Media | Undo/Redo global | Conectar editores inline al temporal middleware |
| Media | Ecommerce básico | Bloque productos, carrito |
| Baja | Más templates | De 17 a 50+ industrias |

### Bloques a Validar (16 total)

| # | Bloque | Estado | Notas |
|---|--------|--------|-------|
| 1 | Hero | ⏳ Pendiente | Imagen, título, CTA, alineación |
| 2 | Servicios | ✅ Validado | Columnas, precios, origen datos (manual/ERP) |
| 3 | Testimonios | ⏳ Pendiente | Grid/Carousel, origen datos |
| 4 | Equipo | ✅ Validado | Redes sociales, origen datos (manual/ERP) |
| 5 | CTA | ⏳ Pendiente | Fondo tipo (color/imagen/gradiente) |
| 6 | Contacto | ⏳ Pendiente | Formulario, info, mapa |
| 7 | Footer | ⏳ Pendiente | Logo, redes, links |
| 8 | Texto | ⏳ Pendiente | Alineación |
| 9 | Galería | ⏳ Pendiente | Grid/Masonry/Carousel, columnas |
| 10 | Video | ⏳ Pendiente | YouTube/Vimeo/MP4, autoplay |
| 11 | Separador | ⏳ Pendiente | Línea/Espacio/Ondas |
| 12 | Pricing | ⏳ Pendiente | Tablas de precios |
| 13 | FAQ | ⏳ Pendiente | Accordion |
| 14 | Countdown | ⏳ Pendiente | Fecha objetivo |
| 15 | Stats | ⏳ Pendiente | Números animados |
| 16 | Timeline | ✅ Validado | Layout, color, editor hitos |

---

*Actualizado: 3 Febrero 2026*
