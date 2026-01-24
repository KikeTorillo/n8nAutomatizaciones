/**
 * ====================================================================
 * COMPONENT: SUSCRIPCION BANNER
 * ====================================================================
 * Banner persistente que muestra el estado de suscripción cuando es necesario.
 * Se muestra en estados de alerta: trial próximo a expirar, grace_period, etc.
 *
 * @module components/suscripciones-negocio/SuscripcionBanner
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, XCircle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Configuración de estilos y contenido por estado
 */
const BANNER_CONFIG = {
    trial: {
        icon: Clock,
        bgClass: 'bg-blue-50 dark:bg-blue-900/30',
        borderClass: 'border-blue-200 dark:border-blue-800',
        textClass: 'text-blue-800 dark:text-blue-200',
        iconClass: 'text-blue-500 dark:text-blue-400',
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        getLabel: (dias) => `Te quedan ${dias} ${dias === 1 ? 'día' : 'días'} de prueba`,
        actionText: 'Ver Planes',
        actionPath: '/planes'
    },
    trial_warning: {
        icon: AlertTriangle,
        bgClass: 'bg-amber-50 dark:bg-amber-900/30',
        borderClass: 'border-amber-200 dark:border-amber-800',
        textClass: 'text-amber-800 dark:text-amber-200',
        iconClass: 'text-amber-500 dark:text-amber-400',
        buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        getLabel: (dias) => `Solo ${dias} ${dias === 1 ? 'día' : 'días'} de prueba restantes`,
        actionText: 'Suscribirse',
        actionPath: '/planes'
    },
    pendiente_pago: {
        icon: CreditCard,
        bgClass: 'bg-amber-50 dark:bg-amber-900/30',
        borderClass: 'border-amber-200 dark:border-amber-800',
        textClass: 'text-amber-800 dark:text-amber-200',
        iconClass: 'text-amber-500 dark:text-amber-400',
        buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        getLabel: () => 'Tienes un pago pendiente',
        actionText: 'Completar Pago',
        actionPath: '/mi-plan'
    },
    grace_period: {
        icon: AlertTriangle,
        bgClass: 'bg-orange-50 dark:bg-orange-900/30',
        borderClass: 'border-orange-200 dark:border-orange-800',
        textClass: 'text-orange-800 dark:text-orange-200',
        iconClass: 'text-orange-500 dark:text-orange-400',
        buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
        getLabel: (dias) => `Acceso limitado - ${dias} ${dias === 1 ? 'día' : 'días'} para renovar`,
        actionText: 'Pagar Ahora',
        actionPath: '/mi-plan'
    },
    vencida: {
        icon: XCircle,
        bgClass: 'bg-red-50 dark:bg-red-900/30',
        borderClass: 'border-red-200 dark:border-red-800',
        textClass: 'text-red-800 dark:text-red-200',
        iconClass: 'text-red-500 dark:text-red-400',
        buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        getLabel: () => 'Tu suscripción está vencida',
        actionText: 'Renovar',
        actionPath: '/planes'
    }
};

/**
 * Determinar qué configuración de banner usar basado en el estado
 */
const getBannerConfig = (estado, diasRestantesTrial, diasRestantesGracia) => {
    if (estado === 'trial') {
        // Mostrar warning si quedan 5 días o menos
        if (diasRestantesTrial <= 5 && diasRestantesTrial > 0) {
            return {
                config: BANNER_CONFIG.trial_warning,
                dias: diasRestantesTrial
            };
        }
        // No mostrar banner si hay más de 5 días de trial
        return null;
    }

    if (estado === 'pendiente_pago') {
        return { config: BANNER_CONFIG.pendiente_pago, dias: 0 };
    }

    if (estado === 'grace_period') {
        return { config: BANNER_CONFIG.grace_period, dias: diasRestantesGracia };
    }

    if (estado === 'vencida') {
        return { config: BANNER_CONFIG.vencida, dias: 0 };
    }

    return null;
};

/**
 * Banner de estado de suscripción
 *
 * @param {Object} props
 * @param {string} props.estado - Estado de la suscripción
 * @param {number} props.diasRestantesTrial - Días restantes de trial
 * @param {number} props.diasRestantesGracia - Días restantes de gracia
 * @param {string} props.className - Clases adicionales
 */
function SuscripcionBanner({
    estado,
    diasRestantesTrial = 0,
    diasRestantesGracia = 0,
    className
}) {
    const bannerData = getBannerConfig(estado, diasRestantesTrial, diasRestantesGracia);

    // No mostrar banner si no aplica
    if (!bannerData) {
        return null;
    }

    const { config, dias } = bannerData;
    const Icon = config.icon;
    const label = config.getLabel(dias);

    return (
        <div
            className={cn(
                'w-full border-b px-4 py-2 flex items-center justify-between gap-4',
                config.bgClass,
                config.borderClass,
                className
            )}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClass)} />
                <span className={cn('text-sm font-medium', config.textClass)}>
                    {label}
                </span>
            </div>

            <Link
                to={config.actionPath}
                className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md',
                    'transition-colors duration-150',
                    'flex-shrink-0',
                    config.buttonClass
                )}
            >
                {config.actionText}
            </Link>
        </div>
    );
}

SuscripcionBanner.displayName = 'SuscripcionBanner';

export default memo(SuscripcionBanner);
