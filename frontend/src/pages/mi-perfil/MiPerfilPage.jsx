import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Palmtree,
  CalendarDays,
  Clock,
  CheckCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { useProfesional } from '@/hooks/personas';
import { useBloqueos } from '@/hooks/agendamiento';
import { useSaldosVacaciones } from '@/hooks/personas';
import {
  obtenerColorTipoBloqueo,
  calcularDiasBloqueo,
  formatearRangoBloqueo,
  obtenerLabelTipoBloqueo,
} from '@/utils/bloqueoHelpers';
import { format, parseISO, differenceInDays, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button, LoadingSpinner } from '@/components/ui';

/**
 * MiPerfilPage - Portal de autoservicio para empleados
 * Muestra la información del profesional vinculado al usuario actual
 */
function MiPerfilPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profesionalId = user?.profesional_id;

  // Si no tiene profesional vinculado, mostrar mensaje
  if (!profesionalId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Perfil no configurado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
          Tu cuenta de usuario no está vinculada a un perfil de profesional.
          Contacta a tu administrador para configurar tu perfil.
        </p>
        <Button onClick={() => navigate('/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>
    );
  }

  // Fetch datos del profesional
  const { data: profesional, isLoading: isLoadingProfesional } = useProfesional(profesionalId);

  // Fetch bloqueos/ausencias
  const { data: bloqueosData, isLoading: isLoadingBloqueos } = useBloqueos({
    profesional_id: profesionalId,
    limite: 20,
  }, {
    enabled: !!profesionalId,
  });

  // Fetch saldo de vacaciones
  const { data: saldosData, isLoading: isLoadingSaldo } = useSaldosVacaciones({
    profesional_id: profesionalId,
  }, {
    enabled: !!profesionalId,
  });

  const bloqueos = bloqueosData?.bloqueos || [];
  const saldo = saldosData?.saldos?.[0] || null;

  // Separar bloqueos próximos
  const proximosBloqueos = bloqueos
    .filter(b => {
      const fechaFin = parseISO(b.fecha_fin.split('T')[0]);
      return isFuture(fechaFin) || differenceInDays(fechaFin, new Date()) >= 0;
    })
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
    .slice(0, 5);

  const isLoading = isLoadingProfesional || isLoadingBloqueos || isLoadingSaldo;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profesional) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Perfil no encontrado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          No se pudo cargar la información de tu perfil.
        </p>
        <Button onClick={() => navigate('/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>
    );
  }

  // Obtener iniciales para avatar
  const getInitials = (nombre) => {
    if (!nombre) return '?';
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con info del profesional */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Inicio
            </Button>
          </div>

          <div className="flex items-center gap-6">
            {/* Avatar */}
            {profesional.foto_url ? (
              <img
                src={profesional.foto_url}
                alt={profesional.nombre_completo}
                className="w-20 h-20 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 border-4 border-primary-50 dark:border-primary-800">
                {getInitials(profesional.nombre_completo)}
              </div>
            )}

            {/* Info básica */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profesional.nombre_completo}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                {profesional.puesto_nombre && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {profesional.puesto_nombre}
                  </span>
                )}
                {profesional.departamento_nombre && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {profesional.departamento_nombre}
                  </span>
                )}
                {profesional.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profesional.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Widget Saldo de Vacaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Palmtree className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Mis Vacaciones
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Saldo disponible
                </p>
              </div>
            </div>

            {saldo ? (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                    {saldo.dias_disponibles}
                  </span>
                  <span className="text-lg text-gray-500 dark:text-gray-400 mb-1">
                    días
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Usados</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {saldo.dias_usados} días
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">En trámite</p>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      {saldo.dias_en_tramite} días
                    </p>
                  </div>
                </div>

                <Link to="/vacaciones">
                  <Button variant="primary" size="sm" className="w-full mt-2">
                    <Palmtree className="h-4 w-4 mr-2" />
                    Solicitar Vacaciones
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                  No hay saldo registrado
                </p>
                <Link to="/vacaciones">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ir a Vacaciones
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Widget Próximas Ausencias */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <CalendarDays className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Mis Ausencias
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Próximos bloqueos
                </p>
              </div>
            </div>

            {proximosBloqueos.length > 0 ? (
              <div className="space-y-3">
                {proximosBloqueos.slice(0, 3).map(bloqueo => {
                  const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
                  const dias = calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
                  const fechaInicio = parseISO(bloqueo.fecha_inicio.split('T')[0]);

                  return (
                    <div key={bloqueo.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${colores.badge}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {bloqueo.titulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(fechaInicio, "d 'de' MMMM", { locale: es })} • {dias} día{dias !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {proximosBloqueos.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{proximosBloqueos.length - 3} más
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sin ausencias programadas
                </p>
              </div>
            )}
          </div>

          {/* Widget Acciones Rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Acciones Rápidas
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestiona tu tiempo
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/vacaciones" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Palmtree className="h-4 w-4 mr-2" />
                  Solicitar Vacaciones
                </Button>
              </Link>
              <Link to={`/citas?profesional_id=${profesionalId}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Mi Calendario
                </Button>
              </Link>
              <Link to="/citas" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Mis Citas
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Historial de Ausencias */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Historial de Ausencias
            </h3>
          </div>

          {bloqueos.length === 0 ? (
            <div className="p-8 text-center">
              <Info className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No tienes ausencias registradas
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {bloqueos.slice(0, 10).map(bloqueo => {
                const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
                const dias = calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
                const rangoFormateado = formatearRangoBloqueo(
                  bloqueo.fecha_inicio,
                  bloqueo.fecha_fin,
                  bloqueo.hora_inicio,
                  bloqueo.hora_fin
                );
                const fechaFin = parseISO(bloqueo.fecha_fin.split('T')[0]);
                const esProximo = isFuture(fechaFin) || differenceInDays(fechaFin, new Date()) >= 0;

                return (
                  <div
                    key={bloqueo.id}
                    className={`px-6 py-4 flex items-center justify-between ${!esProximo ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${colores.badge} rounded-lg flex items-center justify-center`}>
                        {bloqueo.tipo_bloqueo_codigo === 'vacaciones' ? (
                          <Palmtree className="h-5 w-5 text-white" />
                        ) : (
                          <Calendar className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {bloqueo.titulo}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {rangoFormateado}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${colores.bg} ${colores.text}`}>
                        {obtenerLabelTipoBloqueo(bloqueo.tipo_bloqueo_codigo)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {dias} día{dias !== 1 ? 's' : ''}
                      </span>
                      {esProximo ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Próximo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          Pasado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {bloqueos.length > 10 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link to="/ausencias?tab=otros-bloqueos" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Ver todas las ausencias
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MiPerfilPage;
