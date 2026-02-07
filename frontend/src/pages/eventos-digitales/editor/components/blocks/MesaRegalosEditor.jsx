/**
 * ====================================================================
 * MESA REGALOS EDITOR
 * ====================================================================
 * Editor del bloque de mesa de regalos.
 * Permite agregar enlaces a tiendas y registros de regalos.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useCallback, useMemo } from 'react';
import { Gift, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button, Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import { ImageField, BaseAutoSaveEditor, useBlockEditor } from '@/components/editor-framework';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * MesaRegalosEditor - Editor del bloque de mesa de regalos
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 * @param {Object} props.mesaRegalos - Mesa de regalos del evento (desde el backend)
 */
function MesaRegalosEditor({
  contenido,
  estilos,
  onChange,
  tema,
  mesaRegalos = null,
}) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.mesa_regalos,
    }),
    []
  );

  // Default item para nuevos enlaces
  const defaultItem = useMemo(
    () => ({
      nombre: 'Nueva tienda',
      url: '',
      logo_url: '',
      descripcion: '',
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange, handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  // Handlers para array de items
  const handleAgregarItem = useCallback(() => {
    handleArrayItemAdd('items', defaultItem);
  }, [handleArrayItemAdd, defaultItem]);

  const handleEliminarItem = useCallback((index) => {
    handleArrayItemRemove('items', index);
  }, [handleArrayItemRemove]);

  const handleChangeItem = useCallback((index, campo, valor) => {
    handleArrayItemChange('items', index, campo, valor);
  }, [handleArrayItemChange]);

  // Opciones de layout
  const layoutOptions = [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'Lista' },
  ];

  // Items a mostrar (del evento o personalizados)
  const itemsAMostrar = useMemo(() => {
    if (form.usar_mesa_evento && mesaRegalos?.tiendas) {
      return mesaRegalos.tiendas;
    }
    return form.items || [];
  }, [form.usar_mesa_evento, form.items, mesaRegalos]);

  // Componente de preview
  const preview = useMemo(() => {
    const colorPrimario = tema?.color_primario || '#753572';

    return (
      <div className="p-4">
        <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
          {form.titulo || 'Mesa de Regalos'}
        </h4>

        {form.subtitulo && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {form.subtitulo}
          </p>
        )}

        {/* Preview de tiendas */}
        <div
          className={
            form.layout === 'grid'
              ? 'grid grid-cols-2 gap-3'
              : 'space-y-3'
          }
        >
          {itemsAMostrar.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className={`p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 ${
                form.layout === 'list' ? 'flex items-center gap-3' : 'text-center'
              }`}
            >
              {item.logo_url ? (
                <img
                  src={item.logo_url}
                  alt={item.nombre}
                  className={`${
                    form.layout === 'grid'
                      ? 'w-12 h-12 mx-auto mb-2'
                      : 'w-10 h-10 flex-shrink-0'
                  } object-contain`}
                />
              ) : (
                <div
                  className={`${
                    form.layout === 'grid'
                      ? 'w-12 h-12 mx-auto mb-2'
                      : 'w-10 h-10 flex-shrink-0'
                  } rounded flex items-center justify-center`}
                  style={{ backgroundColor: `${colorPrimario}20` }}
                >
                  <Gift className="w-5 h-5" style={{ color: colorPrimario }} />
                </div>
              )}
              <div className={form.layout === 'list' ? 'flex-1' : ''}>
                <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                  {item.nombre || 'Tienda'}
                </h5>
                {item.descripcion && form.layout === 'list' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.descripcion}
                  </p>
                )}
              </div>
              {form.layout === 'list' && (
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {itemsAMostrar.length === 0 && (
          <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {form.usar_mesa_evento
                ? 'Configura la mesa de regalos del evento'
                : 'Agrega enlaces de tiendas'}
            </p>
          </div>
        )}
      </div>
    );
  }, [form, tema?.color_primario, itemsAMostrar]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Mesa de Regalos"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo || ''}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Tu presencia es nuestro mejor regalo"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Fuente de datos */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Fuente de datos
          </h4>
          <ToggleSwitch
            checked={form.usar_mesa_evento || false}
            onChange={(checked) => handleFieldChange('usar_mesa_evento', checked)}
            label="Usar del evento"
          />
        </div>

        {form.usar_mesa_evento && (
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <ExternalLink className="w-3 h-3" />
            Configura la mesa de regalos en la pestaña "Mesa de Regalos" del evento
          </p>
        )}
      </div>

      {/* Lista de tiendas personalizadas */}
      {!form.usar_mesa_evento && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tiendas ({(form.items || []).length})
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={handleAgregarItem}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          {(form.items || []).map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Gift
                    className="w-4 h-4"
                    style={{ color: tema?.color_primario || '#753572' }}
                  />
                  Tienda {index + 1}
                </span>
                {(form.items || []).length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminarItem(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <Input
                  label="Nombre de la tienda"
                  value={item.nombre || ''}
                  onChange={(e) => handleChangeItem(index, 'nombre', e.target.value)}
                  placeholder="Liverpool, Amazon, Sears..."
                  className="dark:bg-gray-600 dark:border-gray-500"
                />

                <Input
                  label="URL del registro"
                  type="url"
                  value={item.url || ''}
                  onChange={(e) => handleChangeItem(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="dark:bg-gray-600 dark:border-gray-500"
                />

                <ImageField
                  label="Logo (opcional)"
                  value={item.logo_url || ''}
                  onChange={(val) => handleChangeItem(index, 'logo_url', val)}
                />

                <Input
                  label="Descripción (opcional)"
                  value={item.descripcion || ''}
                  onChange={(e) => handleChangeItem(index, 'descripcion', e.target.value)}
                  placeholder="Mesa de regalos principal"
                  className="dark:bg-gray-600 dark:border-gray-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Opciones de estilo */}
      <Select
        label="Diseño"
        value={form.layout || 'grid'}
        onChange={(e) => handleFieldChange('layout', e.target.value)}
        options={layoutOptions}
        className="dark:bg-gray-700 dark:border-gray-600"
      />
    </BaseAutoSaveEditor>
  );
}

export default memo(MesaRegalosEditor);
