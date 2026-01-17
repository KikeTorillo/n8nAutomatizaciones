import { useState } from 'react';
import { Plus, Edit, Trash2, Gift, ExternalLink, Check } from 'lucide-react';
import { Button, Input, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

/**
 * Tab de mesa de regalos del evento
 * @param {Object} props
 * @param {Array} props.regalos - Lista de regalos
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.crearRegalo - Mutation para crear
 * @param {Object} props.actualizarRegalo - Mutation para actualizar
 * @param {Object} props.eliminarRegalo - Mutation para eliminar
 * @param {string} props.eventoId - ID del evento
 */
export default function RegalosTab({
  regalos,
  isLoading,
  crearRegalo,
  actualizarRegalo,
  eliminarRegalo,
  eventoId,
}) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'producto',
    descripcion: '',
    precio: '',
    url_externa: '',
  });

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      const data = {
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion || undefined,
        precio: form.precio ? parseFloat(form.precio) : undefined,
        url_externa: form.url_externa || undefined,
      };

      if (editingId) {
        await actualizarRegalo.mutateAsync({ id: editingId, eventoId, data });
        toast.success('Regalo actualizado');
        setEditingId(null);
      } else {
        await crearRegalo.mutateAsync({ eventoId, data });
        toast.success('Regalo agregado');
      }
      setForm({ nombre: '', tipo: 'producto', descripcion: '', precio: '', url_externa: '' });
      setShowForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditar = (regalo) => {
    setForm({
      nombre: regalo.nombre,
      tipo: regalo.tipo || 'producto',
      descripcion: regalo.descripcion || '',
      precio: regalo.precio ? String(regalo.precio) : '',
      url_externa: regalo.url_externa || '',
    });
    setEditingId(regalo.id);
    setShowForm(true);
  };

  const handleCancelar = () => {
    setForm({ nombre: '', tipo: 'producto', descripcion: '', precio: '', url_externa: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mesa de Regalos</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Regalo
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleGuardar} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{editingId ? 'Editar Regalo' : 'Nuevo Regalo'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Licuadora Oster"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="producto">Producto</option>
                <option value="sobre_digital">Sobre Digital</option>
                <option value="link_externo">Link Externo</option>
              </select>
            </div>
            <Input
              label="Precio"
              type="number"
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />
            <Input
              label="URL Externa"
              value={form.url_externa}
              onChange={(e) => setForm({ ...form, url_externa: e.target.value })}
              placeholder="https://..."
            />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={crearRegalo.isPending || actualizarRegalo.isPending}>
              {(crearRegalo.isPending || actualizarRegalo.isPending) ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" type="button" onClick={handleCancelar}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {regalos?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regalos.map((regalo) => (
            <div key={regalo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{regalo.nombre}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{regalo.tipo.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditar(regalo)}
                    title="Editar regalo"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarRegalo.mutate({ id: regalo.id, eventoId })}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Eliminar regalo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {regalo.descripcion && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{regalo.descripcion}</p>}
              {regalo.precio && <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">${regalo.precio.toLocaleString()}</p>}
              {regalo.comprado && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 px-2 py-1 rounded-full mt-2">
                  <Check className="w-3 h-3" />Comprado
                </span>
              )}
              {regalo.url_externa && (
                <a href={regalo.url_externa} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 mt-2">
                  <ExternalLink className="w-4 h-4" />Ver producto
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Gift className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay regalos en la mesa todavia</p>
        </div>
      )}
    </div>
  );
}
