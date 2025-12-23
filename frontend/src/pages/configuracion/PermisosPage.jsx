import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  Search,
  Info,
  Settings,
  Lock,
  Unlock,
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { permisosApi } from '@/services/api/endpoints';

/**
 * Página de configuración de Permisos
 * Gestión de permisos por rol y overrides por usuario/sucursal
 * Dic 2025 - Sistema Normalizado de Permisos
 */
function PermisosPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [rolSeleccionado, setRolSeleccionado] = useState('empleado');
  const [modulosExpandidos, setModulosExpandidos] = useState(new Set(['pos', 'agendamiento', 'inventario']));
  const [searchTerm, setSearchTerm] = useState('');

  // Roles disponibles
  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'propietario', label: 'Propietario' },
    { value: 'empleado', label: 'Empleado' },
    { value: 'bot', label: 'Bot / Chatbot' },
  ];

  // Query: Catálogo de permisos
  const { data: catalogo = [], isLoading: loadingCatalogo } = useQuery({
    queryKey: ['permisos-catalogo'],
    queryFn: async () => {
      const response = await permisosApi.listarCatalogo();
      return response.data.data || [];
    },
  });

  // Query: Permisos del rol seleccionado
  const { data: permisosRol = [], isLoading: loadingPermisos, refetch: refetchPermisos } = useQuery({
    queryKey: ['permisos-rol', rolSeleccionado],
    queryFn: async () => {
      const response = await permisosApi.listarPorRol(rolSeleccionado);
      return response.data.data || [];
    },
    enabled: !!rolSeleccionado,
  });

  // Mutation: Actualizar permiso de rol
  const actualizarPermisoMutation = useMutation({
    mutationFn: async ({ permisoId, valor }) => {
      return permisosApi.asignarPermisoRol(rolSeleccionado, permisoId, valor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permisos-rol', rolSeleccionado] });
      toast.success('Permiso actualizado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar permiso');
    },
  });

  // Agrupar permisos por módulo
  const permisosAgrupados = useMemo(() => {
    const grupos = {};
    catalogo.forEach(permiso => {
      const modulo = permiso.modulo || 'general';
      if (!grupos[modulo]) {
        grupos[modulo] = [];
      }
      grupos[modulo].push(permiso);
    });

    // Ordenar permisos dentro de cada módulo
    Object.keys(grupos).forEach(modulo => {
      grupos[modulo].sort((a, b) => (a.orden_display || 0) - (b.orden_display || 0));
    });

    return grupos;
  }, [catalogo]);

  // Filtrar permisos por búsqueda
  const permisosFiltrados = useMemo(() => {
    if (!searchTerm) return permisosAgrupados;

    const term = searchTerm.toLowerCase();
    const filtrados = {};

    Object.entries(permisosAgrupados).forEach(([modulo, permisos]) => {
      const permisosMatch = permisos.filter(
        p => p.nombre?.toLowerCase().includes(term) ||
             p.codigo?.toLowerCase().includes(term) ||
             p.descripcion?.toLowerCase().includes(term)
      );
      if (permisosMatch.length > 0 || modulo.toLowerCase().includes(term)) {
        filtrados[modulo] = permisosMatch.length > 0 ? permisosMatch : permisos;
      }
    });

    return filtrados;
  }, [permisosAgrupados, searchTerm]);

  // Obtener valor actual de un permiso para el rol
  const getValorPermiso = (permisoId) => {
    const permisoRol = permisosRol.find(pr => pr.permiso_id === permisoId);
    if (permisoRol) {
      return permisoRol.valor;
    }
    // Valor default del catálogo
    const permiso = catalogo.find(p => p.id === permisoId);
    return permiso?.valor_default;
  };

  // Toggle módulo expandido
  const toggleModulo = (modulo) => {
    setModulosExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(modulo)) {
        next.delete(modulo);
      } else {
        next.add(modulo);
      }
      return next;
    });
  };

  // Toggle permiso booleano
  const handleTogglePermiso = (permisoId, valorActual) => {
    const nuevoValor = valorActual === true ? false : true;
    actualizarPermisoMutation.mutate({ permisoId, valor: nuevoValor });
  };

  // Nombres amigables para módulos
  const nombresModulos = {
    pos: 'Punto de Venta',
    agendamiento: 'Agendamiento',
    inventario: 'Inventario',
    contabilidad: 'Contabilidad',
    reportes: 'Reportes',
    configuracion: 'Configuración',
    clientes: 'Clientes',
    profesionales: 'Profesionales / Empleados',
    marketplace: 'Marketplace',
    general: 'General',
  };

  // Iconos por módulo
  const iconosModulos = {
    pos: '💰',
    agendamiento: '📅',
    inventario: '📦',
    contabilidad: '📊',
    reportes: '📈',
    configuracion: '⚙️',
    clientes: '👥',
    profesionales: '👨‍💼',
    marketplace: '🏪',
    general: '📋',
  };

  const isLoading = loadingCatalogo || loadingPermisos;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <BackButton to="/configuracion" label="Configuración" />
        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Permisos
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configura los permisos por rol y personaliza accesos específicos
            </p>
          </div>
        </div>
      </div>

      {/* Selector de rol y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Selector de rol */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Rol
            </label>
            <Select
              value={rolSeleccionado}
              onChange={(e) => setRolSeleccionado(e.target.value)}
              options={roles}
            />
          </div>

          {/* Búsqueda */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Buscar permiso
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Info del rol */}
        <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-700 dark:text-primary-300">
              {rolSeleccionado === 'admin' && (
                <span>Los <strong>Administradores</strong> tienen acceso completo al sistema por defecto.</span>
              )}
              {rolSeleccionado === 'propietario' && (
                <span>Los <strong>Propietarios</strong> tienen acceso completo a su organización.</span>
              )}
              {rolSeleccionado === 'empleado' && (
                <span>Los <strong>Empleados</strong> tienen permisos limitados. Configura qué módulos y acciones pueden realizar.</span>
              )}
              {rolSeleccionado === 'bot' && (
                <span>Los <strong>Bots</strong> son usuarios de sistema para integraciones con chatbots y automatizaciones.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de permisos por módulo */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
        ) : Object.keys(permisosFiltrados).length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No se encontraron permisos
          </div>
        ) : (
          Object.entries(permisosFiltrados).map(([modulo, permisos]) => (
            <div
              key={modulo}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header del módulo */}
              <button
                onClick={() => toggleModulo(modulo)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{iconosModulos[modulo] || '📋'}</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {nombresModulos[modulo] || modulo}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {permisos.length} permiso{permisos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {modulosExpandidos.has(modulo) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Lista de permisos */}
              {modulosExpandidos.has(modulo) && (
                <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {permisos.map((permiso) => {
                    const valorActual = getValorPermiso(permiso.id);
                    const esBooleano = permiso.tipo_valor === 'booleano';
                    const habilitado = valorActual === true;

                    return (
                      <div
                        key={permiso.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {habilitado ? (
                              <Unlock className="h-4 w-4 text-green-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {permiso.nombre}
                            </span>
                          </div>
                          {permiso.descripcion && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-6">
                              {permiso.descripcion}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-6 font-mono">
                            {permiso.codigo}
                          </p>
                        </div>

                        {/* Toggle para permisos booleanos */}
                        {esBooleano && (
                          <button
                            onClick={() => handleTogglePermiso(permiso.id, valorActual)}
                            disabled={actualizarPermisoMutation.isPending}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                              habilitado
                                ? 'bg-green-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                habilitado ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            >
                              {actualizarPermisoMutation.isPending ? (
                                <Loader2 className="h-4 w-4 m-0.5 text-gray-400 animate-spin" />
                              ) : habilitado ? (
                                <Check className="h-4 w-4 m-0.5 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 m-0.5 text-gray-400" />
                              )}
                            </span>
                          </button>
                        )}

                        {/* Para permisos numéricos */}
                        {permiso.tipo_valor === 'numerico' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {valorActual ?? 0}
                            </span>
                            <span className="text-xs text-gray-400">
                              {permiso.codigo.includes('max_descuento') ? '%' : ''}
                              {permiso.codigo.includes('limite') ? '$' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Nota al pie */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sobre los permisos
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Los permisos de rol se aplican a todos los usuarios con ese rol</li>
              <li>Puedes asignar overrides específicos por usuario desde la sección de empleados</li>
              <li>Los cambios se aplican inmediatamente sin necesidad de reiniciar sesión</li>
              <li>Los roles <strong>admin</strong> y <strong>propietario</strong> tienen bypass de permisos por defecto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PermisosPage;
