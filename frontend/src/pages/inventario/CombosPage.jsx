/**
 * ====================================================================
 * COMBOS PAGE - Migrado a ListadoCRUDPage
 * ====================================================================
 *
 * Página de gestión de combos/kits (productos compuestos).
 * Migrado de ~284 líneas a ~90 usando template ListadoCRUDPage.
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

import { memo } from 'react';
import { Layers, Box, Edit2, Trash2 } from 'lucide-react';

import ListadoCRUDPage from '@/components/ui/templates/ListadoCRUDPage';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import ComboFormDrawer from '@/components/inventario/ComboFormDrawer';
import { useCombos, useEliminarCombo } from '@/hooks/pos';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';

// Etiquetas para tipos de precio
const TIPO_PRECIO_LABELS = {
  fijo: { label: 'Precio fijo', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  suma_componentes: { label: 'Suma', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' },
  descuento_porcentaje: { label: 'Descuento', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

// Etiquetas para manejo de stock
const MANEJO_STOCK_LABELS = {
  descontar_componentes: 'Descuenta componentes',
  descontar_combo: 'Descuenta combo',
};

// Componente de acciones por fila
const ComboRowActions = memo(function ComboRowActions({ row, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(row); }}
        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Editar"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(row); }}
        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});

// Columnas de la tabla
const COLUMNS = [
  {
    key: 'producto_nombre',
    header: 'Nombre',
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <Layers className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {row.producto_nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            SKU: {row.producto_sku || 'N/A'}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'tipo_precio',
    header: 'Tipo',
    render: (row) => {
      const tipoPrecioInfo = TIPO_PRECIO_LABELS[row.tipo_precio] || TIPO_PRECIO_LABELS.fijo;
      return (
        <span className={`text-xs px-2 py-1 rounded ${tipoPrecioInfo.color}`}>
          {tipoPrecioInfo.label}
          {row.tipo_precio === 'descuento_porcentaje' && ` ${row.descuento_porcentaje}%`}
        </span>
      );
    },
  },
  {
    key: 'componentes',
    header: 'Componentes',
    render: (row) => (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {(row.componentes || []).slice(0, 3).map((comp, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
          >
            <Box className="h-3 w-3" />
            {comp.cantidad}x {comp.nombre || comp.producto_nombre}
          </span>
        ))}
        {(row.componentes || []).length > 3 && (
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
            +{row.componentes.length - 3} mas
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'manejo_stock',
    header: 'Stock',
    render: (row) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {MANEJO_STOCK_LABELS[row.manejo_stock] || row.manejo_stock}
      </span>
    ),
  },
  {
    key: 'precio_calculado',
    header: 'Precio',
    align: 'right',
    render: (row) => (
      <div className="text-right">
        <p className="font-bold text-gray-900 dark:text-gray-100">
          ${parseFloat(row.precio_calculado || row.producto_precio || 0).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {row.total_componentes || row.componentes?.length || 0} items
        </p>
      </div>
    ),
  },
];

export default function CombosPage() {
  const sucursalActiva = useSucursalStore(selectSucursalActiva);

  return (
    <ListadoCRUDPage
      // Layout
      title="Combos / Kits"
      subtitle="Productos compuestos por multiples componentes"
      icon={Layers}
      PageLayout={InventarioPageLayout}
      // Data
      useListQuery={useCombos}
      dataKey="combos"
      keyField="producto_id"
      // Delete mutation con mapeo especial para sucursal
      useDeleteMutation={useEliminarCombo}
      deleteMutationOptions={{
        getDeleteId: (combo) => ({
          productoId: combo.producto_id,
          sucursalId: sucursalActiva?.id,
        }),
      }}
      // Table
      columns={COLUMNS}
      rowActions={(row, handlers) => (
        <ComboRowActions row={row} onEdit={handlers.onEdit} onDelete={handlers.onDelete} />
      )}
      emptyState={{
        title: 'No hay combos',
        description: 'Crea combos para vender paquetes de productos con descuento',
        actionLabel: 'Crear primer combo',
      }}
      // Form
      FormDrawer={ComboFormDrawer}
      mapFormData={(data) => ({ combo: data })}
      // Actions
      newButtonLabel="Nuevo Combo"
    />
  );
}
