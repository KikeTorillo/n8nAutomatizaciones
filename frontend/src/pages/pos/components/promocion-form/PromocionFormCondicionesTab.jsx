import { Controller } from 'react-hook-form';
import { Input, FormGroup } from '@/components/ui';
import { DIAS_SEMANA } from './schemas';

/**
 * Tab de condiciones y restricciones de la promoción
 * Fechas, horarios, días de la semana, límites de uso, configuración
 */
export default function PromocionFormCondicionesTab({ register, control, errors }) {
  return (
    <div className="space-y-5">
      {/* Vigencia */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Vigencia
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Fecha inicio" error={errors.fecha_inicio?.message}>
            <Input
              type="date"
              {...register('fecha_inicio', { required: 'Fecha inicio requerida' })}
              hasError={!!errors.fecha_inicio}
            />
          </FormGroup>
          <FormGroup label="Fecha fin (opcional)" helper="Dejar vacío para sin fecha de expiración">
            <Input
              type="date"
              {...register('fecha_fin')}
            />
          </FormGroup>
        </div>
      </div>

      {/* Horarios */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Horario (opcional)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Hora inicio">
            <Input
              type="time"
              {...register('hora_inicio')}
            />
          </FormGroup>
          <FormGroup label="Hora fin">
            <Input
              type="time"
              {...register('hora_fin')}
            />
          </FormGroup>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Si defines horario, la promoción solo aplicará dentro de ese rango
        </p>
      </div>

      {/* Días de la semana */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Días de la semana (opcional)
        </label>
        <Controller
          name="dias_semana"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => (
                <label
                  key={dia.value}
                  className={`px-3 py-1.5 rounded-full cursor-pointer text-sm transition-colors ${
                    field.value?.includes(dia.value)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={field.value?.includes(dia.value)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...(field.value || []), dia.value]
                        : (field.value || []).filter(v => v !== dia.value);
                      field.onChange(newValue.sort((a, b) => a - b));
                    }}
                    className="sr-only"
                  />
                  {dia.label.substring(0, 3)}
                </label>
              ))}
            </div>
          )}
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Dejar vacío para aplicar todos los días
        </p>
      </div>

      {/* Límites de uso */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Límites de uso (opcional)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Límite uso total" helper="Máximo de veces que puede usarse en total">
            <Input
              type="number"
              placeholder="Sin límite"
              {...register('limite_uso_total')}
            />
          </FormGroup>
          <FormGroup label="Límite por cliente" helper="Máximo de veces por cliente">
            <Input
              type="number"
              placeholder="Sin límite"
              {...register('limite_uso_cliente')}
            />
          </FormGroup>
        </div>
      </div>

      {/* Opciones avanzadas */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Configuración avanzada
        </h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              {...register('exclusiva')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                Promoción exclusiva
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No se puede combinar con otras promociones
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              {...register('acumulable_cupones')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                Acumulable con cupones
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permite usar cupones de descuento adicionales
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              {...register('activo')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                Promoción activa
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Desactiva para pausar la promoción sin eliminarla
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
