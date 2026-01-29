/**
 * ====================================================================
 * PÁGINA - UsuarioDetailPage
 * ====================================================================
 *
 * Página de detalle de usuario con tabs:
 * - Información general
 * - Ubicaciones de almacén asignadas
 *
 * Ene 2026
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Edit2,
  ArrowLeft,
  Link2,
  Building2,
  Clock,
} from 'lucide-react';
import { Button, LoadingSpinner, Badge } from '@/components/ui';
import { ConfiguracionPageLayout } from '@/components/configuracion';
import { useUsuario, ROLES_USUARIO, ESTADOS_USUARIO } from '@/hooks/personas';
import { useModalManager } from '@/hooks/utils';
import UsuarioFormDrawer from '@/components/usuarios/UsuarioFormDrawer';
import UsuarioUbicacionesTab from '@/components/usuarios/UsuarioUbicacionesTab';
import { useAuth } from '@/hooks/sistema/useAuth';

/**
 * Página de detalle de usuario
 */
function UsuarioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Estado para tab activo
  const [activeTab, setActiveTab] = useState('info');

  // Modales
  const { openModal, closeModal, isOpen } = useModalManager({
    edit: { isOpen: false },
  });

  // Fetch data
  const { data: usuario, isLoading } = useUsuario(id);

  // Verificar si puede editar (admin/propietario)
  const canEdit = currentUser?.nivel_jerarquia >= 80;

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <ConfiguracionPageLayout
        icon={User}
        title="Cargando..."
        hideSectionHeader
      >
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      </ConfiguracionPageLayout>
    );
  }

  if (!usuario) {
    return (
      <ConfiguracionPageLayout
        icon={User}
        title="Usuario no encontrado"
        hideSectionHeader
      >
        <div className="flex flex-col items-center justify-center py-16">
          <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Usuario no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            El usuario que buscas no existe o fue eliminado
          </p>
          <Button onClick={() => navigate('/configuracion/usuarios')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Usuarios
          </Button>
        </div>
      </ConfiguracionPageLayout>
    );
  }

  const rolConfig = ROLES_USUARIO[usuario.rol_codigo] || { label: usuario.rol_nombre || 'Sin rol', color: 'gray' };
  const estadoConfig = ESTADOS_USUARIO[usuario.activo ? 'activo' : 'inactivo'];

  return (
    <ConfiguracionPageLayout
      icon={User}
      title={`${usuario.nombre} ${usuario.apellidos || ''}`}
      subtitle={usuario.email}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/configuracion/usuarios')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          {canEdit && (
            <Button onClick={() => openModal('edit')}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda - Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card de perfil */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Avatar y estado */}
              <div className="flex flex-col items-center mb-6">
                <div className={`
                  w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3
                  ${usuario.activo ? 'bg-primary-500' : 'bg-gray-400'}
                `}>
                  {usuario.nombre?.[0]?.toUpperCase() || 'U'}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {usuario.nombre} {usuario.apellidos || ''}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={rolConfig.color}>{rolConfig.label}</Badge>
                  <Badge variant={estadoConfig.color}>{estadoConfig.label}</Badge>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{usuario.email}</p>
                    {usuario.email_verificado && (
                      <span className="text-xs text-green-600 dark:text-green-400">Verificado</span>
                    )}
                  </div>
                </div>

                {usuario.telefono && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{usuario.telefono}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Miembro desde</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(usuario.creado_en)}</p>
                  </div>
                </div>

                {usuario.ultimo_login && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Último acceso</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(usuario.ultimo_login)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card de vinculaciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Vinculaciones
              </h3>

              <div className="space-y-4">
                {/* Profesional vinculado */}
                <div className="flex items-start gap-3">
                  <Link2 className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profesional</p>
                    {usuario.profesional_id ? (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {usuario.profesional_nombre || `ID: ${usuario.profesional_id}`}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-500">Sin vincular</p>
                    )}
                  </div>
                </div>

                {/* Permisos/Rol */}
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nivel de acceso</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nivel {usuario.nivel_jerarquia || 'N/A'} - {rolConfig.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Tabs */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'info'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <User className="w-4 h-4 inline-block mr-2" />
                    Información
                  </button>
                  <button
                    onClick={() => setActiveTab('ubicaciones')}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'ubicaciones'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4 inline-block mr-2" />
                    Ubicaciones
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Información adicional
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Zona horaria</p>
                          <p className="text-gray-900 dark:text-gray-100">
                            {usuario.zona_horaria || 'America/Mexico_City'}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Idioma</p>
                          <p className="text-gray-900 dark:text-gray-100">
                            {usuario.idioma === 'es' ? 'Español' : usuario.idioma || 'Español'}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Intentos fallidos</p>
                          <p className="text-gray-900 dark:text-gray-100">
                            {usuario.intentos_fallidos || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado de bloqueo</p>
                          <p className={`${usuario.esta_bloqueado ? 'text-red-600' : 'text-green-600'}`}>
                            {usuario.esta_bloqueado ? 'Bloqueado' : 'Sin bloqueo'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actividad reciente (placeholder) */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Actividad reciente
                      </h3>
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Historial de actividad próximamente</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ubicaciones' && (
                  <UsuarioUbicacionesTab usuarioId={parseInt(id)} canEdit={canEdit} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Editar Usuario */}
      <UsuarioFormDrawer
        isOpen={isOpen('edit')}
        onClose={() => closeModal('edit')}
        mode="edit"
        usuario={usuario}
      />
    </ConfiguracionPageLayout>
  );
}

export default UsuarioDetailPage;
