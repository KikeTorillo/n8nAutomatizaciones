/**
 * Página de gestión de plantillas de eventos digitales
 * Solo accesible para super_admin
 */

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Check, X, Palette } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import {
  usePlantillas,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,
} from '@/hooks/useEventosDigitales';

const TIPOS_EVENTO = [
  { value: 'boda', label: 'Boda' },
  { value: 'xv_anos', label: 'XV Años' },
  { value: 'bautizo', label: 'Bautizo' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'otro', label: 'Otro' },
];

function PlantillasEventos() {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    tipo_evento: 'boda',
    descripcion: '',
    estructura_html: '',
    estilos_css: '',
    es_premium: false,
    preview_url: '',
  });

  // Queries
  const { data: plantillasData, isLoading } = usePlantillas({ tipo_evento: filtroTipo || undefined });
  const plantillas = plantillasData || [];

  // Mutations
  const crearPlantilla = useCrearPlantilla();
  const actualizarPlantilla = useActualizarPlantilla();
  const eliminarPlantilla = useEliminarPlantilla();

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      tipo_evento: 'boda',
      descripcion: '',
      estructura_html: '',
      estilos_css: '',
      es_premium: false,
      preview_url: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditar = (plantilla) => {
    setFormData({
      nombre: plantilla.nombre || '',
      codigo: plantilla.codigo || '',
      tipo_evento: plantilla.tipo_evento || 'boda',
      descripcion: plantilla.descripcion || '',
      estructura_html: plantilla.estructura_html || '',
      estilos_css: plantilla.estilos_css || '',
      es_premium: plantilla.es_premium || false,
      preview_url: plantilla.preview_url || '',
    });
    setEditingId(plantilla.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      toast.error('Nombre y código son requeridos');
      return;
    }

    try {
      const data = {
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim().toLowerCase().replace(/\s+/g, '_'),
        tipo_evento: formData.tipo_evento,
        descripcion: formData.descripcion.trim() || undefined,
        estructura_html: formData.estructura_html || undefined,
        estilos_css: formData.estilos_css || undefined,
        es_premium: formData.es_premium,
        preview_url: formData.preview_url.trim() || undefined,
      };

      if (editingId) {
        await actualizarPlantilla.mutateAsync({ id: editingId, data });
        toast.success('Plantilla actualizada');
      } else {
        await crearPlantilla.mutateAsync(data);
        toast.success('Plantilla creada');
      }
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;

    try {
      const result = await eliminarPlantilla.mutateAsync(id);
      if (result.desactivado) {
        toast.info('Plantilla desactivada (está en uso)');
      } else {
        toast.success('Plantilla eliminada');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Eventos</h1>
          <p className="text-gray-600">Gestiona las plantillas de diseño para invitaciones digitales</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Filtro por tipo */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroTipo('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !filtroTipo ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {TIPOS_EVENTO.map((tipo) => (
            <button
              key={tipo.value}
              onClick={() => setFiltroTipo(tipo.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtroTipo === tipo.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Elegante Dorado"
                required
              />
              <Input
                label="Código *"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ej: elegante_dorado"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                <select
                  value={formData.tipo_evento}
                  onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TIPOS_EVENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Preview URL"
                value={formData.preview_url}
                onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Descripción de la plantilla..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estructura HTML</label>
              <textarea
                value={formData.estructura_html}
                onChange={(e) => setFormData({ ...formData, estructura_html: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="<div class='invitacion'>...</div>"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estilos CSS</label>
              <textarea
                value={formData.estilos_css}
                onChange={(e) => setFormData({ ...formData, estilos_css: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder=".invitacion { ... }"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.es_premium}
                onChange={(e) => setFormData({ ...formData, es_premium: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm text-gray-700">Es plantilla Premium</span>
            </label>

            <div className="flex gap-3">
              <Button type="submit" disabled={crearPlantilla.isLoading || actualizarPlantilla.isLoading}>
                {(crearPlantilla.isLoading || actualizarPlantilla.isLoading) ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de plantillas */}
      {isLoading ? (
        <LoadingSpinner />
      ) : plantillas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((plantilla) => (
            <div key={plantilla.id} className="bg-white rounded-lg shadow-sm overflow-hidden border">
              {/* Preview */}
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {plantilla.preview_url ? (
                  <img
                    src={plantilla.preview_url}
                    alt={plantilla.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Palette className="w-16 h-16 text-gray-300" />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{plantilla.nombre}</h3>
                    <p className="text-sm text-gray-500">{plantilla.codigo}</p>
                  </div>
                  {plantilla.es_premium && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      Premium
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {TIPOS_EVENTO.find(t => t.value === plantilla.tipo_evento)?.label || plantilla.tipo_evento}
                  </span>
                  {plantilla.activo === false && (
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                      Inactiva
                    </span>
                  )}
                </div>

                {plantilla.descripcion && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{plantilla.descripcion}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditar(plantilla)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEliminar(plantilla.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay plantillas {filtroTipo && `para ${filtroTipo}`}</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Plantilla
          </Button>
        </div>
      )}
    </div>
  );
}

export default PlantillasEventos;
