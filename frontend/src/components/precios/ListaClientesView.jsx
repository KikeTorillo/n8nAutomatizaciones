import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  X,
  Search,
  Users,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Button, ConfirmDialog, Input } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { listasPreciosApi, clientesApi } from '@/services/api/endpoints';

/**
 * Vista de Clientes de una Lista
 */
export default function ListaClientesView({ listaId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showBuscador, setShowBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState(null);

  // Query: Clientes asignados a esta lista
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['lista-clientes', listaId],
    queryFn: async () => {
      const response = await listasPreciosApi.listarClientes(listaId);
      return response.data.data || [];
    },
  });

  // Query: Buscar clientes disponibles (sin lista o con otra lista)
  const { data: clientesBusqueda = [], isLoading: buscando } = useQuery({
    queryKey: ['clientes-busqueda', busqueda],
    queryFn: async () => {
      if (busqueda.length < 2) return [];
      const response = await clientesApi.buscar({ q: busqueda, limit: 10 });
      return response.data.data || [];
    },
    enabled: busqueda.length >= 2,
  });

  // Mutation: Asignar cliente a la lista
  const asignarMutation = useMutation({
    mutationFn: async (clienteId) => {
      return await clientesApi.actualizar(clienteId, { lista_precios_id: listaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-clientes', listaId] });
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Cliente asignado a la lista');
      setBusqueda('');
      setShowBuscador(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al asignar cliente');
    },
  });

  // Mutation: Quitar cliente de la lista
  const quitarMutation = useMutation({
    mutationFn: async (clienteId) => {
      return await clientesApi.actualizar(clienteId, { lista_precios_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-clientes', listaId] });
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Cliente removido de la lista');
      setRemoveConfirm(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al quitar cliente');
    },
  });

  // Filtrar clientes que ya estan asignados
  const clientesDisponibles = clientesBusqueda.filter(
    c => !clientes.some(asignado => asignado.id === c.id)
  );

  return (
    <div className="space-y-4">
      {/* Header con boton agregar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} asignado{clientes.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          variant={showBuscador ? 'ghost' : 'primary'}
          onClick={() => setShowBuscador(!showBuscador)}
        >
          {showBuscador ? (
            <>
              <X className="w-4 h-4" />
              Cerrar
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Asignar Cliente
            </>
          )}
        </Button>
      </div>

      {/* Buscador de clientes */}
      {showBuscador && (
        <div className="border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar cliente por nombre o telefono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {buscando && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            </div>
          )}

          {busqueda.length >= 2 && !buscando && clientesDisponibles.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              No se encontraron clientes disponibles
            </p>
          )}

          {clientesDisponibles.length > 0 && (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
              {clientesDisponibles.map((cliente) => (
                <li key={cliente.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {cliente.nombre?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cliente.nombre}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cliente.telefono || cliente.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => asignarMutation.mutate(cliente.id)}
                    disabled={asignarMutation.isPending}
                  >
                    {asignarMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Lista de clientes asignados */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay clientes asignados a esta lista
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Usa el boton "Asignar Cliente" para agregar
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {clientes.map((cliente) => (
              <li key={cliente.id} className="py-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {cliente.nombre?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {cliente.nombre}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {cliente.email || cliente.telefono}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setRemoveConfirm(cliente)}
                  className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Quitar de la lista"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirm: Quitar cliente */}
      <ConfirmDialog
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        onConfirm={() => quitarMutation.mutate(removeConfirm.id)}
        title="Quitar Cliente"
        message={`Quitar a "${removeConfirm?.nombre}" de esta lista de precios? El cliente pasara a usar precios estandar.`}
        confirmText="Quitar"
        variant="warning"
        isLoading={quitarMutation.isPending}
      />
    </div>
  );
}
