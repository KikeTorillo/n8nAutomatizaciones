/**
 * Constantes para el módulo de Organizaciones
 * Sincronizadas con ENUMs de base de datos y usadas en rutas, controllers y modelos
 *
 * ⚠️ NOTA (Nov 2025): TIPOS_INDUSTRIA removido - ahora se usa tabla dinámica categorias_industria
 * Las categorías se obtienen desde la base de datos, no están hardcodeadas
 */

// Planes disponibles (Modelo Free/Pro - Nov 2025)
const PLANES = [
    'trial',       // Período de prueba 14 días
    'free',        // 1 App gratis a elegir
    'pro',         // Todas las apps, $249/usuario
    'custom',      // Plan personalizado
    'basico',      // [LEGACY] No disponible para nuevos clientes
    'profesional'  // [LEGACY] No disponible para nuevos clientes
];

// Apps standalone disponibles para Plan Free
const APPS_STANDALONE = [
    'agendamiento',
    'inventario',
    'pos'
];

const PERIODOS_METRICAS = [
    'mes',
    'semana',
    'año'
];

// Campos que se retornan en las consultas de organizaciones (Nov 2025: categoria_id, app_seleccionada, ubicación)
const SELECT_FIELDS = [
    'id',
    'codigo_tenant',
    'slug',
    'nombre_comercial',
    'razon_social',
    'rfc_nif',
    'categoria_id',
    'configuracion_categoria',
    'email_admin',
    'telefono',
    'sitio_web',
    'logo_url',
    'colores_marca',
    'configuracion_ui',
    'plan_actual',
    'app_seleccionada',  // App elegida en Plan Free (Nov 2025)
    'mcp_credential_id',
    // Ubicación geográfica (Nov 2025 - Catálogo normalizado)
    'pais_id',
    'estado_id',
    'ciudad_id',
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

// Campos permitidos para actualización (Nov 2025: categoria_id, app_seleccionada, ubicación)
const CAMPOS_ACTUALIZABLES = [
    'nombre_comercial',
    'razon_social',
    'rfc_nif',
    'categoria_id',
    'email_admin',
    'telefono',
    'configuracion_categoria',
    'sitio_web',
    'logo_url',
    'colores_marca',
    'configuracion_ui',
    'mcp_credential_id',
    'app_seleccionada',  // App elegida en Plan Free (Nov 2025)
    // Ubicación geográfica (Nov 2025 - Catálogo normalizado)
    'pais_id',
    'estado_id',
    'ciudad_id',
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
    APPS_STANDALONE,
    PERIODOS_METRICAS,
    SELECT_FIELDS,
    CAMPOS_ACTUALIZABLES
};
