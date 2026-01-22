import { useState } from 'react';
import { Package, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button, DropdownMenu } from '@/components/ui';
import { ListadoCRUDPage } from '@/components/ui/templates';
import { usePlanes, useEliminarPlan } from '@/hooks/suscripciones-negocio';
import { PlanFormDrawer, PlanCard } from '@/components/suscripciones-negocio';
import { formatCurrency } from '@/lib/utils';

/**
 * Columnas para vista tabla
 */
const columns = [
  {
    key: 'nombre',
    header: 'Plan',
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{row.nombre}</p>
        {row.descripcion && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
            {row.descripcion}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'precio_mensual',
    header: 'Precio',
    render: (row) => (
      <div>
        <span className="font-semibold">{formatCurrency(row.precio_mensual || 0)}</span>
        <span className="text-gray-500 text-sm">/mes</span>
      </div>
    ),
  },
  {
    key: 'dias_trial',
    header: 'Prueba',
    render: (row) => (
      <span className="text-gray-600 dark:text-gray-400">
        {row.dias_trial > 0 ? `${row.dias_trial} días` : '-'}
      </span>
    ),
  },
  {
    key: 'suscriptores',
    header: 'Suscriptores',
    render: (row) => (
      <span className="font-medium">{row.suscriptores_activos || 0}</span>
    ),
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (row) => (
      <span
        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          row.activo
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {row.activo ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
];

/**
 * Componente de vista cards
 */
function PlanesCardsView({ items, isLoading, onItemClick, handlers }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onEdit={() => handlers.onEdit(plan)}
        />
      ))}
    </div>
  );
}

/**
 * Acciones por fila
 */
function RowActions({ row, onEdit, onDelete }) {
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
        {
          label: 'Eliminar',
          icon: Trash2,
          onClick: () => onDelete(row),
          variant: 'danger',
        },
      ]}
    />
  );
}

/**
 * Página de gestión de planes
 */
function PlanesPage() {
  return (
    <ListadoCRUDPage
      title="Planes de Suscripción"
      icon={Package}
      useListQuery={usePlanes}
      useDeleteMutation={useEliminarPlan}
      columns={columns}
      FormDrawer={PlanFormDrawer}
      mapFormData={(data) => ({
        plan: data,
        mode: data ? 'edit' : 'create',
      })}
      newButtonLabel="Nuevo Plan"
      rowActions={(row, handlers) => <RowActions row={row} {...handlers} />}
      viewModes={[
        { id: 'table', label: 'Tabla', icon: Package },
        { id: 'cards', label: 'Cards', icon: Package, component: PlanesCardsView },
      ]}
      defaultViewMode="cards"
      emptyState={{
        title: 'No hay planes de suscripción',
        description: 'Crea tu primer plan para empezar a vender suscripciones',
      }}
    />
  );
}

export default PlanesPage;
