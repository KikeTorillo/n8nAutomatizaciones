import { useState } from 'react';
import { usePerfilesAdmin, useActivarPerfil, useLimpiarAnalytics } from '@/hooks/useSuperAdminMarketplace';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EstrellaRating from '@/components/marketplace/EstrellaRating';
import { Store, Filter, Trash2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

/**
 * Página de Gestión de Marketplace para Super Admin
 * Permite listar, filtrar y gestionar TODOS los perfiles de marketplace
 */
export default function MarketplaceGestion() {
  const { success, error: showError } = useToast();

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    activo: undefined, // undefined = todos, 'true' = activos, 'false' = inactivos
    ciudad: '',
    rating_min: '',
    pagina: 1,
    limite: 20,
  });

  const [showFilters, setShowFilters] = useState(true);

  // Modales centralizados
  const { openModal, closeModal, isOpen } = useModalManager({
    confirm: { isOpen: false },
  });

  // Queries y Mutations
  const { data, isLoading, refetch } = usePerfilesAdmin(filtros);
  const activarPerfil = useActivarPerfil();
  const limpiarAnalytics = useLimpiarAnalytics();

  // Handlers
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      pagina: 1, // Resetear a página 1 al cambiar filtros
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      activo: undefined,
      ciudad: '',
      rating_min: '',
      pagina: 1,
      limite: 20,
    });
  };

  const handleToggleActivo = async (perfil) => {
    try {
      await activarPerfil.mutateAsync({
        id: perfil.id,
        activo: !perfil.activo,
      });
      success(
        perfil.activo
          ? 'Perfil desactivado exitosamente'
          : 'Perfil activado exitosamente'
      );
    } catch (err) {
      showError(err.message || 'Error al cambiar estado del perfil');
    }
  };

  const handleAbrirPerfil = (slug) => {
    window.open(`/${slug}`, '_blank');
  };

  const handleLimpiarAnalytics = async () => {
    try {
      await limpiarAnalytics.mutateAsync({ dias_antiguedad: 90 });
      success('Analytics antiguos eliminados exitosamente');
      closeModal('confirm');
    } catch (err) {
      showError(err.message || 'Error al limpiar analytics');
    }
  };

  const handleCambiarPagina = (nuevaPagina) => {
    setFiltros((prev) => ({ ...prev, pagina: nuevaPagina }));
  };

  // UI
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  const perfiles = data?.perfiles || [];
  const paginacion = data?.paginacion || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra todos los perfiles del directorio público
          </p>
        </div>
        <Button
          onClick={() => openModal('confirm')}
          variant="danger"
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar Analytics
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">Filtros</span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {showFilters && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro Estado */}
              <Select
                label="Estado"
                value={filtros.activo === undefined ? '' : filtros.activo}
                onChange={(e) =>
                  handleFiltroChange(
                    'activo',
                    e.target.value === '' ? undefined : e.target.value
                  )
                }
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>

              {/* Filtro Ciudad */}
              <Input
                label="Ciudad"
                placeholder="Buscar por ciudad..."
                value={filtros.ciudad}
                onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
              />

              {/* Filtro Rating */}
              <Input
                label="Rating Mínimo"
                type="number"
                min="0"
                max="5"
                step="0.5"
                placeholder="0.0 - 5.0"
                value={filtros.rating_min}
                onChange={(e) => handleFiltroChange('rating_min', e.target.value)}
              />

              {/* Botón Limpiar */}
              <div className="flex items-end">
                <Button
                  onClick={handleLimpiarFiltros}
                  variant="secondary"
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        {perfiles.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron perfiles con los filtros aplicados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Negocio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {perfiles.map((perfil) => (
                    <tr
                      key={perfil.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleAbrirPerfil(perfil.slug)}
                    >
                      {/* Negocio */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {perfil.nombre_comercial}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {perfil.tipo_industria || 'Sin categoría'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 dark:text-gray-100">{perfil.ciudad}</div>
                        {perfil.estado && (
                          <div className="text-gray-500 dark:text-gray-400">{perfil.estado}, {perfil.pais || 'México'}</div>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {perfil.plan_nombre || 'Sin plan'}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          Nivel {perfil.nivel_plan || 0}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <EstrellaRating
                            rating={perfil.rating_promedio || 0}
                            size="sm"
                            readonly
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({perfil.total_reseñas || 0})
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                              perfil.activo
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {perfil.activo ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inactivo
                              </>
                            )}
                          </span>
                          {!perfil.org_activa && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                              Org. Inactiva
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {/* Toggle Activo */}
                          <button
                            onClick={() => handleToggleActivo(perfil)}
                            disabled={activarPerfil.isLoading}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              perfil.activo
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60'
                                : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {perfil.activo ? 'Desactivar' : 'Activar'}
                          </button>

                          {/* Ver Perfil */}
                          <button
                            onClick={() => handleAbrirPerfil(perfil.slug)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Ver perfil público"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {paginacion.total_paginas > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {perfiles.length} de {paginacion.total} perfiles
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleCambiarPagina(filtros.pagina - 1)}
                    disabled={filtros.pagina === 1}
                    variant="secondary"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Página {paginacion.pagina_actual} de {paginacion.total_paginas}
                  </span>
                  <Button
                    onClick={() => handleCambiarPagina(filtros.pagina + 1)}
                    disabled={filtros.pagina >= paginacion.total_paginas}
                    variant="secondary"
                    size="sm"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal confirmar limpiar analytics */}
      <ConfirmDialog
        isOpen={isOpen('confirm')}
        onClose={() => closeModal('confirm')}
        onConfirm={handleLimpiarAnalytics}
        title="Limpiar Analytics"
        message="¿Estás seguro de eliminar los datos de analytics mayores a 90 días? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={limpiarAnalytics.isLoading}
      />
    </div>
  );
}
