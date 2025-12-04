import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Mail,
  User,
  MapPin,
  Briefcase,
  Loader2,
  Check,
  ArrowRight,
  Sparkles,
  UserCheck,
  Crown,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { authApi, planesApi } from '@/services/api/endpoints';
import SelectorUbicacion from '@/components/forms/SelectorUbicacion';
import { INDUSTRIAS } from '@/lib/constants';

/**
 * Schema de validación para registro simplificado
 * 7 campos obligatorios + soy_profesional
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
  soy_profesional: z.boolean().default(true) // Por defecto true (caso más común)
});

/**
 * Iconos para cada tipo de plan
 */
const PLAN_ICONS = {
  trial: Zap,
  pro: Crown,
  custom: Sparkles
};

/**
 * Página de Registro Simplificado
 *
 * Fase 2 - Onboarding Simplificado (Nov 2025)
 *
 * Flujo:
 * 1. Usuario llena 7 campos (nombre, email, negocio, industria, ubicación, plan)
 * 2. Se crea org + suscripción + activación pendiente
 * 3. Se envía email de activación
 * 4. Usuario hace clic en email -> crea contraseña -> auto-login
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
      soy_profesional: true // Por defecto marcado (caso más común en PYMES)
    }
  });

  const planSeleccionado = watch('plan');

  // Cargar planes desde la API
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        const response = await planesApi.listar();
        // Filtrar solo planes activos y que no sean custom (custom es para empresas)
        const planesDisponibles = (response.data?.data || [])
          .filter(p => p.codigo_plan !== 'custom')
          .sort((a, b) => (a.orden_display || 0) - (b.orden_display || 0));
        setPlanes(planesDisponibles);

        // Si el plan por defecto no existe, seleccionar el primero disponible
        if (planesDisponibles.length > 0) {
          const planDefault = planesDisponibles.find(p => p.codigo_plan === 'trial') || planesDisponibles[0];
          setValue('plan', planDefault.codigo_plan);
        }
      } catch (error) {
        console.error('Error cargando planes:', error);
        // Fallback: usar trial como default si falla la carga
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

  // Estado: Registro exitoso - Mostrar mensaje de email enviado
  if (registroExitoso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Revisa tu email!</h2>
          <p className="text-gray-600 mb-4">
            Hemos enviado un enlace de activación a:
          </p>
          <p className="text-lg font-semibold text-blue-600 mb-6">
            {emailEnviado}
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>Próximos pasos:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
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
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    );
  }

  // Formulario de registro
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6" />
            <span className="font-medium">SaaS Agendamiento</span>
          </div>
          <h1 className="text-2xl font-bold">Crea tu cuenta gratis</h1>
          <p className="text-blue-100 mt-1">
            Comienza en menos de 2 minutos
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('nombre')}
                placeholder="Juan Pérez"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="tu@email.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Nombre del negocio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de tu negocio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('nombre_negocio')}
                placeholder="Barbería El Clásico"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.nombre_negocio ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.nombre_negocio && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre_negocio.message}</p>
            )}
          </div>

          {/* Industria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industria <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                {...register('industria')}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${
                  errors.industria ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona tu industria</option>
                {INDUSTRIAS.map((ind) => (
                  <option key={ind.value} value={ind.value}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.industria && (
              <p className="text-red-500 text-sm mt-1">{errors.industria.message}</p>
            )}
          </div>

          {/* Soy Profesional - Checkbox para auto-crear perfil profesional */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('soy_profesional')}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Yo atiendo clientes
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Activa esto si tú también realizarás servicios o ventas.
                  Te crearemos un perfil de profesional automáticamente.
                </p>
              </div>
            </label>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
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
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Cargando planes...</span>
              </div>
            ) : planes.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No hay planes disponibles
              </div>
            ) : (
              <div className={`grid gap-3 ${planes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {planes.map((plan) => {
                  const IconoPlan = PLAN_ICONS[plan.codigo_plan] || Sparkles;
                  const esTrial = plan.codigo_plan === 'trial';
                  const precioTexto = parseFloat(plan.precio_mensual) > 0
                    ? `$${plan.precio_mensual}/mes`
                    : esTrial ? '14 días gratis' : 'Gratis';

                  return (
                    <label
                      key={plan.codigo_plan}
                      className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        planSeleccionado === plan.codigo_plan
                          ? 'border-blue-500 bg-blue-50'
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
                        planSeleccionado === plan.codigo_plan ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className="block font-semibold text-gray-900">
                        {plan.nombre || plan.nombre_plan}
                      </span>
                      <span className="text-sm text-gray-500">{precioTexto}</span>
                      {planSeleccionado === plan.codigo_plan && (
                        <Check className="absolute top-2 right-2 h-5 w-5 text-blue-500" />
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
          <button
            type="submit"
            disabled={registrando}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {registrando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                Crear cuenta
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Términos */}
          <p className="text-xs text-center text-gray-500">
            Al crear tu cuenta, aceptas nuestros{' '}
            <a href="/terminos" className="text-blue-600 hover:underline">Términos de Servicio</a>
            {' '}y{' '}
            <a href="/privacidad" className="text-blue-600 hover:underline">Política de Privacidad</a>
          </p>

          {/* Link a login */}
          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegistroPage;
