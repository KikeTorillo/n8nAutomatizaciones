/**
 * ====================================================================
 * COMPONENTE - MODAL IMPORTAR CLIENTES CSV
 * ====================================================================
 *
 * Modal de 3 pasos para importar clientes desde archivo CSV:
 * 1. Subir archivo
 * 2. Previsualizar y mapear columnas
 * 3. Confirmar importacion
 *
 * ====================================================================
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useImportarClientesCSV } from '@/hooks/personas';

// Campos disponibles para mapeo
const CAMPOS_SISTEMA = [
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'telefono', label: 'Telefono', required: false },
  { key: 'direccion', label: 'Direccion', required: false },
  { key: 'notas', label: 'Notas', required: false },
];

// Pasos del wizard
const PASOS = [
  { id: 1, label: 'Subir archivo' },
  { id: 2, label: 'Mapear columnas' },
  { id: 3, label: 'Confirmar' },
];

export default function ImportarClientesModal({ isOpen, onClose }) {
  const [paso, setPaso] = useState(1);
  const [archivo, setArchivo] = useState(null);
  const [datosCSV, setDatosCSV] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [mapeo, setMapeo] = useState({});
  const [erroresArchivo, setErroresArchivo] = useState([]);

  const importarClientes = useImportarClientesCSV();

  // Reset al cerrar
  const handleClose = () => {
    setPaso(1);
    setArchivo(null);
    setDatosCSV([]);
    setColumnas([]);
    setMapeo({});
    setErroresArchivo([]);
    onClose();
  };

  // Manejar subida de archivo
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErroresArchivo(['Solo se permiten archivos CSV']);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErroresArchivo(['El archivo no debe superar 5MB']);
      return;
    }

    setErroresArchivo([]);
    setArchivo(file);

    // Parsear CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErroresArchivo(results.errors.map(e => e.message));
          return;
        }

        if (results.data.length === 0) {
          setErroresArchivo(['El archivo esta vacio']);
          return;
        }

        if (results.data.length > 500) {
          setErroresArchivo(['Maximo 500 registros por importacion']);
          return;
        }

        setDatosCSV(results.data);
        setColumnas(results.meta.fields || []);

        // Auto-mapear columnas por nombre similar
        const autoMapeo = {};
        CAMPOS_SISTEMA.forEach(campo => {
          const match = results.meta.fields?.find(col =>
            col.toLowerCase().includes(campo.key) ||
            campo.key.includes(col.toLowerCase())
          );
          if (match) {
            autoMapeo[campo.key] = match;
          }
        });
        setMapeo(autoMapeo);
      },
      error: (error) => {
        setErroresArchivo([error.message]);
      }
    });
  }, []);

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange({ target: { files: [file] } });
    }
  };

  // Actualizar mapeo de columna
  const handleMapeoChange = (campoSistema, columnaCSV) => {
    setMapeo(prev => ({
      ...prev,
      [campoSistema]: columnaCSV || undefined
    }));
  };

  // Validar mapeo antes de confirmar
  const validarMapeo = () => {
    const camposRequeridos = CAMPOS_SISTEMA.filter(c => c.required);
    return camposRequeridos.every(c => mapeo[c.key]);
  };

  // Ejecutar importacion
  const handleImportar = async () => {
    // Transformar datos segun mapeo
    const clientesTransformados = datosCSV.map(fila => {
      const cliente = {};
      CAMPOS_SISTEMA.forEach(campo => {
        if (mapeo[campo.key]) {
          cliente[campo.key] = fila[mapeo[campo.key]];
        }
      });
      return cliente;
    });

    try {
      await importarClientes.mutateAsync({ clientes: clientesTransformados });
      handleClose();
    } catch (error) {
      // El error se maneja en el hook
    }
  };

  // Renderizar paso actual
  const renderPaso = () => {
    switch (paso) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Dropzone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                archivo
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-input').click()}
            >
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              {archivo ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-green-500" />
                  <p className="font-medium text-gray-900 dark:text-white">{archivo.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {datosCSV.length} registros encontrados
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-white">
                    Arrastra tu archivo CSV aqui
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    o haz clic para seleccionar (max 500 registros, 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Errores */}
            {erroresArchivo.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Errores en el archivo:</span>
                </div>
                <ul className="mt-2 list-disc list-inside text-sm text-red-600 dark:text-red-400">
                  {erroresArchivo.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formato esperado */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white mb-2">
                Formato esperado del CSV:
              </p>
              <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                nombre,email,telefono,direccion,notas
              </code>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Solo el campo <strong>nombre</strong> es obligatorio.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona la columna de tu CSV que corresponde a cada campo del sistema:
            </p>

            {/* Mapeo de columnas */}
            <div className="space-y-4">
              {CAMPOS_SISTEMA.map(campo => (
                <div key={campo.key} className="flex items-center gap-4">
                  <div className="w-32 flex-shrink-0">
                    <span className={cn(
                      'text-sm font-medium',
                      campo.required ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                    )}>
                      {campo.label}
                      {campo.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <select
                    value={mapeo[campo.key] || ''}
                    onChange={(e) => handleMapeoChange(campo.key, e.target.value)}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-sm',
                      'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    )}
                  >
                    <option value="">-- Sin mapear --</option>
                    {columnas.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white mb-2">
                Vista previa (primeros 3 registros):
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {CAMPOS_SISTEMA.filter(c => mapeo[c.key]).map(campo => (
                        <th key={campo.key} className="text-left py-2 px-2 text-gray-700 dark:text-gray-300">
                          {campo.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datosCSV.slice(0, 3).map((fila, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                        {CAMPOS_SISTEMA.filter(c => mapeo[c.key]).map(campo => (
                          <td key={campo.key} className="py-2 px-2 text-gray-600 dark:text-gray-400">
                            {fila[mapeo[campo.key]] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Listo para importar
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Se importaran <strong>{datosCSV.length}</strong> clientes.
              </p>
            </div>

            {/* Resumen de mapeo */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white mb-2">Mapeo configurado:</p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {CAMPOS_SISTEMA.filter(c => mapeo[c.key]).map(campo => (
                  <li key={campo.key}>
                    <span className="font-medium">{campo.label}:</span> {mapeo[campo.key]}
                  </li>
                ))}
              </ul>
            </div>

            {importarClientes.isError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span>{importarClientes.error?.message || 'Error al importar'}</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Clientes desde CSV"
      size="lg"
    >
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {PASOS.map((p, index) => (
          <div key={p.id} className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              paso >= p.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            )}>
              {paso > p.id ? <CheckCircle className="h-5 w-5" /> : p.id}
            </div>
            <span className={cn(
              'ml-2 text-sm hidden sm:inline',
              paso >= p.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'
            )}>
              {p.label}
            </span>
            {index < PASOS.length - 1 && (
              <div className={cn(
                'w-12 h-0.5 mx-2',
                paso > p.id ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="min-h-[300px]">
        {renderPaso()}
      </div>

      {/* Botones de navegacion */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          onClick={paso === 1 ? handleClose : () => setPaso(paso - 1)}
          disabled={importarClientes.isPending}
        >
          {paso === 1 ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </>
          )}
        </Button>

        {paso < 3 ? (
          <Button
            onClick={() => setPaso(paso + 1)}
            disabled={
              (paso === 1 && (!archivo || datosCSV.length === 0)) ||
              (paso === 2 && !validarMapeo())
            }
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleImportar}
            disabled={importarClientes.isPending}
          >
            {importarClientes.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Importar {datosCSV.length} clientes
              </>
            )}
          </Button>
        )}
      </div>
    </Modal>
  );
}
