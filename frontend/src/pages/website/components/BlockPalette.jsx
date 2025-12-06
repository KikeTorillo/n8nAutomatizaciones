import {
  Layout,
  Briefcase,
  MessageSquareQuote,
  Users,
  MousePointerClick,
  Mail,
  PanelBottom,
  Type,
  Image,
  Video,
  Minus,
  Loader2,
} from 'lucide-react';

/**
 * Iconos para cada tipo de bloque
 */
const ICONOS_BLOQUES = {
  hero: Layout,
  servicios: Briefcase,
  testimonios: MessageSquareQuote,
  equipo: Users,
  cta: MousePointerClick,
  contacto: Mail,
  footer: PanelBottom,
  texto: Type,
  galeria: Image,
  video: Video,
  separador: Minus,
};

/**
 * Colores para cada tipo de bloque
 */
const COLORES_BLOQUES = {
  hero: { bg: 'bg-purple-100', text: 'text-purple-600' },
  servicios: { bg: 'bg-blue-100', text: 'text-blue-600' },
  testimonios: { bg: 'bg-amber-100', text: 'text-amber-600' },
  equipo: { bg: 'bg-green-100', text: 'text-green-600' },
  cta: { bg: 'bg-red-100', text: 'text-red-600' },
  contacto: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  footer: { bg: 'bg-gray-100', text: 'text-gray-600' },
  texto: { bg: 'bg-slate-100', text: 'text-slate-600' },
  galeria: { bg: 'bg-pink-100', text: 'text-pink-600' },
  video: { bg: 'bg-rose-100', text: 'text-rose-600' },
  separador: { bg: 'bg-neutral-100', text: 'text-neutral-600' },
};

/**
 * Descripciones de cada bloque
 */
const DESCRIPCIONES_BLOQUES = {
  hero: 'Banner principal con título y CTA',
  servicios: 'Tarjetas de servicios ofrecidos',
  testimonios: 'Opiniones de clientes',
  equipo: 'Miembros del equipo',
  cta: 'Llamada a la acción',
  contacto: 'Formulario e info de contacto',
  footer: 'Pie de página con links',
  texto: 'Texto enriquecido libre',
  galeria: 'Galería de imágenes',
  video: 'Video de YouTube/Vimeo',
  separador: 'Línea divisoria',
};

/**
 * BlockPalette - Paleta de bloques disponibles
 */
function BlockPalette({ tiposBloques = [], onAgregarBloque, disabled }) {
  // Si no hay tipos del backend, usar lista hardcoded
  const tipos = tiposBloques.length > 0
    ? tiposBloques
    : [
        { tipo: 'hero', nombre: 'Hero' },
        { tipo: 'servicios', nombre: 'Servicios' },
        { tipo: 'testimonios', nombre: 'Testimonios' },
        { tipo: 'equipo', nombre: 'Equipo' },
        { tipo: 'cta', nombre: 'CTA' },
        { tipo: 'contacto', nombre: 'Contacto' },
        { tipo: 'footer', nombre: 'Footer' },
        { tipo: 'texto', nombre: 'Texto' },
        { tipo: 'galeria', nombre: 'Galería' },
        { tipo: 'video', nombre: 'Video' },
        { tipo: 'separador', nombre: 'Separador' },
      ];

  // Agrupar por categoría
  const estructurales = tipos.filter(t =>
    ['hero', 'footer', 'separador'].includes(t.tipo)
  );
  const contenido = tipos.filter(t =>
    ['servicios', 'equipo', 'testimonios', 'texto'].includes(t.tipo)
  );
  const media = tipos.filter(t =>
    ['galeria', 'video'].includes(t.tipo)
  );
  const interactivos = tipos.filter(t =>
    ['cta', 'contacto'].includes(t.tipo)
  );

  const renderGrupo = (titulo, bloques) => {
    if (bloques.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
          {titulo}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {bloques.map((bloque) => (
            <BloqueCard
              key={bloque.tipo}
              tipo={bloque.tipo}
              nombre={bloque.nombre}
              onClick={() => onAgregarBloque(bloque.tipo)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Agregar bloque</h3>
        <p className="text-xs text-gray-500 mt-1">
          Haz clic para agregar al final de la página
        </p>
      </div>

      {/* Bloques */}
      <div className="flex-1 overflow-y-auto p-4">
        {disabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-amber-700">
              Selecciona una página para agregar bloques
            </p>
          </div>
        )}

        {renderGrupo('Estructura', estructurales)}
        {renderGrupo('Contenido', contenido)}
        {renderGrupo('Media', media)}
        {renderGrupo('Interactivos', interactivos)}
      </div>
    </div>
  );
}

/**
 * Card de bloque individual
 */
function BloqueCard({ tipo, nombre, onClick, disabled }) {
  const Icono = ICONOS_BLOQUES[tipo] || Layout;
  const colores = COLORES_BLOQUES[tipo] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  const descripcion = DESCRIPCIONES_BLOQUES[tipo] || '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-3 rounded-lg border border-gray-200 bg-white text-left
        transition-all hover:border-indigo-300 hover:shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none
        group
      `}
      title={descripcion}
    >
      <div className={`w-8 h-8 ${colores.bg} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
        <Icono className={`w-4 h-4 ${colores.text}`} />
      </div>
      <p className="text-xs font-medium text-gray-900">{nombre}</p>
    </button>
  );
}

export default BlockPalette;
