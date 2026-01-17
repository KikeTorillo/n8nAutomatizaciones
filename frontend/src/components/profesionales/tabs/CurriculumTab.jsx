import EducacionFormalSection from '@/components/profesionales/EducacionFormalSection';
import ExperienciaLaboralSection from '@/components/profesionales/ExperienciaLaboralSection';
import HabilidadesSection from '@/components/profesionales/HabilidadesSection';
import useAuthStore, { selectUser } from '@/store/authStore';

/**
 * Tab Currículum del profesional
 * Integra Educación, Experiencia Laboral y Habilidades
 */
function CurriculumTab({ profesional }) {
  const user = useAuthStore(selectUser);

  // Verificar si puede verificar habilidades (admin/propietario)
  const puedeVerificar = ['admin', 'propietario', 'super_admin'].includes(user?.rol);

  return (
    <div className="space-y-6">
      {/* Educación Formal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <EducacionFormalSection profesionalId={profesional.id} />
      </div>

      {/* Experiencia Laboral */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <ExperienciaLaboralSection profesionalId={profesional.id} />
      </div>

      {/* Habilidades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <HabilidadesSection
          profesionalId={profesional.id}
          canVerify={puedeVerificar}
        />
      </div>
    </div>
  );
}

export default CurriculumTab;
