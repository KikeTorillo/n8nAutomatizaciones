/**
 * ====================================================================
 * COMPONENTE - SELECTOR DE ETIQUETAS
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * Selector múltiple para asignar etiquetas a clientes
 * Usa el componente MultiSelect del proyecto
 *
 * ====================================================================
 */

import { useMemo } from 'react';
import { Tag } from 'lucide-react';
import { useEtiquetas } from '@/hooks/personas';
import { MultiSelect } from '@/components/ui';
import EtiquetasBadges from './EtiquetasBadges';

/**
 * Selector múltiple de etiquetas
 */
export default function EtiquetasSelector({
  value = [],
  onChange,
  placeholder = 'Seleccionar etiquetas...',
  disabled = false,
  maxTags = 10,
  className = '',
  showBadges = true,
}) {
  const { data, isLoading } = useEtiquetas();
  const etiquetas = data?.etiquetas ?? [];

  // Convertir etiquetas a formato de opciones para MultiSelect
  const options = useMemo(() => {
    return etiquetas.map((etiqueta) => ({
      value: etiqueta.id,
      label: etiqueta.nombre,
      // Datos extra para badges personalizados
      color: etiqueta.color,
      total_clientes: etiqueta.total_clientes,
    }));
  }, [etiquetas]);

  // Etiquetas actualmente seleccionadas (objetos completos)
  const selectedEtiquetas = useMemo(() => {
    return etiquetas.filter((e) => value.includes(e.id));
  }, [etiquetas, value]);

  // Handler para cambios
  const handleChange = (newValue) => {
    onChange(newValue);
  };

  // Handler para remover una etiqueta desde los badges
  const handleRemove = (etiqueta) => {
    onChange(value.filter((id) => id !== etiqueta.id));
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={className}>
      <MultiSelect
        options={options}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        max={maxTags}
      />

      {/* Badges con colores personalizados (opcional) */}
      {showBadges && selectedEtiquetas.length > 0 && (
        <div className="mt-2">
          <EtiquetasBadges
            etiquetas={selectedEtiquetas}
            onRemove={handleRemove}
            size="sm"
          />
        </div>
      )}

      {/* Contador */}
      {value.length > 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {value.length} de {maxTags} etiquetas seleccionadas
        </p>
      )}
    </div>
  );
}

/**
 * Selector simple (solo lectura / visualización)
 */
export function EtiquetasDisplay({ etiquetas = [], className = '' }) {
  if (!etiquetas || etiquetas.length === 0) {
    return (
      <span className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <Tag className="h-3.5 w-3.5" />
        Sin etiquetas
      </span>
    );
  }

  return (
    <EtiquetasBadges
      etiquetas={etiquetas}
      size="sm"
      className={className}
    />
  );
}
