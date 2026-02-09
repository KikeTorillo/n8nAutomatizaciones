/**
 * CrearEventoWizardPage — Wizard de 4 pasos para crear un evento
 * 1. Tipo de evento  2. Datos  3. Plantilla  4. Preview y confirmar
 */
import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useCrearEvento } from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import WizardStepper from './components/WizardStepper';
import TipoEventoSelector from './components/TipoEventoSelector';
import DatosEventoForm from './components/DatosEventoForm';
import PlantillaSelector from './components/PlantillaSelector';
import EventoPreview from './components/EventoPreview';

const TOTAL_PASOS = 4;

export default function CrearEventoWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [paso, setPaso] = useState(0);
  const [tipoEvento, setTipoEvento] = useState('');
  const [datos, setDatos] = useState({ nombre: '', fecha_evento: '', hora_evento: '', descripcion: '' });
  const [plantilla, setPlantilla] = useState(null);

  const crearEvento = useCrearEvento();

  // Pre-seleccionar plantilla de query params
  const plantillaIdParam = searchParams.get('plantilla');

  const puedeAvanzar = useCallback(() => {
    switch (paso) {
      case 0: return !!tipoEvento;
      case 1: return !!datos.nombre?.trim() && !!datos.fecha_evento;
      case 2: return true; // Plantilla es opcional
      case 3: return true;
      default: return false;
    }
  }, [paso, tipoEvento, datos]);

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

  const handleCrear = async () => {
    try {
      const payload = {
        nombre: datos.nombre.trim(),
        tipo: tipoEvento,
        fecha_evento: datos.fecha_evento,
        ...(datos.hora_evento && { hora_evento: datos.hora_evento }),
        ...(datos.descripcion?.trim() && { descripcion: datos.descripcion.trim() }),
        ...(plantilla && { plantilla_id: plantilla.id }),
      };

      const result = await crearEvento.mutateAsync(payload);
      const eventoId = result?.data?.id || result?.id;

      toast.success('Evento creado exitosamente');

      if (eventoId) {
        navigate(`/eventos-digitales/${eventoId}/editor`);
      } else {
        navigate('/invitaciones/mis-eventos');
      }
    } catch {
      // Error ya manejado por onError del hook
    }
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
              <DatosEventoForm datos={datos} onChange={setDatos} />
            )}
            {paso === 2 && (
              <PlantillaSelector
                tipoEvento={tipoEvento}
                plantillaSeleccionada={plantilla}
                onChange={setPlantilla}
              />
            )}
            {paso === 3 && (
              <EventoPreview
                tipoEvento={tipoEvento}
                datos={datos}
                plantilla={plantilla}
              />
            )}
          </div>

          {/* Navegación */}
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
                onClick={handleCrear}
                disabled={crearEvento.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50"
              >
                {crearEvento.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear evento'
                )}
              </button>
            )}
          </div>
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
