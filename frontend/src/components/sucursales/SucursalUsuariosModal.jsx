import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Check, Shield } from 'lucide-react';
import { Button, Drawer, Input, LoadingSpinner } from '@/components/ui';
import { usuariosApi } from '@/services/api/endpoints';
import { useAsignarUsuarioSucursal } from '@/hooks/useSucursales';
import { useToast } from '@/hooks/useToast';

/**
 * Drawer para asignar usuarios a una sucursal
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el drawer está abierto
 * @param {Function} props.onClose - Función para cerrar el drawer
 * @param {number} props.sucursalId - ID de la sucursal
 * @param {Array} props.usuariosAsignados - Lista de usuarios ya asignados
 */
function SucursalUsuariosModal({ isOpen, onClose, sucursalId, usuariosAsignados = [] }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState({});
  const [esGerente, setEsGerente] = useState({});

  // Fetch todos los usuarios de la organización
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios-organizacion'],
    queryFn: async () => {
      const response = await usuariosApi.listar();
      return response.data.data || [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  // Hook de asignación
  const asignarMutation = useAsignarUsuarioSucursal();

  // IDs de usuarios ya asignados
  const idsAsignados = (usuariosAsignados || []).map((u) => u.usuario_id || u.id);

  // Asegurar que usuarios es un array
  const usuariosArray = Array.isArray(usuarios) ? usuarios : [];

  // Filtrar usuarios por búsqueda y excluir ya asignados
  const usuariosFiltrados = usuariosArray.filter((usuario) => {
    // Excluir usuarios ya asignados
    if (idsAsignados.includes(usuario.id)) return false;

    // Filtrar por búsqueda
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      usuario.nombre?.toLowerCase().includes(searchLower) ||
      usuario.apellido?.toLowerCase().includes(searchLower) ||
      usuario.email?.toLowerCase().includes(searchLower)
    );
  });

  // Reset state cuando se abre/cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setBusqueda('');
      setSeleccionados({});
      setEsGerente({});
    }
  }, [isOpen]);

  // Toggle selección de usuario
  const toggleSeleccion = (usuarioId) => {
    setSeleccionados((prev) => ({
      ...prev,
      [usuarioId]: !prev[usuarioId],
    }));
  };

  // Toggle gerente
  const toggleGerente = (usuarioId) => {
    setEsGerente((prev) => ({
      ...prev,
      [usuarioId]: !prev[usuarioId],
    }));
  };

  // Handler para asignar usuarios
  const handleAsignar = async () => {
    const usuariosParaAsignar = Object.entries(seleccionados)
      .filter(([_, isSelected]) => isSelected)
      .map(([usuarioId]) => ({
        usuario_id: parseInt(usuarioId, 10),
        es_gerente: esGerente[usuarioId] || false,
      }));

    if (usuariosParaAsignar.length === 0) {
      toast.error('Selecciona al menos un usuario para asignar');
      return;
    }

    try {
      // Asignar cada usuario
      for (const usuario of usuariosParaAsignar) {
        await asignarMutation.mutateAsync({
          sucursalId,
          data: usuario,
        });
      }

      toast.success(
        `${usuariosParaAsignar.length} usuario${usuariosParaAsignar.length > 1 ? 's' : ''} asignado${usuariosParaAsignar.length > 1 ? 's' : ''} correctamente`
      );

      // Invalidar queries
      queryClient.invalidateQueries(['sucursal-usuarios', sucursalId]);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al asignar usuarios');
    }
  };

  const usuariosSeleccionados = Object.values(seleccionados).filter(Boolean).length;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Usuarios"
      subtitle="Selecciona los usuarios que deseas asignar a esta sucursal"
    >
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar usuario por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Info de seleccionados */}
        {usuariosSeleccionados > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm px-4 py-2 rounded-lg">
            {usuariosSeleccionados} usuario{usuariosSeleccionados > 1 ? 's' : ''} seleccionado
            {usuariosSeleccionados > 1 ? 's' : ''}
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="max-h-80 overflow-y-auto -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {busqueda
                  ? 'No se encontraron usuarios con ese criterio'
                  : usuarios.length > 0
                    ? 'Todos los usuarios ya están asignados a esta sucursal'
                    : 'No hay usuarios en la organización'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuariosFiltrados.map((usuario) => (
                <div
                  key={usuario.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                    seleccionados[usuario.id]
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => toggleSeleccion(usuario.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox visual */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        seleccionados[usuario.id]
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {seleccionados[usuario.id] && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {usuario.nombre?.charAt(0)}
                        {usuario.apellido?.charAt(0)}
                      </span>
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{usuario.email}</p>
                    </div>
                  </div>

                  {/* Toggle Gerente */}
                  {seleccionados[usuario.id] && (
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGerente(usuario.id);
                      }}
                    >
                      <button
                        type="button"
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          esGerente[usuario.id]
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        Gerente
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={asignarMutation.isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAsignar}
            disabled={usuariosSeleccionados === 0 || asignarMutation.isPending}
            isLoading={asignarMutation.isPending}
            className="flex-1"
          >
            Asignar {usuariosSeleccionados > 0 && `(${usuariosSeleccionados})`}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default SucursalUsuariosModal;
