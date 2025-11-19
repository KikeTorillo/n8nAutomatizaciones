/**
 * ====================================================================
 * TESTS: UTILIDAD DE VALIDACIÓN DE DISPONIBILIDAD
 * ====================================================================
 *
 * Tests para CitaValidacionUtil - Funciones compartidas de validación
 */

const CitaValidacionUtil = require('../../templates/scheduling-saas/utils/cita-validacion.util');

describe('CitaValidacionUtil', () => {
    // ====================================================================
    // haySolapamientoHorario()
    // ====================================================================
    describe('haySolapamientoHorario', () => {
        test('Detecta solapamiento parcial por inicio', () => {
            // Rango 1: 09:00 - 10:00
            // Rango 2: 09:30 - 10:30
            // Solapamiento: 09:30 - 10:00
            const resultado = CitaValidacionUtil.haySolapamientoHorario(
                '09:00:00', '10:00:00',
                '09:30:00', '10:30:00'
            );
            expect(resultado).toBe(true);
        });

        test('Detecta solapamiento parcial por fin', () => {
            // Rango 1: 09:30 - 10:30
            // Rango 2: 09:00 - 10:00
            // Solapamiento: 09:30 - 10:00
            const resultado = CitaValidacionUtil.haySolapamientoHorario(
                '09:30:00', '10:30:00',
                '09:00:00', '10:00:00'
            );
            expect(resultado).toBe(true);
        });

        test('Detecta solapamiento completo (uno contiene al otro)', () => {
            // Rango 1: 09:00 - 11:00
            // Rango 2: 09:30 - 10:00
            // Solapamiento: 09:30 - 10:00 (completo)
            const resultado = CitaValidacionUtil.haySolapamientoHorario(
                '09:00:00', '11:00:00',
                '09:30:00', '10:00:00'
            );
            expect(resultado).toBe(true);
        });

        test('NO detecta solapamiento cuando los rangos NO se tocan', () => {
            // Rango 1: 09:00 - 10:00
            // Rango 2: 11:00 - 12:00
            // No hay solapamiento
            const resultado = CitaValidacionUtil.haySolapamientoHorario(
                '09:00:00', '10:00:00',
                '11:00:00', '12:00:00'
            );
            expect(resultado).toBe(false);
        });

        test('NO detecta solapamiento cuando los rangos solo SE TOCAN (sin solapar)', () => {
            // Rango 1: 09:00 - 10:00
            // Rango 2: 10:00 - 11:00
            // Se tocan pero no solapan (10:00 es fin de uno e inicio del otro)
            const resultado = CitaValidacionUtil.haySolapamientoHorario(
                '09:00:00', '10:00:00',
                '10:00:00', '11:00:00'
            );
            expect(resultado).toBe(false);
        });

        test('Funciona con formato HH:MM (sin segundos)', () => {
            const resultado = CitaValidacionUtil.haySolapamientoHorario(
                '09:00', '10:00',
                '09:30', '10:30'
            );
            expect(resultado).toBe(true);
        });
    });

    // ====================================================================
    // bloqueoAfectaSlot()
    // ====================================================================
    describe('bloqueoAfectaSlot', () => {
        test('Bloqueo organizacional (profesional_id null) afecta a cualquier profesional', () => {
            const bloqueo = {
                profesional_id: null, // Organizacional
                fecha_inicio: '2025-10-25',
                fecha_fin: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '12:00:00'
            };

            const resultado = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo,
                1, // profesional_id = 1
                '2025-10-25',
                '10:00:00',
                '11:00:00'
            );

            expect(resultado).toBe(true);
        });

        test('Bloqueo específico solo afecta a ese profesional', () => {
            const bloqueo = {
                profesional_id: 2, // Específico del profesional 2
                fecha_inicio: '2025-10-25',
                fecha_fin: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '12:00:00'
            };

            // Profesional 1 NO debe ser afectado
            const resultado1 = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 1, '2025-10-25', '10:00:00', '11:00:00'
            );
            expect(resultado1).toBe(false);

            // Profesional 2 SÍ debe ser afectado
            const resultado2 = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 2, '2025-10-25', '10:00:00', '11:00:00'
            );
            expect(resultado2).toBe(true);
        });

        test('Bloqueo de todo el día (hora_inicio y hora_fin null) siempre bloquea', () => {
            const bloqueo = {
                profesional_id: 1,
                fecha_inicio: '2025-10-25',
                fecha_fin: '2025-10-25',
                hora_inicio: null, // Todo el día
                hora_fin: null     // Todo el día
            };

            const resultado = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 1, '2025-10-25', '10:00:00', '11:00:00'
            );

            expect(resultado).toBe(true);
        });

        test('Bloqueo de horario específico usa solapamiento', () => {
            const bloqueo = {
                profesional_id: 1,
                fecha_inicio: '2025-10-25',
                fecha_fin: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '12:00:00'
            };

            // Slot dentro del bloqueo
            const resultado1 = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 1, '2025-10-25', '10:00:00', '11:00:00'
            );
            expect(resultado1).toBe(true);

            // Slot fuera del bloqueo
            const resultado2 = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 1, '2025-10-25', '14:00:00', '15:00:00'
            );
            expect(resultado2).toBe(false);
        });

        test('Bloqueo fuera de rango de fechas NO afecta', () => {
            const bloqueo = {
                profesional_id: 1,
                fecha_inicio: '2025-10-20',
                fecha_fin: '2025-10-22',
                hora_inicio: null,
                hora_fin: null
            };

            // Fecha fuera del rango del bloqueo
            const resultado = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 1, '2025-10-25', '10:00:00', '11:00:00'
            );

            expect(resultado).toBe(false);
        });

        test('Bloqueo con rango de múltiples días funciona correctamente', () => {
            const bloqueo = {
                profesional_id: 1,
                fecha_inicio: '2025-10-20',
                fecha_fin: '2025-10-30', // 10 días
                hora_inicio: '09:00:00',
                hora_fin: '12:00:00'
            };

            // Fecha dentro del rango
            const resultado = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 1, '2025-10-25', '10:00:00', '11:00:00'
            );

            expect(resultado).toBe(true);
        });

        test('Soporta fechas en formato ISO timestamp', () => {
            const bloqueo = {
                profesional_id: 1,
                fecha_inicio: '2025-10-25T00:00:00Z',
                fecha_fin: '2025-10-25T23:59:59Z',
                hora_inicio: '09:00:00',
                hora_fin: '12:00:00'
            };

            const resultado = CitaValidacionUtil.bloqueoAfectaSlot(
                bloqueo, 1, '2025-10-25T10:00:00Z', '10:00:00', '11:00:00'
            );

            expect(resultado).toBe(true);
        });
    });

    // ====================================================================
    // citaSolapaConSlot()
    // ====================================================================
    describe('citaSolapaConSlot', () => {
        test('Cita de OTRO profesional NO afecta', () => {
            const cita = {
                profesional_id: 2,
                fecha_cita: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00',
                estado: 'confirmada'
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(false);
        });

        test('Cita de OTRA fecha NO afecta', () => {
            const cita = {
                profesional_id: 1,
                fecha_cita: '2025-10-20',
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00',
                estado: 'confirmada'
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(false);
        });

        test('Cita CANCELADA NO afecta', () => {
            const cita = {
                profesional_id: 1,
                fecha_cita: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00',
                estado: 'cancelada'
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(false);
        });

        test('Cita NO_ASISTIO NO afecta', () => {
            const cita = {
                profesional_id: 1,
                fecha_cita: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00',
                estado: 'no_asistio'
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(false);
        });

        test('Cita ACTIVA con solapamiento SÍ afecta', () => {
            const cita = {
                profesional_id: 1,
                fecha_cita: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00',
                estado: 'confirmada'
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(true);
        });

        test('Cita sin estado (undefined) se considera ACTIVA', () => {
            const cita = {
                profesional_id: 1,
                fecha_cita: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00'
                // Sin campo estado
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(true);
        });

        test('Soporta fecha_cita como Date object', () => {
            const cita = {
                profesional_id: 1,
                fecha_cita: new Date('2025-10-25T00:00:00Z'),
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00',
                estado: 'confirmada'
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(true);
        });

        test('Soporta fecha slot como ISO timestamp', () => {
            const cita = {
                profesional_id: 1,
                fecha_cita: '2025-10-25',
                hora_inicio: '09:00:00',
                hora_fin: '10:00:00',
                estado: 'confirmada'
            };

            const resultado = CitaValidacionUtil.citaSolapaConSlot(
                cita, 1, '2025-10-25T10:00:00Z', '09:30:00', '10:30:00'
            );

            expect(resultado).toBe(true);
        });
    });

    // ====================================================================
    // normalizarFecha()
    // ====================================================================
    describe('normalizarFecha', () => {
        test('Normaliza Date object a YYYY-MM-DD', () => {
            const fecha = new Date('2025-10-25T15:30:00Z');
            const resultado = CitaValidacionUtil.normalizarFecha(fecha);
            expect(resultado).toBe('2025-10-25');
        });

        test('Normaliza ISO timestamp a YYYY-MM-DD', () => {
            const resultado = CitaValidacionUtil.normalizarFecha('2025-10-25T15:30:00Z');
            expect(resultado).toBe('2025-10-25');
        });

        test('Mantiene formato YYYY-MM-DD sin cambios', () => {
            const resultado = CitaValidacionUtil.normalizarFecha('2025-10-25');
            expect(resultado).toBe('2025-10-25');
        });
    });

    // ====================================================================
    // formatearMensajeBloqueo()
    // ====================================================================
    describe('formatearMensajeBloqueo', () => {
        test('Nivel "basico" retorna mensaje genérico', () => {
            const bloqueo = {
                titulo: 'Vacaciones de Verano',
                es_organizacional: true
            };

            const resultado = CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'basico');
            expect(resultado).toBe('No disponible');
        });

        test('Nivel "completo" retorna solo el título', () => {
            const bloqueo = {
                titulo: 'Vacaciones de Verano',
                es_organizacional: true
            };

            const resultado = CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'completo');
            expect(resultado).toBe('Vacaciones de Verano');
        });

        test('Nivel "admin" retorna detalles completos para bloqueo organizacional', () => {
            const bloqueo = {
                titulo: 'Vacaciones de Verano',
                es_organizacional: true
            };

            const resultado = CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'admin');
            expect(resultado).toBe('Bloqueo organizacional: Vacaciones de Verano');
        });

        test('Nivel "admin" retorna detalles completos para bloqueo del profesional', () => {
            const bloqueo = {
                titulo: 'Consulta Médica',
                es_organizacional: false
            };

            const resultado = CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'admin');
            expect(resultado).toBe('Bloqueo del profesional: Consulta Médica');
        });

        test('Usa mensaje por defecto si no hay título', () => {
            const bloqueo = {
                es_organizacional: false
            };

            const resultado = CitaValidacionUtil.formatearMensajeBloqueo(bloqueo, 'completo');
            expect(resultado).toBe('Horario bloqueado');
        });
    });

    // ====================================================================
    // formatearMensajeCita()
    // ====================================================================
    describe('formatearMensajeCita', () => {
        test('Nivel "basico" retorna mensaje genérico', () => {
            const cita = {
                codigo_cita: 'ORG001-001',
                cliente_nombre: 'Juan Pérez'
            };

            const resultado = CitaValidacionUtil.formatearMensajeCita(cita, 'basico');
            expect(resultado).toBe('Ocupado');
        });

        test('Nivel "completo" retorna mensaje genérico', () => {
            const cita = {
                codigo_cita: 'ORG001-001',
                cliente_nombre: 'Juan Pérez'
            };

            const resultado = CitaValidacionUtil.formatearMensajeCita(cita, 'completo');
            expect(resultado).toBe('Cita existente');
        });

        test('Nivel "admin" retorna detalles completos', () => {
            const cita = {
                codigo_cita: 'ORG001-001',
                cliente_nombre: 'Juan Pérez'
            };

            const resultado = CitaValidacionUtil.formatearMensajeCita(cita, 'admin');
            expect(resultado).toBe('Cita ORG001-001 - Juan Pérez');
        });

        test('Usa ID si no hay codigo_cita', () => {
            const cita = {
                id: 123,
                cliente_nombre: 'Juan Pérez'
            };

            const resultado = CitaValidacionUtil.formatearMensajeCita(cita, 'admin');
            expect(resultado).toBe('Cita 123 - Juan Pérez');
        });

        test('Usa "Cliente" por defecto si no hay cliente_nombre', () => {
            const cita = {
                codigo_cita: 'ORG001-001'
            };

            const resultado = CitaValidacionUtil.formatearMensajeCita(cita, 'admin');
            expect(resultado).toBe('Cita ORG001-001 - Cliente');
        });
    });

    // ====================================================================
    // validarFormatoHora()
    // ====================================================================
    describe('validarFormatoHora', () => {
        test('Valida formato HH:MM:SS correcto', () => {
            expect(CitaValidacionUtil.validarFormatoHora('09:00:00')).toBe(true);
            expect(CitaValidacionUtil.validarFormatoHora('23:59:59')).toBe(true);
            expect(CitaValidacionUtil.validarFormatoHora('00:00:00')).toBe(true);
        });

        test('Valida formato HH:MM correcto', () => {
            expect(CitaValidacionUtil.validarFormatoHora('09:00')).toBe(true);
            expect(CitaValidacionUtil.validarFormatoHora('23:59')).toBe(true);
            expect(CitaValidacionUtil.validarFormatoHora('00:00')).toBe(true);
        });

        test('Rechaza formatos inválidos', () => {
            expect(CitaValidacionUtil.validarFormatoHora('25:00:00')).toBe(false); // Hora inválida
            expect(CitaValidacionUtil.validarFormatoHora('09:60:00')).toBe(false); // Minuto inválido
            expect(CitaValidacionUtil.validarFormatoHora('09:00:60')).toBe(false); // Segundo inválido
            expect(CitaValidacionUtil.validarFormatoHora('9:00:00')).toBe(false);  // Falta cero
            expect(CitaValidacionUtil.validarFormatoHora('09-00-00')).toBe(false); // Separador inválido
            expect(CitaValidacionUtil.validarFormatoHora('')).toBe(false);
            expect(CitaValidacionUtil.validarFormatoHora(null)).toBe(false);
            expect(CitaValidacionUtil.validarFormatoHora(undefined)).toBe(false);
        });
    });

    // ====================================================================
    // normalizarHora()
    // ====================================================================
    describe('normalizarHora', () => {
        test('Normaliza HH:MM a HH:MM:SS', () => {
            expect(CitaValidacionUtil.normalizarHora('09:00')).toBe('09:00:00');
            expect(CitaValidacionUtil.normalizarHora('23:59')).toBe('23:59:00');
        });

        test('Mantiene HH:MM:SS sin cambios', () => {
            expect(CitaValidacionUtil.normalizarHora('09:00:00')).toBe('09:00:00');
            expect(CitaValidacionUtil.normalizarHora('23:59:59')).toBe('23:59:59');
        });

        test('Retorna null para valores vacíos', () => {
            expect(CitaValidacionUtil.normalizarHora(null)).toBe(null);
            expect(CitaValidacionUtil.normalizarHora(undefined)).toBe(null);
            expect(CitaValidacionUtil.normalizarHora('')).toBe(null);
        });
    });
});
