/**
 * Mutations - Vacaciones (hooks de escritura)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vacacionesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { VACACIONES_KEYS } from './constants';

// ==================== POLÍTICA ====================

/**
 * Actualizar política de vacaciones
 */
export function useActualizarPoliticaVacaciones() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.actualizarPolitica(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.politica(), refetchType: 'active' });
      toast.success('Política de vacaciones actualizada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Política')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

// ==================== NIVELES ====================

/**
 * Crear nivel de vacaciones
 */
export function useCrearNivelVacaciones() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.crearNivel(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Nivel creado correctamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Nivel')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Actualizar nivel
 */
export function useActualizarNivelVacaciones() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await vacacionesApi.actualizarNivel(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Nivel actualizado');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Nivel')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Eliminar nivel
 */
export function useEliminarNivelVacaciones() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await vacacionesApi.eliminarNivel(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Nivel eliminado');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Nivel')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Crear niveles preset (México LFT o Colombia)
 */
export function useCrearNivelesPreset() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.crearNivelesPreset(data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      const pais = variables.pais === 'mexico' ? 'México (LFT)' : 'Colombia';
      toast.success(`Niveles de ${pais} creados correctamente`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Niveles preset')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

// ==================== SALDOS ====================

/**
 * Ajustar saldo manualmente
 */
export function useAjustarSaldo() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, dias_ajuste, motivo }) => {
      const response = await vacacionesApi.ajustarSaldo(id, { dias_ajuste, motivo });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Saldo ajustado correctamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Saldo')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Generar saldos para un año
 */
export function useGenerarSaldosAnio() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.generarSaldosAnio(data);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success(`Saldos generados: ${result.creados} nuevos, ${result.actualizados} actualizados`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Saldos')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

// ==================== SOLICITUDES ====================

/**
 * Crear solicitud de vacaciones
 */
export function useCrearSolicitudVacaciones() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await vacacionesApi.crearSolicitud(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Solicitud de vacaciones enviada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Solicitud')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Aprobar solicitud
 */
export function useAprobarSolicitud() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, notas_internas }) => {
      const response = await vacacionesApi.aprobarSolicitud(id, { notas_internas });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Solicitud aprobada. Se ha creado el bloqueo en el calendario.');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Solicitud')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Rechazar solicitud
 */
export function useRechazarSolicitud() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo_rechazo, notas_internas }) => {
      const response = await vacacionesApi.rechazarSolicitud(id, { motivo_rechazo, notas_internas });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Solicitud rechazada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Solicitud')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Cancelar solicitud
 */
export function useCancelarSolicitud() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await vacacionesApi.cancelarSolicitud(id, { motivo });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACACIONES_KEYS.all, refetchType: 'active' });
      toast.success('Solicitud cancelada');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Solicitud')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}
