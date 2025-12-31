import { useState, useEffect } from 'react';
import { Package, Check, AlertTriangle, Hash, Plus, X, ChevronDown, ChevronUp, ScanLine, Info } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useOrdenCompra, useRecibirMercancia } from '@/hooks/useOrdenesCompra';
import { useVerificarExistencia } from '@/hooks/useNumerosSerie';
import { useResumenCostos } from '@/hooks/useLandedCosts';
import BarcodeScanner from '@/components/common/BarcodeScanner';

/**
 * Modal para registrar recepción de mercancía
 * Permite registrar cantidades recibidas parciales o totales
 */
export default function RecibirMercanciaModal({ isOpen, onClose, orden }) {
  const { showToast } = useToast();

  // Query detalle de la orden
  const { data: ordenDetalle, isLoading } = useOrdenCompra(orden?.id);

  // Estado de recepciones
  const [recepciones, setRecepciones] = useState([]);

  // Mutation
  const recibirMutation = useRecibirMercancia();

  // Obtener resumen de landed costs para advertencia
  const { data: resumenCostos } = useResumenCostos(orden?.id);
  const costosPendientes = resumenCostos?.totales?.total_pendiente || 0;

  // Estado para expandir sección de números de serie
  const [expandedNS, setExpandedNS] = useState({});

  // Estado del scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState('producto'); // 'producto' o 'ns'
  const [scanTargetItem, setScanTargetItem] = useState(null); // Para NS específico

  // Inicializar recepciones cuando se carga la orden
  useEffect(() => {
    if (ordenDetalle?.items) {
      const recepcionesIniciales = ordenDetalle.items
        .filter(item => (item.cantidad_ordenada - (item.cantidad_recibida || 0)) > 0)
        .map(item => ({
          item_id: item.id,
          producto_id: item.producto_id,
          producto_nombre: item.producto_nombre,
          producto_sku: item.producto_sku,
          requiere_numero_serie: item.requiere_numero_serie || false,
          cantidad_ordenada: item.cantidad_ordenada,
          cantidad_recibida: item.cantidad_recibida || 0,
          cantidad_pendiente: item.cantidad_ordenada - (item.cantidad_recibida || 0),
          cantidad: 0, // Cantidad a recibir ahora
          precio_unitario_real: item.precio_unitario,
          fecha_vencimiento: '',
          lote: '',
          notas: '',
          numeros_serie: [], // Array de NS para productos que lo requieren
        }));
      setRecepciones(recepcionesIniciales);
    }
  }, [ordenDetalle]);

  const handleCantidadChange = (index, cantidad) => {
    const nuevasRecepciones = [...recepciones];
    const cantidadNum = parseInt(cantidad) || 0;
    const maxPermitido = nuevasRecepciones[index].cantidad_pendiente;
    nuevasRecepciones[index].cantidad = Math.min(Math.max(0, cantidadNum), maxPermitido);

    // Si requiere NS, ajustar el array de números de serie
    if (nuevasRecepciones[index].requiere_numero_serie) {
      const currentNS = nuevasRecepciones[index].numeros_serie;
      const targetCount = nuevasRecepciones[index].cantidad;

      if (currentNS.length < targetCount) {
        // Agregar entradas vacías
        for (let i = currentNS.length; i < targetCount; i++) {
          currentNS.push({ numero_serie: '', lote: '', fecha_vencimiento: '' });
        }
      } else if (currentNS.length > targetCount) {
        // Remover excedentes
        nuevasRecepciones[index].numeros_serie = currentNS.slice(0, targetCount);
      }
    }

    setRecepciones(nuevasRecepciones);
  };

  // Manejo de números de serie
  const handleNumeroSerieChange = (itemIndex, nsIndex, field, value) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[itemIndex].numeros_serie[nsIndex][field] = value;
    setRecepciones(nuevasRecepciones);
  };

  const toggleExpandNS = (itemId) => {
    setExpandedNS(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handlePrecioChange = (index, precio) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].precio_unitario_real = parseFloat(precio) || 0;
    setRecepciones(nuevasRecepciones);
  };

  const handleLoteChange = (index, lote) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].lote = lote;
    setRecepciones(nuevasRecepciones);
  };

  const handleFechaVencimientoChange = (index, fecha) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].fecha_vencimiento = fecha;
    setRecepciones(nuevasRecepciones);
  };

  const handleNotasChange = (index, notas) => {
    const nuevasRecepciones = [...recepciones];
    nuevasRecepciones[index].notas = notas;
    setRecepciones(nuevasRecepciones);
  };

  const handleRecibirTodo = () => {
    const nuevasRecepciones = recepciones.map(r => {
      const nuevaRecepcion = {
        ...r,
        cantidad: r.cantidad_pendiente,
      };
      // Si requiere NS, crear entradas vacías para cada unidad
      if (r.requiere_numero_serie) {
        nuevaRecepcion.numeros_serie = Array.from(
          { length: r.cantidad_pendiente },
          () => ({ numero_serie: '', lote: '', fecha_vencimiento: '' })
        );
      }
      return nuevaRecepcion;
    });
    setRecepciones(nuevasRecepciones);
  };

  // Manejo de escaneo - recibe (code, scanData) donde scanData incluye gs1 parseado
  const handleScan = (code, scanData) => {
    const { gs1 } = scanData || {};

    if (scanMode === 'producto') {
      // Buscar producto por SKU o código de barras escaneado
      const itemIndex = recepciones.findIndex(
        r => r.producto_sku?.toLowerCase() === code.toLowerCase() ||
             r.producto_codigo_barras === code
      );

      if (itemIndex >= 0) {
        const item = recepciones[itemIndex];
        if (item.cantidad < item.cantidad_pendiente) {
          // Incrementar cantidad en 1
          handleCantidadChange(itemIndex, item.cantidad + 1);

          // Si es GS1 y tiene datos extra, aplicarlos
          if (gs1) {
            // Aplicar lote si viene en el código
            if (gs1.lot && !item.lote) {
              handleLoteChange(itemIndex, gs1.lot);
            }
            // Aplicar fecha de vencimiento si viene en el código
            if (gs1.expirationDateFormatted && !item.fecha_vencimiento) {
              handleFechaVencimientoChange(itemIndex, gs1.expirationDateFormatted);
            }

            // Mostrar mensaje informativo con datos detectados
            const extras = [];
            if (gs1.lot) extras.push(`Lote: ${gs1.lot}`);
            if (gs1.expirationDateFormatted) extras.push(`Venc: ${gs1.expirationDateFormatted}`);
            if (gs1.serial) extras.push(`NS: ${gs1.serial}`);

            if (extras.length > 0) {
              showToast(`+1 ${item.producto_nombre} (${extras.join(', ')})`, 'success');
            } else {
              showToast(`+1 ${item.producto_nombre}`, 'success');
            }

            // Si producto requiere NS y el GS1 trae serial, auto-llenarlo
            if (item.requiere_numero_serie && gs1.serial) {
              const nuevasRecepciones = [...recepciones];
              const nsArray = nuevasRecepciones[itemIndex].numeros_serie;
              // Buscar el NS que se acaba de agregar (el último que esté vacío después del incremento)
              const nsIndex = nsArray.findIndex(ns => !ns.numero_serie?.trim());
              if (nsIndex >= 0) {
                nsArray[nsIndex] = {
                  numero_serie: gs1.serial,
                  lote: gs1.lot || '',
                  fecha_vencimiento: gs1.expirationDateFormatted || ''
                };
                setRecepciones(nuevasRecepciones);
              }
            }
          } else {
            showToast(`+1 ${item.producto_nombre}`, 'success');
          }
        } else {
          showToast(`${item.producto_nombre} ya tiene la cantidad máxima`, 'warning');
        }
      } else {
        showToast(`Producto con código "${code}" no está en esta orden`, 'error');
      }
    } else if (scanMode === 'ns' && scanTargetItem !== null) {
      // Agregar número de serie escaneado
      const item = recepciones[scanTargetItem];
      if (item && item.requiere_numero_serie) {
        // Buscar primer NS vacío
        const nsIndex = item.numeros_serie.findIndex(ns => !ns.numero_serie?.trim());
        if (nsIndex >= 0) {
          // Determinar número de serie a usar
          const numeroSerie = gs1?.serial || code;

          // Verificar que no esté duplicado
          const yaExiste = item.numeros_serie.some(ns => ns.numero_serie === numeroSerie);
          if (yaExiste) {
            showToast(`NS "${numeroSerie}" ya fue escaneado`, 'warning');
          } else {
            // Actualizar con todos los datos disponibles del GS1
            const nuevasRecepciones = [...recepciones];
            nuevasRecepciones[scanTargetItem].numeros_serie[nsIndex] = {
              numero_serie: numeroSerie,
              lote: gs1?.lot || item.lote || '',
              fecha_vencimiento: gs1?.expirationDateFormatted || item.fecha_vencimiento || ''
            };
            setRecepciones(nuevasRecepciones);

            // Mensaje con datos detectados
            const extras = [];
            if (gs1?.lot) extras.push(`Lote: ${gs1.lot}`);
            if (gs1?.expirationDateFormatted) extras.push(`Venc: ${gs1.expirationDateFormatted}`);
            const extraMsg = extras.length > 0 ? ` (${extras.join(', ')})` : '';

            showToast(`NS ${nsIndex + 1}/${item.cantidad}: ${numeroSerie}${extraMsg}`, 'success');

            // Si completó todos los NS, cerrar scanner
            const nsCompletos = item.numeros_serie.filter(ns => ns.numero_serie?.trim()).length + 1;
            if (nsCompletos >= item.cantidad) {
              showToast(`Todos los NS de ${item.producto_nombre} escaneados`, 'success');
              setShowScanner(false);
              setScanTargetItem(null);
            }
          }
        } else {
          showToast('Ya se escanearon todos los números de serie', 'info');
        }
      }
    }
  };

  const openScannerForProduct = () => {
    setScanMode('producto');
    setScanTargetItem(null);
    setShowScanner(true);
  };

  const openScannerForNS = (itemIndex) => {
    setScanMode('ns');
    setScanTargetItem(itemIndex);
    setExpandedNS(prev => ({ ...prev, [recepciones[itemIndex].item_id]: true }));
    setShowScanner(true);
  };

  const handleSubmit = () => {
    // Validar números de serie para productos que los requieren
    const itemsConNSIncompletos = recepciones.filter(r =>
      r.cantidad > 0 &&
      r.requiere_numero_serie &&
      r.numeros_serie.some(ns => !ns.numero_serie?.trim())
    );

    if (itemsConNSIncompletos.length > 0) {
      showToast(
        `Faltan números de serie para: ${itemsConNSIncompletos.map(i => i.producto_nombre).join(', ')}`,
        'warning'
      );
      return;
    }

    // Validar números de serie duplicados
    const todosNS = recepciones
      .filter(r => r.requiere_numero_serie && r.cantidad > 0)
      .flatMap(r => r.numeros_serie.map(ns => ({ producto_id: r.producto_id, ns: ns.numero_serie?.trim() })));

    const duplicados = todosNS.filter((item, idx) =>
      todosNS.findIndex(x => x.producto_id === item.producto_id && x.ns === item.ns) !== idx
    );

    if (duplicados.length > 0) {
      showToast('Hay números de serie duplicados', 'error');
      return;
    }

    const recepcionesAEnviar = recepciones
      .filter(r => r.cantidad > 0)
      .map(r => ({
        item_id: r.item_id,
        producto_id: r.producto_id,
        cantidad: r.cantidad,
        precio_unitario_real: r.precio_unitario_real || undefined,
        fecha_vencimiento: r.fecha_vencimiento || undefined,
        lote: r.lote?.trim() || undefined,
        notas: r.notas?.trim() || undefined,
        numeros_serie: r.requiere_numero_serie ? r.numeros_serie.map(ns => ({
          numero_serie: ns.numero_serie?.trim(),
          lote: ns.lote?.trim() || r.lote?.trim() || undefined,
          fecha_vencimiento: ns.fecha_vencimiento || r.fecha_vencimiento || undefined,
        })) : undefined,
      }));

    if (recepcionesAEnviar.length === 0) {
      showToast('Indica al menos una cantidad a recibir', 'warning');
      return;
    }

    recibirMutation.mutate(
      { ordenId: orden.id, recepciones: recepcionesAEnviar },
      {
        onSuccess: () => {
          showToast('Mercancía recibida correctamente', 'success');
          onClose();
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al registrar la recepción',
            'error'
          );
        },
      }
    );
  };

  const totalARecibir = recepciones.reduce((sum, r) => sum + r.cantidad, 0);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Recibir Mercancía - ${orden?.folio || ''}`}
      subtitle="Registra las cantidades recibidas de cada producto"
    >
      {isLoading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          Cargando items de la orden...
        </div>
      ) : recepciones.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <Check className="h-16 w-16 mx-auto mb-4 text-green-500 dark:text-green-400" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Todos los productos han sido recibidos</p>
          <p className="text-sm mt-1">No hay items pendientes de recepción</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Información */}
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-300">Registro de Recepción</p>
                <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                  Indica la cantidad recibida para cada producto. El inventario se actualizará automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Advertencia de landed costs pendientes */}
          {costosPendientes > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Costos adicionales pendientes: ${costosPendientes.toLocaleString('es-MX')}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Se distribuirán automáticamente al confirmar la recepción.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción rápida */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={openScannerForProduct}
              icon={ScanLine}
            >
              Escanear Productos
            </Button>
            <Button variant="outline" size="sm" onClick={handleRecibirTodo}>
              Marcar todo como recibido
            </Button>
          </div>

          {/* Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="w-full max-w-lg">
                <BarcodeScanner
                  onScan={handleScan}
                  onClose={() => {
                    setShowScanner(false);
                    setScanTargetItem(null);
                  }}
                  title={scanMode === 'producto' ? 'Escanear Producto' : 'Escanear Número de Serie'}
                  subtitle={scanMode === 'producto'
                    ? 'Escanea el código de barras del producto'
                    : `Escaneando NS para: ${recepciones[scanTargetItem]?.producto_nombre || ''}`
                  }
                  formats={scanMode === 'producto' ? 'PRODUCTOS' : 'INVENTARIO'}
                />
              </div>
            </div>
          )}

          {/* Tabla de items */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ordenado
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ya Recibido
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Pendiente
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Recibir Ahora
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Precio Real
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Lote
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recepciones.map((item, index) => (
                  <tr key={item.item_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.producto_nombre}</div>
                        {item.requiere_numero_serie && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" title="Requiere número de serie">
                            <Hash size={10} className="mr-0.5" />NS
                          </span>
                        )}
                      </div>
                      {item.producto_sku && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.producto_sku}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">
                      {item.cantidad_ordenada}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400">
                      {item.cantidad_recibida}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-orange-600 dark:text-orange-400 font-medium">
                      {item.cantidad_pendiente}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={item.cantidad_pendiente}
                        value={item.cantidad}
                        onChange={(e) => handleCantidadChange(index, e.target.value)}
                        className="w-20 text-center rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precio_unitario_real}
                        onChange={(e) => handlePrecioChange(index, e.target.value)}
                        className="w-24 text-right rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.lote}
                        onChange={(e) => handleLoteChange(index, e.target.value)}
                        className="w-24 text-center rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Opcional"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sección de números de serie */}
          {recepciones.some(r => r.cantidad > 0 && r.requiere_numero_serie) && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                <Hash size={16} />
                Números de Serie Requeridos
              </h4>
              <div className="space-y-4">
                {recepciones
                  .filter(r => r.cantidad > 0 && r.requiere_numero_serie)
                  .map((item) => {
                    const originalIndex = recepciones.findIndex(r => r.item_id === item.item_id);
                    const isExpanded = expandedNS[item.item_id];
                    const nsCompletos = item.numeros_serie.filter(ns => ns.numero_serie?.trim()).length;
                    const nsTotal = item.cantidad;

                    return (
                      <div key={item.item_id} className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleExpandNS(item.item_id)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{item.producto_nombre}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              nsCompletos === nsTotal
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400'
                            }`}>
                              {nsCompletos}/{nsTotal} NS
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                            {/* Botón escanear NS */}
                            {nsCompletos < nsTotal && (
                              <button
                                type="button"
                                onClick={() => openScannerForNS(originalIndex)}
                                className="mt-3 mb-2 w-full py-2 px-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                              >
                                <ScanLine size={16} />
                                Escanear Números de Serie ({nsTotal - nsCompletos} pendientes)
                              </button>
                            )}
                            <div className="mt-3 space-y-2">
                              {item.numeros_serie.map((ns, nsIndex) => (
                                <div key={nsIndex} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 w-6">{nsIndex + 1}.</span>
                                  <input
                                    type="text"
                                    value={ns.numero_serie}
                                    onChange={(e) => handleNumeroSerieChange(originalIndex, nsIndex, 'numero_serie', e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                    placeholder="Número de serie *"
                                  />
                                  <input
                                    type="text"
                                    value={ns.lote}
                                    onChange={(e) => handleNumeroSerieChange(originalIndex, nsIndex, 'lote', e.target.value)}
                                    className="w-24 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                    placeholder="Lote"
                                  />
                                  <input
                                    type="date"
                                    value={ns.fecha_vencimiento}
                                    onChange={(e) => handleNumeroSerieChange(originalIndex, nsIndex, 'fecha_vencimiento', e.target.value)}
                                    className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              * El número de serie es obligatorio. Lote y fecha de vencimiento son opcionales.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Campos adicionales por item (expandible) */}
          {recepciones.some(r => r.cantidad > 0) && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Información Adicional (opcional)
              </h4>
              <div className="space-y-3">
                {recepciones
                  .filter(r => r.cantidad > 0)
                  .map((item, idx) => {
                    const originalIndex = recepciones.findIndex(r => r.item_id === item.item_id);
                    return (
                      <div key={item.item_id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {item.producto_nombre} ({item.cantidad} unidades)
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Fecha de Vencimiento
                            </label>
                            <input
                              type="date"
                              value={item.fecha_vencimiento}
                              onChange={(e) => handleFechaVencimientoChange(originalIndex, e.target.value)}
                              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Notas
                            </label>
                            <input
                              type="text"
                              value={item.notas}
                              onChange={(e) => handleNotasChange(originalIndex, e.target.value)}
                              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                              placeholder="Notas sobre este lote..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Resumen y botones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total a recibir: <span className="font-bold text-primary-600 dark:text-primary-400">{totalARecibir}</span> unidades
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={recibirMutation.isPending}
                disabled={totalARecibir === 0}
                icon={Package}
              >
                Confirmar Recepción
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
