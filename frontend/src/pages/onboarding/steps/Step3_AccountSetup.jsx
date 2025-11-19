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
 * Paso 3: Crear Cuenta (Registro + Autenticación con Trial Gratuito)
 */
function Step3_AccountSetup() {
  const navigate = useNavigate();
  const { formData, updateFormData, setIds, prevStep } = useOnboardingStore();
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

      // Preparar datos según formato del backend
      // Sanitizar campos opcionales (convertir "" a undefined para omitir del payload)
      const nombre_fiscal_sanitized = formData.businessInfo.nombre_fiscal?.trim();

      // Mapeo de códigos de industria a IDs (Nov 2025: migrado a tabla dinámica)
      // ⚠️ IMPORTANTE: Los IDs corresponden al seed de categorias-agendamiento.sql
      // Solo existen categorías de agendamiento (11 categorías, IDs 1-11)
      const industriaCodigoToId = {
        'barberia': 1,              // Barbería
        'salon_belleza': 2,         // Salón de Belleza
        'estetica': 3,              // Estética
        'spa': 4,                   // Spa y Relajación
        'podologia': 5,             // Podología
        'consultorio_medico': 6,    // Consultorio Médico
        'academia': 7,              // Academia
        'taller_tecnico': 8,        // Taller Técnico
        'centro_fitness': 9,        // Centro Fitness
        'veterinaria': 10,          // Veterinaria
        'otro': 11,                 // Otros Servicios (otro_agendamiento)
        'clinica_dental': 6,        // Mapear a consultorio_medico
      };

      const categoriaId = industriaCodigoToId[formData.businessInfo.industria] || 11;

      const registroData = {
        organizacion: {
          nombre_comercial: formData.businessInfo.nombre_comercial,
          razon_social: nombre_fiscal_sanitized || formData.businessInfo.nombre_comercial,
          categoria_industria_id: categoriaId,
          plan: formData.plan.plan_codigo || 'basico',
          telefono_principal: formData.businessInfo.telefono_principal,
          email_contacto: data.email,
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

      console.log('📤 Creando cuenta...', { plan: formData.plan.plan_codigo });

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

      // ✅ NUEVO FLUJO: Todos los planes empiezan con trial
      // La suscripción trial ya fue creada en el backend
      const esPlanDePago = ['basico', 'profesional'].includes(planSeleccionado?.plan_codigo);
      const diasTrial = 14;

      if (esPlanDePago) {
        toast.success(`¡Cuenta creada! Tienes ${diasTrial} días de trial gratis. Te redirigimos al dashboard...`);
      } else {
        toast.success('¡Cuenta creada exitosamente! Te redirigimos al dashboard...');
      }

      // Redirigir al dashboard después de un breve delay para que vean el mensaje
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    },
    onError: (error) => {
      console.error('❌ Error en registro:', error);

      // Extraer mensaje del backend (estructura de Axios)
      const errorMsg = error.response?.data?.message || error.message || 'Error al crear la cuenta';
      const errorStatus = error.response?.status;
      const errorData = error.response?.data || {};

      // Si es error 409 (email duplicado)
      if (errorStatus === 409) {
        setError('email', {
          type: 'manual',
          message: errorMsg,
        });
        toast.error(errorMsg);
      }
      // Si es error de validación 400
      else if (errorStatus === 400) {
        console.error('📋 Detalles del error de validación:', errorData);
        toast.error(errorMsg);
      }
      // Otros errores
      else {
        toast.error(errorMsg);
      }
    },
  });

  const onSubmit = async (data) => {
    updateFormData('account', {
      email: data.email,
      nombre_completo: data.nombre_completo,
    });

    // Crear cuenta (todos los planes empiezan con trial)
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
          {planSeleccionado?.plan_codigo && ['basico', 'profesional'].includes(planSeleccionado.plan_codigo) && (
            <span className="block mt-1 text-sm text-primary-600 font-medium">
              ✨ Incluye 14 días de prueba gratis
            </span>
          )}
        </p>
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
