/**
 * ====================================================================
 * COMPONENTE - UsuarioUbicacionesModal
 * ====================================================================
 *
 * Drawer para asignar ubicaciones de almacén a un usuario
 * Solo muestra ubicaciones de sucursales donde el usuario está asignado
 *
 * Ene 2026
 */

import { useState, useEffect, memo } from 'react';
import {
  MapPin,
  Search,
  Check,
  Star,
  Package,
  Truck,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { Button, Drawer, Input, LoadingSpinner, Badge } from '@/components/ui';
import {
  useUbicacionesDisponiblesUsuario,
  useAsignarUbicacionUsuario,
} from '@/hooks/personas';
import { useToast } from '@/hooks/utils';

/**
 * Drawer para asignar ubicaciones a un usuario
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el drawer está abierto
 * @param {Function} props.onClose - Función para cerrar el drawer
 * @param {number} props.usuarioId - ID del usuario
 * @param {Array} props.ubicacionesAsignadas - Lista de ubicaciones ya asignadas
 */
function UsuarioUbicacionesModal({ isOpen, onClose, usuarioId, ubicacionesAsignadas = [] }) {
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState({});
  const [permisos, setPermisos] = useState({});

  // Fetch ubicaciones disponibles
  const { data: ubicacionesDisponibles = [], isLoading, refetch } = useUbicacionesDisponiblesUsuario(usuarioId);

  // Hook de asignación
  const asignarMutation = useAsignarUbicacionUsuario();

  // Refetch cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Reset state cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setBusqueda('');
      setSeleccionados({});
      setPermisos({});
    }
  }, [isOpen]);

  // Filtrar ubicaciones por búsqueda
  const ubicacionesFiltradas = ubicacionesDisponibles.filter((ubicacion) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      ubicacion.codigo?.toLowerCase().includes(searchLower) ||
      ubicacion.nombre?.toLowerCase().includes(searchLower) ||
      ubicacion.sucursal_nombre?.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar por sucursal
  const ubicacionesPorSucursal = ubicacionesFiltradas.reduce((acc, ub) => {
    const key = ub.sucursal_id;
    if (!acc[key]) {
      acc[key] = {
        sucursal_id: ub.sucursal_id,
        sucursal_nombre: ub.sucursal_nombre,
        sucursal_codigo: ub.sucursal_codigo,
        ubicaciones: [],
      };
    }
    acc[key].ubicaciones.push(ub);
    return acc;
  }, {});

  // Toggle selección
  const toggleSeleccion = (ubicacionId) => {
    setSeleccionados((prev) => {
      const nuevoEstado = { ...prev, [ubicacionId]: !prev[ubicacionId] };
      // Si se deselecciona, limpiar permisos
      if (!nuevoEstado[ubicacionId]) {
        setPermisos((p) => {
          const { [ubicacionId]: removed, ...rest } = p;
          return rest;
        });
      } else {
        // Inicializar permisos por defecto
        setPermisos((p) => ({
          ...p,
          [ubicacionId]: { es_default: false, puede_recibir: true, puede_despachar: true },
        }));
      }
      return nuevoEstado;
    });
  };

  // Toggle permiso individual
  const togglePermiso = (ubicacionId, permiso) => {
    setPermisos((prev) => ({
      ...prev,
      [ubicacionId]: {
        ...prev[ubicacionId],
        [permiso]: !prev[ubicacionId]?.[permiso],
      },
    }));
  };

  // Handler para asignar ubicaciones
  const handleAsignar = async () => {
    const ubicacionesParaAsignar = Object.entries(seleccionados)
      .filter(([_, isSelected]) => isSelected)
      .map(([ubicacionId]) => ({
        ubicacion_id: parseInt(ubicacionId, 10),
        ...permisos[ubicacionId],
      }));

    if (ubicacionesParaAsignar.length === 0) {
      toast.error('Selecciona al menos una ubicación para asignar');
      return;
    }

    try {
      // Asignar cada ubicación
      for (const data of ubicacionesParaAsignar) {
        await asignarMutation.mutateAsync({ usuarioId, data });
      }

      toast.success(
        `${ubicacionesParaAsignar.length} ubicación${ubicacionesParaAsignar.length > 1 ? 'es' : ''} asignada${ubicacionesParaAsignar.length > 1 ? 's' : ''} correctamente`
      );

      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al asignar ubicaciones');
    }
  };

  const ubicacionesSeleccionadas = Object.values(seleccionados).filter(Boolean).length;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Ubicaciones"
      subtitle="Selecciona las ubicaciones de almacén para este usuario"
    >
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por código, nombre o sucursal..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Info de seleccionados */}
        {ubicacionesSeleccionadas > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm px-4 py-2 rounded-lg">
            {ubicacionesSeleccionadas} ubicación{ubicacionesSeleccionadas > 1 ? 'es' : ''} seleccionada
            {ubicacionesSeleccionadas > 1 ? 's' : ''}
          </div>
        )}

        {/* Lista de ubicaciones */}
        <div className="max-h-96 overflow-y-auto -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : ubicacionesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              {ubicacionesDisponibles.length === 0 ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    No hay ubicaciones disponibles para asignar
                  </p>
                  <div className="flex items-start gap-2 text-left bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mt-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      El usuario debe estar asignado a una sucursal que tenga ubicaciones de almacén configuradas.
                      Todas las ubicaciones disponibles ya están asignadas, o las sucursales del usuario no tienen ubicaciones.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No se encontraron ubicaciones con ese criterio
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(ubicacionesPorSucursal).map((grupo) => (
                <div key={grupo.sucursal_id}>
                  {/* Header de sucursal */}
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white dark:bg-gray-900 py-1 z-10">
                    <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {grupo.sucursal_nombre}
                    </span>
                    {grupo.sucursal_codigo && (
                      <span className="text-xs text-gray-500">({grupo.sucursal_codigo})</span>
                    )}
                  </div>

                  {/* Ubicaciones de esta sucursal */}
                  <div className="space-y-2 ml-4">
                    {grupo.ubicaciones.map((ubicacion) => (
                      <div key={ubicacion.id}>
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                            seleccionados[ubicacion.id]
                              ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => toggleSeleccion(ubicacion.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox visual */}
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                seleccionados[ubicacion.id]
                                  ? 'bg-primary-600 border-primary-600'
                                  : 'border-gray-300 dark:border-gray-500'
                              }`}
                            >
                              {seleccionados[ubicacion.id] && <Check className="w-3 h-3 text-white" />}
                            </div>

                            {/* Icono */}
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </div>

                            {/* Info */}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {ubicacion.codigo}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {ubicacion.nombre}
                              </p>
                            </div>
                          </div>

                          {/* Tipo de ubicación */}
                          {ubicacion.tipo && (
                            <Badge variant="secondary" size="sm">
                              {ubicacion.tipo}
                            </Badge>
                          )}
                        </div>

                        {/* Panel de permisos (expandido cuando está seleccionado) */}
                        {seleccionados[ubicacion.id] && (
                          <div
                            className="ml-8 mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Permisos para esta ubicación:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => togglePermiso(ubicacion.id, 'es_default')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  permisos[ubicacion.id]?.es_default
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                <Star className="w-3 h-3" />
                                Default
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePermiso(ubicacion.id, 'puede_recibir')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  permisos[ubicacion.id]?.puede_recibir
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                <Package className="w-3 h-3" />
                                Recibir
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePermiso(ubicacion.id, 'puede_despachar')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  permisos[ubicacion.id]?.puede_despachar
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                <Truck className="w-3 h-3" />
                                Despachar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={asignarMutation.isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAsignar}
            disabled={ubicacionesSeleccionadas === 0 || asignarMutation.isPending}
            isLoading={asignarMutation.isPending}
            className="flex-1"
          >
            Asignar {ubicacionesSeleccionadas > 0 && `(${ubicacionesSeleccionadas})`}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default memo(UsuarioUbicacionesModal);
