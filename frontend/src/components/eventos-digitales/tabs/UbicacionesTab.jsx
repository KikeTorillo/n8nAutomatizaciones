import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Button, Input, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/hooks/utils';

/**
 * Tab de ubicaciones del evento
 * @param {Object} props
 * @param {Array} props.ubicaciones - Lista de ubicaciones
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.crearUbicacion - Mutation para crear
 * @param {Object} props.actualizarUbicacion - Mutation para actualizar
 * @param {Object} props.eliminarUbicacion - Mutation para eliminar
 * @param {string} props.eventoId - ID del evento
 */
export default function UbicacionesTab({
  ubicaciones,
  isLoading,
  crearUbicacion,
  actualizarUbicacion,
  eliminarUbicacion,
  eventoId,
}) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'ceremonia',
    direccion: '',
    hora_inicio: '',
    hora_fin: '',
    google_maps_url: '',
  });

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      const data = {
        nombre: form.nombre,
        tipo: form.tipo,
        direccion: form.direccion || undefined,
        hora_inicio: form.hora_inicio || undefined,
        hora_fin: form.hora_fin || undefined,
        google_maps_url: form.google_maps_url || undefined,
      };

      if (editingId) {
        await actualizarUbicacion.mutateAsync({ id: editingId, eventoId, data });
        toast.success('Ubicacion actualizada');
        setEditingId(null);
      } else {
        await crearUbicacion.mutateAsync({ eventoId, data });
        toast.success('Ubicacion agregada');
      }
      setForm({ nombre: '', tipo: 'ceremonia', direccion: '', hora_inicio: '', hora_fin: '', google_maps_url: '' });
      setShowForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditar = (ubi) => {
    setForm({
      nombre: ubi.nombre,
      tipo: ubi.tipo || 'ceremonia',
      direccion: ubi.direccion || '',
      hora_inicio: ubi.hora_inicio || '',
      hora_fin: ubi.hora_fin || '',
      google_maps_url: ubi.google_maps_url || '',
    });
    setEditingId(ubi.id);
    setShowForm(true);
  };

  const handleCancelar = () => {
    setForm({ nombre: '', tipo: 'ceremonia', direccion: '', hora_inicio: '', hora_fin: '', google_maps_url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ubicaciones del Evento</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Ubicacion
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleGuardar} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{editingId ? 'Editar Ubicacion' : 'Nueva Ubicacion'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Iglesia Santa Maria"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="ceremonia">Ceremonia</option>
                <option value="recepcion">Recepcion</option>
                <option value="fiesta">Fiesta</option>
                <option value="after">After Party</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <Input
              label="Direccion"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
            <Input
              label="Hora Inicio"
              type="time"
              value={form.hora_inicio}
              onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
            />
            <Input
              label="Hora Fin"
              type="time"
              value={form.hora_fin}
              onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
            />
            <Input
              label="Link Google Maps"
              value={form.google_maps_url}
              onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={crearUbicacion.isPending || actualizarUbicacion.isPending}>
              {(crearUbicacion.isPending || actualizarUbicacion.isPending) ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" type="button" onClick={handleCancelar}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {ubicaciones?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ubicaciones.map((ubi) => (
            <div key={ubi.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{ubi.nombre}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{ubi.tipo}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditar(ubi)}
                    title="Editar ubicacion"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarUbicacion.mutate({ id: ubi.id, eventoId })}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Eliminar ubicacion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {ubi.direccion && <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-4 h-4" />{ubi.direccion}</p>}
              {(ubi.hora_inicio || ubi.hora_fin) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {ubi.hora_inicio}{ubi.hora_inicio && ubi.hora_fin && ' - '}{ubi.hora_fin}
                </p>
              )}
              {ubi.google_maps_url && (
                <a href={ubi.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 mt-2">
                  <ExternalLink className="w-4 h-4" />Ver en Google Maps
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay ubicaciones todavia</p>
        </div>
      )}
    </div>
  );
}
