/**
 * Constantes del Módulo de Incapacidades
 * Enero 2026
 *
 * Configuración de tipos de incapacidad IMSS México
 */

// =====================================================
// TIPOS DE INCAPACIDAD IMSS
// =====================================================
const TIPOS_INCAPACIDAD = {
    ENFERMEDAD_GENERAL: 'enfermedad_general',
    MATERNIDAD: 'maternidad',
    RIESGO_TRABAJO: 'riesgo_trabajo',
};

// Configuración detallada por tipo IMSS
const TIPOS_INCAPACIDAD_CONFIG = {
    enfermedad_general: {
        codigo: 'enfermedad_general',
        label: 'Enfermedad General',
        maxSemanas: 52,
        porcentajePago: 60,
        diaInicioPago: 4,
        descripcion: 'Enfermedades no relacionadas al trabajo. Pago del 60% a partir del día 4.',
        color: '#EF4444', // red-500
    },
    maternidad: {
        codigo: 'maternidad',
        label: 'Maternidad',
        diasFijos: 84,
        maxSemanas: null, // 84 días fijos
        porcentajePago: 100,
        diaInicioPago: 1,
        descripcion: '84 días: 42 antes y 42 después del parto. Pago del 100%.',
        color: '#EC4899', // pink-500
    },
    riesgo_trabajo: {
        codigo: 'riesgo_trabajo',
        label: 'Riesgo de Trabajo',
        maxSemanas: null, // Hasta recuperación
        porcentajePago: 100,
        diaInicioPago: 1,
        descripcion: 'Accidentes o enfermedades laborales. Pago del 100% hasta recuperación.',
        color: '#F97316', // orange-500
    },
};

// =====================================================
// ESTADOS DE INCAPACIDAD
// =====================================================
const ESTADOS_INCAPACIDAD = {
    ACTIVA: 'activa',
    FINALIZADA: 'finalizada',
    CANCELADA: 'cancelada',
};

const ESTADOS_INCAPACIDAD_CONFIG = {
    activa: {
        label: 'Activa',
        color: 'green',
        descripcion: 'Incapacidad vigente',
    },
    finalizada: {
        label: 'Finalizada',
        color: 'gray',
        descripcion: 'Incapacidad terminada (fecha cumplida o finalización anticipada)',
    },
    cancelada: {
        label: 'Cancelada',
        color: 'red',
        descripcion: 'Incapacidad anulada',
    },
};

// =====================================================
// MENSAJES DE ERROR
// =====================================================
const ERRORES_INCAPACIDAD = {
    NO_ENCONTRADA: 'Incapacidad no encontrada',
    FOLIO_DUPLICADO: 'Ya existe una incapacidad con este folio IMSS en la organización',
    FECHA_INVALIDA: 'Las fechas de la incapacidad son inválidas',
    TIPO_INVALIDO: 'Tipo de incapacidad no válido',
    YA_FINALIZADA: 'Esta incapacidad ya fue finalizada',
    YA_CANCELADA: 'Esta incapacidad ya fue cancelada',
    SOLAPAMIENTO: 'Ya existe una incapacidad activa que se solapa con estas fechas para este profesional',
    PROFESIONAL_NO_ENCONTRADO: 'Profesional no encontrado',
    TIPO_BLOQUEO_NO_ENCONTRADO: 'Tipo de bloqueo "incapacidad" no encontrado en el sistema',
    ERROR_CREAR_BLOQUEO: 'Error al crear el bloqueo de horarios',
    ERROR_ACTUALIZAR_ESTADO: 'Error al actualizar el estado del profesional',
    PRORROGA_SIN_ORIGEN: 'Para crear una prórroga, debe especificar la incapacidad de origen',
    PRORROGA_ORIGEN_NO_ACTIVA: 'La incapacidad de origen debe estar activa para crear una prórroga',
    DIAS_INVALIDOS: 'Los días autorizados deben ser mayores a 0',
    FOLIO_REQUERIDO: 'El folio IMSS es obligatorio',
};

// =====================================================
// VALORES POR DEFECTO
// =====================================================
const DEFAULTS = {
    ESTADO_INICIAL: ESTADOS_INCAPACIDAD.ACTIVA,
    ORIGEN_BLOQUEO: 'incapacidad',
    CODIGO_TIPO_BLOQUEO: 'incapacidad',
};

// =====================================================
// CONFIGURACIÓN DE PAGINACIÓN
// =====================================================
const PAGINACION = {
    LIMITE_DEFAULT: 20,
    LIMITE_MAXIMO: 100,
};

module.exports = {
    TIPOS_INCAPACIDAD,
    TIPOS_INCAPACIDAD_CONFIG,
    ESTADOS_INCAPACIDAD,
    ESTADOS_INCAPACIDAD_CONFIG,
    ERRORES_INCAPACIDAD,
    DEFAULTS,
    PAGINACION,
};
