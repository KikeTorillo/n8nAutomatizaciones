import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, UserPlus, ShoppingCart, Package, Bell } from 'lucide-react';
import { useModulos } from '@/hooks/sistema';

/**
 * QuickActions - Accesos rápidos contextuales basados en módulos activos
 */
function QuickActions() {
  const navigate = useNavigate();
  const {
    tieneAgendamiento,
    tieneInventario,
    tienePOS,
    tieneChatbots,
  } = useModulos();

  // Color unificado de Nexo para todos los accesos rápidos
  const nexoButtonColor = 'bg-primary-600 hover:bg-primary-700';

  // Definir acciones disponibles
  const actions = [
    {
      id: 'nueva-cita',
      label: 'Nueva Cita',
      icon: Calendar,
      path: '/citas',
      color: nexoButtonColor,
      enabled: tieneAgendamiento,
    },
    {
      id: 'nuevo-cliente',
      label: 'Nuevo Cliente',
      icon: UserPlus,
      path: '/clientes/nuevo',
      color: nexoButtonColor,
      enabled: tieneAgendamiento,
    },
    {
      id: 'nueva-venta',
      label: 'Nueva Venta',
      icon: ShoppingCart,
      path: '/pos/venta',
      color: nexoButtonColor,
      enabled: tienePOS,
    },
    {
      id: 'nuevo-producto',
      label: 'Nuevo Producto',
      icon: Package,
      path: '/inventario/productos',
      color: nexoButtonColor,
      enabled: tieneInventario,
    },
    {
      id: 'recordatorios',
      label: 'Recordatorios',
      icon: Bell,
      path: '/recordatorios',
      color: nexoButtonColor,
      enabled: tieneChatbots,
    },
  ];

  // Filtrar solo acciones habilitadas
  const enabledActions = actions.filter((action) => action.enabled);

  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">
        Accesos Rápidos
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        {enabledActions.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.path)}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 rounded-full
              text-white font-medium text-sm
              ${action.color}
              transition-all duration-200 hover:shadow-md hover:scale-105
            `}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
