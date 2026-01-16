import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserCheck, Search, Check } from 'lucide-react';
import { Button, Drawer, Input } from '@/components/ui';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useAsignarProfesionalSucursal } from '@/hooks/useSucursales';
import { useToast } from '@/hooks/useToast';

/**
 * Drawer para asignar profesionales a una sucursal
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el drawer está abierto
 * @param {Function} props.onClose - Función para cerrar el drawer
 * @param {number} props.sucursalId - ID de la sucursal
 * @param {Array} props.profesionalesAsignados - Lista de profesionales ya asignados
 */
function SucursalProfesionalesModal({
  isOpen,
  onClose,
  sucursalId,
  profesionalesAsignados = [],
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState({});

  // Fetch todos los profesionales de la organización
  const { data: profesionalesData, isLoading } = useProfesionales({ activo: true });
  const profesionales = profesionalesData?.profesionales || [];

  // Hook de asignación
  const asignarMutation = useAsignarProfesionalSucursal();

  // IDs de profesionales ya asignados
  const idsAsignados = (profesionalesAsignados || []).map((p) => p.profesional_id || p.id);

  // profesionales ya es array
  const profesionalesArray = profesionales;

  // Filtrar profesionales por búsqueda y excluir ya asignados
  const profesionalesFiltrados = profesionalesArray.filter((profesional) => {
    // Excluir profesionales ya asignados
    if (idsAsignados.includes(profesional.id)) return false;

    // Filtrar por búsqueda
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      profesional.nombre?.toLowerCase().includes(searchLower) ||
      profesional.apellidos?.toLowerCase().includes(searchLower) ||
      profesional.nombre_completo?.toLowerCase().includes(searchLower) ||
      profesional.tipo_nombre?.toLowerCase().includes(searchLower)
    );
  });

  // Reset state cuando se abre/cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setBusqueda('');
      setSeleccionados({});
    }
  }, [isOpen]);

  // Toggle selección de profesional
  const toggleSeleccion = (profesionalId) => {
    setSeleccionados((prev) => ({
      ...prev,
      [profesionalId]: !prev[profesionalId],
    }));
  };

  // Handler para asignar profesionales
  const handleAsignar = async () => {
    const profesionalesParaAsignar = Object.entries(seleccionados)
      .filter(([_, isSelected]) => isSelected)
      .map(([profesionalId]) => ({
        profesional_id: parseInt(profesionalId, 10),
      }));

    if (profesionalesParaAsignar.length === 0) {
      toast.error('Selecciona al menos un profesional para asignar');
      return;
    }

    try {
      // Asignar cada profesional
      for (const profesional of profesionalesParaAsignar) {
        await asignarMutation.mutateAsync({
          sucursalId,
          data: profesional,
        });
      }

      toast.success(
        `${profesionalesParaAsignar.length} profesional${profesionalesParaAsignar.length > 1 ? 'es' : ''} asignado${profesionalesParaAsignar.length > 1 ? 's' : ''} correctamente`
      );

      // Invalidar queries
      queryClient.invalidateQueries(['sucursal-profesionales', sucursalId]);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al asignar profesionales');
    }
  };

  const profesionalesSeleccionados = Object.values(seleccionados).filter(Boolean).length;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Profesionales"
      subtitle="Selecciona los profesionales que trabajarán en esta sucursal"
    >
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar profesional por nombre o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Info de seleccionados */}
        {profesionalesSeleccionados > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm px-4 py-2 rounded-lg">
            {profesionalesSeleccionados} profesional{profesionalesSeleccionados > 1 ? 'es' : ''}{' '}
            seleccionado{profesionalesSeleccionados > 1 ? 's' : ''}
          </div>
        )}

        {/* Lista de profesionales */}
        <div className="max-h-80 overflow-y-auto -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : profesionalesFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {busqueda
                  ? 'No se encontraron profesionales con ese criterio'
                  : profesionales.length > 0
                    ? 'Todos los profesionales ya están asignados a esta sucursal'
                    : 'No hay profesionales activos en la organización'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {profesionalesFiltrados.map((profesional) => (
                <div
                  key={profesional.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                    seleccionados[profesional.id]
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => toggleSeleccion(profesional.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox visual */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        seleccionados[profesional.id]
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {seleccionados[profesional.id] && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Avatar con color del profesional */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{
                        backgroundColor: profesional.color_calendario || '#753572',
                      }}
                    >
                      {profesional.nombre?.charAt(0)}
                      {profesional.apellidos?.charAt(0)}
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {profesional.nombre_completo ||
                          `${profesional.nombre} ${profesional.apellidos}`}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {profesional.tipo_nombre || 'Sin tipo asignado'}
                      </p>
                    </div>
                  </div>

                  {/* Servicios asignados */}
                  <div className="text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {profesional.total_servicios_asignados || 0} servicios
                    </span>
                  </div>
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
            disabled={profesionalesSeleccionados === 0 || asignarMutation.isPending}
            isLoading={asignarMutation.isPending}
            className="flex-1"
          >
            Asignar {profesionalesSeleccionados > 0 && `(${profesionalesSeleccionados})`}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default SucursalProfesionalesModal;
