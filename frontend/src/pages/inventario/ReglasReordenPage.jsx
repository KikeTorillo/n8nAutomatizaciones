/**
 * Pagina de Reglas de Reabastecimiento
 * CRUD de reglas para reorden automatico
 *
 * Refactorizado Feb 2026: Extraídos ReglaCard + ReglaForm a components/
 * Reducción: 687 → ~130 LOC (-81%)
 */

import { useState } from 'react';
import { Plus, RefreshCw, Settings, ArrowLeft } from 'lucide-react';
import {
  useReglasReorden,
  useCrearReglaReorden,
  useActualizarReglaReorden,
  useEliminarReglaReorden,
  useRutasOperacion,
} from '@/hooks/almacen';
import { useProveedores, useCategorias, useProductos } from '@/hooks/inventario';
import { Link } from 'react-router-dom';
import { Button, ConfirmDialog, Drawer } from '@/components/ui';
import { useModalManager, useDeleteConfirmation } from '@/hooks/utils';
import { ReglaCard, ReglaForm } from './components';

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'activas', label: 'Activas' },
  { id: 'inactivas', label: 'Inactivas' },
];

export default function ReglasReordenPage() {
  const [filtroActivo, setFiltroActivo] = useState('todas');

  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
  });

  const { data: reglas, isLoading } = useReglasReorden({
    activo: filtroActivo === 'todas' ? undefined : filtroActivo === 'activas'
  });
  const { data: rutas } = useRutasOperacion({ activo: true });
  const { data: proveedoresData } = useProveedores();
  const { data: categorias } = useCategorias();
  const { data: productosData } = useProductos({ limit: 100, activo: true });

  const crearMutation = useCrearReglaReorden();
  const actualizarMutation = useActualizarReglaReorden();
  const eliminarMutation = useEliminarReglaReorden();

  const { confirmDelete, deleteConfirmProps } = useDeleteConfirmation({
    deleteMutation: eliminarMutation,
    entityName: 'regla',
    getName: (r) => r?.nombre,
  });

  const handleToggleActivo = (regla) => {
    actualizarMutation.mutate({ id: regla.id, data: { activo: !regla.activo } });
  };

  const handleSubmit = (data) => {
    const editingRegla = getModalData('form');
    if (editingRegla) {
      actualizarMutation.mutate({ id: editingRegla.id, data }, { onSuccess: () => closeModal('form') });
    } else {
      crearMutation.mutate(data, { onSuccess: () => closeModal('form') });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/inventario/reorden"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reglas de Reabastecimiento</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configura cuando y como reabastecer productos automaticamente</p>
          </div>
        </div>
        <Button onClick={() => openModal('form', null)} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nueva Regla
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {FILTROS.map((filtro) => (
          <button
            key={filtro.id}
            onClick={() => setFiltroActivo(filtro.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroActivo === filtro.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Lista de Reglas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Cargando reglas...
          </div>
        ) : reglas?.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay reglas configuradas</p>
            <p className="mt-1 text-sm">Crea una regla para automatizar el reabastecimiento de productos</p>
            <Button onClick={() => openModal('form', null)} className="mt-4 inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Crear Primera Regla
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reglas?.map((regla) => (
              <ReglaCard
                key={regla.id}
                regla={regla}
                onEdit={() => openModal('form', regla)}
                onDelete={() => confirmDelete(regla)}
                onToggle={() => handleToggleActivo(regla)}
                isToggling={actualizarMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer para crear/editar */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalData('form') ? 'Editar Regla' : 'Nueva Regla de Reabastecimiento'}
      >
        <ReglaForm
          regla={getModalData('form')}
          rutas={rutas || []}
          proveedores={proveedoresData?.proveedores || []}
          categorias={categorias || []}
          productos={productosData?.productos || []}
          onSubmit={handleSubmit}
          onCancel={() => closeModal('form')}
          isLoading={crearMutation.isPending || actualizarMutation.isPending}
        />
      </Drawer>

      <ConfirmDialog {...deleteConfirmProps} />
    </div>
  );
}
