import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Zap,
  Building2,
  Percent,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { BackButton, Button } from '@/components/ui';
import { useConfiguracionContable, useActualizarConfiguracion } from '@/hooks/useContabilidad';

/**
 * Página de configuración del módulo de contabilidad
 * Permite activar/desactivar asientos automáticos y ver cuentas configuradas
 */
function ConfiguracionContablePage() {
  const navigate = useNavigate();
  const { data: config, isLoading, refetch } = useConfiguracionContable();
  const actualizarConfig = useActualizarConfiguracion();

  const [asientosAutomaticos, setAsientosAutomaticos] = useState(null);

  // Sincronizar estado local con datos del servidor
  if (config && asientosAutomaticos === null) {
    setAsientosAutomaticos(config.generar_asientos_automaticos);
  }

  const handleToggleAsientos = async () => {
    const nuevoValor = !asientosAutomaticos;
    setAsientosAutomaticos(nuevoValor);

    try {
      await actualizarConfig.mutateAsync({
        generar_asientos_automaticos: nuevoValor,
      });
    } catch {
      // Revertir si falla
      setAsientosAutomaticos(!nuevoValor);
    }
  };

  // Cuentas del sistema configuradas
  const cuentasSistema = config ? [
    { label: 'Caja', codigo: config.cuenta_caja_codigo, nombre: config.cuenta_caja_nombre, id: config.cuenta_caja_id },
    { label: 'Bancos', codigo: config.cuenta_bancos_codigo, nombre: config.cuenta_bancos_nombre, id: config.cuenta_bancos_id },
    { label: 'Ventas', codigo: config.cuenta_ventas_codigo, nombre: config.cuenta_ventas_nombre, id: config.cuenta_ventas_id },
    { label: 'Costo de Ventas', codigo: config.cuenta_costo_ventas_codigo, nombre: config.cuenta_costo_ventas_nombre, id: config.cuenta_costo_ventas_id },
    { label: 'Inventario', codigo: config.cuenta_inventario_codigo, nombre: config.cuenta_inventario_nombre, id: config.cuenta_inventario_id },
    { label: 'Clientes', codigo: config.cuenta_clientes_codigo, nombre: config.cuenta_clientes_nombre, id: config.cuenta_clientes_id },
    { label: 'Proveedores', codigo: config.cuenta_proveedores_codigo, nombre: config.cuenta_proveedores_nombre, id: config.cuenta_proveedores_id },
    { label: 'IVA Trasladado', codigo: config.cuenta_iva_trasladado_codigo, nombre: config.cuenta_iva_trasladado_nombre, id: config.cuenta_iva_trasladado_id },
    { label: 'IVA Acreditable', codigo: config.cuenta_iva_acreditable_codigo, nombre: config.cuenta_iva_acreditable_nombre, id: config.cuenta_iva_acreditable_id },
  ] : [];

  // Verificar si todas las cuentas esenciales están configuradas
  const cuentasEsenciales = ['cuenta_caja_id', 'cuenta_ventas_id', 'cuenta_inventario_id', 'cuenta_proveedores_id'];
  const todasConfiguradas = config && cuentasEsenciales.every(c => config[c]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton to="/contabilidad" label="Volver" className="mb-4" />

          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Configuración No Disponible</h3>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-4">
                  Para acceder a la configuración contable, primero debes inicializar el catálogo SAT
                  desde la página principal de contabilidad.
                </p>
                <Button variant="primary" onClick={() => navigate('/contabilidad')}>
                  Ir a Contabilidad
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/contabilidad" label="Volver a Contabilidad" className="mb-2" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración Contable</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Asientos automáticos y cuentas del sistema</p>
            </div>
          </div>
        </div>

        {/* Asientos Automáticos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${asientosAutomaticos ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <Zap className={`w-6 h-6 ${asientosAutomaticos ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Asientos Automáticos</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Genera asientos contables automáticamente al completar ventas POS y recibir
                    mercancía de órdenes de compra.
                  </p>

                  {asientosAutomaticos && (
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400">
                        POS → Contabilidad
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/40 text-secondary-800 dark:text-secondary-400">
                        Compras → Contabilidad
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleToggleAsientos}
                disabled={actualizarConfig.isPending || !todasConfiguradas}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  asientosAutomaticos ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                } ${actualizarConfig.isPending || !todasConfiguradas ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    asientosAutomaticos ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!todasConfiguradas && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Configura todas las cuentas esenciales para habilitar asientos automáticos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Configuración General */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configuración General</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">País</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{config.pais || 'MX'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Moneda</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{config.moneda || 'MXN'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Plan de Cuentas</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">SAT México (Anexo 24)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tasa IVA</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1">
                  <Percent className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {config.tasa_iva || 16}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Método Costeo</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">{config.metodo_costeo || 'Promedio'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Código SAT</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-1">
                  {config.usa_codigo_agrupador_sat ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" /> Activo</>
                  ) : (
                    <><XCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Inactivo</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cuentas del Sistema */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cuentas del Sistema</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Cuentas utilizadas para generar asientos automáticos
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {cuentasSistema.map((cuenta) => (
              <div key={cuenta.label} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{cuenta.label}</p>
                  {cuenta.codigo ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cuenta.codigo} - {cuenta.nombre}
                    </p>
                  ) : (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      No configurada
                    </p>
                  )}
                </div>
                {cuenta.id ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Información */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <p className="text-primary-800 dark:text-primary-300 text-sm">
            <strong>Nota:</strong> Las cuentas del sistema se configuran automáticamente al
            inicializar el catálogo SAT. Si necesitas modificarlas, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracionContablePage;
