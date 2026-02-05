/**
 * ====================================================================
 * TEXTO ELEMENT EDITOR
 * ====================================================================
 * Editor de propiedades para elementos de tipo texto.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  TextareaField,
  SelectField,
  ColorField,
  RangeField,
  AlignmentField,
  TabContent,
} from '../../fields';
import { TABS } from '../../constants';

// ========== OPTIONS ==========

const VARIANTE_OPTIONS = [
  { value: 'titulo', label: 'Título' },
  { value: 'subtitulo', label: 'Subtítulo' },
  { value: 'parrafo', label: 'Párrafo' },
  { value: 'cita', label: 'Cita' },
  { value: 'etiqueta', label: 'Etiqueta' },
];

const TAMANO_OPTIONS = [
  { value: 'xs', label: 'Extra pequeño' },
  { value: 'sm', label: 'Pequeño' },
  { value: 'base', label: 'Normal' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra grande' },
  { value: '2xl', label: '2XL' },
  { value: '3xl', label: '3XL' },
  { value: '4xl', label: '4XL' },
  { value: '5xl', label: '5XL' },
  { value: '6xl', label: '6XL' },
];

const PESO_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
  { value: 'extrabold', label: 'Extra Bold' },
];

const FUENTE_OPTIONS = [
  { value: '', label: 'Tema (por defecto)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Great Vibes', label: 'Great Vibes' },
];

// ========== COMPONENT ==========

function TextoElementEditor({
  elemento,
  onChange,
  activeTab = TABS.CONTENIDO,
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
    <div className="texto-element-editor space-y-4">
      {/* Tab Contenido */}
      <TabContent isActive={activeTab === TABS.CONTENIDO}>
        <div className="space-y-4">
          <SelectField
            label="Variante"
            value={contenido.variante || 'parrafo'}
            onChange={(v) => handleContenidoChange('variante', v)}
            options={VARIANTE_OPTIONS}
          />

          <TextareaField
            label="Texto"
            value={contenido.texto || ''}
            onChange={(v) => handleContenidoChange('texto', v)}
            placeholder="Escribe tu texto aquí..."
            rows={4}
          />
        </div>
      </TabContent>

      {/* Tab Estilos */}
      <TabContent isActive={activeTab === TABS.ESTILOS}>
        <div className="space-y-4">
          <SelectField
            label="Fuente"
            value={estilos.fuente || ''}
            onChange={(v) => handleEstilosChange('fuente', v || null)}
            options={FUENTE_OPTIONS}
          />

          <SelectField
            label="Tamaño"
            value={estilos.tamano || ''}
            onChange={(v) => handleEstilosChange('tamano', v || null)}
            options={[{ value: '', label: 'Automático (variante)' }, ...TAMANO_OPTIONS]}
          />

          <SelectField
            label="Peso"
            value={estilos.peso || ''}
            onChange={(v) => handleEstilosChange('peso', v || null)}
            options={[{ value: '', label: 'Automático' }, ...PESO_OPTIONS]}
          />

          <ColorField
            label="Color"
            value={estilos.color || ''}
            onChange={(v) => handleEstilosChange('color', v || null)}
            placeholder="Usar color del tema"
          />

          <AlignmentField
            label="Alineación"
            value={estilos.alineacion || 'center'}
            onChange={(v) => handleEstilosChange('alineacion', v)}
          />

          <RangeField
            label="Espaciado de letras"
            value={estilos.espaciadoLetras || 0}
            onChange={(v) => handleEstilosChange('espaciadoLetras', v)}
            min={-0.1}
            max={0.5}
            step={0.01}
            unit="em"
          />

          <RangeField
            label="Altura de línea"
            value={estilos.espaciadoLineas || 1.5}
            onChange={(v) => handleEstilosChange('espaciadoLineas', v)}
            min={1}
            max={3}
            step={0.1}
          />
        </div>
      </TabContent>
    </div>
  );
}

TextoElementEditor.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      texto: PropTypes.string,
      variante: PropTypes.string,
    }),
    estilos: PropTypes.shape({
      fuente: PropTypes.string,
      tamano: PropTypes.string,
      color: PropTypes.string,
      alineacion: PropTypes.string,
      peso: PropTypes.string,
      espaciadoLetras: PropTypes.number,
      espaciadoLineas: PropTypes.number,
    }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
};

export default memo(TextoElementEditor);
