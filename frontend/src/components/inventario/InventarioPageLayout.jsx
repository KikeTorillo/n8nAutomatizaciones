import { BasePageLayout } from '@/components/ui';
import InventarioNavTabs from './InventarioNavTabs';

/**
 * InventarioPageLayout - Layout wrapper para todas las páginas del módulo Inventario
 *
 * Usa BasePageLayout con configuración específica de Inventario.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la sección
 * @param {string} props.title - Título de la sección (ej: "Productos")
 * @param {string} [props.subtitle] - Subtítulo o contador
 * @param {React.ReactNode} [props.actions] - Botones de acción
 * @param {React.ReactNode} props.children - Contenido principal
 * @param {string} [props.className] - Clases adicionales
 */
export default function InventarioPageLayout({ icon, title, subtitle, actions, children, className }) {
  return (
    <BasePageLayout
      moduleTitle="Inventario"
      moduleDescription="Gestiona productos, proveedores y stock"
      navTabs={<InventarioNavTabs />}
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
