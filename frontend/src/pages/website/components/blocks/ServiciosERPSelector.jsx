import { memo, useMemo } from 'react';
import { Loader2, Check, Tag, List, Filter } from 'lucide-react';
import { Select, Badge } from '@/components/ui';

/**
 * ServiciosERPSelector - Selector de servicios desde el ERP
 * Permite filtrar servicios por: todos, categoria, o seleccion manual
 */
function ServiciosERPSelector({
  filtro = {},
  onFiltroChange,
  servicios = [],
  categorias = [],
  isLoading
}) {
  const { modo = 'todos', categorias: categoriasSeleccionadas = [], servicio_ids = [] } = filtro;

  // Opciones de modo
  const modoOptions = [
    { value: 'todos', label: 'Todos los servicios' },
    { value: 'categoria', label: 'Por categoria' },
    { value: 'seleccion', label: 'Seleccion manual' },
  ];

  // Servicios filtrados segun el modo actual (para preview)
  const serviciosFiltrados = useMemo(() => {
    if (modo === 'todos') return servicios;
    if (modo === 'categoria' && categoriasSeleccionadas.length > 0) {
      return servicios.filter(s => categoriasSeleccionadas.includes(s.categoria));
    }
    if (modo === 'seleccion' && servicio_ids.length > 0) {
      return servicios.filter(s => servicio_ids.includes(s.id));
    }
    return servicios;
  }, [modo, servicios, categoriasSeleccionadas, servicio_ids]);

  // Handler para cambio de modo
  const handleModoChange = (nuevoModo) => {
    onFiltroChange({
      modo: nuevoModo,
      // Limpiar filtros al cambiar modo
      categorias: nuevoModo === 'categoria' ? categoriasSeleccionadas : [],
      servicio_ids: nuevoModo === 'seleccion' ? servicio_ids : []
    });
  };

  // Handler para toggle de categoria
  const handleCategoriaToggle = (cat) => {
    const nuevas = categoriasSeleccionadas.includes(cat)
      ? categoriasSeleccionadas.filter(c => c !== cat)
      : [...categoriasSeleccionadas, cat];
    onFiltroChange({ categorias: nuevas });
  };

  // Handler para toggle de servicio
  const handleServicioToggle = (id) => {
    const nuevos = servicio_ids.includes(id)
      ? servicio_ids.filter(i => i !== id)
      : [...servicio_ids, id];
    onFiltroChange({ servicio_ids: nuevos });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Cargando servicios...</span>
      </div>
    );
  }

  if (servicios.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
        <List className="w-10 h-10 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">No hay servicios registrados</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Agrega servicios desde el modulo de Servicios del ERP
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de modo */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Modo de filtrado
        </label>
        <div className="flex gap-2">
          {modoOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleModoChange(opt.value)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                modo === opt.value
                  ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de categorias (solo si modo = categoria) */}
      {modo === 'categoria' && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Categorias ({categoriasSeleccionadas.length} seleccionadas)
          </label>
          {categorias.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No hay categorias definidas en los servicios
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categorias.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoriaToggle(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    categoriasSeleccionadas.includes(cat)
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {cat}
                  {categoriasSeleccionadas.includes(cat) && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selector de servicios (solo si modo = seleccion) */}
      {modo === 'seleccion' && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Servicios ({servicio_ids.length} seleccionados)
          </label>
          <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-600 rounded-lg p-2">
            {servicios.map(servicio => (
              <button
                key={servicio.id}
                type="button"
                onClick={() => handleServicioToggle(servicio.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  servicio_ids.includes(servicio.id)
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                  servicio_ids.includes(servicio.id)
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {servicio_ids.includes(servicio.id) && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {servicio.nombre}
                  </p>
                  {servicio.categoria && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {servicio.categoria}
                    </span>
                  )}
                </div>
                {servicio.precio > 0 && (
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    ${servicio.precio.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview de servicios que se mostraran */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Vista previa
          </span>
          <Badge variant="secondary" size="sm">
            {serviciosFiltrados.length} servicio{serviciosFiltrados.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {serviciosFiltrados.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
            No hay servicios que coincidan con el filtro
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {serviciosFiltrados.slice(0, 6).map(s => (
              <div key={s.id} className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.nombre}</p>
                {s.precio > 0 && (
                  <p className="text-xs text-primary-600 dark:text-primary-400">${s.precio.toLocaleString()}</p>
                )}
              </div>
            ))}
            {serviciosFiltrados.length > 6 && (
              <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  +{serviciosFiltrados.length - 6} mas
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ServiciosERPSelector);
