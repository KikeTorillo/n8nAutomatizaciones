/**
 * Página de gestión de plantillas de eventos digitales
 * Solo accesible para super_admin
 * Actualizado: 14 Dic 2025 - Plantillas temáticas
 */

import { useState } from 'react';
import { Plus, Edit, Trash2, Palette, Sparkles, Layout } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
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

const CATEGORIAS = [
  { value: '', label: 'Sin categoría' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'juvenil', label: 'Juvenil' },
  { value: 'adulto', label: 'Adulto' },
  { value: 'elegante', label: 'Elegante' },
  { value: 'moderno', label: 'Moderno' },
  { value: 'rustico', label: 'Rústico' },
  { value: 'tematico', label: 'Temático' },
  { value: 'clasico', label: 'Clásico' },
];

const SUBCATEGORIAS = {
  infantil: [
    { value: 'superheroes', label: 'Superhéroes' },
    { value: 'princesas', label: 'Princesas' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'unicornios', label: 'Unicornios' },
    { value: 'dinosaurios', label: 'Dinosaurios' },
    { value: 'minecraft', label: 'Minecraft' },
    { value: 'kpop', label: 'K-Pop' },
    { value: 'futbol', label: 'Fútbol' },
    { value: 'espacial', label: 'Espacial' },
    { value: 'sirenas', label: 'Sirenas' },
    { value: 'safari', label: 'Safari' },
    { value: 'circo', label: 'Circo' },
  ],
  tematico: [
    { value: 'paris', label: 'París' },
    { value: 'mascarada', label: 'Mascarada' },
    { value: 'jardin_secreto', label: 'Jardín Secreto' },
    { value: 'hollywood', label: 'Hollywood' },
    { value: 'neon', label: 'Neón' },
  ],
  elegante: [
    { value: 'dorado', label: 'Dorado' },
    { value: 'floral', label: 'Floral' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'minimalista', label: 'Minimalista' },
  ],
  rustico: [
    { value: 'natural', label: 'Natural' },
    { value: 'playa', label: 'Playa' },
  ],
  moderno: [
    { value: 'minimalista', label: 'Minimalista' },
    { value: 'colorido', label: 'Colorido' },
    { value: 'neon', label: 'Neón' },
    { value: 'pastel', label: 'Pastel' },
  ],
};

// Opciones para elementos temáticos
const PATRONES_FONDO = [
  { value: 'none', label: 'Ninguno' },
  { value: 'confetti', label: 'Confetti' },
  { value: 'stars', label: 'Estrellas' },
  { value: 'hearts', label: 'Corazones' },
  { value: 'dots', label: 'Puntos' },
  { value: 'stripes', label: 'Rayas' },
  { value: 'bubbles', label: 'Burbujas' },
  { value: 'geometric', label: 'Geométrico' },
];

const DECORACIONES_ESQUINAS = [
  { value: 'none', label: 'Ninguna' },
  { value: 'globos', label: 'Globos' },
  { value: 'estrellas', label: 'Estrellas' },
  { value: 'flores', label: 'Flores' },
  { value: 'corazones', label: 'Corazones' },
  { value: 'lazos', label: 'Lazos' },
  { value: 'hojas', label: 'Hojas' },
];

const ICONOS_PRINCIPALES = [
  { value: 'none', label: 'Ninguno' },
  { value: 'cake', label: 'Pastel' },
  { value: 'crown', label: 'Corona' },
  { value: 'star', label: 'Estrella' },
  { value: 'heart', label: 'Corazón' },
  { value: 'mask', label: 'Máscara' },
  { value: 'gift', label: 'Regalo' },
  { value: 'ring', label: 'Anillo' },
  { value: 'baby', label: 'Bebé' },
  { value: 'balloon', label: 'Globo' },
];

const ANIMACIONES_ENTRADA = [
  { value: 'none', label: 'Ninguna' },
  { value: 'fade', label: 'Fade' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Flip' },
];

const EFECTOS_TITULO = [
  { value: 'none', label: 'Ninguno' },
  { value: 'sparkle', label: 'Brillos' },
  { value: 'glow', label: 'Resplandor' },
  { value: 'shadow', label: 'Sombra' },
  { value: 'gradient', label: 'Degradado' },
  { value: 'outline', label: 'Contorno' },
];

const MARCOS_FOTOS = [
  { value: 'none', label: 'Ninguno' },
  { value: 'polaroid', label: 'Polaroid' },
  { value: 'comic', label: 'Cómic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'neon', label: 'Neón' },
  { value: 'rounded', label: 'Redondeado' },
  { value: 'ornate', label: 'Ornamentado' },
];

const TEMA_DEFAULT = {
  color_primario: '#ec4899',
  color_secundario: '#fce7f3',
  color_fondo: '#fdf2f8',
  color_texto: '#1f2937',
  color_texto_claro: '#6b7280',
  fuente_titulo: 'Playfair Display',
  fuente_cuerpo: 'Inter',
  patron_fondo: 'none',
  patron_opacidad: 0.1,
  decoracion_esquinas: 'none',
  icono_principal: 'none',
  animacion_entrada: 'fade',
  efecto_titulo: 'none',
  marco_fotos: 'none',
  stickers: [],
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
  'Fredoka One',
  'Bangers',
  'Permanent Marker',
  'Pacifico',
  'Lobster',
];

function PlantillasEventos() {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [plantillaAEliminar, setPlantillaAEliminar] = useState(null);
  const [activeSection, setActiveSection] = useState('basico'); // basico, tema, avanzado
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    tipo_evento: 'cumpleanos',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    estructura_html: '',
    estilos_css: '',
    es_premium: false,
    preview_url: '',
    tema: { ...TEMA_DEFAULT },
  });

  // Queries
  const { data: plantillasData, isLoading } = usePlantillas({
    tipo_evento: filtroTipo || undefined,
    categoria: filtroCategoria || undefined,
  });
  const plantillas = plantillasData || [];

  // Mutations
  const crearPlantilla = useCrearPlantilla();
  const actualizarPlantilla = useActualizarPlantilla();
  const eliminarPlantilla = useEliminarPlantilla();

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      tipo_evento: 'cumpleanos',
      descripcion: '',
      categoria: '',
      subcategoria: '',
      estructura_html: '',
      estilos_css: '',
      es_premium: false,
      preview_url: '',
      tema: { ...TEMA_DEFAULT },
    });
    setEditingId(null);
    setShowForm(false);
    setActiveSection('basico');
  };

  const handleEditar = (plantilla) => {
    setFormData({
      nombre: plantilla.nombre || '',
      codigo: plantilla.codigo || '',
      tipo_evento: plantilla.tipo_evento || 'cumpleanos',
      descripcion: plantilla.descripcion || '',
      categoria: plantilla.categoria || '',
      subcategoria: plantilla.subcategoria || '',
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
        categoria: formData.categoria || undefined,
        subcategoria: formData.subcategoria || undefined,
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

  const handleEliminar = async () => {
    if (!plantillaAEliminar) return;

    try {
      const result = await eliminarPlantilla.mutateAsync(plantillaAEliminar);
      if (result.desactivado) {
        toast.info('Plantilla desactivada (está en uso)');
      } else {
        toast.success('Plantilla eliminada');
      }
      setPlantillaAEliminar(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  // Obtener subcategorías disponibles según la categoría seleccionada
  const getSubcategoriasDisponibles = () => {
    if (!formData.categoria) return [];
    return SUBCATEGORIAS[formData.categoria] || [];
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

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        {/* Filtro por tipo */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tipo de Evento</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroTipo('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filtroTipo ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            {TIPOS_EVENTO.map((tipo) => (
              <button
                key={tipo.value}
                onClick={() => setFiltroTipo(tipo.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtroTipo === tipo.value ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por categoría */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Categoría</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroCategoria('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filtroCategoria ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            {CATEGORIAS.filter(c => c.value).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFiltroCategoria(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtroCategoria === cat.value ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-primary-200 dark:border-primary-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h2>

          {/* Tabs del formulario */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveSection('basico')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'basico'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Layout className="w-4 h-4 inline mr-1" />
              Básico
            </button>
            <button
              onClick={() => setActiveSection('tema')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'tema'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Palette className="w-4 h-4 inline mr-1" />
              Colores y Fuentes
            </button>
            <button
              onClick={() => setActiveSection('avanzado')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'avanzado'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              Elementos Temáticos
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sección Básico */}
            {activeSection === 'basico' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Superhéroes Marvel"
                    required
                  />
                  <Input
                    label="Código *"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: cumple-superheroes"
                    required
                  />
                  <Select
                    label="Tipo de Evento"
                    value={formData.tipo_evento}
                    onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                    options={TIPOS_EVENTO}
                  />
                  <Select
                    label="Categoría"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value, subcategoria: '' })}
                    options={CATEGORIAS}
                  />
                  {formData.categoria && getSubcategoriasDisponibles().length > 0 && (
                    <Select
                      label="Subcategoría (Temática)"
                      value={formData.subcategoria}
                      onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                      options={[{ value: '', label: 'Seleccionar...' }, ...getSubcategoriasDisponibles()]}
                    />
                  )}
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

                <Checkbox
                  label="Es plantilla Premium"
                  checked={formData.es_premium}
                  onChange={(e) => setFormData({ ...formData, es_premium: e.target.checked })}
                />
              </div>
            )}

            {/* Sección Tema (Colores y Fuentes) */}
            {activeSection === 'tema' && (
              <div className="space-y-6">
                {/* Preview del tema */}
                <div
                  className="rounded-lg p-6"
                  style={{ backgroundColor: formData.tema.color_fondo }}
                >
                  <div className="text-center space-y-3">
                    <p
                      className="text-2xl font-bold"
                      style={{ color: formData.tema.color_texto, fontFamily: formData.tema.fuente_titulo }}
                    >
                      Vista Previa
                    </p>
                    <p
                      className="text-base"
                      style={{ color: formData.tema.color_texto_claro, fontFamily: formData.tema.fuente_cuerpo }}
                    >
                      Así se verá tu invitación
                    </p>
                    <div
                      className="inline-block px-6 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: formData.tema.color_primario }}
                    >
                      Confirmar Asistencia
                    </div>
                    <div
                      className="rounded-lg p-3 mt-3"
                      style={{ backgroundColor: formData.tema.color_secundario }}
                    >
                      <p style={{ color: formData.tema.color_texto }}>
                        Sección secundaria
                      </p>
                    </div>
                  </div>
                </div>

                {/* Colores */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Colores</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {[
                      { key: 'color_primario', label: 'Primario' },
                      { key: 'color_secundario', label: 'Secundario' },
                      { key: 'color_fondo', label: 'Fondo' },
                      { key: 'color_texto', label: 'Texto' },
                      { key: 'color_texto_claro', label: 'Texto Claro' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.tema[key]}
                            onChange={(e) => handleTemaChange(key, e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                          />
                          <input
                            type="text"
                            value={formData.tema[key]}
                            onChange={(e) => handleTemaChange(key, e.target.value)}
                            className="w-20 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fuentes */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Fuentes</h4>
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
              </div>
            )}

            {/* Sección Avanzado (Elementos Temáticos) */}
            {activeSection === 'avanzado' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Estos elementos se aplicarán en la página pública de la invitación para hacerla más temática y visual.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select
                    label="Patrón de Fondo"
                    value={formData.tema.patron_fondo}
                    onChange={(e) => handleTemaChange('patron_fondo', e.target.value)}
                    options={PATRONES_FONDO}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Opacidad del Patrón
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={formData.tema.patron_opacidad}
                      onChange={(e) => handleTemaChange('patron_opacidad', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{Math.round(formData.tema.patron_opacidad * 100)}%</span>
                  </div>
                  <Select
                    label="Decoración de Esquinas"
                    value={formData.tema.decoracion_esquinas}
                    onChange={(e) => handleTemaChange('decoracion_esquinas', e.target.value)}
                    options={DECORACIONES_ESQUINAS}
                  />
                  <Select
                    label="Ícono Principal"
                    value={formData.tema.icono_principal}
                    onChange={(e) => handleTemaChange('icono_principal', e.target.value)}
                    options={ICONOS_PRINCIPALES}
                  />
                  <Select
                    label="Animación de Entrada"
                    value={formData.tema.animacion_entrada}
                    onChange={(e) => handleTemaChange('animacion_entrada', e.target.value)}
                    options={ANIMACIONES_ENTRADA}
                  />
                  <Select
                    label="Efecto en Título"
                    value={formData.tema.efecto_titulo}
                    onChange={(e) => handleTemaChange('efecto_titulo', e.target.value)}
                    options={EFECTOS_TITULO}
                  />
                  <Select
                    label="Marco de Fotos"
                    value={formData.tema.marco_fotos}
                    onChange={(e) => handleTemaChange('marco_fotos', e.target.value)}
                    options={MARCOS_FOTOS}
                  />
                </div>

                {/* Stickers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stickers Decorativos (emojis separados por coma)
                  </label>
                  <Input
                    value={formData.tema.stickers?.join(', ') || ''}
                    onChange={(e) => handleTemaChange('stickers', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Ej: 🦸, 💥, ⚡, 🎉"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se mostrarán como decoración en la invitación</p>
                </div>

                {/* HTML/CSS personalizados */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">HTML/CSS Personalizado (Avanzado)</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                          {plantilla.nombre}
                        </p>
                        <p
                          className="text-xs mb-2"
                          style={{ color: tema.color_texto_claro, fontFamily: tema.fuente_cuerpo }}
                        >
                          {plantilla.subcategoria || plantilla.categoria || 'Vista previa'}
                        </p>
                        <div
                          className="inline-block px-3 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: tema.color_primario }}
                        >
                          Confirmar
                        </div>
                      </div>
                      {tema.stickers?.length > 0 && (
                        <div className="mt-2 text-xl">
                          {tema.stickers.slice(0, 4).join(' ')}
                        </div>
                      )}
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

                  {/* Tags de categorización */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {TIPOS_EVENTO.find(t => t.value === plantilla.tipo_evento)?.label || plantilla.tipo_evento}
                    </span>
                    {plantilla.categoria && (
                      <span className="px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 rounded-full">
                        {CATEGORIAS.find(c => c.value === plantilla.categoria)?.label || plantilla.categoria}
                      </span>
                    )}
                    {plantilla.subcategoria && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-full">
                        {plantilla.subcategoria}
                      </span>
                    )}
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
                      onClick={() => setPlantillaAEliminar(plantilla.id)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
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
          <p className="text-gray-500 dark:text-gray-400">
            No hay plantillas
            {filtroTipo && ` de tipo "${TIPOS_EVENTO.find(t => t.value === filtroTipo)?.label}"`}
            {filtroCategoria && ` en categoría "${CATEGORIAS.find(c => c.value === filtroCategoria)?.label}"`}
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Plantilla
          </Button>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={!!plantillaAEliminar}
        onClose={() => setPlantillaAEliminar(null)}
        onConfirm={handleEliminar}
        title="Eliminar plantilla"
        message="¿Estás seguro de eliminar esta plantilla? Si está en uso, solo será desactivada."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarPlantilla.isPending}
      />
    </div>
  );
}

export default PlantillasEventos;
