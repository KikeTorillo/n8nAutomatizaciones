import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PartyPopper, Heart, Layout } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import {
  useEventoPublico,
  useInvitacionPublica,
  useConfirmarRSVP,
} from '@/hooks/otros';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import { InvitacionDinamica } from '@/components/eventos-digitales';
import OpeningOverlay from '@/components/eventos-digitales/publico/OpeningOverlay';
import '@/components/eventos-digitales/publico/EventoAnimations.css';

/**
 * Página pública del evento digital (RSVP)
 * Todo se renderiza mediante InvitacionDinamica (bloques del editor).
 */
function EventoPublicoPage() {
  const { slug, token } = useParams();
  const toast = useToast();
  const [qrImage, setQrImage] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  // Queries
  const { data: eventoPublico, isLoading: loadingEvento, error: errorEvento } = token
    ? useInvitacionPublica(slug, token)
    : useEventoPublico(slug);

  // Mutations
  const confirmarRSVP = useConfirmarRSVP();

  const evento = token ? eventoPublico?.evento : eventoPublico;
  const invitado = token ? eventoPublico?.invitado : null;

  // Tema de la plantilla (con defaults)
  const temaDefault = {
    color_primario: '#ec4899',
    color_secundario: '#fce7f3',
    color_fondo: '#fdf2f8',
    color_texto: '#1f2937',
    color_texto_claro: '#6b7280',
    fuente_titulo: 'Playfair Display',
    fuente_cuerpo: 'Inter',
    patron_fondo: 'none',
    patron_opacidad: 0.1,
    decoracion_esquinas: 'none',
    icono_principal: 'none',
    animacion_entrada: 'fade',
    efecto_titulo: 'none',
    marco_fotos: 'none',
    stickers: []
  };
  const tema = { ...temaDefault, ...(evento?.tema || {}) };

  // Cargar Google Fonts dinámicamente
  useEffect(() => {
    if (!evento) return;

    const fuentes = [tema.fuente_titulo, tema.fuente_cuerpo].filter(Boolean);
    const fuentesUnicas = [...new Set(fuentes)];

    if (fuentesUnicas.length > 0) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${fuentesUnicas.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [evento, tema.fuente_titulo, tema.fuente_cuerpo]);

  // Cargar QR cuando el invitado está confirmado y el organizador habilitó el QR
  useEffect(() => {
    if (token && invitado?.estado_rsvp === 'confirmado' && evento?.configuracion?.mostrar_qr_invitado === true) {
      setLoadingQR(true);
      eventosDigitalesApi.obtenerQRPublico(slug, token, 'base64')
        .then(response => {
          if (response.data?.success) {
            setQrImage(response.data.data.qr);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingQR(false));
    }
  }, [token, invitado?.estado_rsvp, evento?.configuracion?.mostrar_qr_invitado, slug]);

  // Loading
  if (loadingEvento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-secondary-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error
  if (errorEvento || !evento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center px-4">
          <PartyPopper className="w-20 h-20 text-pink-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Evento no encontrado</h1>
          <p className="text-gray-600 text-lg">El evento que buscas no existe o ya no está disponible</p>
        </div>
      </div>
    );
  }

  const bloques = evento.bloques_invitacion || [];

  // Sin bloques: mostrar mensaje "en construcción"
  if (bloques.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: tema.color_fondo, fontFamily: tema.fuente_cuerpo }}
      >
        <div className="text-center px-4">
          <Layout className="w-16 h-16 mx-auto mb-6" style={{ color: tema.color_primario }} />
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
          >
            {evento.nombre}
          </h1>
          <p className="text-lg mb-6" style={{ color: tema.color_texto_claro }}>
            Esta invitación está en construcción
          </p>
          <p className="text-sm flex items-center justify-center gap-1" style={{ color: tema.color_texto_claro }}>
            Hecho con{' '}
            <Heart className="w-4 h-4 fill-current" style={{ color: tema.color_primario }} />{' '}
            usando{' '}
            <span className="font-semibold" style={{ color: tema.color_primario }}>Nexo</span>
          </p>
        </div>
      </div>
    );
  }

  const tipoApertura = evento?.configuracion?.animacion_apertura;

  // Renderizar bloques dinámicos
  return (
    <>
      {tipoApertura && tipoApertura !== 'none' && (
        <OpeningOverlay
          tipo={tipoApertura}
          texto={evento?.configuracion?.texto_apertura || 'Desliza para abrir'}
          tema={tema}
        />
      )}
      <InvitacionDinamica
      evento={evento}
      invitado={invitado}
      bloques={bloques}
      tema={tema}
      onConfirmRSVP={async (asistira, form) => {
        try {
          await confirmarRSVP.mutateAsync({
            slug,
            token,
            data: {
              asistira,
              num_asistentes: asistira ? (form?.num_asistentes || 1) : 0,
              mensaje_rsvp: form?.mensaje_rsvp || undefined,
              restricciones_dieteticas: form?.restricciones_dieteticas || undefined,
            },
          });
          toast.success(asistira ? '¡Asistencia confirmada!' : 'Respuesta registrada');
        } catch {
          toast.error('Error al confirmar asistencia');
        }
      }}
      isLoadingRSVP={confirmarRSVP.isLoading}
      qrImage={qrImage}
      loadingQR={loadingQR}
    />
    </>
  );
}

export default EventoPublicoPage;
