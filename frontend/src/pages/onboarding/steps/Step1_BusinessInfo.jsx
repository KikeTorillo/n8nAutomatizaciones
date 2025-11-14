import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { businessInfoSchema } from '@/lib/validations';
import { INDUSTRIAS } from '@/lib/constants';
import useOnboardingStore from '@/store/onboardingStore';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { Building2 } from 'lucide-react';

/**
 * Paso 1: Información del Negocio
 */
function Step1_BusinessInfo() {
  const { formData, updateFormData, nextStep } = useOnboardingStore();

  const {
    control,
    handleSubmit,
  } = useForm({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: formData.businessInfo,
  });

  const onSubmit = (data) => {
    updateFormData('businessInfo', data);
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Información del Negocio
        </h2>
        <p className="text-gray-600">
          Cuéntanos sobre tu negocio para personalizar la experiencia
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="nombre_comercial"
          control={control}
          label="Nombre Comercial"
          placeholder="Ej: Barbería El Clásico"
          required
          helper="El nombre con el que tus clientes te conocen"
        />

        <FormField
          name="nombre_fiscal"
          control={control}
          label="Nombre Fiscal (Opcional)"
          placeholder="Ej: Barbería El Clásico S.A.S."
          helper="El nombre legal de tu empresa (si aplica)"
        />

        <FormField
          name="industria"
          control={control}
          label="Industria"
          placeholder="Selecciona tu industria"
          options={INDUSTRIAS}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="pais"
            control={control}
            label="País"
            placeholder="Ej: México"
            required
          />

          <FormField
            name="ciudad"
            control={control}
            label="Ciudad"
            placeholder="Ej: Ciudad de México"
            required
          />
        </div>

        <FormField
          name="telefono_principal"
          control={control}
          type="tel"
          label="Teléfono Principal"
          placeholder="Ej: 5512345678"
          maxLength={10}
          required
          helper="10 dígitos (ej: 5512345678)"
        />

        {/* Botones */}
        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg">
            Continuar
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Step1_BusinessInfo;
