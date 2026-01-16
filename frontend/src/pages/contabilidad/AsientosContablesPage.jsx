import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import {
  BackButton,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  Textarea
} from '@/components/ui';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useAsientosContables,
  useCrearAsiento,
  useActualizarAsiento,
  usePublicarAsiento,
  useAnularAsiento,
  useEliminarAsiento,
} from '@/hooks/useContabilidad';
import { AsientoFormModal, AsientoDetailModal } from '@/components/contabilidad';
import { formatCurrency } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Opciones de estado
const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'anulado', label: 'Anulado' },
];

// Opciones de tipo de asiento
const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'manual', label: 'Manual' },
  { value: 'venta_pos', label: 'Venta POS' },
  { value: 'compra', label: 'Compra' },
  { value: 'nomina', label: 'Nomina' },
  { value: 'depreciacion', label: 'Depreciacion' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'cierre', label: 'Cierre' },
];

// Colores de estado
const ESTADO_COLORS = {
  borrador: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
  publicado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
  anulado: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
};

/**
 * Pagina de gestion de asientos contables
 */
function AsientosContablesPage() {
  const [searchParams] = useSearchParams();

  // Estado de filtros
  const hoy = new Date();
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState(format(startOfMonth(hoy), 'yyyy-MM-dd'));
  const [fechaHasta, setFechaHasta] = useState(format(endOfMonth(hoy), 'yyyy-MM-dd'));
  const [showFilters, setShowFilters] = useState(false);
  const [pagina, setPagina] = useState(1);

  // Estado para motivo anulacion
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Modal manager para form, ver, eliminar y anular
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    ver: { isOpen: false, data: null },
    eliminar: { isOpen: false, data: null },
    anular: { isOpen: false, data: null },
  });

  // Verificar si viene con ?nuevo=true
  useEffect(() => {
    if (searchParams.get('nuevo') === 'true') {
      openModal('form', null);
    }
  }, [searchParams]);

  // Queries
  const { data: asientosData, isLoading } = useAsientosContables({
    estado: estadoFiltro || undefined,
    tipo: tipoFiltro || undefined,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    busqueda: busqueda || undefined,
    pagina,
    limite: 20,
  });

  // Mutations
  const crearAsiento = useCrearAsiento();
  const actualizarAsiento = useActualizarAsiento();
  const publicarAsiento = usePublicarAsiento();
  const anularAsiento = useAnularAsiento();
  const eliminarAsiento = useEliminarAsiento();

  // Handlers
  const handleNuevoAsiento = () => {
    openModal('form', null);
  };

  const handleEditarAsiento = (asiento) => {
    openModal('form', asiento);
  };

  const handleVerAsiento = (asiento) => {
    openModal('ver', asiento);
  };

  const handleGuardar = async (formData) => {
    const asientoEditar = getModalData('form');
    try {
      if (asientoEditar?.id) {
        await actualizarAsiento.mutateAsync({
          id: asientoEditar.id,
          fecha: asientoEditar.fecha,
          ...formData,
        });
      } else {
        await crearAsiento.mutateAsync(formData);
      }
      closeModal('form');
    } catch {
      // Error manejado en el hook
    }
  };

  const handlePublicar = async (asiento) => {
    try {
      await publicarAsiento.mutateAsync({ id: asiento.id, fecha: asiento.fecha });
    } catch {
      // Error manejado en el hook
    }
  };

  const handleAnular = async () => {
    const asientoAnular = getModalData('anular');
    if (!asientoAnular || motivoAnulacion.length < 10) return;
    try {
      await anularAsiento.mutateAsync({
        id: asientoAnular.id,
        fecha: asientoAnular.fecha,
        motivo: motivoAnulacion,
      });
      closeModal('anular');
      setMotivoAnulacion('');
    } catch {
      // Error manejado en el hook
    }
  };

  const handleEliminar = async () => {
    const asientoEliminar = getModalData('eliminar');
    if (!asientoEliminar) return;
    try {
      await eliminarAsiento.mutateAsync({
        id: asientoEliminar.id,
        fecha: asientoEliminar.fecha,
      });
      closeModal('eliminar');
    } catch {
      // Error manejado en el hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <BackButton to="/contabilidad" label="Volver a Contabilidad" className="mb-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Asientos Contables</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                Libro diario - Registro de movimientos contables
              </p>
            </div>

            <Button variant="primary" onClick={handleNuevoAsiento}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Asiento
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por concepto o numero..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>

            {/* Fechas rapidas */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-36"
              />
              <span className="self-center text-gray-400">-</span>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-36"
              />
            </div>

            {/* Boton filtros */}
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Estado"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                options={ESTADO_OPTIONS}
              />
              <Select
                label="Tipo"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                options={TIPO_OPTIONS}
              />
            </div>
          )}
        </div>

        {/* Tabla de asientos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Cargando asientos...
            </div>
          ) : asientosData?.asientos?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Numero
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Debe
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Haber
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {asientosData.asientos.map((asiento) => (
                    <tr key={asiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                        #{asiento.numero_asiento}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(asiento.fecha), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {asiento.concepto}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {asiento.tipo?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(asiento.total_debe || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(asiento.total_haber || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${ESTADO_COLORS[asiento.estado]}`}
                        >
                          {asiento.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleVerAsiento(asiento)}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {asiento.estado === 'borrador' && (
                            <>
                              <button
                                onClick={() => handleEditarAsiento(asiento)}
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePublicar(asiento)}
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                                title="Publicar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openModal('eliminar', asiento)}
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {asiento.estado === 'publicado' && (
                            <button
                              onClick={() => openModal('anular', asiento)}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                              title="Anular"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No se encontraron asientos</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {busqueda ? 'Intenta con otros terminos' : 'Crea tu primer asiento contable'}
              </p>
            </div>
          )}

          {/* Paginacion */}
          {asientosData?.paginacion && asientosData.paginacion.total_paginas > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pagina {asientosData.paginacion.pagina_actual} de{' '}
                {asientosData.paginacion.total_paginas}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina(pagina - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina >= asientosData.paginacion.total_paginas}
                  onClick={() => setPagina(pagina + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar Asiento */}
      <AsientoFormModal
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        asiento={getModalData('form')}
        onSave={handleGuardar}
        isLoading={crearAsiento.isPending || actualizarAsiento.isPending}
      />

      {/* Modal Ver Asiento */}
      <AsientoDetailModal
        isOpen={isOpen('ver')}
        onClose={() => closeModal('ver')}
        asiento={getModalData('ver')}
      />

      {/* Confirm Eliminar */}
      <ConfirmDialog
        open={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        onConfirm={handleEliminar}
        title="Eliminar Asiento"
        message={`¿Estas seguro de eliminar el asiento #${getModalData('eliminar')?.numero_asiento}? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarAsiento.isPending}
      />

      {/* Modal Anular */}
      <Modal
        isOpen={isOpen('anular')}
        onClose={() => {
          closeModal('anular');
          setMotivoAnulacion('');
        }}
        title="Anular Asiento"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                Anular asiento #{getModalData('anular')?.numero_asiento}
              </p>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                Un asiento anulado no se puede revertir. Se mantendra en el historial pero no
                afectara los saldos contables.
              </p>
            </div>
          </div>

          <Textarea
            label="Motivo de anulacion"
            required
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            rows={3}
            placeholder="Describe el motivo de la anulacion (minimo 10 caracteres)"
            error={motivoAnulacion.length > 0 && motivoAnulacion.length < 10 ? 'El motivo debe tener al menos 10 caracteres' : undefined}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                closeModal('anular');
                setMotivoAnulacion('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleAnular}
              disabled={motivoAnulacion.length < 10 || anularAsiento.isPending}
            >
              {anularAsiento.isPending ? 'Anulando...' : 'Anular Asiento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AsientosContablesPage;
