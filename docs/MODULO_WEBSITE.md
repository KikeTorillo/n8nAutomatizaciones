# Modulo Website - Nexo ERP

## Resumen Ejecutivo

El modulo Website permite a las organizaciones crear y gestionar sitios web profesionales integrados nativamente con el ERP de Nexo. La ventaja competitiva principal es la integracion directa con CRM, citas, servicios y facturacion.

---

## Estado Actual (Enero 2026) - Fase 1.5 Completada

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  WebsiteEditorPage (Editor principal)                           │
│  ├── DndEditorProvider (contexto drag & drop @dnd-kit)          │
│  ├── BlockPalette (16 tipos de bloques, draggables)             │
│  ├── EditorCanvas (renderizado visual, drop zones)              │
│  ├── PropertiesPanel (edicion de propiedades del bloque)        │
│  ├── PageManager (gestion de paginas)                           │
│  ├── ThemeEditor (colores y fuentes)                            │
│  ├── MobileEditorFAB (acceso rapido en movil)                   │
│  ├── AIWizard (generador de sitios con IA)                      │
│  ├── TemplateGallery (galeria de templates)                     │
│  ├── SlashMenu (insercion rapida con /)                         │
│  ├── PreviewModal (preview con token temporal)                  │
│  ├── VersionHistory (historial y rollback)                      │
│  ├── AnalyticsDashboard (metricas)                              │
│  └── SEOPanel (auditoria y optimizacion)                        │
│                                                                   │
│  Hooks del Editor:                                               │
│  ├── useEditorLayout (responsive: mobile/tablet/desktop)        │
│  ├── useAutosave (debounce 3s)                                  │
│  ├── useEditorShortcuts (Ctrl+Z, Ctrl+D, etc.)                  │
│  └── useEstadoGuardado (indicador visual)                       │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/website/*     (rutas privadas, auth requerido)         │
│  /api/v1/public/sitio/* (rutas publicas, sin auth)              │
│  /api/v1/public/preview/:token (preview sin auth)               │
├─────────────────────────────────────────────────────────────────┤
│                        BASE DE DATOS                             │
├─────────────────────────────────────────────────────────────────┤
│  website_config        Configuracion del sitio + preview_token  │
│  website_paginas       Paginas del sitio                        │
│  website_bloques       Bloques de contenido (JSONB)             │
│  website_versiones     Snapshots para rollback                  │
│  website_contactos     Leads del formulario                     │
│  website_analytics     Eventos de tracking                      │
│  website_chat_*        Chat en tiempo real (preparado)          │
│  website_traducciones  Multi-idioma (preparado)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tipos de Bloques Disponibles (16)

| Tipo | Descripcion | Estado |
|------|-------------|--------|
| `hero` | Banner principal con titulo y CTA | Completo |
| `servicios` | Tarjetas de servicios (manual o CRM) | Completo |
| `testimonios` | Opiniones de clientes (carousel/grid) | Completo |
| `equipo` | Miembros del equipo con redes | Completo |
| `cta` | Llamada a la accion | Completo |
| `contacto` | Formulario simple o multi-step | Completo |
| `footer` | Pie de pagina con columnas | Completo |
| `texto` | Contenido enriquecido (WYSIWYG) | Completo |
| `galeria` | Galeria de imagenes | Completo |
| `video` | YouTube/Vimeo embebido | Completo |
| `separador` | Linea divisoria o espaciador | Completo |
| `pricing` | Tablas de precios comparativas | Completo |
| `faq` | Preguntas frecuentes (accordion) | Completo |
| `countdown` | Contador regresivo para eventos | Completo |
| `stats` | Numeros y estadisticas animadas | Completo |
| `timeline` | Linea de tiempo de hitos | Completo |

### Funcionalidades Implementadas

#### Editor Visual (Canvas)
- **Clic para agregar bloques** - Completo
- **Drag & drop desde paleta** - Completo (con drop zones entre bloques)
- **Drag & drop para reordenar bloques** - Completo
- Edicion inline de textos
- Preview en tiempo real con breakpoints (desktop/tablet/mobile)
- **Layout responsive** - Sidebar en desktop, Drawers en movil/tablet
- **MobileEditorFAB** - Acceso rapido a Bloques/Paginas/Tema en movil
- Undo/Redo (Ctrl+Z / Ctrl+Y)
- Duplicar bloques (Ctrl+D)
- Ocultar/mostrar bloques
- SlashMenu (presionar "/" para insertar bloque rapido)
- Autosave con debounce de 3 segundos

#### AI Site Generator (Completado)
- **Generar sitio web completo desde un prompt**
  - Wizard de 4 pasos: descripcion → industria → estilo → preview
  - Detecta industria automaticamente desde la descripcion
  - Genera 5 paginas con bloques optimizados
  - Preview del sitio antes de aplicar
- 6 industrias soportadas: salon, restaurante, consultorio, gym, tienda, agencia
- 3 estilos: moderno, minimalista, oscuro
- Genera contenido personalizado por industria
- Usa templates locales para velocidad (IA opcional para campos individuales)

#### Sistema de Preview/Staging (Completado)
- **URLs temporales para preview antes de publicar**
  - Generar token de preview con duracion configurable (1-24 horas)
  - Compartir URL sin necesidad de autenticacion
  - Revocar token manualmente
- Preview responsive (desktop/tablet/mobile)
- Indicador de tiempo restante

#### Versionado y Rollback (Completado)
- **Historial completo de versiones del sitio**
  - Crear versiones manuales (snapshots)
  - Versiones automaticas al publicar y antes de restaurar
  - Restaurar sitio a cualquier version anterior
  - Eliminar versiones antiguas
- Metadata: numero de paginas, bloques, tamano
- Comparar dos versiones (API disponible)
- Preview de version sin restaurar

---

## Ultimas Mejoras (28 Enero 2026)

### Fix: MobileEditorFAB con botones bloqueados
**Problema**: Cuando se creaba un sitio sin paginas, el FAB en movil estaba completamente bloqueado, impidiendo acceder a "Paginas" para crear la primera.

**Solucion**: Logica de disabled por funcionalidad:

| Opcion | Cuando disabled |
|--------|-----------------|
| Bloques | `!paginaActiva` (necesita pagina) |
| Paginas | NUNCA (siempre habilitado) |
| Tema | NUNCA (siempre habilitado) |
| Templates | `!tieneSitio` (necesita sitio) |

**Archivos modificados**:
- `MobileEditorFAB.jsx` - Props `disabledBloques` y `disabledTemplates`
- `WebsiteEditorPage.jsx` - Pasa props especificas al FAB

### Fix Anterior: Drag & Drop desde Paleta (Completado)
El drag desde la paleta al canvas ahora funciona correctamente:
- Drop zones visibles entre bloques
- Calculo de posicion basado en orden real del bloque target
- Insercion en posicion correcta (antes/despues del target)

---

## Analisis UX: Nexo vs Wix

### Comparativa de Flujos de Creacion

| Aspecto | Nexo (Actual) | Wix | Gap |
|---------|---------------|-----|-----|
| **Tiempo para crear sitio** | 2-5 min (IA) | 3-10 min | OK |
| **Curva de aprendizaje** | Media | Baja | Mejorar |
| **Onboarding guiado** | No | Si (tour interactivo) | Agregar |
| **Drag & drop fluido** | Completo | Excelente | OK |
| **Preview instantaneo** | Si | Si | OK |
| **Indicadores visuales drop** | Si (linea entre bloques) | Si (linea azul) | OK |
| **Feedback visual al arrastrar** | Basico | Animaciones suaves | Mejorar |
| **Deshacer/Rehacer** | Si (Ctrl+Z/Y) | Si + historial visual | OK |
| **Guardado automatico** | Si (3s debounce) | Si | OK |
| **Responsive preview** | 3 vistas | 3 vistas + custom | OK |
| **Editor movil** | FAB + Drawers | Limitado | OK |

### Flujo de Usuario en Wix (Referencia)

```
1. Seleccionar tipo de sitio (10+ categorias)
2. Responder 3-5 preguntas sobre el negocio
3. IA genera sitio completo (ADI) o elegir template
4. Editor con sidebar izquierdo (bloques) + canvas central
5. Click en bloque = seleccionar + panel de edicion
6. Drag = arrastrar con preview fantasma + lineas guia
7. Drop = animacion de insercion suave
8. Publicar = URL gratuita .wixsite.com o dominio custom
```

### Flujo de Usuario en Nexo (Actual)

```
1. Click "Crear con IA" o "Elegir template" o "Empezar de cero"
2. Wizard IA: nombre → descripcion → industria → estilo → preview
3. Sitio generado con 5 paginas y ~20 bloques
4. Editor con sidebar (bloques) + canvas central
5. Click en bloque de paleta = agregar al final
6. Drag desde paleta = insertar en posicion especifica (drop zones visibles)
7. Click en bloque del canvas = seleccionar + panel derecho de propiedades
8. En movil: FAB para acceder a Bloques/Paginas/Tema via Drawers
9. Publicar = cambiar estado (falta subdominio)
```

### Problemas de UX Identificados

#### Criticos (Afectan usabilidad core)
1. ~~**Drag & drop desde paleta no funciona**~~ - RESUELTO
2. ~~**Sin indicadores visuales de drop zone**~~ - RESUELTO (linea entre bloques)
3. **Sin onboarding/tutorial** - Curva de aprendizaje innecesaria

#### Importantes (Afectan experiencia)
4. **Sin preview fantasma al arrastrar** - Falta feedback visual
5. **Panel de edicion aparece a la derecha** - Inconsistente con Wix (popup sobre bloque)
6. **Sin zoom con scroll** - Solo botones +/-
7. **Sin reglas/guias de alineacion** - Dificil alinear elementos

#### Menores (Nice to have)
8. **Sin historial visual de cambios** - Solo Ctrl+Z
9. **Sin busqueda de bloques** - 16 bloques es manejable
10. **Sin favoritos/recientes** - Menor prioridad

### Plan de Mejoras UX (Priorizado)

#### Sprint 1: Fix Core - COMPLETADO
- [x] **Fix drag & drop desde paleta**
- [x] Agregar linea indicadora de drop zone entre bloques
- [x] **Fix MobileEditorFAB** - Botones no bloqueados sin pagina
- [ ] Preview fantasma del bloque al arrastrar

#### Sprint 2: Feedback Visual
- [ ] Animacion suave al insertar bloque
- [ ] Highlight de bloque al hover en paleta
- [ ] Toast de confirmacion mas visible

#### Sprint 3: Onboarding
- [ ] Tour interactivo para usuarios nuevos (3-5 pasos)
- [ ] Tooltips en iconos de la barra de herramientas
- [ ] Video tutorial embebido (opcional)

#### Sprint 4: Pulido
- [ ] Zoom con Ctrl+scroll
- [ ] Guias de alineacion al mover bloques
- [ ] Historial visual de cambios (timeline)

---

## Comparativa Detallada con Competidores

| Feature | Nexo | Wix | Squarespace | Odoo |
|---------|------|-----|-------------|------|
| **EDITOR** |
| Drag & drop visual | Parcial | Excelente | Excelente | Bueno |
| Edicion inline | Si | Si | Si | Si |
| Preview responsive | 3 vistas | 3 + custom | 3 vistas | 2 vistas |
| Undo/Redo | Si | Si + historial | Si | Basico |
| Zoom | Botones | Scroll + botones | Botones | No |
| **CONTENIDO** |
| Tipos de bloques | 16 | 50+ | 30+ | 20+ |
| Templates | 6 industrias | 800+ | 100+ | 50+ |
| IA generativa | Si | Si (ADI) | Si | No |
| Stock images | No | Si (Unsplash) | Si | Parcial |
| **PUBLICACION** |
| Subdominio gratis | Pendiente | Si (.wixsite) | Si (.sqsp) | Si |
| Dominio custom | Pendiente | Si | Si | Si |
| SSL automatico | Pendiente | Si | Si | Si |
| **INTEGRACIONES** |
| CRM nativo | **Si** | No | No | Si |
| Citas nativo | **Si** | No | No | Parcial |
| Facturacion | **Si** | No | No | Si |
| Analytics | Si | Si | Si | Si |
| **PRECIO** |
| Costo | Incluido | $16-45/mes | $16-49/mes | $24+/mes |

### Ventaja Competitiva de Nexo

**Integracion nativa con ERP** que Wix/Squarespace NO ofrecen:

1. **Widget de Citas Real** - Calendario de disponibilidad del CRM (no solo formulario)
2. **Servicios Sincronizados** - Precios y descripciones del catalogo real
3. **Leads a CRM** - Contactos se crean automaticamente como clientes
4. **Facturacion Directa** - Pagos generan facturas en el sistema
5. **Costo $0 adicional** - Incluido en suscripcion Nexo

---

## Endpoints API

### Rutas Privadas (requieren autenticacion)

```
# Configuracion
POST   /api/v1/website/config
GET    /api/v1/website/config
PUT    /api/v1/website/config/:id
POST   /api/v1/website/config/:id/publicar
DELETE /api/v1/website/config/:id

# Paginas
POST   /api/v1/website/paginas
GET    /api/v1/website/paginas
GET    /api/v1/website/paginas/:id
PUT    /api/v1/website/paginas/:id
PUT    /api/v1/website/paginas/orden
DELETE /api/v1/website/paginas/:id

# Bloques
POST   /api/v1/website/bloques
GET    /api/v1/website/bloques/tipos
GET    /api/v1/website/bloques/tipos/:tipo/default
GET    /api/v1/website/paginas/:paginaId/bloques
GET    /api/v1/website/bloques/:id
PUT    /api/v1/website/bloques/:id
PUT    /api/v1/website/paginas/:paginaId/bloques/orden
POST   /api/v1/website/bloques/:id/duplicar
DELETE /api/v1/website/bloques/:id

# Templates
GET    /api/v1/website/templates
GET    /api/v1/website/templates/industrias
GET    /api/v1/website/templates/:id
GET    /api/v1/website/templates/:id/estructura
POST   /api/v1/website/templates/:id/aplicar
POST   /api/v1/website/templates
DELETE /api/v1/website/templates/:id

# IA
GET    /api/v1/website/ai/status
POST   /api/v1/website/ai/generar
POST   /api/v1/website/ai/generar-bloque
POST   /api/v1/website/ai/generar-sitio
POST   /api/v1/website/ai/detectar-industria

# Preview/Staging
POST   /api/v1/website/config/:id/preview
GET    /api/v1/website/config/:id/preview
DELETE /api/v1/website/config/:id/preview

# Versiones
GET    /api/v1/website/versiones
GET    /api/v1/website/versiones/:id
GET    /api/v1/website/versiones/:id/preview
POST   /api/v1/website/versiones
POST   /api/v1/website/versiones/:id/restaurar
DELETE /api/v1/website/versiones/:id

# Analytics
GET    /api/v1/website/analytics
GET    /api/v1/website/analytics/resumen
GET    /api/v1/website/analytics/paginas
GET    /api/v1/website/analytics/tiempo-real

# SEO
GET    /api/v1/website/seo/auditoria
GET    /api/v1/website/seo/preview-google
GET    /api/v1/website/seo/schema
```

### Rutas Publicas (sin autenticacion)

```
GET    /api/v1/public/sitio/:slug
GET    /api/v1/public/sitio/:slug/servicios
GET    /api/v1/public/sitio/:slug/:pagina
POST   /api/v1/public/sitio/:slug/contacto
POST   /api/v1/public/sitio/:slug/track
GET    /api/v1/public/sitio/:slug/sitemap.xml
GET    /api/v1/public/sitio/:slug/robots.txt
GET    /api/v1/public/preview/:token
```

---

## Archivos Clave del Modulo

### Backend
```
backend/app/modules/website/
├── models/
│   ├── bloques.model.js
│   ├── config.model.js
│   ├── paginas.model.js
│   ├── contactos.model.js
│   ├── analytics.model.js
│   └── versiones.model.js
├── controllers/
│   ├── bloques.controller.js
│   ├── config.controller.js
│   ├── public.controller.js
│   ├── analytics.controller.js
│   ├── seo.controller.js
│   ├── ai.controller.js
│   └── versiones.controller.js
├── services/
│   ├── ai.service.js
│   ├── site-generator.service.js
│   ├── preview.service.js
│   └── seo.service.js
├── schemas/
│   └── website.schemas.js
└── routes/
    ├── website.routes.js
    └── public.routes.js
```

### Frontend
```
frontend/src/pages/website/
├── components/
│   ├── canvas-blocks/        # 16 componentes visuales
│   ├── blocks/               # 16 editores de propiedades
│   ├── AIWizard/
│   │   └── AIWizardModal.jsx
│   ├── DndEditorProvider.jsx # Contexto DnD (@dnd-kit)
│   ├── BlockPalette.jsx      # Paleta de bloques (draggable)
│   ├── EditorCanvas.jsx      # Canvas principal con drop zones
│   ├── PropertiesPanel.jsx   # Panel derecho de propiedades
│   ├── PageManager.jsx       # Gestion de paginas
│   ├── ThemeEditor.jsx       # Editor de tema (colores/fuentes)
│   ├── MobileEditorFAB.jsx   # FAB para acceso rapido en movil
│   ├── SlashMenu.jsx         # Menu "/" para insercion rapida
│   ├── TemplateGallery.jsx   # Galeria de templates
│   ├── BlockEditor.jsx       # Editor legacy de bloques
│   ├── PreviewModal.jsx
│   ├── VersionHistory.jsx
│   ├── AnalyticsDashboard.jsx
│   └── SEOPanel.jsx
├── hooks/
│   ├── index.js              # Exports
│   ├── useEditorLayout.js    # Layout responsive (mobile/tablet/desktop)
│   ├── useAutosave.js        # Guardado automatico con debounce
│   ├── useEditorShortcuts.js # Atajos de teclado
│   └── useEstadoGuardado.js  # Indicador de estado de guardado
├── WebsiteBuilder.jsx
└── WebsiteEditorPage.jsx     # Pagina principal del editor
```

---

## Metricas de Exito

| Metrica | Objetivo Q1 2026 |
|---------|------------------|
| Sitios creados | 500+ |
| Bloques promedio por sitio | 8+ |
| Uso de IA para creacion | 60% |
| Score SEO promedio | 75+ |
| Leads capturados | 5,000+ |
| Tiempo promedio creacion sitio | < 5 min |
| NPS del editor | 7+ |

---

## Roadmap

### Fase 1.5 - Fix UX - COMPLETADA
- [x] **Fix drag & drop desde paleta**
- [x] Indicadores visuales de drop zone
- [x] Layout responsive (mobile/tablet/desktop)
- [x] MobileEditorFAB con logica correcta de disabled
- [ ] Preview fantasma al arrastrar (pendiente)

### Fase 2 - Diferenciadores
- [ ] Widget de Citas integrado
- [ ] Subdominio nexo.site
- [ ] Integraciones (GA4, WhatsApp)

### Fase 3 - Avanzado
- [ ] eCommerce basico
- [ ] Live chat
- [ ] Multi-idioma

---

*Documento actualizado: 28 Enero 2026*
