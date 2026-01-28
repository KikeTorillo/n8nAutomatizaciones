import { lazy, Suspense } from 'react';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import ComisionesPageLayout from '@/components/comisiones/ComisionesPageLayout';

// Ene 2026: Lazy loading de ComisionesDashboard (~200KB chart.js)
const ComisionesDashboard = lazy(() => import('@/components/comisiones/ComisionesDashboard'));

/**
 * Página principal del sistema de comisiones
 * Muestra dashboard con métricas y gráficas
 */
function ComisionesPage() {
  return (
    <ComisionesPageLayout
      icon={LayoutDashboard}
      title="Dashboard"
      subtitle="Métricas y análisis de comisiones"
    >
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
      }>
        <ComisionesDashboard />
      </Suspense>
    </ComisionesPageLayout>
  );
}

export default ComisionesPage;
