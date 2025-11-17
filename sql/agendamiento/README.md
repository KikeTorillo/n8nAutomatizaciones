# 📅 MÓDULO AGENDAMIENTO

**Versión:** 1.0.0
**Fecha:** 16 Noviembre 2025
**Estado:** ✅ Completado

---

## 📋 Descripción

Módulo para gestión de horarios base y disponibilidad de profesionales. Define las plantillas de trabajo semanales que sirven como base para generar automáticamente los slots de citas disponibles.

**Concepto Clave:**
- `horarios_profesionales` = **Plantillas base** (ej: "Lunes 9:00-18:00")
- `disponibilidad` = **Slots específicos calculados** (ej: "2025-01-15 9:30-10:00")

---

## 🗂️ Estructura de Archivos

```
sql/agendamiento/
├── 01-tablas-agendamiento.sql    # Tabla horarios_profesionales
├── 02-indices.sql                # 5 índices especializados
├── 03-rls-policies.sql           # Políticas multi-tenant
├── 04-funciones.sql              # 2 funciones de validación
├── 05-triggers.sql               # 2 triggers automáticos
└── README.md                     # Este archivo
```

---

## 📊 Tablas

### horarios_profesionales
Plantillas de horarios base de cada profesional.

**Campos Principales:**
- `profesional_id` - Profesional al que pertenece el horario
- `dia_semana` - Día de la semana (0=domingo, 6=sábado)
- `hora_inicio` / `hora_fin` - Rango horario
- `tipo_horario` - regular | break | almuerzo | premium
- `permite_citas` - FALSE para breaks/almuerzos
- `precio_premium` - Recargo adicional para horarios premium
- `fecha_inicio` / `fecha_fin` - Vigencia temporal (ej: horario de invierno)

**Características Avanzadas:**
- ✅ Múltiples horarios por día (mañana/tarde con break)
- ✅ Tipos: regular, break, almuerzo, premium
- ✅ Vigencia temporal para cambios estacionales
- ✅ Configuración JSONB flexible
- ✅ Constraint EXCLUDE para prevenir solapamientos

**Ejemplo de Uso:**
```sql
-- Barbero con horario Lunes 9:00-18:00 con almuerzo 13:00-14:00
INSERT INTO horarios_profesionales (
    organizacion_id, profesional_id, dia_semana,
    hora_inicio, hora_fin, tipo_horario, nombre_horario
) VALUES
(1, 42, 1, '09:00', '13:00', 'regular', 'Horario Matutino'),
(1, 42, 1, '13:00', '14:00', 'almuerzo', 'Hora de Almuerzo'),
(1, 42, 1, '14:00', '18:00', 'regular', 'Horario Vespertino');
```

---

## 📌 Índices

| Índice | Uso Principal | Performance |
|--------|---------------|-------------|
| `idx_horarios_profesionales_profesional` | Búsqueda por profesional | O(log n) |
| `idx_horarios_profesionales_dia_activo` | Filtrado por día de semana | O(log n) |
| `idx_horarios_profesionales_vigencia` | Horarios con vigencia temporal | O(log n) |
| `idx_horarios_profesionales_premium` | Horarios con recargo premium | O(log n) |
| `idx_horarios_profesionales_generacion` | Generación de calendario | **Crítico** |

**Índice Más Importante:**
`idx_horarios_profesionales_generacion` - Query más frecuente para generar calendario semanal.

---

## 🔒 Políticas RLS

### horarios_profesionales_unified_access
Política unificada que maneja todos los casos de acceso multi-tenant.

**Reglas:**
- ✅ Super admin: Acceso global
- ✅ Admin/Propietario: CRUD completo en su organización
- ✅ Empleado: CRUD completo en su organización
- ✅ Bot: READ en su organización
- ✅ Bypass RLS: Para triggers y funciones de sistema

---

## ⚙️ Funciones

### 1. validar_solapamiento_horarios()
**Propósito:** Prevenir conflictos de horarios del mismo profesional.

**Validaciones:**
- Mismo profesional + mismo día + horarios solapados = **ERROR**
- Considera vigencia temporal (fecha_inicio/fecha_fin)
- Excluye el registro actual en UPDATE

**Ejemplo de Error:**
```sql
-- ❌ Lunes 9:00-13:00 + Lunes 12:00-18:00 = CONFLICTO
ERROR: Horario se solapa con otro horario existente del profesional en el mismo día
```

### 2. actualizar_timestamp_horarios_profesionales()
**Propósito:** Actualizar automáticamente `actualizado_en` al modificar.

---

## ⚡ Triggers

### 1. trigger_validar_solapamiento_horarios
- **Momento:** BEFORE INSERT OR UPDATE
- **Función:** `validar_solapamiento_horarios()`
- **Objetivo:** Prevenir conflictos de horarios

### 2. trigger_actualizar_timestamp_horarios_prof
- **Momento:** BEFORE UPDATE
- **Función:** `actualizar_timestamp_horarios_profesionales()`
- **Objetivo:** Auditoría de cambios

---

## 📦 Dependencias

### Requiere (Orden de Ejecución):
1. ✅ **Módulo fundamentos** - Extensiones, ENUMs
2. ✅ **Módulo nucleo** - organizaciones, usuarios
3. ✅ **Módulo negocio** - profesionales

### Requerido por:
4. ⏳ **Módulo citas** - Usa horarios para validar disponibilidad
5. ⏳ **Módulo bloqueos** - Considera horarios para bloqueos temporales

---

## 🔄 Migración desde Legacy

**Archivo origen:** `sql/schema/11-horarios-profesionales.sql`

**Cambios aplicados:**
- ✅ Separación modular (tabla → índices → RLS → funciones → triggers)
- ✅ Documentación mejorada en cada archivo
- ✅ Comentarios en funciones y triggers
- ✅ README con guía de uso

**Compatibilidad:** 100% compatible con estructura anterior.

---

## 🧪 Testing

### Casos de Prueba Esenciales:

1. **Solapamiento de Horarios:**
```sql
-- Debe fallar:
INSERT INTO horarios_profesionales
    (organizacion_id, profesional_id, dia_semana, hora_inicio, hora_fin, tipo_horario)
VALUES
    (1, 1, 1, '09:00', '13:00', 'regular'),
    (1, 1, 1, '12:00', '18:00', 'regular'); -- ❌ SOLAPA
```

2. **Horarios con Vigencia Temporal:**
```sql
-- Horario de invierno (Diciembre-Febrero)
INSERT INTO horarios_profesionales
    (organizacion_id, profesional_id, dia_semana, hora_inicio, hora_fin,
     tipo_horario, fecha_inicio, fecha_fin, motivo_vigencia)
VALUES
    (1, 1, 1, '10:00', '16:00', 'regular', '2025-12-01', '2026-02-28', 'Horario de Invierno');
```

3. **Horarios Premium con Recargo:**
```sql
-- Horario nocturno con +20% de recargo
INSERT INTO horarios_profesionales
    (organizacion_id, profesional_id, dia_semana, hora_inicio, hora_fin,
     tipo_horario, precio_premium)
VALUES
    (1, 1, 5, '19:00', '22:00', 'premium', 20.00); -- +$20 por hora
```

---

## 📚 Casos de Uso

### Caso 1: Configuración Básica (Lunes-Viernes 9-18)
```sql
-- Generar horarios Lunes a Viernes
INSERT INTO horarios_profesionales
    (organizacion_id, profesional_id, dia_semana, hora_inicio, hora_fin, tipo_horario)
SELECT 1, 42, gs.dia, '09:00', '18:00', 'regular'
FROM generate_series(1, 5) AS gs(dia);
```

### Caso 2: Horarios con Break de Almuerzo
```sql
-- Día completo con almuerzo
INSERT INTO horarios_profesionales (organizacion_id, profesional_id, dia_semana, hora_inicio, hora_fin, tipo_horario, permite_citas) VALUES
(1, 42, 1, '09:00', '13:00', 'regular', TRUE),
(1, 42, 1, '13:00', '14:00', 'almuerzo', FALSE), -- No permite citas
(1, 42, 1, '14:00', '18:00', 'regular', TRUE);
```

### Caso 3: Horarios Estacionales
```sql
-- Horario de verano (Junio-Agosto): abierto hasta las 20:00
INSERT INTO horarios_profesionales
    (organizacion_id, profesional_id, dia_semana, hora_inicio, hora_fin,
     fecha_inicio, fecha_fin, motivo_vigencia)
VALUES
    (1, 42, 6, '09:00', '20:00', '2025-06-01', '2025-08-31', 'Horario de Verano');
```

---

## ⚠️ Advertencias

1. **Solapamiento:** El sistema **previene automáticamente** horarios solapados del mismo profesional.
2. **Breaks/Almuerzos:** DEBEN tener `permite_citas = FALSE`.
3. **Vigencia Temporal:** `fecha_fin` NULL = indefinido.
4. **RLS Context:** Queries requieren `app.current_tenant_id` configurado.

---

## 📈 Mejoras Futuras

- [ ] Función para generar horarios automáticamente (batch insert)
- [ ] Vista materializada de horarios agregados por profesional
- [ ] Función para calcular slots disponibles en tiempo real
- [ ] Integración con tabla de disponibilidad específica

---

## 📞 Soporte

Para consultas sobre este módulo, revisar:
- Documentación inline en cada archivo SQL
- Comments en funciones y triggers
- CLAUDE.md sección "🏗 Arquitectura"
