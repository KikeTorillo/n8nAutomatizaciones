import BasePageLayout from '@/components/ui/BasePageLayout';
import AgendamientoNavTabs from './AgendamientoNavTabs';

/**
 * AgendamientoPageLayout - Layout wrapper para todas las páginas del módulo Agendamiento
 *
 * Usa BasePageLayout con configuración específica de Agendamiento.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la sección
 * @param {string} props.title - Título de la sección
 * @param {string} [props.subtitle] - Subtítulo o descripción
 * @param {React.ReactNode} [props.actions] - Botones de acción
 * @param {React.ReactNode} props.children - Contenido principal
 * @param {string} [props.className] - Clases adicionales
 */
export default function AgendamientoPageLayout({ icon, title, subtitle, actions, children, className }) {
  return (
    <BasePageLayout
      moduleTitle="Agendamiento"
      moduleDescription="Gestiona citas y recordatorios"
      navTabs={<AgendamientoNavTabs />}
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
