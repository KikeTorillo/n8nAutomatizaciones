import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Textarea from '@/components/ui/Textarea';
import {
  useAsientosContables,
  useAsiento,
  useCrearAsiento,
  useActualizarAsiento,
  usePublicarAsiento,
  useAnularAsiento,
  useEliminarAsiento,
  useCuentasAfectables,
  usePeriodosContables,
} from '@/hooks/useContabilidad';
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
  { value: 'nomina', label: 'Nómina' },
  { value: 'depreciacion', label: 'Depreciación' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'cierre', label: 'Cierre' },
];

// Colores de estado
const ESTADO_COLORS = {
  borrador: 'bg-yellow-100 text-yellow-800',
  publicado: 'bg-green-100 text-green-800',
  anulado: 'bg-red-100 text-red-800',
};

/**
 * Página de gestión de asientos contables
 */
function AsientosContablesPage() {
  const navigate = useNavigate();
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

  // Estado de modales
  const [modalOpen, setModalOpen] = useState(false);
  const [asientoVer, setAsientoVer] = useState(null);
  const [asientoEditar, setAsientoEditar] = useState(null);
  const [asientoEliminar, setAsientoEliminar] = useState(null);
  const [asientoAnular, setAsientoAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Verificar si viene con ?nuevo=true
  useEffect(() => {
    if (searchParams.get('nuevo') === 'true') {
      setModalOpen(true);
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
    setAsientoEditar(null);
    setModalOpen(true);
  };

  const handleEditarAsiento = (asiento) => {
    setAsientoEditar(asiento);
    setModalOpen(true);
  };

  const handleVerAsiento = (asiento) => {
    setAsientoVer(asiento);
  };

  const handleGuardar = async (formData) => {
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
      setModalOpen(false);
      setAsientoEditar(null);
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
    if (!asientoAnular || motivoAnulacion.length < 10) return;
    try {
      await anularAsiento.mutateAsync({
        id: asientoAnular.id,
        fecha: asientoAnular.fecha,
        motivo: motivoAnulacion,
      });
      setAsientoAnular(null);
      setMotivoAnulacion('');
    } catch {
      // Error manejado en el hook
    }
  };

  const handleEliminar = async () => {
    if (!asientoEliminar) return;
    try {
      await eliminarAsiento.mutateAsync({
        id: asientoEliminar.id,
        fecha: asientoEliminar.fecha,
      });
      setAsientoEliminar(null);
    } catch {
      // Error manejado en el hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contabilidad')}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Contabilidad
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Asientos Contables</h1>
              <p className="text-gray-600 mt-1 text-sm">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por concepto o número..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>

            {/* Fechas rápidas */}
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

            {/* Botón filtros */}
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
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Cargando asientos...
            </div>
          ) : asientosData?.asientos?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Debe
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Haber
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {asientosData.asientos.map((asiento) => (
                    <tr key={asiento.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-600">
                        #{asiento.numero_asiento}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(new Date(asiento.fecha), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {asiento.concepto}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                        {asiento.tipo?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(asiento.total_debe || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
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
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {asiento.estado === 'borrador' && (
                            <>
                              <button
                                onClick={() => handleEditarAsiento(asiento)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePublicar(asiento)}
                                className="p-1 text-gray-400 hover:text-green-600"
                                title="Publicar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAsientoEliminar(asiento)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {asiento.estado === 'publicado' && (
                            <button
                              onClick={() => setAsientoAnular(asiento)}
                              className="p-1 text-gray-400 hover:text-red-600"
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
              <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron asientos</p>
              <p className="text-sm text-gray-400 mt-1">
                {busqueda ? 'Intenta con otros términos' : 'Crea tu primer asiento contable'}
              </p>
            </div>
          )}

          {/* Paginación */}
          {asientosData?.paginacion && asientosData.paginacion.total_paginas > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Página {asientosData.paginacion.pagina_actual} de{' '}
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
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAsientoEditar(null);
        }}
        asiento={asientoEditar}
        onSave={handleGuardar}
        isLoading={crearAsiento.isPending || actualizarAsiento.isPending}
      />

      {/* Modal Ver Asiento */}
      <AsientoDetailModal
        isOpen={!!asientoVer}
        onClose={() => setAsientoVer(null)}
        asiento={asientoVer}
      />

      {/* Confirm Eliminar */}
      <ConfirmDialog
        open={!!asientoEliminar}
        onClose={() => setAsientoEliminar(null)}
        onConfirm={handleEliminar}
        title="Eliminar Asiento"
        message={`¿Estás seguro de eliminar el asiento #${asientoEliminar?.numero_asiento}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarAsiento.isPending}
      />

      {/* Modal Anular */}
      <Modal
        isOpen={!!asientoAnular}
        onClose={() => {
          setAsientoAnular(null);
          setMotivoAnulacion('');
        }}
        title="Anular Asiento"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">
                Anular asiento #{asientoAnular?.numero_asiento}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Un asiento anulado no se puede revertir. Se mantendrá en el historial pero no
                afectará los saldos contables.
              </p>
            </div>
          </div>

          <Textarea
            label="Motivo de anulación"
            required
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            rows={3}
            placeholder="Describe el motivo de la anulación (mínimo 10 caracteres)"
            error={motivoAnulacion.length > 0 && motivoAnulacion.length < 10 ? 'El motivo debe tener al menos 10 caracteres' : undefined}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setAsientoAnular(null);
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

/**
 * Modal para crear/editar asiento contable
 */
function AsientoFormModal({ isOpen, onClose, asiento, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    concepto: '',
    tipo: 'manual',
    notas: '',
    estado: 'borrador',
    movimientos: [
      { cuenta_id: '', concepto: '', debe: '', haber: '' },
      { cuenta_id: '', concepto: '', debe: '', haber: '' },
    ],
  });

  // Query cuentas afectables
  const { data: cuentas } = useCuentasAfectables();

  // Resetear form cuando cambia el asiento
  useEffect(() => {
    if (asiento?.id) {
      setFormData({
        fecha: asiento.fecha,
        concepto: asiento.concepto || '',
        tipo: asiento.tipo || 'manual',
        notas: asiento.notas || '',
        estado: asiento.estado || 'borrador',
        movimientos:
          asiento.movimientos?.map((m) => ({
            cuenta_id: m.cuenta_id,
            concepto: m.concepto || '',
            debe: m.debe || '',
            haber: m.haber || '',
          })) || [],
      });
    } else {
      setFormData({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        concepto: '',
        tipo: 'manual',
        notas: '',
        estado: 'borrador',
        movimientos: [
          { cuenta_id: '', concepto: '', debe: '', haber: '' },
          { cuenta_id: '', concepto: '', debe: '', haber: '' },
        ],
      });
    }
  }, [asiento, isOpen]);

  // Agregar movimiento
  const addMovimiento = () => {
    setFormData({
      ...formData,
      movimientos: [...formData.movimientos, { cuenta_id: '', concepto: '', debe: '', haber: '' }],
    });
  };

  // Eliminar movimiento
  const removeMovimiento = (index) => {
    if (formData.movimientos.length <= 2) return;
    setFormData({
      ...formData,
      movimientos: formData.movimientos.filter((_, i) => i !== index),
    });
  };

  // Actualizar movimiento
  const updateMovimiento = (index, field, value) => {
    const newMovimientos = [...formData.movimientos];
    newMovimientos[index] = { ...newMovimientos[index], [field]: value };
    setFormData({ ...formData, movimientos: newMovimientos });
  };

  // Calcular totales
  const totalDebe = formData.movimientos.reduce(
    (sum, m) => sum + (parseFloat(m.debe) || 0),
    0
  );
  const totalHaber = formData.movimientos.reduce(
    (sum, m) => sum + (parseFloat(m.haber) || 0),
    0
  );
  const cuadra = Math.abs(totalDebe - totalHaber) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      movimientos: formData.movimientos
        .filter((m) => m.cuenta_id && (m.debe || m.haber))
        .map((m) => ({
          ...m,
          debe: parseFloat(m.debe) || 0,
          haber: parseFloat(m.haber) || 0,
        })),
    };
    onSave(dataToSave);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asiento?.id ? 'Editar Asiento' : 'Nuevo Asiento'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos generales */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="date"
            label="Fecha *"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            options={TIPO_OPTIONS.filter((o) => o.value)}
          />
          <Select
            label="Estado"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            options={[
              { value: 'borrador', label: 'Borrador' },
              { value: 'publicado', label: 'Publicado' },
            ]}
          />
        </div>

        <Input
          label="Concepto *"
          placeholder="Descripción del asiento"
          value={formData.concepto}
          onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
          required
        />

        {/* Movimientos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Movimientos</label>
            <Button type="button" variant="ghost" size="sm" onClick={addMovimiento}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar línea
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Cuenta
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Concepto
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                    Debe
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                    Haber
                  </th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.movimientos.map((mov, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2">
                      <select
                        value={mov.cuenta_id}
                        onChange={(e) => updateMovimiento(index, 'cuenta_id', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar cuenta</option>
                        {cuentas?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.codigo} - {c.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={mov.concepto}
                        onChange={(e) => updateMovimiento(index, 'concepto', e.target.value)}
                        placeholder="Concepto específico"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={mov.debe}
                        onChange={(e) => updateMovimiento(index, 'debe', e.target.value)}
                        disabled={!!mov.haber}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={mov.haber}
                        onChange={(e) => updateMovimiento(index, 'haber', e.target.value)}
                        disabled={!!mov.debe}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2">
                      {formData.movimientos.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMovimiento(index)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-right font-medium text-gray-700">
                    Totales:
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">
                    {formatCurrency(totalDebe)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">
                    {formatCurrency(totalHaber)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Indicador de cuadre */}
          <div className={`mt-2 px-3 py-2 rounded-lg flex items-center gap-2 ${
            cuadra ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {cuadra ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm">El asiento cuadra correctamente</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Diferencia: {formatCurrency(Math.abs(totalDebe - totalHaber))}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Notas */}
        <Textarea
          label="Notas"
          value={formData.notas}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          rows={2}
          placeholder="Notas adicionales (opcional)"
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || (formData.estado === 'publicado' && !cuadra)}
          >
            {isLoading ? 'Guardando...' : asiento?.id ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal para ver detalle de asiento
 */
function AsientoDetailModal({ isOpen, onClose, asiento }) {
  const { data: asientoDetalle, isLoading } = useAsiento(
    asiento?.id,
    asiento?.fecha
  );

  if (!asiento) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Asiento #${asiento.numero_asiento}`} size="lg">
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">Cargando detalle...</div>
      ) : (
        <div className="space-y-4">
          {/* Info general */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500">Fecha</span>
              <p className="font-medium">
                {format(new Date(asientoDetalle?.fecha || asiento.fecha), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Tipo</span>
              <p className="font-medium capitalize">
                {(asientoDetalle?.tipo || asiento.tipo)?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Estado</span>
              <p>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    ESTADO_COLORS[asientoDetalle?.estado || asiento.estado]
                  }`}
                >
                  {asientoDetalle?.estado || asiento.estado}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Creado por</span>
              <p className="font-medium text-sm">
                {asientoDetalle?.creado_por_nombre || 'Sistema'}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500">Concepto</span>
            <p className="font-medium">{asientoDetalle?.concepto || asiento.concepto}</p>
          </div>

          {/* Movimientos */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Movimientos</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Cuenta
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Concepto
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Debe
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Haber
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {asientoDetalle?.movimientos?.map((mov, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-sm">
                        <span className="font-mono text-gray-600">{mov.cuenta_codigo}</span>
                        <span className="text-gray-500 ml-2">{mov.cuenta_nombre}</span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{mov.concepto || '-'}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium">
                        {mov.debe > 0 ? formatCurrency(mov.debe) : ''}
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-medium">
                        {mov.haber > 0 ? formatCurrency(mov.haber) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-right font-medium">
                      Total:
                    </td>
                    <td className="px-3 py-2 text-right font-bold">
                      {formatCurrency(asientoDetalle?.total_debe || asiento.total_debe || 0)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold">
                      {formatCurrency(asientoDetalle?.total_haber || asiento.total_haber || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notas */}
          {(asientoDetalle?.notas || asiento.notas) && (
            <div>
              <span className="text-xs text-gray-500">Notas</span>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                {asientoDetalle?.notas || asiento.notas}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default AsientosContablesPage;
