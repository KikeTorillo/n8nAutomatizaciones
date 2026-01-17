import { useState } from 'react';
import {
  Settings,
  Building2,
  Package,
  ArrowRight,
  Check,
  Info,
  RefreshCw,
  MapPin,
  Plus,
  ChevronDown,
  ChevronUp,
  PackageOpen,
  ClipboardCheck,
  PackageCheck,
  Boxes,
  Send,
} from 'lucide-react';
import { Button, Modal, Select } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useConfiguracionAlmacen,
  useActualizarConfiguracion,
  useCrearUbicacionesDefault,
  PASOS_RECEPCION,
  PASOS_ENVIO,
  LABELS_PASOS_RECEPCION,
  LABELS_PASOS_ENVIO,
  DESCRIPCIONES_PASOS_RECEPCION,
  DESCRIPCIONES_PASOS_ENVIO,
} from '@/hooks/almacen';
import { useArbolUbicaciones } from '@/hooks/inventario';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';

/**
 * Visualización del flujo de pasos
 */
function FlujoPasos({ pasos, tipo }) {
  const etapasRecepcion = {
    1: [{ icon: PackageOpen, label: 'Recepción', desc: 'Stock directo' }],
    2: [
      { icon: PackageOpen, label: 'Recepción', desc: 'Zona de entrada' },
      { icon: Package, label: 'Almacenamiento', desc: 'Ubicación stock' },
    ],
    3: [
      { icon: PackageOpen, label: 'Recepción', desc: 'Zona de entrada' },
      { icon: ClipboardCheck, label: 'Control Calidad', desc: 'Inspección' },
      { icon: Package, label: 'Almacenamiento', desc: 'Ubicación stock' },
    ],
  };

  const etapasEnvio = {
    1: [{ icon: Send, label: 'Envío', desc: 'Directo desde stock' }],
    2: [
      { icon: PackageCheck, label: 'Picking', desc: 'Recoger productos' },
      { icon: Send, label: 'Envío', desc: 'Zona de salida' },
    ],
    3: [
      { icon: PackageCheck, label: 'Picking', desc: 'Recoger productos' },
      { icon: Boxes, label: 'Empaque', desc: 'Preparar paquete' },
      { icon: Send, label: 'Envío', desc: 'Zona de salida' },
    ],
  };

  const etapas = tipo === 'recepcion' ? etapasRecepcion[pasos] : etapasEnvio[pasos];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {etapas.map((etapa, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <etapa.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
              {etapa.label}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {etapa.desc}
            </span>
          </div>
          {index < etapas.length - 1 && (
            <ArrowRight className="h-5 w-5 text-gray-400 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Selector de ubicación
 */
function SelectorUbicacion({ label, value, ubicaciones, onChange, helperText }) {
  const flatUbicaciones = [];

  const flatten = (ubis, nivel = 0) => {
    ubis.forEach((ubi) => {
      flatUbicaciones.push({
        id: ubi.id,
        label: `${'  '.repeat(nivel)}${ubi.codigo} - ${ubi.nombre}`,
        tipo: ubi.tipo,
      });
      if (ubi.hijos?.length > 0) {
        flatten(ubi.hijos, nivel + 1);
      }
    });
  };

  flatten(ubicaciones);

  return (
    <div>
      <Select
        label={label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Sin asignar</option>
        {flatUbicaciones.map((ubi) => (
          <option key={ubi.id} value={ubi.id}>
            {ubi.label} ({ubi.tipo})
          </option>
        ))}
      </Select>
      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Card de configuración de sucursal
 */
function ConfiguracionSucursalCard({ sucursalId }) {
  const { success: showSuccess, error: showError } = useToast();
  const [expandido, setExpandido] = useState(true);
  const [editando, setEditando] = useState(false);

  // Queries
  const { data: config, isLoading, refetch } = useConfiguracionAlmacen(sucursalId);
  const { data: arbolUbicaciones = [] } = useArbolUbicaciones(sucursalId);

  // Mutations
  const actualizarMutation = useActualizarConfiguracion();
  const crearUbicacionesMutation = useCrearUbicacionesDefault();

  // Estado local de edición
  const [formData, setFormData] = useState(null);

  const handleEditar = () => {
    setFormData({
      pasos_recepcion: config?.pasos_recepcion || 1,
      pasos_envio: config?.pasos_envio || 1,
      ubicacion_recepcion_id: config?.ubicacion_recepcion_id || null,
      ubicacion_qc_id: config?.ubicacion_qc_id || null,
      ubicacion_stock_id: config?.ubicacion_stock_id || null,
      ubicacion_picking_id: config?.ubicacion_picking_id || null,
      ubicacion_empaque_id: config?.ubicacion_empaque_id || null,
      ubicacion_envio_id: config?.ubicacion_envio_id || null,
      generar_picking_automatico: config?.generar_picking_automatico ?? true,
      permitir_picking_parcial: config?.permitir_picking_parcial ?? true,
      requiere_validacion_qc: config?.requiere_validacion_qc ?? false,
    });
    setEditando(true);
  };

  const handleGuardar = async () => {
    try {
      await actualizarMutation.mutateAsync({
        sucursalId,
        data: formData,
      });
      showSuccess('Configuración guardada correctamente');
      setEditando(false);
      refetch();
    } catch (error) {
      showError(error.message || 'Error al guardar configuración');
    }
  };

  const handleCrearUbicaciones = async () => {
    try {
      const resultado = await crearUbicacionesMutation.mutateAsync(sucursalId);

      // Actualizar formData con los IDs retornados para reflejarlos inmediatamente
      if (resultado.ubicaciones) {
        setFormData(prev => ({
          ...prev,
          ubicacion_recepcion_id: resultado.ubicaciones.recepcion || prev.ubicacion_recepcion_id,
          ubicacion_qc_id: resultado.ubicaciones.qc || prev.ubicacion_qc_id,
          ubicacion_stock_id: resultado.ubicaciones.stock || prev.ubicacion_stock_id,
          ubicacion_picking_id: resultado.ubicaciones.picking || prev.ubicacion_picking_id,
          ubicacion_empaque_id: resultado.ubicaciones.empaque || prev.ubicacion_empaque_id,
          ubicacion_envio_id: resultado.ubicaciones.envio || prev.ubicacion_envio_id,
        }));
      }

      showSuccess('Ubicaciones WMS creadas y asignadas correctamente');
      refetch();
    } catch (error) {
      showError(error.message || 'Error al crear ubicaciones');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-gray-900 dark:text-white">
            {config?.sucursal_nombre || `Sucursal ${sucursalId}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {config?.pasos_recepcion > 1 || config?.pasos_envio > 1 ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
              Multietapa activo
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs font-medium">
              Flujo directo
            </span>
          )}
          {expandido ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {expandido && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-6">
          {/* Flujo de Recepción */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <PackageOpen className="h-4 w-4" />
              Flujo de Recepción
            </h4>
            {editando ? (
              <div className="space-y-4">
                <Select
                  label="Pasos de recepción"
                  value={formData.pasos_recepcion}
                  onChange={(e) => setFormData({ ...formData, pasos_recepcion: parseInt(e.target.value) })}
                >
                  {Object.entries(LABELS_PASOS_RECEPCION).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {DESCRIPCIONES_PASOS_RECEPCION[formData.pasos_recepcion]}
                </p>
              </div>
            ) : (
              <div>
                <FlujoPasos pasos={config?.pasos_recepcion || 1} tipo="recepcion" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {config?.descripcion_recepcion || LABELS_PASOS_RECEPCION[config?.pasos_recepcion || 1]}
                </p>
              </div>
            )}
          </div>

          {/* Flujo de Envío */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Flujo de Envío
            </h4>
            {editando ? (
              <div className="space-y-4">
                <Select
                  label="Pasos de envío"
                  value={formData.pasos_envio}
                  onChange={(e) => setFormData({ ...formData, pasos_envio: parseInt(e.target.value) })}
                >
                  {Object.entries(LABELS_PASOS_ENVIO).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {DESCRIPCIONES_PASOS_ENVIO[formData.pasos_envio]}
                </p>
              </div>
            ) : (
              <div>
                <FlujoPasos pasos={config?.pasos_envio || 1} tipo="envio" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {config?.descripcion_envio || LABELS_PASOS_ENVIO[config?.pasos_envio || 1]}
                </p>
              </div>
            )}
          </div>

          {/* Ubicaciones (solo en modo edición) */}
          {editando && (formData.pasos_recepcion > 1 || formData.pasos_envio > 1) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicaciones por Defecto
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCrearUbicaciones}
                  disabled={crearUbicacionesMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear automáticas
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.pasos_recepcion >= 2 && (
                  <SelectorUbicacion
                    label="Ubicación Recepción"
                    value={formData.ubicacion_recepcion_id}
                    ubicaciones={arbolUbicaciones}
                    onChange={(val) => setFormData({ ...formData, ubicacion_recepcion_id: val })}
                    helperText="Donde llega la mercancía"
                  />
                )}
                {formData.pasos_recepcion >= 3 && (
                  <SelectorUbicacion
                    label="Ubicación Control Calidad"
                    value={formData.ubicacion_qc_id}
                    ubicaciones={arbolUbicaciones}
                    onChange={(val) => setFormData({ ...formData, ubicacion_qc_id: val })}
                    helperText="Zona de inspección"
                  />
                )}
                <SelectorUbicacion
                  label="Ubicación Stock Principal"
                  value={formData.ubicacion_stock_id}
                  ubicaciones={arbolUbicaciones}
                  onChange={(val) => setFormData({ ...formData, ubicacion_stock_id: val })}
                  helperText="Almacenamiento principal"
                />
                {formData.pasos_envio >= 2 && (
                  <SelectorUbicacion
                    label="Ubicación Picking"
                    value={formData.ubicacion_picking_id}
                    ubicaciones={arbolUbicaciones}
                    onChange={(val) => setFormData({ ...formData, ubicacion_picking_id: val })}
                    helperText="Zona de preparación"
                  />
                )}
                {formData.pasos_envio >= 3 && (
                  <SelectorUbicacion
                    label="Ubicación Empaque"
                    value={formData.ubicacion_empaque_id}
                    ubicaciones={arbolUbicaciones}
                    onChange={(val) => setFormData({ ...formData, ubicacion_empaque_id: val })}
                    helperText="Zona de empaque"
                  />
                )}
                <SelectorUbicacion
                  label="Ubicación Envío"
                  value={formData.ubicacion_envio_id}
                  ubicaciones={arbolUbicaciones}
                  onChange={(val) => setFormData({ ...formData, ubicacion_envio_id: val })}
                  helperText="Zona de despacho"
                />
              </div>
            </div>
          )}

          {/* Ubicaciones actuales (modo vista) */}
          {!editando && (config?.pasos_recepcion > 1 || config?.pasos_envio > 1) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicaciones Configuradas
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {config?.ubicacion_recepcion_codigo && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <span className="text-gray-500 dark:text-gray-400">Recepción:</span>
                    <span className="ml-1 font-medium">{config.ubicacion_recepcion_codigo}</span>
                  </div>
                )}
                {config?.ubicacion_qc_codigo && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <span className="text-gray-500 dark:text-gray-400">QC:</span>
                    <span className="ml-1 font-medium">{config.ubicacion_qc_codigo}</span>
                  </div>
                )}
                {config?.ubicacion_stock_codigo && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                    <span className="ml-1 font-medium">{config.ubicacion_stock_codigo}</span>
                  </div>
                )}
                {config?.ubicacion_picking_codigo && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <span className="text-gray-500 dark:text-gray-400">Picking:</span>
                    <span className="ml-1 font-medium">{config.ubicacion_picking_codigo}</span>
                  </div>
                )}
                {config?.ubicacion_empaque_codigo && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <span className="text-gray-500 dark:text-gray-400">Empaque:</span>
                    <span className="ml-1 font-medium">{config.ubicacion_empaque_codigo}</span>
                  </div>
                )}
                {config?.ubicacion_envio_codigo && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <span className="text-gray-500 dark:text-gray-400">Envío:</span>
                    <span className="ml-1 font-medium">{config.ubicacion_envio_codigo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            {editando ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGuardar}
                  disabled={actualizarMutation.isPending}
                >
                  {actualizarMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={handleEditar}
              >
                Editar Configuración
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Página de Configuración de Almacén
 */
export default function ConfiguracionAlmacenPage() {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const sucursalId = getSucursalId();

  return (
    <InventarioPageLayout
      icon={Settings}
      title="Configuración de Almacén"
      subtitle="Configura rutas de recepción y envío multi-paso por sucursal"
    >
      <div className="space-y-6">
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-700 dark:text-primary-300">
              <p className="font-medium mb-1">Rutas Multietapa</p>
              <p>
                Configura cuántos pasos tiene el proceso de recepción y envío de mercancía.
                Esto permite tener control de calidad, zonas de picking, empaque y más.
              </p>
            </div>
          </div>
        </div>

        {/* Configuración de la sucursal actual */}
        <ConfiguracionSucursalCard sucursalId={sucursalId} />
      </div>
    </InventarioPageLayout>
  );
}
