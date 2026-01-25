import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Users,
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
  Crown,
  AlertCircle,
} from 'lucide-react';

import { Badge, Select, ToggleSwitch } from '@/components/ui';
import { ConfigPageHeader } from '@/components/configuracion';
import { useToast } from '@/hooks/utils';
import { useRoles, usePermisosRol, useActualizarPermisoRol } from '@/hooks/sistema/useRoles';
import { permisosApi } from '@/services/api/endpoints';

/**
 * Página de configuración de Permisos
 * Gestión de permisos por rol y overrides por usuario/sucursal
 * Dic 2025 - Sistema Normalizado de Permisos
 */
function PermisosPage() {
  const toast = useToast();
  const [rolSeleccionadoId, setRolSeleccionadoId] = useState(null);
  const [modulosExpandidos, setModulosExpandidos] = useState(new Set(['pos', 'agendamiento', 'inventario']));
  const [searchTerm, setSearchTerm] = useState('');
  const [valoresEditando, setValoresEditando] = useState({});

  // Query: Roles dinámicos de la organización
  const { data: rolesData = [], isLoading: loadingRoles } = useRoles({ activo: true });

  // Transformar roles para el selector
  const roles = useMemo(() => {
    return rolesData.map(r => ({
      value: r.id,
      label: r.nombre,
      codigo: r.codigo,
      nivel: r.nivel_jerarquia,
      esRolSistema: r.es_rol_sistema,
      bypassPermisos: r.bypass_permisos,
    }));
  }, [rolesData]);

  // Auto-seleccionar primer rol de organización (no sistema) cuando carguen
  useEffect(() => {
    if (roles.length > 0 && !rolSeleccionadoId) {
      const primerRolOrg = roles.find(r => !r.esRolSistema);
      setRolSeleccionadoId(primerRolOrg?.value || roles[0].value);
    }
  }, [roles, rolSeleccionadoId]);

  // Obtener info del rol seleccionado
  const rolSeleccionado = useMemo(() => {
    return roles.find(r => r.value === rolSeleccionadoId);
  }, [roles, rolSeleccionadoId]);

  // Query: Catálogo de permisos
  const { data: catalogo = [], isLoading: loadingCatalogo } = useQuery({
    queryKey: ['permisos-catalogo'],
    queryFn: async () => {
      const response = await permisosApi.listarCatalogo();
      return response.data.data || [];
    },
  });

  // Query: Permisos del rol seleccionado (usando hook de roles)
  const { data: permisosRolData, isLoading: loadingPermisos } = usePermisosRol(rolSeleccionadoId);
  const permisosRol = permisosRolData?.permisos || [];

  // Mutation: Actualizar permiso de rol (usando hook de roles)
  const actualizarPermisoMutation = useActualizarPermisoRol();

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
    actualizarPermisoMutation.mutate({
      rolId: rolSeleccionadoId,
      permisoId,
      valor: nuevoValor
    });
  };

  // Manejar cambio de valor numérico (mientras edita)
  const handleNumericoChange = (permisoId, valor) => {
    setValoresEditando(prev => ({
      ...prev,
      [permisoId]: valor
    }));
  };

  // Guardar valor numérico al perder foco o presionar Enter
  const handleNumericoGuardar = (permisoId, valorOriginal) => {
    const valorEditado = valoresEditando[permisoId];

    // Si no hay cambio o es undefined, no hacer nada
    if (valorEditado === undefined || valorEditado === String(valorOriginal ?? 0)) {
      setValoresEditando(prev => {
        const next = { ...prev };
        delete next[permisoId];
        return next;
      });
      return;
    }

    const valorNumerico = parseInt(valorEditado, 10);
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      toast.error('El valor debe ser un número válido mayor o igual a 0');
      setValoresEditando(prev => {
        const next = { ...prev };
        delete next[permisoId];
        return next;
      });
      return;
    }

    actualizarPermisoMutation.mutate(
      { rolId: rolSeleccionadoId, permisoId, valor: valorNumerico },
      {
        onSuccess: () => {
          setValoresEditando(prev => {
            const next = { ...prev };
            delete next[permisoId];
            return next;
          });
        }
      }
    );
  };

  // Manejar tecla Enter en input numérico
  const handleNumericoKeyDown = (e, permisoId, valorOriginal) => {
    if (e.key === 'Enter') {
      e.target.blur();
      handleNumericoGuardar(permisoId, valorOriginal);
    } else if (e.key === 'Escape') {
      setValoresEditando(prev => {
        const next = { ...prev };
        delete next[permisoId];
        return next;
      });
      e.target.blur();
    }
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

  const isLoading = loadingRoles || loadingCatalogo || loadingPermisos;
  const esSuperAdmin = rolSeleccionado?.nivel === 100;
  const tieneBypass = rolSeleccionado?.bypassPermisos;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ConfigPageHeader
        title="Permisos"
        subtitle="Configura los permisos por rol y personaliza accesos específicos"
        icon={Shield}
        maxWidth="max-w-5xl"
      />

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              value={rolSeleccionadoId || ''}
              onChange={(e) => setRolSeleccionadoId(Number(e.target.value))}
              options={roles}
              disabled={loadingRoles}
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
        {rolSeleccionado && (
          <div className="mt-4 space-y-3">
            {/* Badges del rol */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" size="sm">
                Nivel {rolSeleccionado.nivel}
              </Badge>
              {rolSeleccionado.esRolSistema && (
                <Badge variant="info" size="sm">
                  Rol de Sistema
                </Badge>
              )}
              {tieneBypass && (
                <Badge variant="warning" size="sm">
                  <Crown className="h-3 w-3 mr-1" />
                  Bypass Permisos
                </Badge>
              )}
            </div>

            {/* Alerta para roles con bypass o super_admin */}
            {(esSuperAdmin || tieneBypass) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    {esSuperAdmin ? (
                      <span>El rol <strong>Super Admin</strong> tiene acceso total al sistema. Los permisos no pueden ser modificados.</span>
                    ) : (
                      <span>Este rol tiene <strong>bypass de permisos</strong> activado, por lo que ignora las restricciones granulares.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info general */}
            {!esSuperAdmin && !tieneBypass && (
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary-700 dark:text-primary-300">
                    Configura los permisos granulares para el rol <strong>{rolSeleccionado.label}</strong>.
                    Los cambios se aplican inmediatamente a todos los usuarios con este rol.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
                          <ToggleSwitch
                            enabled={habilitado}
                            onChange={() => handleTogglePermiso(permiso.id, valorActual)}
                            disabled={actualizarPermisoMutation.isPending || esSuperAdmin || tieneBypass}
                            loading={actualizarPermisoMutation.isPending}
                            size="md"
                            label={`Toggle ${permiso.nombre}`}
                            enabledIcon={<Check className="h-4 w-4 m-0.5 text-green-500" />}
                            disabledIcon={<X className="h-4 w-4 m-0.5 text-gray-400" />}
                          />
                        )}

                        {/* Para permisos numéricos - Input editable */}
                        {permiso.tipo_valor === 'numerico' && (
                          <div className="flex items-center gap-2">
                            {permiso.codigo.includes('limite') && (
                              <span className="text-sm text-gray-400">$</span>
                            )}
                            <input
                              type="number"
                              min="0"
                              value={valoresEditando[permiso.id] ?? valorActual ?? 0}
                              onChange={(e) => handleNumericoChange(permiso.id, e.target.value)}
                              onBlur={() => handleNumericoGuardar(permiso.id, valorActual)}
                              onKeyDown={(e) => handleNumericoKeyDown(e, permiso.id, valorActual)}
                              disabled={actualizarPermisoMutation.isPending || esSuperAdmin || tieneBypass}
                              className="w-24 px-2 py-1 text-right text-sm border border-gray-300 dark:border-gray-600 rounded-md
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                                disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {permiso.codigo.includes('max_descuento') && (
                              <span className="text-sm text-gray-400">%</span>
                            )}
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
              <li>Los roles con <strong>bypass de permisos</strong> ignoran las restricciones granulares</li>
              <li>Puedes crear roles personalizados desde <strong>Configuración → Roles</strong></li>
            </ul>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

export default PermisosPage;
