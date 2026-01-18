import { useState } from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink } from 'lucide-react';
import { sanitizeHTML } from '@/lib/sanitize';

/**
 * PreviewPanel - Panel de vista previa del sitio
 */
function PreviewPanel({ config, pagina, bloques }) {
  const [dispositivo, setDispositivo] = useState('desktop');

  const anchos = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  if (!pagina) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Vista previa</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Selecciona una página para ver la vista previa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Vista previa</h3>

        {/* Selector de dispositivo */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setDispositivo('desktop')}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              dispositivo === 'desktop'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDispositivo('tablet')}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              dispositivo === 'tablet'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDispositivo('mobile')}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              dispositivo === 'mobile'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 p-4">
        <div
          className="h-full bg-white rounded-lg shadow-lg overflow-hidden mx-auto transition-all duration-300"
          style={{ maxWidth: anchos[dispositivo] }}
        >
          {/* Barra de navegación mock */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded px-3 py-1 text-xs text-gray-500 truncate">
              nexo.com/sitio/{config?.slug || 'mi-sitio'}/{pagina.slug || ''}
            </div>
          </div>

          {/* Contenido de la página */}
          <div className="h-full overflow-y-auto">
            {bloques.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExternalLink className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    Página vacía
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Agrega bloques desde el panel izquierdo
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bloques.map((bloque) => (
                  <PreviewBloque
                    key={bloque.id}
                    bloque={bloque}
                    tema={config?.tema}
                    dispositivo={dispositivo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Vista previa aproximada. El resultado final puede variar.
        </p>
      </div>
    </div>
  );
}

/**
 * Preview de un bloque individual
 */
function PreviewBloque({ bloque, tema, dispositivo }) {
  const contenido = bloque.contenido || {};
  const colorPrimario = tema?.colores?.primario || '#4F46E5';
  const colorFondo = tema?.colores?.fondo || '#FFFFFF';
  const colorTexto = tema?.colores?.texto || '#1F2937';

  // Renderizar según tipo
  switch (bloque.tipo_bloque) {
    case 'hero':
      return (
        <div
          className="p-8 text-center"
          style={{ backgroundColor: colorPrimario }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            {contenido.titulo || 'Título del Hero'}
          </h1>
          <p className="text-white/80 text-sm mb-4">
            {contenido.subtitulo || 'Subtítulo descriptivo'}
          </p>
          {contenido.cta_texto && (
            <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium">
              {contenido.cta_texto}
            </button>
          )}
        </div>
      );

    case 'servicios':
      return (
        <div className="p-6" style={{ backgroundColor: colorFondo }}>
          <h2
            className="text-lg font-bold mb-4 text-center"
            style={{ color: colorTexto }}
          >
            {contenido.titulo || 'Nuestros Servicios'}
          </h2>
          <div className={`grid gap-3 ${dispositivo === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {(contenido.servicios || [{ nombre: 'Servicio 1' }, { nombre: 'Servicio 2' }]).slice(0, 4).map((s, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-lg"
              >
                <p className="text-sm font-medium" style={{ color: colorTexto }}>
                  {s.nombre}
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div
          className="p-6 text-center"
          style={{ backgroundColor: colorPrimario }}
        >
          <h2 className="text-lg font-bold text-white mb-2">
            {contenido.titulo || 'Llamada a la acción'}
          </h2>
          <p className="text-white/80 text-sm mb-3">
            {contenido.subtitulo || 'Descripción breve'}
          </p>
          <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium">
            {contenido.boton_texto || 'Contactar'}
          </button>
        </div>
      );

    case 'contacto':
      return (
        <div className="p-6" style={{ backgroundColor: colorFondo }}>
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: colorTexto }}
          >
            {contenido.titulo || 'Contacto'}
          </h2>
          <div className="space-y-2 text-sm" style={{ color: colorTexto }}>
            <p>{contenido.direccion || 'Dirección del negocio'}</p>
            <p>{contenido.telefono || 'Teléfono'}</p>
            <p>{contenido.email || 'email@ejemplo.com'}</p>
          </div>
        </div>
      );

    case 'texto':
      return (
        <div className="p-6" style={{ backgroundColor: colorFondo }}>
          <div
            className="text-sm"
            style={{ color: colorTexto }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(contenido.html) || '<p>Contenido de texto...</p>'
            }}
          />
        </div>
      );

    case 'testimonios':
      return (
        <div className="p-6" style={{ backgroundColor: colorFondo }}>
          <h2
            className="text-lg font-bold mb-4 text-center"
            style={{ color: colorTexto }}
          >
            {contenido.titulo || 'Testimonios'}
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm italic" style={{ color: colorTexto }}>
              "{contenido.testimonios?.[0]?.texto || 'Excelente servicio...'}"
            </p>
            <p className="text-xs mt-2" style={{ color: colorPrimario }}>
              - {contenido.testimonios?.[0]?.autor || 'Cliente'}
            </p>
          </div>
        </div>
      );

    case 'equipo':
      return (
        <div className="p-6" style={{ backgroundColor: colorFondo }}>
          <h2
            className="text-lg font-bold mb-4 text-center"
            style={{ color: colorTexto }}
          >
            {contenido.titulo || 'Nuestro Equipo'}
          </h2>
          <div className="flex justify-center gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2" />
                <p className="text-xs font-medium" style={{ color: colorTexto }}>
                  Miembro {i}
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="p-4 bg-gray-800 text-white text-center">
          <p className="text-xs">
            {contenido.copyright || '© 2025 Mi Negocio'}
          </p>
        </div>
      );

    case 'separador':
      return (
        <div className="py-4 px-6">
          <hr className="border-gray-200" />
        </div>
      );

    case 'galeria':
      return (
        <div className="p-6" style={{ backgroundColor: colorFondo }}>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="p-6" style={{ backgroundColor: colorFondo }}>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs">Video</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Bloque: {bloque.tipo_bloque}
          </p>
        </div>
      );
  }
}

export default PreviewPanel;
