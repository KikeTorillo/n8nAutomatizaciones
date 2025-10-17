import { useQuery } from '@tanstack/react-query';
import { profesionalesApi, serviciosApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Building2, User, Clock, Scissors, MessageCircle } from 'lucide-react';

/**
 * Paso 8: Resumen de Configuración
 * Muestra un resumen completo de todos los pasos completados
 */
function Step8_Review() {
  const { formData, nextStep } = useOnboardingStore();
  const { user } = useAuthStore();

  // Fetch profesionales desde el backend
  const { data: profesionales, isLoading: loadingProf } = useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const response = await profesionalesApi.listar();
      return response.data.data.profesionales || [];
    },
  });

  // Fetch servicios desde el backend
  const { data: servicios, isLoading: loadingServ } = useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      const response = await serviciosApi.listar();
      // Backend retorna: { data: { servicios: [...], ... } }
      return response.data.data.servicios || [];
    },
  });

  const isLoading = loadingProf || loadingServ;

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Cargando resumen..." />
      </div>
    );
  }

  const profesionalesCount = profesionales?.length || 0;
  const serviciosCount = servicios?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Configuración Completada!
        </h2>
        <p className="text-gray-600">
          Revisa el resumen de tu configuración antes de continuar
        </p>
      </div>

      {/* Resumen de configuración */}
      <div className="space-y-4">
        {/* Información del Negocio */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Información del Negocio</h3>
              <p className="text-sm text-gray-600">Tu organización</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium text-gray-900">
                {formData.businessInfo.nombre_comercial || 'No especificado'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Industria:</span>
              <span className="font-medium text-gray-900 capitalize">
                {formData.businessInfo.industria || 'No especificado'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ubicación:</span>
              <span className="font-medium text-gray-900">
                {formData.businessInfo.ciudad}, {formData.businessInfo.pais}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Teléfono:</span>
              <span className="font-medium text-gray-900">
                {formData.businessInfo.telefono_principal}
              </span>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Plan Seleccionado</h3>
              <p className="text-sm text-gray-600">Tu subscripción</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium text-gray-900">
                {formData.plan.plan_nombre || 'Plan Básico'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Precio:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(formData.plan.plan_precio || 0)}/mes
              </span>
            </div>
          </div>
        </div>

        {/* Cuenta de Usuario */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cuenta de Administrador</h3>
              <p className="text-sm text-gray-600">Tu usuario de acceso</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium text-gray-900">
                {user?.nombre} {user?.apellidos}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rol:</span>
              <span className="font-medium text-gray-900 capitalize">{user?.rol}</span>
            </div>
          </div>
        </div>

        {/* Profesionales */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Profesionales</h3>
              <p className="text-sm text-gray-600">Tu equipo de trabajo</p>
            </div>
            {profesionalesCount > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 ml-auto" />
            )}
          </div>
          {profesionalesCount > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-900 font-medium">
                {profesionalesCount} profesional(es) configurado(s)
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {profesionales.map((prof) => (
                  <div
                    key={prof.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: prof.color_calendario }}
                    />
                    <span className="text-sm text-gray-900">{prof.nombre_completo}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded">
              ⚠️ No configuraste profesionales. Puedes hacerlo desde el dashboard.
            </p>
          )}
        </div>

        {/* Horarios */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Horarios</h3>
              <p className="text-sm text-gray-600">Configuración de disponibilidad</p>
            </div>
            {profesionalesCount > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 ml-auto" />
            )}
          </div>
          {profesionalesCount > 0 ? (
            <p className="text-sm text-gray-900">
              Horarios configurados para {profesionalesCount} profesional(es)
            </p>
          ) : (
            <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded">
              ⚠️ No configuraste horarios. Puedes hacerlo desde el dashboard.
            </p>
          )}
        </div>

        {/* Servicios */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Servicios</h3>
              <p className="text-sm text-gray-600">Servicios que ofreces</p>
            </div>
            {serviciosCount > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 ml-auto" />
            )}
          </div>
          {serviciosCount > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-900 font-medium">
                {serviciosCount} servicio(s) configurado(s)
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {servicios.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-900">{service.nombre}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(service.precio)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded">
              ⚠️ No configuraste servicios. Puedes hacerlo desde el dashboard.
            </p>
          )}
        </div>

        {/* WhatsApp */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Integración WhatsApp</h3>
              <p className="text-sm text-gray-600">IA Conversacional</p>
            </div>
            {formData.whatsapp?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 ml-auto" />
            )}
          </div>
          {formData.whatsapp?.connected ? (
            <p className="text-sm text-gray-900">
              WhatsApp conectado: {formData.whatsapp.phone_number}
            </p>
          ) : (
            <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded">
              ⚠️ WhatsApp no conectado. Puedes configurarlo después desde ajustes.
            </p>
          )}
        </div>
      </div>

      {/* Mensaje final */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          ¡Todo Listo para Empezar!
        </h3>
        <p className="text-gray-700">
          Tu cuenta está configurada y lista para usar. Puedes personalizar cualquier configuración desde el dashboard.
        </p>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="button" onClick={nextStep}>
          Finalizar Configuración
        </Button>
      </div>
    </div>
  );
}

export default Step8_Review;
