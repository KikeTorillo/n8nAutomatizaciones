/**
 * Constantes de Profesionales
 * Definiciones compartidas para tipos de profesional y configuraciones
 */

/**
 * Tipos de profesional válidos por industria
 * Estos valores deben coincidir con el ENUM tipo_profesional en PostgreSQL
 */
const TIPOS_PROFESIONAL = [
    // Barbería
    'barbero',
    'estilista_masculino',

    // Salón de belleza
    'estilista',
    'colorista',
    'manicurista',
    'peinados_eventos',

    // Estética y cosmetología
    'esteticista',
    'cosmetologo',
    'depilacion_laser',

    // Spa y terapias
    'masajista',
    'terapeuta_spa',
    'aromaterapeuta',
    'reflexologo',

    // Podología
    'podologo',
    'asistente_podologia',

    // Consultorio médico
    'doctor_general',
    'enfermero',
    'recepcionista_medica',

    // Academia
    'instructor',
    'profesor',
    'tutor',

    // Taller técnico
    'tecnico_auto',
    'tecnico_electronico',
    'mecanico',
    'soldador',

    // Centro fitness
    'entrenador_personal',
    'instructor_yoga',
    'instructor_pilates',
    'nutricionista',

    // Veterinaria
    'veterinario',
    'asistente_veterinario',
    'groomer',

    // Genérico
    'otro'
];

/**
 * Formas de pago válidas
 */
const FORMAS_PAGO = ['comision', 'salario', 'mixto'];

/**
 * Límites de validación
 */
const LIMITES = {
    NOMBRE_MIN: 3,
    NOMBRE_MAX: 150,
    DOCUMENTO_MAX: 30,
    EXPERIENCIA_MIN: 0,
    EXPERIENCIA_MAX: 70,
    COMISION_MIN: 0,
    COMISION_MAX: 100,
    CALIFICACION_MIN: 1.0,
    CALIFICACION_MAX: 5.0,
    MOTIVO_MAX: 500
};

module.exports = {
    TIPOS_PROFESIONAL,
    FORMAS_PAGO,
    LIMITES
};
