# Módulo Website - Estado Actual

**Actualizado**: 6 Diciembre 2025

---

## Resumen

Sitio web público por organización: `nexo.com/sitio/{slug}`

---

## Estado: 85% Completo

| Fase | Estado | Descripción |
|------|--------|-------------|
| Backend | ✅ | 3 tablas, 4 controllers, 21 endpoints |
| Editor Visual | ✅ | Drag & drop, 11 editores de bloques |
| Renderizado Público | ✅ | 11 renderizadores, tema dinámico |
| Integraciones | 🔄 | Servicios ✅, Equipo/Agendar pendiente |

---

## Archivos Clave

```
backend/app/modules/website/
├── models/          config, paginas, bloques
├── controllers/     config, paginas, bloques, public
├── routes/          protected.routes.js, public.routes.js
└── validators/      website.schemas.js

frontend/src/
├── hooks/useWebsite.js
├── pages/website/
│   ├── WebsiteEditorPage.jsx
│   └── components/
│       ├── PageManager, BlockPalette, BlockEditor
│       ├── ThemeEditor, PreviewPanel
│       └── blocks/   (11 editores)
└── pages/public/
    ├── SitioPublicoPage.jsx
    └── components/blocks/   (11 renderizadores)
```

---

## Endpoints

**Privados** `/api/v1/website/`:
- Config: `POST/GET/PUT/DELETE /config`, `POST /:id/publicar`
- Páginas: CRUD + `PUT /orden`
- Bloques: CRUD + `PUT /orden`, `POST /:id/duplicar`, `GET /tipos`

**Públicos** `/api/v1/public/sitio/:slug`:
- `GET /` - Sitio + página inicio
- `GET /:pagina` - Página específica
- `GET /servicios` - Servicios de la org
- `POST /contacto` - Formulario

---

## Bloques (11)

| Tipo | Editor | Renderizador | Integración |
|------|--------|--------------|-------------|
| hero | ✅ | ✅ | - |
| servicios | ✅ | ✅ | ✅ Sistema |
| testimonios | ✅ | ✅ | - |
| equipo | ✅ | ✅ | ⏳ Profesionales |
| cta | ✅ | ✅ | - |
| contacto | ✅ | ✅ | ⏳ Notificaciones |
| footer | ✅ | ✅ | - |
| texto | ✅ | ✅ | - |
| galeria | ✅ | ✅ | - |
| video | ✅ | ✅ | - |
| separador | ✅ | ✅ | - |

---

## Pendiente: Validación Detallada

### Por Probar (Editor)

- [ ] Crear sitio nuevo desde cero
- [ ] Verificar slug único
- [ ] Crear múltiples páginas
- [ ] Reordenar páginas (drag)
- [ ] Agregar cada tipo de bloque
- [ ] Editar contenido de cada bloque
- [ ] Reordenar bloques (drag)
- [ ] Duplicar bloque
- [ ] Eliminar bloque
- [ ] Cambiar tema (colores, fuentes)
- [ ] Publicar/despublicar sitio
- [ ] Vista previa antes de publicar

### Por Probar (Público)

- [ ] Navegación entre páginas
- [ ] Responsive (móvil, tablet)
- [ ] Formulario contacto funcional
- [ ] Galería con lightbox
- [ ] Video YouTube/Vimeo embed
- [ ] SEO meta tags (verificar HTML)

### Por Implementar

- [ ] Bloque equipo ← profesionales del sistema
- [ ] Botón "Agendar" → módulo agendamiento
- [ ] Formulario contacto → crear lead/notificación
- [ ] Subir imágenes (hero, galería) → MinIO

---

## Dependencias

```bash
@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
react-colorful sonner
```

---

## Notas Técnicas

- Bloque servicios: `origen: "sistema"` carga de BD, `origen: "manual"` usa items del contenido
- Tema: CSS variables `--color-primario`, `--font-titulos`, etc.
- RLS: Tablas website tienen políticas por `organizacion_id`
