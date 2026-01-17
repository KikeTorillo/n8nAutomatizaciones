/**
 * Componente para mostrar tarjetas de métricas
 * Usado en el dashboard del super admin
 */

export default function MetricCard({ title, value, subtitle, icon, color = 'blue', trend }) {
    const colors = {
        blue: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
        green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
        purple: 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 border-secondary-200 dark:border-secondary-800',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
    };

    return (
        <div className={`${colors[color]} rounded-lg p-6 border-2 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
                        {title}
                    </p>
                    <p className="text-3xl font-bold mt-2">
                        {value !== undefined && value !== null ? value : '-'}
                    </p>
                    {subtitle && (
                        <p className="text-xs opacity-60 mt-1">
                            {subtitle}
                        </p>
                    )}
                    {trend !== undefined && trend !== null && (
                        <div className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <span className="inline-flex items-center">
                                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
                            </span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="ml-4">
                        <span className="text-5xl opacity-40">{icon}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
