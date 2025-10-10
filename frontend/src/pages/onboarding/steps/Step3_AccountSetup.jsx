import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { accountSetupSchema } from '@/lib/validations';
import { organizacionesApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import useAuthStore from '@/store/authStore';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

/**
 * Paso 3: Crear Cuenta (Registro + Autenticación)
 */
function Step3_AccountSetup() {
  const { formData, updateFormData, setIds, nextStep, prevStep } = useOnboardingStore();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSetupSchema),
    defaultValues: {
      ...formData.account,
      password_confirm: '',
      terminos: false,
    },
  });

  // Mutación para crear organización y usuario mediante endpoint de registro
  const createAccountMutation = useMutation({
    mutationFn: async (data) => {
      // Separar nombre y apellidos (asegurar que apellidos tenga al menos 2 caracteres)
      const nombrePartes = data.nombre_completo.trim().split(/\s+/);
      const nombre = nombrePartes[0] || 'Usuario';
      const apellidos = nombrePartes.slice(1).join(' ') || 'Sin Apellido';

      // Preparar datos según formato del backend
      const registroData = {
        organizacion: {
          nombre_comercial: formData.businessInfo.nombre_comercial,
          razon_social: formData.businessInfo.nombre_fiscal || formData.businessInfo.nombre_comercial,
          rfc: formData.businessInfo.rfc_nif || null,
          tipo_industria: formData.businessInfo.industria || 'otro',
          plan: formData.plan.plan_codigo || 'basico',  // ✅ Usar código del plan directamente
          telefono_principal: formData.businessInfo.telefono_principal || null,
          email_contacto: data.email,
        },
        admin: {
          nombre,
          apellidos,
          email: data.email,
          password: data.password,
          telefono: formData.businessInfo.telefono_principal || null,
        },
        aplicar_plantilla_servicios: true,
        enviar_email_bienvenida: false,
      };

      // DEBUG: Mostrar datos que se van a enviar
      console.log('📤 Datos a enviar al backend:', registroData);
      console.log('📋 FormData completo:', formData);
      console.log('🎯 Plan seleccionado:', {
        codigo: formData.plan.plan_codigo,
        nombre: formData.plan.plan_nombre,
        precio: formData.plan.plan_precio
      });

      // Llamar al endpoint de registro público
      const response = await organizacionesApi.register(registroData);

      console.log('✅ Respuesta del backend:', response.data);

      return response.data.data; // { organizacion, admin: { id, nombre, apellidos, email, rol, token }, servicios_creados }
    },
    onSuccess: (data) => {
      // Construir objeto de usuario a partir de la respuesta
      const user = {
        id: data.admin.id,
        nombre: data.admin.nombre,
        apellidos: data.admin.apellidos,
        email: data.admin.email,
        rol: data.admin.rol,
        organizacion_id: data.organizacion.id,
      };

      // Guardar tokens y usuario en authStore
      setAuth({
        user,
        accessToken: data.admin.token,
        refreshToken: data.admin.token, // El backend retorna un solo token
      });

      // Guardar IDs en onboardingStore
      setIds({
        organizacion_id: data.organizacion.id,
        usuario_id: data.admin.id,
      });

      // Avanzar al siguiente paso
      nextStep();
    },
    onError: (error) => {
      console.error('❌ Error en registro:', error);

      const errorMsg = error.message || 'Error al crear la cuenta';
      const errorData = error.data || {};

      // Si es error de email duplicado
      if (errorMsg.includes('email') || errorMsg.includes('correo')) {
        setError('email', {
          type: 'manual',
          message: 'Este email ya está registrado',
        });
      }
      // Si es error de validación 400
      else if (error.status === 400) {
        console.error('📋 Detalles del error de validación:', errorData);
        alert(`Error de validación: ${errorMsg}\n\nRevisa la consola para más detalles.`);
      }
      // Otros errores
      else {
        alert(`Error: ${errorMsg}`);
      }
    },
  });

  const onSubmit = (data) => {
    updateFormData('account', {
      email: data.email,
      nombre_completo: data.nombre_completo,
    });

    createAccountMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Crea tu Cuenta
        </h2>
        <p className="text-gray-600">
          Configura tus credenciales de acceso
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="nombre_completo"
          control={control}
          label="Nombre Completo"
          placeholder="Ej: Juan Pérez"
          required
        />

        <FormField
          name="email"
          control={control}
          type="email"
          label="Email"
          placeholder="tu@email.com"
          required
          helper="Este será tu usuario para iniciar sesión"
        />

        <div className="relative">
          <FormField
            name="password"
            control={control}
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            placeholder="••••••••"
            required
            helper="Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <FormField
            name="password_confirm"
            control={control}
            type={showPasswordConfirm ? 'text' : 'password'}
            label="Confirmar Contraseña"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Términos y condiciones */}
        <div className="flex items-start">
          <input
            type="checkbox"
            {...control.register?.('terminos')}
            className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label className="ml-2 text-sm text-gray-600">
            Acepto los{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Términos y Condiciones
            </a>{' '}
            y la{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Política de Privacidad
            </a>
          </label>
        </div>
        {errors.terminos && (
          <p className="text-sm text-red-600">{errors.terminos.message}</p>
        )}

        {/* Botones */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={createAccountMutation.isPending}
          >
            Anterior
          </Button>
          <Button
            type="submit"
            isLoading={createAccountMutation.isPending}
            disabled={createAccountMutation.isPending}
          >
            {createAccountMutation.isPending ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Step3_AccountSetup;
