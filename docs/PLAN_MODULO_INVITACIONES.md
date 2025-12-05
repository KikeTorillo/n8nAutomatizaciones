# Módulo de Eventos Digitales (Invitaciones)

**Actualizado**: 5 Diciembre 2025
**Estado**: En desarrollo - Fase 2

---

## Estado Actual

### Implementado

| Área | Funcionalidad | Estado |
|------|---------------|--------|
| **Backend** | CRUD eventos, invitados, ubicaciones, mesa de regalos, felicitaciones | OK |
| **Backend** | CRUD plantillas (super_admin) | OK |
| **Backend** | Rutas públicas (RSVP, slug) | OK |
| **Backend** | Importar/Exportar CSV invitados | OK |
| **Frontend Admin** | Lista eventos, detalle, formulario crear/editar | OK |
| **Frontend Admin** | Gestión invitados con estadísticas RSVP | OK |
| **Frontend Admin** | Tabs: Ubicaciones, Mesa de Regalos, Felicitaciones | OK |
| **Frontend Admin** | Upload imágenes (portada + galería) | OK |
| **Frontend Admin** | Panel super_admin para plantillas | OK |
| **Frontend Público** | Página invitación con contador, galería, ubicaciones | OK |
| **Frontend Público** | Formulario RSVP funcional | OK |
| **SQL** | 6 tablas con RLS, índices, triggers | OK |

### Pendiente

| Área | Funcionalidad |
|------|---------------|
| **Plantillas** | Sistema de temas visuales funcionales |
| **QR** | Generación de código QR por invitado |
| **Recordatorios** | Emails automáticos a pendientes |
| **Calendario** | Botón "Agregar a calendario" |

---

## Siguiente Paso: Sistema de Plantillas Funcionales

### Problema Actual

Las plantillas existen en la BD pero son solo metadatos (nombre, código, tipo). Al seleccionar una plantilla, **no cambia el diseño visual** de la invitación.

### Solución: Temas de Colores

Cada plantilla define una paleta de colores y fuente que se aplica dinámicamente a la página pública.

#### 1. Modificar tabla `plantillas_evento`

```sql
ALTER TABLE plantillas_evento ADD COLUMN tema JSONB DEFAULT '{
  "color_primario": "#ec4899",
  "color_secundario": "#fce7f3",
  "color_fondo": "#fdf2f8",
  "color_texto": "#1f2937",
  "color_texto_claro": "#6b7280",
  "fuente_titulo": "Playfair Display",
  "fuente_cuerpo": "Inter"
}';
```

#### 2. Backend: Incluir tema en respuesta pública

En `public.controller.js`, incluir el tema de la plantilla al obtener evento:

```javascript
// Al obtener evento público, incluir tema de plantilla
const evento = await EventoModel.obtenerPorSlug(slug);
if (evento.plantilla_id) {
  const plantilla = await PlantillaModel.obtenerPorId(evento.plantilla_id);
  evento.tema = plantilla?.tema || null;
}
```

#### 3. Frontend: Aplicar tema dinámicamente

En `EventoPublicoPage.jsx`:

```jsx
// Obtener tema de la plantilla o usar default
const tema = evento.tema || {
  color_primario: '#ec4899',
  color_secundario: '#fce7f3',
  color_fondo: '#fdf2f8',
  color_texto: '#1f2937',
  color_texto_claro: '#6b7280',
  fuente_titulo: 'Playfair Display',
  fuente_cuerpo: 'Inter'
};

// Aplicar como CSS variables
<div style={{
  '--color-primario': tema.color_primario,
  '--color-secundario': tema.color_secundario,
  '--color-fondo': tema.color_fondo,
  '--color-texto': tema.color_texto,
  '--fuente-titulo': tema.fuente_titulo,
  '--fuente-cuerpo': tema.fuente_cuerpo,
}}>
```

#### 4. Actualizar plantillas existentes con temas

```sql
-- Elegante Dorado
UPDATE plantillas_evento SET tema = '{
  "color_primario": "#d4af37",
  "color_secundario": "#fef9e7",
  "color_fondo": "#fffef5",
  "color_texto": "#2c2c2c",
  "fuente_titulo": "Cormorant Garamond",
  "fuente_cuerpo": "Lato"
}' WHERE codigo = 'boda-elegante-dorado';

-- Moderno Minimalista
UPDATE plantillas_evento SET tema = '{
  "color_primario": "#000000",
  "color_secundario": "#f5f5f5",
  "color_fondo": "#ffffff",
  "color_texto": "#1a1a1a",
  "fuente_titulo": "Montserrat",
  "fuente_cuerpo": "Open Sans"
}' WHERE codigo = 'boda-moderno-minimalista';

-- Romántico Floral
UPDATE plantillas_evento SET tema = '{
  "color_primario": "#c44569",
  "color_secundario": "#fce4ec",
  "color_fondo": "#fff5f7",
  "color_texto": "#3d3d3d",
  "fuente_titulo": "Great Vibes",
  "fuente_cuerpo": "Raleway"
}' WHERE codigo = 'boda-romantico-floral';

-- Rústico Natural
UPDATE plantillas_evento SET tema = '{
  "color_primario": "#8b5a2b",
  "color_secundario": "#f5f0e6",
  "color_fondo": "#faf8f5",
  "color_texto": "#3e3e3e",
  "fuente_titulo": "Amatic SC",
  "fuente_cuerpo": "Roboto"
}' WHERE codigo = 'boda-rustico-natural';
```

#### 5. Preview en selector de plantillas

En `EventoFormPage.jsx`, mostrar preview con los colores reales:

```jsx
{plantillas.map((plantilla) => (
  <button
    key={plantilla.id}
    style={{
      background: plantilla.tema?.color_fondo || '#fdf2f8',
      borderColor: formData.plantilla_id == plantilla.id
        ? plantilla.tema?.color_primario
        : '#e5e7eb'
    }}
  >
    <div style={{
      color: plantilla.tema?.color_primario,
      fontFamily: plantilla.tema?.fuente_titulo
    }}>
      {plantilla.nombre}
    </div>
  </button>
))}
```

### Tareas de Implementación

1. [ ] Agregar columna `tema` a `plantillas_evento`
2. [ ] Actualizar modelo y schema de plantillas
3. [ ] Actualizar plantillas existentes con temas
4. [ ] Incluir tema en respuesta de evento público
5. [ ] Aplicar tema dinámico en `EventoPublicoPage.jsx`
6. [ ] Mostrar preview con colores en selector de plantillas
7. [ ] Cargar Google Fonts dinámicamente según plantilla
8. [ ] Agregar editor de tema en panel super_admin

---

## Arquitectura de Referencia

### Estructura Backend

```
backend/app/modules/eventos-digitales/
├── controllers/  (eventos, invitados, ubicaciones, mesa-regalos, felicitaciones, plantillas, public)
├── models/       (evento, invitado, ubicacion, mesa-regalos, felicitacion, plantilla)
├── routes/       (eventos, invitados, ubicaciones, mesa-regalos, felicitaciones, plantillas, public)
└── schemas/      (validación Joi)
```

### Estructura Frontend

```
frontend/src/pages/eventos-digitales/
├── EventosListPage.jsx      # Lista de eventos
├── EventoDetallePage.jsx    # Detalle con tabs
├── EventoFormPage.jsx       # Crear/editar
└── EventoPublicoPage.jsx    # Página pública

frontend/src/pages/superadmin/
└── PlantillasEventos.jsx    # CRUD plantillas
```

### Endpoints Principales

```
# Admin (autenticado)
GET/POST   /api/v1/eventos-digitales/eventos
GET/PUT/DEL /api/v1/eventos-digitales/eventos/:id
POST       /api/v1/eventos-digitales/eventos/:id/invitados/importar
GET        /api/v1/eventos-digitales/eventos/:id/invitados/exportar

# Plantillas (lectura: todos, escritura: super_admin)
GET/POST   /api/v1/eventos-digitales/plantillas
PUT/DEL    /api/v1/eventos-digitales/plantillas/:id

# Público (sin auth)
GET        /api/v1/public/eventos/:slug
POST       /api/v1/public/eventos/:slug/:token/rsvp
```
