import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  MessageSquare,
  Calendar,
  Clock,
  Settings,
  UserX,
  Mail,
  Phone,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import HorariosProfesionalModal from '@/components/profesionales/HorariosProfesionalModal';
import ServiciosProfesionalModal from '@/components/profesionales/ServiciosProfesionalModal';
import { ESTADOS_LABORALES, TIPOS_CONTRATACION } from '@/hooks/useProfesionales';

/**
 * Header sticky para la página de detalle del profesional
 * Muestra foto, nombre, badges y acciones rápidas
 */
function ProfesionalHeader({ profesional }) {
  const navigate = useNavigate();
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isHorariosModalOpen, setIsHorariosModalOpen] = useState(false);
  const [isServiciosModalOpen, setIsServiciosModalOpen] = useState(false);

  // Obtener info del estado
  const estadoInfo = ESTADOS_LABORALES[profesional.estado] || { label: profesional.estado, color: 'gray' };
  const tipoInfo = TIPOS_CONTRATACION[profesional.tipo_contratacion] || { label: profesional.tipo_contratacion };

  // Obtener iniciales para avatar fallback
  const getInitials = () => {
    if (!profesional.nombre_completo) return '??';
    const parts = profesional.nombre_completo.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  // Mapeo de colores para badges de estado
  const getEstadoClasses = () => {
    const colorMap = {
      green: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      red: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
      gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
    };
    return colorMap[estadoInfo.color] || colorMap.gray;
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profesionales')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Profesionales
            </Button>
          </div>

          {/* Header Content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-4">
              {/* Avatar con color del calendario */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 overflow-hidden"
                style={{
                  borderColor: profesional.color_calendario || '#753572',
                  backgroundColor: profesional.foto_url ? 'transparent' : (profesional.color_calendario || '#753572'),
                }}
              >
                {profesional.foto_url ? (
                  <img
                    src={profesional.foto_url}
                    alt={profesional.nombre_completo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>

              {/* Info */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profesional.nombre_completo}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profesional.puesto_nombre || 'Sin puesto'}
                  {profesional.departamento_nombre && ` • ${profesional.departamento_nombre}`}
                </p>
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoClasses()}`}>
                    {estadoInfo.label}
                  </span>
                  {tipoInfo.label && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                      {tipoInfo.label}
                    </span>
                  )}
                  {profesional.fecha_ingreso && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                      Desde {new Date(profesional.fecha_ingreso).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Contacto rápido */}
              {profesional.email && (
                <a
                  href={`mailto:${profesional.email}`}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Enviar email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
              {profesional.telefono && (
                <a
                  href={`tel:${profesional.telefono}`}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Llamar"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}

              {/* Botones principales */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHorariosModalOpen(true)}
                className="hidden sm:flex"
              >
                <Clock className="w-4 h-4 mr-2" />
                Horarios
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsServiciosModalOpen(true)}
                className="hidden sm:flex"
              >
                <Settings className="w-4 h-4 mr-2" />
                Servicios
              </Button>

              {/* Menu de acciones */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {showActionsMenu && (
                  <>
                    {/* Overlay para cerrar */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActionsMenu(false)}
                    />
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                      <button
                        onClick={() => {
                          navigate(`/citas?profesional=${profesional.id}`);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Ver Calendario
                      </button>
                      <button
                        onClick={() => {
                          setIsHorariosModalOpen(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 sm:hidden"
                      >
                        <Clock className="w-4 h-4" />
                        Gestionar Horarios
                      </button>
                      <button
                        onClick={() => {
                          setIsServiciosModalOpen(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 sm:hidden"
                      >
                        <Settings className="w-4 h-4" />
                        Asignar Servicios
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          // TODO: Implementar desactivación
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <UserX className="w-4 h-4" />
                        Desactivar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <HorariosProfesionalModal
        isOpen={isHorariosModalOpen}
        onClose={() => setIsHorariosModalOpen(false)}
        profesional={profesional}
      />
      <ServiciosProfesionalModal
        isOpen={isServiciosModalOpen}
        onClose={() => setIsServiciosModalOpen(false)}
        profesional={profesional}
      />
    </>
  );
}

export default ProfesionalHeader;
