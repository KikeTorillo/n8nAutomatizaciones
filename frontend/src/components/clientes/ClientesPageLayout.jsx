import BasePageLayout from '@/components/ui/BasePageLayout';
import ClientesNavTabs from './ClientesNavTabs';

/**
 * ClientesPageLayout - Layout wrapper para todas las páginas del módulo Clientes
 *
 * Usa BasePageLayout con configuración específica de Clientes.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la sección
 * @param {string} props.title - Título de la sección
 * @param {string} [props.subtitle] - Subtítulo o contador
 * @param {React.ReactNode} [props.actions] - Botones de acción
 * @param {React.ReactNode} props.children - Contenido principal
 * @param {string} [props.className] - Clases adicionales
 */
export default function ClientesPageLayout({ icon, title, subtitle, actions, children, className }) {
  return (
    <BasePageLayout
      moduleTitle="Clientes"
      moduleDescription="Gestiona tu base de clientes y relaciones comerciales"
      navTabs={<ClientesNavTabs />}
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
