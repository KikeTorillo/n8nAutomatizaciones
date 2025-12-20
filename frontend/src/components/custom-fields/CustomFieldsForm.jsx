import { useMemo } from 'react';
import { useCustomFieldsValores, useCustomFieldsDefiniciones } from '@/hooks/useCustomFields';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import MultiSelect from '@/components/ui/MultiSelect';
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Link,
  Hash,
  Type,
  AlignLeft,
  ToggleLeft,
  ChevronDown,
  CheckSquare,
  Paperclip,
  AlertCircle,
} from 'lucide-react';

/**
 * Componente para renderizar campos personalizados en formularios
 *
 * @param {string} entidadTipo - Tipo de entidad (cliente, profesional, etc.)
 * @param {number} entidadId - ID de la entidad (null para nuevas entidades)
 * @param {Object} values - Valores actuales del formulario
 * @param {function} onChange - Callback cuando cambia un valor
 * @param {Object} errors - Errores de validacion por campo
 * @param {boolean} disabled - Si los campos estan deshabilitados
 * @param {string} seccion - Filtrar por seccion especifica (opcional)
 */
function CustomFieldsForm({
  entidadTipo,
  entidadId = null,
  values = {},
  onChange,
  errors = {},
  disabled = false,
  seccion = null,
}) {
  // Obtener definiciones de campos para este tipo de entidad
  const { data: definiciones = [], isLoading: loadingDefiniciones } = useCustomFieldsDefiniciones({
    entidad_tipo: entidadTipo,
    activo: true,
    visible_en_formulario: true,
  });

  // Si hay entidadId, obtener valores existentes
  const { data: valoresExistentes = [] } = useCustomFieldsValores(
    entidadTipo,
    entidadId
  );

  // Filtrar por seccion si se especifica
  const camposFiltrados = useMemo(() => {
    if (!seccion) return definiciones;
    return definiciones.filter(d => d.seccion === seccion);
  }, [definiciones, seccion]);

  // Agrupar campos por seccion
  const camposPorSeccion = useMemo(() => {
    const grupos = {};
    camposFiltrados.forEach(campo => {
      const sec = campo.seccion || 'General';
      if (!grupos[sec]) grupos[sec] = [];
      grupos[sec].push(campo);
    });
    return grupos;
  }, [camposFiltrados]);

  // Obtener valor del campo (de values o de valoresExistentes)
  const getValor = (nombreClave) => {
    if (values[nombreClave] !== undefined) {
      return values[nombreClave];
    }
    const existente = valoresExistentes.find(v => v.nombre_clave === nombreClave);
    return existente?.valor ?? '';
  };

  // Manejar cambio de valor
  const handleChange = (nombreClave, valor) => {
    onChange(nombreClave, valor);
  };

  // Renderizar campo segun tipo
  const renderField = (campo) => {
    const valor = getValor(campo.nombre_clave);
    const error = errors[campo.nombre_clave];
    const commonProps = {
      disabled,
      error: !!error,
    };

    const iconoClases = 'w-4 h-4 text-gray-400';

    switch (campo.tipo_dato) {
      case 'texto':
        return (
          <Input
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            placeholder={campo.placeholder}
            maxLength={campo.longitud_maxima}
            minLength={campo.longitud_minima}
            icon={<Type className={iconoClases} />}
            {...commonProps}
          />
        );

      case 'texto_largo':
        return (
          <Textarea
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            placeholder={campo.placeholder}
            maxLength={campo.longitud_maxima}
            rows={4}
            {...commonProps}
          />
        );

      case 'numero':
        return (
          <Input
            type="number"
            value={valor ?? ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={campo.placeholder}
            min={campo.valor_minimo}
            max={campo.valor_maximo}
            icon={<Hash className={iconoClases} />}
            {...commonProps}
          />
        );

      case 'fecha':
        return (
          <Input
            type="date"
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            icon={<Calendar className={iconoClases} />}
            {...commonProps}
          />
        );

      case 'hora':
        return (
          <Input
            type="time"
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            icon={<Clock className={iconoClases} />}
            {...commonProps}
          />
        );

      case 'booleano':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!valor}
              onChange={(e) => handleChange(campo.nombre_clave, e.target.checked)}
              disabled={disabled}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {campo.placeholder || 'Si'}
            </span>
          </div>
        );

      case 'select':
        const opcionesSelect = campo.opciones || [];
        return (
          <Select
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            {...commonProps}
          >
            <option value="">Seleccionar...</option>
            {opcionesSelect.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        );

      case 'multiselect':
        const opcionesMulti = (campo.opciones || []).map(o => ({
          value: o.value,
          label: o.label,
        }));
        return (
          <MultiSelect
            options={opcionesMulti}
            value={Array.isArray(valor) ? valor : []}
            onChange={(selected) => handleChange(campo.nombre_clave, selected)}
            placeholder={campo.placeholder || 'Seleccionar opciones...'}
            disabled={disabled}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            placeholder={campo.placeholder || 'email@ejemplo.com'}
            icon={<Mail className={iconoClases} />}
            {...commonProps}
          />
        );

      case 'telefono':
        return (
          <Input
            type="tel"
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            placeholder={campo.placeholder || '+52 55 1234 5678'}
            icon={<Phone className={iconoClases} />}
            {...commonProps}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            placeholder={campo.placeholder || 'https://ejemplo.com'}
            icon={<Link className={iconoClases} />}
            {...commonProps}
          />
        );

      case 'archivo':
        // TODO: Integrar con FileUploader cuando esté disponible
        return (
          <div className="flex items-center gap-2 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Paperclip className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              Subir archivo (proximamente)
            </span>
          </div>
        );

      default:
        return (
          <Input
            value={valor || ''}
            onChange={(e) => handleChange(campo.nombre_clave, e.target.value)}
            placeholder={campo.placeholder}
            {...commonProps}
          />
        );
    }
  };

  // Renderizar un campo completo con label y error
  const renderCampoCompleto = (campo) => {
    const error = errors[campo.nombre_clave];
    const anchoClase = getAnchoClase(campo.ancho_columnas);

    return (
      <div key={campo.id} className={`${anchoClase}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {campo.nombre}
          {campo.requerido && <span className="text-red-500 ml-1">*</span>}
        </label>

        {campo.tooltip && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {campo.tooltip}
          </p>
        )}

        {renderField(campo)}

        {error && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  // Loading
  if (loadingDefiniciones) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  // Sin campos definidos
  if (definiciones.length === 0) {
    return null;
  }

  // Renderizar por secciones
  const secciones = Object.keys(camposPorSeccion);

  if (secciones.length === 1 && secciones[0] === 'General') {
    // Sin secciones, renderizar todos juntos
    return (
      <div className="grid grid-cols-12 gap-4">
        {camposPorSeccion['General'].map(renderCampoCompleto)}
      </div>
    );
  }

  // Con secciones, agrupar
  return (
    <div className="space-y-6">
      {secciones.map(seccionNombre => (
        <div key={seccionNombre}>
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            {seccionNombre}
          </h4>
          <div className="grid grid-cols-12 gap-4">
            {camposPorSeccion[seccionNombre].map(renderCampoCompleto)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Convertir ancho de columnas (1-12) a clase Tailwind
 */
function getAnchoClase(ancho) {
  const map = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
  };
  return map[ancho] || 'col-span-12';
}

export default CustomFieldsForm;
