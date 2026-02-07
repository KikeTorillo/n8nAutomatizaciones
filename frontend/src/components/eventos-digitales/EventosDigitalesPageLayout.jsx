import { createModuleLayout } from '@/components/ui/templates';
import EventosDigitalesNavTabs from './EventosDigitalesNavTabs';

export default createModuleLayout({
  moduleTitle: 'Eventos Digitales',
  moduleDescription: 'Crea invitaciones digitales para bodas, XV años, bautizos y más',
  NavTabsComponent: EventosDigitalesNavTabs,
});
