import { Badge, DataTableActions, DataTableActionButton } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Eye, Percent, Calendar, CheckCircle, XCircle,
  Pause, Play, DollarSign, PackagePlus, PackageMinus,
} from 'lucide-react';

const ESTADOS_ACUERDO = {
  borrador: { label: 'Borrador', color: 'gray' },
  activo: { label: 'Activo', color: 'green' },
  pausado: { label: 'Pausado', color: 'amber' },
  terminado: { label: 'Terminado', color: 'red' },
};

const ESTADOS_LIQUIDACION = {
  borrador: { label: 'Borrador', color: 'gray' },
  confirmada: { label: 'Confirmada', color: 'blue' },
  pagada: { label: 'Pagada', color: 'green' },
  cancelada: { label: 'Cancelada', color: 'red' },
};

const BADGE_VARIANT = { gray: 'default', green: 'success', amber: 'warning', red: 'error', blue: 'info' };

function EstadoBadge({ estado, config }) {
  const info = config[estado] || { label: estado, color: 'gray' };
  return <Badge variant={BADGE_VARIANT[info.color] || 'default'} size="sm">{info.label}</Badge>;
}

export function getAcuerdosColumns({ openModal, handleActivar, handlePausar }) {
  return [
    {
      key: 'folio', header: 'Folio',
      render: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.folio}</span>,
    },
    {
      key: 'proveedor', header: 'Proveedor',
      render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.proveedor_nombre || row.proveedor_razon_social}</span>,
    },
    {
      key: 'comision', header: 'Comisión', hideOnMobile: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
          <Percent className="h-3 w-3" />{row.porcentaje_comision}%
        </span>
      ),
    },
    {
      key: 'productos', header: 'Productos', hideOnMobile: true, align: 'center',
      render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.total_productos || 0}</span>,
    },
    {
      key: 'estado', header: 'Estado',
      render: (row) => <EstadoBadge estado={row.estado} config={ESTADOS_ACUERDO} />,
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (row) => (
        <DataTableActions>
          <DataTableActionButton icon={Eye} label="Ver detalle" onClick={() => openModal('detalleAcuerdo', row)} variant="ghost" />
          {row.estado === 'activo' && (
            <>
              <DataTableActionButton icon={PackagePlus} label="Recibir mercancía" onClick={() => openModal('recibirMercancia', row)} variant="primary" />
              <DataTableActionButton icon={PackageMinus} label="Devolver mercancía" onClick={() => openModal('devolverMercancia', row)} variant="ghost" />
              <DataTableActionButton icon={Pause} label="Pausar" onClick={() => handlePausar(row.id)} variant="ghost" />
            </>
          )}
          {(row.estado === 'borrador' || row.estado === 'pausado') && (
            <DataTableActionButton icon={Play} label="Activar" onClick={() => handleActivar(row.id)} variant="primary" />
          )}
        </DataTableActions>
      ),
    },
  ];
}

export function getStockColumns() {
  return [
    {
      key: 'producto', header: 'Producto', width: 'xl',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">{row.producto_nombre}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{row.producto_sku}</span>
        </div>
      ),
    },
    { key: 'acuerdo', header: 'Acuerdo', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.acuerdo_folio}</span> },
    { key: 'proveedor', header: 'Proveedor', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.proveedor_nombre}</span> },
    { key: 'disponible', header: 'Disponible', align: 'right', render: (row) => <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.cantidad_disponible}</span> },
    { key: 'reservado', header: 'Reservado', align: 'right', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-500 dark:text-gray-400">{row.cantidad_reservada || 0}</span> },
    { key: 'precio', header: 'Precio Consigna', align: 'right', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(parseFloat(row.precio_consigna || 0))}</span> },
    { key: 'valor', header: 'Valor', align: 'right', render: (row) => <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(parseFloat(row.cantidad_disponible || 0) * parseFloat(row.precio_consigna || 0))}</span> },
  ];
}

export function getLiquidacionesColumns({ openModal, handleConfirmarLiq, handleCancelarLiq }) {
  return [
    { key: 'folio', header: 'Folio', render: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.folio}</span> },
    { key: 'acuerdo', header: 'Acuerdo', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.acuerdo_folio}</span> },
    { key: 'proveedor', header: 'Proveedor', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-700 dark:text-gray-300">{row.proveedor_nombre}</span> },
    {
      key: 'periodo', header: 'Periodo', hideOnMobile: true,
      render: (row) => (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-3 w-3" />
          {row.fecha_desde && format(new Date(row.fecha_desde), 'dd/MM', { locale: es })}
          {' - '}
          {row.fecha_hasta && format(new Date(row.fecha_hasta), 'dd/MM', { locale: es })}
        </div>
      ),
    },
    { key: 'ventas', header: 'Ventas', align: 'right', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(parseFloat(row.subtotal_ventas || 0))}</span> },
    { key: 'comision', header: 'Comisión', align: 'right', hideOnMobile: true, render: (row) => <span className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(parseFloat(row.comision || 0))}</span> },
    { key: 'total', header: 'A Pagar', align: 'right', render: (row) => <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(parseFloat(row.total_pagar_proveedor || 0))}</span> },
    { key: 'estado', header: 'Estado', render: (row) => <EstadoBadge estado={row.estado} config={ESTADOS_LIQUIDACION} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (row) => (
        <DataTableActions>
          <DataTableActionButton icon={Eye} label="Ver detalle" onClick={() => openModal('detalleLiquidacion', row)} variant="ghost" />
          {row.estado === 'borrador' && (
            <>
              <DataTableActionButton icon={CheckCircle} label="Confirmar" onClick={() => handleConfirmarLiq(row.id)} variant="primary" />
              <DataTableActionButton icon={XCircle} label="Cancelar" onClick={() => handleCancelarLiq(row.id)} variant="danger" />
            </>
          )}
          {row.estado === 'confirmada' && (
            <DataTableActionButton icon={DollarSign} label="Registrar pago" onClick={() => openModal('detalleLiquidacion', row)} variant="primary" />
          )}
        </DataTableActions>
      ),
    },
  ];
}

export { ESTADOS_ACUERDO, ESTADOS_LIQUIDACION };
