/**
 * Hooks para Eventos Digitales (invitaciones de bodas, XV años, etc.)
 *
 * Ene 2026: Refactorizado en módulos más pequeños para mejor mantenibilidad
 * Re-exporta todo para mantener compatibilidad con imports existentes
 */

// Importar todos los hooks para el default export
import {
  useEventos,
  useEvento,
  useEventoEstadisticas,
  useCrearEvento,
  useActualizarEvento,
  useEliminarEvento,
  usePublicarEvento,
  usePlantillas,
  usePlantilla,
  usePlantillasPorTipo,
  usePlantillaBloques,
  useGuardarBloquesPlantilla,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,
} from './useEventos';

import {
  useInvitados,
  useCrearInvitado,
  useActualizarInvitado,
  useEliminarInvitado,
  useImportarInvitados,
  useExportarInvitados,
  useUbicacionesEvento,
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,
} from './useInvitados';

import {
  useMesaRegalos,
  useCrearRegalo,
  useActualizarRegalo,
  useMarcarRegaloComprado,
  useEliminarRegalo,
  useFelicitaciones,
  useCrearFelicitacion,
  useAprobarFelicitacion,
  useRechazarFelicitacion,
  useEliminarFelicitacion,
  useGaleria,
  useGaleriaPublica,
  useSubirFoto,
  useCambiarEstadoFoto,
  useEliminarFoto,
  useEliminarFotoPermanente,
  useSubirFotoPublica,
  useReportarFoto,
} from './useGalerias';

import {
  useEventoPublico,
  useInvitacionPublica,
  useConfirmarRSVP,
  useMesas,
  useEstadisticasMesas,
  useCrearMesa,
  useActualizarMesa,
  useEliminarMesa,
  useActualizarPosicionesMesas,
  useAsignarInvitadoAMesa,
  useDesasignarInvitadoDeMesa,
} from './useEventosPublicos';

// Helpers centralizados - Feb 2026
export {
  EVENTO_QUERY_KEYS,
  EVENTO_QUERY_GROUPS,
  invalidateEventoDependencies,
  invalidateInvitadosDependencies,
  invalidateCheckinDependencies,
  invalidateEventosList,
} from './helpers';

// Re-exportar named exports
export {
  // Eventos y plantillas
  useEventos,
  useEvento,
  useEventoEstadisticas,
  useCrearEvento,
  useActualizarEvento,
  useEliminarEvento,
  usePublicarEvento,
  usePlantillas,
  usePlantilla,
  usePlantillasPorTipo,
  usePlantillaBloques,
  useGuardarBloquesPlantilla,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,
  // Invitados y ubicaciones
  useInvitados,
  useCrearInvitado,
  useActualizarInvitado,
  useEliminarInvitado,
  useImportarInvitados,
  useExportarInvitados,
  useUbicacionesEvento,
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,
  // Galería, felicitaciones y mesa de regalos
  useMesaRegalos,
  useCrearRegalo,
  useActualizarRegalo,
  useMarcarRegaloComprado,
  useEliminarRegalo,
  useFelicitaciones,
  useCrearFelicitacion,
  useAprobarFelicitacion,
  useRechazarFelicitacion,
  useEliminarFelicitacion,
  useGaleria,
  useGaleriaPublica,
  useSubirFoto,
  useCambiarEstadoFoto,
  useEliminarFoto,
  useEliminarFotoPermanente,
  useSubirFotoPublica,
  useReportarFoto,
  // Vista pública y mesas
  useEventoPublico,
  useInvitacionPublica,
  useConfirmarRSVP,
  useMesas,
  useEstadisticasMesas,
  useCrearMesa,
  useActualizarMesa,
  useEliminarMesa,
  useActualizarPosicionesMesas,
  useAsignarInvitadoAMesa,
  useDesasignarInvitadoDeMesa,
};

// Default export con todos los hooks (para compatibilidad)
export default {
  // Eventos
  useEventos,
  useEvento,
  useEventoEstadisticas,
  useCrearEvento,
  useActualizarEvento,
  useEliminarEvento,
  usePublicarEvento,

  // Plantillas
  usePlantillas,
  usePlantilla,
  usePlantillasPorTipo,
  usePlantillaBloques,
  useGuardarBloquesPlantilla,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,

  // Invitados
  useInvitados,
  useCrearInvitado,
  useActualizarInvitado,
  useEliminarInvitado,
  useImportarInvitados,
  useExportarInvitados,

  // Ubicaciones
  useUbicacionesEvento,
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,

  // Mesa de Regalos
  useMesaRegalos,
  useCrearRegalo,
  useActualizarRegalo,
  useMarcarRegaloComprado,
  useEliminarRegalo,

  // Felicitaciones
  useFelicitaciones,
  useCrearFelicitacion,
  useAprobarFelicitacion,
  useRechazarFelicitacion,
  useEliminarFelicitacion,

  // Galería
  useGaleria,
  useGaleriaPublica,
  useSubirFoto,
  useCambiarEstadoFoto,
  useEliminarFoto,
  useEliminarFotoPermanente,
  useSubirFotoPublica,
  useReportarFoto,

  // Públicos
  useEventoPublico,
  useInvitacionPublica,
  useConfirmarRSVP,

  // Mesas
  useMesas,
  useEstadisticasMesas,
  useCrearMesa,
  useActualizarMesa,
  useEliminarMesa,
  useActualizarPosicionesMesas,
  useAsignarInvitadoAMesa,
  useDesasignarInvitadoDeMesa,
};
