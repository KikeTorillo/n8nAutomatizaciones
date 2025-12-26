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
 * Roles que pueden supervisar - Dic 2025
 * La capacidad de supervisar se determina por el ROL del usuario vinculado
 */
const ROLES_SUPERVISORES = ['admin', 'propietario'];

/**
 * Estados laborales - Dic 2025
 */
const ESTADOS_LABORALES = ['activo', 'vacaciones', 'incapacidad', 'suspendido', 'baja'];

/**
 * Tipos de contratación - Dic 2025
 */
const TIPOS_CONTRATACION = ['tiempo_completo', 'medio_tiempo', 'temporal', 'contrato', 'freelance'];

/**
 * Géneros - Dic 2025
 */
const GENEROS = ['masculino', 'femenino', 'otro', 'no_especificado'];

/**
 * Estados civiles
 */
const ESTADOS_CIVILES = ['soltero', 'casado', 'divorciado', 'viudo', 'union_libre'];

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
    MOTIVO_MAX: 500,
    CODIGO_MAX: 20,
    DIRECCION_MAX: 500
};

module.exports = {
    TIPOS_PROFESIONAL,
    FORMAS_PAGO,
    ROLES_SUPERVISORES,
    ESTADOS_LABORALES,
    TIPOS_CONTRATACION,
    GENEROS,
    ESTADOS_CIVILES,
    LIMITES
};
