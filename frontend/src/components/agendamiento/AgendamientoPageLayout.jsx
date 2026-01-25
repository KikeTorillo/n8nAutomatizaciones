import { createModuleLayout } from '@/components/ui/templates';
import AgendamientoNavTabs from './AgendamientoNavTabs';

export default createModuleLayout({
  moduleTitle: 'Agendamiento',
  moduleDescription: 'Gestiona citas y recordatorios',
  NavTabsComponent: AgendamientoNavTabs,
});
