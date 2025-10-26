# 📋 Tareas Pendientes

**Última Actualización:** 26 Octubre 2025
**Estado Sistema:** ✅ **Production Ready** - 545/545 tests pasando

---

## 🟡 OPCIONAL - Calendario Disponibilidad Frontend

**Estado:** Pendiente de decisión según necesidad de negocio

### Objetivo
Permitir a admins/empleados ver disponibilidad en vista calendario interactivo.

### Componentes a Crear

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
    staleTime: 30 * 1000,
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

Vista de calendario mostrando slots disponibles/ocupados por día y profesional.

**4. Integración en `CitasPage`**

Agregar nuevo tab "Vista Disponibilidad" junto a "Vista Lista" y "Vista Calendario".

### Tiempo Estimado
3-4 horas

### Valor de Negocio
- 🟡 **Medio** - Mejora UX para admins
- ✅ Backend ya disponible (endpoint `/api/v1/disponibilidad`)
- 📊 Útil para demos/presentaciones
- ⏰ **No es blocker** para producción

### Criterios de Decisión

**Implementar SI:**
- ✅ Hay demo/presentación próxima y se requiere mostrar
- ✅ Admins/empleados solicitan explícitamente esta funcionalidad
- ✅ Hay 4+ horas disponibles antes de otras prioridades

**NO implementar SI:**
- ❌ Prioridad es lanzar MVP rápido
- ❌ Vista lista actual es suficiente para operación
- ❌ Hay features más críticas pendientes

---

## 🟢 OPTIMIZACIONES FUTURAS (Baja Prioridad)

### 1. Cache Redis para Disponibilidad (2h)

**Cuándo implementar:**
- Tráfico > 100 consultas/min detectado en producción
- Problemas de performance identificados
- Múltiples usuarios consultan mismos horarios frecuentemente

**Beneficio:**
- ⚡ ~80-90% reducción tiempo respuesta en consultas repetidas
- 📉 Menor carga DB

---

### 2. Paginación de Response (1h)

**Cuándo implementar:**
- Consultas retornan > 100 slots frecuentemente
- Payload grande afecta tiempo de respuesta

**Beneficio:**
- 📉 Menor payload en red
- ⚡ Render más rápido en frontend

---

## 🎯 Recomendación

**Deploy a Producción:** ✅ Listo ahora (sin blockers)

**Calendario Frontend:** Evaluar según feedback usuarios en producción

**Optimizaciones:** Implementar solo si métricas en producción lo justifican

---

**Versión:** 1.0
**Estado:** 🟢 Sistema operativo completo
