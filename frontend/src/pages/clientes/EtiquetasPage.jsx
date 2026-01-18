/**
 * ====================================================================
 * PÁGINA - GESTIÓN DE ETIQUETAS DE CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * CRUD de etiquetas con colores
 *
 * Migrado a ListadoCRUDPage: Ene 2026
 * Reducción: 216 LOC → ~80 LOC (~63%)
 *
 * ====================================================================
 */

import { Tag, Pencil, Trash2, Users } from 'lucide-react';
import { useEtiquetas, useEliminarEtiqueta } from '@/hooks/personas';
import EtiquetaFormDrawer from '@/components/clientes/EtiquetaFormDrawer';
import { ListadoCRUDPage } from '@/components/ui';
import ClientesPageLayout from '@/components/clientes/ClientesPageLayout';

// ==================== UTILIDADES ====================

function isLightColor(hexColor) {
  if (!hexColor) return true;
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// ==================== CONFIGURACIÓN ====================

const COLUMNS = [
  {
    key: 'nombre',
    header: 'Etiqueta',
    render: (row) => (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
          style={{
            backgroundColor: row.color || '#9CA3AF',
            color: isLightColor(row.color) ? '#1F2937' : '#FFFFFF',
          }}
        >
          {row.nombre}
        </span>
        {!row.activo && (
          <span className="text-xs text-gray-400">(Inactiva)</span>
        )}
      </div>
    ),
  },
  {
    key: 'descripcion',
    header: 'Descripción',
    render: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {row.descripcion || '-'}
      </span>
    ),
  },
  {
    key: 'total_clientes',
    header: (
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        Clientes
      </div>
    ),
    render: (row) => (
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {row.total_clientes || 0}
      </span>
    ),
  },
  {
    key: 'orden',
    header: 'Orden',
    render: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {row.orden}
      </span>
    ),
  },
];

const INITIAL_FILTERS = { busqueda: '' };

const mapFormData = (data) => ({
  etiqueta: data,
});

// ==================== COMPONENTE ====================

export default function EtiquetasPage() {
  return (
    <ListadoCRUDPage
      title="Etiquetas"
      icon={Tag}
      PageLayout={ClientesPageLayout}
      useListQuery={(params) => useEtiquetas({ ...params, soloActivas: 'false' })}
      useDeleteMutation={useEliminarEtiqueta}
      dataKey="etiquetas"
      columns={COLUMNS}
      FormDrawer={EtiquetaFormDrawer}
      mapFormData={mapFormData}
      initialFilters={INITIAL_FILTERS}
      newButtonLabel="Nueva Etiqueta"
      rowActions={(row, { onEdit, onDelete }) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row); }}
            className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
            title="Editar"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row); }}
            className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
            title="Eliminar"
            disabled={row.total_clientes > 0}
          >
            <Trash2
              className={`h-5 w-5 ${row.total_clientes > 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            />
          </button>
        </div>
      )}
      emptyState={{
        title: 'Sin etiquetas',
        description: 'Crea tu primera etiqueta para comenzar a segmentar tus clientes',
      }}
    />
  );
}
