/**
 * ====================================================================
 * COMPONENTE - UsuarioUbicacionesTab
 * ====================================================================
 *
 * Tab que muestra las ubicaciones de almacén asignadas a un usuario
 * Permite ver, editar permisos y desasignar ubicaciones
 *
 * Ene 2026
 */

import { useState, memo } from 'react';
import {
  MapPin,
  Star,
  Package,
  Truck,
  MoreVertical,
  Plus,
  Trash2,
  Settings,
  Building2,
} from 'lucide-react';
import { Button, LoadingSpinner, Badge } from '@/components/ui';
import {
  useUbicacionesUsuario,
  useActualizarAsignacionUbicacion,
  useDesasignarUbicacionUsuario,
} from '@/hooks/personas';
import { useToast } from '@/hooks/utils';
import UsuarioUbicacionesModal from './UsuarioUbicacionesModal';

/**
 * Tab de ubicaciones asignadas a un usuario
 * @param {Object} props
 * @param {number} props.usuarioId - ID del usuario
 * @param {boolean} props.canEdit - Si puede editar (admin/propietario)
 */
function UsuarioUbicacionesTab({ usuarioId, canEdit = true }) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);

  // Fetch ubicaciones
  const { data: ubicaciones = [], isLoading } = useUbicacionesUsuario(usuarioId);

  // Mutations
  const actualizarMutation = useActualizarAsignacionUbicacion();
  const desasignarMutation = useDesasignarUbicacionUsuario();

  // Handlers
  const handleMarcarDefault = async (ubicacionId) => {
    try {
      await actualizarMutation.mutateAsync({
        usuarioId,
        ubicacionId,
        data: { es_default: true },
      });
      toast.success('Ubicación marcada como predeterminada');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar ubicación');
    }
    setMenuAbierto(null);
  };

  const handleTogglePermiso = async (ubicacionId, permiso, valorActual) => {
    try {
      await actualizarMutation.mutateAsync({
        usuarioId,
        ubicacionId,
        data: { [permiso]: !valorActual },
      });
      toast.success('Permisos actualizados');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar permisos');
    }
    setMenuAbierto(null);
  };

  const handleDesasignar = async (ubicacionId, ubicacionNombre) => {
    if (!window.confirm(`¿Desasignar la ubicación "${ubicacionNombre}"?`)) return;

    try {
      await desasignarMutation.mutateAsync({ usuarioId, ubicacionId });
      toast.success('Ubicación desasignada');
    } catch (error) {
      toast.error(error.message || 'Error al desasignar ubicación');
    }
    setMenuAbierto(null);
  };

  // Agrupar ubicaciones por sucursal
  const ubicacionesPorSucursal = ubicaciones.reduce((acc, ub) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Ubicaciones asignadas
        </h3>
        {canEdit && (
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Asignar ubicación
          </Button>
        )}
      </div>

      {/* Lista de ubicaciones */}
      {ubicaciones.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No hay ubicaciones asignadas a este usuario
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Las ubicaciones se asignan automáticamente cuando el usuario es asignado a una sucursal,
            o puedes asignarlas manualmente.
          </p>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Asignar primera ubicación
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(ubicacionesPorSucursal).map((grupo) => (
            <div key={grupo.sucursal_id}>
              {/* Header de sucursal */}
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {grupo.sucursal_nombre}
                </span>
                {grupo.sucursal_codigo && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    ({grupo.sucursal_codigo})
                  </span>
                )}
              </div>

              {/* Lista de ubicaciones de esta sucursal */}
              <div className="space-y-2 ml-6">
                {grupo.ubicaciones.map((ubicacion) => (
                  <div
                    key={ubicacion.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    {/* Info de ubicación */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {ubicacion.ubicacion_codigo}
                          </span>
                          {ubicacion.es_default && (
                            <Badge variant="warning" size="sm">
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {ubicacion.ubicacion_nombre}
                        </p>
                        {ubicacion.ubicacion_tipo && (
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            Tipo: {ubicacion.ubicacion_tipo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges de permisos y acciones */}
                    <div className="flex items-center gap-2">
                      {/* Badges de permisos */}
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={ubicacion.puede_recibir ? 'success' : 'secondary'}
                          size="sm"
                          title={ubicacion.puede_recibir ? 'Puede recibir' : 'No puede recibir'}
                        >
                          <Package className="w-3 h-3" />
                        </Badge>
                        <Badge
                          variant={ubicacion.puede_despachar ? 'success' : 'secondary'}
                          size="sm"
                          title={ubicacion.puede_despachar ? 'Puede despachar' : 'No puede despachar'}
                        >
                          <Truck className="w-3 h-3" />
                        </Badge>
                      </div>

                      {/* Menu de acciones */}
                      {canEdit && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuAbierto(menuAbierto === ubicacion.id ? null : ubicacion.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>

                          {menuAbierto === ubicacion.id && (
                            <>
                              {/* Overlay para cerrar */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuAbierto(null)}
                              />
                              {/* Menu dropdown */}
                              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                                {!ubicacion.es_default && (
                                  <button
                                    onClick={() => handleMarcarDefault(ubicacion.ubicacion_id)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <Star className="w-4 h-4" />
                                    Marcar como default
                                  </button>
                                )}
                                <button
                                  onClick={() => handleTogglePermiso(ubicacion.ubicacion_id, 'puede_recibir', ubicacion.puede_recibir)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Package className="w-4 h-4" />
                                  {ubicacion.puede_recibir ? 'Quitar permiso recibir' : 'Dar permiso recibir'}
                                </button>
                                <button
                                  onClick={() => handleTogglePermiso(ubicacion.ubicacion_id, 'puede_despachar', ubicacion.puede_despachar)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Truck className="w-4 h-4" />
                                  {ubicacion.puede_despachar ? 'Quitar permiso despachar' : 'Dar permiso despachar'}
                                </button>
                                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                <button
                                  onClick={() => handleDesasignar(ubicacion.ubicacion_id, ubicacion.ubicacion_nombre)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Desasignar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leyenda de permisos */}
      {ubicaciones.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Leyenda de permisos:</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" /> Recibir mercancía
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" /> Despachar mercancía
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" /> Ubicación predeterminada
            </span>
          </div>
        </div>
      )}

      {/* Modal de asignar ubicación */}
      <UsuarioUbicacionesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usuarioId={usuarioId}
        ubicacionesAsignadas={ubicaciones}
      />
    </div>
  );
}

export default memo(UsuarioUbicacionesTab);
