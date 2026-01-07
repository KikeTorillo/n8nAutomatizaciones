# Gaps del Módulo Profesionales

**Fecha de análisis**: 5 Enero 2026
**Versión**: 1.0

---

## Resumen Ejecutivo

Durante la validación integral del módulo Profesionales y su organigrama D3.js, se identificaron varios gaps funcionales y técnicos que requieren atención para alcanzar paridad con soluciones como Odoo 19.

---

## 1. Gaps Corregidos (Sesión Actual)

### 1.1 Edición de Supervisor desde UI
| Campo | Descripción |
|-------|-------------|
| **Archivo** | `frontend/src/components/profesionales/tabs/TrabajoTab.jsx` |
| **Problema** | El QuickEditDrawer de "Estructura Organizacional" no incluía los campos `supervisor_id` ni `responsable_rrhh_id` |
| **Solución** | Agregados los campos con opciones dinámicas desde `useProfesionales()` |

### 1.2 Conversión de IDs en Formularios
| Campo | Descripción |
|-------|-------------|
| **Archivo** | `frontend/src/components/profesionales/cards/QuickEditDrawer.jsx` |
| **Problema** | Los `<select>` HTML devuelven strings, pero el backend espera números para campos `_id` |
| **Solución** | Agregada conversión con `parseInt()` para campos que terminan en `_id` |

### 1.3 Schema de Validación Backend
| Campo | Descripción |
|-------|-------------|
| **Archivo** | `backend/app/modules/profesionales/schemas/profesional.schemas.js` |
| **Problema** | Los campos `departamento_id`, `puesto_id`, `responsable_rrhh_id` eran requeridos en updates parciales |
| **Solución** | Agregado `.optional()` a los campos de jerarquía en el schema de actualización |

---

## 2. Gaps Pendientes - Alta Prioridad

### 2.1 Catálogos No Configurados

| Catálogo | Estado | Impacto |
|----------|--------|---------|
| **Departamentos** | Sin datos | Todos los profesionales muestran "No especificado" |
| **Puestos** | Sin datos | Sin clasificación de roles |
| **Ubicaciones de trabajo** | Sin datos | Trabajo híbrido no configurable |

**Acción requerida**: Crear UI de administración de catálogos o seed de datos iniciales.

### 2.2 Campo "Tipo" de Profesional No Utilizado

```javascript
// Tipos definidos en el sistema
const TIPO_COLORS = {
  gerencial: '#9333ea',
  administrativo: '#3b82f6',
  operativo: '#22c55e',
  ventas: '#f59e0b',
};
```

| Problema | Descripción |
|----------|-------------|
| No hay UI para asignar tipo | El campo existe en BD pero no hay forma de editarlo desde el frontend |
| Organigrama no muestra badges | Los badges de tipo aparecen vacíos porque nadie tiene tipo asignado |

**Acción requerida**: Agregar selector de tipo en el formulario de creación y en TrabajoTab.

### 2.3 Servicios No Asignados

El sistema muestra alertas persistentes:
> "Atención: 6 profesionales sin servicios asignados"

| Impacto | Descripción |
|---------|-------------|
| Agendamiento | Los profesionales no pueden recibir citas sin servicios |
| UX | Alerta molesta que no se puede descartar |

**Acción requerida**: Flujo de asignación masiva de servicios o permitir ocultar alerta.

---

## 3. Gaps Pendientes - Media Prioridad

### 3.1 Nombres Incompletos

| Campo | Estado Actual | Recomendación |
|-------|---------------|---------------|
| `nombre_completo` | Campo único | Separar en `nombre`, `apellido_paterno`, `apellido_materno` |

Esto afecta:
- Ordenamiento alfabético por apellido
- Generación de credenciales
- Reportes formales

### 3.2 Foto de Perfil

| Problema | Descripción |
|----------|-------------|
| Sin upload | No hay UI para subir foto de perfil |
| Fallback | Solo se muestran iniciales con color |

El organigrama soporta `foto_url` pero nadie tiene foto:
```javascript
const avatarHtml = data.foto_url
  ? `<img src="${data.foto_url}" .../>`
  : `<div>...iniciales...</div>`;
```

### 3.3 Indicador de Completitud

El sistema muestra "Perfil completo: 33-40%" pero:
- No hay guía de qué campos faltan
- No hay incentivo para completar
- No afecta funcionalidad

**Recomendación**: Agregar checklist de campos pendientes en el perfil.

### 3.4 Validación de Jerarquía Circular

| Problema | Descripción |
|----------|-------------|
| Sin validación | Un empleado puede ser su propio supervisor (ciclo) |
| Impacto | Podría romper el árbol del organigrama |

**Acción requerida**: Validación en backend para prevenir ciclos en `supervisor_id`.

---

## 4. Gaps vs Odoo 19 - Funcionalidad HR

### 4.1 Gestión de Contratos
| Feature | Nexo | Odoo 19 |
|---------|------|---------|
| Múltiples contratos por empleado | No | Sí |
| Historial de contratos | No | Sí |
| Alertas de vencimiento | No | Sí |
| Tipos de contrato configurables | Limitado | Sí |

### 4.2 Gestión de Ausencias
| Feature | Nexo | Odoo 19 |
|---------|------|---------|
| Vacaciones | Sí (módulo separado) | Integrado |
| Incapacidades | Solo estado | Workflow completo |
| Permisos especiales | No | Sí |
| Calendario de ausencias | No | Sí |

### 4.3 Evaluaciones de Desempeño
| Feature | Nexo | Odoo 19 |
|---------|------|---------|
| Evaluaciones 360° | No | Sí |
| Objetivos/KPIs | No | Sí |
| Plan de carrera | No | Sí |

### 4.4 Reclutamiento
| Feature | Nexo | Odoo 19 |
|---------|------|---------|
| Vacantes | No | Sí |
| Pipeline de candidatos | No | Sí |
| Onboarding automatizado | Parcial | Completo |

### 4.5 Nómina
| Feature | Nexo | Odoo 19 |
|---------|------|---------|
| Cálculo de nómina | No | Sí |
| Deducciones/Percepciones | No | Sí |
| Timbrado CFDI | No | Sí (México) |
| Integración contable | No | Sí |

---

## 5. Gaps de UX/UI

### 5.1 Organigrama
| Gap | Descripción |
|-----|-------------|
| Sin búsqueda con highlight | La búsqueda filtra pero no resalta el nodo encontrado |
| Sin export | No se puede exportar a PDF/PNG |
| Sin vista compacta | Solo layout expandido disponible |
| Sin drag & drop | No se puede reorganizar arrastrando nodos |

### 5.2 Lista de Profesionales
| Gap | Descripción |
|-----|-------------|
| Sin vista tabla | Solo vista de cards disponible |
| Sin export | No se puede exportar listado |
| Sin selección múltiple | No hay acciones en lote |
| Sin columnas configurables | Layout fijo |

### 5.3 Detalle de Profesional
| Gap | Descripción |
|-----|-------------|
| Tabs sin indicador de completitud | No se sabe qué tabs tienen información |
| Sin historial de cambios | No hay auditoría visible |
| Sin preview de documentos | Solo descarga disponible |

---

## 6. Gaps Técnicos

### 6.1 Performance
| Área | Estado |
|------|--------|
| Paginación en lista | No implementada (carga todos) |
| Cache de organigrama | Sin cache |
| Lazy loading de tabs | Todos cargan al abrir |

### 6.2 Validaciones
| Validación | Estado |
|------------|--------|
| Email único por organización | Sí |
| RFC válido | No |
| CURP válido | No |
| NSS válido | No |
| Teléfono formato | No |

### 6.3 Integraciones Faltantes
| Integración | Descripción |
|-------------|-------------|
| IMSS | Altas, bajas, modificaciones |
| INFONAVIT | Créditos y descuentos |
| SAT | Validación RFC, timbrado |
| Bancos | Dispersión de nómina |

---

## 7. Plan de Acción Sugerido

### Fase 1 - Correcciones Críticas (1-2 semanas)
1. [ ] Crear seed de datos para Departamentos y Puestos
2. [ ] Agregar selector de "tipo" en formularios
3. [ ] Validación de ciclos en jerarquía
4. [ ] Asignación masiva de servicios

### Fase 2 - Mejoras de UX (2-4 semanas)
1. [ ] Upload de foto de perfil
2. [ ] Vista tabla en lista de profesionales
3. [ ] Export de organigrama a PDF
4. [ ] Checklist de completitud de perfil

### Fase 3 - Funcionalidad HR (1-2 meses)
1. [ ] Módulo de contratos
2. [ ] Integración profunda con vacaciones
3. [ ] Gestión de ausencias completa
4. [ ] Calendario de equipo

### Fase 4 - Integraciones México (2-3 meses)
1. [ ] Validación RFC/CURP/NSS
2. [ ] Integración IMSS (SUA)
3. [ ] Módulo de nómina básico
4. [ ] Timbrado CFDI

---

## 8. Archivos Clave del Módulo

```
backend/app/modules/profesionales/
├── controllers/
│   ├── profesional.controller.js
│   ├── curriculum.controller.js
│   ├── documentos.controller.js
│   ├── compensacion.controller.js
│   └── configuracion.controller.js
├── models/
│   └── profesional.model.js
├── routes/
│   └── profesional.routes.js
└── schemas/
    └── profesional.schemas.js

frontend/src/
├── components/profesionales/
│   ├── cards/
│   │   ├── EditableField.jsx
│   │   ├── InfoCard.jsx
│   │   └── QuickEditDrawer.jsx
│   ├── tabs/
│   │   ├── GeneralTab.jsx
│   │   ├── TrabajoTab.jsx
│   │   ├── PersonalTab.jsx
│   │   ├── CurriculumTab.jsx
│   │   ├── DocumentosTab.jsx
│   │   ├── CompensacionTab.jsx
│   │   └── ConfiguracionTab.jsx
│   └── D3OrgChart.jsx
├── pages/
│   └── profesionales/
│       ├── ProfesionalesPage.jsx
│       ├── ProfesionalDetallePage.jsx
│       ├── NuevoProfesionalPage.jsx
│       └── OrganigramaPage.jsx
└── hooks/
    ├── useProfesionales.js
    └── useOrganigrama.js
```

---

## Notas Finales

Este documento debe actualizarse conforme se resuelvan los gaps identificados. Usar el sistema de TODOs en el código para tracking granular:

```javascript
// TODO: [GAP-PROF-001] Agregar validación de ciclos en supervisor_id
// TODO: [GAP-PROF-002] Implementar upload de foto de perfil
```

**Última actualización**: 5 Enero 2026
