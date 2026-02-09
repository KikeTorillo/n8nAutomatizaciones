/**
 * ====================================================================
 * HOOKS DE PROGRAMA DE LEALTAD
 * ====================================================================
 *
 * Hooks para gestión del programa de puntos de fidelización:
 * - Configuración del programa
 * - Niveles de membresía
 * - Acumulación y canje de puntos
 * - Historial y estadísticas
 *
 * Ene 2026 - Fase 3 POS
 * Feb 2026 - Split en subcarpeta lealtad/
 * ====================================================================
 */

import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/config';

// Re-exports de sub-archivos
export { useConfiguracionLealtad, useGuardarConfiguracionLealtad } from './useConfiguracionLealtad';
export { useNivelesLealtad, useCrearNivelLealtad, useActualizarNivelLealtad, useEliminarNivelLealtad, useCrearNivelesDefault } from './useNivelesLealtad';
export { usePuntosCliente, useCalcularPuntos, useValidarCanje, useCanjearPuntos, useAcumularPuntos } from './usePuntosCliente';
export { useAjustarPuntos } from './useAjustarPuntos';
export { useHistorialPuntos, useClientesConPuntos, useEstadisticasLealtad } from './useReportesLealtad';

// Imports para el hook combinado
import { useConfiguracionLealtad } from './useConfiguracionLealtad';
import { usePuntosCliente, useCalcularPuntos, useValidarCanje, useCanjearPuntos } from './usePuntosCliente';

// =========================================================================
// HOOK COMBINADO PARA USO EN POS
// =========================================================================

/**
 * Hook combinado para uso en el flujo de venta POS
 * Combina la información de puntos del cliente con acciones de canje
 * @param {number} clienteId - ID del cliente seleccionado
 * @param {number} totalCarrito - Total actual del carrito
 * @param {boolean} tieneCupon - Si el carrito tiene cupón aplicado
 */
export function useLealtadPOS(clienteId, totalCarrito = 0, tieneCupon = false) {
  const queryClient = useQueryClient();

  // Configuración del programa
  const { data: config, isLoading: isLoadingConfig } = useConfiguracionLealtad();

  // Puntos del cliente
  const { data: puntosData, isLoading: isLoadingPuntos } = usePuntosCliente(clienteId);

  // Mutaciones
  const calcularMutation = useCalcularPuntos();
  const validarCanjeMutation = useValidarCanje();
  const canjearMutation = useCanjearPuntos();

  // Verificar si el programa está activo
  const programaActivo = config?.activo ?? false;

  // Calcular puntos que ganaría
  const calcularPuntosGanados = async () => {
    if (!programaActivo || !totalCarrito || totalCarrito <= 0) {
      return { puntos: 0, multiplicador: 1 };
    }

    try {
      return await calcularMutation.mutateAsync({
        clienteId,
        monto: totalCarrito,
        tieneCupon,
      });
    } catch {
      return { puntos: 0, multiplicador: 1 };
    }
  };

  // Validar canje
  const validarCanje = async (puntosACanjear) => {
    if (!programaActivo || !clienteId || !puntosACanjear) {
      return { valido: false, mensaje: 'Datos incompletos' };
    }

    try {
      return await validarCanjeMutation.mutateAsync({
        clienteId,
        puntos: puntosACanjear,
        totalVenta: totalCarrito,
      });
    } catch (error) {
      return { valido: false, mensaje: error.response?.data?.message || 'Error al validar' };
    }
  };

  // Canjear puntos
  const canjear = async (puntos, ventaId) => {
    if (!programaActivo || !clienteId) {
      throw new Error('El programa de lealtad no está activo');
    }

    // Primero validar
    const validacion = await validarCanje(puntos);
    if (!validacion.valido) {
      throw new Error(validacion.mensaje);
    }

    return canjearMutation.mutateAsync({
      clienteId,
      ventaId,
      puntos,
      descuento: validacion.descuento,
      descripcion: `Canje de ${puntos} puntos`,
    });
  };

  // Refrescar datos del cliente
  const refrescarPuntos = () => {
    if (clienteId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.puntos(clienteId), refetchType: 'active' });
    }
  };

  return {
    // Estado
    programaActivo,
    isLoading: isLoadingConfig || isLoadingPuntos,
    isCanjeDo: canjearMutation.isLoading,

    // Configuración
    config,

    // Puntos del cliente
    puntosDisponibles: puntosData?.puntos_disponibles ?? 0,
    puntosTotales: puntosData?.puntos_totales ?? 0,
    nivelActual: puntosData?.nivel ?? null,
    proximoNivel: puntosData?.proximo_nivel ?? null,
    puntosParaProximoNivel: puntosData?.puntos_para_proximo_nivel ?? 0,

    // Acciones
    calcularPuntosGanados,
    validarCanje,
    canjear,
    refrescarPuntos,

    // Helpers
    puedeAcumular: programaActivo && !tieneCupon || (config?.acumular_con_cupon ?? false),
    minimoPuntosCanje: config?.minimo_puntos_canje ?? 100,
    valorPunto: config?.puntos_por_peso_descuento ? 1 / config.puntos_por_peso_descuento : 0.01,
  };
}
