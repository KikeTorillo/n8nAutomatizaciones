/**
 * Página de Usuarios
 * Gestión de usuarios con vinculación a profesionales
 * Refactorizada con componentes genéricos de configuración
 */

import { useState, useMemo, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Loader2,
  Link2,
  Link2Off,
  Eye,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

import { Button, ConfirmDialog, StatCardGrid } from '@/components/ui';
import { ConfiguracionPageLayout, ConfigSearchBar, ConfigEmptyState } from '@/components/configuracion';
import { useToast, useModalManager, useFilters } from '@/hooks/utils';
import {
  useUsuarios,
  useCambiarEstadoUsuario,
  useCambiarRolUsuario,
  useVincularProfesionalAUsuario,
  useProfesionalesSinUsuario,
  ROLES_USUARIO,
} from '@/hooks/personas';
import { useVerificarLimiteUsuarios } from '@/hooks/suscripciones-negocio';
import UsuarioFormDrawer from '@/components/usuarios/UsuarioFormDrawer';

// Context para compartir estado entre UsuariosPage y UsuarioRow
const UsuariosContext = createContext(null);
const useUsuariosContext = () => useContext(UsuariosContext);

// Opciones de filtros
const FILTROS_ROL = [
  { value: 'admin', label: 'Administrador' },
  { value: 'empleado', label: 'Empleado' },
];

const FILTROS_ESTADO = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

// Estado inicial de filtros
const INITIAL_FILTERS = {
  buscar: '',
  rol: '',
  activo: '',
};

function UsuariosPage() {
  const toast = useToast();
  const navigate = useNavigate();

  // Filtros consolidados con useFilters
  const {
    filtros,
    filtrosQuery,
    setFiltro,
    limpiarFiltros,
    hasFiltrosActivos,
  } = useFilters(INITIAL_FILTERS, {
    moduloId: 'configuracion.usuarios',
    debounceFields: ['buscar'],
  });

  const [vinculandoUsuario, setVinculandoUsuario] = useState(null);

  // Verificación de límite de usuarios (seat-based billing)
  const { data: limiteData, refetch: refetchLimite } = useVerificarLimiteUsuarios(1);

  // Modal manager
  const { openModal, closeModal, isOpen, getModalData, getModalProps } = useModalManager({
    form: { isOpen: false, data: null },
    confirm: { isOpen: false, data: null, type: '', title: '', message: '' },
    limiteConfirm: { isOpen: false, data: null },
  });

  // Query params con filtrosQuery (debounced)
  const queryParams = useMemo(() => ({
    ...filtrosQuery,
    limit: 100,
  }), [filtrosQuery]);

  // Queries
  const { data: usuariosData, isLoading } = useUsuarios(queryParams);
  const usuarios = usuariosData?.data || [];
  const resumen = usuariosData?.resumen || {};
  const { data: profesionalesDisponibles = [] } = useProfesionalesSinUsuario();

  // Mutations
  const cambiarEstadoMutation = useCambiarEstadoUsuario();
  const cambiarRolMutation = useCambiarRolUsuario();
  const vincularMutation = useVincularProfesionalAUsuario();

  // Handlers
  const handleNuevo = () => {
    // Refetch para obtener datos actualizados
    refetchLimite().then(({ data }) => {
      const limite = data || limiteData;

      // Si no puede crear (hard limit), mostrar error
      if (limite && !limite.puedeCrear) {
        toast.error(limite.advertencia || 'No puedes crear más usuarios con tu plan actual');
        return;
      }

      // Si hay costo adicional (soft limit), mostrar confirmación
      if (limite?.costoAdicional > 0) {
        openModal('limiteConfirm', limite);
        return;
      }

      // Sin restricciones, abrir formulario directamente
      openModal('form', null);
    });
  };

  const handleConfirmarCostoAdicional = () => {
    closeModal('limiteConfirm');
    openModal('form', null);
  };

  const handleEditar = (usuario) => openModal('form', usuario);

  const handleToggleActivo = (usuario) => {
    const type = usuario.activo ? 'desactivar' : 'activar';
    openModal('confirm', usuario, {
      type,
      title: usuario.activo ? 'Desactivar usuario' : 'Activar usuario',
      message: usuario.activo
        ? `¿Desactivar a "${usuario.nombre}"? ${usuario.profesional_id ? 'También se desactivará su perfil de profesional.' : ''}`
        : `¿Activar a "${usuario.nombre}"? ${usuario.profesional_id ? 'También se activará su perfil de profesional.' : ''}`,
    });
  };

  const handleCambiarRol = async (usuario, nuevoRol) => {
    if (nuevoRol === usuario.rol_codigo) return;
    try {
      await cambiarRolMutation.mutateAsync({ id: usuario.id, rol: nuevoRol });
      toast.success(`Rol cambiado a ${ROLES_USUARIO[nuevoRol]?.label}`);
    } catch (error) {
      toast.error(error.message || 'Error al cambiar rol');
    }
  };

  const confirmarAccion = async () => {
    const confirmProps = getModalProps('confirm');
    const usuario = confirmProps.data;
    const actionType = confirmProps.type;
    if (!usuario) return;

    try {
      if (actionType === 'desactivar' || actionType === 'activar') {
        const nuevoEstado = actionType === 'activar';
        await cambiarEstadoMutation.mutateAsync({ id: usuario.id, activo: nuevoEstado });
        toast.success(nuevoEstado ? 'Usuario activado' : 'Usuario desactivado');
      } else if (actionType === 'desvincular') {
        await vincularMutation.mutateAsync({ id: usuario.id, profesionalId: null });
        toast.success('Profesional desvinculado');
      }
      closeModal('confirm');
    } catch (err) {
      toast.error(err.message || 'Error al realizar la acción');
    }
  };

  const handleVincularProfesional = async (usuarioId, profesionalId) => {
    try {
      await vincularMutation.mutateAsync({
        id: usuarioId,
        profesionalId: profesionalId ? parseInt(profesionalId) : null,
      });
      toast.success(profesionalId ? 'Profesional vinculado' : 'Profesional desvinculado');
      setVinculandoUsuario(null);
    } catch (error) {
      toast.error(error.message || 'Error al vincular profesional');
    }
  };

  const handleDesvincular = (usuario) => {
    openModal('confirm', usuario, {
      type: 'desvincular',
      title: 'Desvincular profesional',
      message: `¿Desvincular el profesional "${usuario.profesional_nombre}" de este usuario?`,
    });
  };

  // Stats
  const stats = useMemo(() => [
    { label: 'Total', value: resumen.total_usuarios || usuarios.length, icon: Users, color: 'primary' },
    { label: 'Activos', value: resumen.usuarios_activos || usuarios.filter(u => u.activo).length, icon: UserCheck, color: 'green' },
    { label: 'Bloqueados', value: resumen.usuarios_bloqueados || 0, icon: UserX, color: 'yellow' },
  ], [resumen, usuarios]);

  const getRolBadgeColor = (rol) => {
    const colors = { admin: 'purple', empleado: 'green' };
    return colors[rol] || 'gray';
  };

  const isFiltered = hasFiltrosActivos;

  // Handler para ver detalle
  const handleVerDetalle = (usuarioId) => {
    navigate(`/configuracion/usuarios/${usuarioId}`);
  };

  // Contexto compartido para UsuarioRow (reduce prop drilling)
  const contextValue = useMemo(() => ({
    onCambiarRol: handleCambiarRol,
    onDesvincular: handleDesvincular,
    onVincular: handleVincularProfesional,
    onVerDetalle: handleVerDetalle,
    vinculandoUsuario,
    setVinculandoUsuario,
    profesionalesDisponibles,
    getRolBadgeColor,
    cambiarRolMutation,
    cambiarEstadoMutation,
  }), [vinculandoUsuario, profesionalesDisponibles, cambiarRolMutation, cambiarEstadoMutation, navigate]);

  return (
    <UsuariosContext.Provider value={contextValue}>
      <ConfiguracionPageLayout
        icon={Users}
        title="Usuarios"
        subtitle="Gestiona el acceso al sistema"
        actions={
          <Button onClick={handleNuevo} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        }
      >
        <div className="max-w-6xl mx-auto">
          <StatCardGrid stats={stats} columns={3} className="mb-6" />

          <ConfigSearchBar
            value={filtros.buscar}
            onChange={(value) => setFiltro('buscar', value)}
            placeholder="Buscar por nombre o email..."
            filters={[
              { name: 'rol', value: filtros.rol, onChange: (value) => setFiltro('rol', value), options: FILTROS_ROL, placeholder: 'Todos los roles' },
              { name: 'estado', value: filtros.activo, onChange: (value) => setFiltro('activo', value), options: FILTROS_ESTADO, placeholder: 'Todos' },
            ]}
          />

          {/* Lista de usuarios */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : usuarios.length === 0 ? (
              <ConfigEmptyState
                icon={Users}
                title="No hay usuarios"
                description="Crea el primer usuario para comenzar a gestionar accesos"
                actionLabel="Crear primer usuario"
                onAction={handleNuevo}
                isFiltered={isFiltered}
              />
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {usuarios.map((usuario) => (
                  <UsuarioRow
                    key={usuario.id}
                    usuario={usuario}
                    onEdit={() => handleEditar(usuario)}
                    onToggleActivo={() => handleToggleActivo(usuario)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <UsuarioFormDrawer
          isOpen={isOpen('form')}
          onClose={() => closeModal('form')}
          mode={getModalData('form') ? 'edit' : 'create'}
          usuario={getModalData('form')}
        />

        <ConfirmDialog
          isOpen={isOpen('confirm')}
          onClose={() => closeModal('confirm')}
          title={getModalProps('confirm').title}
          message={getModalProps('confirm').message}
          confirmText={
            getModalProps('confirm').type === 'desactivar' ? 'Desactivar' :
            getModalProps('confirm').type === 'activar' ? 'Activar' : 'Confirmar'
          }
          variant={getModalProps('confirm').type === 'desactivar' ? 'danger' : 'default'}
          onConfirm={confirmarAccion}
          isLoading={cambiarEstadoMutation.isPending || vincularMutation.isPending}
        />

        {/* Modal de confirmación de costo adicional (soft limit) */}
        <ConfirmDialog
          isOpen={isOpen('limiteConfirm')}
          onClose={() => closeModal('limiteConfirm')}
          title="Usuario adicional"
          message={
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Cobro adicional
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    {getModalData('limiteConfirm')?.advertencia ||
                      `Se agregarán $${getModalData('limiteConfirm')?.costoAdicional?.toFixed(2) || '0.00'} MXN/mes a tu próxima factura.`}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tu plan incluye {getModalData('limiteConfirm')?.detalle?.usuariosIncluidos || 0} usuarios.
                Actualmente tienes {getModalData('limiteConfirm')?.detalle?.usuariosActuales || 0}.
              </p>
            </div>
          }
          confirmText="Continuar"
          cancelText="Cancelar"
          onConfirm={handleConfirmarCostoAdicional}
        />
      </ConfiguracionPageLayout>
    </UsuariosContext.Provider>
  );
}

/**
 * Fila de usuario individual
 * Usa UsuariosContext para reducir prop drilling (de 12 props a 3)
 */
function UsuarioRow({ usuario, onEdit, onToggleActivo }) {
  const {
    onCambiarRol,
    onDesvincular,
    onVincular,
    onVerDetalle,
    vinculandoUsuario,
    setVinculandoUsuario,
    profesionalesDisponibles,
    getRolBadgeColor,
    cambiarRolMutation,
    cambiarEstadoMutation,
  } = useUsuariosContext();

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold
          ${usuario.activo ? 'bg-primary-500' : 'bg-gray-400'}
        `}>
          {usuario.nombre?.[0]?.toUpperCase() || 'U'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {usuario.nombre} {usuario.apellidos || ''}
            </span>

            <select
              value={usuario.rol_codigo}
              onChange={(e) => onCambiarRol(usuario, e.target.value)}
              disabled={cambiarRolMutation.isPending}
              className={`
                appearance-none cursor-pointer text-xs font-medium px-2 py-1 rounded-full
                bg-${getRolBadgeColor(usuario.rol_codigo)}-100 text-${getRolBadgeColor(usuario.rol_codigo)}-700
                dark:bg-${getRolBadgeColor(usuario.rol_codigo)}-900/40 dark:text-${getRolBadgeColor(usuario.rol_codigo)}-400
                border-0 focus:ring-2 focus:ring-primary-500
              `}
            >
              {Object.entries(ROLES_USUARIO).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            {!usuario.activo && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                Inactivo
              </span>
            )}
            {usuario.esta_bloqueado && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                Bloqueado
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {usuario.email}
            </span>
            {usuario.telefono && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {usuario.telefono}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Profesional:</span>
            {usuario.profesional_id ? (
              <div className="flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {usuario.profesional_nombre}
                </span>
                <button
                  onClick={() => onDesvincular(usuario)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                  title="Desvincular profesional"
                >
                  <Link2Off className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : vinculandoUsuario === usuario.id ? (
              <select
                autoFocus
                onChange={(e) => onVincular(usuario.id, e.target.value)}
                onBlur={() => setVinculandoUsuario(null)}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              >
                <option value="">Seleccionar...</option>
                {profesionalesDisponibles.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_completo}</option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setVinculandoUsuario(usuario.id)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <Link2 className="w-3.5 h-3.5" />
                Vincular
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleActivo}
            disabled={cambiarEstadoMutation.isPending}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${usuario.activo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
            `}
            title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
          >
            <span className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
              transition duration-200 ease-in-out
              ${usuario.activo ? 'translate-x-5' : 'translate-x-0'}
            `} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => onVerDetalle(usuario.id)} title="Ver detalle">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
        </div>
      </div>
    </div>
  );
}

export default UsuariosPage;
