/**
 * Acciones por fila para tabla de Productos
 * Ene 2026 - Migración a ListadoCRUDPage
 */

import { Edit, Trash2, TrendingDown, Tag } from 'lucide-react';
import { DataTableActions, DataTableActionButton } from '@/components/ui';

/**
 * Componente de acciones por fila de producto
 */
export default function ProductoRowActions({ row, onEdit, onDelete, openModal }) {
  return (
    <DataTableActions>
      <DataTableActionButton
        icon={Edit}
        label="Editar"
        onClick={() => onEdit(row)}
        variant="primary"
      />
      <DataTableActionButton
        icon={TrendingDown}
        label="Ajustar Stock"
        onClick={() => openModal('ajustarStock', row)}
        variant="primary"
      />
      <DataTableActionButton
        icon={Tag}
        label="Generar Etiqueta"
        onClick={() => openModal('etiqueta', row)}
        variant="primary"
      />
      <DataTableActionButton
        icon={Trash2}
        label="Eliminar"
        onClick={() => onDelete(row)}
        variant="danger"
      />
    </DataTableActions>
  );
}
