import { useRef } from 'react';
import { Package, Printer, X, Box, Scale, Ruler, Barcode } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useEtiquetaPaquete } from '@/hooks/usePaquetes';

/**
 * Modal para visualizar e imprimir etiqueta de paquete
 * @param {boolean} isOpen - Si el modal esta abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {number} paqueteId - ID del paquete
 */
function PaqueteEtiqueta({ isOpen, onClose, paqueteId }) {
  const printRef = useRef(null);
  const { data: etiqueta, isLoading } = useEtiquetaPaquete(isOpen ? paqueteId : null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta ${etiqueta?.folio}</title>
          <style>
            @page { size: 4in 6in; margin: 0; }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 16px;
            }
            .label-container {
              border: 2px solid #000;
              padding: 16px;
              max-width: 360px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .folio {
              font-size: 24px;
              font-weight: bold;
            }
            .barcode {
              font-family: 'Libre Barcode 128', monospace;
              font-size: 48px;
              text-align: center;
              margin: 16px 0;
            }
            .barcode-text {
              font-family: monospace;
              font-size: 12px;
              text-align: center;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 14px;
            }
            .info-label {
              font-weight: bold;
            }
            .items-section {
              margin-top: 16px;
              border-top: 1px solid #ccc;
              padding-top: 12px;
            }
            .item {
              font-size: 12px;
              padding: 4px 0;
              border-bottom: 1px dotted #ccc;
            }
            .footer {
              margin-top: 16px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Etiqueta de Paquete" size="md">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : etiqueta ? (
        <div className="space-y-4">
          {/* Vista previa de etiqueta */}
          <div
            ref={printRef}
            className="bg-white p-4 border-2 border-gray-900 rounded-lg max-w-sm mx-auto"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-gray-900 pb-3 mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package className="w-5 h-5" />
                <span className="text-xl font-bold">{etiqueta.folio}</span>
              </div>
              {etiqueta.carrier && (
                <div className="text-sm text-gray-600">{etiqueta.carrier}</div>
              )}
            </div>

            {/* Codigo de barras */}
            <div className="text-center my-4">
              <div className="bg-gray-100 p-2 rounded">
                <Barcode className="w-full h-12" />
              </div>
              <div className="font-mono text-xs mt-1">{etiqueta.codigo_barras}</div>
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm">
              {etiqueta.tracking && (
                <div className="flex justify-between">
                  <span className="font-semibold">Tracking:</span>
                  <span className="font-mono">{etiqueta.tracking}</span>
                </div>
              )}
              {etiqueta.operacion_folio && (
                <div className="flex justify-between">
                  <span className="font-semibold">Operacion:</span>
                  <span>{etiqueta.operacion_folio}</span>
                </div>
              )}
              {etiqueta.origen_folio && (
                <div className="flex justify-between">
                  <span className="font-semibold">Origen:</span>
                  <span>{etiqueta.origen_folio}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold">Items:</span>
                <span>{etiqueta.total_items} ({etiqueta.total_unidades} unidades)</span>
              </div>
              {etiqueta.peso_kg && (
                <div className="flex justify-between">
                  <span className="font-semibold">Peso:</span>
                  <span>{etiqueta.peso_kg} kg</span>
                </div>
              )}
              {etiqueta.dimensiones && (
                <div className="flex justify-between">
                  <span className="font-semibold">Dimensiones:</span>
                  <span>{etiqueta.dimensiones}</span>
                </div>
              )}
            </div>

            {/* Items */}
            {etiqueta.items && etiqueta.items.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-300">
                <div className="text-xs font-semibold mb-2">CONTENIDO:</div>
                <div className="space-y-1">
                  {etiqueta.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="text-xs flex justify-between py-1 border-b border-dotted border-gray-200">
                      <span className="truncate flex-1">
                        {item.producto}
                        {item.variante && ` (${item.variante})`}
                      </span>
                      <span className="ml-2 font-semibold">x{item.cantidad}</span>
                    </div>
                  ))}
                  {etiqueta.items.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      ... y {etiqueta.items.length - 5} mas
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 text-center text-xs text-gray-500">
              Fecha: {new Date(etiqueta.fecha_creacion).toLocaleDateString()}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No se pudo cargar la etiqueta
        </div>
      )}
    </Modal>
  );
}

export default PaqueteEtiqueta;
