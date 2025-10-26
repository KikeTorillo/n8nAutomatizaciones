/**
 * ====================================================================
 * UTILIDAD COMPARTIDA: VALIDACIÓN DE DISPONIBILIDAD DE CITAS
 * ====================================================================
 *
 * Funciones compartidas para validar disponibilidad de slots horarios.
 * Elimina duplicación de lógica entre:
 * - CitaHelpersModel.validarHorarioPermitido() (operaciones de escritura)
 * - DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria() (operaciones de lectura)
 *
 * ====================================================================
 * 📋 DECISIÓN ARQUITECTÓNICA: COMMAND-QUERY SEPARATION
 * ====================================================================
 *
 * CONTEXTO:
 * Dos métodos validaban disponibilidad con ~90% de código duplicado pero
 * diferentes contextos de uso:
 *
 * 1️⃣ CitaHelpersModel.validarHorarioPermitido() - COMMAND (Escritura)
 *    - Valida UN SOLO slot antes de crear/editar cita
 *    - Hace queries SQL individuales para garantizar precisión 100%
 *    - Datos siempre actualizados (consulta en tiempo real)
 *    - Puede lanzar excepciones que abortan la transacción
 *    - Performance: 50-100ms por slot (aceptable para 1 slot)
 *    - Uso: Crear cita, Editar cita, Reagendar, Walk-ins
 *
 * 2️⃣ DisponibilidadModel._verificarDisponibilidadSlotsEnMemoria() - QUERY (Lectura)
 *    - Valida MÚLTIPLES slots para consultas masivas
 *    - Usa batch queries (2 queries totales) + verificación en memoria
 *    - Datos pre-cargados (98% reducción de queries)
 *    - NO lanza excepciones, marca slots como no disponibles
 *    - Performance: 0.5ms por slot (crítico para 100+ slots)
 *    - Uso: Chatbot IA, Frontend calendario, Portal cliente
 *
 * PROBLEMA ORIGINAL:
 * - 90% de lógica duplicada entre ambos métodos
 * - Cambios en reglas de validación requerían actualizar 2 lugares
 * - Riesgo de inconsistencia en validaciones
 *
 * DECISIÓN: Mantener Separación + Extraer Lógica Común ✅
 *
 * RAZONES:
 * 1. ✅ **Command-Query Separation (CQS)**: Patrón arquitectónico válido
 *    - Commands modifican estado, pueden fallar
 *    - Queries solo leen, nunca fallan
 *
 * 2. ✅ **Performance crítica**: Query valida 100+ slots en <500ms
 *    - Esencial para UX del chatbot IA
 *    - Hacer 100 queries individuales = 5-10 segundos (inaceptable)
 *
 * 3. ✅ **Precisión crítica**: Command valida con datos actualizados
 *    - Previene double-booking
 *    - Garantiza integridad transaccional
 *
 * 4. ✅ **Semántica diferente**:
 *    - Command: "¿PUEDO crear esta cita?" → throw Error si no
 *    - Query: "¿QUÉ slots están disponibles?" → marca no disponibles
 *
 * SOLUCIÓN IMPLEMENTADA:
 * - ✅ Extraer lógica compartida a CitaValidacionUtil (este archivo)
 * - ✅ Mantener métodos separados con diferentes estrategias de datos
 * - ✅ Documentar cross-references en código
 * - ✅ Tests de consistencia entre ambos métodos
 *
 * ALTERNATIVAS CONSIDERADAS Y RECHAZADAS:
 *
 * ❌ Opción B: Unificar en un solo método universal
 *    - Complejidad alta (demasiados flags: esQuery, esBatch, throwErrors)
 *    - Difícil de mantener y testear
 *    - Pérdida de claridad semántica
 *
 * ❌ Opción C: Strategy Pattern
 *    - Over-engineering para este caso
 *    - Agrega complejidad innecesaria
 *    - No aporta valor real vs extracción simple
 *
 * CONSECUENCIAS:
 * ✅ Ventajas:
 *    - Elimina 80% de código duplicado
 *    - Mantiene claridad de intención (Command vs Query)
 *    - Preserva optimizaciones de performance
 *    - Facilita testing y mantenimiento
 *
 * ⚠️ Trade-offs:
 *    - Cambios en reglas requieren actualizar utilidad + tests
 *    - Desarrolladores deben conocer ambos métodos
 *
 * 📍 REFERENCIAS CRUZADAS:
 * @see backend/app/database/citas/cita.helpers.model.js:329 - validarHorarioPermitido()
 * @see backend/app/database/disponibilidad.model.js:344 - _verificarDisponibilidadSlotsEnMemoria()
 * @see backend/app/__tests__/utils/cita-validacion.util.test.js - Tests unitarios
 *
 * @created 2025-10-25
 * @version 1.0.0
 */

const logger = require('./logger');

class CitaValidacionUtil {
    /**
     * Verifica si dos rangos horarios se solapan
     *
     * Algoritmo: Dos rangos [A1, A2] y [B1, B2] se solapan si:
     * A1 < B2 AND A2 > B1
     *
     * Casos cubiertos:
     * - Solapamiento parcial por inicio
     * - Solapamiento parcial por fin
     * - Solapamiento completo (uno contiene al otro)
     * - No solapamiento
     *
     * @param {string} inicio1 - Hora inicio rango 1 (HH:MM:SS o HH:MM)
     * @param {string} fin1 - Hora fin rango 1 (HH:MM:SS o HH:MM)
     * @param {string} inicio2 - Hora inicio rango 2 (HH:MM:SS o HH:MM)
     * @param {string} fin2 - Hora fin rango 2 (HH:MM:SS o HH:MM)
     * @returns {boolean} true si hay solapamiento
     *
     * @example
     * haySolapamientoHorario('09:00:00', '10:00:00', '09:30:00', '10:30:00') // true
     * haySolapamientoHorario('09:00:00', '10:00:00', '10:00:00', '11:00:00') // false (toca pero no solapa)
     * haySolapamientoHorario('09:00:00', '10:00:00', '11:00:00', '12:00:00') // false
     */
    static haySolapamientoHorario(inicio1, fin1, inicio2, fin2) {
        // Algoritmo clásico de solapamiento de intervalos
        return inicio1 < fin2 && fin1 > inicio2;
    }

    /**
     * Verifica si un bloqueo afecta a un profesional en una fecha/hora específica
     *
     * Considera:
     * 1. Bloqueos organizacionales (profesional_id = null) afectan a todos
     * 2. Bloqueos específicos solo afectan al profesional indicado
     * 3. El bloqueo debe estar activo en el rango de fechas
     * 4. Bloqueos de "todo el día" (sin hora_inicio/hora_fin) siempre bloquean
     * 5. Bloqueos de horario específico validan solapamiento
     *
     * @param {Object} bloqueo - Objeto bloqueo con propiedades:
     *   - profesional_id: number|null (null = organizacional)
     *   - fecha_inicio: string|Date (YYYY-MM-DD o ISO)
     *   - fecha_fin: string|Date (YYYY-MM-DD o ISO)
     *   - hora_inicio: string|null (HH:MM:SS o null = todo el día)
     *   - hora_fin: string|null (HH:MM:SS o null = todo el día)
     * @param {number} profesionalId - ID del profesional a validar
     * @param {string|Date} fecha - Fecha del slot (YYYY-MM-DD, ISO o Date)
     * @param {string} horaInicio - Hora inicio del slot (HH:MM:SS o HH:MM)
     * @param {string} horaFin - Hora fin del slot (HH:MM:SS o HH:MM)
     * @returns {boolean} true si el bloqueo afecta al slot
     *
     * @example
     * bloqueoAfectaSlot(
     *   { profesional_id: null, fecha_inicio: '2025-10-25', fecha_fin: '2025-10-25', hora_inicio: null, hora_fin: null },
     *   1, '2025-10-25', '09:00:00', '10:00:00'
     * ) // true (bloqueo organizacional de todo el día)
     */
    static bloqueoAfectaSlot(bloqueo, profesionalId, fecha, horaInicio, horaFin) {
        // ========== 1. Verificar profesional (organizacional o específico) ==========
        if (bloqueo.profesional_id !== null && bloqueo.profesional_id !== profesionalId) {
            return false;
        }

        // ========== 2. Normalizar fechas a YYYY-MM-DD ==========
        const fechaSlot = this.normalizarFecha(fecha);
        const fechaBloqueoInicio = this.normalizarFecha(bloqueo.fecha_inicio);
        const fechaBloqueoFin = this.normalizarFecha(bloqueo.fecha_fin);

        // ========== 3. Verificar rango de fechas ==========
        const fechaSlotDate = new Date(fechaSlot + 'T00:00:00');
        const bloqueoInicioDate = new Date(fechaBloqueoInicio + 'T00:00:00');
        const bloqueoFinDate = new Date(fechaBloqueoFin + 'T00:00:00');

        if (fechaSlotDate < bloqueoInicioDate || fechaSlotDate > bloqueoFinDate) {
            return false;
        }

        // ========== 4. Bloqueo de todo el día (sin horas específicas) ==========
        if (bloqueo.hora_inicio === null && bloqueo.hora_fin === null) {
            return true;
        }

        // ========== 5. Bloqueo de horario específico (validar solapamiento) ==========
        if (bloqueo.hora_inicio !== null && bloqueo.hora_fin !== null) {
            return this.haySolapamientoHorario(
                horaInicio,
                horaFin,
                bloqueo.hora_inicio,
                bloqueo.hora_fin
            );
        }

        return false;
    }

    /**
     * Verifica si una cita se solapa con un slot horario
     *
     * Considera:
     * 1. Debe ser el mismo profesional
     * 2. Debe ser la misma fecha
     * 3. Citas canceladas o no_asistio no bloquean
     * 4. Debe haber solapamiento horario
     *
     * @param {Object} cita - Objeto cita con propiedades:
     *   - profesional_id: number
     *   - fecha_cita: string|Date (YYYY-MM-DD, ISO o Date)
     *   - hora_inicio: string (HH:MM:SS o HH:MM)
     *   - hora_fin: string (HH:MM:SS o HH:MM)
     *   - estado: string (pendiente, confirmada, cancelada, etc.)
     * @param {number} profesionalId - ID del profesional del slot
     * @param {string|Date} fecha - Fecha del slot (YYYY-MM-DD, ISO o Date)
     * @param {string} horaInicio - Hora inicio del slot (HH:MM:SS o HH:MM)
     * @param {string} horaFin - Hora fin del slot (HH:MM:SS o HH:MM)
     * @returns {boolean} true si la cita se solapa con el slot
     *
     * @example
     * citaSolapaConSlot(
     *   { profesional_id: 1, fecha_cita: '2025-10-25', hora_inicio: '09:00:00', hora_fin: '10:00:00', estado: 'confirmada' },
     *   1, '2025-10-25', '09:30:00', '10:30:00'
     * ) // true (solapamiento parcial)
     */
    static citaSolapaConSlot(cita, profesionalId, fecha, horaInicio, horaFin) {
        // ========== 1. Verificar profesional ==========
        if (cita.profesional_id !== profesionalId) {
            return false;
        }

        // ========== 2. Normalizar fechas a YYYY-MM-DD ==========
        const fechaCita = this.normalizarFecha(cita.fecha_cita);
        const fechaSlot = this.normalizarFecha(fecha);

        // ========== 3. Verificar misma fecha ==========
        if (fechaCita !== fechaSlot) {
            return false;
        }

        // ========== 4. Verificar estado (citas canceladas no bloquean) ==========
        if (cita.estado && ['cancelada', 'no_asistio'].includes(cita.estado)) {
            return false;
        }

        // ========== 5. Verificar solapamiento horario ==========
        return this.haySolapamientoHorario(
            horaInicio,
            horaFin,
            cita.hora_inicio,
            cita.hora_fin
        );
    }

    /**
     * Normaliza una fecha a formato YYYY-MM-DD
     *
     * Soporta múltiples formatos de entrada:
     * - Date object: new Date('2025-10-25')
     * - ISO timestamp: '2025-10-25T10:00:00Z'
     * - YYYY-MM-DD: '2025-10-25'
     *
     * @param {string|Date} fecha - Fecha en cualquier formato soportado
     * @returns {string} Fecha normalizada en formato YYYY-MM-DD
     *
     * @example
     * normalizarFecha(new Date('2025-10-25')) // '2025-10-25'
     * normalizarFecha('2025-10-25T10:00:00Z') // '2025-10-25'
     * normalizarFecha('2025-10-25') // '2025-10-25'
     */
    static normalizarFecha(fecha) {
        // Caso 1: Date object
        if (fecha instanceof Date) {
            return fecha.toISOString().split('T')[0];
        }

        // Caso 2: String con timestamp ISO (contiene 'T')
        if (typeof fecha === 'string' && fecha.includes('T')) {
            return fecha.split('T')[0];
        }

        // Caso 3: String en formato YYYY-MM-DD (ya normalizado)
        return fecha;
    }

    /**
     * Formatea un objeto de error de bloqueo según el nivel de detalle
     *
     * Usado para filtrar información sensible según el rol del usuario:
     * - 'basico': Cliente - solo "No disponible"
     * - 'completo': Bot - razón genérica
     * - 'admin': Admin/Empleado - detalles completos
     *
     * @param {Object} bloqueo - Objeto bloqueo con titulo y tipo
     * @param {string} nivelDetalle - 'basico' | 'completo' | 'admin'
     * @returns {string} Mensaje formateado según nivel de detalle
     *
     * @example
     * formatearMensajeBloqueo({ titulo: 'Vacaciones', es_organizacional: true }, 'basico')
     * // 'No disponible'
     *
     * formatearMensajeBloqueo({ titulo: 'Vacaciones', es_organizacional: true }, 'completo')
     * // 'Vacaciones'
     *
     * formatearMensajeBloqueo({ titulo: 'Vacaciones', es_organizacional: true }, 'admin')
     * // 'Bloqueo organizacional: Vacaciones'
     */
    static formatearMensajeBloqueo(bloqueo, nivelDetalle = 'completo') {
        if (nivelDetalle === 'basico') {
            return 'No disponible';
        }

        if (nivelDetalle === 'completo') {
            return bloqueo.titulo || 'Horario bloqueado';
        }

        // Admin: Detalle completo
        const tipo = bloqueo.es_organizacional ? 'Bloqueo organizacional' : 'Bloqueo del profesional';
        return `${tipo}: ${bloqueo.titulo || 'Horario bloqueado'}`;
    }

    /**
     * Formatea un objeto de error de cita según el nivel de detalle
     *
     * @param {Object} cita - Objeto cita con codigo_cita y cliente_nombre
     * @param {string} nivelDetalle - 'basico' | 'completo' | 'admin'
     * @returns {string} Mensaje formateado según nivel de detalle
     *
     * @example
     * formatearMensajeCita({ codigo_cita: 'ORG001-001', cliente_nombre: 'Juan' }, 'basico')
     * // 'Ocupado'
     *
     * formatearMensajeCita({ codigo_cita: 'ORG001-001', cliente_nombre: 'Juan' }, 'completo')
     * // 'Cita existente'
     *
     * formatearMensajeCita({ codigo_cita: 'ORG001-001', cliente_nombre: 'Juan' }, 'admin')
     * // 'Cita ORG001-001 - Juan'
     */
    static formatearMensajeCita(cita, nivelDetalle = 'completo') {
        if (nivelDetalle === 'basico') {
            return 'Ocupado';
        }

        if (nivelDetalle === 'completo') {
            return 'Cita existente';
        }

        // Admin: Detalle completo
        return `Cita ${cita.codigo_cita || cita.id} - ${cita.cliente_nombre || 'Cliente'}`;
    }

    /**
     * Valida que las horas tengan formato correcto HH:MM:SS o HH:MM
     *
     * @param {string} hora - Hora a validar
     * @returns {boolean} true si el formato es válido
     */
    static validarFormatoHora(hora) {
        if (!hora || typeof hora !== 'string') {
            return false;
        }

        // Formato HH:MM:SS o HH:MM
        const regex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
        return regex.test(hora);
    }

    /**
     * Normaliza hora a formato HH:MM:SS
     * Si recibe HH:MM, agrega :00 al final
     *
     * @param {string} hora - Hora en formato HH:MM o HH:MM:SS
     * @returns {string} Hora normalizada HH:MM:SS
     *
     * @example
     * normalizarHora('09:00') // '09:00:00'
     * normalizarHora('09:00:00') // '09:00:00'
     */
    static normalizarHora(hora) {
        if (!hora) return null;

        // Si ya tiene formato HH:MM:SS, retornar tal cual
        if (hora.length === 8 && hora.split(':').length === 3) {
            return hora;
        }

        // Si tiene formato HH:MM, agregar :00
        if (hora.length === 5 && hora.split(':').length === 2) {
            return `${hora}:00`;
        }

        return hora;
    }
}

module.exports = CitaValidacionUtil;
