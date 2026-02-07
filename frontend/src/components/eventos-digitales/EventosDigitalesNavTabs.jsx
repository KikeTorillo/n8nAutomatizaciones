import { PartyPopper, Palette } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

const NAV_ITEMS = [
  { id: 'eventos', label: 'Eventos', icon: PartyPopper, path: '/eventos-digitales' },
  { id: 'plantillas', label: 'Plantillas', icon: Palette, path: '/eventos-digitales/plantillas' },
];

export default function EventosDigitalesNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/eventos-digitales"
      fallbackLabel="Eventos Digitales"
      fallbackIcon={PartyPopper}
    />
  );
}
