import {
  Award,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Loader2,
  Star,
  Crown,
  Gem,
  Users
} from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

// Mapeo de iconos para niveles
const ICONOS = {
  star: Star,
  award: Award,
  crown: Crown,
  gem: Gem,
};

/**
 * Tab de Niveles del Programa de Lealtad
 * Muestra y permite gestionar los niveles de membresía
 */
export default function NivelesLealtadTab({
  niveles,
  isLoading,
  onNuevo,
  onEditar,
  onEliminar,
  onCrearDefault,
  creandoDefault
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (niveles.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <EmptyState
          icon={Award}
          title="Sin niveles de lealtad"
          description="Crea niveles para recompensar a tus mejores clientes con multiplicadores de puntos"
        />
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCrearDefault} variant="outline" disabled={creandoDefault}>
            {creandoDefault && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Sparkles className="h-4 w-4 mr-2" />
            Crear niveles por defecto
          </Button>
          <Button onClick={onNuevo}>
            <Plus className="h-4 w-4 mr-2" />
            Crear nivel personalizado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Niveles de Membresía
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {niveles.length} nivel{niveles.length !== 1 ? 'es' : ''} configurado{niveles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={onNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Nivel
        </Button>
      </div>

      {/* Lista de niveles */}
      <div className="space-y-3">
        {niveles.map((nivel) => {
          const IconComponent = ICONOS[nivel.icono] || Award;
          return (
            <div
              key={nivel.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
                nivel.activo
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icono con color */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: nivel.color || '#6B7280' }}
                >
                  <IconComponent className="h-6 w-6 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {nivel.nombre}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {nivel.codigo}
                    </span>
                    {!nivel.activo && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {nivel.puntos_minimos.toLocaleString()} - {nivel.puntos_maximos ? nivel.puntos_maximos.toLocaleString() : '∞'} puntos
                    {nivel.multiplicador_puntos > 1 && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                        x{nivel.multiplicador_puntos} puntos
                      </span>
                    )}
                  </p>
                </div>

                {/* Stats */}
                {nivel.total_clientes > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{nivel.total_clientes}</span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditar(nivel)}
                    className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEliminar(nivel)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
