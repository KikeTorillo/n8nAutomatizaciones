import {
  Rocket,
  Flag,
  MapPin,
  Award,
  Users,
  Building,
  Star,
  Zap,
  Target,
  Heart,
} from 'lucide-react';

// Mapeo de iconos
const ICONS = {
  rocket: Rocket,
  flag: Flag,
  'map-pin': MapPin,
  award: Award,
  users: Users,
  building: Building,
  star: Star,
  zap: Zap,
  target: Target,
  heart: Heart,
};

// Items por defecto
const DEFAULT_ITEMS = [
  { fecha: '2020', titulo: 'Fundacion', descripcion: 'Comenzamos nuestra aventura con una vision clara.', icono: 'rocket' },
  { fecha: '2021', titulo: 'Primer Hito', descripcion: 'Alcanzamos nuestros primeros 100 clientes.', icono: 'flag' },
  { fecha: '2022', titulo: 'Expansion', descripcion: 'Abrimos nuestra segunda ubicacion.', icono: 'map-pin' },
  { fecha: '2023', titulo: 'Reconocimiento', descripcion: 'Recibimos el premio a la excelencia en servicio.', icono: 'award' },
];

/**
 * Contenido del timeline item
 */
function TimelineContent({ item, alignment = 'left' }) {
  const { fecha, titulo, descripcion } = item;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${alignment === 'right' ? 'text-right' : ''}`}>
      <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600 mb-3">
        {fecha}
      </span>
      <h3
        className="text-xl font-bold mb-2"
        style={{ color: 'var(--color-texto)' }}
      >
        {titulo}
      </h3>
      <p className="text-gray-600">{descripcion}</p>
    </div>
  );
}

/**
 * Dot del timeline con icono
 */
function TimelineDot({ icon, isLast }) {
  const Icon = ICONS[icon] || Star;

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center z-10 shadow-lg"
        style={{ backgroundColor: 'var(--color-primario)' }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      {!isLast && (
        <div
          className="w-0.5 flex-1 min-h-[80px]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primario) 40%, transparent)' }}
        />
      )}
    </div>
  );
}

/**
 * Item de timeline - Layout izquierda
 */
function TimelineItemLeft({ item, index, total }) {
  return (
    <div className="flex items-start gap-6 pb-8">
      <div className="flex-1">
        <TimelineContent item={item} alignment="right" />
      </div>
      <TimelineDot icon={item.icono} isLast={index === total - 1} />
      <div className="flex-1 hidden md:block" />
    </div>
  );
}

/**
 * Item de timeline - Layout derecha
 */
function TimelineItemRight({ item, index, total }) {
  return (
    <div className="flex items-start gap-6 pb-8">
      <div className="flex-1 hidden md:block" />
      <TimelineDot icon={item.icono} isLast={index === total - 1} />
      <div className="flex-1">
        <TimelineContent item={item} alignment="left" />
      </div>
    </div>
  );
}

/**
 * Item de timeline - Layout alternado
 */
function TimelineItemAlternado({ item, index, total }) {
  const isEven = index % 2 === 0;

  return (
    <div className="flex items-start gap-6 pb-8">
      <div className={`flex-1 ${!isEven ? 'hidden md:block' : ''}`}>
        {isEven && <TimelineContent item={item} alignment="right" />}
      </div>
      <TimelineDot icon={item.icono} isLast={index === total - 1} />
      <div className={`flex-1 ${isEven ? 'hidden md:block' : ''}`}>
        {!isEven && <TimelineContent item={item} alignment="left" />}
      </div>
    </div>
  );
}

/**
 * Wrapper que selecciona el layout correcto
 */
function TimelineItem({ item, index, total, layout }) {
  const props = { item, index, total };

  switch (layout) {
    case 'izquierda':
      return <TimelineItemLeft {...props} />;
    case 'derecha':
      return <TimelineItemRight {...props} />;
    case 'alternado':
    default:
      return <TimelineItemAlternado {...props} />;
  }
}

/**
 * TimelinePublico - Renderiza bloque de linea de tiempo en sitio público
 */
export default function TimelinePublico({ contenido }) {
  const {
    titulo_seccion = 'Nuestra Historia',
    subtitulo_seccion = 'Un recorrido por nuestros logros',
    layout = 'alternado',
    items,
  } = contenido;

  const hitos = items && items.length > 0 ? items : DEFAULT_ITEMS;

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo_seccion}
          </h2>
          <p className="text-lg text-gray-600">{subtitulo_seccion}</p>
        </div>

        {/* Timeline */}
        {hitos.length > 0 ? (
          <div className="relative">
            {hitos.map((item, index) => (
              <TimelineItem
                key={`${index}-${item.fecha}-${item.titulo}`}
                item={item}
                index={index}
                total={hitos.length}
                layout={layout}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>No hay hitos configurados.</p>
          </div>
        )}
      </div>
    </section>
  );
}
