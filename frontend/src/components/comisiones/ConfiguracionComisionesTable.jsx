import { useState } from 'react';
import { DollarSign, Edit, Trash2, History, CheckCircle, XCircle, Globe } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { useEliminarConfiguracionComision } from '@/hooks/otros';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de tabla para configuraciones de comisión
 *
 * @param {Array} configuraciones - Lista de configuraciones
 * @param {boolean} isLoading - Estado de carga
 * @param {function} onEdit - Callback para editar configuración
 * @param {function} onViewHistory - Callback para ver historial
 */
function ConfiguracionComisionesTable({
  configuraciones,
  isLoading,
  onEdit,
  onViewHistory,
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);

  const eliminarMutation = useEliminarConfiguracionComision();

  // Handlers
  const handleDeleteClick = (config) => {
    setSelectedConfig(config);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedConfig) {
      await eliminarMutation.mutateAsync({ id: selectedConfig.id });
      setDeleteDialogOpen(false);
      setSelectedConfig(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!configuraciones || configuraciones.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron configuraciones
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Crea una nueva configuración para comenzar a registrar comisiones
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profesional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {configuraciones.map((config) => {
                const esGlobal = !config.servicio_id;
                const valorDisplay = config.tipo_comision === 'porcentaje'
                  ? `${parseFloat(config.valor_comision)}%`
                  : formatCurrency(parseFloat(config.valor_comision));

                return (
                  <tr
                    key={config.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Profesional */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {config.profesional_nombre} {config.profesional_apellidos}
                      </div>
                    </td>

                    {/* Servicio */}
                    <td className="px-6 py-4">
                      {esGlobal ? (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Globe className="w-4 h-4 mr-1" />
                          <span className="italic">Todos los servicios</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {config.servicio_nombre}
                        </div>
                      )}
                    </td>

                    {/* Tipo */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.tipo_comision === 'porcentaje'
                          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300'
                          : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                      }`}>
                        {config.tipo_comision === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                      </span>
                    </td>

                    {/* Valor */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {valorDisplay}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.activo
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {config.activo ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activa
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactiva
                          </>
                        )}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(config)}
                        title="Editar configuración"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewHistory(config.profesional_id, config.servicio_id)}
                        title="Ver historial de cambios"
                      >
                        <History className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(config)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar configuración"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notas si existen */}
        {configuraciones.some(c => c.notas) && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              * Algunas configuraciones tienen notas adicionales. Haz clic en Editar para verlas.
            </p>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedConfig(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Configuración"
        message={`¿Estás seguro de que deseas eliminar esta configuración de comisión? ${
          selectedConfig?.servicio_id
            ? 'Las comisiones futuras para este servicio no se calcularán automáticamente.'
            : 'Las comisiones futuras para todos los servicios de este profesional no se calcularán automáticamente.'
        }`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isLoading}
      />
    </>
  );
}

export default ConfiguracionComisionesTable;
