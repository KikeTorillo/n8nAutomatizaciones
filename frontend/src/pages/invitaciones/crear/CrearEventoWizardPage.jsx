/**
 * CrearEventoWizardPage — Wizard de 2 pasos para personalizar una invitacion
 * 1. Tipo de evento  2. Elegir plantilla → guardar borrador en localStorage → editor
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { INVITACION_TEMA_DEFAULT } from '@/pages/eventos-digitales/constants';
import { useBorradorStorage } from '../editor/hooks/useBorradorStorage';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import WizardStepper from './components/WizardStepper';
import TipoEventoSelector from './components/TipoEventoSelector';
import PlantillaSelector from './components/PlantillaSelector';

const TOTAL_PASOS = 2;

export default function CrearEventoWizardPage() {
  const navigate = useNavigate();
  const storage = useBorradorStorage();

  const [paso, setPaso] = useState(0);
  const [tipoEvento, setTipoEvento] = useState('');
  const [plantilla, setPlantilla] = useState(null);

  const puedeAvanzar = useCallback(() => {
    switch (paso) {
      case 0: return !!tipoEvento;
      case 1: return true; // Plantilla es opcional
      default: return false;
    }
  }, [paso, tipoEvento]);

  const handleSiguiente = () => {
    if (paso < TOTAL_PASOS - 1) {
      setPaso(paso + 1);
    }
  };

  const handleAnterior = () => {
    if (paso > 0) {
      setPaso(paso - 1);
    }
  };

  const handlePersonalizar = () => {
    const plantillaData = plantilla || {};
    const bloques = plantillaData.bloques_plantilla?.map((b, i) => ({
      ...b,
      id: crypto.randomUUID(),
      orden: i,
    })) || [];

    storage.guardar({
      tipoEvento,
      plantilla: plantillaData,
      bloques,
      tema: plantillaData.tema || INVITACION_TEMA_DEFAULT,
    });

    navigate('/invitaciones/editor');
  };

  return (
    <InvitacionesPublicLayout>
      <section className="py-8 bg-white dark:bg-gray-950 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stepper */}
          <div className="mb-10">
            <WizardStepper pasoActual={paso} />
          </div>

          {/* Contenido del paso */}
          <div className="mb-10">
            {paso === 0 && (
              <TipoEventoSelector valor={tipoEvento} onChange={setTipoEvento} />
            )}
            {paso === 1 && (
              <PlantillaSelector
                tipoEvento={tipoEvento}
                plantillaSeleccionada={plantilla}
                onChange={setPlantilla}
              />
            )}
          </div>

          {/* Navegacion */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleAnterior}
              disabled={paso === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            {paso < TOTAL_PASOS - 1 ? (
              <button
                onClick={handleSiguiente}
                disabled={!puedeAvanzar()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePersonalizar}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Personalizar invitación
              </button>
            )}
          </div>
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
