import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, UserPlus, ShoppingCart, Package, Bell } from 'lucide-react';
import { useModulos } from '@/hooks/useModulos';

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

  // Definir acciones disponibles
  const actions = [
    {
      id: 'nueva-cita',
      label: 'Nueva Cita',
      icon: Calendar,
      path: '/citas',
      color: 'bg-blue-500 hover:bg-blue-600',
      enabled: tieneAgendamiento,
    },
    {
      id: 'nuevo-cliente',
      label: 'Nuevo Cliente',
      icon: UserPlus,
      path: '/clientes/nuevo',
      color: 'bg-green-500 hover:bg-green-600',
      enabled: tieneAgendamiento,
    },
    {
      id: 'nueva-venta',
      label: 'Nueva Venta',
      icon: ShoppingCart,
      path: '/pos/venta',
      color: 'bg-purple-500 hover:bg-purple-600',
      enabled: tienePOS,
    },
    {
      id: 'nuevo-producto',
      label: 'Nuevo Producto',
      icon: Package,
      path: '/inventario/productos',
      color: 'bg-orange-500 hover:bg-orange-600',
      enabled: tieneInventario,
    },
    {
      id: 'recordatorios',
      label: 'Recordatorios',
      icon: Bell,
      path: '/configuracion/recordatorios',
      color: 'bg-cyan-500 hover:bg-cyan-600',
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
