# Plan de Desarrollo: Custom Fields + Notificaciones

**Ultima Actualizacion:** 20 Diciembre 2025

---

## Resumen de Fases Completadas

| Fase | Descripcion | Commit | Estado |
|------|-------------|--------|--------|
| 1 | Correcciones Auditoria BD | `c83a05f` | ✅ |
| 2 | Sistema Custom Fields | `f3a0f63` | ✅ |
| 3 | Sistema Notificaciones | `68c8960` | ✅ |

---

## Tareas Pendientes

### 1. Integrar Custom Fields en Formularios Existentes

El componente `<CustomFieldsForm>` ya existe pero falta integrarlo en los formularios de cada entidad:

| Formulario | Archivo | Prioridad |
|------------|---------|-----------|
| Clientes | `ClienteFormPage.jsx` o `ClienteFormModal.jsx` | Alta |
| Servicios | `ServicioFormModal.jsx` | Alta |
| Profesionales | `ProfesionalFormModal.jsx` | Media |
| Productos | `ProductoFormModal.jsx` | Media |
| Citas | `CitaFormModal.jsx` | Baja |
| Eventos Digitales | `EventoFormPage.jsx` | Baja |

**Ejemplo de integracion:**

```jsx
import { CustomFieldsForm } from '@/components/custom-fields';
import { useCustomFieldsValores, useGuardarCustomFieldsValores } from '@/hooks/useCustomFields';

// Dentro del formulario, despues de los campos basicos:
<CustomFieldsForm
  entidadTipo="cliente"
  entidadId={clienteId}  // null si es nuevo
  onChange={setCustomFieldsValues}
  readOnly={false}
/>

// Al guardar, llamar a:
const guardarCF = useGuardarCustomFieldsValores();
await guardarCF.mutateAsync({
  entidadTipo: 'cliente',
  entidadId: nuevoClienteId,
  valores: customFieldsValues
});
```

### 2. Testing

- [ ] Testing manual de Custom Fields (crear, editar, eliminar definiciones)
- [ ] Testing manual de valores en formularios
- [ ] Testing manual de Notificaciones (crear, leer, archivar)
- [ ] Testing de triggers automaticos (crear cita → notificacion)
- [ ] Verificar pg_cron job de limpieza

### 3. General

- [ ] Documentar APIs (Swagger/OpenAPI)
- [ ] Deploy a staging
- [ ] Deploy a produccion

---

## Archivos Creados (Referencia)

<details>
<summary>Fase 2 - Custom Fields</summary>

```
sql/custom-fields/
├── 01-tablas.sql
├── 02-indices.sql
├── 03-rls-policies.sql
├── 04-funciones.sql
└── 05-triggers.sql

backend/app/modules/custom-fields/
├── manifest.json
├── controllers/custom-fields.controller.js
├── routes/custom-fields.routes.js
└── schemas/custom-fields.schemas.js

frontend/src/
├── hooks/useCustomFields.js
├── components/custom-fields/
│   ├── CustomFieldsBuilder.jsx
│   ├── CustomFieldsForm.jsx
│   └── CustomFieldInput.jsx
└── pages/configuracion/CustomFieldsPage.jsx
```
</details>

<details>
<summary>Fase 3 - Notificaciones</summary>

```
sql/notificaciones/
├── 01-tablas.sql          # 4 tablas + 26 tipos predefinidos
├── 02-indices.sql         # 10 indices
├── 03-rls-policies.sql
├── 04-funciones.sql       # 9 funciones
└── 05-triggers.sql        # 4 triggers + pg_cron

backend/app/modules/notificaciones/
├── manifest.json
├── controllers/notificaciones.controller.js  # 15 endpoints
├── services/notificaciones.service.js
├── routes/notificaciones.routes.js
└── schemas/notificaciones.schemas.js

frontend/src/
├── hooks/useNotificaciones.js
├── components/notificaciones/
│   ├── NotificacionesBell.jsx
│   ├── NotificacionesLista.jsx
│   └── NotificacionesPreferencias.jsx
└── pages/notificaciones/
    ├── NotificacionesPage.jsx
    └── NotificacionesPreferenciasPage.jsx
```
</details>

---

## APIs Disponibles

### Custom Fields
```
GET    /api/v1/custom-fields/definiciones
POST   /api/v1/custom-fields/definiciones
PUT    /api/v1/custom-fields/definiciones/:id
DELETE /api/v1/custom-fields/definiciones/:id
PUT    /api/v1/custom-fields/definiciones/reorder
GET    /api/v1/custom-fields/valores/:entidadTipo/:entidadId
POST   /api/v1/custom-fields/valores/:entidadTipo/:entidadId
```

### Notificaciones
```
GET    /api/v1/notificaciones
GET    /api/v1/notificaciones/count
PUT    /api/v1/notificaciones/:id/leer
PUT    /api/v1/notificaciones/leer-todas
PUT    /api/v1/notificaciones/:id/archivar
DELETE /api/v1/notificaciones/:id
GET    /api/v1/notificaciones/preferencias
PUT    /api/v1/notificaciones/preferencias
GET    /api/v1/notificaciones/tipos
GET    /api/v1/notificaciones/plantillas
POST   /api/v1/notificaciones/plantillas
PUT    /api/v1/notificaciones/plantillas/:id
DELETE /api/v1/notificaciones/plantillas/:id
```
