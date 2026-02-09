import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertCircle, Calculator } from 'lucide-react';
import InventarioPageLayout from '@/pages/inventario/components/InventarioPageLayout';
import {
  ReporteValorInventario,
  ReporteValoracionFIFOAVCO,
  ReporteAnalisisABC,
  ReporteRotacion,
  ReporteAlertas,
} from './components';

/**
 * Tabs de Reportes
 */
const TABS = [
  { id: 'valor', label: 'Valor de Inventario', icon: DollarSign },
  { id: 'valoracion', label: 'FIFO/AVCO', icon: Calculator },
  { id: 'abc', label: 'Análisis ABC', icon: BarChart3 },
  { id: 'rotacion', label: 'Rotación', icon: TrendingUp },
  { id: 'alertas', label: 'Resumen Alertas', icon: AlertCircle },
];

/**
 * Página principal de Reportes de Inventario
 */
function ReportesInventarioPage() {
  const [tabActivo, setTabActivo] = useState('valor');

  return (
    <InventarioPageLayout
      icon={BarChart3}
      title="Reportes"
      subtitle="Analíticas y reportes de tu inventario"
    >
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex px-2 sm:px-6" aria-label="Tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabActivo(tab.id)}
                    className={`
                      flex-1 sm:flex-none flex items-center justify-center sm:justify-start py-3 sm:py-4 px-1 sm:px-3 border-b-2 font-medium text-xs sm:text-sm
                      ${
                        tabActivo === tab.id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden ml-1">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenido del Tab */}
          <div className="p-6">
            {tabActivo === 'valor' && <ReporteValorInventario />}
            {tabActivo === 'valoracion' && <ReporteValoracionFIFOAVCO />}
            {tabActivo === 'abc' && <ReporteAnalisisABC />}
            {tabActivo === 'rotacion' && <ReporteRotacion />}
            {tabActivo === 'alertas' && <ReporteAlertas />}
          </div>
        </div>
    </InventarioPageLayout>
  );
}

export default ReportesInventarioPage;
