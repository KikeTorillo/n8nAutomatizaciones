import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, Check, UserCheck, Crown, Zap } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { authApi, planesApi } from '@/services/api/endpoints';
import AuthLayout from '@/components/auth/AuthLayout';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import SelectorUbicacion from '@/components/forms/SelectorUbicacion';
import { INDUSTRIAS } from '@/lib/constants';

/**
 * Schema de validación para registro simplificado
 */
const registroSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre es muy largo'),
  email: z.string()
    .email('El email no es válido'),
  nombre_negocio: z.string()
    .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
    .max(150, 'El nombre es muy largo'),
  industria: z.string({
    required_error: 'Selecciona una industria',
  }).min(1, 'Selecciona una industria'),
  estado_id: z.string()
    .min(1, 'Selecciona un estado')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Selecciona un estado'),
  ciudad_id: z.string()
    .min(1, 'Selecciona una ciudad')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Selecciona una ciudad'),
  plan: z.string().min(1, 'Selecciona un plan'),
  soy_profesional: z.boolean().default(true)
});

const PLAN_ICONS = {
  trial: Zap,
  pro: Crown,
};

/**
 * Página de Registro - Estilo minimalista homologado
 */
function RegistroPage() {
  const toast = useToast();

  const [registrando, setRegistrando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');
  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: '',
      email: '',
      nombre_negocio: '',
      industria: '',
      estado_id: '',
      ciudad_id: '',
      plan: 'trial',
      soy_profesional: true
    }
  });

  const planSeleccionado = watch('plan');

  // Cargar planes desde la API
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        const response = await planesApi.listar();
        const planesDisponibles = (response.data?.data || [])
          .filter(p => p.codigo_plan !== 'custom')
          .sort((a, b) => (a.orden_display || 0) - (b.orden_display || 0));
        setPlanes(planesDisponibles);

        if (planesDisponibles.length > 0) {
          const planDefault = planesDisponibles.find(p => p.codigo_plan === 'trial') || planesDisponibles[0];
          setValue('plan', planDefault.codigo_plan);
        }
      } catch (error) {
        console.error('Error cargando planes:', error);
      } finally {
        setCargandoPlanes(false);
      }
    };
    cargarPlanes();
  }, [setValue]);

  const onSubmit = async (data) => {
    setRegistrando(true);
    try {
      const response = await authApi.registrar(data);
      setEmailEnviado(response.data.data.email_enviado);
      setRegistroExitoso(true);
      toast.success('¡Registro iniciado! Revisa tu email.');
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al registrar. Intenta de nuevo.';
      toast.error(mensaje);
    } finally {
      setRegistrando(false);
    }
  };

  // Convertir INDUSTRIAS a formato de options para FormField
  const industriasOptions = INDUSTRIAS.map(ind => ({
    value: ind.value,
    label: ind.label
  }));

  // Estado: Registro exitoso - Mostrar mensaje de email enviado
  if (registroExitoso) {
    return (
      <AuthLayout
        title="¡Revisa tu email!"
        subtitle="Hemos enviado un enlace de activación"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>

          <p className="text-lg font-semibold text-primary-600 mb-6">
            {emailEnviado}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">Próximos pasos:</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Abre el email que te enviamos</li>
              <li>Haz clic en "Activar mi cuenta"</li>
              <li>Crea tu contraseña y ¡listo!</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            El enlace expira en 24 horas
          </p>

          <Link
            to="/auth/login"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Formulario de registro
  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Comienza en menos de 2 minutos"
      maxWidth="max-w-lg"
      footer={
        <p className="text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Nombre */}
        <FormField
          name="nombre"
          control={control}
          type="text"
          label="Tu nombre"
          placeholder="Juan Pérez"
          required
        />

        {/* Email */}
        <FormField
          name="email"
          control={control}
          type="email"
          label="Email"
          placeholder="tu@email.com"
          required
        />

        {/* Nombre del negocio */}
        <FormField
          name="nombre_negocio"
          control={control}
          type="text"
          label="Nombre de tu negocio"
          placeholder="Barbería El Clásico"
          required
        />

        {/* Industria */}
        <FormField
          name="industria"
          control={control}
          label="Industria"
          placeholder="Selecciona tu industria"
          options={industriasOptions}
          required
        />

        {/* Soy Profesional */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('soy_profesional')}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary-600" />
                <span className="font-medium text-gray-900">Yo atiendo clientes</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Activa esto si tú también realizarás servicios o ventas.
              </p>
            </div>
          </label>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación <span className="text-red-500">*</span>
          </label>
          <SelectorUbicacion
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            required
            horizontal
          />
        </div>

        {/* Plan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plan
          </label>
          {cargandoPlanes ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-gray-500">Cargando planes...</span>
            </div>
          ) : planes.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No hay planes disponibles
            </div>
          ) : (
            <div className={`grid gap-3 ${planes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {planes.map((plan) => {
                const IconoPlan = PLAN_ICONS[plan.codigo_plan] || Zap;
                const esTrial = plan.codigo_plan === 'trial';
                const precioTexto = parseFloat(plan.precio_mensual) > 0
                  ? `$${plan.precio_mensual}/mes`
                  : esTrial ? '14 días gratis' : 'Gratis';

                return (
                  <label
                    key={plan.codigo_plan}
                    className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      planSeleccionado === plan.codigo_plan
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('plan')}
                      value={plan.codigo_plan}
                      className="sr-only"
                    />
                    <IconoPlan className={`h-6 w-6 mb-2 ${
                      planSeleccionado === plan.codigo_plan ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <span className="block font-semibold text-gray-900">
                      {plan.nombre || plan.nombre_plan}
                    </span>
                    <span className="text-sm text-gray-500">{precioTexto}</span>
                    {planSeleccionado === plan.codigo_plan && (
                      <Check className="absolute top-2 right-2 h-5 w-5 text-primary-500" />
                    )}
                  </label>
                );
              })}
            </div>
          )}
          {errors.plan && (
            <p className="text-red-500 text-sm mt-1">{errors.plan.message}</p>
          )}
        </div>

        {/* Botón de registro */}
        <Button
          type="submit"
          className="w-full"
          isLoading={registrando}
          disabled={registrando}
        >
          {registrando ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>

        {/* Términos */}
        <p className="text-xs text-center text-gray-500">
          Al crear tu cuenta, aceptas nuestros{' '}
          <a href="/terminos" className="text-primary-600 hover:underline">Términos de Servicio</a>
          {' '}y{' '}
          <a href="/privacidad" className="text-primary-600 hover:underline">Política de Privacidad</a>
        </p>
      </form>
    </AuthLayout>
  );
}

export default RegistroPage;
