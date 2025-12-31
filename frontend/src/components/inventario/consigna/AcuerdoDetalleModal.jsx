/**
 * Modal para ver detalle de acuerdo de consignacion
 * Incluye lista de productos y acciones
 */

import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  Plus,
  Trash2,
  PackagePlus,
  PackageMinus,
  Play,
  Building2,
  Percent,
  Calendar,
  MapPin,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useProductosAcuerdo,
  useAgregarProductoConsigna,
  useRemoverProductoConsigna,
} from '@/hooks/useConsigna';
import { useProductos } from '@/hooks/useProductos';

const ESTADOS = {
  borrador: { label: 'Borrador', color: 'gray', icon: Clock },
  activo: { label: 'Activo', color: 'green', icon: CheckCircle },
  pausado: { label: 'Pausado', color: 'amber', icon: Pause },
  terminado: { label: 'Terminado', color: 'red', icon: XCircle },
};

export default function AcuerdoDetalleModal({
  acuerdo,
  isOpen,
  onClose,
  onRecibir,
  onDevolver,
  onActivar,
  onPausar,
  onTerminar,
}) {
  const [showAgregarProducto, setShowAgregarProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ producto_id: '', precio_consigna: '' });
  const [productoRemover, setProductoRemover] = useState(null);

  const { data: productos, isLoading: loadingProductos } = useProductosAcuerdo(acuerdo?.id);
  const { data: catalogoProductos } = useProductos({ limit: 100 });

  const agregarMutation = useAgregarProductoConsigna();
  const removerMutation = useRemoverProductoConsigna();

  if (!acuerdo) return null;

  const estadoInfo = ESTADOS[acuerdo.estado] || ESTADOS.borrador;
  const IconEstado = estadoInfo.icon;

  const handleAgregarProducto = () => {
    if (!nuevoProducto.producto_id || !nuevoProducto.precio_consigna) return;

    agregarMutation.mutate(
      {
        acuerdoId: acuerdo.id,
        data: {
          producto_id: parseInt(nuevoProducto.producto_id),
          precio_consigna: parseFloat(nuevoProducto.precio_consigna),
        },
      },
      {
        onSuccess: () => {
          setNuevoProducto({ producto_id: '', precio_consigna: '' });
          setShowAgregarProducto(false);
        },
      }
    );
  };

  const handleRemoverProducto = (productoId, varianteId) => {
    setProductoRemover({ productoId, varianteId });
  };

  const doRemoverProducto = () => {
    if (!productoRemover) return;
    removerMutation.mutate(
      {
        acuerdoId: acuerdo.id,
        productoId: productoRemover.productoId,
        varianteId: productoRemover.varianteId,
      },
      { onSettled: () => setProductoRemover(null) }
    );
  };

  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Acuerdo ${acuerdo.folio}`} size="lg">
      <div className="space-y-6">
        {/* Estado y datos generales */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full ${colorClasses[estadoInfo.color]}`}
          >
            <IconEstado className="h-4 w-4" />
            {estadoInfo.label}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Creado: {acuerdo.creado_en && format(new Date(acuerdo.creado_en), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>

        {/* Info del acuerdo */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Proveedor</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {acuerdo.proveedor_nombre || acuerdo.proveedor_razon_social}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comision</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {acuerdo.porcentaje_comision}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dias Liquidacion</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {acuerdo.dias_liquidacion || 30} dias
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ubicacion</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {acuerdo.ubicacion_nombre || 'Sin ubicacion especifica'}
              </p>
            </div>
          </div>
        </div>

        {/* Productos del acuerdo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Productos en el Acuerdo
            </h3>
            {(acuerdo.estado === 'borrador' || acuerdo.estado === 'activo') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAgregarProducto(!showAgregarProducto)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            )}
          </div>

          {/* Form agregar producto */}
          {showAgregarProducto && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={nuevoProducto.producto_id}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, producto_id: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Seleccionar producto...</option>
                  {catalogoProductos?.productos?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} - {p.sku}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio consigna"
                  value={nuevoProducto.precio_consigna}
                  onChange={(e) =>
                    setNuevoProducto({ ...nuevoProducto, precio_consigna: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={() => setShowAgregarProducto(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAgregarProducto}
                  disabled={agregarMutation.isPending}
                  isLoading={agregarMutation.isPending}
                >
                  Agregar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de productos */}
          {loadingProductos ? (
            <div className="text-center py-4 text-gray-500">Cargando productos...</div>
          ) : productos?.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No hay productos en este acuerdo
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
              {productos?.map((prod) => (
                <div
                  key={`${prod.producto_id}-${prod.variante_id || 0}`}
                  className="flex items-center justify-between p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {prod.producto_nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SKU: {prod.producto_sku}
                      {prod.variante_nombre && ` | Variante: ${prod.variante_nombre}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(parseFloat(prod.precio_consigna || 0))}
                      </p>
                      <p className="text-xs text-gray-500">Precio consigna</p>
                    </div>
                    {acuerdo.estado !== 'terminado' && (
                      <button
                        onClick={() => handleRemoverProducto(prod.producto_id, prod.variante_id)}
                        disabled={removerMutation.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        {acuerdo.notas && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notas</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{acuerdo.notas}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {acuerdo.estado === 'activo' && (
            <>
              <Button variant="outline" onClick={onRecibir}>
                <PackagePlus className="h-4 w-4 mr-1" />
                Recibir Mercancia
              </Button>
              <Button variant="outline" onClick={onDevolver}>
                <PackageMinus className="h-4 w-4 mr-1" />
                Devolver
              </Button>
              <Button variant="ghost" onClick={onPausar}>
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            </>
          )}
          {(acuerdo.estado === 'borrador' || acuerdo.estado === 'pausado') && (
            <Button onClick={onActivar}>
              <Play className="h-4 w-4 mr-1" />
              Activar Acuerdo
            </Button>
          )}
          {acuerdo.estado === 'pausado' && (
            <Button variant="ghost" onClick={onTerminar}>
              <XCircle className="h-4 w-4 mr-1" />
              Terminar
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!productoRemover}
        onClose={() => setProductoRemover(null)}
        onConfirm={doRemoverProducto}
        title="Remover Producto"
        message="Remover este producto del acuerdo de consignacion?"
        confirmText="Remover"
        variant="danger"
        isLoading={removerMutation.isPending}
      />
    </Modal>
  );
}
