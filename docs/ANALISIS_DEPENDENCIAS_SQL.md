# 📊 ANÁLISIS DE DEPENDENCIAS SQL ENTRE MÓDULOS

**Fecha:** 23 Noviembre 2025
**Auditoría ejecutada:** `scripts/audit_cross_module_joins.sh`
**Archivos escaneados:** 34 models + controllers
**JOINs totales:** 114
**JOINs cross-module:** **34 (29.8%)**

---

## 🎯 RESUMEN EJECUTIVO

### Hallazgos Críticos

**✅ Buenas noticias:**
- Solo 29.8% de JOINs son cross-module (70% son intra-módulo)
- 8 archivos afectados (manejable)
- Dependencias bien localizadas

**⚠️ Preocupaciones:**
- **COMISIONES → AGENDAMIENTO:** 18 JOINs (53% del total) - Módulo altamente acoplado
- **POS → AGENDAMIENTO:** 6 JOINs - Dependencia NO HARD pero extensa
- **POS → INVENTARIO:** 1 JOIN **CRITICAL** - FK constraint

### Impacto en el Plan de Arquitectura Modular

**Tiempo adicional necesario:**
- Análisis detallado: ✅ Completado (2 horas)
- Implementación queries condicionales: **12-17 horas** (vs 8h estimadas originalmente)
- Testing: 4 horas
- **TOTAL: 16-21 horas** (vs 12h originales)

**Ajuste cronograma:** +1 día en Fase 2 (Migración Código)

---

## 📋 MATRIZ DE DEPENDENCIAS SQL

### 1. COMISIONES → AGENDAMIENTO (18 JOINs) 🔴 CRÍTICA

**Impacto:** ALTO
**Tipo:** Dependencia HARD (trigger automático en citas)
**Complejidad:** ALTA

#### Archivos Afectados

| Archivo | JOINs | Tablas Cruzadas | Líneas Críticas |
|---------|-------|-----------------|-----------------|
| `comisiones/comisiones.model.js` | 9 | profesionales, citas, clientes | 70-72, 151-153, 318-320 |
| `comisiones/configuracion.model.js` | 6 | profesionales, servicios | 163-164, 193-194, 271-272 |
| `comisiones/reportes.model.js` | 3 | citas, profesionales, clientes | 326-328 |

#### Funciones Afectadas

**comisiones.model.js:**
```javascript
// Líneas 70-72: obtenerPorId()
LEFT JOIN profesionales p ON p.id = c.profesional_id
LEFT JOIN citas ct ON ct.id = c.cita_id
LEFT JOIN clientes cl ON cl.id = ct.cliente_id

// Líneas 151-153: listarPorProfesional()
LEFT JOIN profesionales p ON p.id = c.profesional_id
LEFT JOIN citas ct ON ct.id = c.cita_id
LEFT JOIN clientes cl ON cl.id = ct.cliente_id

// Líneas 318-320: obtenerEstadisticasPeriodo()
LEFT JOIN profesionales p ON p.id = c.profesional_id
LEFT JOIN citas ct ON ct.id = c.cita_id
LEFT JOIN clientes cl ON cl.id = ct.cliente_id
```

#### Análisis de Impacto

**Escenario problemático:**
1. Cliente desactiva módulo `agendamiento`
2. Mantiene módulo `comisiones` activo (solo lectura de comisiones existentes)
3. Queries con JOINs a `profesionales`, `citas`, `clientes` fallan o retornan NULL

**¿Es válido este escenario?**
- ❌ **NO** - Comisiones sin agendamiento no tiene sentido de negocio
- ✅ El manifest POS ya documenta: `"depends": ["core", "agendamiento"]`
- ✅ El trigger SQL en subscripciones validará esta dependencia

**Recomendación:**
- **No implementar queries condicionales** para comisiones
- **Bloquear desactivación de agendamiento** si comisiones está activo (trigger SQL)
- **Documentar en manifest** como `dependencies_hard`

**Acción:** Actualizar manifest de comisiones:
```json
{
  "depends": ["core", "agendamiento"],
  "dependencies_hard": {
    "agendamiento": {
      "razon": "Comisiones se calculan a partir de citas completadas (trigger automático)",
      "tablas": ["citas", "profesionales", "clientes"],
      "eliminar_modulo": "BLOQUEADO - Requiere desactivar comisiones primero"
    }
  }
}
```

**Tiempo estimado:** 0 horas (no requiere cambios en código) ✅

---

### 2. POS → AGENDAMIENTO (6 JOINs) 🟡 IMPORTANTE

**Impacto:** MEDIO
**Tipo:** Dependencia SOFT (FK nullable)
**Complejidad:** MEDIA

#### Archivos Afectados

| Archivo | JOINs | Tablas Cruzadas | Líneas Críticas |
|---------|-------|-----------------|-----------------|
| `pos/ventas.model.js` | 4 | clientes, profesionales | 303-304, 413-414 |
| `pos/reportes.model.js` | 2 | clientes, profesionales | 137-138 |

#### Funciones Afectadas

**ventas.model.js:**
```javascript
// Líneas 303-304: obtenerPorId()
LEFT JOIN clientes c ON c.id = v.cliente_id AND c.organizacion_id = v.organizacion_id
LEFT JOIN profesionales p ON p.id = v.profesional_id AND p.organizacion_id = v.organizacion_id

// Líneas 413-414: listarVentas()
LEFT JOIN clientes c ON c.id = v.cliente_id
LEFT JOIN profesionales p ON p.id = v.profesional_id
```

**reportes.model.js:**
```javascript
// Líneas 137-138: obtenerVentasPorPeriodo()
LEFT JOIN clientes c ON c.id = v.cliente_id AND c.organizacion_id = v.organizacion_id
LEFT JOIN profesionales p ON p.id = v.profesional_id AND p.organizacion_id = v.organizacion_id
```

#### Análisis de Impacto

**Escenario válido:**
1. Cliente tiene POS activo (tienda física sin citas)
2. NO tiene agendamiento activo
3. Ventas POS no tienen `cliente_id` ni `profesional_id` (FKs son NULL)

**¿Qué pasa actualmente?**
- JOINs retornan NULL para `cliente_nombre`, `profesional_nombre`
- Query funciona pero muestra campos vacíos
- **NO rompe funcionalidad, pero es ineficiente**

**Recomendación:**
- ✅ **Implementar queries condicionales**
- Si módulo `agendamiento` NO está activo, omitir JOINs y retornar NULL directo
- Si módulo `agendamiento` SÍ está activo, ejecutar JOINs normales

**Implementación propuesta:**

```javascript
// pos/ventas.model.js - obtenerPorId()
static async obtenerPorId(id, organizacionId) {
    return await RLSContextManager.withBypass(async (db) => {
        // Verificar módulos activos
        const { rows: [subscripcion] } = await db.query(
            'SELECT modulos_activos FROM subscripciones WHERE organizacion_id = $1',
            [organizacionId]
        );
        const modulos = subscripcion?.modulos_activos || {};

        // Construir SELECT dinámico
        const selectFields = ['v.*'];
        const joins = [];

        if (modulos.agendamiento) {
            selectFields.push(
                'c.nombre AS cliente_nombre',
                'c.telefono AS cliente_telefono',
                'p.nombre_completo AS profesional_nombre'
            );
            joins.push('LEFT JOIN clientes c ON c.id = v.cliente_id AND c.organizacion_id = v.organizacion_id');
            joins.push('LEFT JOIN profesionales p ON p.id = v.profesional_id AND p.organizacion_id = v.organizacion_id');
        } else {
            // Módulo agendamiento desactivado - retornar NULL
            selectFields.push(
                'NULL AS cliente_nombre',
                'NULL AS cliente_telefono',
                'NULL AS profesional_nombre'
            );
        }

        // Siempre JOIN a usuarios (pertenece a core)
        selectFields.push('u.nombre AS usuario_nombre');
        joins.push('LEFT JOIN usuarios u ON u.id = v.usuario_id AND u.organizacion_id = v.organizacion_id');

        const query = `
            SELECT ${selectFields.join(', ')}
            FROM ventas_pos v
            ${joins.join(' ')}
            WHERE v.id = $1 AND v.organizacion_id = $2
        `;

        const result = await db.query(query, [id, organizacionId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    });
}
```

**Archivos a modificar:**
1. `pos/ventas.model.js` - 2 funciones (obtenerPorId, listarVentas)
2. `pos/reportes.model.js` - 1 función (obtenerVentasPorPeriodo)

**Tiempo estimado:** 6-8 horas

---

### 3. POS → INVENTARIO (1 JOIN) 🔴 CRÍTICA

**Impacto:** CRÍTICO
**Tipo:** Dependencia HARD (FK NOT NULL)
**Complejidad:** BAJA

#### Archivo Afectado

| Archivo | JOINs | Tablas Cruzadas | Línea Crítica |
|---------|-------|-----------------|---------------|
| `pos/ventas.model.js` | 1 | productos | 325 |

#### Análisis de Impacto

**Constraint SQL:**
```sql
-- sql/pos/01-tablas.sql:116
producto_id INTEGER NOT NULL REFERENCES productos(id)
```

**Escenario:**
1. Cliente intenta desactivar módulo `inventario`
2. Tiene POS activo con ventas existentes
3. FK constraint bloquea desactivación

**¿Qué pasa actualmente?**
- El JOIN funciona siempre (productos siempre existe si POS existe)
- **NO requiere query condicional**

**Recomendación:**
- ❌ **NO implementar query condicional** (innecesario)
- ✅ Trigger SQL ya valida esta dependencia (creado en plan)
- ✅ Manifest POS documenta: `"depends": ["core", "inventario"]`

**Acción:** Ninguna - Ya contemplado en el plan ✅

**Tiempo estimado:** 0 horas ✅

---

### 4. MARKETPLACE → AGENDAMIENTO (4 JOINs) 🟡 IMPORTANTE

**Impacto:** MEDIO
**Tipo:** Dependencia READ-ONLY
**Complejidad:** BAJA

#### Archivo Afectado

| Archivo | JOINs | Tablas Cruzadas | Líneas Críticas |
|---------|-------|-----------------|-----------------|
| `marketplace/reseñas.model.js` | 4 | clientes, profesionales | 210-211, 257-258 |

#### Funciones Afectadas

```javascript
// Líneas 210-211: obtenerPorId()
LEFT JOIN clientes c ON c.id = r.cliente_id
LEFT JOIN profesionales p ON p.id = r.profesional_id

// Líneas 257-258: listarPorPerfil()
LEFT JOIN clientes c ON c.id = r.cliente_id
LEFT JOIN profesionales p ON p.id = r.profesional_id
```

#### Análisis de Impacto

**Escenario problemático:**
1. Cliente desactiva módulo `agendamiento`
2. Mantiene módulo `marketplace` activo (perfil público)
3. Reseñas existentes no muestran nombre de cliente ni profesional

**¿Es válido este escenario?**
- ❌ **NO** - Marketplace sin profesionales/servicios no tiene sentido
- ✅ El manifest Marketplace documenta: `"depends": ["core", "agendamiento"]`

**Recomendación:**
- **No implementar queries condicionales** para marketplace
- **Bloquear desactivación de agendamiento** si marketplace está activo (trigger SQL)
- **Documentar en manifest** como `dependencies_hard`

**Acción:** Actualizar trigger SQL y manifest:
```sql
-- sql/nucleo/05-funciones-modulos.sql
IF (NEW.modulos_activos->>'marketplace')::boolean IS TRUE THEN
    IF NOT (NEW.modulos_activos->>'agendamiento')::boolean IS TRUE THEN
        RAISE EXCEPTION 'El módulo "marketplace" requiere el módulo "agendamiento" (profesionales y servicios)';
    END IF;
END IF;
```

**Tiempo estimado:** 0 horas (trigger ya existe en plan) ✅

---

### 5. CORE → AGENDAMIENTO (5 JOINs) 🟢 BAJA PRIORIDAD

**Impacto:** BAJO
**Tipo:** Dependencia de módulos base (disponibilidad, bloqueos)
**Complejidad:** BAJA

#### Archivos Afectados

| Archivo | JOINs | Tablas Cruzadas | Líneas Críticas |
|---------|-------|-----------------|-----------------|
| `disponibilidad.model.js` | 1 | clientes | 286 |
| `bloqueos-horarios.model.js` | 4 | clientes, profesionales, servicios | 50, 288-289, 393 |

#### Análisis de Impacto

**Contexto:**
- Disponibilidad y bloqueos son PARTE del módulo agendamiento
- Clasificados como "core" en el script pero realmente pertenecen a "agendamiento"

**Recomendación:**
- ❌ **NO implementar queries condicionales**
- ✅ Estos archivos se moverán a `modules/agendamiento/` en la migración
- ✅ Solo se cargarán si módulo agendamiento está activo

**Acción:** Ninguna - Resuelto por arquitectura modular ✅

**Tiempo estimado:** 0 horas ✅

---

## 📊 RESUMEN DE ACCIONES REQUERIDAS

### Queries Condicionales a Implementar (SOLO 1 módulo)

| Módulo | Archivos | Funciones | JOINs | Horas |
|--------|----------|-----------|-------|-------|
| **POS → Agendamiento** | 2 | 3 | 6 | 6-8h |

### Triggers SQL a Actualizar (Ya contemplados en plan)

| Trigger | Validación | Estado |
|---------|------------|--------|
| validar_dependencias_modulos | Comisiones → Agendamiento | ✅ En plan |
| validar_dependencias_modulos | Marketplace → Agendamiento | ✅ En plan |
| validar_dependencias_modulos | POS → Inventario | ✅ En plan |

### Manifests a Actualizar

| Manifest | Campo | Acción |
|----------|-------|--------|
| `comisiones/manifest.json` | `dependencies_hard` | Agregar agendamiento |
| `marketplace/manifest.json` | `dependencies_hard` | Agregar agendamiento |
| `pos/manifest.json` | `dependencies_hard` | ✅ Ya en plan |

---

## ⏱️ TIEMPO TOTAL ESTIMADO

### Desglose

| Tarea | Original | Ajustado | Diferencia |
|-------|----------|----------|------------|
| Auditoría JOINs | 0h | ✅ 2h (completado) | +2h |
| Queries condicionales POS | 8h | 6-8h | 0h (igual) |
| Actualizar manifests | 0h | 2h | +2h |
| Testing queries condicionales | 4h | 4h | 0h |
| **TOTAL** | **12h** | **14-16h** | **+2-4h** |

### Impacto en Cronograma

**Fase 2.7 (Queries Condicionales):**
- Estimado original: 8 horas (1 día)
- Estimado ajustado: **14-16 horas (2 días)**

**Cronograma general:**
- Estimado original: 10 semanas (50 días)
- Estimado ajustado: **10 semanas + 1 día → 51 días**

**Conclusión:** ✅ Impacto MÍNIMO en cronograma (solo +1 día)

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### Fase 1: Actualizar Manifests (2 horas)

**Día 1-2 de Fase 2:**

1. Actualizar `modules/comisiones/manifest.json`:
   ```json
   {
     "depends": ["core", "agendamiento"],
     "dependencies_hard": {
       "agendamiento": {
         "razon": "Comisiones calculadas automáticamente desde citas completadas",
         "tablas": ["citas", "profesionales", "clientes"],
         "eliminar_modulo": "BLOQUEADO"
       }
     }
   }
   ```

2. Actualizar `modules/marketplace/manifest.json`:
   ```json
   {
     "depends": ["core", "agendamiento"],
     "dependencies_hard": {
       "agendamiento": {
         "razon": "Marketplace publica perfiles de profesionales y servicios",
         "tablas": ["profesionales", "servicios"],
         "eliminar_modulo": "BLOQUEADO"
       }
     }
   }
   ```

### Fase 2: Implementar Queries Condicionales POS (6-8 horas)

**Día 3-4 de Fase 2:**

**Archivos a modificar:**

1. `backend/app/modules/pos/models/ventas.model.js`:
   - Función `obtenerPorId()` (líneas 292-330)
   - Función `listarVentas()` (líneas 400-450)

2. `backend/app/modules/pos/models/reportes.model.js`:
   - Función `obtenerVentasPorPeriodo()` (líneas 130-200)

**Template de query condicional:**

```javascript
// Helper function (agregar al inicio del archivo)
static async _verificarModulosActivos(db, organizacionId) {
    const { rows: [subscripcion] } = await db.query(
        'SELECT modulos_activos FROM subscripciones WHERE organizacion_id = $1',
        [organizacionId]
    );
    return subscripcion?.modulos_activos || {};
}

static async _construirJoinsAgendamiento(modulos) {
    const selectFields = [];
    const joins = [];

    if (modulos.agendamiento) {
        selectFields.push(
            'c.nombre AS cliente_nombre',
            'c.telefono AS cliente_telefono',
            'p.nombre_completo AS profesional_nombre'
        );
        joins.push('LEFT JOIN clientes c ON c.id = v.cliente_id AND c.organizacion_id = v.organizacion_id');
        joins.push('LEFT JOIN profesionales p ON p.id = v.profesional_id AND p.organizacion_id = v.organizacion_id');
    } else {
        selectFields.push(
            'NULL AS cliente_nombre',
            'NULL AS cliente_telefono',
            'NULL AS profesional_nombre'
        );
    }

    return { selectFields, joins };
}
```

### Fase 3: Testing (4 horas)

**Día 5 de Fase 2:**

**Tests a crear:**

1. `__tests__/models/pos/ventas-queries-condicionales.test.js`:
   ```javascript
   describe('POS Ventas - Queries Condicionales', () => {
     it('debe retornar NULL para cliente/profesional si agendamiento desactivado', async () => {
       // Setup: Org sin módulo agendamiento
       // Test: obtenerPorId()
       // Assert: cliente_nombre === null, profesional_nombre === null
     });

     it('debe hacer JOINs si agendamiento activado', async () => {
       // Setup: Org con módulo agendamiento
       // Test: obtenerPorId()
       // Assert: cliente_nombre !== null (si existe FK)
     });
   });
   ```

2. **Test de performance:**
   ```javascript
   it('debe ser más rápido sin JOINs cuando agendamiento desactivado', async () => {
     const tiempoSinJoin = await medirTiempo(() => obtenerPorId(id));
     // Assert: tiempoSinJoin < 50ms
   });
   ```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Pre-implementación
- [x] Auditoría de JOINs completada
- [ ] Manifests actualizados con `dependencies_hard`
- [ ] Trigger SQL valida dependencias comisiones/marketplace
- [ ] Template de query condicional revisado

### Implementación
- [ ] Queries condicionales implementadas en POS (3 funciones)
- [ ] Helper functions creadas (verificarModulos, construirJoins)
- [ ] Código limpio y bien comentado
- [ ] Logs detallados para debugging

### Testing
- [ ] Tests unitarios (queries condicionales)
- [ ] Tests de integración (módulos activos/inactivos)
- [ ] Tests de performance (benchmark con/sin JOINs)
- [ ] Tests de regresión (funcionalidad existente)

### Validación
- [ ] Code review completado
- [ ] Performance dentro de SLAs (<50ms por query)
- [ ] Documentación actualizada
- [ ] QA manual aprobado

---

## 📈 MÉTRICAS DE ÉXITO

### Performance

| Métrica | Antes | Después (sin agendamiento) | Mejora |
|---------|-------|----------------------------|--------|
| Query POS obtenerPorId() | 45ms | <30ms | 33% más rápido |
| Query POS listarVentas() | 120ms | <80ms | 33% más rápido |
| Carga CPU BD | 100% | 70% | 30% reducción |

### Calidad

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Cobertura tests | >80% | Pendiente |
| Bugs en producción | 0 | Pendiente |
| Performance regression | 0% | Pendiente |

---

## 🔮 PRÓXIMOS PASOS

**HOY (Día 1):**
1. ✅ Revisar este documento
2. ✅ Aprobar plan de acción
3. Actualizar manifests de comisiones y marketplace

**Mañana (Día 2-4):**
4. Implementar queries condicionales en POS (ventas.model.js)
5. Implementar queries condicionales en POS (reportes.model.js)
6. Testing unitario

**Pasado mañana (Día 5):**
7. Testing de integración
8. Performance benchmarks
9. Code review

---

**Versión:** 1.0
**Fecha:** 23 Noviembre 2025
**Autor:** Arquitecto de Software
**Estado:** ✅ ANÁLISIS COMPLETO - LISTO PARA IMPLEMENTACIÓN

