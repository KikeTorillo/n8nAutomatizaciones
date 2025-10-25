# 🗓️ FASE 7 - Sistema Integral de Disponibilidad y Agendamiento

**Versión:** 1.0
**Fecha:** 24 Octubre 2025
**Estado:** 📋 Planificado - Listo para implementación
**Prioridad:** 🔴 Alta

---

## 📊 RESUMEN EJECUTIVO

### Objetivo

Implementar un **sistema reutilizable de consulta de disponibilidad** que sirva a múltiples canales (chatbot, frontend admin, portal cliente futuro) con un único endpoint bien diseñado.

### Motivación

El chatbot IA actualmente **no puede verificar disponibilidad** antes de crear citas porque:
- ❌ Tool MCP `verificarDisponibilidad` apunta a endpoint inexistente
- ❌ Endpoint actual `/disponibilidad-inmediata` solo sirve para walk-ins (HOY)
- ❌ No hay forma de consultar horarios futuros con granularidad de slots

### Alcance Ampliado (Pensando a Futuro)

Este mismo endpoint también servirá para:
- ✅ **Frontend Admin:** Calendario visual de disponibilidad al crear citas
- ✅ **Portal Cliente Futuro:** Selección de horarios en app móvil/web
- ✅ **Integraciones Externas:** Widget de agendamiento embebido
- ✅ **API Pública:** Consultas de terceros (futuro)

---

## 🎯 CASOS DE USO

### 1. Chatbot IA (Prioridad Alta)

**Flujo:**
```
Usuario: "¿Tienen disponible mañana a las 3pm?"
Bot → MCP Tool verificarDisponibilidad
    → GET /api/v1/disponibilidad?fecha=2025-10-26&servicio_id=1&hora=15:00
    → Analiza slot específico
    → Responde: "Sí, tenemos disponible a las 3pm con Juan Pérez"
```

**Necesidades:**
- Consulta rápida por slot específico (fecha + hora)
- Interpretación NLP de fechas ("mañana", "lunes próximo")
- Response optimizada para IA (JSON simple)

---

### 2. Frontend Admin/Empleado (Prioridad Alta)

**Flujo:**
```
Empleado creando cita:
1. Selecciona servicio
2. Ve calendario semanal con disponibilidad de todos los profesionales
3. Click en slot verde → Formulario pre-llenado con fecha/hora/profesional
4. Confirma cita
```

**Necesidades:**
- Vista de múltiples días (rango 1-14 días)
- Disponibilidad de múltiples profesionales en paralelo
- Detalles de ocupación (quién tiene la cita, notas)
- Diferenciación visual: disponible/ocupado/bloqueado/fuera de horario

---

### 3. Portal Cliente Futuro (Prioridad Media)

**Flujo:**
```
Cliente en app móvil:
1. "Quiero corte de cabello"
2. Selecciona profesional o "el primero disponible"
3. Ve calendario con horarios disponibles
4. Selecciona slot → Bloqueo temporal 5 min
5. Confirma cita
```

**Necesidades:**
- Solo ver slots disponibles (sin razones de bloqueo)
- NO ver datos de otros clientes (privacidad)
- Optimizado para mobile (response ligera)
- Soporte para bloqueo temporal de slots

---

## 🏗️ ARQUITECTURA PROPUESTA

### Endpoints (2 Complementarios)

```javascript
// ================================================================
// ENDPOINT 1: DISPONIBILIDAD GENERAL (NUEVO) ⭐
// ================================================================
GET /api/v1/disponibilidad

Query params:
- fecha (requerido)               // YYYY-MM-DD, "hoy", o ISO
- servicio_id (requerido)         // Filtra profesionales que ofrecen el servicio
- profesional_id (opcional)       // Si se especifica, solo ese profesional
- hora (opcional)                 // HH:MM - Consulta slot específico
- duracion (opcional)             // Minutos (default: duración del servicio)
- rango_dias (opcional)           // 1-14 días (default: 1)
- intervalo_minutos (opcional)    // 15, 30, 60 (default: 30)
- solo_disponibles (opcional)     // true/false (default: true)

Response:
{
  "success": true,
  "data": {
    "servicio": {
      "id": 1,
      "nombre": "Corte de Cabello",
      "duracion_minutos": 30,
      "precio": 150.00
    },
    "disponibilidad_por_fecha": [
      {
        "fecha": "2025-10-25",
        "dia_semana": "viernes",
        "profesionales": [
          {
            "profesional_id": 1,
            "nombre": "Juan Pérez",
            "slots": [
              {
                "hora": "09:00",
                "disponible": true,
                "duracion_disponible": 120,  // minutos contiguos libres
                "razon_no_disponible": null
              },
              {
                "hora": "10:00",
                "disponible": false,
                "duracion_disponible": 0,
                "razon_no_disponible": "Cita existente",
                "cita_id": 123,              // Solo roles admin/empleado
                "cliente_nombre": "María G." // Solo roles admin/empleado
              },
              {
                "hora": "14:00",
                "disponible": false,
                "razon_no_disponible": "Fuera de horario laboral"
              }
            ],
            "total_slots_disponibles": 15,
            "horario_laboral": {
              "inicio": "09:00",
              "fin": "19:00"
            }
          }
        ],
        "total_slots_disponibles_dia": 30
      }
    ],
    "metadata": {
      "total_profesionales": 3,
      "rango_fechas": { "desde": "2025-10-25", "hasta": "2025-10-25" },
      "generado_en": "2025-10-24T18:30:00Z"
    }
  }
}

// ================================================================
// ENDPOINT 2: DISPONIBILIDAD INMEDIATA (EXISTENTE - MANTENER)
// ================================================================
GET /api/v1/citas/disponibilidad-inmediata

Uso: SOLO walk-ins (clientes sin cita que llegan HOY)
Query: servicio_id, profesional_id (opcional)
Response: Boolean simple disponible_ahora + proxima_disponibilidad

⚠️ NO modificar - Usado en producción por WalkInModal.jsx
```

---

### Niveles de Detalle por Rol (RLS + Filtrado)

| Campo Response | Cliente | Bot | Empleado | Admin |
|----------------|---------|-----|----------|-------|
| `hora`, `disponible` | ✅ | ✅ | ✅ | ✅ |
| `razon_no_disponible` | ❌ | ✅ Genérica | ✅ Completa | ✅ Completa |
| `cita_id` | ❌ | ❌ | ✅ | ✅ |
| `cliente_nombre` | ❌ | ❌ | ✅ | ✅ |
| `notas_internas` | ❌ | ❌ | ✅ | ✅ |
| `rango_dias` max | 7 | 7 | 14 | 30 |

**Implementación:**
```javascript
// En controller
const nivelDetalle = this._determinarNivelDetalle(req.user.rol);

static _determinarNivelDetalle(rol) {
  if (['cliente'].includes(rol)) return 'basico';    // Solo disponible/ocupado
  if (['bot'].includes(rol)) return 'completo';      // + Razón genérica
  return 'admin';  // Full data
}
```

---

## 📝 PLAN DE IMPLEMENTACIÓN

### PASO 1: Backend - Model de Disponibilidad (2-3 horas)

**Archivo a crear:** `backend/app/database/disponibilidad.model.js`

**Responsabilidades:**
1. Consultar horarios laborales del profesional (tabla `horarios_profesionales`)
2. Generar slots cada N minutos (configurable: 15, 30, 60)
3. Cruzar con citas existentes (tabla `citas`)
4. Cruzar con bloqueos de horarios (tabla `bloqueos_horarios`)
5. Marcar cada slot: disponible/ocupado/bloqueado/fuera_horario
6. Filtrar datos sensibles según `nivelDetalle`

**Código esqueleto:**

```javascript
const RLSContextManager = require('../utils/rlsContextManager');
const { DateTime } = require('luxon');
const { CitaHelpersModel } = require('./citas/cita.helpers.model');

class DisponibilidadModel {
  /**
   * Consulta disponibilidad de slots horarios
   * REUTILIZABLE para: chatbot, frontend admin, portal cliente
   */
  static async consultarDisponibilidad({
    organizacionId,
    fecha,                    // YYYY-MM-DD, "hoy", o ISO
    servicioId,
    profesionalId = null,
    hora = null,             // HH:MM (opcional - consulta slot específico)
    duracion = null,
    rangoDias = 1,
    intervaloMinutos = 30,
    soloDisponibles = true,
    nivelDetalle = 'completo'
  }) {
    return await RLSContextManager.query(organizacionId, async (db) => {

      // 1. Normalizar fecha (soportar "hoy", ISO, YYYY-MM-DD)
      const fechaNormalizada = this._normalizarFecha(fecha);

      // 2. Obtener servicio
      const servicio = await this._obtenerServicio(servicioId, organizacionId, db);
      if (!servicio) throw new Error('Servicio no encontrado');

      const duracionFinal = duracion || servicio.duracion_minutos || 30;

      // 3. Obtener profesionales que ofrecen el servicio
      const profesionales = await this._obtenerProfesionales(
        servicioId,
        profesionalId,
        organizacionId,
        db
      );

      // 4. Por cada día en el rango
      const disponibilidadPorFecha = [];

      for (let i = 0; i < rangoDias; i++) {
        const fechaActual = DateTime.fromISO(fechaNormalizada).plus({ days: i });
        const fechaStr = fechaActual.toFormat('yyyy-MM-dd');
        const diaSemana = fechaActual.weekday === 7 ? 0 : fechaActual.weekday;

        // 5. Por cada profesional
        const profesionalesDisp = [];

        for (const prof of profesionales) {
          // 5.1 Obtener horarios laborales del día
          const horarios = await this._obtenerHorariosLaborales(
            prof.id,
            diaSemana,
            fechaStr,
            organizacionId,
            db
          );

          if (horarios.length === 0) continue; // No trabaja este día

          // 5.2 Generar slots cada intervaloMinutos
          const slots = this._generarSlots(
            horarios,
            intervaloMinutos,
            hora // Si se especifica, solo generar ese slot
          );

          // 5.3 Verificar disponibilidad de cada slot
          const slotsConDisponibilidad = await this._verificarDisponibilidadSlots(
            slots,
            prof.id,
            fechaStr,
            duracionFinal,
            organizacionId,
            db,
            nivelDetalle
          );

          // 5.4 Filtrar solo disponibles si se solicita
          const slotsFiltrados = soloDisponibles
            ? slotsConDisponibilidad.filter(s => s.disponible)
            : slotsConDisponibilidad;

          if (slotsFiltrados.length > 0 || !soloDisponibles) {
            profesionalesDisp.push({
              profesional_id: prof.id,
              nombre: prof.nombre_completo,
              slots: slotsFiltrados,
              total_slots_disponibles: slotsFiltrados.filter(s => s.disponible).length,
              horario_laboral: {
                inicio: horarios[0].hora_inicio,
                fin: horarios[horarios.length - 1].hora_fin
              }
            });
          }
        }

        disponibilidadPorFecha.push({
          fecha: fechaStr,
          dia_semana: fechaActual.toFormat('cccc').toLowerCase(),
          profesionales: profesionalesDisp,
          total_slots_disponibles_dia: profesionalesDisp.reduce(
            (sum, p) => sum + p.total_slots_disponibles, 0
          )
        });
      }

      return {
        servicio: {
          id: servicio.id,
          nombre: servicio.nombre,
          duracion_minutos: servicio.duracion_minutos,
          precio: servicio.precio
        },
        disponibilidad_por_fecha: disponibilidadPorFecha,
        metadata: {
          total_profesionales: profesionales.length,
          rango_fechas: {
            desde: fechaNormalizada,
            hasta: DateTime.fromISO(fechaNormalizada)
              .plus({ days: rangoDias - 1 })
              .toFormat('yyyy-MM-dd')
          },
          generado_en: new Date().toISOString()
        }
      };
    });
  }

  /**
   * Verifica disponibilidad de cada slot consultando:
   * - Citas existentes (conflicto de horario)
   * - Bloqueos de horarios
   * - Validaciones con CitaHelpersModel.validarHorarioPermitido()
   */
  static async _verificarDisponibilidadSlots(
    slots,
    profesionalId,
    fecha,
    duracion,
    organizacionId,
    db,
    nivelDetalle
  ) {
    const slotsConDisponibilidad = [];

    for (const slot of slots) {
      const horaFin = this._calcularHoraFin(slot.hora, duracion);

      // Reutilizar validación existente
      const validacion = await CitaHelpersModel.validarHorarioPermitido(
        profesionalId,
        fecha,
        slot.hora,
        horaFin,
        organizacionId,
        db,
        null, // sin excluir cita
        { esWalkIn: false, permitirFueraHorario: false }
      );

      const slotInfo = {
        hora: slot.hora,
        disponible: validacion.valido,
        duracion_disponible: validacion.valido ? this._calcularDuracionDisponible(
          slot.hora,
          profesionalId,
          fecha,
          db
        ) : 0
      };

      // Agregar detalles según nivel
      if (!validacion.valido) {
        slotInfo.razon_no_disponible = this._formatearRazon(
          validacion.errores[0],
          nivelDetalle
        );

        if (nivelDetalle === 'admin' && validacion.errores[0].cita_id) {
          slotInfo.cita_id = validacion.errores[0].cita_id;
          slotInfo.cliente_nombre = validacion.errores[0].cliente_nombre;
        }
      }

      slotsConDisponibilidad.push(slotInfo);
    }

    return slotsConDisponibilidad;
  }

  // ... Métodos auxiliares privados
  static _normalizarFecha(fecha) { /* ... */ }
  static _obtenerServicio(servicioId, organizacionId, db) { /* ... */ }
  static _obtenerProfesionales(servicioId, profesionalId, organizacionId, db) { /* ... */ }
  static _obtenerHorariosLaborales(profesionalId, diaSemana, fecha, organizacionId, db) { /* ... */ }
  static _generarSlots(horarios, intervaloMinutos, horaEspecifica) { /* ... */ }
  static _calcularHoraFin(horaInicio, duracion) { /* ... */ }
  static _formatearRazon(error, nivelDetalle) { /* ... */ }
}

module.exports = DisponibilidadModel;
```

**Notas clave:**
- ✅ Reutiliza `CitaHelpersModel.validarHorarioPermitido()` (ya existe y funciona)
- ✅ RLS automático vía `RLSContextManager.query()`
- ✅ Soporta consulta de slot específico (para chatbot)
- ✅ Soporta múltiples días (para calendario frontend)

---

### PASO 2: Backend - Controller y Routes (1 hora)

**Archivos a crear:**
1. `backend/app/controllers/disponibilidad.controller.js`
2. `backend/app/routes/api/v1/disponibilidad.js`
3. `backend/app/schemas/disponibilidad.schemas.js`

**Controller:**

```javascript
const DisponibilidadModel = require('../database/disponibilidad.model');
const { asyncHandler } = require('../middleware');
const { ResponseHelper } = require('../utils/helpers');

class DisponibilidadController {
  static consultar = asyncHandler(async (req, res) => {
    const {
      fecha,
      servicio_id,
      profesional_id,
      hora,
      duracion,
      rango_dias,
      intervalo_minutos,
      solo_disponibles
    } = req.query;

    // Validar límites por rol
    const rangoDiasMax = this._obtenerRangoDiasMax(req.user.rol);
    const rangoDiasFinal = Math.min(
      parseInt(rango_dias) || 1,
      rangoDiasMax
    );

    // Determinar nivel de detalle
    const nivelDetalle = this._determinarNivelDetalle(req.user.rol);

    const disponibilidad = await DisponibilidadModel.consultarDisponibilidad({
      organizacionId: req.tenant.organizacionId,
      fecha,
      servicioId: parseInt(servicio_id),
      profesionalId: profesional_id ? parseInt(profesional_id) : null,
      hora,
      duracion: duracion ? parseInt(duracion) : null,
      rangoDias: rangoDiasFinal,
      intervaloMinutos: parseInt(intervalo_minutos) || 30,
      soloDisponibles: solo_disponibles !== 'false',
      nivelDetalle
    });

    return ResponseHelper.success(
      res,
      disponibilidad,
      'Disponibilidad consultada exitosamente'
    );
  });

  static _determinarNivelDetalle(rol) {
    if (['cliente'].includes(rol)) return 'basico';
    if (['bot'].includes(rol)) return 'completo';
    return 'admin';
  }

  static _obtenerRangoDiasMax(rol) {
    const limites = {
      'cliente': 7,
      'bot': 7,
      'empleado': 14,
      'admin': 30,
      'propietario': 30,
      'super_admin': 90
    };
    return limites[rol] || 7;
  }
}

module.exports = DisponibilidadController;
```

**Routes:**

```javascript
const express = require('express');
const DisponibilidadController = require('../../../controllers/disponibilidad.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const disponibilidadSchemas = require('../../../schemas/disponibilidad.schemas');

const router = express.Router();

router.get('/',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validation.validate(disponibilidadSchemas.consultar),
  DisponibilidadController.consultar
);

module.exports = router;
```

**Schema Joi:**

```javascript
const Joi = require('joi');

const disponibilidadSchemas = {
  consultar: {
    query: Joi.object({
      fecha: Joi.alternatives()
        .try(
          Joi.string().isoDate(),
          Joi.string().valid('hoy', 'mañana')
        )
        .required()
        .messages({
          'any.required': 'La fecha es requerida',
          'alternatives.match': 'Formato de fecha inválido (YYYY-MM-DD, "hoy", o ISO)'
        }),

      servicio_id: Joi.number().integer().positive().required()
        .messages({
          'any.required': 'El servicio_id es requerido'
        }),

      profesional_id: Joi.number().integer().positive().optional(),

      hora: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
        .messages({
          'string.pattern.base': 'Formato de hora inválido (HH:MM)'
        }),

      duracion: Joi.number().integer().min(15).max(480).optional(),

      rango_dias: Joi.number().integer().min(1).max(90).optional().default(1),

      intervalo_minutos: Joi.number().valid(15, 30, 60).optional().default(30),

      solo_disponibles: Joi.boolean().optional().default(true)
    })
  }
};

module.exports = disponibilidadSchemas;
```

**Registrar ruta en index:**

```javascript
// backend/app/routes/api/v1/index.js

const disponibilidadRoutes = require('./disponibilidad');

router.use('/disponibilidad', disponibilidadRoutes);
```

---

### PASO 3: MCP Tool - Actualizar verificarDisponibilidad (30 min)

**Archivo a modificar:** `backend/mcp-server/tools/verificarDisponibilidad.js`

**Cambios:**

```javascript
// ANTES (línea ~64-74):
// const response = await apiClient.get('/api/v1/citas/disponibilidad', { params });
// ❌ Este endpoint NO existe

// DESPUÉS:
const response = await apiClient.get('/api/v1/disponibilidad', {
  params: {
    fecha: value.fecha,          // DeepSeek ya convirtió "mañana" → "25/10/2025"
    servicio_id: value.servicio_id,
    profesional_id: value.profesional_id,
    hora: value.hora,            // Opcional: HH:MM
    duracion: value.duracion,
    solo_disponibles: true       // Solo mostrar slots disponibles
  }
});

// Parsear response
const disponibilidad = response.data.data;

// Si se especificó hora, buscar ese slot específico
if (value.hora) {
  const slotBuscado = this._buscarSlotEspecifico(
    disponibilidad,
    value.hora,
    value.profesional_id
  );

  return {
    success: true,
    message: slotBuscado.disponible
      ? `Sí, hay disponibilidad el ${value.fecha} a las ${value.hora}`
      : `No disponible: ${slotBuscado.razon}`,
    data: {
      disponible: slotBuscado.disponible,
      fecha: value.fecha,
      hora: value.hora,
      profesional: slotBuscado.profesional
    }
  };
}

// Si NO se especificó hora, retornar primeros N slots disponibles
return {
  success: true,
  message: `Disponibilidad consultada para ${value.fecha}`,
  data: {
    fecha: value.fecha,
    profesionales_disponibles: disponibilidad.disponibilidad_por_fecha[0].profesionales
      .map(prof => ({
        nombre: prof.nombre,
        horarios_disponibles: prof.slots.slice(0, 5).map(s => s.hora)  // Primeros 5
      }))
  }
};
```

**Método auxiliar:**

```javascript
static _buscarSlotEspecifico(disponibilidad, hora, profesionalId) {
  const fecha = disponibilidad.disponibilidad_por_fecha[0];

  if (profesionalId) {
    const prof = fecha.profesionales.find(p => p.profesional_id === profesionalId);
    const slot = prof?.slots.find(s => s.hora === hora);
    return {
      disponible: slot?.disponible || false,
      razon: slot?.razon_no_disponible || 'Profesional no encontrado',
      profesional: prof?.nombre
    };
  }

  // Buscar en cualquier profesional
  for (const prof of fecha.profesionales) {
    const slot = prof.slots.find(s => s.hora === hora && s.disponible);
    if (slot) {
      return {
        disponible: true,
        razon: null,
        profesional: prof.nombre
      };
    }
  }

  return {
    disponible: false,
    razon: 'No hay profesionales disponibles en ese horario',
    profesional: null
  };
}
```

---

### PASO 4: MCP Tool - Mejorar crearCita (1 hora)

**Archivo a modificar:** `backend/mcp-server/tools/crearCita.js`

**Cambios principales:**

```javascript
async function execute(args = {}, jwtToken) {
  const apiClient = createApiClient(jwtToken);

  // ========== 1. Buscar cliente por teléfono ==========
  let clienteId = null;

  if (value.cliente.telefono) {
    logger.info('Buscando cliente por teléfono:', value.cliente.telefono);

    try {
      const busqueda = await apiClient.get('/api/v1/clientes/buscar-telefono', {
        params: { telefono: value.cliente.telefono }
      });

      if (busqueda.data.data && busqueda.data.data.length > 0) {
        clienteId = busqueda.data.data[0].id;
        logger.info(`✅ Cliente existente encontrado: ${clienteId} - ${busqueda.data.data[0].nombre}`);
      }
    } catch (error) {
      logger.warn('Error buscando cliente:', error.message);
      // Continuar para crear nuevo cliente
    }
  }

  // ========== 2. Si no existe, crear cliente automáticamente ==========
  if (!clienteId) {
    logger.info('Cliente no encontrado. Creando nuevo cliente...');

    try {
      const nuevoCliente = await apiClient.post('/api/v1/clientes', {
        nombre: value.cliente.nombre,
        telefono: value.cliente.telefono || null,
        email: value.cliente.email || null,
        notas_especiales: 'Cliente creado automáticamente vía chatbot IA'
      });

      clienteId = nuevoCliente.data.data.id;
      logger.info(`✅ Cliente creado automáticamente: ${clienteId} - ${value.cliente.nombre}`);
    } catch (error) {
      logger.error('Error creando cliente:', error.response?.data || error.message);
      return {
        success: false,
        message: `Error al crear el cliente: ${error.response?.data?.error || error.message}`,
        data: null
      };
    }
  }

  // ========== 3. Crear cita con cliente_id obtenido ==========
  try {
    const cita = await apiClient.post('/api/v1/citas', {
      cliente_id: clienteId,  // ✅ Ya tenemos el ID
      profesional_id: value.profesional_id,
      servicio_id: value.servicio_id,
      fecha_cita: value.fecha,
      hora_inicio: value.hora,
      notas_cliente: value.notas || `Cita creada vía chatbot para ${value.cliente.nombre}`
    });

    logger.info(`✅ Cita creada exitosamente: ${cita.data.data.codigo_cita}`);

    return {
      success: true,
      message: `Cita agendada exitosamente. Código de confirmación: ${cita.data.data.codigo_cita}`,
      data: {
        codigo_cita: cita.data.data.codigo_cita,
        fecha: cita.data.data.fecha_cita,
        hora: cita.data.data.hora_inicio,
        cliente: value.cliente.nombre,
        profesional_id: cita.data.data.profesional_id,
        servicio_id: cita.data.data.servicio_id
      }
    };

  } catch (error) {
    logger.error('Error creando cita:', error.response?.data || error.message);
    return {
      success: false,
      message: `Error al crear la cita: ${error.response?.data?.error || error.message}`,
      data: null
    };
  }
}
```

---

### PASO 5: System Prompt - Mejorar Interpretación NLP (30 min)

**Archivo a modificar:** `backend/app/controllers/chatbot.controller.js` (línea 688-765)

**Agregar sección de interpretación de fechas:**

```javascript
static _generarSystemPrompt(plataforma, botInfo, organizacionId) {
  const botName = botInfo?.first_name || 'Asistente Virtual';
  const username = botInfo?.username ? `@${botInfo.username}` : '';

  return `Eres ${botName} ${username}, un asistente virtual inteligente para agendamiento de citas.

FECHA Y HORA ACTUAL: {{ $now.toISO() }}
ZONA HORARIA: America/Mexico_City (UTC-6)
HOY ES: {{ $now.toFormat('cccc, dd \'de\' MMMM \'de\' yyyy', { locale: 'es' }) }}

=== INTERPRETACIÓN DE FECHAS Y HORARIOS ===

**IMPORTANTE: Siempre convierte frases naturales a formato DD/MM/YYYY ANTES de llamar a las tools.**

Ejemplos de conversión:
- "hoy" → {{ $now.toFormat('dd/MM/yyyy') }}
- "mañana" → {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }}
- "pasado mañana" → {{ $now.plus({ days: 2 }).toFormat('dd/MM/yyyy') }}
- "lunes" o "el lunes" → Próximo lunes desde hoy
- "lunes de la próxima semana" → Lunes de la semana siguiente
- "en 3 días" → {{ $now.plus({ days: 3 }).toFormat('dd/MM/yyyy') }}
- "el 15 de noviembre" → 15/11/{{ $now.year }}

Conversión de horarios (a formato 24h HH:MM):
- "3pm" o "3 de la tarde" → 15:00
- "10am" o "10 de la mañana" → 10:00
- "medio día" → 12:00

=== HERRAMIENTAS DISPONIBLES ===

Tienes acceso a 4 herramientas MCP para interactuar con el sistema:

1. **listarServicios** - Lista servicios disponibles con precios y duración
   Úsala para: Mostrar catálogo de servicios al cliente

2. **verificarDisponibilidad** - Consulta horarios libres de un profesional
   Parámetros: {
     profesional_id?: number,  // Opcional
     fecha: "DD/MM/YYYY",      // ⚠️ YA convertida por ti
     hora?: "HH:MM",           // Opcional - si el usuario especificó hora
     servicio_id: number,
     duracion?: number
   }
   Úsala para: Verificar si un horario está disponible ANTES de crear la cita

3. **buscarCliente** - Busca cliente existente por teléfono o nombre
   Parámetros: { busqueda: string, tipo?: "telefono"|"nombre"|"auto" }
   Úsala para: Verificar si el cliente ya existe en el sistema

4. **crearCita** - Crea una nueva cita en el sistema
   Parámetros: {
     fecha: "DD/MM/YYYY",      // ⚠️ YA convertida por ti
     hora: "HH:MM",
     profesional_id: number,
     servicio_id: number,
     cliente: {
       nombre: string,
       telefono: string,
       email?: string
     },
     notas?: string
   }
   ⚠️ IMPORTANTE: Esta tool busca/crea el cliente automáticamente.
   Solo proporciona los datos del cliente, no necesitas buscar antes.

=== FLUJO DE AGENDAMIENTO ===

Cuando un cliente quiera agendar una cita, SIGUE ESTE PROCESO:

**PASO 1: RECOPILAR INFORMACIÓN**
- Nombre del cliente (OBLIGATORIO)
- Teléfono del cliente (OBLIGATORIO)
- Servicio deseado (OBLIGATORIO)
- Fecha preferida (OBLIGATORIO) - ⚠️ Convierte a DD/MM/YYYY
- Hora preferida (OBLIGATORIO) - ⚠️ Convierte a HH:MM formato 24h
- Profesional preferido (OPCIONAL)

**PASO 2: USA "listarServicios"**
- Si el cliente no sabe qué servicio quiere, muéstrale el catálogo
- Obtén el servicio_id correcto

**PASO 3: USA "verificarDisponibilidad"**
- ANTES de crear la cita, verifica que el horario esté libre
- Si está ocupado, sugiere 2-3 horarios alternativos
- Si está libre, procede al Paso 4

**PASO 4: USA "crearCita"**
- Solo cuando tengas TODOS los datos y el horario esté CONFIRMADO disponible
- Proporciona todos los parámetros requeridos
- Informa al cliente el código de cita generado

=== REGLAS IMPORTANTES ===

1. **NUNCA crees una cita sin verificar disponibilidad primero**
2. **SIEMPRE confirma los datos con el cliente antes de usar crearCita**
3. **SIEMPRE convierte fechas naturales a DD/MM/YYYY ANTES de llamar tools**
4. **Las tools NO interpretan fechas naturales - hazlo tú primero**
5. **Si falta información, pregunta UNA SOLA VEZ de forma clara**
6. **Sé amable, profesional y empático**
7. **Confirma siempre el resultado de las operaciones al cliente**

=== EJEMPLO DE CONVERSACIÓN ===

Usuario: "Quiero cita para mañana a las 3pm"

Tú (internamente):
- mañana = {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }}
- 3pm = 15:00

Tú respondes: "Claro, veo que quieres agendar para mañana {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }} a las 15:00. ¿Qué servicio te gustaría?"

Usuario: "Corte de cabello"

Tú: (llamas listarServicios, obtienes servicio_id=1)
"Perfecto, nuestro servicio de Corte de Cabello tiene una duración de 30 minutos y cuesta $150.
Déjame verificar disponibilidad para mañana a las 3pm..."

Tú: (llamas verificarDisponibilidad con fecha="{{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }}", hora="15:00", servicio_id=1)

Tool responde: "Disponible con Juan Pérez"

Tú: "¡Excelente! Tenemos disponibilidad con Juan Pérez. Para confirmar la cita, necesito tu nombre completo y teléfono."

Usuario: "Luis García, 5517437767"

Tú: (llamas crearCita con todos los datos)

Tool responde: { codigo_cita: "ORG001-20251026-001" }

Tú: "✅ ¡Listo! Tu cita está confirmada para mañana {{ $now.plus({ days: 1 }).toFormat('dd/MM/yyyy') }} a las 15:00.
Tu código de confirmación es: ORG001-20251026-001
Te esperamos, Luis!"

Organización ID: ${organizacionId}
Plataforma: ${plataforma}

Responde de forma concisa y clara. Usa emojis con moderación para mantener un tono amigable.`;
}
```

**Notas clave:**
- ✅ Usa variables Luxon `{{ $now }}` (soportado por n8n)
- ✅ Instrucciones claras: "convierte ANTES de llamar tools"
- ✅ Ejemplos prácticos de conversión
- ✅ Flujo paso a paso documentado

---

### PASO 6: Frontend - Hook y Componente (2 horas) [OPCIONAL]

**Este paso es opcional para la funcionalidad del chatbot. Implementar solo si se necesita calendario en frontend admin.**

**Archivos a crear:**
1. `frontend/src/hooks/useDisponibilidad.js`
2. `frontend/src/services/api/endpoints.js` (actualizar)
3. `frontend/src/components/citas/CalendarioDisponibilidad.jsx` (opcional)

**Hook:**

```javascript
// frontend/src/hooks/useDisponibilidad.js

import { useQuery } from '@tanstack/react-query';
import { disponibilidadApi } from '@/services/api/endpoints';

/**
 * Hook para consultar disponibilidad de slots horarios
 *
 * @param {Object} params
 * @param {string} params.fecha - YYYY-MM-DD
 * @param {number} params.servicio_id
 * @param {number} [params.profesional_id]
 * @param {number} [params.rango_dias=1]
 * @param {number} [params.intervalo_minutos=30]
 * @param {boolean} [params.solo_disponibles=true]
 */
export function useDisponibilidad(params) {
  return useQuery({
    queryKey: ['disponibilidad', params],
    queryFn: async () => {
      const response = await disponibilidadApi.consultar(params);
      return response.data.data;
    },
    enabled: !!(params?.fecha && params?.servicio_id),
    staleTime: 1000 * 60 * 2,  // 2 minutos (la disponibilidad cambia rápido)
    refetchOnMount: true
  });
}
```

**API Endpoint:**

```javascript
// frontend/src/services/api/endpoints.js

export const disponibilidadApi = {
  /**
   * Consultar disponibilidad de slots horarios
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  consultar: (params) => apiClient.get('/disponibilidad', { params }),
};

// Agregar al export final
export default {
  // ... existentes
  disponibilidad: disponibilidadApi,
};
```

---

### PASO 7: Tests (1-2 horas)

**Archivos a crear:**
1. `backend/app/__tests__/endpoints/disponibilidad.test.js`
2. `backend/mcp-server/__tests__/tools/verificarDisponibilidad.test.js`

**Tests críticos a incluir:**

```javascript
describe('Disponibilidad Endpoint', () => {
  test('Consulta disponibilidad con fecha y servicio', async () => {
    // Configurar datos: profesional con horario laboral, sin citas
    // Consultar: GET /disponibilidad?fecha=hoy&servicio_id=1
    // Verificar: Response con slots disponibles
  });

  test('Filtra slots ocupados correctamente', async () => {
    // Configurar: Cita existente a las 10:00
    // Consultar: GET /disponibilidad?fecha=hoy&servicio_id=1
    // Verificar: Slot 10:00 marcado como no disponible
  });

  test('Respeta nivel de detalle por rol', async () => {
    // Consultar como cliente: NO debe ver cita_id ni cliente_nombre
    // Consultar como admin: SÍ debe ver cita_id y cliente_nombre
  });

  test('Valida límite de rango_dias por rol', async () => {
    // Cliente: max 7 días
    // Admin: max 30 días
  });

  test('Consulta slot específico con hora', async () => {
    // GET /disponibilidad?fecha=hoy&servicio_id=1&hora=10:00
    // Verificar: Solo retorna ese slot
  });
});
```

---

## 📂 RESUMEN DE ARCHIVOS

### Archivos a Crear (10 nuevos)

| # | Archivo | Líneas | Complejidad |
|---|---------|--------|-------------|
| 1 | `backend/app/database/disponibilidad.model.js` | ~400 | Alta |
| 2 | `backend/app/controllers/disponibilidad.controller.js` | ~100 | Media |
| 3 | `backend/app/routes/api/v1/disponibilidad.js` | ~20 | Baja |
| 4 | `backend/app/schemas/disponibilidad.schemas.js` | ~40 | Baja |
| 5 | `backend/app/__tests__/endpoints/disponibilidad.test.js` | ~200 | Media |
| 6 | `backend/mcp-server/__tests__/tools/verificarDisponibilidad.test.js` | ~100 | Media |
| 7 | `frontend/src/hooks/useDisponibilidad.js` | ~20 | Baja |
| 8 | `frontend/src/components/citas/CalendarioDisponibilidad.jsx` | ~150 | Media |

### Archivos a Modificar (4 existentes)

| # | Archivo | Cambios | Líneas |
|---|---------|---------|--------|
| 1 | `backend/mcp-server/tools/verificarDisponibilidad.js` | Cambiar endpoint + parsear response | ~50 |
| 2 | `backend/mcp-server/tools/crearCita.js` | Agregar búsqueda/creación cliente | ~80 |
| 3 | `backend/app/controllers/chatbot.controller.js` | Mejorar system prompt con NLP | ~30 |
| 4 | `backend/app/routes/api/v1/index.js` | Registrar ruta disponibilidad | ~1 |
| 5 | `frontend/src/services/api/endpoints.js` | Agregar disponibilidadApi | ~10 |

**Total:** 14 archivos (10 nuevos + 4 modificados)

---

## ⏱️ ESTIMACIONES

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| **Backend - DisponibilidadModel** | 2-3h | 🔴 Crítica |
| **Backend - Controller + Routes + Schema** | 1h | 🔴 Crítica |
| **MCP Tool - verificarDisponibilidad** | 30min | 🔴 Crítica |
| **MCP Tool - crearCita** | 1h | 🔴 Crítica |
| **System Prompt - NLP Fechas** | 30min | 🔴 Crítica |
| **Frontend - Hook (opcional)** | 1h | 🟡 Media |
| **Frontend - Componente (opcional)** | 1h | 🟡 Media |
| **Tests** | 1-2h | 🟢 Baja |
| **TOTAL (sin frontend)** | **5-6h** | - |
| **TOTAL (completo)** | **8-10h** | - |

---

## ✅ CRITERIOS DE ÉXITO

### Funcional

- [ ] **Chatbot puede verificar disponibilidad** antes de crear citas
- [ ] **Chatbot interpreta fechas naturales** ("mañana" → DD/MM/YYYY)
- [ ] **Chatbot crea clientes automáticamente** si no existen
- [ ] **Endpoint `/disponibilidad` retorna slots** correctamente
- [ ] **RLS filtra datos sensibles** según rol (cliente vs admin)
- [ ] **Walk-ins siguen funcionando** (no romper `/disponibilidad-inmediata`)

### No Funcional

- [ ] **Response < 2s** para consulta de 1 día
- [ ] **Response < 5s** para consulta de 7 días
- [ ] **Tests pasando** (95%+ coverage en nuevos archivos)
- [ ] **Sin N+1 queries** (optimizar con JOINs)
- [ ] **Documentación actualizada** (endpoints en README)

### UX Chatbot

- [ ] Usuario: "Quiero cita mañana a las 3pm" → Bot verifica y confirma/sugiere
- [ ] Usuario: "Corte de cabello para el lunes" → Bot consulta disponibilidad del lunes
- [ ] Usuario nuevo (sin teléfono previo) → Bot crea cliente automáticamente
- [ ] Bot responde < 5 segundos en promedio

---

## 🚀 PRÓXIMOS PASOS

### Opción A: Full Stack (Recomendado)
**Tiempo:** 8-10h
**Incluye:** Backend + MCP Tools + Frontend + Tests
**Beneficio:** Sistema listo para cualquier canal futuro

### Opción B: Solo Backend + MCP (Mínimo Viable)
**Tiempo:** 5-6h
**Incluye:** Backend + MCP Tools + System Prompt
**Beneficio:** Chatbot funcional inmediatamente, frontend después

### Opción C: MVP Ultra-Rápido (No Recomendado)
**Tiempo:** 2-3h
**Incluye:** Endpoint simplificado + MCP Tool básico
**Riesgo:** Deuda técnica, refactor necesario después

---

## 📝 NOTAS FINALES

### Decisiones de Diseño

1. **Dos endpoints separados** (`/disponibilidad` + `/disponibilidad-inmediata`)
   - Razón: Walk-ins requieren performance, agendamiento normal requiere detalle
   - Alternativa descartada: Unificar en uno solo (más complejo, más lento)

2. **Niveles de detalle por rol** (basico, completo, admin)
   - Razón: Privacidad de clientes + optimización de response
   - Implementación: Filtrado en controller, no en model

3. **Reutilización de `validarHorarioPermitido()`**
   - Razón: Lógica ya probada, evitar duplicación
   - Beneficio: Menos bugs, más mantenible

4. **System prompt con variables Luxon**
   - Razón: n8n soporta `{{ $now }}` nativamente
   - Alternativa descartada: Calcular fechas en tool (más lento)

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Performance con múltiples profesionales | Media | Alto | Optimizar queries con JOINs, agregar cache |
| Conflictos de timezone | Baja | Alto | Usar Luxon consistentemente, tests con diferentes TZ |
| Response muy grande (14 días × 10 profesionales) | Media | Medio | Limitar rango_dias por rol, paginación futura |

---

**Documento creado:** 24 Octubre 2025
**Última actualización:** 24 Octubre 2025
**Responsable:** Sistema de IA Conversacional
**Estado:** 📋 Listo para implementación

---

## 📖 REFERENCIAS

- **Código existente reutilizable:**
  - `CitaHelpersModel.validarHorarioPermitido()` - Validación de horarios
  - `CitaOperacionalModel.consultarDisponibilidadInmediata()` - Ejemplo walk-in
  - `RLSContextManager` - Seguridad multi-tenant

- **Endpoints relacionados:**
  - `GET /api/v1/citas/disponibilidad-inmediata` - Walk-ins (mantener)
  - `POST /api/v1/citas` - Crear cita (usado por MCP tool)
  - `GET /api/v1/clientes/buscar-telefono` - Buscar cliente

- **Documentación externa:**
  - [n8n Luxon Variables](https://docs.n8n.io/code-examples/expressions/luxon/)
  - [Model Context Protocol Spec](https://modelcontextprotocol.io/)
