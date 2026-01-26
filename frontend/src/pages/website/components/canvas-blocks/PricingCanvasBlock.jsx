/**
 * ====================================================================
 * PRICING CANVAS BLOCK
 * ====================================================================
 * Bloque de tabla de precios/planes editable para el canvas WYSIWYG.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Check, Star } from 'lucide-react';
import { InlineText } from '../InlineEditor';

/**
 * Pricing Canvas Block
 */
function PricingCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo_seccion = 'Nuestros Planes',
    subtitulo_seccion = 'Elige el plan perfecto para ti',
    columnas = 3,
    moneda = 'USD',
    planes = [],
  } = contenido;

  // Default plans if empty
  const planesDisplay =
    planes.length > 0
      ? planes
      : [
          {
            nombre: 'Basico',
            precio: 29,
            periodo: 'mes',
            descripcion: 'Ideal para empezar',
            caracteristicas: ['Caracteristica 1', 'Caracteristica 2', 'Caracteristica 3'],
            es_popular: false,
            boton_texto: 'Comenzar',
          },
          {
            nombre: 'Profesional',
            precio: 59,
            periodo: 'mes',
            descripcion: 'Para negocios en crecimiento',
            caracteristicas: ['Todo del Basico', 'Caracteristica 4', 'Caracteristica 5', 'Caracteristica 6'],
            es_popular: true,
            boton_texto: 'Elegir Plan',
          },
          {
            nombre: 'Empresarial',
            precio: 99,
            periodo: 'mes',
            descripcion: 'Solucion completa',
            caracteristicas: ['Todo del Profesional', 'Caracteristica 7', 'Caracteristica 8', 'Soporte prioritario'],
            es_popular: false,
            boton_texto: 'Contactar',
          },
        ];

  /**
   * Update a single plan
   */
  const updatePlan = (index, field, value) => {
    const newPlanes = [...planesDisplay];
    newPlanes[index] = { ...newPlanes[index], [field]: value };
    onContentChange({ planes: newPlanes });
  };

  const colorPrimario = tema?.color_primario || '#753572';

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          {isEditing ? (
            <>
              <InlineText
                value={titulo_seccion}
                onChange={(value) => onContentChange({ titulo_seccion: value })}
                placeholder="Titulo de seccion"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white block mb-4"
                as="h2"
              />
              <InlineText
                value={subtitulo_seccion}
                onChange={(value) => onContentChange({ subtitulo_seccion: value })}
                placeholder="Subtitulo"
                className="text-lg text-gray-600 dark:text-gray-400 block"
                as="p"
              />
            </>
          ) : (
            <>
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                style={{ fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo_seccion}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{subtitulo_seccion}</p>
            </>
          )}
        </div>

        {/* Pricing Cards */}
        <div
          className={cn(
            'grid gap-8',
            columnas === 2 && 'grid-cols-1 md:grid-cols-2',
            columnas === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            columnas === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}
        >
          {planesDisplay.map((plan, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-all',
                plan.es_popular && 'ring-2 scale-105 z-10'
              )}
              style={plan.es_popular ? { ringColor: colorPrimario } : {}}
            >
              {/* Popular Badge */}
              {plan.es_popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-sm font-medium flex items-center gap-1"
                  style={{ backgroundColor: colorPrimario }}
                >
                  <Star className="w-4 h-4 fill-current" />
                  Mas Popular
                </div>
              )}

              {/* Plan Name */}
              <div className="text-center mb-6 pt-2">
                {isEditing ? (
                  <InlineText
                    value={plan.nombre}
                    onChange={(value) => updatePlan(index, 'nombre', value)}
                    placeholder="Nombre del plan"
                    className="text-xl font-bold text-gray-900 dark:text-white block"
                  />
                ) : (
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.nombre}</h3>
                )}
                {isEditing ? (
                  <InlineText
                    value={plan.descripcion}
                    onChange={(value) => updatePlan(index, 'descripcion', value)}
                    placeholder="Descripcion del plan"
                    className="text-gray-500 dark:text-gray-400 text-sm mt-1 block"
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{plan.descripcion}</p>
                )}
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {moneda === 'USD' ? '$' : moneda}
                  {plan.precio}
                </span>
                <span className="text-gray-500 dark:text-gray-400">/{plan.periodo}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.caracteristicas?.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: colorPrimario }}
                    />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={cn(
                  'w-full py-3 px-6 rounded-lg font-medium transition-colors',
                  plan.es_popular
                    ? 'text-white hover:opacity-90'
                    : 'border-2 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
                style={
                  plan.es_popular
                    ? { backgroundColor: colorPrimario }
                    : { borderColor: colorPrimario, color: colorPrimario }
                }
              >
                {plan.boton_texto || 'Comenzar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(PricingCanvasBlock);
