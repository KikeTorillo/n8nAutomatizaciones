import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, useAuthStore, selectSetTokens } from '@/features/auth';
import useSucursalStore, { selectSetSucursalActiva } from '@/store/sucursalStore';
import usePermisosStore, { selectInvalidarCache } from '@/store/permisosStore';
import { toast } from 'sonner';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// Queries que dependen del contexto de sucursal
const QUERIES_DEPENDIENTES_SUCURSAL = [
  'ventas', 'stock-disponible', 'permiso', 'permisos-resumen',
  'promociones-evaluar', 'cupones', 'sesion-caja', 'operaciones-almacen',
  'batch-picking', 'ubicaciones-almacen', 'numeros-serie', 'conteos',
  'profesional-usuario', 'citas', 'horarios', 'disponibilidad'
];

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
  const invalidarCachePermisos = usePermisosStore(selectInvalidarCache);

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

      // Invalidar cache de permisos en el store (Fase 1.3)
      invalidarCachePermisos();

      // Invalidar solo queries dependientes de sucursal (Fase 1.2)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return QUERIES_DEPENDIENTES_SUCURSAL.includes(key);
        },
      });

      toast.success(`Cambiaste a ${data.sucursal.nombre}`);
    },
    onError: (error) => {
      const handler = createCRUDErrorHandler('update', 'Sucursal', {
        403: 'No tienes acceso a esta sucursal',
      });
      try {
        handler(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

export default useCambiarSucursal;
