import { Tag, Pencil, Trash2, MoreVertical, Ban } from 'lucide-react';
import { Button, Badge, DropdownMenu } from '@/components/ui';
import { ListadoCRUDPage } from '@/components/ui/templates';
import { useCupones, useEliminarCupon, useDesactivarCupon, TIPOS_DESCUENTO, TIPO_DESCUENTO_LABELS } from '@/hooks/suscripciones-negocio';
import { CuponFormDrawer, CuponBadge } from '@/components/suscripciones-negocio';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Columnas de la tabla
 */
const columns = [
  {
    key: 'codigo',
    header: 'Cupón',
    render: (row) => (
      <div>
        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono font-bold">
          {row.codigo}
        </code>
        {row.descripcion && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
            {row.descripcion}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'descuento',
    header: 'Descuento',
    render: (row) => {
      const isPorcentaje = row.tipo_descuento === TIPOS_DESCUENTO.PORCENTAJE;
      return (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {isPorcentaje ? `${row.valor_descuento}%` : formatCurrency(row.valor_descuento)}
        </span>
      );
    },
  },
  {
    key: 'vigencia',
    header: 'Vigencia',
    render: (row) => (
      <div className="text-sm">
        {row.fecha_inicio && row.fecha_fin ? (
          <span className="text-gray-600 dark:text-gray-400">
            {formatDate(row.fecha_inicio)} - {formatDate(row.fecha_fin)}
          </span>
        ) : row.fecha_fin ? (
          <span className="text-gray-600 dark:text-gray-400">
            Hasta {formatDate(row.fecha_fin)}
          </span>
        ) : (
          <span className="text-gray-400">Sin fecha límite</span>
        )}
      </div>
    ),
  },
  {
    key: 'usos',
    header: 'Usos',
    render: (row) => (
      <div className="text-sm">
        <span className="font-medium">{row.usos_actuales || 0}</span>
        {row.max_usos && (
          <span className="text-gray-500"> / {row.max_usos}</span>
        )}
      </div>
    ),
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (row) => {
      // Verificar si está vencido
      const ahora = new Date();
      const fechaFin = row.fecha_fin ? new Date(row.fecha_fin) : null;
      const vencido = fechaFin && fechaFin < ahora;
      const agotado = row.max_usos && (row.usos_actuales || 0) >= row.max_usos;

      if (!row.activo) {
        return <Badge variant="default" size="sm">Inactivo</Badge>;
      }
      if (vencido) {
        return <Badge variant="warning" size="sm">Vencido</Badge>;
      }
      if (agotado) {
        return <Badge variant="warning" size="sm">Agotado</Badge>;
      }
      return <Badge variant="success" size="sm">Activo</Badge>;
    },
  },
];

/**
 * Acciones por fila
 */
function RowActions({ row, onEdit, onDelete, extraMutations }) {
  const desactivarMutation = extraMutations?.desactivar;

  const handleDesactivar = () => {
    if (desactivarMutation) {
      desactivarMutation.mutate(row.id);
    }
  };

  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      }
      items={[
        {
          label: 'Editar',
          icon: Pencil,
          onClick: () => onEdit(row),
        },
        row.activo && {
          label: 'Desactivar',
          icon: Ban,
          onClick: handleDesactivar,
        },
        {
          label: 'Eliminar',
          icon: Trash2,
          onClick: () => onDelete(row),
          variant: 'danger',
        },
      ].filter(Boolean)}
    />
  );
}

/**
 * Página de gestión de cupones
 */
function CuponesPage() {
  const desactivarMutation = useDesactivarCupon();

  return (
    <ListadoCRUDPage
      title="Cupones de Descuento"
      icon={Tag}
      useListQuery={useCupones}
      useDeleteMutation={useEliminarCupon}
      columns={columns}
      FormDrawer={CuponFormDrawer}
      mapFormData={(data) => ({
        cupon: data,
        mode: data ? 'edit' : 'create',
      })}
      newButtonLabel="Nuevo Cupón"
      rowActions={(row, handlers) => (
        <RowActions
          row={row}
          {...handlers}
          extraMutations={{ desactivar: desactivarMutation }}
        />
      )}
      extraMutations={{
        desactivar: desactivarMutation,
      }}
      emptyState={{
        title: 'No hay cupones',
        description: 'Crea cupones de descuento para tus suscriptores',
      }}
      exportConfig={{
        filename: 'cupones',
        columns: ['codigo', 'descripcion', 'tipo_descuento', 'valor_descuento', 'usos_actuales', 'max_usos', 'activo'],
        mapRow: (row) => ({
          codigo: row.codigo,
          descripcion: row.descripcion || '',
          tipo_descuento: TIPO_DESCUENTO_LABELS[row.tipo_descuento] || row.tipo_descuento,
          valor_descuento: row.valor_descuento,
          usos_actuales: row.usos_actuales || 0,
          max_usos: row.max_usos || 'Ilimitado',
          activo: row.activo ? 'Sí' : 'No',
        }),
      }}
    />
  );
}

export default CuponesPage;
