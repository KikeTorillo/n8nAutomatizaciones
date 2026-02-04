/**
 * ====================================================================
 * COUNTDOWN EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque de cuenta regresiva para invitaciones digitales.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { Input, Select, ToggleSwitch } from '@/components/ui';
import { DateTimeField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * CountdownEditor - Editor del bloque Countdown
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function CountdownEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.countdown,
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  // Opciones de estilo
  const estiloOptions = [
    { value: 'cajas', label: 'Cajas separadas' },
    { value: 'inline', label: 'En línea' },
    { value: 'circular', label: 'Circular' },
  ];

  // Calcular tiempo restante para preview
  const tiempoRestante = useMemo(() => {
    if (!form.fecha_objetivo) return null;
    const fecha = new Date(form.fecha_objetivo);
    const ahora = new Date();
    const diff = fecha - ahora;

    if (diff <= 0) return null;

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    return { dias, horas, minutos, segundos };
  }, [form.fecha_objetivo]);

  // Componente de preview
  const preview = useMemo(() => {
    const colorPrimario = tema?.color_primario || '#753572';

    return (
      <div className="p-6 text-center">
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {form.titulo || 'Faltan'}
        </h4>

        {tiempoRestante ? (
          <div
            className={`${
              form.estilo === 'inline'
                ? 'flex items-center justify-center gap-2'
                : 'grid grid-cols-4 gap-3'
            }`}
          >
            {/* Días */}
            <div
              className={`${
                form.estilo === 'cajas'
                  ? 'p-3 rounded-lg bg-gray-100 dark:bg-gray-700'
                  : form.estilo === 'circular'
                  ? 'w-16 h-16 rounded-full flex flex-col items-center justify-center'
                  : ''
              }`}
              style={
                form.estilo === 'circular'
                  ? { border: `2px solid ${colorPrimario}` }
                  : {}
              }
            >
              <span
                className="text-2xl font-bold block"
                style={{ color: colorPrimario }}
              >
                {tiempoRestante.dias}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">días</span>
            </div>

            {form.estilo === 'inline' && <span className="text-gray-400">:</span>}

            {/* Horas */}
            <div
              className={`${
                form.estilo === 'cajas'
                  ? 'p-3 rounded-lg bg-gray-100 dark:bg-gray-700'
                  : form.estilo === 'circular'
                  ? 'w-16 h-16 rounded-full flex flex-col items-center justify-center'
                  : ''
              }`}
              style={
                form.estilo === 'circular'
                  ? { border: `2px solid ${colorPrimario}` }
                  : {}
              }
            >
              <span
                className="text-2xl font-bold block"
                style={{ color: colorPrimario }}
              >
                {tiempoRestante.horas}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">hrs</span>
            </div>

            {form.estilo === 'inline' && <span className="text-gray-400">:</span>}

            {/* Minutos */}
            <div
              className={`${
                form.estilo === 'cajas'
                  ? 'p-3 rounded-lg bg-gray-100 dark:bg-gray-700'
                  : form.estilo === 'circular'
                  ? 'w-16 h-16 rounded-full flex flex-col items-center justify-center'
                  : ''
              }`}
              style={
                form.estilo === 'circular'
                  ? { border: `2px solid ${colorPrimario}` }
                  : {}
              }
            >
              <span
                className="text-2xl font-bold block"
                style={{ color: colorPrimario }}
              >
                {tiempoRestante.minutos}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">min</span>
            </div>

            {form.mostrar_segundos && (
              <>
                {form.estilo === 'inline' && <span className="text-gray-400">:</span>}
                {/* Segundos */}
                <div
                  className={`${
                    form.estilo === 'cajas'
                      ? 'p-3 rounded-lg bg-gray-100 dark:bg-gray-700'
                      : form.estilo === 'circular'
                      ? 'w-16 h-16 rounded-full flex flex-col items-center justify-center'
                      : ''
                  }`}
                  style={
                    form.estilo === 'circular'
                      ? { border: `2px solid ${colorPrimario}` }
                      : {}
                  }
                >
                  <span
                    className="text-2xl font-bold block"
                    style={{ color: colorPrimario }}
                  >
                    {tiempoRestante.segundos}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">seg</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-lg font-medium" style={{ color: colorPrimario }}>
            {form.texto_finalizado || '¡Llegó el gran día!'}
          </p>
        )}
      </div>
    );
  }, [form, tiempoRestante, tema?.color_primario]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Faltan"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <DateTimeField
        label="Fecha y hora objetivo"
        value={form.fecha_objetivo || ''}
        onChange={(val) => handleFieldChange('fecha_objetivo', val)}
      />

      <Input
        label="Texto al finalizar"
        value={form.texto_finalizado || ''}
        onChange={(e) => handleFieldChange('texto_finalizado', e.target.value)}
        placeholder="¡Llegó el gran día!"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Estilo visual"
          value={form.estilo || 'cajas'}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />

        <div className="flex items-center pt-6">
          <ToggleSwitch
            checked={form.mostrar_segundos || false}
            onChange={(checked) => handleFieldChange('mostrar_segundos', checked)}
            label="Mostrar segundos"
          />
        </div>
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(CountdownEditor);
