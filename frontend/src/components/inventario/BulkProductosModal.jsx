import { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useBulkCrearProductos } from '@/hooks/useProductos';
import { useToast } from '@/hooks/useToast';

/**
 * Template CSV para descarga
 */
const CSV_TEMPLATE = `nombre,descripcion,sku,categoria_id,proveedor_id,precio_compra,precio_venta,stock_actual,stock_minimo,stock_maximo
"Champú Premium 500ml","Champú hidratante con aceite de argán","CHAMP-500",1,1,50.00,120.00,100,10,200
"Tinte Castaño Claro","Tinte permanente tono 6.0","TINTE-60",2,1,80.00,180.00,50,5,100
"Mascarilla Reparadora","Tratamiento intensivo para cabello dañado","MASC-001",1,2,35.00,90.00,75,15,150`;

/**
 * Modal para carga masiva de productos
 */
function BulkProductosModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [productosTexto, setProductosTexto] = useState('');
  const [erroresValidacion, setErroresValidacion] = useState([]);

  // Mutation
  const bulkMutation = useBulkCrearProductos();

  // Descargar template CSV
  const handleDescargarTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_productos.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Template descargado correctamente', 'success');
  };

  // Parsear CSV a JSON
  const parsearCSV = (csvText) => {
    try {
      const lineas = csvText.trim().split('\n');
      if (lineas.length < 2) {
        throw new Error('El CSV debe tener al menos una línea de encabezados y una de datos');
      }

      // Extraer encabezados
      const encabezados = lineas[0].split(',').map((h) => h.trim().replace(/"/g, ''));

      // Validar encabezados obligatorios
      const obligatorios = ['nombre', 'precio_venta'];
      const faltantes = obligatorios.filter((ob) => !encabezados.includes(ob));
      if (faltantes.length > 0) {
        throw new Error(`Faltan columnas obligatorias: ${faltantes.join(', ')}`);
      }

      // Parsear filas
      const productos = [];
      const errores = [];

      for (let i = 1; i < lineas.length; i++) {
        try {
          const valores = lineas[i]
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/) // Split CSV respetando comillas
            .map((v) => v.trim().replace(/^"|"$/g, '')); // Limpiar comillas

          if (valores.length !== encabezados.length) {
            errores.push({
              linea: i + 1,
              mensaje: `Número incorrecto de columnas (esperado: ${encabezados.length}, recibido: ${valores.length})`,
            });
            continue;
          }

          const producto = {};
          encabezados.forEach((key, index) => {
            let valor = valores[index];

            // Convertir tipos de datos
            if (['categoria_id', 'proveedor_id', 'stock_actual', 'stock_minimo', 'stock_maximo', 'cantidad_mayoreo', 'dias_vida_util'].includes(key)) {
              valor = valor ? parseInt(valor) : undefined;
            } else if (['precio_compra', 'precio_venta', 'precio_mayoreo'].includes(key)) {
              valor = valor ? parseFloat(valor) : undefined;
            } else if (['alerta_stock_minimo', 'es_perecedero', 'permite_venta', 'permite_uso_servicio', 'activo'].includes(key)) {
              valor = valor === 'true' || valor === '1' || valor === 'TRUE';
            }

            if (valor !== '' && valor !== undefined) {
              producto[key] = valor;
            }
          });

          // Validar campos obligatorios
          if (!producto.nombre || !producto.precio_venta) {
            errores.push({
              linea: i + 1,
              mensaje: 'Faltan campos obligatorios (nombre, precio_venta)',
            });
            continue;
          }

          productos.push(producto);
        } catch (error) {
          errores.push({
            linea: i + 1,
            mensaje: error.message,
          });
        }
      }

      setErroresValidacion(errores);
      return productos;
    } catch (error) {
      setErroresValidacion([{ linea: 0, mensaje: error.message }]);
      return [];
    }
  };

  // Submit handler
  const handleSubmit = () => {
    if (!productosTexto.trim()) {
      showToast('Debes pegar el contenido CSV o usar el template', 'error');
      return;
    }

    const productos = parsearCSV(productosTexto);

    if (productos.length === 0) {
      showToast('No se pudieron procesar los productos. Revisa los errores.', 'error');
      return;
    }

    if (productos.length > 50) {
      showToast('Máximo 50 productos por carga', 'error');
      return;
    }

    bulkMutation.mutate(
      { productos },
      {
        onSuccess: (data) => {
          const creados = data.productos_creados?.length || productos.length;
          const errores = data.errores?.length || 0;

          if (errores === 0) {
            showToast(`${creados} productos creados correctamente`, 'success');
            setProductosTexto('');
            setErroresValidacion([]);
            onClose();
          } else {
            showToast(
              `${creados} productos creados, ${errores} con errores`,
              'warning'
            );
            if (data.errores) {
              setErroresValidacion(
                data.errores.map((err, idx) => ({
                  linea: idx + 2,
                  mensaje: err.mensaje || err,
                }))
              );
            }
          }
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al crear productos',
            'error'
          );
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carga Masiva de Productos"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Instrucciones */}
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-primary-900 dark:text-primary-300 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Instrucciones
          </h4>
          <ul className="text-sm text-primary-800 dark:text-primary-300 space-y-1 list-disc list-inside">
            <li>Descarga el template CSV y complétalo con tus productos</li>
            <li>Máximo 50 productos por carga</li>
            <li>Campos obligatorios: <strong>nombre</strong>, <strong>precio_venta</strong></li>
            <li>IDs de categoría y proveedor deben existir previamente</li>
            <li>Pega el contenido CSV en el campo de texto</li>
          </ul>
        </div>

        {/* Botón Descargar Template */}
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={handleDescargarTemplate}
            icon={Download}
          >
            Descargar Template CSV
          </Button>
        </div>

        {/* Área de Texto para CSV */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contenido CSV
          </label>
          <textarea
            value={productosTexto}
            onChange={(e) => setProductosTexto(e.target.value)}
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Pega aquí el contenido de tu CSV..."
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Formato: nombre,descripcion,sku,categoria_id,proveedor_id,precio_compra,precio_venta,stock_actual,stock_minimo,stock_maximo
          </p>
        </div>

        {/* Errores de Validación */}
        {erroresValidacion.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-3 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Errores de Validación ({erroresValidacion.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {erroresValidacion.map((error, index) => (
                <div
                  key={index}
                  className="text-sm text-red-700 dark:text-red-300 flex items-start"
                >
                  <span className="font-medium mr-2">
                    Línea {error.linea}:
                  </span>
                  <span>{error.mensaje}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setProductosTexto('');
              setErroresValidacion([]);
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={bulkMutation.isPending}
            icon={Upload}
            disabled={!productosTexto.trim()}
          >
            Cargar Productos
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default BulkProductosModal;
