import { useState, useEffect } from 'react';
import { Hash, Search, Check, AlertTriangle, Package } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useNumerosSerieDisponibles } from '@/hooks/useNumerosSerie';

/**
 * Modal para seleccionar número de serie al vender en POS
 * Se muestra cuando un producto requiere número de serie
 * Dic 2025 - INV-5
 */
export default function SeleccionarNSModal({
  isOpen,
  onClose,
  producto,
  cantidad = 1,
  onSeleccionar
}) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  // Obtener números de serie disponibles del producto
  const { data: numerosSerieData, isLoading } = useNumerosSerieDisponibles(
    producto?.id,
    { enabled: isOpen && !!producto?.id }
  );

  const numerosSerie = numerosSerieData || [];

  // Filtrar por búsqueda
  const numerosSerieFiltrados = numerosSerie.filter(ns =>
    ns.numero_serie.toLowerCase().includes(busqueda.toLowerCase()) ||
    (ns.lote && ns.lote.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Limpiar selección cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSeleccionados([]);
      setBusqueda('');
    }
  }, [isOpen]);

  const handleToggleSeleccion = (ns) => {
    setSeleccionados(prev => {
      const yaSeleccionado = prev.find(s => s.id === ns.id);
      if (yaSeleccionado) {
        return prev.filter(s => s.id !== ns.id);
      } else if (prev.length < cantidad) {
        return [...prev, ns];
      }
      return prev;
    });
  };

  const handleConfirmar = () => {
    if (seleccionados.length === cantidad) {
      onSeleccionar(seleccionados);
      onClose();
    }
  };

  // Formatear fecha de vencimiento
  const formatearFecha = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    const hoy = new Date();
    const diasRestantes = Math.ceil((d - hoy) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return { texto: 'Vencido', clase: 'text-red-600 dark:text-red-400' };
    if (diasRestantes <= 30) return { texto: `Vence en ${diasRestantes} días`, clase: 'text-orange-600 dark:text-orange-400' };
    return { texto: d.toLocaleDateString(), clase: 'text-gray-500 dark:text-gray-400' };
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Seleccionar Número de Serie`}
      subtitle={producto?.nombre}
    >
      <div className="space-y-4">
        {/* Info del producto */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <Hash className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-200">
                {producto?.nombre}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Selecciona {cantidad} número{cantidad > 1 ? 's' : ''} de serie
              </p>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número de serie o lote..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Contador de selección */}
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {numerosSerieFiltrados.length} disponible{numerosSerieFiltrados.length !== 1 ? 's' : ''}
          </span>
          <span className={`text-sm font-medium ${
            seleccionados.length === cantidad
              ? 'text-green-600 dark:text-green-400'
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {seleccionados.length} / {cantidad} seleccionado{cantidad !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Lista de números de serie */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              Cargando números de serie...
            </div>
          ) : numerosSerieFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No hay números de serie disponibles</p>
              {busqueda && (
                <p className="text-sm mt-1">Intenta con otra búsqueda</p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {numerosSerieFiltrados.map((ns) => {
                const estaSeleccionado = seleccionados.find(s => s.id === ns.id);
                const fechaInfo = formatearFecha(ns.fecha_vencimiento);

                return (
                  <li key={ns.id}>
                    <button
                      type="button"
                      onClick={() => handleToggleSeleccion(ns)}
                      disabled={!estaSeleccionado && seleccionados.length >= cantidad}
                      className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                        estaSeleccionado
                          ? 'bg-primary-50 dark:bg-primary-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${
                        !estaSeleccionado && seleccionados.length >= cantidad
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {/* Checkbox visual */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        estaSeleccionado
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {estaSeleccionado && <Check className="h-3 w-3" />}
                      </div>

                      {/* Info del NS */}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-medium text-gray-900 dark:text-gray-100 truncate">
                          {ns.numero_serie}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          {ns.lote && (
                            <span className="text-gray-500 dark:text-gray-400">
                              Lote: {ns.lote}
                            </span>
                          )}
                          {fechaInfo && (
                            <span className={fechaInfo.clase}>
                              {fechaInfo.texto}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Alerta de vencimiento próximo */}
                      {fechaInfo && fechaInfo.texto.includes('Venc') && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmar}
            disabled={seleccionados.length !== cantidad}
            className="flex-1"
            icon={Check}
          >
            Confirmar Selección
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
