/**
 * DatosEventoForm — Formulario de datos del evento (paso 2)
 */
import { memo } from 'react';

const DatosEventoForm = memo(function DatosEventoForm({ datos, onChange }) {
  const handleChange = (campo, valor) => {
    onChange({ ...datos, [campo]: valor });
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        Datos de tu evento
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        No te preocupes, podrás editar todo después
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Nombre del evento *
          </label>
          <input
            type="text"
            value={datos.nombre || ''}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: Boda de Ana & Carlos"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Fecha *
            </label>
            <input
              type="date"
              value={datos.fecha || ''}
              onChange={(e) => handleChange('fecha', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Hora
            </label>
            <input
              type="time"
              value={datos.hora || ''}
              onChange={(e) => handleChange('hora', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Ubicación
          </label>
          <input
            type="text"
            value={datos.ubicacion || ''}
            onChange={(e) => handleChange('ubicacion', e.target.value)}
            placeholder="Ej: Salón Las Palmas, CDMX"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Descripción
          </label>
          <textarea
            value={datos.descripcion || ''}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Un breve mensaje sobre tu evento..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
});

export default DatosEventoForm;
