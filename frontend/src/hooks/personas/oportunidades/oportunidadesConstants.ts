/**
 * Constantes y tipos para Oportunidades B2B
 * Extraído de useOportunidades.ts — Feb 2026
 */

// ====================================================================
// INTERFACES
// ====================================================================

export interface PrioridadConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface EstadoConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface FuenteConfig {
  value: string;
  label: string;
}

export interface OportunidadData {
  nombre?: string;
  cliente_id?: number;
  etapa_id?: number;
  vendedor_id?: number;
  ingreso_estimado?: number;
  probabilidad?: number;
  prioridad?: string;
  fuente?: string;
  fecha_cierre_estimada?: string;
  notas?: string;
  [key: string]: unknown;
}

export interface EtapaData {
  nombre?: string;
  color?: string;
  orden?: number;
  activo?: boolean;
  probabilidad_default?: number;
  [key: string]: unknown;
}

export interface ActualizarEtapaParams {
  etapaId: number;
  data: EtapaData;
}

export interface ActualizarOportunidadParams {
  oportunidadId: number;
  data: Partial<OportunidadData>;
}

export interface MoverOportunidadParams {
  oportunidadId: number;
  etapaId: number;
}

export interface MarcarPerdidaParams {
  oportunidadId: number;
  motivoPerdida: string;
}

export interface OportunidadesListParams {
  estado?: string;
  etapa_id?: number;
  vendedor_id?: number;
  cliente_id?: number;
  prioridad?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

// ====================================================================
// CONSTANTES
// ====================================================================

export const PRIORIDADES_OPORTUNIDAD: PrioridadConfig[] = [
  { value: 'baja', label: 'Baja', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  { value: 'normal', label: 'Normal', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'alta', label: 'Alta', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'urgente', label: 'Urgente', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

export const ESTADOS_OPORTUNIDAD: EstadoConfig[] = [
  { value: 'abierta', label: 'Abierta', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'ganada', label: 'Ganada', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'perdida', label: 'Perdida', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

export const FUENTES_OPORTUNIDAD: FuenteConfig[] = [
  { value: 'web', label: 'Sitio web' },
  { value: 'referido', label: 'Referido' },
  { value: 'llamada', label: 'Llamada entrante' },
  { value: 'evento', label: 'Evento/Feria' },
  { value: 'redes_sociales', label: 'Redes sociales' },
  { value: 'otro', label: 'Otro' },
];

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

export function getPrioridadOportunidad(prioridad: string): PrioridadConfig {
  return PRIORIDADES_OPORTUNIDAD.find(p => p.value === prioridad) || PRIORIDADES_OPORTUNIDAD[1];
}

export function getEstado(estado: string): EstadoConfig {
  return ESTADOS_OPORTUNIDAD.find(e => e.value === estado) || ESTADOS_OPORTUNIDAD[0];
}

export function getFuente(fuente: string | null | undefined): FuenteConfig {
  return FUENTES_OPORTUNIDAD.find(f => f.value === fuente) || { value: fuente || '', label: fuente || 'Sin especificar' };
}

export function formatMoney(amount: number | null | undefined, currency: string = 'MXN'): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcularValorPonderado(ingreso: number | null | undefined, probabilidad: number | null | undefined): number {
  if (!ingreso || !probabilidad) return 0;
  return (ingreso * probabilidad) / 100;
}

export function getProbabilidadColor(probabilidad: number): string {
  if (probabilidad >= 75) return 'text-green-500';
  if (probabilidad >= 50) return 'text-primary-500';
  if (probabilidad >= 25) return 'text-yellow-500';
  return 'text-gray-500';
}
