/**
 * ====================================================================
 * USE ERP DATA HOOK
 * ====================================================================
 *
 * Hook centralizado para obtener datos del ERP (servicios y profesionales).
 * Elimina duplicación de queries en ServiciosCanvasBlock y EquipoCanvasBlock.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import websiteApi from '@/services/api/modules/website.api';

/**
 * Mapeo de servicios ERP al formato esperado por el bloque
 * @param {Array} servicios - Servicios del ERP
 * @returns {Array} Servicios mapeados
 */
const mapServiciosERP = (servicios) => {
  return servicios.map(s => ({
    icono: null,
    nombre: s.nombre,
    descripcion: s.descripcion,
    precio: s.precio,
    duracion_minutos: s.duracion_minutos,
    imagen_url: s.imagen_url,
    color_servicio: s.color_servicio,
  }));
};

/**
 * Mapeo de profesionales ERP al formato esperado por el bloque
 * @param {Array} profesionales - Profesionales del ERP
 * @returns {Array} Profesionales mapeados
 */
const mapProfesionalesERP = (profesionales) => {
  return profesionales.map(p => ({
    nombre: p.nombre_completo,
    cargo: p.puesto_nombre || 'Profesional',
    descripcion: p.biografia || '',
    foto_url: p.foto_url,
    redes: {},
  }));
};

/**
 * Filtra servicios según el filtro proporcionado
 * @param {Array} servicios - Servicios a filtrar
 * @param {Object} filtro - Configuración del filtro
 * @returns {Array} Servicios filtrados
 */
const filtrarServicios = (servicios, filtro) => {
  const { modo = 'todos', categorias = [], servicio_ids = [] } = filtro;

  if (modo === 'categoria' && categorias.length > 0) {
    return servicios.filter(s => categorias.includes(s.categoria));
  }

  if (modo === 'seleccion' && servicio_ids.length > 0) {
    return servicios.filter(s => servicio_ids.includes(s.id));
  }

  return servicios;
};

/**
 * Filtra profesionales según el filtro proporcionado
 * @param {Array} profesionales - Profesionales a filtrar
 * @param {Object} filtro - Configuración del filtro
 * @returns {Array} Profesionales filtrados
 */
const filtrarProfesionales = (profesionales, filtro) => {
  const { modo = 'todos', departamento_ids = [], profesional_ids = [] } = filtro;

  if (modo === 'departamento' && departamento_ids.length > 0) {
    return profesionales.filter(p => departamento_ids.includes(p.departamento_id));
  }

  if (modo === 'seleccion' && profesional_ids.length > 0) {
    return profesionales.filter(p => profesional_ids.includes(p.id));
  }

  return profesionales;
};

/**
 * Hook para obtener datos del ERP (servicios o profesionales)
 *
 * @param {'servicios' | 'profesionales'} tipo - Tipo de datos a obtener
 * @param {Object} filtro - Filtros a aplicar
 * @param {boolean} enabled - Si el query está habilitado
 * @returns {Object} { data, isLoading, refetch, rawData }
 *
 * @example
 * // Para servicios
 * const { data, isLoading } = useERPData('servicios', filtro_erp, origen === 'erp');
 *
 * @example
 * // Para profesionales
 * const { data, isLoading } = useERPData('profesionales', filtro_profesionales, origen === 'profesionales');
 */
export function useERPData(tipo, filtro = {}, enabled = true) {
  // Query key incluye tipo y filtro para cache granular
  const queryKey = useMemo(
    () => ['website-canvas-erp', tipo, filtro],
    [tipo, filtro]
  );

  // Query para datos del ERP
  const {
    data: rawData = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (tipo === 'servicios') {
        const response = await websiteApi.obtenerServiciosERP();
        if (!response?.servicios) return [];
        return filtrarServicios(response.servicios, filtro);
      }

      if (tipo === 'profesionales') {
        const response = await websiteApi.obtenerProfesionalesERP();
        if (!response?.profesionales) return [];
        return filtrarProfesionales(response.profesionales, filtro);
      }

      return [];
    },
    enabled,
    staleTime: 1000 * 60, // 1 minuto
  });

  // Datos mapeados al formato esperado por los bloques
  const data = useMemo(() => {
    if (tipo === 'servicios') {
      return mapServiciosERP(rawData);
    }

    if (tipo === 'profesionales') {
      return mapProfesionalesERP(rawData);
    }

    return [];
  }, [tipo, rawData]);

  return {
    data,
    isLoading,
    refetch,
    rawData, // Datos sin mapear, por si se necesitan
  };
}

export default useERPData;
