/**
 * Oportunidades B2B — barrel export
 * Split de useOportunidades.ts — Feb 2026
 */

// Constantes y helpers
export {
  PRIORIDADES_OPORTUNIDAD,
  ESTADOS_OPORTUNIDAD,
  FUENTES_OPORTUNIDAD,
  getPrioridadOportunidad,
  getEstado,
  getFuente,
  formatMoney,
  calcularValorPonderado,
  getProbabilidadColor,
} from './oportunidadesConstants';
export type {
  PrioridadConfig,
  EstadoConfig,
  FuenteConfig,
  OportunidadData,
  EtapaData,
  ActualizarEtapaParams,
  ActualizarOportunidadParams,
  MoverOportunidadParams,
  MarcarPerdidaParams,
  OportunidadesListParams,
} from './oportunidadesConstants';

// Etapas
export {
  useEtapasPipeline,
  useEstadisticasPipeline,
  useCrearEtapa,
  useActualizarEtapa,
  useEliminarEtapa,
  useReordenarEtapas,
} from './useEtapas';

// Queries oportunidades
export {
  useOportunidades,
  useOportunidadesCliente,
  useOportunidad,
  usePipeline,
  usePronosticoVentas,
  useEstadisticasOportunidadesCliente,
} from './useOportunidadList';

// Mutations oportunidades
export {
  useCrearOportunidad,
  useActualizarOportunidad,
  useEliminarOportunidad,
  useMoverOportunidad,
  useMarcarGanada,
  useMarcarPerdida,
} from './useOportunidadMutations';
