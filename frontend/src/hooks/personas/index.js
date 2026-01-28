/**
 * Hooks de Personas
 * Re-exports centralizados para gestión de clientes, profesionales, empleados
 *
 * NOTA: Algunas funciones helper tienen nombres duplicados entre archivos.
 * Este archivo maneja los conflictos con exports selectivos y aliases.
 */

// ========================================
// CLIENTES Y CRM
// ========================================

export * from './useClientes';
export * from './useEtiquetasClientes';
export * from './useClienteActividades';
export * from './useOportunidades';
export * from './useClienteCredito';

// useClienteDocumentos - exports selectivos para evitar conflictos
export {
  useDocumentosCliente,
  useCrearDocumento,
  useEliminarDocumento as useEliminarDocumentoCliente,
  useVerificarDocumento as useVerificarDocumentoCliente,
  useActualizarDocumento as useActualizarDocumentoCliente,
  useObtenerPresigned,
  TIPOS_DOCUMENTO,
  ESTADOS_VENCIMIENTO,
  getTipoDocumento,
  getEstadoVencimiento,
  estaProximoAVencer,
} from './useClienteDocumentos';

// ========================================
// PROFESIONALES Y EMPLEADOS
// ========================================

export * from './useProfesionales';
export * from './useUsuariosDisponibles';
export * from './useUsuarios';
export * from './useOrganigrama';
export * from './usePuestos';
export * from './useDepartamentos';
export * from './useCategoriasProfesional';

// ========================================
// RRHH - AUSENCIAS
// ========================================

export * from './useVacaciones';
export * from './useIncapacidades';

// useAusencias - exports selectivos para evitar conflicto con calcularDiasRestantes
export {
  TIPOS_AUSENCIA,
  TIPOS_AUSENCIA_CONFIG,
  useDashboardAusencias,
  useMisAusencias,
  useCalendarioAusencias,
  useSolicitudesPendientesAusencias,
  useEstadisticasAusencias,
  getTipoAusenciaConfig,
  formatRangoFechas,
  calcularDiasRestantes,
} from './useAusencias';

// ========================================
// RRHH - DATOS DE EMPLEADO
// ========================================

// useOnboardingEmpleados - exports selectivos para evitar conflicto con calcularDiasRestantes
export {
  onboardingKeys,
  usePlantillasOnboarding,
  usePlantillaOnboarding,
  usePlantillasSugeridas,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,
  useCrearTarea,
  useActualizarTarea,
  useEliminarTarea,
  useReordenarTareas,
  useProgresoOnboarding,
  useAplicarPlantilla,
  useMarcarTareaOnboarding,
  useEliminarProgresoOnboarding,
  useDashboardOnboarding,
  useTareasVencidasOnboarding,
  getColorEstadoTarea,
  getResponsableInfo,
  getColorProgreso,
  formatearFechaOnboarding,
  calcularDiasRestantes as calcularDiasRestantesOnboarding,
} from './useOnboardingEmpleados';

// useDocumentosEmpleado - exports selectivos para evitar conflictos
export {
  useDocumentosEmpleado,
  useSubirDocumento,
  useEliminarDocumento,
  useVerificarDocumento,
  useActualizarDocumento,
  useObtenerUrlDocumento,
  TIPOS_DOCUMENTO_EMPLEADO,
  getTipoDocumentoLabel,
  getEstadoVencimiento as getEstadoVencimientoEmpleado,
  prepararFormDataDocumento,
} from './useDocumentosEmpleado';

export * from './useEducacionFormal';
export * from './useExperienciaLaboral';
export * from './useHabilidades';
export * from './useCuentasBancarias';
export * from './useCategoriasPago';
export * from './useMotivosSalida';
export * from './useUbicacionesTrabajo';
