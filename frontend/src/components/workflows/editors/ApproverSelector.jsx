/**
 * ====================================================================
 * APPROVER SELECTOR - Selector de aprobadores para workflows
 * ====================================================================
 *
 * Permite seleccionar aprobadores por:
 * - Rol: admin, propietario, empleado
 * - Usuario: usuarios específicos de la organización
 * - Permiso: código de permiso del catálogo
 *
 * Enero 2026
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  User,
  Shield,
  UserCheck,
  Search,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { usuariosApi, permisosApi } from '@/services/api/endpoints';

// Tipos de aprobador
const TIPO_APROBADOR = {
  rol: { label: 'Por Rol', icon: Users, description: 'Cualquier usuario con el rol' },
  usuario: { label: 'Por Usuario', icon: User, description: 'Usuario específico' },
  permiso: { label: 'Por Permiso', icon: Shield, description: 'Usuarios con el permiso' },
  supervisor: { label: 'Por Superior', icon: UserCheck, description: 'Supervisor jerárquico del solicitante' },
};

// Roles disponibles
const ROLES_DISPONIBLES = [
  { value: 'admin', label: 'Administrador', description: 'Acceso total' },
  { value: 'propietario', label: 'Propietario', description: 'Dueño de la organización' },
  { value: 'empleado', label: 'Empleado', description: 'Permisos limitados' },
];

/**
 * Tab Button para navegación
 */
function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${active
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/**
 * Selector de rol
 */
function RolSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Selecciona el rol que puede aprobar
      </p>
      <div className="space-y-2">
        {ROLES_DISPONIBLES.map((rol) => (
          <label
            key={rol.value}
            className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${value === rol.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <input
              type="radio"
              name="rol"
              value={rol.value}
              checked={value === rol.value}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${value === rol.value
                ? 'border-primary-500 bg-primary-500'
                : 'border-gray-300 dark:border-gray-600'
              }
            `}>
              {value === rol.value && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {rol.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {rol.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Selector de usuario
 */
function UsuarioSelector({ value, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Query usuarios de la organización
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios-workflow', { activo: true }],
    queryFn: async () => {
      const response = await usuariosApi.listarConFiltros({ activo: true, limit: 100 });
      return response.data.data?.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filtrar por búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm) return usuarios;
    const term = searchTerm.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.nombre?.toLowerCase().includes(term) ||
        u.apellidos?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar usuario..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Lista de usuarios */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {usuariosFiltrados.length === 0 ? (
          <p className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron usuarios
          </p>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <label
              key={usuario.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${value === usuario.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <input
                type="radio"
                name="usuario"
                value={usuario.id}
                checked={value === usuario.id}
                onChange={() => onChange(usuario.id)}
                className="sr-only"
              />
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${value === usuario.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}>
                {value === usuario.id && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {usuario.nombre} {usuario.apellidos || ''}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {usuario.email}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {usuario.rol_codigo}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Selector de permiso
 */
function PermisoSelector({ value, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Query catálogo de permisos
  const { data: permisos = [], isLoading } = useQuery({
    queryKey: ['permisos-catalogo-workflow'],
    queryFn: async () => {
      const response = await permisosApi.listarCatalogo();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Filtrar y agrupar por módulo
  const permisosFiltrados = useMemo(() => {
    let filtered = permisos;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = permisos.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(term) ||
          p.codigo?.toLowerCase().includes(term) ||
          p.modulo?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [permisos, searchTerm]);

  // Agrupar por módulo
  const permisosAgrupados = useMemo(() => {
    const grupos = {};
    permisosFiltrados.forEach((p) => {
      const modulo = p.modulo || 'general';
      if (!grupos[modulo]) grupos[modulo] = [];
      grupos[modulo].push(p);
    });
    return grupos;
  }, [permisosFiltrados]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar permiso..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Lista de permisos agrupados */}
      <div className="max-h-60 overflow-y-auto space-y-4">
        {Object.keys(permisosAgrupados).length === 0 ? (
          <p className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron permisos
          </p>
        ) : (
          Object.entries(permisosAgrupados).map(([modulo, permsModulo]) => (
            <div key={modulo}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                {modulo}
              </p>
              <div className="space-y-1">
                {permsModulo.map((permiso) => (
                  <label
                    key={permiso.id}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                      ${value === permiso.codigo
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="permiso"
                      value={permiso.codigo}
                      checked={value === permiso.codigo}
                      onChange={() => onChange(permiso.codigo)}
                      className="sr-only"
                    />
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${value === permiso.codigo
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                      }
                    `}>
                      {value === permiso.codigo && (
                        <Check className="w-2 h-2 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {permiso.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {permiso.codigo}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Selector de configuración de supervisor
 */
function SupervisorSelector({ value = {}, onChange }) {
  const handleChange = (field, val) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        El supervisor del usuario que inicie el workflow será asignado como aprobador automáticamente
      </p>

      {/* Selector de nivel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nivel de supervisor
        </label>
        <select
          value={value.nivel || 1}
          onChange={(e) => handleChange('nivel', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value={1}>Supervisor directo (1er nivel)</option>
          <option value={2}>Segundo nivel (jefe del jefe)</option>
          <option value={3}>Tercer nivel</option>
          <option value={4}>Cuarto nivel</option>
          <option value={5}>Quinto nivel</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Nivel 1 = jefe inmediato, Nivel 2 = jefe del jefe, etc.
        </p>
      </div>

      {/* Toggle cualquier nivel */}
      <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <input
          type="checkbox"
          checked={value.cualquier_nivel || false}
          onChange={(e) => handleChange('cualquier_nivel', e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            Cualquier supervisor puede aprobar
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Permite que cualquier supervisor en la cadena jerárquica apruebe, no solo el del nivel seleccionado
          </p>
        </div>
      </label>

      {/* Fallback */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Si no tiene supervisor asignado:
        </label>
        <select
          value={value.fallback_rol || ''}
          onChange={(e) => handleChange('fallback_rol', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Bloquear solicitud (requiere supervisor)</option>
          <option value="admin">Escalar a Administrador</option>
          <option value="propietario">Escalar a Propietario</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Define qué sucede si el usuario no tiene un supervisor configurado en su perfil
        </p>
      </div>

      {/* Info box */}
      <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
        <p className="text-sm text-primary-700 dark:text-primary-300">
          <strong>Nota:</strong> Para que esta opción funcione, los empleados deben tener un supervisor
          asignado en su perfil de profesional (Profesionales → Editar → Trabajo → Supervisor).
        </p>
      </div>
    </div>
  );
}

/**
 * Componente principal ApproverSelector
 * @param {Object} value - { tipo: 'rol'|'usuario'|'permiso'|'supervisor', valor: string|number, supervisor_config: object }
 * @param {function} onChange - Callback con { tipo, valor, supervisor_config }
 */
function ApproverSelector({ value = {}, onChange }) {
  const [tipoActivo, setTipoActivo] = useState(value.tipo || 'rol');

  // Manejar cambio de tipo
  const handleTipoChange = (nuevoTipo) => {
    setTipoActivo(nuevoTipo);
    onChange({ tipo: nuevoTipo, valor: null });
  };

  // Manejar cambio de valor
  const handleValorChange = (nuevoValor) => {
    onChange({ tipo: tipoActivo, valor: nuevoValor });
  };

  return (
    <div className="space-y-4">
      {/* Tabs de tipo de aprobador */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {Object.entries(TIPO_APROBADOR).map(([tipo, config]) => (
          <TabButton
            key={tipo}
            active={tipoActivo === tipo}
            onClick={() => handleTipoChange(tipo)}
            icon={config.icon}
            label={config.label}
          />
        ))}
      </div>

      {/* Descripción del tipo seleccionado */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {TIPO_APROBADOR[tipoActivo]?.description}
      </p>

      {/* Contenido según tipo */}
      <div className="min-h-[200px]">
        {tipoActivo === 'rol' && (
          <RolSelector
            value={value.tipo === 'rol' ? value.valor : null}
            onChange={handleValorChange}
          />
        )}
        {tipoActivo === 'usuario' && (
          <UsuarioSelector
            value={value.tipo === 'usuario' ? value.valor : null}
            onChange={handleValorChange}
          />
        )}
        {tipoActivo === 'permiso' && (
          <PermisoSelector
            value={value.tipo === 'permiso' ? value.valor : null}
            onChange={handleValorChange}
          />
        )}
        {tipoActivo === 'supervisor' && (
          <SupervisorSelector
            value={value.tipo === 'supervisor' ? (value.supervisor_config || {}) : {}}
            onChange={(config) => onChange({
              tipo: 'supervisor',
              valor: 'supervisor',
              supervisor_config: config
            })}
          />
        )}
      </div>

      {/* Resumen de selección */}
      {(value.valor || value.tipo === 'supervisor') && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-300">
            {tipoActivo === 'rol' && `Aprobador: Rol ${ROLES_DISPONIBLES.find(r => r.value === value.valor)?.label}`}
            {tipoActivo === 'usuario' && `Aprobador: Usuario ID ${value.valor}`}
            {tipoActivo === 'permiso' && `Aprobador: Permiso ${value.valor}`}
            {tipoActivo === 'supervisor' && `Aprobador: Supervisor ${value.supervisor_config?.cualquier_nivel ? '(cualquier nivel)' : `nivel ${value.supervisor_config?.nivel || 1}`}`}
          </span>
          <button
            type="button"
            onClick={() => {
              if (tipoActivo === 'supervisor') {
                onChange({ tipo: 'supervisor', valor: null, supervisor_config: null });
              } else {
                handleValorChange(null);
              }
            }}
            className="ml-auto p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded"
          >
            <X className="w-4 h-4 text-green-600 dark:text-green-400" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ApproverSelector;
