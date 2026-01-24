/**
 * ====================================================================
 * COMPONENT: SUBSCRIPTION GUARD
 * ====================================================================
 * Guard que envuelve la aplicación y verifica el estado de suscripción.
 * Muestra banner de alerta o redirige según el estado.
 *
 * Comportamiento:
 * - SuperAdmin: Acceso completo, sin banner
 * - Nexo Team (org 1): Acceso completo, sin banner
 * - Trial > 5 días: Acceso completo, sin banner
 * - Trial <= 5 días: Acceso completo, banner de alerta
 * - Activa: Acceso completo, sin banner
 * - Grace Period: Solo lectura (backend bloquea), banner naranja
 * - Vencida/Suspendida: Redirige a /planes
 *
 * @module components/suscripciones-negocio/SubscriptionGuard
 */

import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore, { selectIsAuthenticated, selectUser } from '@/store/authStore';
import { useMiSuscripcion } from '@/hooks/suscripciones-negocio';
import SuscripcionBanner from './SuscripcionBanner';

/**
 * ID de la organización Nexo Team (bypass de verificación)
 * Debe coincidir con NEXO_TEAM_ORG_ID del backend
 */
const NEXO_TEAM_ORG_ID = parseInt(import.meta.env.VITE_NEXO_TEAM_ORG_ID) || 1;

/**
 * Rutas que no requieren verificación de suscripción
 */
const RUTAS_EXENTAS = [
    '/login',
    '/registro',
    '/forgot-password',
    '/reset-password',
    '/planes',
    '/checkout',
    '/onboarding',
    '/mi-plan',
    '/setup'
];

/**
 * Estados que bloquean acceso completo
 */
const ESTADOS_BLOQUEADOS = ['suspendida', 'cancelada', 'trial_expirado', 'grace_period_expirado'];

/**
 * Verificar si la ruta está exenta
 */
const esRutaExenta = (pathname) => {
    return RUTAS_EXENTAS.some(ruta => pathname.startsWith(ruta));
};

/**
 * SubscriptionGuard Component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar
 */
export default function SubscriptionGuard({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const user = useAuthStore(selectUser);

    // Determinar si necesitamos verificar suscripción
    const debeVerificar = useMemo(() => {
        // No verificar si no está autenticado
        if (!isAuthenticated) return false;

        // No verificar rutas exentas
        if (esRutaExenta(location.pathname)) return false;

        // No verificar Nexo Team
        if (user?.organizacion_id === NEXO_TEAM_ORG_ID) return false;

        // No verificar SuperAdmin (nivel 100)
        if (user?.nivel_jerarquia >= 100) return false;

        return true;
    }, [isAuthenticated, location.pathname, user?.organizacion_id, user?.nivel_jerarquia]);

    // Obtener estado de suscripción
    const {
        data: suscripcion,
        isLoading,
        isError
    } = useMiSuscripcion({
        enabled: debeVerificar
    });

    // Calcular días restantes - IMPORTANTE: hooks ANTES de cualquier return condicional
    const diasRestantesTrial = useMemo(() => {
        if (!suscripcion?.es_trial || !suscripcion?.fecha_fin_trial) return 0;
        const finTrial = new Date(suscripcion.fecha_fin_trial);
        const ahora = new Date();
        return Math.max(0, Math.ceil((finTrial - ahora) / (1000 * 60 * 60 * 24)));
    }, [suscripcion]);

    const diasRestantesGracia = useMemo(() => {
        if (!suscripcion?.fecha_gracia) return 0;
        const finGracia = new Date(suscripcion.fecha_gracia);
        const ahora = new Date();
        return Math.max(0, Math.ceil((finGracia - ahora) / (1000 * 60 * 60 * 24)));
    }, [suscripcion]);

    // Redirigir si el estado está bloqueado
    useEffect(() => {
        if (!debeVerificar || isLoading || isError) return;

        // Sin suscripción encontrada → redirigir a planes
        if (!suscripcion) {
            navigate('/planes', { replace: true });
            return;
        }

        // Estado bloqueado → redirigir a planes
        if (ESTADOS_BLOQUEADOS.includes(suscripcion.estado)) {
            navigate('/planes', { replace: true });
        }
    }, [debeVerificar, isLoading, isError, suscripcion, navigate]);

    // Mostrar loading mientras verifica (solo si debe verificar)
    if (debeVerificar && isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Verificando suscripción...
                    </p>
                </div>
            </div>
        );
    }

    // Determinar si mostrar banner
    const mostrarBanner = debeVerificar && suscripcion && !isError;

    return (
        <>
            {mostrarBanner && (
                <SuscripcionBanner
                    estado={suscripcion.estado}
                    diasRestantesTrial={diasRestantesTrial}
                    diasRestantesGracia={diasRestantesGracia}
                />
            )}
            {children}
        </>
    );
}

SubscriptionGuard.displayName = 'SubscriptionGuard';
