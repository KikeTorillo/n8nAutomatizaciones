import { createModuleLayout } from '@/components/ui/templates';
import EventosDigitalesNavTabs from './EventosDigitalesNavTabs';

const EventosDigitalesPageLayout = createModuleLayout({
  moduleTitle: 'Eventos Digitales',
  moduleDescription:
    'Crea invitaciones digitales para bodas, XV años, bautizos y más',
  NavTabsComponent: EventosDigitalesNavTabs,
});

export default EventosDigitalesPageLayout;
