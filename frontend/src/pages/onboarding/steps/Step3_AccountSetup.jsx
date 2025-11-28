import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { accountSetupSchema } from '@/lib/validations';
import { organizacionesApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import useAuthStore from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

/**
 * Paso 3: Crear Cuenta (Modelo Free/Pro - Nov 2025)
 * Registro + Autenticación automática
 */
function Step3_AccountSetup() {
  const navigate = useNavigate();
  const { formData, updateFormData, setIds, prevStep, resetOnboarding } = useOnboardingStore();
  const { setAuth } = useAuthStore();
  const toast = useToast();
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

  // Obtener información del plan para mostrar
  const planSeleccionado = formData.plan;

  // Mutación para crear organización y usuario mediante endpoint de registro
  const createAccountMutation = useMutation({
    mutationFn: async (data) => {
      // Separar nombre y apellidos (asegurar que apellidos tenga al menos 2 caracteres)
      const nombrePartes = data.nombre_completo.trim().split(/\s+/);
      const nombre = nombrePartes[0] || 'Usuario';
      const apellidos = nombrePartes.slice(1).join(' ') || 'Sin Apellido';

      // Sanitizar campos opcionales (convertir "" a undefined para omitir del payload)
      const nombre_fiscal_sanitized = formData.businessInfo.nombre_fiscal?.trim();

      // Mapeo de códigos de industria a IDs (Nov 2025: migrado a tabla dinámica)
      // Los IDs corresponden al seed de categorias-agendamiento.sql
      const industriaCodigoToId = {
        'barberia': 1,
        'salon_belleza': 2,
        'estetica': 3,
        'spa': 4,
        'podologia': 5,
        'consultorio_medico': 6,
        'academia': 7,
        'taller_tecnico': 8,
        'centro_fitness': 9,
        'veterinaria': 10,
        'otro': 11,
        'clinica_dental': 6,
      };

      const categoriaId = industriaCodigoToId[formData.businessInfo.industria] || 11;

      // Construir datos para el registro (Modelo Free/Pro Nov 2025)
      const registroData = {
        organizacion: {
          nombre_comercial: formData.businessInfo.nombre_comercial,
          razon_social: nombre_fiscal_sanitized || formData.businessInfo.nombre_comercial,
          categoria_id: categoriaId,
          plan: planSeleccionado.plan_codigo || 'trial',
          // Si es Plan Free, enviar la app seleccionada
          app_seleccionada: planSeleccionado.plan_codigo === 'free'
            ? planSeleccionado.app_seleccionada
            : null,
          telefono_principal: formData.businessInfo.telefono_principal,
          email_contacto: data.email,
          // Ubicación geográfica (Nov 2025 - Catálogo normalizado)
          estado_id: formData.businessInfo.estado_id
            ? parseInt(formData.businessInfo.estado_id)
            : undefined,
          ciudad_id: formData.businessInfo.ciudad_id
            ? parseInt(formData.businessInfo.ciudad_id)
            : undefined,
        },
        admin: {
          nombre,
          apellidos,
          email: data.email,
          password: data.password,
          telefono: formData.businessInfo.telefono_principal || undefined,
        },
        aplicar_plantilla_servicios: true,
        enviar_email_bienvenida: false,
      };

      console.log('📤 Creando cuenta...', {
        plan: planSeleccionado.plan_codigo,
        app_seleccionada: planSeleccionado.app_seleccionada,
        estado_id: formData.businessInfo.estado_id,
        ciudad_id: formData.businessInfo.ciudad_id
      });

      // Llamar al endpoint de registro público
      const response = await organizacionesApi.register(registroData);

      console.log('✅ Cuenta creada:', response.data);

      return response.data.data;
    },
    onSuccess: async (data) => {
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
        refreshToken: data.admin.token,
      });

      // Guardar IDs en onboardingStore
      setIds({
        organizacion_id: data.organizacion.id,
        usuario_id: data.admin.id,
      });

      // Mostrar mensaje según el plan (Modelo Free/Pro Nov 2025)
      const planCodigo = planSeleccionado?.plan_codigo;

      if (planCodigo === 'free') {
        const appNombre = {
          'agendamiento': 'Agendamiento',
          'inventario': 'Inventario',
          'pos': 'Punto de Venta'
        }[planSeleccionado.app_seleccionada] || 'tu app';

        toast.success(`¡Cuenta creada! Tienes acceso gratuito a ${appNombre}. Te redirigimos al dashboard...`);
      } else if (planCodigo === 'pro') {
        toast.success('¡Cuenta Pro creada! Tienes 14 días de prueba gratis con todas las apps incluidas.');
      } else {
        // Trial por defecto
        toast.success('¡Cuenta creada! Tienes 14 días de prueba gratis. Te redirigimos al inicio...');
      }

      // Limpiar el onboarding store
      setTimeout(() => {
        resetOnboarding();
        navigate('/home');
      }, 1500);
    },
    onError: (error) => {
      console.error('❌ Error en registro:', error);

      const errorMsg = error.response?.data?.message || error.message || 'Error al crear la cuenta';
      const errorStatus = error.response?.status;
      const errorData = error.response?.data || {};

      if (errorStatus === 409) {
        setError('email', {
          type: 'manual',
          message: errorMsg,
        });
        toast.error(errorMsg);
      } else if (errorStatus === 400) {
        console.error('📋 Detalles del error de validación:', errorData);
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    },
  });

  const onSubmit = async (data) => {
    updateFormData('account', {
      email: data.email,
      nombre_completo: data.nombre_completo,
    });

    createAccountMutation.mutate(data);
  };

  // Helper para obtener descripción del plan seleccionado
  const getPlanDescription = () => {
    const planCodigo = planSeleccionado?.plan_codigo;

    if (planCodigo === 'free') {
      const appNombre = {
        'agendamiento': 'Agendamiento',
        'inventario': 'Inventario',
        'pos': 'Punto de Venta'
      }[planSeleccionado.app_seleccionada] || 'tu app';

      return `Plan Free - ${appNombre}`;
    } else if (planCodigo === 'pro') {
      return 'Plan Pro - Todas las apps incluidas';
    }
    return 'Plan Trial - 14 días gratis';
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
        {/* Mostrar plan seleccionado */}
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
          {getPlanDescription()}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Datos de cuenta */}
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
            {createAccountMutation.isPending
              ? 'Creando cuenta...'
              : 'Crear Cuenta'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Step3_AccountSetup;
