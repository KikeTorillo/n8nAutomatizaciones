/**
 * Página de Gestión de Listas de Precios
 * Fase 5 - Diciembre 2025
 *
 * Refactorizado Ene 2026: Componentes extraídos a components/precios/
 * Reducción: 1238 LOC → ~150 LOC (~88%)
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Loader2, Search } from 'lucide-react';
import { Button, ConfirmDialog, Drawer, Input, Modal } from '@/components/ui';
import { queryKeys } from '@/hooks/config';
import { useToast, useModalManager } from '@/hooks/utils';
import { listasPreciosApi, monedasApi } from '@/services/api/endpoints';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  ListaCard,
  ListaForm,
  ListaItemsView,
  ListaClientesView,
} from '@/components/precios';

export default function ListasPreciosPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal manager para form, items, clientes y delete
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    items: { isOpen: false, data: null },
    clientes: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // Query: Listar listas de precios
  const { data: listas = [], isLoading: loadingListas } = useQuery({
    queryKey: queryKeys.precios.listas.all,
    queryFn: async () => {
      const response = await listasPreciosApi.listar({ soloActivas: false });
      return response.data.data || [];
    },
  });

  // Query: Listar monedas
  const { data: monedas = [] } = useQuery({
    queryKey: queryKeys.catalogos.monedas,
    queryFn: async () => {
      const response = await monedasApi.listar(true);
      return response.data.data || [];
    },
  });

  // Mutation: Crear lista
  const crearMutation = useMutation({
    mutationFn: (data) => listasPreciosApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.precios.listas.all });
      toast.success('Lista de precios creada');
      closeModal('form');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al crear lista');
    },
  });

  // Mutation: Actualizar lista
  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }) => listasPreciosApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.precios.listas.all });
      toast.success('Lista actualizada');
      closeModal('form');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al actualizar lista');
    },
  });

  // Mutation: Eliminar lista
  const eliminarMutation = useMutation({
    mutationFn: (id) => listasPreciosApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.precios.listas.all });
      toast.success('Lista eliminada');
      closeModal('delete');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al eliminar lista');
    },
  });

  // Filtrar listas (memoizado para evitar re-cálculos innecesarios)
  const listasFiltradas = useMemo(() =>
    listas.filter(lista =>
      lista.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lista.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [listas, searchTerm]
  );

  // Handlers
  const handleNueva = () => openModal('form', null);
  const handleEditar = (lista) => openModal('form', lista);
  const handleVerItems = (lista) => openModal('items', lista);
  const handleVerClientes = (lista) => openModal('clientes', lista);

  const handleGuardar = (formData) => {
    const editingLista = getModalData('form');
    if (editingLista) {
      actualizarMutation.mutate({ id: editingLista.id, data: formData });
    } else {
      crearMutation.mutate(formData);
    }
  };

  return (
    <InventarioPageLayout
      icon={Tag}
      title="Listas de Precios"
      subtitle={`${listasFiltradas.length} lista${listasFiltradas.length !== 1 ? 's' : ''} de precios`}
      actions={
        <Button onClick={handleNueva}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva Lista
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Busqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar lista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de listas de precios */}
        {loadingListas ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : listasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {searchTerm ? 'No se encontraron listas' : 'Sin listas de precios'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm ? 'Intenta con otro termino' : 'Crea tu primera lista de precios'}
            </p>
            {!searchTerm && (
              <Button onClick={handleNueva} className="mt-4">
                <Plus className="w-4 h-4" />
                Nueva Lista
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listasFiltradas.map((lista) => (
              <ListaCard
                key={lista.id}
                lista={lista}
                onEdit={() => handleEditar(lista)}
                onDelete={() => openModal('delete', lista)}
                onVerItems={() => handleVerItems(lista)}
                onVerClientes={() => handleVerClientes(lista)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer: Formulario de Lista */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalData('form') ? 'Editar Lista' : 'Nueva Lista de Precios'}
      >
        <ListaForm
          lista={getModalData('form')}
          monedas={monedas}
          onSubmit={handleGuardar}
          onCancel={() => closeModal('form')}
          isLoading={crearMutation.isPending || actualizarMutation.isPending}
        />
      </Drawer>

      {/* Modal: Items de la lista */}
      <Modal
        isOpen={isOpen('items')}
        onClose={() => closeModal('items')}
        title={`Items: ${getModalData('items')?.nombre}`}
        size="lg"
      >
        {getModalData('items') && (
          <ListaItemsView listaId={getModalData('items').id} />
        )}
      </Modal>

      {/* Modal: Clientes de la lista */}
      <Modal
        isOpen={isOpen('clientes')}
        onClose={() => closeModal('clientes')}
        title={`Clientes: ${getModalData('clientes')?.nombre}`}
        size="md"
      >
        {getModalData('clientes') && (
          <ListaClientesView listaId={getModalData('clientes').id} />
        )}
      </Modal>

      {/* Confirm: Eliminar */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={() => eliminarMutation.mutate(getModalData('delete')?.id)}
        title="Eliminar Lista"
        message={`Estas seguro de eliminar "${getModalData('delete')?.nombre}"? Los clientes asignados perderan su lista especial.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </InventarioPageLayout>
  );
}
