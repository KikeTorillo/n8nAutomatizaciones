import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/modules/auth.api';
import useAuthStore, { selectSetTokens } from '@/store/authStore';
import useSucursalStore, { selectSetSucursalActiva } from '@/store/sucursalStore';
import { toast } from 'sonner';

/**
 * Hook para cambiar sucursal con regeneracion de tokens
 * Ene 2026 - Seguridad: token anterior invalidado + nuevo generado
 *
 * Flujo:
 * 1. Usuario selecciona nueva sucursal
 * 2. POST /api/v1/auth/cambiar-sucursal
 * 3. Backend valida pertenencia (usuarios_sucursales)
 * 4. Token actual -> Redis blacklist
 * 5. Nuevo JWT con sucursalId actualizado
 * 6. Frontend: setTokens + setSucursalActiva + invalidateQueries
 */
export function useCambiarSucursal() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore(selectSetTokens);
  const setSucursalActiva = useSucursalStore(selectSetSucursalActiva);

  return useMutation({
    mutationFn: async (sucursalId) => {
      const response = await authApi.cambiarSucursal({ sucursal_id: sucursalId });
      return response.data.data;
    },
    onSuccess: (data) => {
      // Actualizar token en memoria
      setTokens({ accessToken: data.accessToken });

      // Actualizar sucursal en store
      setSucursalActiva(data.sucursal);

      // Invalidar queries para refetch con nuevo contexto
      queryClient.invalidateQueries();

      toast.success(`Cambiaste a ${data.sucursal.nombre}`);
    },
    onError: (error) => {
      const message = error.response?.data?.message
        || error.response?.data?.error
        || 'Error al cambiar de sucursal';
      toast.error(message);
    },
  });
}

export default useCambiarSucursal;
