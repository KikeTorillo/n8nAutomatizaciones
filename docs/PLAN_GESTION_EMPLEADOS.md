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

---

## Eliminación de `tipo_profesional_id`

### Estado: ✅ Completado

**Fecha completado**: 19 Diciembre 2025

---

### Contexto

El campo `tipo_profesional_id` y toda la infraestructura de `tipos_profesional` es código legacy que será eliminado. El sistema de `categorias_profesional` con `tipo_categoria = 'especialidad'` lo reemplaza completamente.

---

### Análisis de Impacto

#### ¿Qué hace actualmente?

| Componente | Función | ¿Se usa realmente? |
|------------|---------|-------------------|
| `tipos_profesional` (tabla) | 33 tipos del sistema (barbero, estilista, etc.) | Solo para poblar select |
| `profesionales.tipo_profesional_id` | FK al tipo | Solo filtros y formulario |
| `servicios.tipos_profesional_autorizados[]` | Restringir qué tipos dan el servicio | **NO** - código muerto |
| `validar_profesional_industria()` | Trigger que valida tipo vs industria | Validación innecesaria |

#### ¿Por qué eliminar?

1. **Redundante**: Las categorías de tipo `especialidad` cubren el mismo caso de uso
2. **Código muerto**: `tipos_profesional_autorizados` no tiene lógica asociada
3. **Complejidad innecesaria**: Trigger de validación por industria añade fricción sin valor
4. **Servicios se asignan directamente**: Via `servicios_profesionales` (M:N), no por tipo

---

### Archivos a Eliminar/Modificar

#### Backend - ELIMINAR (5 archivos)
```
modules/agendamiento/
├── models/tipos-profesional.model.js         # ELIMINAR
├── controllers/tipos-profesional.controller.js  # ELIMINAR
├── routes/tipos-profesional.js               # ELIMINAR
├── routes/index.js                           # MODIFICAR: quitar import
└── schemas/tipos-profesional.schemas.js      # ELIMINAR (si existe)
```

#### Backend - MODIFICAR (6 archivos)
```
modules/agendamiento/
├── schemas/profesional.schemas.js            # Quitar tipo_profesional_id
├── models/profesional.model.js               # Quitar campo de queries
└── models/servicio.model.js                  # Quitar tipos_profesional_autorizados

modules/sucursales/models/sucursales.model.js # Quitar JOIN a tipos_profesional
modules/core/models/usuario.model.js          # Quitar referencia
modules/core/controllers/auth.controller.js   # Quitar de respuesta
```

#### Frontend - ELIMINAR (1 archivo)
```
hooks/useTiposProfesional.js                  # ELIMINAR (198 líneas)
```

#### Frontend - MODIFICAR (4 archivos)
```
services/api/endpoints.js                     # Quitar tiposProfesionalApi
pages/profesionales/ProfesionalesPage.jsx     # Cambiar filtro a categorías
components/profesionales/ProfesionalFormModal.jsx  # Cambiar select a CategoriasSelect
lib/validations.js                            # Quitar schema
```

#### SQL - ELIMINAR (7 archivos)
```
catalogos/
├── 01-tablas-catalogos.sql                   # Quitar CREATE TABLE tipos_profesional
├── 02-indices.sql                            # Quitar 6 índices
├── 03-rls-policies.sql                       # Quitar RLS policy
├── 04-funciones.sql                          # Quitar 2 funciones
├── 05-triggers.sql                           # Quitar 2 triggers
└── 06-datos-iniciales.sql                    # Quitar 33 tipos del sistema
```

#### SQL - MODIFICAR (3 archivos)
```
negocio/01-tablas-negocio.sql                 # Quitar FK tipo_profesional_id
                                              # Quitar tipos_profesional_autorizados
negocio/02-indices.sql                        # Quitar índice idx_profesionales_org_tipo
negocio/04-funciones.sql                      # ELIMINAR validar_profesional_industria()
negocio/05-triggers.sql                       # ELIMINAR trigger_validar_profesional_industria
```

#### Tests - MODIFICAR (8 archivos)
```
__tests__/helpers/db-helper.js                # Quitar tipo_profesional_id de fixtures
__tests__/middleware/subscription.test.js     # Actualizar tests
__tests__/endpoints/profesionales.test.js     # Actualizar tests
__tests__/endpoints/organizaciones-admin.test.js
__tests__/integration/modelos-crud.test.js
__tests__/integration/onboarding-flow.test.js
__tests__/integration/cita-validacion-consistency.test.js
__tests__/rbac/permissions.test.js
```

---

### Reemplazo Funcional

| Antes (tipo_profesional_id) | Después (categorias_profesional) |
|----------------------------|----------------------------------|
| `tipo_profesional_id: 1` (barbero) | Categoría tipo `especialidad`: "Barbero" |
| Filtro por tipo en listado | Filtro por categoría `especialidad` |
| Select de tipo en formulario | `CategoriasSelect` filtrado por `especialidad` |
| 33 tipos fijos del sistema | Categorías flexibles por organización |

---

### Checklist de Eliminación

#### SQL
- [ ] Eliminar tabla `tipos_profesional` de catalogos/01-tablas-catalogos.sql
- [ ] Eliminar índices de catalogos/02-indices.sql
- [ ] Eliminar RLS policies de catalogos/03-rls-policies.sql
- [ ] Eliminar funciones de catalogos/04-funciones.sql
- [ ] Eliminar triggers de catalogos/05-triggers.sql
- [ ] Eliminar datos iniciales de catalogos/06-datos-iniciales.sql
- [ ] Quitar campo `tipo_profesional_id` de profesionales
- [ ] Quitar campo `tipos_profesional_autorizados` de servicios
- [ ] Eliminar función `validar_profesional_industria()`
- [ ] Eliminar trigger `trigger_validar_profesional_industria`
- [ ] Quitar índice `idx_profesionales_org_tipo`

#### Backend
- [ ] Eliminar tipos-profesional.model.js
- [ ] Eliminar tipos-profesional.controller.js
- [ ] Eliminar tipos-profesional.routes.js
- [ ] Quitar import de routes/index.js
- [ ] Quitar `tipo_profesional_id` de profesional.schemas.js
- [ ] Quitar campo de queries en profesional.model.js
- [ ] Quitar `tipos_profesional_autorizados` de servicio.model.js y schemas
- [ ] Quitar JOIN en sucursales.model.js

#### Frontend
- [ ] Eliminar useTiposProfesional.js
- [ ] Quitar tiposProfesionalApi de endpoints.js
- [ ] Reemplazar filtro en ProfesionalesPage.jsx por categorías
- [ ] Reemplazar select en ProfesionalFormModal.jsx por CategoriasSelect
- [ ] Quitar schema de validations.js

#### Tests
- [ ] Actualizar db-helper.js (quitar tipo_profesional_id de createTestProfesional)
- [ ] Actualizar todos los tests que usan tipo_profesional_id

---

### Notas

- **Sin migración de datos**: El proyecto se levanta desde cero
- **Categorías son más flexibles**: M:N vs 1:1, sin restricción de industria
- **Servicios ya funcionan correctamente**: Se asignan via `servicios_profesionales`

---

## Refactorización: Módulo Profesionales Independiente

### Estado: ✅ Completado

**Fecha planificación**: 19 Diciembre 2025
**Fecha completado**: 19 Diciembre 2025

---

### Contexto y Justificación

#### Problema Actual
Los profesionales están dentro del módulo `agendamiento/`, pero su alcance real excede ese módulo:

| Módulo | Dependencia de Profesionales |
|--------|------------------------------|
| **POS** | `ventas_pos.profesional_id` + import directo de ProfesionalModel |
| **Comisiones** | `configuracion_comisiones`, `comisiones_profesionales` |
| **Citas** | `citas.profesional_id` |
| **Sucursales** | `profesionales_sucursales` (M:N) |
| **Agendamiento** | `horarios_profesionales`, `servicios_profesionales` |
| **Core/Usuarios** | `usuarios.profesional_id` bidireccional |

#### Referencia: Arquitectura Odoo
En Odoo, **Employees** es un módulo completamente separado de **Appointments**:
- `hr` (Human Resources) - Módulo central de empleados
- `calendar` / `appointment` - Solo gestiona citas
- Separación clara permite que empleados participen en múltiples contextos

#### Beneficios de Separar
1. **Cohesión**: Cada módulo tiene una sola responsabilidad
2. **Reusabilidad**: Otros módulos importan de `empleados/` sin dependencia circular
3. **Escalabilidad**: Facilita agregar funcionalidades HR (vacaciones, nómina, evaluaciones)
4. **Claridad**: Profesionales como módulo central, no subordinado a agendamiento

---

### Análisis de Dependencias

#### 97 archivos referencian "profesional"

```
Backend:  42 archivos
Frontend: 55 archivos
SQL:      Ya migrado a organización/
```

#### Imports Críticos a Actualizar

| Archivo | Import Actual | Import Nuevo |
|---------|---------------|--------------|
| `pos/models/venta.model.js` | `../agendamiento/models/profesional.model` | `../profesionales/models/profesional.model` |
| `comisiones/models/*.js` | `../agendamiento/models/profesional.model` | `../profesionales/models/profesional.model` |
| `sucursales/models/sucursales.model.js` | `../agendamiento/models/profesional.model` | `../profesionales/models/profesional.model` |
| `core/models/usuario.model.js` | `../agendamiento/models/profesional.model` | `../profesionales/models/profesional.model` |
| `core/controllers/auth.controller.js` | `../agendamiento/models/profesional.model` | `../profesionales/models/profesional.model` |

---

### Nueva Estructura Propuesta

#### Backend
```
backend/app/modules/
├── profesionales/                      # NUEVO MÓDULO
│   ├── controllers/
│   │   └── profesional.controller.js   # Mover desde agendamiento
│   ├── models/
│   │   └── profesional.model.js        # Mover desde agendamiento
│   ├── routes/
│   │   ├── index.js                    # NUEVO
│   │   └── profesionales.js            # Mover desde agendamiento
│   └── schemas/
│       └── profesional.schemas.js      # Mover desde agendamiento
│
├── agendamiento/                       # MODIFICAR
│   ├── controllers/
│   │   ├── cita.controller.js
│   │   ├── horario.controller.js
│   │   └── servicio.controller.js
│   ├── models/
│   │   ├── cita.model.js
│   │   ├── horario.model.js
│   │   └── servicio.model.js           # Queda aquí (servicios != empleados)
│   ├── routes/
│   │   ├── index.js                    # Quitar profesionales
│   │   ├── citas.js
│   │   ├── horarios.js
│   │   └── servicios.js
│   └── schemas/
│       ├── cita.schemas.js
│       └── servicio.schemas.js
│
└── organizacion/                       # SIN CAMBIOS
    └── ...                             # departamentos, puestos, categorías
```

#### Frontend (sin cambios estructurales)
El frontend ya tiene separación lógica:
- `pages/profesionales/` - Página principal
- `components/profesionales/` - Componentes
- `hooks/useProfesionales.js` - Hook de datos

Los endpoints no cambian (solo rutas internas del backend).

---

### Checklist de Implementación

#### Fase 1: Crear Módulo Profesionales
- [ ] Crear directorio `backend/app/modules/profesionales/`
- [ ] Crear subdirectorios: `controllers/`, `models/`, `routes/`, `schemas/`
- [ ] Mover `profesional.model.js` de agendamiento a profesionales
- [ ] Mover `profesional.controller.js` de agendamiento a profesionales
- [ ] Mover `profesionales.js` (routes) de agendamiento a profesionales
- [ ] Mover `profesional.schemas.js` de agendamiento a profesionales
- [ ] Crear `profesionales/routes/index.js` con exports

#### Fase 2: Actualizar Imports en Módulos Dependientes
- [ ] `pos/models/venta.model.js`
- [ ] `comisiones/models/comision.model.js`
- [ ] `comisiones/models/configuracion-comision.model.js`
- [ ] `sucursales/models/sucursales.model.js`
- [ ] `core/models/usuario.model.js`
- [ ] `core/controllers/auth.controller.js`
- [ ] `core/controllers/organizacion.controller.js`

#### Fase 3: Actualizar Agendamiento
- [ ] Quitar export de profesionales en `agendamiento/routes/index.js`
- [ ] Actualizar imports internos que referencien profesional.model
- [ ] `cita.model.js` - Actualizar import
- [ ] `horario.model.js` - Actualizar import
- [ ] `servicio.model.js` - Actualizar import

#### Fase 4: Registrar Módulo
- [ ] Agregar rutas de profesionales en `backend/app/app.js`
- [ ] Mantener mismos endpoints públicos (`/api/v1/profesionales`)

#### Fase 5: Validación
- [ ] Reiniciar backend
- [ ] Probar CRUD profesionales
- [ ] Probar creación de citas
- [ ] Probar ventas POS
- [ ] Probar cálculo de comisiones
- [ ] Ejecutar tests

---

### Consideraciones

#### Nomenclatura
**Decisión**: Usar "profesionales" consistentemente en todo el sistema (módulo, archivos, código, endpoints).

#### Endpoints API
Los endpoints públicos NO cambian:
```
GET|POST|PUT|DELETE  /api/v1/profesionales
GET                  /api/v1/profesionales/:id/subordinados
...
```

Solo cambia la organización interna del código.

#### SQL
El esquema SQL ya está correctamente organizado:
- `sql/organizacion/` - Departamentos, puestos, categorías
- `sql/negocio/` - Tabla profesionales (se queda aquí)

No se requieren cambios en SQL.

---

### Estimación de Impacto

| Métrica | Valor |
|---------|-------|
| Archivos a mover | 4 |
| Archivos a modificar | ~15-20 |
| Riesgo | Bajo (solo reorganización de imports) |
| Tiempo estimado | 2-3 horas |

---

### Notas Finales

- **Sin breaking changes**: Los endpoints públicos no cambian
- **Backward compatible**: Frontend no requiere modificaciones
- **Mejor arquitectura**: Alineado con patrones de Odoo y buenas prácticas
