import { createModuleLayout } from '@/components/ui/templates';
import AgendamientoNavTabs from './AgendamientoNavTabs';

const AgendamientoPageLayout = createModuleLayout({
  moduleTitle: 'Agendamiento',
  moduleDescription: 'Gestiona citas y recordatorios',
  NavTabsComponent: AgendamientoNavTabs,
});

export default AgendamientoPageLayout;
