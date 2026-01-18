import { Input, FormGroup, Textarea } from '@/components/ui';

/**
 * Tab de información general de la promoción
 * Código, nombre, descripción, prioridad
 */
export default function PromocionFormGeneralTab({ register, errors }) {
  return (
    <div className="space-y-4">
      {/* Código y nombre */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Código" error={errors.codigo?.message}>
          <Input
            placeholder="PROMO2X1"
            {...register('codigo', { required: 'Código requerido' })}
            hasError={!!errors.codigo}
            className="uppercase"
          />
        </FormGroup>
        <FormGroup label="Nombre" error={errors.nombre?.message}>
          <Input
            placeholder="2x1 en bebidas"
            {...register('nombre', { required: 'Nombre requerido' })}
            hasError={!!errors.nombre}
          />
        </FormGroup>
      </div>

      {/* Descripción */}
      <FormGroup label="Descripción (opcional)">
        <Textarea
          {...register('descripcion')}
          rows={2}
          placeholder="Descripción de la promoción para el equipo..."
        />
      </FormGroup>

      {/* Prioridad */}
      <FormGroup label="Prioridad" helper="Mayor número = mayor prioridad. Las promociones exclusivas de mayor prioridad se aplican primero.">
        <Input
          type="number"
          placeholder="0"
          {...register('prioridad')}
        />
      </FormGroup>
    </div>
  );
}
