# 🚀 FASE 8 - Siguientes Tareas

**Versión:** 1.0
**Fecha:** 25 Octubre 2025
**Basado en:** Fase 7 - Sistema Integral de Disponibilidad (95% completado)

---

## 📋 TAREAS PENDIENTES

### ✅ ~~PRIORIDAD ALTA - FIX CRÍTICO~~ **COMPLETADO**

#### 1. ~~Resolver Test Fallando~~ ✅ **RESUELTO** (20 min)

**Issue:** Test `auto-generacion-codigo.test.js` fallando (1/545 tests)

**Causa Real Encontrada:**
Bug en comparación de horas con formatos mixtos:
- Test pasaba: `"15:00"` (HH:MM)
- BD retornaba: `"15:00:00"` (HH:MM:SS)
- Comparación lexicográfica fallaba: `"15:00" < "15:00:00"` → true (por longitud)

**Solución Implementada:**
```javascript
// backend/app/utils/cita-validacion.util.js

// Nueva función helper
static normalizarHora(hora) {
    if (!hora) return null;
    if (hora.length === 8) return hora;      // Ya es HH:MM:SS
    if (hora.length === 5) return `${hora}:00`; // HH:MM → HH:MM:SS
    return hora;
}

// Fix en haySolapamientoHorario
static haySolapamientoHorario(inicio1, fin1, inicio2, fin2) {
    // ✅ Normalizar ANTES de comparar
    const i1 = this.normalizarHora(inicio1);
    const f1 = this.normalizarHora(fin1);
    const i2 = this.normalizarHora(inicio2);
    const f2 = this.normalizarHora(fin2);

    return i1 < f2 && f1 > i2;
}
```

**Resultado:**
- ✅ **545/545 tests pasando (100%)**
- ✅ Bug de detección de conflictos corregido
- ✅ Normalización automática de formatos horarios
- ✅ CI/CD ready

**Archivos Modificados:**
- `backend/app/utils/cita-validacion.util.js` (+ función normalizarHora)

**Tiempo Real:** 20 minutos

---

### 🟡 PRIORIDAD MEDIA - FUNCIONALIDAD OPCIONAL

#### 2. Implementar Calendario Disponibilidad Frontend (3-4h)

**Objetivo:**
Permitir a admins/empleados ver disponibilidad en vista calendario interactivo.

**Componentes a Crear:**

**1. Hook `useDisponibilidad`** (~80 líneas)

```javascript
// frontend/src/hooks/useDisponibilidad.js
import { useQuery } from '@tanstack/react-query';
import { disponibilidadApi } from '@/services/api/endpoints';

export function useDisponibilidad({
  fecha,
  servicioId,
  profesionalId = null,
  rangoDias = 7,
  soloDisponibles = true
}) {
  return useQuery({
    queryKey: ['disponibilidad', { fecha, servicioId, profesionalId, rangoDias }],
    queryFn: async () => {
      const response = await disponibilidadApi.consultar({
        fecha,
        servicio_id: servicioId,
        profesional_id: profesionalId,
        rango_dias: rangoDias,
        solo_disponibles: soloDisponibles
      });
      return response.data.data;
    },
    enabled: !!(fecha && servicioId),
    staleTime: 30 * 1000, // 30 segundos (datos cambian rápido)
  });
}
```

**2. Endpoint API** (~20 líneas)

```javascript
// frontend/src/services/api/endpoints.js
export const disponibilidadApi = {
  consultar: (params) => apiClient.get('/api/v1/disponibilidad', { params }),
};
```

**3. Componente `CalendarioDisponibilidad`** (~120 líneas)

```javascript
// frontend/src/components/disponibilidad/CalendarioDisponibilidad.jsx
import { useState } from 'react';
import { useDisponibilidad } from '@/hooks/useDisponibilidad';

function CalendarioDisponibilidad({ servicioId, profesionalId }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data, isLoading } = useDisponibilidad({
    fecha: fechaSeleccionada,
    servicioId,
    profesionalId,
    rangoDias: 7
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-7 gap-2">
      {data?.disponibilidad_por_fecha.map((dia) => (
        <DiaDisponibilidad
          key={dia.fecha}
          fecha={dia.fecha}
          profesionales={dia.profesionales}
          onClick={() => setFechaSeleccionada(dia.fecha)}
        />
      ))}
    </div>
  );
}
```

**4. Integración en `CitasPage`**

```javascript
// Agregar tab "Disponibilidad"
<button
  onClick={() => setVistaActiva('disponibilidad')}
  className={vistaActiva === 'disponibilidad' ? 'active' : ''}
>
  <Calendar className="w-5 h-5" />
  Vista Disponibilidad
</button>

{vistaActiva === 'disponibilidad' && (
  <CalendarioDisponibilidad
    servicioId={filtros.servicio_id}
    profesionalId={filtros.profesional_id}
  />
)}
```

**Tiempo Estimado:** 3-4 horas

**Valor de Negocio:**
- 🟡 **Medio** - UX mejorada para admins
- ✅ Backend ya disponible (sin cambios necesarios)
- 📊 Útil para demo/presentaciones

**Decisión:** Implementar solo si:
- Se requiere para demo a clientes
- Admins/empleados piden esta funcionalidad
- Hay tiempo disponible antes de launch

---

### 🟢 PRIORIDAD BAJA - OPTIMIZACIONES FUTURAS

#### 3. Cache Redis para Disponibilidad (2h)

**Objetivo:**
Reducir carga en DB para consultas repetidas de disponibilidad.

**Implementación:**
```javascript
// backend/app/database/disponibilidad.model.js
const cacheKey = `disp:${organizacionId}:${servicioId}:${fecha}:${profesionalId || 'all'}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await this.consultarDisponibilidad(...);
await redis.setex(cacheKey, 120, JSON.stringify(result)); // TTL 2 min
return result;
```

**Beneficio:**
- ⚡ ~80-90% reducción tiempo respuesta en consultas repetidas
- 📉 Menor carga DB

**Complejidad:** Media

---

#### 4. Paginación de Response (1h)

**Objetivo:**
Evitar responses gigantes cuando se consultan muchos días/profesionales.

**Implementación:**
```javascript
// Si total_slots > 100, paginar
if (totalSlots > 100) {
  return {
    data: slots.slice(offset, offset + limit),
    pagination: {
      total: totalSlots,
      page: currentPage,
      limit,
      hasMore: offset + limit < totalSlots
    }
  };
}
```

**Beneficio:**
- 📉 Menor payload en red
- ⚡ Render más rápido en frontend

**Complejidad:** Baja

---

## 🎯 CRITERIOS DE DECISIÓN

### ¿Implementar Calendario Frontend?

**SÍ, si:**
- ✅ Hay demo/presentación próxima
- ✅ Admins piden esta funcionalidad
- ✅ Hay 4+ horas disponibles

**NO, si:**
- ❌ Prioridad es lanzar MVP rápido
- ❌ Vista lista actual es suficiente
- ❌ Hay otras features más críticas

### ¿Implementar Cache Redis?

**SÍ, si:**
- ✅ Tráfico esperado > 100 consultas/min
- ✅ Hay problemas de performance en producción
- ✅ Múltiples usuarios consultan mismos horarios

**NO, si:**
- ❌ Tráfico bajo/medio (< 50 consultas/min)
- ❌ Performance actual es aceptable
- ❌ Redis no está configurado aún

---

## 📊 ESTIMACIÓN DE TIEMPO

| Tarea | Prioridad | Tiempo | Estado |
|-------|-----------|--------|--------|
| Fix test fallando | ⚠️ Alta | 30 min | 🔴 Pendiente |
| Calendario frontend | 🟡 Media | 3-4h | 🟡 Opcional |
| Cache Redis | 🟢 Baja | 2h | 🟢 Futuro |
| Paginación | 🟢 Baja | 1h | 🟢 Futuro |

**Total Mínimo (Alta):** 30 min
**Total Completo (Alta + Media):** 3.5-4.5h
**Total Optimizaciones (Todas):** 6.5-7.5h

---

## 🚦 RECOMENDACIÓN

### Path Mínimo Viable (30 min):
1. ✅ Fix test fallando
2. ✅ Deploy a producción

### Path Completo (4h):
1. ✅ Fix test fallando
2. ✅ Implementar calendario frontend
3. ✅ Deploy a producción

### Path Optimizado (7h):
1. ✅ Fix test fallando
2. ✅ Implementar calendario frontend
3. ✅ Cache Redis
4. ✅ Paginación
5. ✅ Deploy a producción

**Decisión sugerida:** **Path Mínimo Viable** + evaluar calendario según feedback usuarios.

---

**Versión:** 1.0
**Creado:** 25 Octubre 2025
**Estado:** 🔴 Pendiente de inicio
**Dependencias:** Fase 7 completada ✅
