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
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';

// =========================================================================
// HOOKS PARA CONFIGURACIÓN DEL PROGRAMA
// =========================================================================

/**
 * Hook para obtener configuración del programa de lealtad
 * GET /pos/lealtad/configuracion
 */
export function useConfiguracionLealtad() {
  return useQuery({
    queryKey: ['lealtad-configuracion'],
    queryFn: async () => {
      const response = await posApi.obtenerConfiguracionLealtad();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para guardar configuración del programa de lealtad
 * PUT /pos/lealtad/configuracion
 */
export function useGuardarConfiguracionLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await posApi.guardarConfiguracionLealtad(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lealtad-configuracion']);
      queryClient.invalidateQueries(['lealtad-niveles']);
    },
  });
}

// =========================================================================
// HOOKS PARA NIVELES DE MEMBRESÍA
// =========================================================================

/**
 * Hook para listar niveles de lealtad
 * GET /pos/lealtad/niveles
 * @param {Object} options - { incluirInactivos: boolean }
 */
export function useNivelesLealtad(options = {}) {
  return useQuery({
    queryKey: ['lealtad-niveles', options],
    queryFn: async () => {
      const response = await posApi.listarNivelesLealtad({
        incluir_inactivos: options.incluirInactivos ? 'true' : 'false',
      });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para crear nivel de lealtad
 * POST /pos/lealtad/niveles
 */
export function useCrearNivelLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await posApi.crearNivelLealtad(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lealtad-niveles']);
    },
  });
}

/**
 * Hook para actualizar nivel de lealtad
 * PUT /pos/lealtad/niveles/:id
 */
export function useActualizarNivelLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await posApi.actualizarNivelLealtad(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lealtad-niveles']);
    },
  });
}

/**
 * Hook para eliminar nivel de lealtad
 * DELETE /pos/lealtad/niveles/:id
 */
export function useEliminarNivelLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await posApi.eliminarNivelLealtad(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lealtad-niveles']);
    },
  });
}

/**
 * Hook para crear niveles por defecto
 * POST /pos/lealtad/niveles/default
 */
export function useCrearNivelesDefault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await posApi.crearNivelesLealtadDefault();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lealtad-niveles']);
    },
  });
}

// =========================================================================
// HOOKS PARA PUNTOS DEL CLIENTE (USO EN POS)
// =========================================================================

/**
 * Hook para obtener puntos de un cliente
 * GET /pos/lealtad/clientes/:clienteId/puntos
 * @param {number} clienteId
 */
export function usePuntosCliente(clienteId) {
  return useQuery({
    queryKey: ['lealtad-puntos', clienteId],
    queryFn: async () => {
      const response = await posApi.obtenerPuntosCliente(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para calcular puntos que ganaría una venta (preview)
 * POST /pos/lealtad/calcular
 * @returns mutation con { mutateAsync, isLoading, ... }
 */
export function useCalcularPuntos() {
  return useMutation({
    mutationFn: async ({ clienteId, monto, tieneCupon }) => {
      const response = await posApi.calcularPuntosVenta({
        cliente_id: clienteId,
        monto,
        tiene_cupon: tieneCupon,
      });
      return response.data.data;
    },
  });
}

/**
 * Hook para validar canje de puntos (preview)
 * POST /pos/lealtad/validar-canje
 * @returns mutation con { mutateAsync, isLoading, ... }
 */
export function useValidarCanje() {
  return useMutation({
    mutationFn: async ({ clienteId, puntos, totalVenta }) => {
      const response = await posApi.validarCanjePuntos({
        cliente_id: clienteId,
        puntos,
        total_venta: totalVenta,
      });
      return response.data.data;
    },
  });
}

/**
 * Hook para canjear puntos por descuento
 * POST /pos/lealtad/canjear
 */
export function useCanjearPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, ventaId, puntos, descuento, descripcion }) => {
      const response = await posApi.canjearPuntos({
        cliente_id: clienteId,
        venta_id: ventaId,
        puntos,
        descuento,
        descripcion,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['lealtad-puntos', variables.clienteId]);
      queryClient.invalidateQueries(['lealtad-historial', variables.clienteId]);
      if (variables.ventaId) {
        queryClient.invalidateQueries(['venta', variables.ventaId]);
      }
    },
  });
}

/**
 * Hook para acumular puntos por una venta
 * POST /pos/lealtad/acumular
 */
export function useAcumularPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, ventaId, monto, descripcion }) => {
      const response = await posApi.acumularPuntos({
        cliente_id: clienteId,
        venta_id: ventaId,
        monto,
        descripcion,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['lealtad-puntos', variables.clienteId]);
      queryClient.invalidateQueries(['lealtad-historial', variables.clienteId]);
    },
  });
}

/**
 * Hook para ajuste manual de puntos (admin)
 * POST /pos/lealtad/ajustar
 */
export function useAjustarPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, puntos, motivo }) => {
      const response = await posApi.ajustarPuntos({
        cliente_id: clienteId,
        puntos,
        motivo,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['lealtad-puntos', variables.clienteId]);
      queryClient.invalidateQueries(['lealtad-historial', variables.clienteId]);
      queryClient.invalidateQueries(['lealtad-clientes']);
    },
  });
}

// =========================================================================
// HOOKS PARA HISTORIAL Y REPORTES
// =========================================================================

/**
 * Hook para obtener historial de transacciones de un cliente
 * GET /pos/lealtad/clientes/:clienteId/historial
 * @param {number} clienteId
 * @param {Object} params - { limit, offset, tipo, fechaDesde, fechaHasta }
 */
export function useHistorialPuntos(clienteId, params = {}) {
  return useQuery({
    queryKey: ['lealtad-historial', clienteId, params],
    queryFn: async () => {
      const sanitizedParams = {
        limit: params.limit,
        offset: params.offset,
        tipo: params.tipo,
        fecha_desde: params.fechaDesde,
        fecha_hasta: params.fechaHasta,
      };

      // Limpiar undefined/null
      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === undefined || sanitizedParams[key] === null) {
          delete sanitizedParams[key];
        }
      });

      const response = await posApi.obtenerHistorialPuntos(clienteId, sanitizedParams);
      return {
        transacciones: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    enabled: !!clienteId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para listar clientes con puntos (admin)
 * GET /pos/lealtad/clientes
 * @param {Object} params - { limit, offset, busqueda, nivelId, orden }
 */
export function useClientesConPuntos(params = {}) {
  return useQuery({
    queryKey: ['lealtad-clientes', params],
    queryFn: async () => {
      const sanitizedParams = {
        limit: params.limit,
        offset: params.offset,
        busqueda: params.busqueda,
        nivel_id: params.nivelId,
        orden: params.orden,
      };

      // Limpiar undefined/null/empty
      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === undefined || sanitizedParams[key] === null || sanitizedParams[key] === '') {
          delete sanitizedParams[key];
        }
      });

      const response = await posApi.listarClientesConPuntos(sanitizedParams);
      return {
        clientes: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    staleTime: 1000 * 60, // 1 minuto
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener estadísticas del programa de lealtad
 * GET /pos/lealtad/estadisticas
 * @param {number} sucursalId - ID de la sucursal (requerido para permisos)
 */
export function useEstadisticasLealtad(sucursalId) {
  return useQuery({
    queryKey: ['lealtad-estadisticas', sucursalId],
    queryFn: async () => {
      const response = await posApi.obtenerEstadisticasLealtad(sucursalId);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!sucursalId,
  });
}

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
      queryClient.invalidateQueries(['lealtad-puntos', clienteId]);
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
