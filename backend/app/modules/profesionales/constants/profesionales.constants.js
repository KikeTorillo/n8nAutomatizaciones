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
 * Tipos de documento de empleado - Enero 2026
 * Debe coincidir con el ENUM tipo_documento_empleado en PostgreSQL
 */
const TIPOS_DOCUMENTO_EMPLEADO = [
    'identificacion',       // INE, cédula, DNI
    'pasaporte',            // Pasaporte
    'licencia_conducir',    // Licencia de manejo
    'contrato',             // Contrato laboral
    'visa',                 // Visa de trabajo
    'certificado',          // Certificaciones profesionales
    'seguro_social',        // IMSS, ISSSTE, etc.
    'comprobante_domicilio', // Recibo de luz, agua, etc.
    'carta_recomendacion',  // Cartas de recomendación
    'acta_nacimiento',      // Acta de nacimiento
    'curp',                 // CURP (México)
    'rfc',                  // RFC (México)
    'titulo_profesional',   // Título universitario
    'cedula_profesional',   // Cédula profesional
    'otro'                  // Otros documentos
];

/**
 * Tipos de cuenta bancaria - Fase 1 Enero 2026
 * Para nómina, reembolsos y comisiones
 */
const TIPOS_CUENTA_BANCARIA = ['debito', 'ahorro', 'nomina', 'credito'];

/**
 * Usos de cuenta bancaria - Fase 1 Enero 2026
 */
const USOS_CUENTA_BANCARIA = ['nomina', 'reembolsos', 'comisiones', 'todos'];

/**
 * Monedas soportadas para cuentas bancarias - Fase 1 Enero 2026
 */
const MONEDAS_CUENTA = ['MXN', 'USD', 'COP', 'EUR'];

// =====================================================
// FASE 4: CURRÍCULUM Y HABILIDADES - Enero 2026
// =====================================================

/**
 * Niveles de educación formal - Fase 4 Enero 2026
 * Debe coincidir con el ENUM nivel_educacion en PostgreSQL
 */
const NIVELES_EDUCACION = {
    basica: { value: 'basica', label: 'Educación Básica', orden: 1 },
    intermedia: { value: 'intermedia', label: 'Secundaria', orden: 2 },
    preparatoria: { value: 'preparatoria', label: 'Preparatoria/Bachillerato', orden: 3 },
    tecnica: { value: 'tecnica', label: 'Carrera Técnica', orden: 4 },
    licenciatura: { value: 'licenciatura', label: 'Licenciatura', orden: 5 },
    especialidad: { value: 'especialidad', label: 'Especialidad', orden: 6 },
    maestria: { value: 'maestria', label: 'Maestría', orden: 7 },
    doctorado: { value: 'doctorado', label: 'Doctorado', orden: 8 },
};

/**
 * Lista ordenada de niveles de educación para selects
 */
const NIVELES_EDUCACION_LISTA = Object.values(NIVELES_EDUCACION).sort((a, b) => a.orden - b.orden);

/**
 * Categorías de habilidades - Fase 4 Enero 2026
 * Debe coincidir con el ENUM categoria_habilidad en PostgreSQL
 */
const CATEGORIAS_HABILIDAD = {
    tecnica: { value: 'tecnica', label: 'Técnica', icono: '💻', descripcion: 'Habilidades técnicas específicas' },
    blanda: { value: 'blanda', label: 'Habilidad Blanda', icono: '🤝', descripcion: 'Competencias interpersonales' },
    idioma: { value: 'idioma', label: 'Idioma', icono: '🌍', descripcion: 'Idiomas hablados' },
    herramienta: { value: 'herramienta', label: 'Herramienta/Software', icono: '🔧', descripcion: 'Software y herramientas' },
    sector: { value: 'sector', label: 'Conocimiento Sectorial', icono: '📊', descripcion: 'Conocimiento de industria' },
};

/**
 * Lista de categorías de habilidad para selects
 */
const CATEGORIAS_HABILIDAD_LISTA = Object.values(CATEGORIAS_HABILIDAD);

/**
 * Niveles de dominio de habilidad - Fase 4 Enero 2026
 * Debe coincidir con el ENUM nivel_habilidad en PostgreSQL
 */
const NIVELES_HABILIDAD = {
    basico: { value: 'basico', label: 'Básico', nivel: 1, color: 'gray', descripcion: 'Conocimientos básicos' },
    intermedio: { value: 'intermedio', label: 'Intermedio', nivel: 2, color: 'blue', descripcion: 'Experiencia moderada' },
    avanzado: { value: 'avanzado', label: 'Avanzado', nivel: 3, color: 'yellow', descripcion: 'Dominio avanzado' },
    experto: { value: 'experto', label: 'Experto', nivel: 4, color: 'green', descripcion: 'Dominio experto' },
};

/**
 * Lista ordenada de niveles de habilidad para selects
 */
const NIVELES_HABILIDAD_LISTA = Object.values(NIVELES_HABILIDAD).sort((a, b) => a.nivel - b.nivel);

/**
 * Tamaños de empresa para experiencia laboral - Fase 4 Enero 2026
 */
const TAMANIOS_EMPRESA = [
    { value: 'startup', label: 'Startup (1-10 empleados)' },
    { value: 'pequena', label: 'Pequeña (11-50 empleados)' },
    { value: 'mediana', label: 'Mediana (51-250 empleados)' },
    { value: 'grande', label: 'Grande (251-1000 empleados)' },
    { value: 'corporativo', label: 'Corporativo (1000+ empleados)' },
];

/**
 * Límites de validación
 */
const LIMITES = {
    NOMBRE_MIN: 3,
    NOMBRE_MAX: 150,
    DOCUMENTO_MAX: 30,
    EXPERIENCIA_MIN: 0,
    EXPERIENCIA_MAX: 70,
    // NOTA: Comisiones se configuran en Módulo Comisiones (configuracion_comisiones)
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
    TIPOS_DOCUMENTO_EMPLEADO,
    TIPOS_CUENTA_BANCARIA,
    USOS_CUENTA_BANCARIA,
    MONEDAS_CUENTA,
    // Fase 4: Currículum y Habilidades
    NIVELES_EDUCACION,
    NIVELES_EDUCACION_LISTA,
    CATEGORIAS_HABILIDAD,
    CATEGORIAS_HABILIDAD_LISTA,
    NIVELES_HABILIDAD,
    NIVELES_HABILIDAD_LISTA,
    TAMANIOS_EMPRESA,
    LIMITES
};
