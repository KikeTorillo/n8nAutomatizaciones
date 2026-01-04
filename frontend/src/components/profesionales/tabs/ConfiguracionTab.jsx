import { useState } from 'react';
import {
  Settings,
  Clock,
  Briefcase,
  UserCheck,
  Key,
  Globe,
  CreditCard,
  Mail,
  Send,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import InfoCard from '@/components/profesionales/cards/InfoCard';
import EditableField from '@/components/profesionales/cards/EditableField';
import QuickEditDrawer from '@/components/profesionales/cards/QuickEditDrawer';
import HorariosProfesionalModal from '@/components/profesionales/HorariosProfesionalModal';
import ServiciosProfesionalModal from '@/components/profesionales/ServiciosProfesionalModal';
import OnboardingProgresoSection from '@/components/profesionales/OnboardingProgresoSection';
import useAuthStore from '@/store/authStore';

/**
 * Tab Configuración del profesional
 * Muestra horarios, servicios, acceso al sistema y onboarding
 */
function ConfiguracionTab({ profesional }) {
  const [editModal, setEditModal] = useState(null);
  const [isHorariosModalOpen, setIsHorariosModalOpen] = useState(false);
  const [isServiciosModalOpen, setIsServiciosModalOpen] = useState(false);
  const { user } = useAuthStore();

  // Verificar si puede gestionar acceso
  const puedeGestionarAcceso = ['admin', 'propietario', 'super_admin'].includes(user?.rol);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Horarios */}
        <InfoCard
          title="Horarios de Atención"
          icon={Clock}
          headerActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHorariosModalOpen(true)}
            >
              Gestionar
            </Button>
          }
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Configura los horarios en los que este profesional está disponible para citas.</p>
            <div className="mt-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {profesional.total_horarios || 0}
              </span>
              {' horarios configurados'}
            </div>
          </div>
        </InfoCard>

        {/* Card: Servicios */}
        <InfoCard
          title="Servicios Asignados"
          icon={Briefcase}
          headerActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsServiciosModalOpen(true)}
            >
              Gestionar
            </Button>
          }
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Gestiona los servicios que puede ofrecer este profesional.</p>
            <div className="mt-3">
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {profesional.total_servicios_asignados || 0}
              </span>
              {' servicios asignados'}
            </div>
          </div>
        </InfoCard>

        {/* Card: Acceso al Sistema */}
        <InfoCard
          title="Acceso al Sistema"
          icon={UserCheck}
        >
          {profesional.usuario_id ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Usuario vinculado
                </span>
              </div>
              <EditableField
                label="Email de acceso"
                value={profesional.usuario_email}
              />
              <EditableField
                label="Rol en el sistema"
                value={profesional.usuario_rol}
                renderValue={(rol) => {
                  const roles = {
                    admin: 'Administrador',
                    propietario: 'Propietario',
                    empleado: 'Empleado',
                  };
                  return roles[rol] || rol;
                }}
              />
            </>
          ) : (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Este profesional no tiene acceso al sistema.
              </p>
              {puedeGestionarAcceso && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Abrir modal de invitación
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Invitación
                </Button>
              )}
            </div>
          )}
        </InfoCard>

        {/* Card: Configuración del Sistema */}
        <InfoCard
          title="Sistema"
          icon={Settings}
          onEdit={() => setEditModal('sistema')}
        >
          <EditableField
            label="Zona horaria"
            value={profesional.zona_horaria}
            emptyText="Zona horaria del sistema"
            onEdit={() => setEditModal('sistema')}
          />
          <EditableField
            label="Código NIP"
            value={profesional.codigo_nip}
            renderValue={(val) => val ? '••••' : null}
            emptyText="Sin NIP"
            onEdit={() => setEditModal('sistema')}
          />
          <EditableField
            label="ID de credencial"
            value={profesional.id_credencial}
            emptyText="Sin credencial"
            onEdit={() => setEditModal('sistema')}
          />
        </InfoCard>
      </div>

      {/* Onboarding */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <OnboardingProgresoSection profesionalId={profesional.id} />
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

      <QuickEditDrawer
        isOpen={editModal === 'sistema'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Configuración del Sistema"
        fields={[
          { name: 'zona_horaria', label: 'Zona horaria', type: 'text', placeholder: 'America/Mexico_City' },
          { name: 'codigo_nip', label: 'Código NIP', type: 'text', placeholder: '1234' },
          { name: 'id_credencial', label: 'ID de credencial', type: 'text' },
        ]}
        initialValues={{
          zona_horaria: profesional.zona_horaria || '',
          codigo_nip: profesional.codigo_nip || '',
          id_credencial: profesional.id_credencial || '',
        }}
      />
    </div>
  );
}

export default ConfiguracionTab;
