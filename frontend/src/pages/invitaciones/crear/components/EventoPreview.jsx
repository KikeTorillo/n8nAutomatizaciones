/**
 * EventoPreview — Resumen y preview antes de crear (paso 4)
 */
import { Calendar, Clock, MapPin, Palette, FileText } from 'lucide-react';
import { memo } from 'react';

const EventoPreview = memo(function EventoPreview({ tipoEvento, datos, plantilla }) {
  const TIPO_LABELS = { boda: 'Boda', xv: 'XV Años', bautizo: 'Bautizo', cumpleanos: 'Cumpleaños' };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        Revisa tu evento
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        Confirma los datos antes de crear tu invitación
      </p>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-pink-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
            <p className="font-semibold text-gray-900 dark:text-white">{datos.nombre || 'Sin nombre'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Palette className="w-5 h-5 text-pink-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
            <p className="font-semibold text-gray-900 dark:text-white">{TIPO_LABELS[tipoEvento] || tipoEvento}</p>
          </div>
        </div>

        {datos.fecha && (
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(datos.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {datos.hora && (
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hora</p>
              <p className="font-semibold text-gray-900 dark:text-white">{datos.hora}</p>
            </div>
          </div>
        )}

        {datos.ubicacion && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
              <p className="font-semibold text-gray-900 dark:text-white">{datos.ubicacion}</p>
            </div>
          </div>
        )}

        {plantilla && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Plantilla seleccionada</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {(plantilla.imagen_preview || plantilla.thumbnail) ? (
                  <img
                    src={plantilla.imagen_preview || plantilla.thumbnail}
                    alt={plantilla.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">💌</div>
                )}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{plantilla.nombre}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default EventoPreview;
