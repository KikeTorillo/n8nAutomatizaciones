import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Users,
  UserCheck,
  Edit2,
  Star,
  Package,
  Briefcase,
  Plus,
} from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import {
  SucursalFormDrawer,
  SucursalUsuariosModal,
  SucursalProfesionalesModal,
  SucursalesPageLayout,
} from '@/components/sucursales';
import {
  useSucursal,
  useUsuariosSucursal,
  useProfesionalesSucursal,
} from '@/hooks/sistema';
import { useModalManager } from '@/hooks/utils';

// Mapeo de dias de la semana
const DIAS_SEMANA = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mie',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sab',
  domingo: 'Dom',
};

/**
 * Pagina de detalle de sucursal
 * Muestra informacion completa y permite gestionar usuarios/profesionales
 */
function SucursalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado para tab activo
  const [activeTab, setActiveTab] = useState('usuarios');

  // Modales centralizados
  const { openModal, closeModal, isOpen } = useModalManager({
    edit: { isOpen: false },
    usuarios: { isOpen: false },
    profesionales: { isOpen: false },
  });

  // Fetch data
  const { data: sucursal, isLoading: isLoadingSucursal } = useSucursal(id);
  const { data: usuarios = [], isLoading: isLoadingUsuarios } = useUsuariosSucursal(id);
  const { data: profesionales = [], isLoading: isLoadingProfesionales } =
    useProfesionalesSucursal(id);

  if (isLoadingSucursal) {
    return (
      <SucursalesPageLayout
        icon={Building2}
        title="Cargando..."
        hideSectionHeader
      >
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      </SucursalesPageLayout>
    );
  }

  if (!sucursal) {
    return (
      <SucursalesPageLayout
        icon={Building2}
        title="Sucursal no encontrada"
        hideSectionHeader
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Sucursal no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La sucursal que buscas no existe o fue eliminada
          </p>
          <Button onClick={() => navigate('/sucursales')}>
            Volver a Sucursales
          </Button>
        </div>
      </SucursalesPageLayout>
    );
  }

  // Formatear horario
  const formatHorario = () => {
    if (!sucursal.horario_apertura || !sucursal.horario_cierre) return null;
    return `${sucursal.horario_apertura} - ${sucursal.horario_cierre}`;
  };

  // Formatear dias laborales
  const formatDiasLaborales = () => {
    if (!sucursal.dias_laborales || sucursal.dias_laborales.length === 0) return null;
    return sucursal.dias_laborales.map((dia) => DIAS_SEMANA[dia] || dia).join(', ');
  };

  return (
    <SucursalesPageLayout
      icon={Building2}
      title={sucursal.nombre}
      subtitle={sucursal.codigo ? `Codigo: ${sucursal.codigo}` : undefined}
      actions={
        <div className="flex items-center gap-2">
          {sucursal.es_matriz && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
              <Star className="w-3 h-3 mr-1" />
              Matriz
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              sucursal.activo
                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}
          >
            {sucursal.activo ? 'Activa' : 'Inactiva'}
          </span>
          <Button onClick={() => openModal('edit')} className="ml-2">
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de informacion */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Informacion
            </h2>

            <div className="space-y-4">
              {/* Ubicacion */}
              {(sucursal.direccion ||
                sucursal.ciudad_nombre ||
                sucursal.estado_nombre) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ubicacion
                    </p>
                    {sucursal.direccion && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {sucursal.direccion}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {[sucursal.ciudad_nombre, sucursal.estado_nombre]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {sucursal.codigo_postal && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        CP: {sucursal.codigo_postal}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Telefono */}
              {sucursal.telefono && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Telefono
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {sucursal.telefono}
                    </p>
                  </div>
                </div>
              )}

              {/* Email */}
              {sucursal.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {sucursal.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Horario */}
              {formatHorario() && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Horario
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatHorario()}
                    </p>
                  </div>
                </div>
              )}

              {/* Dias laborales */}
              {formatDiasLaborales() && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dias laborales
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDiasLaborales()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card de configuracion */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Configuracion
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Inventario compartido
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    sucursal.inventario_compartido
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {sucursal.inventario_compartido ? 'Si' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Servicios heredados
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    sucursal.servicios_heredados
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {sucursal.servicios_heredados ? 'Si' : 'No'}
                </span>
              </div>

              {sucursal.zona_horaria && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Zona horaria
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {sucursal.zona_horaria}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card de estadisticas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Estadisticas
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Users className="w-6 h-6 mx-auto text-primary-600 dark:text-primary-400 mb-2" />
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  {usuarios.length}
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400">Usuarios</p>
              </div>
              <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <UserCheck className="w-6 h-6 mx-auto text-primary-600 dark:text-primary-400 mb-2" />
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  {profesionales.length}
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400">Profesionales</p>
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
                  onClick={() => setActiveTab('usuarios')}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'usuarios'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 inline-block mr-2" />
                  Usuarios ({usuarios.length})
                </button>
                <button
                  onClick={() => setActiveTab('profesionales')}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'profesionales'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <UserCheck className="w-4 h-4 inline-block mr-2" />
                  Profesionales ({profesionales.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'usuarios' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Usuarios asignados
                    </h3>
                    <Button size="sm" onClick={() => openModal('usuarios')}>
                      <Plus className="w-4 h-4 mr-1" />
                      Asignar Usuario
                    </Button>
                  </div>

                  {isLoadingUsuarios ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : usuarios.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No hay usuarios asignados a esta sucursal
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => openModal('usuarios')}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Asignar primer usuario
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {usuarios.map((usuario) => (
                        <div
                          key={usuario.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                {usuario.nombre?.charAt(0)}
                                {usuario.apellido?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {usuario.nombre} {usuario.apellido}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {usuario.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {usuario.es_gerente && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300">
                                Gerente
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                usuario.activo
                                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {usuario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profesionales' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Profesionales asignados
                    </h3>
                    <Button size="sm" onClick={() => openModal('profesionales')}>
                      <Plus className="w-4 h-4 mr-1" />
                      Asignar Profesional
                    </Button>
                  </div>

                  {isLoadingProfesionales ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : profesionales.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No hay profesionales asignados a esta sucursal
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => openModal('profesionales')}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Asignar primer profesional
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profesionales.map((profesional) => (
                        <div
                          key={profesional.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                              style={{
                                backgroundColor:
                                  profesional.color_calendario || '#753572',
                              }}
                            >
                              {profesional.nombre?.charAt(0)}
                              {profesional.apellidos?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {profesional.nombre} {profesional.apellidos}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {profesional.tipo_nombre || 'Sin tipo asignado'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                profesional.activo
                                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {profesional.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Editar Sucursal */}
      <SucursalFormDrawer
        isOpen={isOpen('edit')}
        onClose={() => closeModal('edit')}
        mode="edit"
        sucursal={sucursal}
      />

      {/* Modal de Usuarios */}
      <SucursalUsuariosModal
        isOpen={isOpen('usuarios')}
        onClose={() => closeModal('usuarios')}
        sucursalId={parseInt(id, 10)}
        usuariosAsignados={usuarios}
      />

      {/* Modal de Profesionales */}
      <SucursalProfesionalesModal
        isOpen={isOpen('profesionales')}
        onClose={() => closeModal('profesionales')}
        sucursalId={parseInt(id, 10)}
        profesionalesAsignados={profesionales}
      />
    </SucursalesPageLayout>
  );
}

export default SucursalDetailPage;
