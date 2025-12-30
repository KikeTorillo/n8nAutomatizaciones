/**
 * Seccion de Landed Costs (Costos en Destino)
 * Para agregar y distribuir costos adicionales en OC
 * Fecha: 30 Diciembre 2025
 */

import { useState } from 'react';
import {
  Plus,
  Trash2,
  DollarSign,
  Truck,
  Shield,
  FileText,
  Package,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  useCostosAdicionales,
  useResumenCostos,
  useCrearCostoAdicional,
  useEliminarCostoAdicional,
  useDistribuirCosto,
  useDistribuirTodosCostos,
} from '@/hooks/useLandedCosts';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

// Tipos de costo con iconos
const TIPOS_COSTO = [
  { value: 'flete', label: 'Flete', icon: Truck },
  { value: 'arancel', label: 'Arancel/Aduana', icon: FileText },
  { value: 'seguro', label: 'Seguro', icon: Shield },
  { value: 'manipulacion', label: 'Manipulacion', icon: Package },
  { value: 'almacenaje', label: 'Almacenaje', icon: Package },
  { value: 'otro', label: 'Otro', icon: DollarSign },
];

const METODOS_DISTRIBUCION = [
  { value: 'valor', label: 'Por Valor', description: 'Proporcional al valor de cada linea' },
  { value: 'cantidad', label: 'Por Cantidad', description: 'Proporcional a unidades' },
  { value: 'peso', label: 'Por Peso', description: 'Requiere peso en productos' },
  { value: 'volumen', label: 'Por Volumen', description: 'Requiere volumen en productos' },
];

/**
 * Componente de seccion de Landed Costs
 * @param {Object} props
 * @param {number} props.ordenCompraId - ID de la OC
 * @param {boolean} props.readOnly - Solo lectura (para OC recibidas)
 */
export default function LandedCostsSection({ ordenCompraId, readOnly = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo_costo: 'flete',
    monto_total: '',
    descripcion: '',
    referencia_externa: '',
    metodo_distribucion: 'valor',
  });

  const { data: costos, isLoading: loadingCostos } = useCostosAdicionales(ordenCompraId);
  const { data: resumen } = useResumenCostos(ordenCompraId);

  const crearMutation = useCrearCostoAdicional();
  const eliminarMutation = useEliminarCostoAdicional();
  const distribuirMutation = useDistribuirCosto();
  const distribuirTodosMutation = useDistribuirTodosCostos();

  const handleCrear = async () => {
    if (!formData.monto_total || parseFloat(formData.monto_total) <= 0) {
      return;
    }

    try {
      await crearMutation.mutateAsync({
        ordenCompraId,
        data: {
          ...formData,
          monto_total: parseFloat(formData.monto_total),
        },
      });
      setFormData({
        tipo_costo: 'flete',
        monto_total: '',
        descripcion: '',
        referencia_externa: '',
        metodo_distribucion: 'valor',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error al crear costo:', error);
    }
  };

  const handleEliminar = async (costoId) => {
    if (!confirm('Eliminar este costo adicional?')) return;

    try {
      await eliminarMutation.mutateAsync({ ordenCompraId, costoId });
    } catch (error) {
      console.error('Error al eliminar costo:', error);
    }
  };

  const handleDistribuir = async (costoId) => {
    try {
      await distribuirMutation.mutateAsync({ ordenCompraId, costoId });
    } catch (error) {
      console.error('Error al distribuir costo:', error);
    }
  };

  const handleDistribuirTodos = async () => {
    if (!confirm('Distribuir todos los costos pendientes?')) return;

    try {
      await distribuirTodosMutation.mutateAsync(ordenCompraId);
    } catch (error) {
      console.error('Error al distribuir costos:', error);
    }
  };

  const totalCostos = resumen?.totales?.total_costos || 0;
  const costosPendientes = resumen?.totales?.total_pendiente || 0;
  const costosDistribuidos = resumen?.totales?.total_distribuido || 0;

  const getIconForTipo = (tipo) => {
    const found = TIPOS_COSTO.find((t) => t.value === tipo);
    return found ? found.icon : DollarSign;
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header colapsable */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Costos Adicionales (Landed Costs)
          </span>
          {totalCostos > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              {formatCurrency(totalCostos)}
            </span>
          )}
          {costosPendientes > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              {formatCurrency(costosPendientes)} sin distribuir
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Resumen */}
          {totalCostos > 0 && (
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalCostos)}
                </span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Distribuidos:</span>
                <span className="ml-2 font-medium">{formatCurrency(costosDistribuidos)}</span>
              </div>
              <div>
                <span className="text-amber-600 dark:text-amber-400">Pendientes:</span>
                <span className="ml-2 font-medium">{formatCurrency(costosPendientes)}</span>
              </div>
            </div>
          )}

          {/* Lista de costos */}
          {loadingCostos ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : costos?.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Sin costos adicionales registrados
            </p>
          ) : (
            <div className="space-y-2">
              {costos?.map((costo) => {
                const IconComponent = getIconForTipo(costo.tipo_costo);
                return (
                  <div
                    key={costo.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      costo.distribuido
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {costo.tipo_costo}
                          </span>
                          {costo.distribuido && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {costo.descripcion && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {costo.descripcion}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Metodo: {costo.metodo_distribucion}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(costo.monto_moneda_local || costo.monto_total)}
                      </span>

                      {!readOnly && !costo.distribuido && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDistribuir(costo.id)}
                            disabled={distribuirMutation.isPending}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                            title="Distribuir"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(costo.id)}
                            disabled={eliminarMutation.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulario para agregar */}
          {!readOnly && showForm && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Tipo de Costo"
                  value={formData.tipo_costo}
                  onChange={(e) => setFormData({ ...formData, tipo_costo: e.target.value })}
                >
                  {TIPOS_COSTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Select>

                <Input
                  type="number"
                  label="Monto"
                  value={formData.monto_total}
                  onChange={(e) => setFormData({ ...formData, monto_total: e.target.value })}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Metodo Distribucion"
                  value={formData.metodo_distribucion}
                  onChange={(e) =>
                    setFormData({ ...formData, metodo_distribucion: e.target.value })
                  }
                >
                  {METODOS_DISTRIBUCION.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Referencia/Factura"
                  value={formData.referencia_externa}
                  onChange={(e) =>
                    setFormData({ ...formData, referencia_externa: e.target.value })
                  }
                  placeholder="Num. factura proveedor"
                />
              </div>

              <Input
                label="Descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripcion del costo"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCrear}
                  disabled={crearMutation.isPending || !formData.monto_total}
                >
                  {crearMutation.isPending ? 'Guardando...' : 'Agregar Costo'}
                </Button>
              </div>
            </div>
          )}

          {/* Acciones */}
          {!readOnly && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Costo
              </Button>

              {costosPendientes > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDistribuirTodos}
                  disabled={distribuirTodosMutation.isPending}
                >
                  {distribuirTodosMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Distribuyendo...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Distribuir Todos
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Nota informativa */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 dark:text-blue-300">
              Los costos distribuidos se agregan al costo unitario de cada producto al recibir la
              mercancia. Use &quot;Por Valor&quot; para distribuir proporcionalmente al precio de
              cada linea.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
