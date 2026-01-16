import BasePageLayout from '@/components/ui/BasePageLayout';
import ProfesionalesNavTabs from './ProfesionalesNavTabs';

/**
 * ProfesionalesPageLayout - Layout wrapper para todas las páginas del módulo Profesionales
 *
 * Usa BasePageLayout con configuración específica de Profesionales.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la sección
 * @param {string} props.title - Título de la sección
 * @param {string} [props.subtitle] - Subtítulo o contador
 * @param {React.ReactNode} [props.actions] - Botones de acción
 * @param {React.ReactNode} props.children - Contenido principal
 * @param {string} [props.className] - Clases adicionales
 */
export default function ProfesionalesPageLayout({ icon, title, subtitle, actions, children, className }) {
  return (
    <BasePageLayout
      moduleTitle="Profesionales"
      moduleDescription="Gestiona los profesionales de tu negocio"
      navTabs={<ProfesionalesNavTabs />}
      sectionIcon={icon}
      sectionTitle={title}
      sectionSubtitle={subtitle}
      actions={actions}
      className={className}
    >
      {children}
    </BasePageLayout>
  );
}
