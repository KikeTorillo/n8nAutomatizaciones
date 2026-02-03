/**
 * ====================================================================
 * SERVICIOS CANVAS BLOCK
 * ====================================================================
 * Bloque de servicios editable para el canvas WYSIWYG.
 * Soporta origen manual o desde ERP.
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { InlineText } from '../InlineEditor';
import * as LucideIcons from 'lucide-react';
import { useERPData } from '../../hooks';

/**
 * Servicios Canvas Block
 */
function ServiciosCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Nuestros Servicios',
    subtitulo_seccion = 'Lo que ofrecemos',
    columnas = 3,
    origen = 'manual',
    filtro_erp = {},
    mostrar_precio = true,
    mostrar_duracion = false,
    items = [],
  } = contenido;

  // Hook centralizado para datos ERP (solo si origen es 'erp')
  const { data: serviciosERPMapped, isLoading: loadingERP } = useERPData(
    'servicios',
    filtro_erp,
    origen === 'erp'
  );

  // Determinar servicios a renderizar segun origen
  const servicios = useMemo(() => {
    if (origen === 'erp') {
      return serviciosERPMapped.length > 0 ? serviciosERPMapped : [
        { icono: 'Database', nombre: 'Cargando servicios...', descripcion: 'Desde el módulo de Servicios', precio: 0 },
      ];
    }

    // Modo manual - usar items o defaults
    return items.length > 0 ? items : [
      { icono: 'Scissors', nombre: 'Servicio 1', descripcion: 'Descripción del servicio', precio: 0 },
      { icono: 'Brush', nombre: 'Servicio 2', descripcion: 'Descripción del servicio', precio: 0 },
      { icono: 'Sparkles', nombre: 'Servicio 3', descripcion: 'Descripción del servicio', precio: 0 },
    ];
  }, [origen, items, serviciosERPMapped]);

  // Grid columns class (keys como string para compatibilidad con select)
  const gridCols = {
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };
  const colKey = String(columnas);

  /**
   * Update a single service item (solo modo manual)
   */
  const updateItem = (index, field, value) => {
    if (origen === 'erp') return; // No editar items ERP inline
    const newItems = [...servicios];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ items: newItems });
  };

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          {isEditing ? (
            <InlineText
              value={titulo_seccion}
              onChange={(value) => onContentChange({ titulo_seccion: value })}
              placeholder="Título de sección"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 block"
              as="h2"
            />
          ) : (
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              style={{ fontFamily: 'var(--fuente-titulos)' }}
            >
              {titulo_seccion}
            </h2>
          )}

          {subtitulo_seccion && (
            isEditing ? (
              <InlineText
                value={subtitulo_seccion}
                onChange={(value) => onContentChange({ subtitulo_seccion: value })}
                placeholder="Subtítulo"
                className="text-lg text-gray-600 dark:text-gray-400 block"
                as="p"
              />
            ) : (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {subtitulo_seccion}
              </p>
            )
          )}

          {/* Indicador de origen ERP en modo edicion */}
          {isEditing && origen === 'erp' && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
              <LucideIcons.Database className="w-3 h-3" />
              Servicios desde ERP
              {loadingERP && <LucideIcons.Loader2 className="w-3 h-3 animate-spin" />}
            </div>
          )}
        </div>

        {/* Services Grid */}
        <div className={cn('grid gap-8', gridCols[colKey] || gridCols['3'])}>
          {servicios.map((servicio, index) => {
            // Get icon component
            const IconComponent = servicio.icono
              ? (LucideIcons[servicio.icono] || LucideIcons.Star)
              : null;

            // Soportar tanto 'titulo' como 'nombre' para compatibilidad
            const servicioNombre = servicio.titulo || servicio.nombre || '';

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Image or Icon */}
                {servicio.imagen_url ? (
                  <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
                    <img
                      src={servicio.imagen_url}
                      alt={servicioNombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : IconComponent ? (
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: servicio.color_servicio
                        ? `${servicio.color_servicio}20`
                        : `var(--color-primario, ${tema?.color_primario || '#753572'})20`,
                      color: servicio.color_servicio || `var(--color-primario, ${tema?.color_primario || '#753572'})`,
                    }}
                  >
                    <IconComponent className="w-7 h-7" />
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: `var(--color-primario, ${tema?.color_primario || '#753572'})20`,
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: `var(--color-primario, ${tema?.color_primario || '#753572'})` }}
                    >
                      {(servicioNombre || 'S').charAt(0)}
                    </span>
                  </div>
                )}

                {/* Title */}
                {isEditing && origen === 'manual' ? (
                  <InlineText
                    value={servicioNombre}
                    onChange={(value) => updateItem(index, 'nombre', value)}
                    placeholder="Nombre del servicio"
                    className="text-xl font-semibold text-gray-900 dark:text-white mb-2 block"
                    as="h3"
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {servicioNombre}
                  </h3>
                )}

                {/* Description */}
                {isEditing && origen === 'manual' ? (
                  <InlineText
                    value={servicio.descripcion}
                    onChange={(value) => updateItem(index, 'descripcion', value)}
                    placeholder="Descripción del servicio"
                    className="text-gray-600 dark:text-gray-400 block"
                    as="p"
                    multiline
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {servicio.descripcion}
                  </p>
                )}

                {/* Price and Duration */}
                <div className="mt-4 flex items-center justify-between">
                  {mostrar_precio && servicio.precio > 0 && (
                    <p
                      className="text-lg font-bold"
                      style={{ color: `var(--color-primario, ${tema?.color_primario || '#753572'})` }}
                    >
                      ${typeof servicio.precio === 'number'
                        ? servicio.precio.toLocaleString()
                        : parseFloat(servicio.precio || 0).toLocaleString()}
                    </p>
                  )}
                  {mostrar_duracion && servicio.duracion_minutos > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {servicio.duracion_minutos} min
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default memo(ServiciosCanvasBlock);
