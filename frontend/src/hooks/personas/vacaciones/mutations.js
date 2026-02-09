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
    onError: createCRUDErrorHandler('update', 'Política'),
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
    onError: createCRUDErrorHandler('create', 'Nivel'),
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
    onError: createCRUDErrorHandler('update', 'Nivel'),
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
    onError: createCRUDErrorHandler('delete', 'Nivel'),
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
    onError: createCRUDErrorHandler('create', 'Niveles preset'),
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
    onError: createCRUDErrorHandler('update', 'Saldo'),
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
    onError: createCRUDErrorHandler('create', 'Saldos'),
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
    onError: createCRUDErrorHandler('create', 'Solicitud'),
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
    onError: createCRUDErrorHandler('update', 'Solicitud'),
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
    onError: createCRUDErrorHandler('update', 'Solicitud'),
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
    onError: createCRUDErrorHandler('update', 'Solicitud'),
  });
}
