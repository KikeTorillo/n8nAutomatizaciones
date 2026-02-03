/**
 * ====================================================================
 * EQUIPO CANVAS BLOCK
 * ====================================================================
 * Bloque de equipo editable para el canvas WYSIWYG.
 * Soporta origen manual o desde ERP (profesionales).
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Instagram, Facebook, Linkedin, Twitter, Database, Loader2 } from 'lucide-react';
import { InlineText } from '../InlineEditor';
import { useERPData } from '../../hooks';

/**
 * Equipo Canvas Block
 */
function EquipoCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Nuestro Equipo',
    subtitulo_seccion = '',
    mostrar_redes = true,
    origen = 'manual',
    filtro_profesionales = {},
    items = [],
  } = contenido;

  // Hook centralizado para datos ERP (solo si origen es 'profesionales')
  const { data: profesionalesERPMapped, isLoading: loadingERP } = useERPData(
    'profesionales',
    filtro_profesionales,
    origen === 'profesionales'
  );

  // Determinar miembros a renderizar según origen
  const miembros = useMemo(() => {
    if (origen === 'profesionales') {
      return profesionalesERPMapped.length > 0 ? profesionalesERPMapped : [
        { nombre: 'Cargando profesionales...', cargo: 'Desde el módulo Profesionales', descripcion: '', foto_url: null, redes: {} },
      ];
    }
    // Modo manual - usar items o defaults
    return items.length > 0 ? items : [
      { nombre: 'Ana García', cargo: 'Directora', descripcion: 'Experta con más de 10 años de experiencia.', foto_url: null, redes: {} },
      { nombre: 'Carlos López', cargo: 'Especialista', descripcion: 'Apasionado por brindar el mejor servicio.', foto_url: null, redes: {} },
      { nombre: 'María Rodríguez', cargo: 'Coordinadora', descripcion: 'Siempre atenta a cada detalle.', foto_url: null, redes: {} },
    ];
  }, [origen, items, profesionalesERPMapped]);

  /**
   * Update a single team member (solo modo manual)
   */
  const updateItem = (index, field, value) => {
    if (origen === 'profesionales') return; // No editar items del ERP inline
    const newItems = [...miembros];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ items: newItems });
  };

  /**
   * Social icons map
   */
  const socialIcons = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
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

          {/* Indicador de origen ERP en modo edición */}
          {isEditing && origen === 'profesionales' && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
              <Database className="w-3 h-3" />
              Profesionales desde ERP
              {loadingERP && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
          )}
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {miembros.map((miembro, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Photo */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative">
                {miembro.foto_url ? (
                  <img
                    src={miembro.foto_url}
                    alt={miembro.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span
                      className="text-6xl font-bold text-white"
                      style={{
                        color: `var(--color-primario, ${tema?.color_primario || '#753572'})`,
                        opacity: 0.3,
                      }}
                    >
                      {miembro.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 text-center">
                {/* Name */}
                {isEditing && origen === 'manual' ? (
                  <InlineText
                    value={miembro.nombre}
                    onChange={(value) => updateItem(index, 'nombre', value)}
                    placeholder="Nombre"
                    className="text-xl font-bold text-gray-900 dark:text-white block"
                    as="h3"
                  />
                ) : (
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {miembro.nombre}
                  </h3>
                )}

                {/* Position */}
                {isEditing && origen === 'manual' ? (
                  <InlineText
                    value={miembro.cargo}
                    onChange={(value) => updateItem(index, 'cargo', value)}
                    placeholder="Cargo"
                    className="text-sm font-medium mb-3 block"
                    style={{ color: `var(--color-primario, ${tema?.color_primario || '#753572'})` }}
                  />
                ) : (
                  <p
                    className="text-sm font-medium mb-3"
                    style={{ color: `var(--color-primario, ${tema?.color_primario || '#753572'})` }}
                  >
                    {miembro.cargo}
                  </p>
                )}

                {/* Description */}
                {miembro.descripcion && (
                  isEditing && origen === 'manual' ? (
                    <InlineText
                      value={miembro.descripcion}
                      onChange={(value) => updateItem(index, 'descripcion', value)}
                      placeholder="Descripción"
                      className="text-gray-600 dark:text-gray-400 text-sm block"
                      as="p"
                      multiline
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {miembro.descripcion}
                    </p>
                  )
                )}

                {/* Social Links */}
                {mostrar_redes && miembro.redes && Object.keys(miembro.redes).length > 0 && (
                  <div className="flex justify-center gap-3 mt-4">
                    {Object.entries(miembro.redes).map(([red, url]) => {
                      if (!url) return null;
                      const Icon = socialIcons[red];
                      if (!Icon) return null;

                      return (
                        <a
                          key={red}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(EquipoCanvasBlock);
