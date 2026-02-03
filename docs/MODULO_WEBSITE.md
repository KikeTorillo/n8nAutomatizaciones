# Módulo Website - Nexo ERP

Constructor de sitios web integrado con ERP. Ventaja competitiva: CRM, citas, servicios y facturación nativos.

---

## Estado Actual

### Funcionalidades ✅

| Funcionalidad | Detalle |
|---------------|---------|
| Editor Visual | 16 bloques, drag & drop (@dnd-kit), inline editing |
| AI Site Generator | 21 industrias, OpenRouter (qwen3-235b), circuit breaker |
| AI Writer | Generación por campo con tono (5) y longitud (3) |
| Unsplash | Búsqueda de imágenes integrada |
| Autosave | 3s debounce, mutex, reintentos, bloqueo optimista (409) |
| Responsive Preview | Desktop/Tablet/Mobile con zoom |
| SEO | Score tiempo real, 7 reglas |
| Undo/Redo | Ctrl+Z/Y con Zustand temporal |
| Datos ERP | Servicios y Profesionales desde módulos internos |

---

## Arquitectura Frontend

```
frontend/src/pages/website/
├── WebsiteEditorPage.jsx        # Componente principal
├── context/
│   ├── EditorContext.jsx        # Wrapper + useEditor() (backward compatible)
│   ├── SiteContext.jsx          # Config, páginas, mutations
│   ├── LayoutContext.jsx        # Responsive, drawers, panels
│   ├── BlocksContext.jsx        # Bloques, CRUD, DnD handlers
│   ├── UIContext.jsx            # Modo editor, slash menu, autosave
│   └── index.js
├── containers/
│   ├── EditorHeader.jsx
│   ├── SidebarContainer.jsx
│   ├── CanvasContainer.jsx
│   ├── PropertiesContainer.jsx
│   ├── DrawersContainer.jsx
│   ├── EditorModals.jsx
│   └── index.js
├── hooks/
│   ├── useERPData.js            # Query centralizada servicios/profesionales
│   ├── useSlashMenu.js
│   ├── useAutosave.js
│   ├── useEditorLayout.js
│   ├── useEditorShortcuts.js
│   ├── useBlockEditor.js
│   ├── useArrayItems.js
│   └── index.js
├── components/
│   ├── blocks/
│   │   ├── BaseBlockEditor.jsx  # Estructura común editores
│   │   ├── fields/              # Campos reutilizables
│   │   │   ├── SectionTitleField.jsx   # Título + AI button
│   │   │   ├── ArrayItemsEditor.jsx    # Lista editable genérica
│   │   │   ├── ColorPickerField.jsx    # Selector de color
│   │   │   ├── IconPickerField.jsx     # Wrapper IconPicker
│   │   │   └── index.js
│   │   └── [16 editores]        # Todos usan BaseBlockEditor
│   ├── canvas-blocks/           # Renderizado visual
│   ├── AIWriter/
│   ├── UnsplashPicker/
│   └── ...
└── store: websiteEditorStore.js + temporal middleware
```

### Contextos (Divididos para Performance)

```javascript
// EditorProvider compone 4 contextos especializados
<SiteProvider>      // config, paginas, paginaActiva, mutations
  <LayoutProvider>  // isMobile, showSidebar, drawers
    <BlocksProvider>// bloques, handlers CRUD/DnD
      <UIProvider>  // modoEditor, slashMenu, autosave
      </UIProvider>
    </BlocksProvider>
  </LayoutProvider>
</SiteProvider>

// useEditor() retorna todo combinado (backward compatible)
// Hooks específicos: useSite(), useLayout(), useBlocks(), useUI()
```

---

## Arquitectura Backend

```
backend/app/modules/website/
├── constants/
│   ├── block-types.js           # BLOCK_TYPES, isValidBlockType()
│   └── index.js
├── controllers/
│   ├── ai.controller.js
│   ├── config.controller.js
│   ├── paginas.controller.js
│   ├── bloques.controller.js
│   └── public.controller.js
├── services/
│   ├── ai.service.js
│   ├── bloque.service.js
│   ├── erp-data.service.js
│   ├── site-generator.service.js
│   ├── websiteCache.service.js
│   └── index.js
├── models/
│   ├── config.model.js
│   ├── paginas.model.js
│   └── bloques.model.js         # Importa BLOCK_TYPES desde constants
├── schemas/
│   └── website.schemas.js       # Importa BLOCK_TYPES desde constants
├── data/
│   └── block-defaults.json
└── routes/
    └── website.routes.js
```

---

## Endpoints Públicos (Sin Auth)

```
GET  /api/v1/public/sitio/:slug              # Sitio completo
GET  /api/v1/public/sitio/:slug/:pagina      # Página específica
POST /api/v1/public/sitio/:slug/contacto     # Formulario contacto
GET  /api/v1/public/sitio/:slug/servicios    # Servicios dinámicos
GET  /api/v1/public/sitio/:slug/profesionales # Equipo dinámico
GET  /api/v1/public/preview/:token           # Preview no publicado
```

---

## Bloques (16 tipos)

| Bloque | Características |
|--------|-----------------|
| Hero | Imagen fondo, título, CTA, alineación |
| Servicios | Columnas, precios, origen: manual/ERP |
| Testimonios | Grid/Carousel, origen: manual/reseñas |
| Equipo | Redes sociales, origen: manual/ERP |
| CTA | Fondo: color/imagen/gradiente |
| Contacto | Formulario, info, mapa |
| Footer | Logo, redes, links |
| Texto | Alineación, contenido libre |
| Galería | Grid/Masonry/Carousel |
| Video | YouTube/Vimeo/MP4, autoplay |
| Separador | Línea/Espacio/Ondas |
| Pricing | Tablas de precios |
| FAQ | Accordion |
| Countdown | Fecha objetivo |
| Stats | Números animados |
| Timeline | 3 layouts, editor de hitos con drag & drop |

---

## Pendientes

| Prioridad | Feature |
|-----------|---------|
| Alta | AI Chat Conversacional para crear sitio |
| Alta | AI Image Generator (DALL-E/Stable Diffusion) |
| Media | Ecommerce básico (productos, carrito) |
| Baja | Más templates (de 21 a 50+ industrias) |

---

*Actualizado: 3 Febrero 2026 - Migración BaseBlockEditor completada (16/16 editores)*
