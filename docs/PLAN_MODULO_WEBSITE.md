# Plan de Implementación - Módulo Website

**Actualizado**: 6 Diciembre 2025

---

## Resumen

Módulo para página web pública por organización: `nexo.com/sitio/{slug}`

**Incluido en**: Suscripción base (todos los planes)

---

## Estado Actual

### Fase 1: Backend ✅ COMPLETA

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| SQL (3 tablas) | ✅ | `sql/website/01-tablas.sql` |
| Índices (8) | ✅ | `sql/website/02-indices.sql` |
| RLS (9 políticas) | ✅ | `sql/website/03-rls-policies.sql` |
| Models (3) | ✅ | `backend/app/modules/website/models/` |
| Controllers (4) | ✅ | `backend/app/modules/website/controllers/` |
| Routes (20 endpoints) | ✅ | `backend/app/modules/website/routes/` |
| Validators | ✅ | `backend/app/modules/website/validators/` |

### Bloques Implementados (11)

| Bloque | Tipo | Descripción |
|--------|------|-------------|
| Hero | `hero` | Banner principal |
| Servicios | `servicios` | Cards de servicios |
| Testimonios | `testimonios` | Reseñas de clientes |
| Equipo | `equipo` | Staff/profesionales |
| CTA | `cta` | Call to action |
| Contacto | `contacto` | Formulario + info |
| Footer | `footer` | Pie de página |
| Texto | `texto` | Texto enriquecido |
| Galería | `galeria` | Grid de imágenes |
| Video | `video` | YouTube/Vimeo embed |
| Separador | `separador` | División visual |

### Endpoints Implementados

**Privados** (auth + tenant + módulo website):
```
POST   /api/v1/website/config                    # Crear config
GET    /api/v1/website/config                    # Obtener config
PUT    /api/v1/website/config/:id                # Actualizar config
POST   /api/v1/website/config/:id/publicar       # Publicar/despublicar
GET    /api/v1/website/config/slug/:slug/disponible  # Verificar slug
DELETE /api/v1/website/config/:id                # Eliminar sitio

POST   /api/v1/website/paginas                   # Crear página
GET    /api/v1/website/paginas                   # Listar páginas
GET    /api/v1/website/paginas/:id               # Obtener página
PUT    /api/v1/website/paginas/:id               # Actualizar página
PUT    /api/v1/website/paginas/orden             # Reordenar páginas
DELETE /api/v1/website/paginas/:id               # Eliminar página

POST   /api/v1/website/bloques                   # Crear bloque
GET    /api/v1/website/paginas/:paginaId/bloques # Listar bloques
GET    /api/v1/website/bloques/:id               # Obtener bloque
PUT    /api/v1/website/bloques/:id               # Actualizar bloque
PUT    /api/v1/website/paginas/:paginaId/bloques/orden  # Reordenar
POST   /api/v1/website/bloques/:id/duplicar      # Duplicar bloque
DELETE /api/v1/website/bloques/:id               # Eliminar bloque
GET    /api/v1/website/bloques/tipos             # Listar tipos
GET    /api/v1/website/bloques/tipos/:tipo/default  # Contenido default
```

**Públicos** (sin auth):
```
GET    /api/v1/public/sitio/:slug                # Sitio completo
GET    /api/v1/public/sitio/:slug/:pagina        # Página específica
POST   /api/v1/public/sitio/:slug/contacto       # Formulario contacto
```

---

## Fases Pendientes

### Fase 2: Editor Visual (Frontend Admin)
- [ ] Página `WebsiteEditor.jsx`
- [ ] Componente `BlockPalette` (paleta de bloques)
- [ ] Drag & Drop con @dnd-kit
- [ ] Editores de cada bloque (11 bloques)
- [ ] `ThemeEditor` (colores y fuentes)
- [ ] Preview antes de publicar

### Fase 3: Renderizado Público
- [ ] Componentes de bloques (solo lectura)
- [ ] Navegación pública
- [ ] Estilos responsive
- [ ] SEO (meta tags, Open Graph)

### Fase 4: Integraciones
- [ ] Bloque servicios ← módulo servicios
- [ ] Bloque equipo ← módulo profesionales
- [ ] Botón agendar ← módulo agendamiento
- [ ] Formulario contacto → notificaciones

---

## Dependencias Frontend (por instalar)

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-colorful
```

---

## Estructura Frontend (por crear)

```
frontend/src/pages/website/
├── WebsiteEditor.jsx
└── components/
    ├── BlockEditor/
    │   └── blocks/          # 11 editores
    ├── BlockPalette/
    ├── PageManager/
    ├── ThemeEditor/
    └── Preview/

frontend/src/pages/public/
├── SitioPublico.jsx
└── components/
    └── blocks/              # 11 renderizadores
```
