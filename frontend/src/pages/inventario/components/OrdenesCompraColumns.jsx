/**
 * Configuración de columnas para tabla de Órdenes de Compra
 * Feb 2026 - Extracción desde OrdenesCompraPage
 */

import {
  Eye,
  Edit,
  Trash2,
  Send,
  XCircle,
  Package,
  DollarSign,
  Building2,
} from 'lucide-react';
import {
  Badge,
  DataTableActionButton,
  DataTableActions,
} from '@/components/ui';

// --- Helpers de visualización ---

const ESTADO_OC_VARIANT = {
  borrador: 'default',
  enviada: 'primary',
  parcial: 'warning',
  recibida: 'success',
  cancelada: 'error',
};

const ESTADO_PAGO_VARIANT = {
  pendiente: 'warning',
  parcial: 'warning',
  pagado: 'success',
};

export const formatearEstado = (estado) => {
  const estados = {
    borrador: 'Borrador',
    enviada: 'Enviada',
    parcial: 'Parcial',
    recibida: 'Recibida',
    cancelada: 'Cancelada',
  };
  return estados[estado] || estado;
};

export const formatearEstadoPago = (estado) => {
  const estados = {
    pendiente: 'Pendiente',
    parcial: 'Parcial',
    pagado: 'Pagado',
  };
  return estados[estado] || estado;
};

/**
 * Columnas para exportación CSV de Órdenes de Compra
 */
export const OC_CSV_COLUMNS = [
  { key: 'folio', header: 'Folio' },
  { key: 'fecha', header: 'Fecha' },
  { key: 'proveedor', header: 'Proveedor' },
  { key: 'items', header: 'Items' },
  { key: 'total', header: 'Total' },
  { key: 'estado', header: 'Estado' },
  { key: 'estado_pago', header: 'Estado Pago' },
  { key: 'notas', header: 'Notas' },
];

/**
 * Factory para crear columnas de la tabla de órdenes de compra
 * @param {Object} handlers - Handlers de acciones
 * @param {Function} handlers.onVerDetalle - (ordenId) => void
 * @param {Function} handlers.onEditar - (orden) => void
 * @param {Function} handlers.onEnviar - (orden) => void
 * @param {Function} handlers.onRecibirMercancia - (orden) => void
 * @param {Function} handlers.onRegistrarPago - (orden) => void
 * @param {Function} handlers.onCancelar - (orden) => void
 * @param {Function} handlers.onEliminar - (orden) => void
 * @returns {Array} Array de ColumnDef
 */
export function getOrdenesColumns(handlers) {
  const {
    onVerDetalle,
    onEditar,
    onEnviar,
    onRecibirMercancia,
    onRegistrarPago,
    onCancelar,
    onEliminar,
  } = handlers;

  return [
    {
      key: 'folio',
      header: 'Folio',
      width: 'md',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{row.folio}</div>
          {row.referencia_proveedor && (
            <div className="text-xs text-gray-400 dark:text-gray-500">Ref: {row.referencia_proveedor}</div>
          )}
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      hideOnMobile: true,
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {new Date(row.fecha_orden).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          {row.fecha_entrega_esperada && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Entrega: {new Date(row.fecha_entrega_esperada).toLocaleDateString('es-MX')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'proveedor',
      header: 'Proveedor',
      hideOnMobile: true,
      render: (row) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
          <div className="text-sm text-gray-900 dark:text-gray-100">{row.proveedor_nombre}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      hideOnMobile: true,
      render: (row) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">{row.items_count || 0} productos</div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => (
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${parseFloat(row.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          {parseFloat(row.monto_pagado || 0) > 0 && (
            <div className="text-xs text-green-600 dark:text-green-400">
              Pagado: ${parseFloat(row.monto_pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (row) => (
        <Badge variant={ESTADO_OC_VARIANT[row.estado] || 'default'} size="sm">
          {formatearEstado(row.estado)}
        </Badge>
      ),
    },
    {
      key: 'pago',
      header: 'Pago',
      align: 'center',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={ESTADO_PAGO_VARIANT[row.estado_pago] || 'default'} size="sm">
          {formatearEstadoPago(row.estado_pago)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <DataTableActions>
          <DataTableActionButton icon={Eye} label="Ver detalle" onClick={() => onVerDetalle(row.id)} variant="ghost" />
          {row.estado === 'borrador' && (
            <DataTableActionButton icon={Edit} label="Editar" onClick={() => onEditar(row)} variant="primary" />
          )}
          {row.estado === 'borrador' && (row.items_count || 0) > 0 && (
            <DataTableActionButton icon={Send} label="Enviar" onClick={() => onEnviar(row)} variant="primary" />
          )}
          {['enviada', 'parcial'].includes(row.estado) && (
            <DataTableActionButton icon={Package} label="Recibir" onClick={() => onRecibirMercancia(row)} variant="ghost" />
          )}
          {row.estado !== 'cancelada' && row.estado !== 'borrador' && row.estado_pago !== 'pagado' && (
            <DataTableActionButton icon={DollarSign} label="Pago" onClick={() => onRegistrarPago(row)} variant="ghost" />
          )}
          {['borrador', 'enviada', 'parcial'].includes(row.estado) && (
            <DataTableActionButton icon={XCircle} label="Cancelar" onClick={() => onCancelar(row)} variant="ghost" />
          )}
          {row.estado === 'borrador' && (
            <DataTableActionButton icon={Trash2} label="Eliminar" onClick={() => onEliminar(row)} variant="danger" />
          )}
        </DataTableActions>
      ),
    },
  ];
}
