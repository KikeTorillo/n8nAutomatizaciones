/**
 * ====================================================================
 * CONDITION EDITOR - Editor visual de condiciones para workflows
 * ====================================================================
 *
 * Permite crear condiciones con estructura:
 * { campo, operador, valor_tipo, valor_fijo, valor_ref }
 *
 * Ejemplo:
 * { campo: "total", operador: ">", valor_tipo: "referencia", valor_ref: "limite_aprobacion" }
 *
 * Enero 2026
 */

import { useState } from 'react';
import {
  Code,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Input, Select } from '@/components/ui';

// Operadores disponibles según tipo de campo
const OPERADORES = {
  numero: [
    { value: '>', label: 'Mayor que (>)' },
    { value: '>=', label: 'Mayor o igual (>=)' },
    { value: '<', label: 'Menor que (<)' },
    { value: '<=', label: 'Menor o igual (<=)' },
    { value: '=', label: 'Igual a (=)' },
    { value: '!=', label: 'Diferente de (!=)' },
  ],
  texto: [
    { value: '=', label: 'Igual a' },
    { value: '!=', label: 'Diferente de' },
    { value: 'contiene', label: 'Contiene' },
    { value: 'empieza_con', label: 'Empieza con' },
    { value: 'termina_con', label: 'Termina con' },
  ],
  fecha: [
    { value: '>', label: 'Posterior a' },
    { value: '>=', label: 'Posterior o igual' },
    { value: '<', label: 'Anterior a' },
    { value: '<=', label: 'Anterior o igual' },
    { value: '=', label: 'Igual a' },
  ],
  booleano: [
    { value: '=', label: 'Es' },
    { value: '!=', label: 'No es' },
  ],
};

// Campos disponibles por tipo de entidad
const CAMPOS_ENTIDAD = {
  orden_compra: [
    { value: 'total', label: 'Total', tipo: 'numero' },
    { value: 'subtotal', label: 'Subtotal', tipo: 'numero' },
    { value: 'cantidad_items', label: 'Cantidad de items', tipo: 'numero' },
    { value: 'proveedor_id', label: 'Proveedor', tipo: 'numero' },
    { value: 'urgente', label: 'Es urgente', tipo: 'booleano' },
    { value: 'notas', label: 'Notas', tipo: 'texto' },
  ],
  venta_pos: [
    { value: 'total', label: 'Total venta', tipo: 'numero' },
    { value: 'descuento_total', label: 'Descuento total', tipo: 'numero' },
    { value: 'cliente_id', label: 'Cliente', tipo: 'numero' },
    { value: 'metodo_pago', label: 'Método de pago', tipo: 'texto' },
  ],
  descuento_pos: [
    { value: 'porcentaje', label: 'Porcentaje descuento', tipo: 'numero' },
    { value: 'monto_fijo', label: 'Monto fijo', tipo: 'numero' },
    { value: 'aplica_global', label: 'Aplica global', tipo: 'booleano' },
  ],
  cita: [
    { value: 'duracion_minutos', label: 'Duración (minutos)', tipo: 'numero' },
    { value: 'precio', label: 'Precio servicio', tipo: 'numero' },
    { value: 'servicio_id', label: 'Servicio', tipo: 'numero' },
    { value: 'cliente_id', label: 'Cliente', tipo: 'numero' },
  ],
  gasto: [
    { value: 'monto', label: 'Monto', tipo: 'numero' },
    { value: 'categoria', label: 'Categoría', tipo: 'texto' },
    { value: 'requiere_factura', label: 'Requiere factura', tipo: 'booleano' },
  ],
  requisicion: [
    { value: 'total_estimado', label: 'Total estimado', tipo: 'numero' },
    { value: 'cantidad_items', label: 'Cantidad items', tipo: 'numero' },
    { value: 'prioridad', label: 'Prioridad', tipo: 'texto' },
  ],
};

// Referencias de sistema disponibles
const REFERENCIAS_SISTEMA = [
  { value: 'limite_aprobacion_usuario', label: 'Límite aprobación del usuario' },
  { value: 'limite_aprobacion_rol', label: 'Límite aprobación del rol' },
  { value: 'monto_maximo_sin_aprobacion', label: 'Monto máximo sin aprobación' },
  { value: 'descuento_maximo_permitido', label: 'Descuento máximo permitido' },
];

/**
 * Editor de una condición individual
 */
function CondicionItem({
  condicion,
  campos,
  onChange,
  onRemove,
  showRemove = true,
}) {
  const campoSeleccionado = campos.find((c) => c.value === condicion.campo);
  const tipoCampo = campoSeleccionado?.tipo || 'numero';
  const operadoresDisponibles = OPERADORES[tipoCampo] || OPERADORES.numero;

  // Iconos por tipo de campo
  const getTipoIcon = () => {
    switch (tipoCampo) {
      case 'numero':
        return Hash;
      case 'texto':
        return Type;
      case 'fecha':
        return Calendar;
      case 'booleano':
        return ToggleLeft;
      default:
        return Code;
    }
  };

  const TipoIcon = getTipoIcon();

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TipoIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            {tipoCampo}
          </span>
        </div>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Campo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Campo
        </label>
        <Select
          value={condicion.campo || ''}
          onChange={(e) => onChange({ ...condicion, campo: e.target.value })}
          options={[
            { value: '', label: 'Selecciona un campo...' },
            ...campos,
          ]}
        />
      </div>

      {/* Operador */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Condición
        </label>
        <Select
          value={condicion.operador || ''}
          onChange={(e) => onChange({ ...condicion, operador: e.target.value })}
          options={[
            { value: '', label: 'Selecciona...' },
            ...operadoresDisponibles,
          ]}
        />
      </div>

      {/* Tipo de valor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Comparar con
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...condicion, valor_tipo: 'fijo', valor_ref: null })}
            className={`
              flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all
              ${condicion.valor_tipo === 'fijo'
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }
            `}
          >
            Valor fijo
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...condicion, valor_tipo: 'referencia', valor_fijo: null })}
            className={`
              flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all
              ${condicion.valor_tipo === 'referencia'
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }
            `}
          >
            Referencia
          </button>
        </div>
      </div>

      {/* Input de valor */}
      {condicion.valor_tipo === 'fijo' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor
          </label>
          {tipoCampo === 'booleano' ? (
            <Select
              value={condicion.valor_fijo ?? ''}
              onChange={(e) =>
                onChange({
                  ...condicion,
                  valor_fijo: e.target.value === 'true',
                })
              }
              options={[
                { value: '', label: 'Selecciona...' },
                { value: 'true', label: 'Verdadero (Sí)' },
                { value: 'false', label: 'Falso (No)' },
              ]}
            />
          ) : tipoCampo === 'numero' ? (
            <Input
              type="number"
              value={condicion.valor_fijo ?? ''}
              onChange={(e) =>
                onChange({
                  ...condicion,
                  valor_fijo: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder="Ingresa un número"
            />
          ) : (
            <Input
              type="text"
              value={condicion.valor_fijo ?? ''}
              onChange={(e) =>
                onChange({ ...condicion, valor_fijo: e.target.value })
              }
              placeholder="Ingresa un valor"
            />
          )}
        </div>
      )}

      {/* Selector de referencia */}
      {condicion.valor_tipo === 'referencia' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Referencia del sistema
          </label>
          <Select
            value={condicion.valor_ref || ''}
            onChange={(e) => onChange({ ...condicion, valor_ref: e.target.value })}
            options={[
              { value: '', label: 'Selecciona una referencia...' },
              ...REFERENCIAS_SISTEMA,
            ]}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            El valor se obtendrá dinámicamente del sistema
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Editor de condiciones múltiples con operadores lógicos
 * @param {Object} value - { condiciones: [...], operador_logico: 'AND'|'OR' }
 * @param {function} onChange - Callback con nuevo valor
 * @param {string} entidadTipo - Tipo de entidad (orden_compra, venta_pos, etc.)
 */
function ConditionEditor({
  value = { condiciones: [], operador_logico: 'AND' },
  onChange,
  entidadTipo = 'orden_compra',
}) {
  const campos = CAMPOS_ENTIDAD[entidadTipo] || CAMPOS_ENTIDAD.orden_compra;

  // Agregar nueva condición
  const handleAgregarCondicion = () => {
    const nuevaCondicion = {
      id: Date.now(),
      campo: '',
      operador: '',
      valor_tipo: 'fijo',
      valor_fijo: null,
      valor_ref: null,
    };
    onChange({
      ...value,
      condiciones: [...(value.condiciones || []), nuevaCondicion],
    });
  };

  // Actualizar condición
  const handleActualizarCondicion = (index, nuevaCondicion) => {
    const nuevasCondiciones = [...value.condiciones];
    nuevasCondiciones[index] = nuevaCondicion;
    onChange({ ...value, condiciones: nuevasCondiciones });
  };

  // Eliminar condición
  const handleEliminarCondicion = (index) => {
    const nuevasCondiciones = value.condiciones.filter((_, i) => i !== index);
    onChange({ ...value, condiciones: nuevasCondiciones });
  };

  // Cambiar operador lógico
  const handleOperadorLogicoChange = (nuevoOperador) => {
    onChange({ ...value, operador_logico: nuevoOperador });
  };

  const condiciones = value.condiciones || [];

  return (
    <div className="space-y-4">
      {/* Operador lógico (si hay más de 1 condición) */}
      {condiciones.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Combinar condiciones con:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleOperadorLogicoChange('AND')}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-all
                ${value.operador_logico === 'AND'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                }
              `}
            >
              Y (todas)
            </button>
            <button
              type="button"
              onClick={() => handleOperadorLogicoChange('OR')}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-all
                ${value.operador_logico === 'OR'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                }
              `}
            >
              O (alguna)
            </button>
          </div>
        </div>
      )}

      {/* Lista de condiciones */}
      <div className="space-y-3">
        {condiciones.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay condiciones configuradas</p>
            <p className="text-xs">Agrega una condición para evaluar</p>
          </div>
        ) : (
          condiciones.map((condicion, index) => (
            <div key={condicion.id || index}>
              <CondicionItem
                condicion={condicion}
                campos={campos}
                onChange={(nueva) => handleActualizarCondicion(index, nueva)}
                onRemove={() => handleEliminarCondicion(index)}
                showRemove={condiciones.length > 1}
              />
              {/* Separador con operador lógico */}
              {index < condiciones.length - 1 && (
                <div className="flex items-center justify-center py-2">
                  <span className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                    {value.operador_logico === 'AND' ? 'Y' : 'O'}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Botón agregar */}
      <button
        type="button"
        onClick={handleAgregarCondicion}
        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Agregar condición</span>
      </button>

      {/* Ayuda */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Las condiciones determinan el flujo del workflow basándose en los datos de la entidad.
      </p>
    </div>
  );
}

// Exportar campos para uso externo
export { CAMPOS_ENTIDAD, OPERADORES, REFERENCIAS_SISTEMA };
export default ConditionEditor;
