/**
 * Componente para mostrar tarjetas de métricas
 * Usado en el dashboard del super admin
 */

export default function MetricCard({ title, value, subtitle, icon, color = 'blue', trend }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        red: 'bg-red-50 text-red-700 border-red-200'
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
                        <div className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
