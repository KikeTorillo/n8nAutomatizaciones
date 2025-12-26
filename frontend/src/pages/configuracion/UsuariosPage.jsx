/**
 * ====================================================================
 * PÁGINA - UsuariosPage
 * ====================================================================
 *
 * Gestión de usuarios estilo Odoo (res.users)
 * Modelo separado de profesionales (hr.employee)
 * Fase 5.2 - Diciembre 2025
 */

import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  User,
  Mail,
  Phone,
  Loader2,
  Link2,
  Link2Off,
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import {
  useUsuarios,
  useCambiarEstadoUsuario,
  useCambiarRolUsuario,
  useVincularProfesionalAUsuario,
  useProfesionalesSinUsuario,
  ROLES_USUARIO,
  ESTADOS_USUARIO,
} from '@/hooks/useUsuarios';
import UsuarioFormDrawer from '@/components/usuarios/UsuarioFormDrawer';

// ====================================================================
// CONSTANTES
// ====================================================================

const FILTROS_ROL = [
  { value: '', label: 'Todos los roles' },
  { value: 'admin', label: 'Administrador' },
  { value: 'propietario', label: 'Propietario' },
  { value: 'empleado', label: 'Empleado' },
];

const FILTROS_ESTADO = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

// ====================================================================
// COMPONENTE
// ====================================================================

function UsuariosPage() {
  const toast = useToast();

  // Estados locales
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [vinculandoUsuario, setVinculandoUsuario] = useState(null);

  // Query params
  const queryParams = useMemo(() => ({
    buscar: searchTerm || undefined,
    rol: filtroRol || undefined,
    activo: filtroEstado || undefined,
    limit: 100,
  }), [searchTerm, filtroRol, filtroEstado]);

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
    setEditingUsuario(null);
    setDrawerOpen(true);
  };

  const handleEditar = (usuario) => {
    setEditingUsuario(usuario);
    setDrawerOpen(true);
  };

  const handleToggleActivo = (usuario) => {
    setConfirmAction({
      type: usuario.activo ? 'desactivar' : 'activar',
      usuario,
      title: usuario.activo ? 'Desactivar usuario' : 'Activar usuario',
      message: usuario.activo
        ? `¿Desactivar a "${usuario.nombre}"? ${usuario.profesional_id ? 'También se desactivará su perfil de profesional.' : ''}`
        : `¿Activar a "${usuario.nombre}"? ${usuario.profesional_id ? 'También se activará su perfil de profesional.' : ''}`,
    });
  };

  const handleCambiarRol = async (usuario, nuevoRol) => {
    if (nuevoRol === usuario.rol) return;

    try {
      await cambiarRolMutation.mutateAsync({ id: usuario.id, rol: nuevoRol });
      toast.success(`Rol cambiado a ${ROLES_USUARIO[nuevoRol]?.label}`);
    } catch (error) {
      toast.error(error.message || 'Error al cambiar rol');
    }
  };

  const confirmarAccion = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'desactivar' || confirmAction.type === 'activar') {
        const nuevoEstado = confirmAction.type === 'activar';
        await cambiarEstadoMutation.mutateAsync({
          id: confirmAction.usuario.id,
          activo: nuevoEstado,
        });
        toast.success(nuevoEstado ? 'Usuario activado' : 'Usuario desactivado');
      } else if (confirmAction.type === 'desvincular') {
        await vincularMutation.mutateAsync({
          id: confirmAction.usuario.id,
          profesionalId: null,
        });
        toast.success('Profesional desvinculado');
      }
      setConfirmAction(null);
    } catch (error) {
      toast.error(error.message || 'Error al realizar la acción');
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
    setConfirmAction({
      type: 'desvincular',
      usuario,
      title: 'Desvincular profesional',
      message: `¿Desvincular el profesional "${usuario.profesional_nombre}" de este usuario?`,
    });
  };

  // Obtener color del badge de rol
  const getRolBadgeColor = (rol) => {
    const colors = {
      admin: 'purple',
      propietario: 'blue',
      empleado: 'green',
    };
    return colors[rol] || 'gray';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/configuracion" label="Configuración" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Usuarios
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestiona el acceso al sistema
                </p>
              </div>
            </div>
            <Button onClick={handleNuevo} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {resumen.total_usuarios || usuarios.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {resumen.usuarios_activos || usuarios.filter(u => u.activo).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <UserX className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {resumen.usuarios_bloqueados || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bloqueados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              {FILTROS_ROL.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              {FILTROS_ESTADO.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No hay usuarios que coincidan con los filtros
              </p>
              <Button onClick={handleNuevo} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer usuario
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold
                      ${usuario.activo ? 'bg-primary-500' : 'bg-gray-400'}
                    `}>
                      {usuario.nombre?.[0]?.toUpperCase() || 'U'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {usuario.nombre} {usuario.apellidos || ''}
                        </span>

                        {/* Badge de rol (editable) */}
                        <div className="relative group">
                          <select
                            value={usuario.rol}
                            onChange={(e) => handleCambiarRol(usuario, e.target.value)}
                            disabled={cambiarRolMutation.isPending}
                            className={`
                              appearance-none cursor-pointer
                              text-xs font-medium px-2 py-1 rounded-full
                              bg-${getRolBadgeColor(usuario.rol)}-100 text-${getRolBadgeColor(usuario.rol)}-700
                              dark:bg-${getRolBadgeColor(usuario.rol)}-900/40 dark:text-${getRolBadgeColor(usuario.rol)}-400
                              border-0 focus:ring-2 focus:ring-primary-500
                            `}
                          >
                            {Object.entries(ROLES_USUARIO).map(([value, config]) => (
                              <option key={value} value={value}>{config.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Estado */}
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

                      {/* Email y teléfono */}
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

                      {/* Profesional vinculado */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Profesional:
                        </span>
                        {usuario.profesional_id ? (
                          <div className="flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {usuario.profesional_nombre}
                            </span>
                            <button
                              onClick={() => handleDesvincular(usuario)}
                              className="ml-1 text-gray-400 hover:text-red-500"
                              title="Desvincular profesional"
                            >
                              <Link2Off className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : vinculandoUsuario === usuario.id ? (
                          <select
                            autoFocus
                            onChange={(e) => handleVincularProfesional(usuario.id, e.target.value)}
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

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      {/* Toggle activo */}
                      <button
                        onClick={() => handleToggleActivo(usuario)}
                        disabled={cambiarEstadoMutation.isPending}
                        className={`
                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                          ${usuario.activo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                        `}
                        title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        <span
                          className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                            transition duration-200 ease-in-out
                            ${usuario.activo ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </button>

                      {/* Botón editar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditar(usuario)}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Drawer Form */}
      <UsuarioFormDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingUsuario(null);
        }}
        mode={editingUsuario ? 'edit' : 'create'}
        usuario={editingUsuario}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={
          confirmAction?.type === 'desactivar' ? 'Desactivar' :
          confirmAction?.type === 'activar' ? 'Activar' :
          'Confirmar'
        }
        variant={confirmAction?.type === 'desactivar' ? 'danger' : 'default'}
        onConfirm={confirmarAccion}
        isLoading={cambiarEstadoMutation.isPending || vincularMutation.isPending}
      />
    </div>
  );
}

export default UsuariosPage;
