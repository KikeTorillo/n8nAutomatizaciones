/**
 * Página de Gestión de Roles
 * Sistema de roles dinámicos por organización
 * @version 1.0.0
 * @date Enero 2026
 */

import { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Users,
  ChevronDown,
  ChevronRight,
  Crown,
  UserCog,
  User,
  Bot,
  Lock,
  Check,
  X,
  Search,
  Settings,
} from 'lucide-react';

import { Button, Input, Badge, Modal } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/organisms';
import { ConfigPageHeader } from '@/components/configuracion';
import {
  useRoles,
  useCrearRol,
  useActualizarRol,
  useEliminarRol,
  usePermisosRol,
  useActualizarPermisoRol,
  useCopiarPermisosRol,
} from '@/hooks/sistema/useRoles';

// Iconos por código de rol
const ICONOS_ROL = {
  super_admin: Shield,
  admin: UserCog,
  propietario: Crown,
  empleado: User,
  cliente: Users,
  bot: Bot,
};

/**
 * Componente de formulario para crear/editar rol
 */
function RolFormModal({ isOpen, onClose, rol = null, onSave }) {
  const [formData, setFormData] = useState({
    codigo: rol?.codigo || '',
    nombre: rol?.nombre || '',
    descripcion: rol?.descripcion || '',
    nivel_jerarquia: rol?.nivel_jerarquia || 10,
    bypass_permisos: rol?.bypass_permisos || false,
    puede_crear_usuarios: rol?.puede_crear_usuarios || false,
    puede_modificar_permisos: rol?.puede_modificar_permisos || false,
    color: rol?.color || '#6B7280',
    icono: rol?.icono || 'user',
    activo: rol?.activo ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!rol;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código *
            </label>
            <Input
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              placeholder="gerente_ventas"
              disabled={isEditing && !rol?.es_rol_sistema === false}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Solo letras, números y guiones bajos</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Gerente de Ventas"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción del rol y sus responsabilidades..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel Jerárquico (1-89)
            </label>
            <Input
              type="number"
              min={1}
              max={89}
              value={formData.nivel_jerarquia}
              onChange={(e) => setFormData({ ...formData, nivel_jerarquia: parseInt(e.target.value) || 10 })}
            />
            <p className="text-xs text-gray-500 mt-1">Mayor = más privilegios (90+ reservado)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-14 rounded cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#6B7280"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.bypass_permisos}
              onChange={(e) => setFormData({ ...formData, bypass_permisos: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Bypass de permisos</strong> - No verifica permisos granulares (acceso total)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.puede_crear_usuarios}
              onChange={(e) => setFormData({ ...formData, puede_crear_usuarios: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Puede crear e invitar usuarios
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.puede_modificar_permisos}
              onChange={(e) => setFormData({ ...formData, puede_modificar_permisos: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Puede modificar permisos de otros usuarios
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Tarjeta de rol
 */
function RolCard({ rol, onEdit, onDelete, onCopyPermisos }) {
  const IconComponent = ICONOS_ROL[rol.codigo] || User;
  const cantidadUsuarios = rol.usuarios_count || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: rol.color + '20' }}
          >
            <IconComponent className="w-5 h-5" style={{ color: rol.color }} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {rol.nombre}
              {rol.es_rol_sistema && (
                <Badge variant="secondary" size="sm">Sistema</Badge>
              )}
              {rol.bypass_permisos && (
                <Badge variant="warning" size="sm">Bypass</Badge>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rol.codigo} • Nivel {rol.nivel_jerarquia}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!rol.es_rol_sistema && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyPermisos(rol)}
                title="Copiar permisos a este rol"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(rol)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rol)}
                disabled={cantidadUsuarios > 0}
                title={cantidadUsuarios > 0 ? `No se puede eliminar: ${cantidadUsuarios} usuario(s) asignado(s)` : 'Eliminar rol'}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </div>

      {rol.descripcion && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {rol.descripcion}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {cantidadUsuarios} usuario{cantidadUsuarios !== 1 ? 's' : ''}
        </span>
        {rol.puede_crear_usuarios && (
          <span className="flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Crea usuarios
          </span>
        )}
        {rol.puede_modificar_permisos && (
          <span className="flex items-center gap-1">
            <Settings className="w-3 h-3" />
            Modifica permisos
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Página principal de Roles
 */
function RolesPage() {
  const [showFormModal, setShowFormModal] = useState(false);
  const [rolEditando, setRolEditando] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rolAEliminar, setRolAEliminar] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [rolDestinoCopy, setRolDestinoCopy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const { data: rolesData, isLoading } = useRoles({ incluir_sistema: 'true' });
  const roles = rolesData || [];

  // Mutations
  const crearRolMutation = useCrearRol();
  const actualizarRolMutation = useActualizarRol();
  const eliminarRolMutation = useEliminarRol();
  const copiarPermisosMutation = useCopiarPermisosRol();

  // Filtrar roles por búsqueda
  const rolesFiltrados = useMemo(() => {
    if (!searchTerm) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(
      rol => rol.nombre?.toLowerCase().includes(term) ||
             rol.codigo?.toLowerCase().includes(term) ||
             rol.descripcion?.toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  // Separar roles de sistema y de organización
  const { rolesSistema, rolesOrganizacion } = useMemo(() => {
    const sistema = rolesFiltrados.filter(r => r.es_rol_sistema);
    const org = rolesFiltrados.filter(r => !r.es_rol_sistema);
    return { rolesSistema: sistema, rolesOrganizacion: org };
  }, [rolesFiltrados]);

  // Handlers
  const handleCrear = () => {
    setRolEditando(null);
    setShowFormModal(true);
  };

  const handleEditar = (rol) => {
    setRolEditando(rol);
    setShowFormModal(true);
  };

  const handleEliminar = (rol) => {
    setRolAEliminar(rol);
    setShowDeleteConfirm(true);
  };

  const handleCopyPermisos = (rol) => {
    setRolDestinoCopy(rol);
    setShowCopyModal(true);
  };

  const handleSaveRol = async (formData) => {
    try {
      if (rolEditando) {
        await actualizarRolMutation.mutateAsync({ id: rolEditando.id, data: formData });
      } else {
        await crearRolMutation.mutateAsync(formData);
      }
      setShowFormModal(false);
      setRolEditando(null);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (!rolAEliminar) return;
    try {
      await eliminarRolMutation.mutateAsync(rolAEliminar.id);
      setShowDeleteConfirm(false);
      setRolAEliminar(null);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const handleConfirmCopy = async (rolOrigenId) => {
    if (!rolDestinoCopy || !rolOrigenId) return;
    try {
      await copiarPermisosMutation.mutateAsync({
        rolDestinoId: rolDestinoCopy.id,
        rolOrigenId,
      });
      setShowCopyModal(false);
      setRolDestinoCopy(null);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  return (
    <div className="space-y-6">
      <ConfigPageHeader
        title="Roles"
        subtitle="Gestiona los roles de tu organización y sus permisos"
        icon={Shield}
        actions={
          <Button onClick={handleCrear}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Rol
          </Button>
        }
      />

      {/* Barra de búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar roles..."
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Cargando roles...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Roles de la Organización */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Roles de la Organización
              <Badge variant="secondary">{rolesOrganizacion.length}</Badge>
            </h2>
            {rolesOrganizacion.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                No hay roles personalizados. Crea uno nuevo para empezar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rolesOrganizacion.map(rol => (
                  <RolCard
                    key={rol.id}
                    rol={rol}
                    onEdit={handleEditar}
                    onDelete={handleEliminar}
                    onCopyPermisos={handleCopyPermisos}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Roles de Sistema (solo lectura) */}
          {rolesSistema.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Roles de Sistema
                <Badge variant="outline">{rolesSistema.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                {rolesSistema.map(rol => (
                  <RolCard
                    key={rol.id}
                    rol={rol}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onCopyPermisos={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de formulario */}
      {showFormModal && (
        <RolFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setRolEditando(null);
          }}
          rol={rolEditando}
          onSave={handleSaveRol}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setRolAEliminar(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Rol"
        message={`¿Estás seguro de eliminar el rol "${rolAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={eliminarRolMutation.isPending}
      />

      {/* Modal para copiar permisos */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          setRolDestinoCopy(null);
        }}
        title={`Copiar permisos a "${rolDestinoCopy?.nombre}"`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecciona el rol del cual copiar los permisos. Los permisos actuales de "{rolDestinoCopy?.nombre}" serán reemplazados.
          </p>
          <div className="space-y-2">
            {rolesOrganizacion
              .filter(r => r.id !== rolDestinoCopy?.id)
              .map(rol => (
                <button
                  key={rol.id}
                  onClick={() => handleConfirmCopy(rol.id)}
                  disabled={copiarPermisosMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: rol.color + '20' }}
                  >
                    <User className="w-4 h-4" style={{ color: rol.color }} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{rol.nombre}</div>
                    <div className="text-xs text-gray-500">{rol.codigo}</div>
                  </div>
                </button>
              ))}
          </div>
          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowCopyModal(false);
                setRolDestinoCopy(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RolesPage;
