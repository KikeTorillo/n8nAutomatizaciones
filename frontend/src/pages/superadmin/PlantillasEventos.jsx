/**
 * Página de gestión de plantillas de eventos digitales
 * Solo accesible para super_admin
 */

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Check, X, Palette } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
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
  { value: 'universal', label: 'Universal' },
  { value: 'otro', label: 'Otro' },
];

const TEMA_DEFAULT = {
  color_primario: '#ec4899',
  color_secundario: '#fce7f3',
  color_fondo: '#fdf2f8',
  color_texto: '#1f2937',
  color_texto_claro: '#6b7280',
  fuente_titulo: 'Playfair Display',
  fuente_cuerpo: 'Inter',
};

const FUENTES_DISPONIBLES = [
  'Playfair Display',
  'Inter',
  'Cormorant Garamond',
  'Great Vibes',
  'Dancing Script',
  'Montserrat',
  'Lora',
  'Merriweather',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Raleway',
  'Cinzel',
  'Cinzel Decorative',
  'Abril Fatface',
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
    tema: { ...TEMA_DEFAULT },
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
      tema: { ...TEMA_DEFAULT },
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
      tema: plantilla.tema ? { ...TEMA_DEFAULT, ...plantilla.tema } : { ...TEMA_DEFAULT },
    });
    setEditingId(plantilla.id);
    setShowForm(true);
  };

  const handleTemaChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      tema: {
        ...prev.tema,
        [campo]: valor,
      }
    }));
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
        codigo: formData.codigo.trim().toLowerCase().replace(/\s+/g, '-'),
        tipo_evento: formData.tipo_evento,
        descripcion: formData.descripcion.trim() || undefined,
        estructura_html: formData.estructura_html || undefined,
        estilos_css: formData.estilos_css || undefined,
        es_premium: formData.es_premium,
        preview_url: formData.preview_url.trim() || undefined,
        tema: formData.tema,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plantillas de Eventos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona las plantillas de diseño para invitaciones digitales</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Filtro por tipo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroTipo('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !filtroTipo ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          {TIPOS_EVENTO.map((tipo) => (
            <button
              key={tipo.value}
              onClick={() => setFiltroTipo(tipo.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtroTipo === tipo.value ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
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
              <Select
                label="Tipo de Evento"
                value={formData.tipo_evento}
                onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                options={TIPOS_EVENTO}
              />
              <Input
                label="Preview URL"
                value={formData.preview_url}
                onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={2}
              placeholder="Descripción de la plantilla..."
            />

            <Textarea
              label="Estructura HTML"
              value={formData.estructura_html}
              onChange={(e) => setFormData({ ...formData, estructura_html: e.target.value })}
              rows={6}
              className="font-mono text-sm"
              placeholder="<div class='invitacion'>...</div>"
            />

            <Textarea
              label="Estilos CSS"
              value={formData.estilos_css}
              onChange={(e) => setFormData({ ...formData, estilos_css: e.target.value })}
              rows={6}
              className="font-mono text-sm"
              placeholder=".invitacion { ... }"
            />

            {/* Editor de Tema */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Tema Visual
              </h3>

              {/* Preview del tema */}
              <div
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: formData.tema.color_fondo }}
              >
                <div className="text-center space-y-2">
                  <p
                    className="text-lg font-bold"
                    style={{ color: formData.tema.color_texto, fontFamily: formData.tema.fuente_titulo }}
                  >
                    Vista Previa
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: formData.tema.color_texto_claro, fontFamily: formData.tema.fuente_cuerpo }}
                  >
                    Así se verá tu invitación
                  </p>
                  <div
                    className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: formData.tema.color_primario }}
                  >
                    Botón de Acción
                  </div>
                  <div
                    className="rounded-lg p-2 mt-2"
                    style={{ backgroundColor: formData.tema.color_secundario }}
                  >
                    <p className="text-xs" style={{ color: formData.tema.color_texto }}>
                      Sección secundaria
                    </p>
                  </div>
                </div>
              </div>

              {/* Colores */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Primario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.tema.color_primario}
                      onChange={(e) => handleTemaChange('color_primario', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={formData.tema.color_primario}
                      onChange={(e) => handleTemaChange('color_primario', e.target.value)}
                      className="w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Secundario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.tema.color_secundario}
                      onChange={(e) => handleTemaChange('color_secundario', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={formData.tema.color_secundario}
                      onChange={(e) => handleTemaChange('color_secundario', e.target.value)}
                      className="w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fondo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.tema.color_fondo}
                      onChange={(e) => handleTemaChange('color_fondo', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={formData.tema.color_fondo}
                      onChange={(e) => handleTemaChange('color_fondo', e.target.value)}
                      className="w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Texto</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.tema.color_texto}
                      onChange={(e) => handleTemaChange('color_texto', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={formData.tema.color_texto}
                      onChange={(e) => handleTemaChange('color_texto', e.target.value)}
                      className="w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Texto Claro</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.tema.color_texto_claro}
                      onChange={(e) => handleTemaChange('color_texto_claro', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={formData.tema.color_texto_claro}
                      onChange={(e) => handleTemaChange('color_texto_claro', e.target.value)}
                      className="w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Fuentes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Fuente para Títulos"
                  value={formData.tema.fuente_titulo}
                  onChange={(e) => handleTemaChange('fuente_titulo', e.target.value)}
                  options={FUENTES_DISPONIBLES.map(f => ({ value: f, label: f }))}
                />

                <Select
                  label="Fuente para Texto"
                  value={formData.tema.fuente_cuerpo}
                  onChange={(e) => handleTemaChange('fuente_cuerpo', e.target.value)}
                  options={FUENTES_DISPONIBLES.map(f => ({ value: f, label: f }))}
                />
              </div>
            </div>

            <Checkbox
              label="Es plantilla Premium"
              checked={formData.es_premium}
              onChange={(e) => setFormData({ ...formData, es_premium: e.target.checked })}
              className="mt-4"
            />

            <div className="flex gap-3 mt-4">
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
          {plantillas.map((plantilla) => {
            const tema = plantilla.tema || TEMA_DEFAULT;
            return (
              <div key={plantilla.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Preview con tema */}
                <div
                  className="aspect-[4/3] flex flex-col items-center justify-center p-4"
                  style={{ backgroundColor: tema.color_fondo }}
                >
                  {plantilla.preview_url ? (
                    <img
                      src={plantilla.preview_url}
                      alt={plantilla.nombre}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <>
                      {/* Mini preview del tema */}
                      <div
                        className="w-full rounded-lg p-3 text-center"
                        style={{ backgroundColor: tema.color_secundario }}
                      >
                        <p
                          className="text-sm font-bold mb-1"
                          style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
                        >
                          Evento
                        </p>
                        <p
                          className="text-xs mb-2"
                          style={{ color: tema.color_texto_claro, fontFamily: tema.fuente_cuerpo }}
                        >
                          Tu invitación
                        </p>
                        <div
                          className="inline-block px-3 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: tema.color_primario }}
                        >
                          Confirmar
                        </div>
                      </div>
                      <Palette className="w-8 h-8 mt-2" style={{ color: tema.color_primario }} />
                    </>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plantilla.nombre}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{plantilla.codigo}</p>
                    </div>
                    {plantilla.es_premium && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full">
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Paleta de colores del tema */}
                  <div className="flex items-center gap-1 mt-2">
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: tema.color_primario }}
                      title="Primario"
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: tema.color_secundario }}
                      title="Secundario"
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: tema.color_fondo }}
                      title="Fondo"
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: tema.color_texto }}
                      title="Texto"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {TIPOS_EVENTO.find(t => t.value === plantilla.tipo_evento)?.label || plantilla.tipo_evento}
                    </span>
                    {plantilla.activo === false && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-full">
                        Inactiva
                      </span>
                    )}
                  </div>

                  {plantilla.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{plantilla.descripcion}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Palette className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay plantillas {filtroTipo && `para ${filtroTipo}`}</p>
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
