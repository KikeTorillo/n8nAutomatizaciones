/**
 * ====================================================================
 * IMAGEN ELEMENT EDITOR
 * ====================================================================
 * Editor de propiedades para elementos de tipo imagen.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  ImageField,
  SelectField,
  RangeField,
  TabContent,
} from '../../fields';
import { TABS } from '../../constants';

// ========== OPTIONS ==========

const VARIANTE_OPTIONS = [
  { value: 'foto', label: 'Foto' },
  { value: 'icono', label: 'Icono' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'logo', label: 'Logo' },
  { value: 'decoracion', label: 'Decoración' },
];

const OBJETO_FIT_OPTIONS = [
  { value: 'cover', label: 'Cubrir' },
  { value: 'contain', label: 'Contener' },
  { value: 'fill', label: 'Estirar' },
  { value: 'none', label: 'Ninguno' },
  { value: 'scale-down', label: 'Reducir si es necesario' },
];

const SOMBRA_OPTIONS = [
  { value: 'none', label: 'Sin sombra' },
  { value: 'sm', label: 'Pequeña' },
  { value: 'md', label: 'Mediana' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra grande' },
  { value: '2xl', label: '2XL' },
];

const BORDER_RADIUS_OPTIONS = [
  { value: 0, label: 'Ninguno' },
  { value: 4, label: 'Pequeño' },
  { value: 8, label: 'Mediano' },
  { value: 16, label: 'Grande' },
  { value: 24, label: 'Extra grande' },
  { value: 9999, label: 'Circular' },
];

// ========== COMPONENT ==========

function ImagenElementEditor({
  elemento,
  onChange,
  activeTab = TABS.CONTENIDO,
  onUploadImage,
}) {
  const { contenido = {}, estilos = {} } = elemento;

  // Handlers
  const handleContenidoChange = useCallback((field, value) => {
    onChange({
      contenido: {
        ...contenido,
        [field]: value,
      },
    });
  }, [contenido, onChange]);

  const handleEstilosChange = useCallback((field, value) => {
    onChange({
      estilos: {
        ...estilos,
        [field]: value,
      },
    });
  }, [estilos, onChange]);

  return (
    <div className="imagen-element-editor space-y-4">
      {/* Tab Contenido */}
      <TabContent isActive={activeTab === TABS.CONTENIDO}>
        <div className="space-y-4">
          <SelectField
            label="Variante"
            value={contenido.variante || 'foto'}
            onChange={(v) => handleContenidoChange('variante', v)}
            options={VARIANTE_OPTIONS}
          />

          <ImageField
            label="Imagen"
            value={contenido.url || ''}
            onChange={(v) => handleContenidoChange('url', v)}
            onUpload={onUploadImage}
            placeholder="URL de la imagen o subir archivo"
          />

          <TextField
            label="Texto alternativo"
            value={contenido.alt || ''}
            onChange={(v) => handleContenidoChange('alt', v)}
            placeholder="Descripción de la imagen"
            helperText="Importante para accesibilidad y SEO"
          />
        </div>
      </TabContent>

      {/* Tab Estilos */}
      <TabContent isActive={activeTab === TABS.ESTILOS}>
        <div className="space-y-4">
          <SelectField
            label="Ajuste de imagen"
            value={estilos.objetoFit || 'cover'}
            onChange={(v) => handleEstilosChange('objetoFit', v)}
            options={OBJETO_FIT_OPTIONS}
            helperText="Cómo se ajusta la imagen al contenedor"
          />

          <SelectField
            label="Bordes redondeados"
            value={estilos.borderRadius || 0}
            onChange={(v) => handleEstilosChange('borderRadius', Number(v))}
            options={BORDER_RADIUS_OPTIONS}
          />

          <SelectField
            label="Sombra"
            value={estilos.sombra || 'none'}
            onChange={(v) => handleEstilosChange('sombra', v)}
            options={SOMBRA_OPTIONS}
          />

          <RangeField
            label="Opacidad"
            value={estilos.opacidad ?? 100}
            onChange={(v) => handleEstilosChange('opacidad', v)}
            min={0}
            max={100}
            step={5}
            unit="%"
          />
        </div>
      </TabContent>
    </div>
  );
}

ImagenElementEditor.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      url: PropTypes.string,
      alt: PropTypes.string,
      variante: PropTypes.string,
    }),
    estilos: PropTypes.shape({
      objetoFit: PropTypes.string,
      borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sombra: PropTypes.string,
      opacidad: PropTypes.number,
    }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
  onUploadImage: PropTypes.func,
};

export default memo(ImagenElementEditor);
