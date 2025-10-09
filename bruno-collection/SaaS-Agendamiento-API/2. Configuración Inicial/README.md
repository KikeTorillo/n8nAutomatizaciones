# Flujo 2: Configuración Inicial

Este flujo representa el **Setup Wizard** que ejecuta el usuario después del onboarding para dejar su organización 100% operativa.

## 🎯 Objetivo

Configurar la organización para que esté lista para recibir y gestionar citas de clientes.

---

## 📋 Secuencia de Requests

| # | Request | Descripción | Variables guardadas |
|---|---------|-------------|---------------------|
| 1 | **Configurar Horarios Profesional** | Define horarios de atención del profesional creado en onboarding | - |
| 2 | **Listar Servicios Plantilla** | Muestra servicios automáticos aplicados en onboarding | `servicioId` |
| 3 | **Actualizar Servicio** | Personaliza precios y duración de servicios existentes | - |
| 4 | **Agregar Nuevo Servicio** | Crea servicios adicionales específicos del negocio | `nuevoServicioId` |
| 5 | **Verificar Configuración Completa** | Valida que la organización está lista para operar | - |

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  PREREQUISITO: Flujo 1 - Onboarding completado             │
│  - Token JWT guardado                                       │
│  - organizacionId guardado                                  │
│  - profesionalId guardado                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Configurar Horarios                                │
│  - Define cuándo trabaja el profesional                     │
│  - Ejemplo: Lunes a Viernes, 9:00 - 18:00                   │
│  - Slots de 30 minutos                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: Listar Servicios Plantilla                         │
│  - Ver servicios automáticos creados en onboarding          │
│  - Ejemplo: Corte, Barba, Afeitado (barbería)              │
│  - Guarda servicioId para edición                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: Actualizar Servicio (Opcional)                     │
│  - Personaliza precios de servicios plantilla               │
│  - Ajusta duraciones según tu negocio                       │
│  - Ejemplo: Corte $150 → $250 (premium)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: Agregar Nuevo Servicio (Opcional)                  │
│  - Crea servicios únicos de tu negocio                      │
│  - Asigna profesionales autorizados                         │
│  - Ejemplo: Tratamiento especial de barba                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: Verificar Configuración Completa                   │
│  ✅ Organización activa                                     │
│  ✅ Profesional con horarios                                │
│  ✅ Servicios configurados                                  │
│  🎉 LISTO PARA RECIBIR CITAS                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Variables de Entorno Requeridas

Estas variables deben estar guardadas del **Flujo 1 - Onboarding**:

- `token` - JWT Bearer token del usuario admin
- `organizacionId` - ID de la organización creada
- `profesionalId` - ID del profesional creado en onboarding

---

## ✅ Checklist de Configuración

Antes de pasar al siguiente flujo, asegúrate de que:

- [x] **Horarios configurados**: Al menos 1 día con horarios definidos
- [x] **Servicios activos**: Al menos 1 servicio con precio y duración
- [x] **Organización activa**: `activo: true` y `suspendido: false`
- [x] **Profesional activo**: Tiene servicios asignados

---

## 🎨 Personalización por Industria

### Barbería
```json
{
  "servicios": ["Corte Clásico", "Barba", "Afeitado", "Tinte"],
  "duracion_slot": 30,
  "horario_tipico": "09:00 - 19:00"
}
```

### Salón de Belleza
```json
{
  "servicios": ["Corte", "Tinte", "Peinado", "Manicure"],
  "duracion_slot": 45,
  "horario_tipico": "10:00 - 20:00"
}
```

### Spa
```json
{
  "servicios": ["Masaje Relajante", "Facial", "Exfoliación"],
  "duracion_slot": 60,
  "horario_tipico": "08:00 - 22:00"
}
```

### Consultorio Médico
```json
{
  "servicios": ["Consulta General", "Chequeo", "Seguimiento"],
  "duracion_slot": 30,
  "horario_tipico": "08:00 - 18:00"
}
```

---

## 🚀 Próximos Pasos

Una vez completada la configuración inicial:

1. **Flujo 3: Catálogo de Servicios** - Gestionar profesionales y servicios a largo plazo
2. **Flujo 4: Agendamiento Manual** - Crear la primera cita de cliente
3. **Flujo 5: Agendamiento IA WhatsApp** - Automatizar agendamiento con IA

---

## 💡 Notas Importantes

### Horarios Recurrentes

Para configurar horarios que se repiten (ej: Lunes a Viernes, 9-18h):

```json
{
  "tipo_horario": "regular",
  "es_recurrente": true,
  "dias_semana": [1, 2, 3, 4, 5],
  "hora_inicio": "09:00:00",
  "hora_fin": "18:00:00",
  "fecha_inicio_recurrencia": "2025-10-15",
  "fecha_fin_recurrencia": "2025-12-31"
}
```

### Servicios con Múltiples Profesionales

Si tienes varios profesionales que ofrecen el mismo servicio:

```json
{
  "nombre": "Corte de Cabello",
  "profesionales_ids": [1, 2, 3]
}
```

El sistema de agendamiento mostrará disponibilidad de cualquiera de los 3.

---

## ⚠️ Validaciones del Sistema

El backend valida automáticamente:

- ✅ **Horarios**: No se permiten solapamientos para el mismo profesional
- ✅ **Servicios**: Nombres únicos por organización
- ✅ **Profesionales**: Deben estar activos para asociarlos a servicios
- ✅ **RLS**: Todas las operaciones respetan el multi-tenant

---

## 📊 Resultado Esperado

Al finalizar este flujo, la organización tendrá:

```json
{
  "organizacion": {
    "activo": true,
    "suspendido": false,
    "plan_actual": "basico"
  },
  "profesionales": [
    {
      "id": 1,
      "nombre_completo": "Juan Pérez",
      "activo": true,
      "horarios_configurados": true
    }
  ],
  "servicios": [
    {
      "id": 1,
      "nombre": "Corte de Cabello Premium",
      "precio": 250.00,
      "duracion_minutos": 45,
      "activo": true
    }
  ],
  "estado_setup": "✅ COMPLETO - LISTO PARA OPERAR"
}
```

---

## 🎯 KPI de Configuración

| Métrica | Mínimo | Recomendado | Óptimo |
|---------|--------|-------------|--------|
| Profesionales activos | 1 | 2-3 | 5+ |
| Servicios configurados | 1 | 3-5 | 10+ |
| Días con horarios | 1 | 5 (L-V) | 7 |
| Slots disponibles/día | 10 | 20 | 30+ |

---

**Estado del Flujo**: ✅ Colección completa y lista para usar
**Siguiente Flujo**: 3. Catálogo de Servicios (gestión continua)
