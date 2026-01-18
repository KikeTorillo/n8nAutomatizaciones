/**
 * ====================================================================
 * DOCUMENT CONSTANTS
 * ====================================================================
 *
 * Constantes consolidadas para tipos de documentos y estados de
 * vencimiento usados en documentos de clientes y empleados.
 *
 * Enero 2026
 * ====================================================================
 */

// ====================================================================
// TIPOS DE DOCUMENTO - CLIENTE
// ====================================================================

export const TIPOS_DOCUMENTO_CLIENTE = [
  { value: 'ine', label: 'INE / Identificación oficial', categoria: 'identificacion' },
  { value: 'pasaporte', label: 'Pasaporte', categoria: 'identificacion' },
  { value: 'curp', label: 'CURP', categoria: 'identificacion' },
  { value: 'rfc', label: 'Constancia RFC', categoria: 'fiscal' },
  { value: 'comprobante_domicilio', label: 'Comprobante de domicilio', categoria: 'identificacion' },
  { value: 'contrato', label: 'Contrato de servicios', categoria: 'legal' },
  { value: 'consentimiento', label: 'Consentimiento informado', categoria: 'legal' },
  { value: 'historia_clinica', label: 'Historia clínica', categoria: 'medico' },
  { value: 'receta_medica', label: 'Receta médica', categoria: 'medico' },
  { value: 'estudios_laboratorio', label: 'Estudios de laboratorio', categoria: 'medico' },
  { value: 'radiografia', label: 'Radiografía / Imagen', categoria: 'medico' },
  { value: 'poliza_seguro', label: 'Póliza de seguro', categoria: 'financiero' },
  { value: 'factura', label: 'Factura', categoria: 'financiero' },
  { value: 'comprobante_pago', label: 'Comprobante de pago', categoria: 'financiero' },
  { value: 'foto', label: 'Fotografía', categoria: 'otro' },
  { value: 'otro', label: 'Otro documento', categoria: 'otro' },
];

// ====================================================================
// TIPOS DE DOCUMENTO - EMPLEADO
// ====================================================================

export const TIPOS_DOCUMENTO_EMPLEADO = [
  { value: 'identificacion', label: 'Identificación (INE/Cédula)' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'licencia_conducir', label: 'Licencia de conducir' },
  { value: 'contrato', label: 'Contrato laboral' },
  { value: 'visa', label: 'Visa de trabajo' },
  { value: 'certificado', label: 'Certificado profesional' },
  { value: 'seguro_social', label: 'Seguro social (IMSS/ISSSTE)' },
  { value: 'comprobante_domicilio', label: 'Comprobante de domicilio' },
  { value: 'carta_recomendacion', label: 'Carta de recomendación' },
  { value: 'acta_nacimiento', label: 'Acta de nacimiento' },
  { value: 'curp', label: 'CURP' },
  { value: 'rfc', label: 'RFC' },
  { value: 'titulo_profesional', label: 'Título profesional' },
  { value: 'cedula_profesional', label: 'Cédula profesional' },
  { value: 'otro', label: 'Otro documento' },
];

// ====================================================================
// ESTADOS DE VENCIMIENTO
// ====================================================================

/**
 * Estados de vencimiento para documentos de cliente (formato array)
 */
export const ESTADOS_VENCIMIENTO_CLIENTE = [
  { value: 'vencido', label: 'Vencido', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900' },
  { value: 'por_vencer', label: 'Por vencer', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900' },
  { value: 'vigente', label: 'Vigente', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900' },
  { value: 'sin_vencimiento', label: 'Sin vencimiento', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
];

/**
 * Estados de vencimiento para documentos de empleado (formato objeto)
 */
export const ESTADOS_VENCIMIENTO_EMPLEADO = {
  sin_vencimiento: { label: 'Sin vencimiento', color: 'gray', icon: null },
  vigente: { label: 'Vigente', color: 'green', icon: null },
  por_vencer: { label: 'Por vencer', color: 'yellow', icon: null },
  vencido: { label: 'Vencido', color: 'red', icon: null },
};

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Obtiene la configuración de un tipo de documento de cliente
 * @param {string} tipo - Tipo de documento
 * @returns {Object} Configuración del tipo
 */
export function getTipoDocumentoCliente(tipo) {
  return TIPOS_DOCUMENTO_CLIENTE.find(t => t.value === tipo) ||
    TIPOS_DOCUMENTO_CLIENTE[TIPOS_DOCUMENTO_CLIENTE.length - 1];
}

/**
 * Obtiene el label de un tipo de documento de empleado
 * @param {string} tipo - Tipo de documento
 * @returns {string} Label del tipo
 */
export function getTipoDocumentoEmpleado(tipo) {
  return TIPOS_DOCUMENTO_EMPLEADO.find(t => t.value === tipo)?.label || tipo;
}

/**
 * Obtiene la configuración de estado de vencimiento (cliente)
 * @param {string} estado - Estado de vencimiento
 * @returns {Object} Configuración del estado
 */
export function getEstadoVencimientoCliente(estado) {
  return ESTADOS_VENCIMIENTO_CLIENTE.find(e => e.value === estado) ||
    ESTADOS_VENCIMIENTO_CLIENTE[3]; // sin_vencimiento
}

/**
 * Obtiene la configuración de estado de vencimiento (empleado)
 * @param {string} estado - Estado de vencimiento
 * @returns {Object} Configuración del estado
 */
export function getEstadoVencimientoEmpleado(estado) {
  return ESTADOS_VENCIMIENTO_EMPLEADO[estado] ||
    ESTADOS_VENCIMIENTO_EMPLEADO.sin_vencimiento;
}

export default {
  // Tipos de documento
  TIPOS_DOCUMENTO_CLIENTE,
  TIPOS_DOCUMENTO_EMPLEADO,

  // Estados de vencimiento
  ESTADOS_VENCIMIENTO_CLIENTE,
  ESTADOS_VENCIMIENTO_EMPLEADO,

  // Helpers
  getTipoDocumentoCliente,
  getTipoDocumentoEmpleado,
  getEstadoVencimientoCliente,
  getEstadoVencimientoEmpleado,
};
