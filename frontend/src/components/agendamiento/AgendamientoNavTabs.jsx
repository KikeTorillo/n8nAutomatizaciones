import { Calendar, Bell } from 'lucide-react';
import GenericNavTabs from '@/components/ui/GenericNavTabs';

/**
 * Definición de items de navegación para Agendamiento
 * Nota: Bloqueos se movió a /ausencias?tab=otros-bloqueos (Ene 2026)
 */
const NAV_ITEMS = [
  { id: 'citas', label: 'Citas', icon: Calendar, path: '/citas' },
  { id: 'recordatorios', label: 'Recordatorios', icon: Bell, path: '/recordatorios' },
];

/**
 * AgendamientoNavTabs - Navegación principal del módulo Agendamiento
 * Usa GenericNavTabs en modo flat
 */
export default function AgendamientoNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/citas"
      fallbackLabel="Agendamiento"
      fallbackIcon={Calendar}
    />
  );
}
