/**
 * ====================================================================
 * TAB DIRECCION - Cliente Form Drawer
 * ====================================================================
 *
 * Contiene: Campos de direccion estructurada
 *
 * Enero 2026
 */

import { memo } from 'react';
import { MapPin } from 'lucide-react';
import { FormGroup, Input, Select } from '@/components/ui';
import { useEstadosMexico } from '@/hooks/otros';

/**
 * Tab de direccion del cliente
 */
const ClienteFormDireccionTab = memo(function ClienteFormDireccionTab({
  register,
  errors,
}) {
  // Cargar estados de Mexico
  const { data: estadosData } = useEstadosMexico();
  const estados = estadosData?.estados || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Direccion
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Informacion opcional para envios y facturacion.
        </p>

        <FormGroup label="Calle y numero" error={errors.calle?.message}>
          <Input
            {...register('calle')}
            placeholder="Av. Principal #123, Int. 4"
            hasError={!!errors.calle}
          />
        </FormGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Colonia" error={errors.colonia?.message}>
            <Input
              {...register('colonia')}
              placeholder="Centro"
              hasError={!!errors.colonia}
            />
          </FormGroup>

          <FormGroup label="Codigo Postal" error={errors.codigo_postal?.message}>
            <Input
              {...register('codigo_postal')}
              placeholder="12345"
              maxLength={5}
              hasError={!!errors.codigo_postal}
            />
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Ciudad" error={errors.ciudad?.message}>
            <Input
              {...register('ciudad')}
              placeholder="Ciudad de Mexico"
              hasError={!!errors.ciudad}
            />
          </FormGroup>

          <FormGroup label="Estado" error={errors.estado_id?.message}>
            <Select
              {...register('estado_id')}
              placeholder="Seleccionar estado"
              options={estados.map((e) => ({
                value: e.id.toString(),
                label: e.nombre,
              }))}
              hasError={!!errors.estado_id}
            />
          </FormGroup>
        </div>

        <FormGroup label="Pais" error={errors.pais_id?.message}>
          <Select
            {...register('pais_id')}
            options={[
              { value: '1', label: 'Mexico' },
              { value: '2', label: 'Estados Unidos' },
              { value: '3', label: 'Canada' },
            ]}
            hasError={!!errors.pais_id}
          />
        </FormGroup>
      </div>
    </div>
  );
});

export default ClienteFormDireccionTab;
