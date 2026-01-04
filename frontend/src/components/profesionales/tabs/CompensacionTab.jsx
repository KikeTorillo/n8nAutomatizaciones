import { useState } from 'react';
import { Wallet, Lock, AlertCircle } from 'lucide-react';
import InfoCard from '@/components/profesionales/cards/InfoCard';
import EditableField from '@/components/profesionales/cards/EditableField';
import QuickEditDrawer from '@/components/profesionales/cards/QuickEditDrawer';
import CuentasBancariasSection from '@/components/profesionales/CuentasBancariasSection';
import { FORMAS_PAGO } from '@/hooks/useProfesionales';
import { useCategoriasPagoOptions } from '@/hooks/useCategoriasPago';
import { useCurrency } from '@/hooks/useCurrency';
import useAuthStore from '@/store/authStore';

/**
 * Tab Compensación del profesional
 * Muestra salario, forma de pago y cuentas bancarias
 * Solo visible para admin/propietario
 */
function CompensacionTab({ profesional }) {
  const [editModal, setEditModal] = useState(null);
  const { user } = useAuthStore();
  const { formatCurrency } = useCurrency();
  const { data: categoriasPago = [] } = useCategoriasPagoOptions();

  // Verificar si puede ver compensación
  const puedeVerCompensacion = ['admin', 'propietario', 'super_admin'].includes(user?.rol);

  // Si no tiene permisos, mostrar mensaje
  if (!puedeVerCompensacion) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Acceso restringido
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              No tienes permisos para ver la información de compensación.
              Contacta a un administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advertencia de confidencialidad */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-primary-800 dark:text-primary-200">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            Esta información es confidencial. Solo administradores y propietarios pueden verla.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Compensación */}
        <InfoCard
          title="Compensación"
          icon={Wallet}
          onEdit={() => setEditModal('compensacion')}
        >
          <EditableField
            label="Salario base"
            value={profesional.salario_base}
            renderValue={(val) => val ? formatCurrency(val) : null}
            onEdit={() => setEditModal('compensacion')}
          />
          <EditableField
            label="Forma de pago"
            value={profesional.forma_pago}
            renderValue={(val) => FORMAS_PAGO[val]?.label || val}
            onEdit={() => setEditModal('compensacion')}
          />
          <EditableField
            label="Categoría de pago"
            value={profesional.categoria_pago_nombre || profesional.categoria_pago_id}
            emptyText="Sin categoría asignada"
            onEdit={() => setEditModal('compensacion')}
          />
        </InfoCard>
      </div>

      {/* Cuentas Bancarias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <CuentasBancariasSection profesionalId={profesional.id} />
      </div>

      {/* Modal de edición */}
      <QuickEditDrawer
        isOpen={editModal === 'compensacion'}
        onClose={() => setEditModal(null)}
        profesionalId={profesional.id}
        title="Editar Compensación"
        fields={[
          { name: 'salario_base', label: 'Salario base', type: 'number', min: 0 },
          {
            name: 'forma_pago',
            label: 'Forma de pago',
            type: 'select',
            options: Object.entries(FORMAS_PAGO).map(([value, { label }]) => ({
              value,
              label,
            })),
          },
          {
            name: 'categoria_pago_id',
            label: 'Categoría de pago',
            type: 'select',
            options: Array.isArray(categoriasPago) ? categoriasPago.map((c) => ({ value: c.id, label: c.nombre })) : [],
          },
        ]}
        initialValues={{
          salario_base: profesional.salario_base || '',
          forma_pago: profesional.forma_pago || '',
          categoria_pago_id: profesional.categoria_pago_id || '',
        }}
      />
    </div>
  );
}

export default CompensacionTab;
