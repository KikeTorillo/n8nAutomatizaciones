/**
 * Constantes para el módulo de Organizaciones
 * Sincronizadas con ENUMs de base de datos y usadas en rutas, controllers y modelos
 *
 * ⚠️ NOTA (Nov 2025): TIPOS_INDUSTRIA removido - ahora se usa tabla dinámica categorias_industria
 * Las categorías se obtienen desde la base de datos, no están hardcodeadas
 */

const PLANES = [
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

// Campos que se retornan en las consultas de organizaciones (Nov 2025: categoria_industria_id)
const SELECT_FIELDS = [
    'id',
    'codigo_tenant',
    'slug',
    'nombre_comercial',
    'razon_social',
    'rfc_nif',
    'categoria_industria_id',
    'configuracion_industria',
    'email_admin',
    'telefono',
    'sitio_web',
    'logo_url',
    'colores_marca',
    'configuracion_ui',
    'plan_actual',
    'mcp_credential_id',
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

// Campos permitidos para actualización (Nov 2025: categoria_industria_id)
const CAMPOS_ACTUALIZABLES = [
    'nombre_comercial',
    'razon_social',
    'rfc_nif',
    'categoria_industria_id',
    'email_admin',
    'telefono',
    'configuracion_industria',
    'sitio_web',
    'logo_url',
    'colores_marca',
    'configuracion_ui',
    'mcp_credential_id',
    'zona_horaria',
    'idioma',
    'moneda',
    'metadata',
    'notas_internas',
    'activo',
    'suspendido',
    'motivo_suspension'
];

module.exports = {
    PLANES,
    PERIODOS_METRICAS,
    SELECT_FIELDS,
    CAMPOS_ACTUALIZABLES
};
