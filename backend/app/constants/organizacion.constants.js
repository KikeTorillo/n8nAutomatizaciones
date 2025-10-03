/**
 * Constantes para el módulo de Organizaciones
 * Sincronizadas con ENUMs de base de datos y usadas en rutas, controllers y modelos
 */

const TIPOS_INDUSTRIA = [
    'barberia',
    'salon_belleza',
    'estetica',
    'spa',
    'podologia',
    'consultorio_medico',
    'academia',
    'taller_tecnico',
    'centro_fitness',
    'veterinaria',
    'otro'
];

const PLANES = [
    'trial',
    'basico',
    'profesional',
    'empresarial',
    'custom'
];

const PERIODOS_METRICAS = [
    'mes',
    'semana',
    'año'
];

// Campos que se retornan en las consultas de organizaciones
const SELECT_FIELDS = [
    'id',
    'codigo_tenant',
    'slug',
    'nombre_comercial',
    'razon_social',
    'rfc_nif',
    'tipo_industria',
    'configuracion_industria',
    'email_admin',
    'telefono',
    'sitio_web',
    'logo_url',
    'colores_marca',
    'configuracion_ui',
    'plan_actual',
    'activo',
    'suspendido',
    'motivo_suspension',
    'fecha_registro',
    'fecha_activacion',
    'zona_horaria',
    'idioma',
    'moneda',
    'creado_en',
    'actualizado_en'
];

// Campos permitidos para actualización
const CAMPOS_ACTUALIZABLES = [
    'nombre_comercial',
    'razon_social',
    'rfc_nif',
    'tipo_industria',
    'email_admin',
    'telefono',
    'configuracion_industria',
    'sitio_web',
    'logo_url',
    'colores_marca',
    'configuracion_ui',
    'zona_horaria',
    'idioma',
    'moneda',
    'metadata',
    'notas_internas',
    'suspendido',
    'motivo_suspension'
];

module.exports = {
    TIPOS_INDUSTRIA,
    PLANES,
    PERIODOS_METRICAS,
    SELECT_FIELDS,
    CAMPOS_ACTUALIZABLES
};
