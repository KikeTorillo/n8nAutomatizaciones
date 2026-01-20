import { DollarSign } from 'lucide-react';
import FormField from '@/components/forms/FormField';

/**
 * ServicesPriceSection - Sección de duración, precio, descuento y total
 *
 * @param {Object} props
 * @param {Object} props.control - Control de React Hook Form
 * @param {boolean} props.isEditMode - Si está en modo edición
 * @param {boolean} props.mostrarDuracionCalculada - Si mostrar duración como texto
 * @param {boolean} props.mostrarPrecioCalculado - Si mostrar precio como texto
 * @param {number} props.duracion - Duración calculada
 * @param {number} props.precio - Precio calculado
 * @param {number} props.precioTotal - Precio total después de descuento
 */
function ServicesPriceSection({
  control,
  isEditMode,
  mostrarDuracionCalculada,
  mostrarPrecioCalculado,
  duracion,
  precio,
  precioTotal,
}) {
  return (
    <>
      {/* Duración, Precio y Descuento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Duración - Mostrar como texto si hay servicios, input si no */}
        <div>
          {mostrarDuracionCalculada ? (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duración
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 h-10 flex items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {duracion || 0} min
                </span>
              </div>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Calculado de servicios
              </p>
            </>
          ) : (
            <FormField
              name="duracion_minutos"
              control={control}
              label="Duración (minutos)"
              type="number"
              placeholder="30"
              required={!isEditMode}
            />
          )}
        </div>

        {/* Precio - Mostrar como texto si hay servicios, input si no */}
        <div>
          {mostrarPrecioCalculado ? (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 h-10 flex items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${(precio || 0).toLocaleString('es-CO')}
                </span>
              </div>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Calculado de servicios
              </p>
            </>
          ) : (
            <FormField
              name="precio_servicio"
              control={control}
              label="Precio del Servicio"
              type="number"
              placeholder="25000"
              required={!isEditMode}
            />
          )}
        </div>

        {/* Descuento */}
        <FormField
          name="descuento"
          control={control}
          label="Descuento"
          type="number"
          placeholder="0"
        />
      </div>

      {/* Precio Total Calculado */}
      <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total a Pagar:</span>
          </div>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            ${precioTotal.toLocaleString('es-CO')}
          </span>
        </div>
      </div>
    </>
  );
}

export default ServicesPriceSection;
