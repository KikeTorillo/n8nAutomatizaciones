# Módulo Website - Nexo ERP

Constructor de sitios web integrado con ERP. Ventaja competitiva: CRM, citas, servicios y facturación nativos.

---

## Estado Actual

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
├── WebsiteEditorPage.jsx
├── context/
│   ├── EditorContext.jsx        # Wrapper + useEditor()
│   ├── SiteContext.jsx          # Config, páginas, mutations
│   ├── LayoutContext.jsx        # Responsive, drawers, panels
│   ├── BlocksContext.jsx        # Bloques, CRUD, DnD handlers
│   └── UIContext.jsx            # Modo editor, slash menu, autosave
├── containers/
│   ├── EditorHeader.jsx
│   ├── SidebarContainer.jsx
│   ├── CanvasContainer.jsx
│   ├── PropertiesContainer.jsx
│   ├── DrawersContainer.jsx
│   └── EditorModals.jsx
├── hooks/
│   ├── useERPData.js            # Query servicios/profesionales
│   ├── useSlashMenu.js
│   ├── useAutosave.js
│   ├── useEditorLayout.js
│   ├── useEditorShortcuts.js
│   ├── useBlockEditor.js
│   └── useArrayItems.js
├── components/
│   ├── blocks/
│   │   ├── BaseBlockEditor.jsx  # Estructura común (React.memo)
│   │   ├── fields/              # Campos reutilizables
│   │   │   ├── SectionTitleField.jsx
│   │   │   ├── ArrayItemsEditor.jsx
│   │   │   ├── ColorPickerField.jsx
│   │   │   └── IconPickerField.jsx
│   │   └── [16 editores]        # Todos con React.memo
│   ├── canvas-blocks/
│   ├── AIWriter/
│   └── UnsplashPicker/
└── store/
    └── websiteEditorStore.js    # Zustand + temporal + cleanup
```

### Contextos

```javascript
<SiteProvider>      // config, paginas, mutations
  <LayoutProvider>  // isMobile, showSidebar, drawers
    <BlocksProvider>// bloques, CRUD, DnD
      <UIProvider>  // modoEditor, slashMenu, autosave
      </UIProvider>
    </BlocksProvider>
  </LayoutProvider>
</SiteProvider>

// useEditor() combina todo | Hooks específicos: useSite(), useBlocks(), etc.
```

---

## Arquitectura Backend

```
backend/app/modules/website/
├── constants/
│   └── block-types.js           # BLOCK_TYPES, isValidBlockType()
├── controllers/
│   ├── ai.controller.js
│   ├── config.controller.js
│   ├── paginas.controller.js
│   ├── bloques.controller.js
│   └── public.controller.js
├── services/
│   ├── ai.service.js
│   ├── bloque.service.js        # ErrorHelper para errores
│   ├── erp-data.service.js
│   ├── site-generator.service.js
│   └── websiteCache.service.js
├── models/
│   ├── config.model.js
│   ├── paginas.model.js
│   └── bloques.model.js
├── schemas/
│   └── website.schemas.js       # Validación teléfono con regex
└── data/
    └── block-defaults.json
```

---

## Endpoints Públicos

```
GET  /api/v1/public/sitio/:slug              # Sitio completo
GET  /api/v1/public/sitio/:slug/:pagina      # Página específica
POST /api/v1/public/sitio/:slug/contacto     # Formulario contacto
GET  /api/v1/public/sitio/:slug/servicios    # Servicios ERP
GET  /api/v1/public/sitio/:slug/profesionales # Equipo ERP
GET  /api/v1/public/preview/:token           # Preview temporal
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
| Timeline | 3 layouts, hitos con drag & drop |

---

## Pendientes

| Prioridad | Feature |
|-----------|---------|
| Alta | AI Chat Conversacional para crear sitio |
| Alta | AI Image Generator (DALL-E/Stable Diffusion) |
| Media | Ecommerce básico (productos, carrito) |
| Baja | Más templates (de 21 a 50+ industrias) |

---

*Actualizado: 3 Febrero 2026*
