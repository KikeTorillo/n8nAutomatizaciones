/**
 * Barrel export para Numeros de Serie hooks
 * Gap Media Prioridad - Dic 2025
 */

// Constantes y utilidades
export {
    numeroSerieQueryKeys,
    ESTADOS_NUMERO_SERIE,
    ACCIONES_HISTORIAL,
    formatearFechaVencimiento,
} from './numeroSerieConstants';

// Queries - Listados y búsquedas
export {
    useNumerosSerie,
    useBuscarNumeroSerie,
    useNumeroSerie,
    useHistorialNumeroSerie,
    useProductosConSerie,
    useEstadisticasNumerosSerie,
    useProximosVencer,
    useVerificarExistencia,
} from './useNumeroSerieQueries';

// Queries - Por producto
export {
    useNumerosSerieDisponibles,
    useResumenNumeroSerieProducto,
} from './useNumeroSerieProducto';

// Mutations
export {
    useCrearNumeroSerie,
    useCrearNumerosSerieMultiple,
    useVenderNumeroSerie,
    useTransferirNumeroSerie,
    useDevolverNumeroSerie,
    useMarcarDefectuoso,
    useReservarNumeroSerie,
    useLiberarReservaNumeroSerie,
    useActualizarGarantia,
} from './useNumeroSerieMutations';
