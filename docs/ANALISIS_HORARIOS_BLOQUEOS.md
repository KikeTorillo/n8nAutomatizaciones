# Análisis: Horarios y Bloqueos - ¿Módulo Independiente?

## 1. Estado Actual

### Estructura dentro de `agendamiento/`

```
modules/agendamiento/
├── controllers/
│   ├── horario-profesional.controller.js
│   ├── bloqueos-horarios.controller.js
│   ├── tipos-bloqueo.controller.js
│   └── disponibilidad.controller.js
├── models/
│   ├── horario-profesional.model.js  (594 líneas)
│   ├── bloqueos-horarios.model.js    (580 líneas)
│   ├── tipos-bloqueo.model.js        (215 líneas)
│   └── disponibilidad.model.js       (618 líneas)
├── routes/
│   ├── horarios-profesionales.js
│   ├── bloqueos-horarios.js
│   ├── tipos-bloqueo.js
│   └── disponibilidad.js
├── schemas/
│   └── ... (4 archivos)
└── utils/
    └── cita-validacion.util.js
```

### Tablas de Base de Datos

| Tabla | Propósito | FK Principales |
|-------|-----------|----------------|
| `horarios_profesionales` | Plantillas de horario semanal | profesional_id |
| `bloqueos_horarios` | Períodos bloqueados (vacaciones, feriados) | profesional_id, tipo_bloqueo_id, sucursal_id, servicio_id |
| `tipos_bloqueo` | Catálogo de tipos de bloqueo | organizacion_id (nullable = sistema) |

### Dependencias Actuales

```
agendamiento depende de:
├── core (auth, usuarios, organizaciones)
├── profesionales
└── clientes

agendamiento es usado por:
├── comisiones (cálculo basado en citas)
├── recordatorios (notificaciones de citas)
├── chatbots (consulta disponibilidad)
└── marketplace (disponibilidad pública)
```

---

## 2. Arquitectura Odoo (Referencia)

### Módulo `resource` (Base)

Odoo tiene un módulo técnico base llamado `resource` que define:

```python
resource.calendar           # Plantillas de horarios de trabajo
resource.calendar.attendance  # Horarios específicos por día (0=lunes, 6=domingo)
resource.resource           # Recursos (empleados o materiales)
resource.calendar.leaves    # Ausencias/licencias (≈ bloqueos)
```

**Filosofía:** "Un intervalo es una tupla (datetime_inicio, datetime_fin)"

### Módulos que consumen `resource`

| Módulo | Usa | Para |
|--------|-----|------|
| `hr` | resource.calendar | Horarios de empleados |
| `hr_holidays` | resource.calendar.leaves | Time-off / ausencias |
| `planning` | Todo | Planificación de shifts |
| `mrp` | resource.calendar | Capacidad de máquinas |

### Diferencia Clave con Nexo

En Odoo, `resource` es **puramente técnico** (solo estructura de datos). La lógica de negocio está en los módulos consumidores.

En Nexo, hay **lógica de negocio compleja** acoplada:
- `BloqueosHorariosModel.crear()` valida conflictos con citas existentes
- `DisponibilidadModel` usa horarios, bloqueos Y citas para calcular slots

---

## 3. Mejores Prácticas SaaS de Scheduling

### Acuity Scheduling / Calendly / TIMIFY

| Concepto | Implementación |
|----------|----------------|
| **Availability** | Plantilla base de disponibilidad por recurso |
| **Blocking** | Bloqueos manuales o automáticos sobre availability |
| **Buffer Time** | Tiempo entre citas (configuración separada) |
| **Scheduling Limits** | Cuánto tiempo adelante pueden reservar |
| **Resources** | Entidad separada (personas, salas, equipos) |

### Patrón Común

```
Resource Calendar (plantillas)
     ↓
Availability Engine (calcula slots)
     ↓ usa
Blockings (períodos no disponibles)
     ↓ valida contra
Bookings (reservas/citas existentes)
```

**Clave:** El cálculo de disponibilidad siempre necesita las 3 cosas juntas.

---

## 4. Análisis: ¿Extraer a Módulo Independiente?

### Opción A: Mantener en Agendamiento (Status Quo)

**PROS:**
- ✅ Cohesión funcional (todo lo de scheduling junto)
- ✅ Menos módulos = menos complejidad
- ✅ Evita dependencias cruzadas
- ✅ Más fácil de entender y debuggear

**CONS:**
- ❌ `agendamiento` es muy grande (7 rutas, 8+ modelos)
- ❌ Si otro módulo necesita solo horarios, arrastra todo agendamiento

### Opción B: Crear Módulo `disponibilidad/` (Recomendado Odoo-style)

```
modules/disponibilidad/
├── models/
│   ├── horario-profesional.model.js
│   ├── bloqueos-horarios.model.js
│   ├── tipos-bloqueo.model.js
│   └── disponibilidad.model.js
├── routes/...
└── manifest.json
    depends: ["core", "profesionales"]

modules/agendamiento/
├── models/
│   ├── citas.model.js
│   └── servicios.model.js
├── manifest.json
    depends: ["core", "profesionales", "clientes", "disponibilidad"]
```

**PROS:**
- ✅ Patrón industria (Odoo, Salesforce)
- ✅ Reutilizable por otros módulos sin arrastrar citas
- ✅ Mejor separación de responsabilidades
- ✅ Permite evolucionar independientemente

**CONS:**
- ❌ **PROBLEMA CRÍTICO:** `BloqueosHorariosModel.crear()` valida que no haya citas conflictivas
  - Si bloqueos está en `disponibilidad/` y citas en `agendamiento/`
  - Se crea dependencia circular: disponibilidad → agendamiento → disponibilidad

### Opción C: Módulo `recursos/` (Más Similar a Odoo)

```
modules/recursos/
├── models/
│   ├── calendario.model.js        # Plantillas de horario
│   ├── calendario-asistencia.js   # Horarios por día
│   └── calendario-ausencias.js    # Bloqueos/time-off
└── manifest.json
    depends: ["core"]

modules/profesionales/
└── usa recursos.calendario para definir horarios

modules/agendamiento/
└── usa recursos.* + citas para calcular disponibilidad
```

**PROS:**
- ✅ Máxima modularidad (patrón Odoo exacto)
- ✅ Recursos reutilizables para empleados, salas, equipos

**CONS:**
- ❌ Overkill para el caso de uso actual
- ❌ Requiere refactor significativo
- ❌ Aumenta complejidad sin beneficio inmediato

---

## 5. Problema del Acoplamiento Cita-Bloqueo

### Código Actual (bloqueos-horarios.model.js:crear)

```javascript
// Valida que no haya citas conflictivas antes de crear bloqueo
const citasConflictivas = await this._buscarCitasConflictivas(
    organizacionId,
    profesionalId,
    fechaInicio,
    fechaFin,
    horaInicio,
    horaFin
);

if (citasConflictivas.length > 0) {
    throw new ConflictError('Existen citas en el período del bloqueo', {
        citas: citasConflictivas.slice(0, 3),
        total: citasConflictivas.length
    });
}
```

### Si Separamos Módulos

**Problema:** `bloqueos` necesita consultar `citas` para validar conflictos.

**Soluciones posibles:**

1. **Inversión de dependencia:** `agendamiento` registra hook en `disponibilidad`
   ```javascript
   // En agendamiento/index.js
   disponibilidad.onBeforeBloqueoCrear(async (bloqueo) => {
       const citas = await CitaModel.buscarConflictos(bloqueo);
       if (citas.length) throw new ConflictError(...);
   });
   ```

2. **Validación en capa superior:** Controller de agendamiento valida antes de llamar
   ```javascript
   // agendamiento/controllers/bloqueos.controller.js
   const citas = await CitaModel.buscarConflictos(datos);
   if (citas.length) return res.status(409).json(...);
   await BloqueoModel.crear(datos); // disponibilidad/ solo guarda
   ```

3. **Aceptar dependencia circular con lazy loading:**
   ```javascript
   // disponibilidad/models/bloqueos.model.js
   const CitaModel = require('../../agendamiento/models/citas'); // Lazy
   ```

Ninguna solución es perfecta. La opción 2 es la más limpia pero duplica lógica.

---

## 6. Recomendación Final

### Para Nexo Actualmente: **MANTENER EN AGENDAMIENTO** ✅

**Razones:**

1. **Acoplamiento funcional real:** La validación bloqueo-cita es lógica de negocio core, no un side-effect. Separarla introduce complejidad sin beneficio.

2. **Uso actual:** Solo `agendamiento` modifica horarios/bloqueos. Los módulos consumidores (comisiones, recordatorios) solo LEEN disponibilidad.

3. **Complejidad vs beneficio:** Extraer requiere resolver el problema de dependencia circular. El beneficio (módulos más pequeños) no justifica el costo.

4. **Patrón Odoo simplificado:** En Odoo, `resource` es MUY simple (solo CRUD). La lógica de validación está en los módulos consumidores. Replicar esto requeriría mover la validación a `agendamiento`, no a `disponibilidad`.

### Mejoras Sugeridas SIN Extraer

1. **Crear sub-namespace dentro de agendamiento:**
   ```
   agendamiento/
   ├── disponibilidad/
   │   ├── horarios/
   │   ├── bloqueos/
   │   └── engine.js (DisponibilidadModel)
   └── citas/
       └── ...
   ```

2. **Separar rutas lógicamente en manifest:**
   ```json
   {
     "routes": {
       "horarios-profesionales": "/api/v1/horarios-profesionales",
       "bloqueos-horarios": "/api/v1/bloqueos-horarios",
       "tipos-bloqueo": "/api/v1/tipos-bloqueo",
       "disponibilidad": "/api/v1/disponibilidad",
       "servicios": "/api/v1/servicios",
       "citas": "/api/v1/citas"
     },
     "route_groups": {
       "scheduling": ["horarios-profesionales", "bloqueos-horarios", "tipos-bloqueo", "disponibilidad"],
       "booking": ["servicios", "citas"]
     }
   }
   ```

3. **Documentar la arquitectura:** Agregar README.md en agendamiento/ explicando los sub-dominios.

### Cuándo SÍ Extraer (Futuro)

Considerar extracción SI:

- [ ] Otros módulos necesitan MODIFICAR horarios/bloqueos (no solo leer)
- [ ] Se implementa "recursos" genéricos (salas, equipos, no solo profesionales)
- [ ] Se requiere multi-calendario por profesional
- [ ] La validación bloqueo-cita se vuelve opcional o configurable

---

## 7. Comparativa Final

| Aspecto | Odoo | Acuity/Calendly | Nexo (Actual) | Nexo (Recomendado) |
|---------|------|-----------------|---------------|---------------------|
| **Módulo horarios** | `resource` (separado) | Integrado | Integrado | Integrado |
| **Módulo bloqueos** | `hr_holidays` (separado) | Integrado | Integrado | Integrado |
| **Validación cita-bloqueo** | En módulo consumidor | En módulo consumidor | En bloqueos | En bloqueos |
| **Recursos genéricos** | Sí | No | No | No (futuro) |
| **Complejidad** | Alta | Media | Baja | Baja |

---

## 8. Fuentes

- [Odoo Planning Documentation](https://www.odoo.com/documentation/18.0/applications/services/planning.html)
- [Odoo Resource Module Source](https://github.com/maestrano/odoo/blob/master/addons/resource/resource.py)
- [Acuity Scheduling - Managing Availability](https://help.acuityscheduling.com/hc/en-us/articles/16676883635725-Managing-availability-and-calendars)
- [SuperSaaS Schedule Types](https://www.supersaas.com/info/doc/getting_started/schedule_types)
- [TIMIFY Online Scheduling](https://www.timify.com/en/)

---

*Documento generado: Diciembre 2025*
