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
├── AIWizard (21 industrias)          ├── website_config
├── SEOTips/ (componentes)            ├── website_paginas
├── AIWriter/ (componentes)           ├── website_bloques
├── DragPreview/ (componentes)        ├── website_versiones
└── UnsplashPicker/ (componentes)     └── website_analytics
```

### Funcionalidades Core

| Feature | Estado |
|---------|--------|
| Editor Drag & Drop | ✅ Completo |
| 16 tipos de bloques | ✅ Completo |
| AI Site Generator | ✅ 21 industrias |
| Onboarding Tour | ✅ 5 pasos con driver.js |
| Preview/Staging | ✅ Tokens temporales |
| Versionado/Rollback | ✅ Completo |
| Layout Responsive | ✅ Desktop/Tablet/Mobile |
| MobileEditorFAB | ✅ Acceso rapido movil |
| Autosave | ✅ Debounce 3s |

---

## Implementado en Sprint UX (29 Enero 2026)

### Completado y Funcionando

1. **Onboarding Tour Interactivo**
   - `frontend/src/pages/website/components/OnboardingTour/`
   - 5 pasos: Paleta → Canvas → Propiedades → Responsive → Publicar
   - Persistencia en localStorage
   - Estilos Nexo (morado primary)

2. **21 Industrias en Wizard IA**
   - 14 nuevas: ecommerce, educacion, inmobiliaria, legal, veterinaria, automotriz, hotel, eventos, fotografia, construccion, coaching, finanzas, marketing, tecnologia
   - Templates de contenido en `backend/app/modules/website/services/ai.service.js`
   - Estructuras de paginas en `site-generator.service.js`

3. **Endpoints de Imagenes (Unsplash)**
   - `GET /api/v1/website/images/search`
   - `POST /api/v1/website/images/download`
   - `GET /api/v1/website/images/random`
   - Servicio: `backend/app/modules/website/services/unsplash.service.js`

4. **AI Content Writer con Tonos**
   - Endpoint: `POST /api/v1/website/ai/generar-texto`
   - 5 tonos: profesional, casual, persuasivo, informativo, emotivo
   - Componentes: `frontend/src/pages/website/components/AIWriter/`

5. **SEO Tips en Tiempo Real**
   - 7 reglas con pesos (score 0-100)
   - Componentes: `frontend/src/pages/website/components/SEOTips/`
   - Hook: `useSEOAnalysis.js`

### Componentes Creados (Pendiente Integracion)

| Componente | Ubicacion | Pendiente |
|------------|-----------|-----------|
| SEOTipsPanel | `components/SEOTips/` | Agregar 4to tab en PropertiesPanel |
| AIWriterPopover | `components/AIWriter/` | Agregar boton ✨ en campos texto |
| UnsplashModal | `components/UnsplashPicker/` | Agregar boton en campos imagen |
| BlockDragPreview | `components/DragPreview/` | Integrar en DragOverlay |

### Correciones de Imports

```javascript
// images.routes.js - Corregido
const { auth } = require('../../../middleware');
router.use(auth.authenticateToken);

// images.controller.js - Corregido
const asyncHandler = require('express-async-handler');
```

---

## Pendientes para Proxima Sesion

### Alta Prioridad

1. **Integrar SEO Tab en PropertiesPanel**
   ```jsx
   // PropertiesPanel.jsx - Agregar tab
   <button>SEO</button>
   // Renderizar SEOTipsPanel cuando tab activo
   ```

2. **Integrar AI Writer en campos de texto**
   ```jsx
   // En campos type: 'text' o 'textarea'
   <AIWriterPopover campo={campo} onGenerar={handleUpdate} />
   ```

3. **Integrar Unsplash en campos de imagen**
   ```jsx
   // En campos type: 'image'
   <UnsplashModal onSelect={(url) => handleUpdate(url)} />
   ```

4. **Configurar API Key Unsplash**
   - Usuario debe crear app en unsplash.com/developers
   - Agregar `UNSPLASH_ACCESS_KEY` en `.env`

### Media Prioridad

5. **Probar Preview Fantasma en Drag**
   - Componente creado en `DragPreview/BlockDragPreview.jsx`
   - Integrar en `DndEditorProvider.jsx` linea ~224

6. **Verificar Animacion de Insercion**
   - Store: `bloqueRecienAgregado` en `websiteEditorStore.js`
   - CanvasBlock deberia detectar y animar

### Baja Prioridad

7. **Agregar mas reglas SEO**
8. **Mejorar templates de industrias**

---

## Endpoints Nuevos (29 Enero 2026)

```
# Imagenes (Unsplash)
GET  /api/v1/website/images/search?q=...&page=1
POST /api/v1/website/images/download
GET  /api/v1/website/images/random

# AI con Tonos
POST /api/v1/website/ai/generar-texto
     { campo, industria, tono, contexto, longitud }
```

---

## Archivos Modificados/Creados

### Nuevos
```
frontend/src/pages/website/components/
├── OnboardingTour/
│   ├── EditorTour.jsx
│   ├── useTourSteps.js
│   ├── useTourState.js
│   └── index.js
├── DragPreview/
│   ├── BlockDragPreview.jsx
│   ├── PreviewRenderer.jsx
│   └── index.js
├── UnsplashPicker/
│   ├── UnsplashModal.jsx
│   ├── UnsplashGrid.jsx
│   ├── useUnsplashSearch.js
│   └── index.js
├── AIWriter/
│   ├── AIWriterPopover.jsx
│   ├── ToneSelector.jsx
│   ├── useAIWriter.js
│   └── index.js
└── SEOTips/
    ├── SEOTipsPanel.jsx
    ├── SEOScore.jsx
    ├── SEORule.jsx
    ├── useSEOAnalysis.js
    ├── seoRules.js
    └── index.js

backend/app/modules/website/
├── services/unsplash.service.js
├── controllers/images.controller.js
└── routes/images.routes.js
```

### Modificados
```
frontend/
├── WebsiteEditorPage.jsx (tour, data-tour attrs)
└── store/websiteEditorStore.js (bloqueRecienAgregado)

backend/
├── services/ai.service.js (generarConTono, 14 industrias)
├── services/site-generator.service.js (14 industrias)
├── controllers/ai.controller.js (generarTextoConTono)
└── routes/website.routes.js (imagenes, generar-texto)
```

---

## Dependencias

```bash
# Instalada
npm install driver.js  # Tour interactivo

# Variables de entorno
UNSPLASH_ACCESS_KEY=<pendiente>  # Usuario debe configurar
```

---

*Actualizado: 29 Enero 2026*
