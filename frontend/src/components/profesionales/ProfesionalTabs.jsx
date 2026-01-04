import {
  User,
  Briefcase,
  Heart,
  GraduationCap,
  FileText,
  Wallet,
  Settings,
} from 'lucide-react';

// Mapeo de iconos por tab
const TAB_ICONS = {
  general: User,
  trabajo: Briefcase,
  personal: Heart,
  curriculum: GraduationCap,
  documentos: FileText,
  compensacion: Wallet,
  configuracion: Settings,
};

/**
 * Navegación de tabs para la página de detalle del profesional
 * Soporta scroll horizontal en móvil para los 7 tabs
 */
function ProfesionalTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[140px] z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex overflow-x-auto scrollbar-hide -mb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.id] || User;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors min-w-fit
                  ${isActive
                    ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.substring(0, 3)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default ProfesionalTabs;
