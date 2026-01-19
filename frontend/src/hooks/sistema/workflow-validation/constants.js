/**
 * Constantes para validación de workflows
 */

/**
 * Tipos de error de validación
 */
export const ERROR_TYPES = {
  ESTRUCTURA: 'estructura',
  CONEXION: 'conexion',
  CICLO: 'ciclo',
  CONFIGURACION: 'configuracion',
  DATOS: 'datos',
};

/**
 * Severidad de errores
 */
export const ERROR_SEVERITY = {
  ERROR: 'error',     // Bloquea guardado
  WARNING: 'warning', // Permite guardar pero advierte
  INFO: 'info',       // Solo informativo
};
