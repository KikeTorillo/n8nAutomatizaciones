# 🐛 Análisis de Duplicados en Hooks - Frontend

**Fecha:** 21 Octubre 2025
**Archivo Problemático:** `frontend/src/hooks/useDashboard.js`

---

## 📊 Resumen Ejecutivo

Se encontraron **3 funciones duplicadas** en `useDashboard.js` que existen en hooks especializados, causando:

- ✅ **Inconsistencia de cache** (queryKeys diferentes)
- ✅ **Funcionalidad limitada** (versiones sin parámetros)
- ✅ **Código duplicado** (~60 líneas)
- ✅ **Posibles bugs silenciosos** (dos fuentes de verdad)

---

## 🔍 Duplicados Identificados

### 1. useCitasDelDia() ⚠️ CRÍTICO

**Ubicaciones:**
- `useDashboard.js:25-41` (17 líneas)
- `useCitas.js:73-89` (17 líneas)

**Diferencias:**

| Aspecto | useDashboard.js | useCitas.js | Impacto |
|---------|----------------|-------------|---------|
| **queryKey** | `['citas-del-dia', hoy]` | `['citas', 'hoy', hoy]` | ⚠️ Cache inconsistente |
| **staleTime** | 2 minutos | 1 minuto | Diferentes tiempos de cache |
| **refetchInterval** | 5 minutos | 2 minutos | Diferentes refetch |
| **null safety** | `.data.data.citas \|\| []` | `.data?.data?.citas \|\| []` | Optional chaining mejor |

**Problema CRÍTICO:**
```javascript
// Dashboard.jsx usa queryKey: ['citas-del-dia', '2025-10-21']
const { data: citasDelDia } = useCitasDelDia(); // useDashboard.js

// Otro componente usa queryKey: ['citas', 'hoy', '2025-10-21']
const { data: citasHoy } = useCitasDelDia(); // useCitas.js

// ❌ React Query ve dos queries DIFERENTES
// ❌ Cache duplicado, invalidaciones inconsistentes
// ❌ Posibles estados desincronizados
```

**Uso actual:**
- `Dashboard.jsx:11,39` - Importa de useDashboard.js
- Otros componentes podrían importar de useCitas.js

---

### 2. useProfesionales() ⚠️ FUNCIONALIDAD LIMITADA

**Ubicaciones:**
- `useDashboard.js:46-56` (11 líneas)
- `useProfesionales.js:8-28` (21 líneas)

**Diferencias:**

| Aspecto | useDashboard.js | useProfesionales.js |
|---------|----------------|---------------------|
| **Parámetros** | ❌ Sin parámetros | ✅ `params = {}` |
| **Filtros** | ❌ No soporta | ✅ activo, tipo_profesional, busqueda |
| **Sanitización** | ❌ No sanitiza | ✅ Sanitiza params vacíos |
| **queryKey** | `['profesionales']` | `['profesionales', params]` |
| **staleTime** | 2 minutos | 5 minutos |

**Problema:**
```javascript
// Dashboard.jsx - NO puede filtrar
const { data: profesionales } = useProfesionales(); // todos

// Otro componente - SÍ puede filtrar
const { data: barberos } = useProfesionales({
  tipo_profesional: 'barbero',
  activo: true
});
```

**Uso actual:**
- `Dashboard.jsx:12,40`
- `WalkInModal.jsx:8`
- `ClienteForm.jsx:5`

---

### 3. useClientes() ⚠️ SIN PAGINACIÓN

**Ubicaciones:**
- `useDashboard.js:77-89` (13 líneas)
- `useClientes.js:7-29` (23 líneas)

**Diferencias:**

| Aspecto | useDashboard.js | useClientes.js |
|---------|----------------|----------------|
| **Parámetros** | ❌ Sin parámetros | ✅ `params = {}` |
| **Paginación** | ❌ No retorna | ✅ Retorna `pagination` |
| **Filtros** | ❌ No soporta | ✅ busqueda, page, limit |
| **Sanitización** | ❌ No sanitiza | ✅ Sanitiza params |
| **keepPreviousData** | ❌ No usa | ✅ true (UX mejor) |
| **staleTime** | 3 minutos | 5 minutos |

**Problema:**
```javascript
// Dashboard.jsx - retorna array simple
const { data: clientes } = useClientes(); // [...]

// Otro componente - retorna objeto con paginación
const { data } = useClientes({ page: 1, limit: 20 });
// { clientes: [...], pagination: { total, page, pages } }
```

**Uso actual:**
- `Dashboard.jsx:14,42`

---

## 🚨 Impacto en el Código

### Archivos Afectados (3)

1. **Dashboard.jsx** (líneas 9-16)
   - Importa las 3 funciones duplicadas
   - Usa versiones limitadas sin parámetros

2. **WalkInModal.jsx** (línea 8)
   - Importa `useProfesionales` de useDashboard.js
   - No puede filtrar profesionales activos

3. **ClienteForm.jsx** (línea 5)
   - Importa `useProfesionales` de useDashboard.js
   - No puede filtrar por tipo

---

## 📉 Consecuencias

### 1. Cache Inconsistente (useCitasDelDia)

**Escenario:**
```javascript
// Component A
queryClient.invalidateQueries(['citas-del-dia']); // Invalida dashboard

// Component B
queryClient.invalidateQueries(['citas']); // NO invalida dashboard

// ❌ Dashboard muestra datos obsoletos
```

### 2. Funcionalidad Perdida

**useProfesionales:**
- ❌ No se pueden filtrar profesionales por tipo
- ❌ No se puede buscar por nombre
- ❌ No se puede filtrar solo activos

**useClientes:**
- ❌ No hay paginación en dashboard
- ❌ No se pueden filtrar clientes
- ❌ No hay búsqueda

### 3. Mantenimiento Duplicado

Si se arregla un bug en `useCitas.js`, hay que arreglarlo también en `useDashboard.js`

---

## ✅ Solución Recomendada

### Opción 1: Eliminar Duplicados (RECOMENDADA)

**Paso 1:** Actualizar imports en componentes afectados

```diff
// Dashboard.jsx
- import { useCitasDelDia, useProfesionales, useClientes } from '@/hooks/useDashboard';
+ import { useCitasDelDia } from '@/hooks/useCitas';
+ import { useProfesionales } from '@/hooks/useProfesionales';
+ import { useClientes } from '@/hooks/useClientes';
```

**Paso 2:** Eliminar funciones de useDashboard.js

```diff
// useDashboard.js - ELIMINAR estas funciones:
- export function useCitasDelDia() { ... }  (líneas 25-41)
- export function useProfesionales() { ... } (líneas 46-56)
- export function useClientes() { ... }      (líneas 77-89)
```

**Paso 3:** Adaptar código si es necesario

```diff
// Dashboard.jsx
- const { data: clientes } = useClientes(); // array simple
+ const { data } = useClientes();
+ const clientes = data?.clientes || [];
```

---

### Opción 2: Re-exportar desde Hooks Originales

```javascript
// useDashboard.js
export { useCitasDelDia } from './useCitas';
export { useProfesionales } from './useProfesionales';
export { useClientes } from './useClientes';
```

**Pros:**
- ✅ No rompe imports existentes
- ✅ Elimina duplicación
- ✅ Cache consistente

**Contras:**
- ⚠️ Puede confundir (¿por qué importar de useDashboard?)

---

## 📝 Plan de Acción

### Prioridad ALTA (resolver en ≤2 días)

- [ ] Actualizar imports en Dashboard.jsx
- [ ] Actualizar imports en WalkInModal.jsx
- [ ] Actualizar imports en ClienteForm.jsx
- [ ] Eliminar useCitasDelDia() de useDashboard.js
- [ ] Eliminar useProfesionales() de useDashboard.js
- [ ] Eliminar useClientes() de useDashboard.js
- [ ] Verificar que tests pasan
- [ ] Probar manualmente dashboard y walk-in

### Prioridad MEDIA (buenas prácticas)

- [ ] Agregar comentario en useDashboard.js explicando su propósito
- [ ] Considerar renombrar useDashboard.js a useEstadisticasOrganizacion.js
- [ ] Auditar otros hooks por duplicados

---

## 🎯 Resultado Esperado

**Antes:**
- 3 funciones duplicadas (60 líneas)
- Cache inconsistente
- Funcionalidad limitada

**Después:**
- 0 duplicados
- Cache unificado con queryKeys correctos
- Funcionalidad completa (filtros, paginación)
- Menos código que mantener

---

## 📌 Notas Adicionales

### Función NO Duplicada (OK)

**useServiciosDashboard()** - ✅ NO está duplicada
- Renombrada intencionalmente para evitar conflicto
- Comentario explica el porqué (línea 59-61)
- **Mantener como está**

### Otras Funciones en useDashboard.js (OK)

- `useEstadisticasOrganizacion()` - ✅ Única, no duplicada
- `useBloqueosDashboard()` - ✅ Versión específica para dashboard (OK)

---

**Estado:** 🔴 Crítico - Requiere refactorización
**Esfuerzo:** ~2 horas
**Riesgo:** Bajo (tests existentes validan funcionalidad)
