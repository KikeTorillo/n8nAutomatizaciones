/**
 * ====================================================================
 * SECTION HEADER FIELD
 * ====================================================================
 *
 * Campo reutilizable para título y subtítulo de sección.
 * Incluye botón de generación AI integrado.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { Input } from '@/components/ui';
import { AIGenerateButton } from '../../AIGenerator';

/**
 * Campo de título de sección con AI
 *
 * @param {Object} props
 * @param {string} props.label - Label del campo
 * @param {string} props.value - Valor actual
 * @param {Function} props.onChange - Callback al cambiar
 * @param {string} props.tipo - Tipo de bloque (para AI)
 * @param {string} props.industria - Industria (para AI)
 * @param {string} props.placeholder - Placeholder opcional
 * @param {string} props.className - Clases adicionales
 */
export function SectionTitleField({
  label = 'Titulo de seccion',
  value,
  onChange,
  tipo,
  industria = 'default',
  placeholder = 'Titulo de la seccion',
  className = '',
}) {
  return (
    <Input
      label={
        <span className="flex items-center gap-2">
          {label}
          <AIGenerateButton
            tipo={tipo}
            campo="titulo"
            industria={industria}
            onGenerate={onChange}
            size="sm"
          />
        </span>
      }
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${className}`}
    />
  );
}

/**
 * Campo de subtítulo de sección
 *
 * @param {Object} props
 * @param {string} props.label - Label del campo
 * @param {string} props.value - Valor actual
 * @param {Function} props.onChange - Callback al cambiar
 * @param {string} props.placeholder - Placeholder opcional
 * @param {string} props.className - Clases adicionales
 */
export function SectionSubtitleField({
  label = 'Subtitulo (opcional)',
  value,
  onChange,
  placeholder = 'Subtitulo de la seccion',
  className = '',
}) {
  return (
    <Input
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${className}`}
    />
  );
}

/**
 * Componente combinado para header de sección (título + subtítulo)
 *
 * @param {Object} props
 * @param {string} props.titulo - Valor del título
 * @param {string} props.subtitulo - Valor del subtítulo
 * @param {Function} props.onTituloChange - Callback al cambiar título
 * @param {Function} props.onSubtituloChange - Callback al cambiar subtítulo
 * @param {string} props.tipo - Tipo de bloque (para AI)
 * @param {string} props.industria - Industria (para AI)
 * @param {boolean} props.showSubtitulo - Mostrar campo de subtítulo
 */
export function SectionHeaderField({
  titulo,
  subtitulo,
  onTituloChange,
  onSubtituloChange,
  tipo,
  industria = 'default',
  showSubtitulo = true,
  tituloLabel = 'Titulo de seccion',
  subtituloLabel = 'Subtitulo (opcional)',
}) {
  return (
    <div className="space-y-4">
      <SectionTitleField
        label={tituloLabel}
        value={titulo}
        onChange={onTituloChange}
        tipo={tipo}
        industria={industria}
      />
      {showSubtitulo && (
        <SectionSubtitleField
          label={subtituloLabel}
          value={subtitulo}
          onChange={onSubtituloChange}
        />
      )}
    </div>
  );
}

export default SectionHeaderField;
