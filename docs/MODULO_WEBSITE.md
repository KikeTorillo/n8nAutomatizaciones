# Módulo Website - Nexo ERP

Constructor de sitios web integrado con ERP. Ventaja competitiva: CRM, citas, servicios y facturación nativos.

---

## Estado Actual

### Funcionalidades Completas ✅

| Funcionalidad | Detalle |
|---------------|---------|
| Editor Visual | 16 bloques, drag & drop (@dnd-kit), inline editing |
| AI Site Generator | 21 industrias, OpenRouter (qwen3-235b), circuit breaker |
| Acciones de Bloque | Duplicar, eliminar, toggle visibilidad (persistencia servidor) |
| Autosave | 3s debounce, mutex, reintentos, bloqueo optimista (409) |
| Responsive Preview | Desktop/Tablet/Mobile con zoom |
| SEO | Score tiempo real, 7 reglas |
| Undo/Redo | Ctrl+Z/Y con Zustand temporal |
| Unsplash + AI Writer | Imágenes y contenido generado |

### Arquitectura

```
FRONTEND                              BACKEND (53 endpoints)
├── WebsiteEditorPage                 ├── /config/* (9)
├── EditorCanvas + CanvasBlock        ├── /paginas/* (6)
├── PropertiesPanel (4 tabs)          ├── /bloques/* (10)
├── BlockPalette                      ├── /ai/* (6) - OpenRouter
└── ConflictAlert (409)               └── /public/* (8) - Sin auth

HOOKS: useBlockEditor, useArrayItems, useAutosave, useEstadoGuardado
STORE: websiteEditorStore.js + temporal middleware
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

## Pendientes

| Prioridad | Feature | Descripción |
|-----------|---------|-------------|
| Media | Prorrateo planes | Calcular diferencia al cambiar plan mid-cycle |
| Media | Undo/Redo global | Conectar editores individuales al temporal middleware |
| Baja | 2FA/MFA | Autenticación de dos factores |

---

*Actualizado: 30 Enero 2026*
