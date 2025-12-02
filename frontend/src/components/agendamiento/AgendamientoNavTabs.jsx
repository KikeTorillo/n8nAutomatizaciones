import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Lock, Bell } from 'lucide-react';

/**
 * Tabs de navegación para el módulo de Agendamiento
 * Permite navegar entre Citas, Bloqueos y Recordatorios
 */
const tabs = [
  {
    id: 'citas',
    label: 'Citas',
    path: '/citas',
    icon: Calendar,
  },
  {
    id: 'bloqueos',
    label: 'Bloqueos',
    path: '/bloqueos',
    icon: Lock,
  },
  {
    id: 'recordatorios',
    label: 'Recordatorios',
    path: '/recordatorios',
    icon: Bell,
  },
];

export default function AgendamientoNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="flex border-b border-gray-200 bg-gray-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors
              border-b-2 -mb-[1px]
              ${active
                ? 'text-indigo-600 border-indigo-600 bg-white'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
