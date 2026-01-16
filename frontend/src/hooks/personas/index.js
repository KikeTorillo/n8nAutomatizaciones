/**
 * Hooks de Personas
 * Re-exports centralizados para gestión de clientes, profesionales, empleados
 */

// Clientes y CRM
export * from './useClientes';
export * from './useEtiquetasClientes';
export * from './useClienteActividades';
export * from './useClienteDocumentos';
export * from './useOportunidades';
export * from './useClienteCredito';

// Profesionales y Empleados
export * from './useProfesionales';
export * from './useUsuarios';
export * from './useOrganigrama';
export * from './usePuestos';
export * from './useDepartamentos';
export * from './useCategoriasProfesional';

// RRHH - Ausencias
export * from './useVacaciones';
export * from './useIncapacidades';
export * from './useAusencias';

// RRHH - Datos de empleado
export * from './useOnboardingEmpleados';
export * from './useDocumentosEmpleado';
export * from './useEducacionFormal';
export * from './useExperienciaLaboral';
export * from './useHabilidades';
export * from './useCuentasBancarias';
export * from './useCategoriasPago';
export * from './useMotivosSalida';
export * from './useUbicacionesTrabajo';
