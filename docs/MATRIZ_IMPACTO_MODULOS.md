# 🎯 MATRIZ DE IMPACTO: DEPENDENCIAS ENTRE MÓDULOS

**Fecha:** 23 Noviembre 2025
**Basado en:** Auditoría de JOINs Cross-Module

---

## 📊 MATRIZ VISUAL DE DEPENDENCIAS

```
┌─────────────────────────────────────────────────────────────────┐
│                     MÓDULOS INDEPENDIENTES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐                        ┌─────────────┐           │
│  │   CORE   │ ──────────────────────▶│ AGENDAMIENTO│           │
│  │(siempre) │                        │   (base)    │           │
│  └──────────┘                        └──────┬──────┘           │
│       │                                     │                   │
│       │                                     │                   │
│       ▼                                     ▼                   │
│  ┌──────────┐                        ┌─────────────┐           │
│  │INVENTARIO│                        │ COMISIONES  │           │
│  │(autonom) │                        │  (18 JOINs) │◀══════╗   │
│  └────┬─────┘                        └─────────────┘    HARD║  │
│       │                                                      ║  │
│       │ FK NOT NULL                                         ║  │
│       ▼                                                      ║  │
│  ┌──────────┐                        ┌─────────────┐        ║  │
│  │   POS    │ ───────────────────────▶│ AGENDAMIENTO│════════╝  │
│  │(6 JOINs) │     SOFT (nullable)     │             │           │
│  └──────────┘                        └──────┬──────┘           │
│                                             │                   │
│                                             │ READ-ONLY         │
│                                             ▼                   │
│                                       ┌─────────────┐           │
│                                       │ MARKETPLACE │           │
│                                       │  (4 JOINs)  │           │
│                                       └─────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Leyenda:
  ────▶  Dependencia SOFT (queries condicionales necesarios)
  ════▶  Dependencia HARD (bloqueada por trigger SQL)
  (N JOINs) Número de JOINs cross-module detectados
```

---

## 🎨 MAPA DE CALOR: NIVEL DE ACOPLAMIENTO

```
╔════════════════════════════════════════════════════════════════╗
║  MÓDULO          │ DEPENDE DE      │ JOINs │ TIPO  │ ACCIÓN   ║
╠════════════════════════════════════════════════════════════════╣
║  🔴 COMISIONES   │ Agendamiento    │  18   │ HARD  │ Trigger  ║
║  🟡 POS          │ Agendamiento    │   6   │ SOFT  │ Queries  ║
║  🟡 POS          │ Inventario      │   1   │ HARD  │ Trigger  ║
║  🟡 MARKETPLACE  │ Agendamiento    │   4   │ HARD  │ Trigger  ║
║  🟢 INVENTARIO   │ -               │   0   │ -     │ Ninguna  ║
║  🟢 AGENDAMIENTO │ -               │   0   │ -     │ Ninguna  ║
╚════════════════════════════════════════════════════════════════╝

Nivel de Acoplamiento:
  🔴 ALTO    (>10 JOINs)   - Acoplamiento fuerte
  🟡 MEDIO   (3-10 JOINs)  - Acoplamiento moderado
  🟢 BAJO    (0-2 JOINs)   - Bajo acoplamiento
```

---

## 📈 ANÁLISIS POR MÓDULO

### 1. CORE (Base del Sistema)

**Dependencias:** Ninguna (siempre activo)
**Dependen de él:** Todos los módulos
**JOINs salientes:** 5 (hacia agendamiento - pero son parte del mismo módulo realmente)
**JOINs entrantes:** 0

**Estado:** ✅ **INDEPENDIENTE**
**Acción requerida:** Ninguna

---

### 2. AGENDAMIENTO (Módulo Principal)

**Dependencias:** Core
**Dependen de él:** Comisiones, POS, Marketplace
**JOINs salientes:** 0
**JOINs entrantes:** 28 (18 comisiones + 6 pos + 4 marketplace)

**Estado:** 🔴 **ALTAMENTE REQUERIDO**

**Implicaciones:**
- Módulo más crítico del sistema (3 módulos dependen de él)
- NO puede desactivarse si cualquier otro módulo está activo
- Trigger SQL debe validar esto estrictamente

**Arquitectura:**
```
Agendamiento (base)
    ├── Profesionales
    ├── Servicios
    ├── Clientes
    ├── Horarios
    ├── Citas
    └── Bloqueos

  ↓ Consumido por ↓

├─ Comisiones (trigger automático)
├─ POS (clientes/profesionales opcionales)
└─ Marketplace (perfiles públicos)
```

---

### 3. INVENTARIO (Módulo Autónomo)

**Dependencias:** Core
**Dependen de él:** POS (FK HARD)
**JOINs salientes:** 0
**JOINs entrantes:** 1 (desde pos)

**Estado:** ✅ **INDEPENDIENTE** (pero requerido por POS)

**Implicaciones:**
- Puede usarse sin otros módulos
- Si POS está activo, inventario NO puede desactivarse (FK constraint)
- Trigger SQL ya valida esta dependencia

**Arquitectura:**
```
Inventario (autónomo)
    ├── Productos
    ├── Categorías
    ├── Proveedores
    ├── Movimientos
    └── Alertas

  ↓ Requerido por ↓

└─ POS (ventas_pos_items.producto_id NOT NULL)
```

---

### 4. POS (Módulo con Dependencias Mixtas)

**Dependencias:**
- Core (obligatorio)
- Inventario (HARD - FK constraint)
- Agendamiento (SOFT - FKs nullable)

**Dependen de él:** Ninguno
**JOINs salientes:** 7 (6 agendamiento + 1 inventario)
**JOINs entrantes:** 0

**Estado:** 🟡 **MODERADAMENTE ACOPLADO**

**Implicaciones:**
- Requiere queries condicionales para agendamiento
- No requiere queries condicionales para inventario (siempre presente)
- Trigger SQL debe validar dependencia de inventario

**Arquitectura:**
```
POS
    ├── Ventas
    └── Items Venta
         │
         ├─[HARD]─▶ Inventario.Productos (FK NOT NULL)
         │
         └─[SOFT]─▶ Agendamiento (FKs nullable)
                    ├── Clientes (opcional)
                    ├── Profesionales (opcional)
                    └── Citas (opcional)
```

**Escenarios de uso:**

| Módulos Activos | Funcionalidad POS | Queries Condicionales |
|-----------------|-------------------|-----------------------|
| Core + Inventario + POS | ❌ Ventas sin clientes ni profesionales | ⚠️ Teórico (poco práctico) |
| Core + Inventario + POS + Agendamiento | ✅ Ventas completas con clientes | ✅ Recomendado |

---

### 5. COMISIONES (Módulo Altamente Acoplado)

**Dependencias:**
- Core (obligatorio)
- Agendamiento (HARD - trigger automático)

**Dependen de él:** Ninguno
**JOINs salientes:** 18 (todos hacia agendamiento)
**JOINs entrantes:** 0

**Estado:** 🔴 **FUERTEMENTE ACOPLADO**

**Implicaciones:**
- NO puede existir sin agendamiento
- Comisiones se calculan automáticamente desde citas completadas (trigger)
- NO requiere queries condicionales (trigger SQL bloquea desactivación de agendamiento)

**Arquitectura:**
```
Comisiones (fuertemente acoplado)
    ├── Configuración
    ├── Comisiones Profesionales
    └── Historial

  ↑ Depende 100% de ↑

Agendamiento.Citas
    │
    └─[TRIGGER]─▶ calcular_comision_cita()
                  (ejecuta al completar cita)
```

**Queries afectadas:**
- `obtenerPorId()` - JOIN a profesionales, citas, clientes
- `listarPorProfesional()` - JOIN a profesionales, citas, clientes
- `obtenerEstadisticasPeriodo()` - JOIN a profesionales, citas, clientes
- `listarConfiguraciones()` - JOIN a profesionales, servicios

**Decisión arquitectónica:**
- ✅ Marcar agendamiento como `dependencies_hard` en manifest
- ✅ Trigger SQL previene desactivación de agendamiento si comisiones activo
- ❌ NO implementar queries condicionales (innecesario)

---

### 6. MARKETPLACE (Módulo de Publicación)

**Dependencias:**
- Core (obligatorio)
- Agendamiento (HARD - profesionales y servicios)

**Dependen de él:** Ninguno
**JOINs salientes:** 4 (todos hacia agendamiento)
**JOINs entrantes:** 0

**Estado:** 🟡 **MODERADAMENTE ACOPLADO**

**Implicaciones:**
- Publica perfiles de profesionales y servicios (read-only)
- NO puede existir sin agendamiento (no hay qué publicar)
- NO requiere queries condicionales (trigger SQL bloquea desactivación)

**Arquitectura:**
```
Marketplace (publicación)
    ├── Perfiles Públicos
    ├── Reseñas
    ├── Analytics
    └── Categorías

  ↑ Lee datos de ↑

Agendamiento
    ├── Profesionales (datos de perfil)
    ├── Servicios (catálogo público)
    └── Clientes (autores de reseñas)
```

**Queries afectadas:**
- `reseñas.obtenerPorId()` - JOIN a clientes, profesionales
- `reseñas.listarPorPerfil()` - JOIN a clientes, profesionales

**Decisión arquitectónica:**
- ✅ Marcar agendamiento como `dependencies_hard` en manifest
- ✅ Trigger SQL previene desactivación de agendamiento si marketplace activo
- ❌ NO implementar queries condicionales (innecesario)

---

## 🎯 ESTRATEGIA DE DESACOPLAMIENTO

### Opciones por Módulo

#### POS (6 JOINs hacia Agendamiento)

**Opción 1: Queries Condicionales** ✅ RECOMENDADO
- Pros: Mantiene flexibilidad, soporta ambos escenarios
- Contras: +6-8 horas implementación
- Decisión: ✅ Implementar

**Opción 2: Marcar como Dependencia HARD** ❌ NO RECOMENDADO
- Pros: Sin cambios en código
- Contras: Limita flexibilidad, POS siempre requiere agendamiento
- Decisión: ❌ Rechazar (escenario de tienda sin citas es válido)

#### Comisiones (18 JOINs hacia Agendamiento)

**Opción 1: Queries Condicionales** ❌ NO NECESARIO
- Pros: Ninguno (sin agendamiento no hay citas ni comisiones)
- Contras: +8-10 horas desperdiciadas
- Decisión: ❌ Rechazar

**Opción 2: Marcar como Dependencia HARD** ✅ RECOMENDADO
- Pros: Refleja realidad del negocio, sin cambios en código
- Contras: Ninguno (escenario válido)
- Decisión: ✅ Implementar (trigger SQL + manifest)

#### Marketplace (4 JOINs hacia Agendamiento)

**Opción 1: Queries Condicionales** ❌ NO NECESARIO
- Pros: Ninguno (sin profesionales/servicios no hay qué publicar)
- Contras: +3-4 horas desperdiciadas
- Decisión: ❌ Rechazar

**Opción 2: Marcar como Dependencia HARD** ✅ RECOMENDADO
- Pros: Refleja realidad del negocio, sin cambios en código
- Contras: Ninguno (escenario válido)
- Decisión: ✅ Implementar (trigger SQL + manifest)

---

## 📋 RESUMEN DE DECISIONES

| Módulo | JOINs | Estrategia | Implementación | Horas |
|--------|-------|------------|----------------|-------|
| POS → Agendamiento | 6 | Queries Condicionales | 3 funciones | 6-8h |
| POS → Inventario | 1 | Trigger SQL (HARD) | ✅ Ya en plan | 0h |
| Comisiones → Agendamiento | 18 | Trigger SQL (HARD) | Actualizar manifest + trigger | 1h |
| Marketplace → Agendamiento | 4 | Trigger SQL (HARD) | Actualizar manifest + trigger | 1h |
| Core → Agendamiento | 5 | Mover a módulo agendamiento | Migración archivos | 0h |
| **TOTAL** | **34** | - | - | **8-10h** |

---

## ✅ VALIDACIÓN DE ESCENARIOS

### Escenarios Válidos de Combinaciones

| # | Módulos Activos | Queries Condicionales | Triggers SQL | Válido |
|---|-----------------|----------------------|--------------|--------|
| 1 | Core + Agendamiento | - | - | ✅ Sí |
| 2 | Core + Agendamiento + Comisiones | - | ✅ Valida | ✅ Sí |
| 3 | Core + Agendamiento + Marketplace | - | ✅ Valida | ✅ Sí |
| 4 | Core + Inventario | - | - | ✅ Sí (tienda pura) |
| 5 | Core + Inventario + POS | ✅ Agendamiento OFF | - | ✅ Sí (tienda sin citas) |
| 6 | Core + Inventario + POS + Agendamiento | ✅ Agendamiento ON | - | ✅ Sí (uso completo) |
| 7 | Core + Comisiones (sin Agendamiento) | - | ❌ Bloqueado | ❌ No (inválido) |
| 8 | Core + Marketplace (sin Agendamiento) | - | ❌ Bloqueado | ❌ No (inválido) |
| 9 | Core + POS (sin Inventario) | - | ❌ Bloqueado | ❌ No (FK constraint) |

**Conclusión:** De 9 escenarios teóricos, 6 son válidos (67%). Los 3 inválidos están bloqueados por triggers SQL.

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Documentación (2 horas) - DÍA 1

✅ Tareas:
1. Actualizar manifests con `dependencies_hard`
2. Documentar escenarios válidos e inválidos
3. Actualizar CLAUDE.md con matriz de dependencias

### Fase 2: Triggers SQL (2 horas) - DÍA 2

✅ Tareas:
1. Actualizar `sql/nucleo/05-funciones-modulos.sql`
2. Agregar validación Comisiones → Agendamiento
3. Agregar validación Marketplace → Agendamiento
4. Testing triggers en BD staging

### Fase 3: Queries Condicionales POS (6-8 horas) - DÍA 3-4

✅ Tareas:
1. Implementar helpers de verificación módulos
2. Modificar `pos/ventas.model.js` (2 funciones)
3. Modificar `pos/reportes.model.js` (1 función)
4. Testing unitario e integración

### Fase 4: Validación (2 horas) - DÍA 5

✅ Tareas:
1. Testing de todos los escenarios válidos
2. Performance benchmarks
3. Code review
4. Documentación finalizada

---

## 📊 MÉTRICAS DE CALIDAD

### Cobertura de Escenarios

| Métrica | Valor | Estado |
|---------|-------|--------|
| Escenarios totales identificados | 9 | ✅ Completo |
| Escenarios válidos | 6 (67%) | ✅ Cubiertos |
| Escenarios inválidos bloqueados | 3 (33%) | ✅ Triggers SQL |
| Queries condicionales necesarios | 3 funciones | ✅ Identificadas |
| Dependencias HARD documentadas | 4 | ✅ Manifests |

### Reducción de Acoplamiento

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| JOINs cross-module sin validación | 34 | 6 | 82% reducción |
| Módulos con acoplamiento fuerte | 3 | 1 (POS) | 67% mejora |
| Dependencias no documentadas | 34 | 0 | 100% documentado |

---

## 🎉 CONCLUSIÓN

### ✅ Buenas Noticias

1. **Acoplamiento MENOR de lo esperado:** Solo 29.8% de JOINs son cross-module
2. **MAYORÍA resuelto con triggers:** 28 de 34 JOINs (82%) no requieren queries condicionales
3. **Solo 1 módulo necesita cambios:** POS (6-8 horas de trabajo)
4. **Arquitectura clara:** Dependencias bien definidas y justificadas

### 🎯 Impacto en el Plan Original

| Aspecto | Plan Original | Plan Ajustado | Delta |
|---------|---------------|---------------|-------|
| Archivos a modificar | "3 archivos" (estimado) | 2 archivos (3 funciones) | ✅ Mejor |
| Tiempo queries condicionales | 8 horas | 6-8 horas | ✅ Igual |
| Tiempo total Fase 2.7 | 8 horas | 8-10 horas | ✅ +2h (aceptable) |
| Cronograma general | 10 semanas | 10 semanas + 1 día | ✅ Impacto mínimo |

### 🚀 Listo para Implementación

Este análisis confirma que el **Plan de Arquitectura Modular es viable y bien fundamentado**. Las dependencias SQL están controladas y la estrategia de queries condicionales + triggers SQL es la correcta.

---

**Versión:** 1.0
**Fecha:** 23 Noviembre 2025
**Autor:** Arquitecto de Software
**Estado:** ✅ ANÁLISIS COMPLETO - APROBADO PARA IMPLEMENTACIÓN

