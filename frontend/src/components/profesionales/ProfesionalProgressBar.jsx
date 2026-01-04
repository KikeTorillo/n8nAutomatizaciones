import { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Campos que se consideran para calcular el progreso del perfil
 * Divididos por secciones para mostrar detalles
 */
const CAMPOS_PERFIL = {
  basicos: {
    label: 'Básicos',
    campos: ['nombre_completo', 'email', 'telefono', 'foto_url'],
  },
  trabajo: {
    label: 'Trabajo',
    campos: ['departamento_id', 'puesto_id', 'tipo_contratacion', 'fecha_ingreso'],
  },
  personal: {
    label: 'Personal',
    campos: ['fecha_nacimiento', 'documento_identidad', 'genero', 'direccion'],
  },
  profesional: {
    label: 'Profesional',
    campos: ['anos_experiencia', 'idiomas', 'descripcion'],
  },
};

/**
 * Barra de progreso del perfil del profesional
 * Muestra el porcentaje de campos completados
 */
function ProfesionalProgressBar({ profesional, className = '' }) {
  // Calcular progreso
  const { porcentaje, completados, total, detalles } = useMemo(() => {
    let completados = 0;
    let total = 0;
    const detalles = {};

    Object.entries(CAMPOS_PERFIL).forEach(([seccion, { label, campos }]) => {
      let seccionCompletados = 0;
      campos.forEach((campo) => {
        total++;
        const valor = profesional[campo];
        // Considerar completo si tiene valor y no está vacío
        if (valor !== null && valor !== undefined && valor !== '' &&
            !(Array.isArray(valor) && valor.length === 0)) {
          completados++;
          seccionCompletados++;
        }
      });
      detalles[seccion] = {
        label,
        completados: seccionCompletados,
        total: campos.length,
      };
    });

    return {
      porcentaje: total > 0 ? Math.round((completados / total) * 100) : 0,
      completados,
      total,
      detalles,
    };
  }, [profesional]);

  // Color de la barra según porcentaje
  const getBarColor = () => {
    if (porcentaje >= 80) return 'bg-green-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Color del texto según porcentaje
  const getTextColor = () => {
    if (porcentaje >= 80) return 'text-green-600 dark:text-green-400';
    if (porcentaje >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Icono de completitud */}
      {porcentaje === 100 && (
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
      )}

      {/* Texto */}
      <div className="flex-shrink-0">
        <span className={`text-sm font-medium ${getTextColor()}`}>
          Perfil completo: {porcentaje}%
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          ({completados}/{total} campos)
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-xs">
        <div
          className={`h-full ${getBarColor()} transition-all duration-300`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {/* Detalles por sección (visible en hover en desktop) */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(detalles).map(([key, { label, completados: c, total: t }]) => (
          <span key={key} className={c === t ? 'text-green-600 dark:text-green-400' : ''}>
            {label}: {c}/{t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProfesionalProgressBar;
