import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';

// Query keys
export const TIPOS_VENTA_KEYS = {
  all: ['tipos-venta'],
  list: () => [...TIPOS_VENTA_KEYS.all, 'list'],
};

// Fallback local (para SSR o error de red)
const TIPOS_VENTA_FALLBACK = [
  { value: 'directa', label: 'Venta Directa', description: 'Pago inmediato', icon: 'shopping-cart', requiere: [] },
  { value: 'cotizacion', label: 'Cotización', description: 'Presupuesto', icon: 'file-text', requiere: [] },
  { value: 'apartado', label: 'Apartado', description: 'Reserva de stock', icon: 'clock', requiere: ['fecha_apartado', 'fecha_vencimiento_apartado'] },
  { value: 'cita', label: 'Venta de Cita', description: 'Vinculada a cita', icon: 'calendar', requiere: ['cita_id'], soloDesdeContexto: true },
];

/**
 * Hook para obtener tipos de venta disponibles
 * Consume la configuración desde el backend (fuente única de verdad)
 */
export function useTiposVenta() {
  return useQuery({
    queryKey: TIPOS_VENTA_KEYS.list(),
    queryFn: async () => {
      const response = await posApi.obtenerTiposVenta();
      return response.data?.data || TIPOS_VENTA_FALLBACK;
    },
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos
    placeholderData: TIPOS_VENTA_FALLBACK,
  });
}

// Constantes auxiliares exportadas (para uso sin hook cuando se necesita solo el valor)
export const TIPO_VENTA = {
  DIRECTA: 'directa',
  COTIZACION: 'cotizacion',
  APARTADO: 'apartado',
  CITA: 'cita',
};
