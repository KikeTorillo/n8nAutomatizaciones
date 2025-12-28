import { useState, useMemo } from 'react';
import { X, Palette, Ruler, Plus, Loader2, Sparkles } from 'lucide-react';
import { useAtributos, useCrearAtributosDefecto } from '@/hooks/useAtributos';
import { useGenerarVariantes } from '@/hooks/useVariantes';
import { toast } from 'sonner';

/**
 * Modal para generar variantes de producto automaticamente
 * Permite seleccionar atributos y valores para generar combinaciones
 */
export default function GenerarVariantesModal({
  isOpen,
  onClose,
  productoId,
  productoNombre,
  productoSku
}) {
  const [seleccion, setSeleccion] = useState({});
  const [opciones, setOpciones] = useState({
    sku_base: productoSku || '',
    precio_venta: '',
    precio_compra: ''
  });

  const { data: atributos = [], isLoading } = useAtributos();
  const crearDefecto = useCrearAtributosDefecto();
  const generarVariantes = useGenerarVariantes();

  // Calcular total de variantes que se generaran
  const totalVariantes = useMemo(() => {
    const valoresSeleccionados = Object.values(seleccion).filter(v => v.length > 0);
    if (valoresSeleccionados.length === 0) return 0;
    return valoresSeleccionados.reduce((acc, valores) => acc * valores.length, 1);
  }, [seleccion]);

  // Toggle valor seleccionado
  const toggleValor = (atributoId, valorId) => {
    setSeleccion(prev => {
      const valores = prev[atributoId] || [];
      if (valores.includes(valorId)) {
        return { ...prev, [atributoId]: valores.filter(v => v !== valorId) };
      }
      return { ...prev, [atributoId]: [...valores, valorId] };
    });
  };

  // Verificar si un valor esta seleccionado
  const isValorSelected = (atributoId, valorId) => {
    return (seleccion[atributoId] || []).includes(valorId);
  };

  // Crear atributos por defecto
  const handleCrearDefecto = async () => {
    try {
      await crearDefecto.mutateAsync();
      toast.success('Atributos creados: Color y Talla');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear atributos');
    }
  };

  // Generar variantes
  const handleGenerar = async () => {
    if (totalVariantes === 0) {
      toast.error('Selecciona al menos un valor de atributo');
      return;
    }

    const atributosData = Object.entries(seleccion)
      .filter(([_, valores]) => valores.length > 0)
      .map(([atributoId, valores]) => ({
        atributo_id: parseInt(atributoId),
        valores
      }));

    try {
      const result = await generarVariantes.mutateAsync({
        productoId,
        atributos: atributosData,
        opciones: {
          sku_base: opciones.sku_base || undefined,
          precio_venta: opciones.precio_venta ? parseFloat(opciones.precio_venta) : undefined,
          precio_compra: opciones.precio_compra ? parseFloat(opciones.precio_compra) : undefined
        }
      });

      toast.success(`Se generaron ${result.total} variantes`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al generar variantes');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generar Variantes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {productoNombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : atributos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Palette className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay atributos configurados
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Crea atributos como Color y Talla para generar variantes
              </p>
              <button
                onClick={handleCrearDefecto}
                disabled={crearDefecto.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {crearDefecto.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Crear Color y Talla
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Atributos */}
              {atributos.map(atributo => (
                <div key={atributo.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {atributo.tipo_visualizacion === 'color_swatches' ? (
                      <Palette className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Ruler className="w-4 h-4 text-gray-500" />
                    )}
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {atributo.nombre}
                    </h3>
                    <span className="text-xs text-gray-500">
                      ({(seleccion[atributo.id] || []).length} seleccionados)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {atributo.valores?.map(valor => (
                      <button
                        key={valor.id}
                        onClick={() => toggleValor(atributo.id, valor.id)}
                        className={`
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          border transition-all
                          ${isValorSelected(atributo.id, valor.id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }
                        `}
                      >
                        {valor.color_hex && (
                          <span
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: valor.color_hex }}
                          />
                        )}
                        {valor.valor}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Opciones */}
              <div className="border-t dark:border-gray-700 pt-4 mt-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Opciones de generacion
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SKU Base
                    </label>
                    <input
                      type="text"
                      value={opciones.sku_base}
                      onChange={(e) => setOpciones(prev => ({ ...prev, sku_base: e.target.value }))}
                      placeholder="PROD"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio Venta
                    </label>
                    <input
                      type="number"
                      value={opciones.precio_venta}
                      onChange={(e) => setOpciones(prev => ({ ...prev, precio_venta: e.target.value }))}
                      placeholder="Heredar"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio Compra
                    </label>
                    <input
                      type="number"
                      value={opciones.precio_compra}
                      onChange={(e) => setOpciones(prev => ({ ...prev, precio_compra: e.target.value }))}
                      placeholder="Heredar"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {atributos.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-sm">
              {totalVariantes > 0 ? (
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  Se generaran {totalVariantes} variantes
                </span>
              ) : (
                <span className="text-gray-500">
                  Selecciona valores para generar variantes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerar}
                disabled={totalVariantes === 0 || generarVariantes.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generarVariantes.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generar {totalVariantes > 0 && totalVariantes}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
