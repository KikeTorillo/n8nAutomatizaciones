# Gestión Unificada de Empleados

## Estado: ✅ Completado

**Última actualización:** 18 Diciembre 2025

---

## Arquitectura

| Concepto | Implementación |
|----------|----------------|
| **Tabla única** | `profesionales` para todo el personal |
| **`tipo`** | Clasificación organizacional (operativo, administrativo, gerencial, ventas) |
| **`modulos_acceso`** | JSONB - Control de funcionalidades {agendamiento, pos, inventario} |
| **`categorias_profesional`** | Sistema flexible M:N (especialidad, nivel, área, certificación) |
| **Jerarquía** | `supervisor_id` con validación anti-ciclos |

---

## Endpoints API

### Organización
```
GET|POST|PUT|DELETE  /api/v1/departamentos
GET                  /api/v1/departamentos/arbol
GET|POST|PUT|DELETE  /api/v1/puestos
GET|POST|PUT|DELETE  /api/v1/categorias-profesional
```

### Profesionales - Jerarquía y Categorías
```
GET    /api/v1/profesionales/:id/subordinados    ?max_nivel=10&solo_directos=false
GET    /api/v1/profesionales/:id/supervisores
GET    /api/v1/profesionales/:id/categorias
POST   /api/v1/profesionales/:id/categorias      {categoria_id, notas?}
DELETE /api/v1/profesionales/:id/categorias/:id
PUT    /api/v1/profesionales/:id/categorias      {categoria_ids: []}  (sync)
```

---

## Estructura de Archivos

### Backend
```
backend/app/modules/
├── agendamiento/
│   ├── controllers/profesional.controller.js   # Incluye jerarquía y categorías
│   ├── models/profesional.model.js
│   ├── routes/profesionales.js
│   └── schemas/profesional.schemas.js
└── organizacion/
    ├── controllers/   # departamento, puesto, categoria
    ├── models/
    ├── routes/
    └── schemas/organizacion.schemas.js
```

### Frontend
```
frontend/src/
├── hooks/
│   ├── useDepartamentos.js
│   ├── usePuestos.js
│   ├── useCategoriasProfesional.js
│   └── useOrganigrama.js
├── pages/
│   ├── configuracion/
│   │   ├── DepartamentosPage.jsx
│   │   ├── PuestosPage.jsx
│   │   └── CategoriasPage.jsx
│   ├── organizacion/
│   │   └── OrganigramaPage.jsx
│   └── profesionales/
│       └── ProfesionalesPage.jsx      # Filtros por tipo, estado, depto
└── components/
    ├── organizacion/
    │   ├── DepartamentoSelect.jsx
    │   ├── PuestoSelect.jsx
    │   ├── SupervisorSelect.jsx
    │   └── CategoriasSelect.jsx
    └── profesionales/
        └── ProfesionalFormModal.jsx   # Formulario completo con todos los campos
```

### SQL
```
sql/
├── core/fundamentos/02-tipos-enums-core.sql    # tipo_empleado, estado_laboral, etc.
├── negocio/01-tablas-negocio.sql               # profesionales (extendida)
└── organizacion/
    ├── 01-tablas.sql          # departamentos, puestos, categorias_profesional
    ├── 02-indices.sql
    ├── 04-funciones.sql       # get_subordinados, validar_supervisor_sin_ciclo, etc.
    └── 05-rls-policies.sql
```

---

## Funciones SQL Clave

| Función | Uso |
|---------|-----|
| `get_subordinados(prof_id, max_nivel)` | Árbol de subordinados |
| `get_cadena_supervisores(prof_id)` | Cadena de mando hacia arriba |
| `validar_supervisor_sin_ciclo(prof_id, sup_id)` | Previene ciclos jerárquicos |
| `get_arbol_departamentos(org_id)` | Estructura de departamentos |

---

## Validaciones Implementadas

- **Anti-ciclos**: Al actualizar `supervisor_id`, se valida que no cree ciclo jerárquico
- **Auto-referencia**: Un profesional no puede ser su propio supervisor
- **RLS**: Todas las tablas usan `app.current_tenant_id` para aislamiento multi-tenant

---

## Rutas Frontend

| Ruta | Página |
|------|--------|
| `/profesionales` | CRUD con filtros (tipo, estado, departamento) |
| `/configuracion` | Hub con cards de navegación |
| `/configuracion/departamentos` | CRUD + vista árbol |
| `/configuracion/puestos` | CRUD |
| `/configuracion/categorias` | CRUD agrupado por tipo |
| `/configuracion/organigrama` | Visualización jerárquica del equipo |

---

## Notas Técnicas

- **Drawer** para formularios móviles (no Modal - bug iOS Safari)
- **Dark mode**: Todas las páginas usan variantes `dark:`
- **Color primario**: `#753572` (primary-700)
- **Sanitización**: Campos vacíos `""` se convierten a `undefined` antes de enviar al backend
