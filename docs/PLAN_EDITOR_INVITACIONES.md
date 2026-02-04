# Plan: Editor de Invitaciones Digitales

## ✅ IMPLEMENTACIÓN COMPLETADA - 3 Febrero 2026

### Resumen de Implementación

Reutilizando el editor de bloques del módulo Website, se creó un editor visual de invitaciones en eventos-digitales.

**Decisión arquitectónica**: Opción A - Framework Compartido
**Esfuerzo real**: ~40 horas
**Reutilización**: ~75% del código del editor website

### Archivos Creados

#### Editor de Invitaciones (39 archivos)
- `frontend/src/pages/eventos-digitales/editor/` - Página principal y containers
- `frontend/src/pages/eventos-digitales/editor/components/blocks/` - 12 editores de bloques
- `frontend/src/pages/eventos-digitales/editor/components/canvas-blocks/` - 12 canvas blocks
- `frontend/src/pages/eventos-digitales/editor/config/` - Configuración de bloques
- `frontend/src/pages/eventos-digitales/editor/context/` - Context del editor

#### Bloques Públicos (14 archivos)
- `frontend/src/components/eventos-digitales/publico/bloques/` - Componentes de renderizado público
- `frontend/src/components/eventos-digitales/publico/InvitacionDinamica.jsx` - Renderizador dinámico

#### Backend
- `backend/app/modules/eventos-digitales/models/bloquesInvitacion.model.js`
- `backend/app/modules/eventos-digitales/controllers/bloques.controller.js`
- `backend/app/modules/eventos-digitales/routes/bloques.routes.js`
- `sql/eventos-digitales/06-bloques-invitacion.sql`

#### Framework Compartido (31 archivos)
- `frontend/src/components/editor-framework/` - Hooks, DnD, Fields, Layout

### Rutas Nuevas

- `/eventos-digitales/:id/editor` - Editor visual de invitaciones

### Pendiente (Opcional)

- Tarea #10: Migrar imports de website para usar editor-framework (reduce duplicación)

---

## Estado Original

### Lo que existe en eventos-digitales
- Formulario tradicional (nombre, tipo, fechas, descripción)
- Plantillas prediseñadas (solo temas de colores/fuentes)
- Componentes públicos estáticos (`EventoRSVP`, `EventoRegalos`, etc.)
- Orden de secciones hardcodeado en `EventoPublicoPage.jsx`

### Gaps identificados
1. No hay editor visual - Solo formularios
2. No hay persistencia de layout personalizado
3. No hay concepto de bloques editables
4. No hay drag & drop para reordenar secciones

---

## Análisis de Acoplamiento del Editor Website

### Componentes 100% Reutilizables

| Componente | Ubicación | Razón |
|------------|-----------|-------|
| `PropertiesPanel/fields/*` | 11 componentes de campos | Totalmente agnósticos |
| `BaseBlockEditor.jsx` | Wrapper base editores | Sin dependencias website |
| `DndEditorProvider.jsx` | Proveedor drag-drop | Usa @dnd-kit puro |
| `useBlockEditor.js` | Hook de estado | Genérico |
| `useArrayItems.js` | Hook para listas | Genérico |
| `AIWriterPopover` | Generación IA | Solo necesita `tipo` |
| `UnsplashModal` | Selector imágenes | Totalmente genérico |
| `compareUtils.js` | Comparación optimizada | Utilitario puro |

### Componentes que Requieren Modificación Menor

| Componente | Cambio Necesario |
|------------|------------------|
| `BlockEditor.jsx` | Inyectar `BLOQUES_CONFIG` y `EDITORES_BLOQUE` como props |
| `PropertiesPanel/constants.js` | Extraer `BLOCK_CONFIGS` a archivo por módulo |
| `websiteEditorStore.js` | Crear versión genérica `editorStore.js` |

### Componentes que Requieren Nueva Versión

| Componente | Razón | Solución |
|------------|-------|----------|
| `EditorCanvas.jsx` | Renderiza bloques específicos | Crear `InvitacionCanvas.jsx` |
| Canvas blocks (16) | Visualización website | Crear canvas blocks invitación |
| `useWebsiteEditor.js` | API específica | Crear `useInvitacionEditor.js` |

---

## Bloques Reutilizables

### Listos para usar (0 modificaciones)

| Bloque | Uso en Invitación |
|--------|-------------------|
| **HERO** | Portada con nombres de novios/quinceañera |
| **COUNTDOWN** | Cuenta regresiva al evento |
| **TIMELINE** | Itinerario del día |
| **GALERIA** | Fotos del evento/pareja |
| **TEXTO** | Información adicional, dress code |
| **VIDEO** | Video de invitación |
| **CTA** | Botones "Confirmar", "Ver ubicación" |
| **FAQ** | Preguntas frecuentes del evento |

### Requieren adaptación

| Bloque Existente | Adaptación |
|------------------|------------|
| **CONTACTO** | Convertir a **RSVP Block** con campos especializados |

### Bloques nuevos necesarios

| Bloque Nuevo | Descripción |
|--------------|-------------|
| **UBICACION** | Mapa embed + dirección + link Google Maps |
| **MESA_REGALOS** | Lista de tiendas/links de registry |
| **PROTAGONISTAS** | Nombres destacados (novios, quinceañera) |

### No relevantes para invitaciones
- SERVICIOS, TESTIMONIOS, PRICING, EQUIPO (orientados a negocios)

---

## Arquitectura Propuesta

```
frontend/src/
├── components/editor-framework/     # NUEVO - Compartido
│   ├── layout/
│   │   ├── EditorLayout.jsx
│   │   └── PropertiesPanel/        # Mover de website
│   ├── blocks/
│   │   ├── BlockListEditor.jsx     # Refactorizar BlockEditor
│   │   └── BaseBlockEditor.jsx     # Mover de website
│   ├── dnd/
│   │   ├── DndEditorProvider.jsx
│   │   └── DragPreview.jsx
│   ├── hooks/
│   │   ├── useEditorState.js
│   │   └── useArrayItems.js
│   └── contexts/
│       ├── BlocksContext.jsx
│       └── UIContext.jsx
│
├── pages/website/                   # Existente - Adaptar
│   ├── components/
│   │   ├── blocks/                  # Editores específicos website
│   │   └── canvas-blocks/           # Canvas específicos website
│   └── config/
│       └── websiteBlocks.js         # Configuración bloques website
│
└── pages/eventos-digitales/         # NUEVO
    └── editor/
        ├── InvitacionEditorPage.jsx
        ├── components/
        │   ├── blocks/              # Editores específicos invitación
        │   └── canvas-blocks/       # Canvas específicos invitación
        └── config/
            └── invitacionBlocks.js  # Configuración bloques invitación
```

---

## Plan de Implementación

### Fase 1: Crear Framework Compartido (12-16h)

1. Crear carpeta `components/editor-framework/`
2. Mover/refactorizar componentes genéricos:
   - `PropertiesPanel/` completo
   - `BaseBlockEditor.jsx`
   - `DndEditorProvider.jsx`
   - Hooks genéricos
3. Crear store genérico `editorStore.js`
4. Actualizar imports en website para usar framework

### Fase 2: Backend Eventos-Digitales (8-10h)

**NOTA IMPORTANTE SOBRE SQL**: No se requieren migraciones ni ALTER TABLE. El proyecto se levanta desde cero, por lo que los cambios van directamente en los archivos SQL de definición. Si se crea un archivo SQL nuevo, agregarlo a `init-data.sh`.

1. Crear archivo SQL nuevo para bloques de invitación
   - Archivo: `sql/eventos-digitales/04-bloques-invitacion.sql`
   - **Agregar a `init-data.sh`**

```sql
-- sql/eventos-digitales/04-bloques-invitacion.sql

-- Tabla para bloques de invitación (opcional, también puede ser JSONB en eventos_digitales)
CREATE TABLE IF NOT EXISTS bloques_invitacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id INTEGER NOT NULL REFERENCES eventos_digitales(id) ON DELETE CASCADE,
    organizacion_id UUID NOT NULL REFERENCES organizaciones(id),
    tipo VARCHAR(50) NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    contenido JSONB DEFAULT '{}',
    estilos JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bloques_invitacion_evento ON bloques_invitacion(evento_id);
CREATE INDEX IF NOT EXISTS idx_bloques_invitacion_org ON bloques_invitacion(organizacion_id);

-- RLS
ALTER TABLE bloques_invitacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY bloques_invitacion_org_policy ON bloques_invitacion
    USING (organizacion_id = current_setting('app.current_org_id')::uuid);
```

**Alternativa más simple**: Agregar columna JSONB a tabla existente en `sql/eventos-digitales/01-tablas.sql`:

```sql
-- En la definición de eventos_digitales, agregar:
bloques_invitacion JSONB DEFAULT '[]',
```

2. Crear endpoints:
   - `GET /eventos-digitales/:id/bloques` - Obtener bloques
   - `PUT /eventos-digitales/:id/bloques` - Guardar bloques

3. Crear model y controller

### Fase 3: Bloques de Invitación (16-20h)

1. **Editores** (`pages/eventos-digitales/editor/blocks/`):
   - `HeroInvitacionEditor.jsx` (adaptar de HeroEditor)
   - `RSVPEditor.jsx` (nuevo, basado en ContactoEditor)
   - `UbicacionEditor.jsx` (nuevo)
   - `TimelineEventoEditor.jsx` (adaptar de TimelineEditor)
   - Reutilizar: Galeria, Video, Texto, Countdown, FAQ, CTA

2. **Canvas Blocks** (`pages/eventos-digitales/editor/canvas-blocks/`):
   - Versiones visuales para preview

3. **Configuración** (`config/invitacionBlocks.js`):
```javascript
export const BLOQUES_INVITACION = [
  { tipo: 'hero_invitacion', label: 'Portada', icon: Layout },
  { tipo: 'countdown', label: 'Cuenta Regresiva', icon: Clock },
  { tipo: 'rsvp', label: 'Confirmación', icon: CheckCircle },
  { tipo: 'ubicacion', label: 'Ubicación', icon: MapPin },
  { tipo: 'timeline', label: 'Itinerario', icon: GitBranch },
  { tipo: 'galeria', label: 'Galería', icon: Image },
  { tipo: 'texto', label: 'Texto', icon: Type },
  { tipo: 'video', label: 'Video', icon: Video },
  { tipo: 'faq', label: 'Preguntas', icon: HelpCircle },
  { tipo: 'cta', label: 'Botón', icon: MousePointerClick },
];
```

### Fase 4: Página del Editor (8-10h)

1. Crear `InvitacionEditorPage.jsx`
2. Agregar ruta en routes
3. Crear hooks: `useInvitacionBloques.js`, `useInvitacionEditor.js`

### Fase 5: Integración y Testing (6-8h)

1. Integrar con `EventoFormPage.jsx` (tab o botón "Diseñar Invitación")
2. Actualizar `EventoPublicoPage.jsx` para renderizar bloques dinámicos
3. Tests del flujo completo

---

## Estructura de Datos

### Bloques de Invitación (JSONB)

```json
{
  "bloques": [
    {
      "id": "uuid",
      "tipo": "hero_invitacion",
      "orden": 0,
      "visible": true,
      "contenido": {
        "titulo": "María & Juan",
        "subtitulo": "Nos casamos",
        "imagen_url": "...",
        "fecha_texto": "15 de Junio, 2026"
      },
      "estilos": {
        "alineacion": "center",
        "overlay": 0.3
      }
    },
    {
      "id": "uuid",
      "tipo": "countdown",
      "orden": 1,
      "visible": true,
      "contenido": {
        "titulo": "Faltan",
        "fecha_objetivo": "2026-06-15T18:00:00"
      }
    },
    {
      "id": "uuid",
      "tipo": "rsvp",
      "orden": 2,
      "visible": true,
      "contenido": {
        "titulo": "Confirma tu asistencia",
        "campos": ["nombre", "email", "num_asistentes", "restricciones"]
      }
    }
  ]
}
```

---

## Archivos a Crear/Modificar

### Backend (NUEVO)
- `backend/app/modules/eventos-digitales/models/bloquesInvitacion.model.js`
- `backend/app/modules/eventos-digitales/controllers/bloques.controller.js`
- `backend/app/modules/eventos-digitales/routes/bloques.routes.js`
- `sql/eventos-digitales/04-bloques-invitacion.sql` → **Agregar a init-data.sh**

### Frontend - Framework (NUEVO)
- `frontend/src/components/editor-framework/` (15+ archivos)
- `frontend/src/store/editorStore.js`

### Frontend - Invitaciones (NUEVO)
- `frontend/src/pages/eventos-digitales/editor/` (20+ archivos)
- `frontend/src/hooks/otros/eventos-digitales/useBloques.js`

### Frontend - Modificar
- `frontend/src/pages/eventos-digitales/EventoFormPage.jsx` (agregar tab/botón)
- `frontend/src/pages/eventos-digitales/EventoPublicoPage.jsx` (renderizar bloques)

---

## Verificación

### Tests Funcionales
- [ ] Crear evento con invitación vacía
- [ ] Agregar bloques (hero, countdown, rsvp)
- [ ] Reordenar bloques con drag & drop
- [ ] Editar contenido de cada bloque
- [ ] Guardar cambios (autosave)
- [ ] Preview de invitación
- [ ] Vista pública renderiza bloques dinámicos
- [ ] RSVP funciona desde invitación pública

### Tests de Regresión
- [ ] Editor de Website sigue funcionando
- [ ] Eventos existentes no se rompen
- [ ] Plantillas existentes siguen aplicando temas

---

## Estimación

| Fase | Horas | Complejidad |
|------|-------|-------------|
| Framework compartido | 12-16h | Media |
| Backend eventos | 8-10h | Baja |
| Bloques invitación | 16-20h | Media-Alta |
| Página editor | 8-10h | Media |
| Testing | 6-8h | Baja |
| **TOTAL** | **50-64h** | |

---

**Generado**: 2026-02-03
