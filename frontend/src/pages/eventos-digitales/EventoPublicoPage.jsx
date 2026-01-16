import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Clock,
  Heart,
  Check,
  X,
  PartyPopper,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Camera
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import {
  useEventoPublico,
  useInvitacionPublica,
  useConfirmarRSVP,
} from '@/hooks/useEventosDigitales';
import { eventosDigitalesApi } from '@/services/api/endpoints';
import {
  GaleriaCompartida,
  PatronFondo,
  StickersDecorativos,
  TituloTematico,
  DecoracionEsquinas,
  MarcoFoto,
  IconoPrincipal,
  EventoUbicaciones,
  EventoRegalos,
  EventoFelicitaciones,
  EventoRSVP,
} from '@/components/eventos-digitales';
import '@/components/eventos-digitales/publico/EventoAnimations.css';

/**
 * Página pública del evento digital (RSVP)
 * Diseño con scroll continuo y animaciones al aparecer
 */
function EventoPublicoPage() {
  const { slug, token } = useParams();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('inicio');
  const [rsvpForm, setRsvpForm] = useState({
    asistira: null,
    num_asistentes: 1,
    mensaje_rsvp: '',
    restricciones_dieteticas: '',
  });
  const [felicitacionForm, setFelicitacionForm] = useState({
    nombre_autor: '',
    mensaje: '',
  });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [qrImage, setQrImage] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  // Refs para las secciones
  const sectionRefs = {
    inicio: useRef(null),
    galeria: useRef(null),
    fotos: useRef(null),
    ubicaciones: useRef(null),
    regalos: useRef(null),
    felicitaciones: useRef(null),
    rsvp: useRef(null),
  };

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
    // Elementos temáticos
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

  // Countdown timer
  useEffect(() => {
    if (!evento?.fecha_evento) return;

    const updateCountdown = () => {
      const eventDate = new Date(evento.fecha_evento);
      if (evento.hora_evento) {
        const [hours, minutes] = evento.hora_evento.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }
      const now = new Date();
      const diff = eventDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [evento?.fecha_evento, evento?.hora_evento]);

  // Intersection Observer para detectar secciones visibles y animar
  useEffect(() => {
    if (!evento) return;

    // Marcar sección 'inicio' como visible inmediatamente
    setVisibleSections(prev => new Set([...prev, 'inicio']));

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute('data-section');

        // Actualizar sección activa en nav
        if (entry.isIntersecting) {
          setActiveSection(sectionId);
        }

        // Marcar como visible para animaciones
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, sectionId]));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observar todas las secciones
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    // Check inicial: marcar secciones ya visibles en viewport
    setTimeout(() => {
      Object.entries(sectionRefs).forEach(([sectionId, ref]) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          if (isVisible) {
            setVisibleSections(prev => new Set([...prev, sectionId]));
          }
        }
      });
    }, 100);

    return () => observer.disconnect();
  }, [evento]);

  // Cargar QR cuando el invitado está confirmado y el organizador habilitó el QR
  useEffect(() => {
    if (token && invitado?.estado_rsvp === 'confirmado' && evento?.configuracion?.mostrar_qr_invitado === true) {
      setLoadingQR(true);
      fetch(`/api/v1/public/evento/${slug}/${token}/qr?formato=base64`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setQrImage(data.data.qr);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingQR(false));
    }
  }, [token, invitado?.estado_rsvp, evento?.configuracion?.mostrar_qr_invitado, slug]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Scroll to section
  const scrollToSection = useCallback((sectionId) => {
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      const navHeight = 60;
      const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Scroll to content (from hero)
  const scrollToContent = () => {
    const configuracion = evento?.configuracion || {};
    const galeria = evento?.galeria_urls || [];

    // Determinar la primera sección después del hero
    if (galeria.length > 0) {
      scrollToSection('galeria');
    } else if (configuracion.mostrar_ubicaciones !== false && (evento?.ubicaciones || []).length > 0) {
      scrollToSection('ubicaciones');
    } else {
      scrollToSection('felicitaciones');
    }
  };

  // Handlers
  const handleRSVP = async (asistira) => {
    try {
      await confirmarRSVP.mutateAsync({
        slug,
        token,
        data: {
          asistira,
          num_asistentes: asistira ? rsvpForm.num_asistentes : 0,
          mensaje_rsvp: rsvpForm.mensaje_rsvp || undefined,
          restricciones_dieteticas: rsvpForm.restricciones_dieteticas || undefined,
        },
      });
      toast.success(asistira ? '¡Asistencia confirmada!' : 'Respuesta registrada');
    } catch (error) {
      toast.error('Error al confirmar asistencia');
    }
  };

  const handleEnviarFelicitacion = async (e) => {
    e.preventDefault();
    try {
      await eventosDigitalesApi.enviarFelicitacion(evento.id, felicitacionForm);
      toast.success('¡Felicitación enviada!');
      setFelicitacionForm({ nombre_autor: '', mensaje: '' });
    } catch (error) {
      toast.error('Error al enviar felicitación');
    }
  };

  // Lightbox handlers
  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    const galeria = evento?.galeria_urls || [];
    setLightboxIndex((prev) => (prev + 1) % galeria.length);
  };

  const prevImage = () => {
    const galeria = evento?.galeria_urls || [];
    setLightboxIndex((prev) => (prev - 1 + galeria.length) % galeria.length);
  };

  if (loadingEvento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (errorEvento || !evento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center px-4">
          <PartyPopper className="w-20 h-20 text-pink-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Evento no encontrado</h1>
          <p className="text-gray-600 text-lg">El evento que buscas no existe o ya no está disponible</p>
        </div>
      </div>
    );
  }

  const configuracion = evento.configuracion || {};
  const ubicaciones = evento.ubicaciones || [];
  const regalos = evento.regalos || [];
  const felicitaciones = evento.felicitaciones?.filter(f => f.aprobada) || [];
  const galeria = evento.galeria_urls || [];

  // Detectar si hay imagen de fondo para ajustar contraste
  const tieneImagenFondo = !!(evento.portada_url || tema.imagen_fondo);

  const sections = [
    { id: 'inicio', label: 'Inicio' },
    ...(galeria.length > 0 ? [{ id: 'galeria', label: 'Galería' }] : []),
    ...(configuracion.mostrar_ubicaciones !== false && ubicaciones.length > 0 ? [{ id: 'ubicaciones', label: 'Ubicaciones' }] : []),
    ...(configuracion.mostrar_mesa_regalos !== false && regalos.length > 0 ? [{ id: 'regalos', label: 'Regalos' }] : []),
    ...(configuracion.permitir_felicitaciones !== false ? [{ id: 'felicitaciones', label: 'Felicitaciones' }] : []),
    ...(token ? [{ id: 'rsvp', label: 'Confirmar' }] : []),
    ...(configuracion.habilitar_galeria_compartida !== false ? [{ id: 'fotos', label: 'Fotos' }] : []),
  ];

  // Helper para clases de animación
  const getAnimationClass = (sectionId, baseClass = 'animate-fadeInUp') => {
    return visibleSections.has(sectionId) ? baseClass : 'opacity-0';
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: tema.color_fondo,
        fontFamily: tema.fuente_cuerpo,
      }}
    >
      {/* Hero Section - Fullscreen */}
      <section
        ref={sectionRefs.inicio}
        data-section="inicio"
        className="relative min-h-screen flex flex-col"
      >
        {/* Background Image - prioridad: portada_url > imagen_fondo del tema > gradiente */}
        {(evento.portada_url || tema.imagen_fondo) ? (
          <div className="absolute inset-0">
            <img
              src={evento.portada_url || tema.imagen_fondo}
              alt={evento.nombre}
              className="w-full h-full object-cover"
            />
            {/* Overlay oscuro para mejor contraste con texto */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.6) 40%, ${tema.color_fondo}dd 80%, ${tema.color_fondo} 100%)`
              }}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${tema.color_secundario} 0%, ${tema.color_fondo} 100%)`
            }}
          />
        )}

        {/* Patrón de fondo temático */}
        <PatronFondo
          patron={tema.patron_fondo}
          opacidad={tema.patron_opacidad}
          colorPrimario={tema.color_primario}
        />

        {/* Decoraciones de esquinas */}
        <DecoracionEsquinas tipo={tema.decoracion_esquinas} />

        {/* Stickers flotantes */}
        <StickersDecorativos stickers={tema.stickers} />

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          {/* Ícono principal temático */}
          {tema.icono_principal !== 'none' && (
            <div className={`mb-6 ${getAnimationClass('inicio')}`}>
              <IconoPrincipal
                icono={tema.icono_principal}
                colorPrimario={tema.color_primario}
              />
            </div>
          )}

          {/* Saludo personalizado */}
          {invitado && (
            <p
              className={`text-lg sm:text-xl mb-2 ${getAnimationClass('inicio')}`}
              style={{
                color: tieneImagenFondo ? 'white' : tema.color_primario,
                textShadow: tieneImagenFondo ? '0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,1)' : 'none'
              }}
            >
              Querido/a <span className="font-semibold">{invitado.nombre}</span>
            </p>
          )}

          {/* Descripción (antes del título para mejor flujo narrativo) */}
          {evento.descripcion && (
            <p
              className={`text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-6 font-light italic ${getAnimationClass('inicio')} stagger-1`}
              style={{
                color: tieneImagenFondo ? 'white' : tema.color_texto_claro,
                textShadow: tieneImagenFondo ? '0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,1)' : 'none'
              }}
            >
              {evento.descripcion}
            </p>
          )}

          {/* Título principal con efecto temático */}
          <h1
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight ${getAnimationClass('inicio')} stagger-2`}
            style={{
              fontFamily: tema.fuente_titulo,
              color: tieneImagenFondo ? 'white' : tema.color_texto,
              textShadow: tieneImagenFondo ? '0 4px 40px rgba(0,0,0,1), 0 2px 15px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            <TituloTematico
              efecto={tema.efecto_titulo}
              colorPrimario={tema.color_primario}
              colorSecundario={tema.color_secundario}
            >
              {evento.nombre}
            </TituloTematico>
          </h1>

          {/* Fecha destacada */}
          <div
            className={`inline-flex items-center gap-3 sm:gap-6 px-6 sm:px-10 py-4 sm:py-5 rounded-full backdrop-blur-sm mb-8 ${getAnimationClass('inicio', 'animate-scaleIn')} stagger-3`}
            style={{
              backgroundColor: tieneImagenFondo ? 'rgba(0,0,0,0.4)' : tema.color_secundario,
              border: `1px solid ${tieneImagenFondo ? 'rgba(255,255,255,0.3)' : tema.color_primario}20`,
              boxShadow: tieneImagenFondo ? '0 4px 30px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: tieneImagenFondo ? 'white' : tema.color_primario }} />
              <span
                className="text-base sm:text-lg font-semibold"
                style={{
                  color: tieneImagenFondo ? 'white' : tema.color_texto,
                  textShadow: tieneImagenFondo ? '0 1px 4px rgba(0,0,0,0.8)' : 'none'
                }}
              >
                {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            {evento.hora_evento && (
              <>
                <div
                  className="w-px h-8"
                  style={{ backgroundColor: tieneImagenFondo ? 'rgba(255,255,255,0.4)' : tema.color_primario }}
                />
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: tieneImagenFondo ? 'white' : tema.color_primario }} />
                  <span
                    className="text-base sm:text-lg font-semibold"
                    style={{
                      color: tieneImagenFondo ? 'white' : tema.color_texto,
                      textShadow: tieneImagenFondo ? '0 1px 4px rgba(0,0,0,0.8)' : 'none'
                    }}
                  >
                    {evento.hora_evento}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Countdown elegante */}
          {configuracion.mostrar_contador !== false && (
            <div className={`grid grid-cols-4 gap-3 sm:gap-6 max-w-lg mx-auto mb-10 ${getAnimationClass('inicio')} stagger-4`}>
              {[
                { value: countdown.days, label: 'Días' },
                { value: countdown.hours, label: 'Horas' },
                { value: countdown.minutes, label: 'Min' },
                { value: countdown.seconds, label: 'Seg' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center"
                >
                  <div
                    className="text-4xl sm:text-5xl md:text-6xl font-bold mb-1"
                    style={{
                      fontFamily: tema.fuente_titulo,
                      color: tieneImagenFondo ? 'white' : tema.color_primario,
                      textShadow: tieneImagenFondo ? '0 4px 30px rgba(0,0,0,1), 0 2px 10px rgba(0,0,0,0.9)' : 'none'
                    }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div
                    className="text-xs sm:text-sm uppercase tracking-wider font-medium"
                    style={{
                      color: tieneImagenFondo ? 'white' : tema.color_texto_claro,
                      textShadow: tieneImagenFondo ? '0 1px 4px rgba(0,0,0,0.8)' : 'none'
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botones Agregar al Calendario */}
          <div className={`flex flex-wrap justify-center gap-3 mb-8 ${getAnimationClass('inicio')} stagger-5`}>
            {/* Google Calendar */}
            <a
              href={(() => {
                const fechaEvento = new Date(evento.fecha_evento);
                let horaInicio = '12:00';
                if (evento.hora_evento) {
                  horaInicio = evento.hora_evento.substring(0, 5);
                }
                const [horas, minutos] = horaInicio.split(':').map(Number);
                fechaEvento.setHours(horas, minutos, 0, 0);
                const fechaFin = new Date(fechaEvento.getTime() + 4 * 60 * 60 * 1000);

                const formatGCal = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                const ubicacion = ubicaciones.length > 0 ? (ubicaciones[0].direccion || ubicaciones[0].nombre || '') : '';

                const params = new URLSearchParams({
                  action: 'TEMPLATE',
                  text: evento.nombre,
                  dates: `${formatGCal(fechaEvento)}/${formatGCal(fechaFin)}`,
                  details: `${evento.descripcion || ''}\n\nMás información: ${window.location.href}`,
                  location: ubicacion,
                });
                return `https://calendar.google.com/calendar/render?${params.toString()}`;
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: tieneImagenFondo ? 'rgba(0,0,0,0.4)' : tema.color_secundario,
                color: tieneImagenFondo ? 'white' : tema.color_primario,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${tieneImagenFondo ? 'rgba(255,255,255,0.3)' : tema.color_primario}30`,
                boxShadow: tieneImagenFondo ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
                textShadow: tieneImagenFondo ? '0 1px 3px rgba(0,0,0,0.6)' : 'none'
              }}
            >
              <CalendarPlus className="w-4 h-4" />
              Google Calendar
            </a>

            {/* Descargar .ics */}
            <a
              href={`/api/v1/public/evento/${slug}/calendario`}
              download={`${slug}.ics`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: tieneImagenFondo ? 'rgba(0,0,0,0.4)' : tema.color_secundario,
                color: tieneImagenFondo ? 'white' : tema.color_primario,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${tieneImagenFondo ? 'rgba(255,255,255,0.3)' : tema.color_primario}30`,
                boxShadow: tieneImagenFondo ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
                textShadow: tieneImagenFondo ? '0 1px 3px rgba(0,0,0,0.6)' : 'none'
              }}
            >
              <Download className="w-4 h-4" />
              Descargar .ics
            </a>
          </div>

          {/* Badge de confirmación si ya confirmó */}
          {invitado?.estado_rsvp === 'confirmado' && (
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${getAnimationClass('inicio', 'animate-scaleIn')} stagger-5`}
              style={{
                backgroundColor: tieneImagenFondo ? 'rgba(0,0,0,0.4)' : tema.color_secundario,
                color: tieneImagenFondo ? 'white' : tema.color_primario,
                backdropFilter: 'blur(10px)',
                boxShadow: tieneImagenFondo ? '0 4px 20px rgba(0,0,0,0.4)' : 'none'
              }}
            >
              <span className="flex items-center gap-2 font-semibold" style={{ textShadow: tieneImagenFondo ? '0 1px 3px rgba(0,0,0,0.6)' : 'none' }}>
                <Check className="w-5 h-5" />
                Asistencia Confirmada
              </span>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer" onClick={scrollToContent}>
          <ChevronDown
            className="w-8 h-8"
            style={{
              color: tieneImagenFondo ? 'white' : tema.color_primario,
              filter: tieneImagenFondo ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' : 'none'
            }}
          />
        </div>
      </section>

      {/* Sticky Navigation */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b transition-all"
        style={{
          backgroundColor: `${tema.color_fondo}ee`,
          borderColor: `${tema.color_secundario}`
        }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 sm:gap-8 overflow-x-auto py-4 scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="relative px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-300"
                style={{
                  color: activeSection === section.id ? tema.color_primario : tema.color_texto_claro,
                }}
              >
                {section.label}
                {activeSection === section.id && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full transition-all"
                    style={{ backgroundColor: tema.color_primario }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content - Continuous Scroll */}
      <main>
        {/* Galería */}
        {galeria.length > 0 && (
          <section
            ref={sectionRefs.galeria}
            data-section="galeria"
            className="max-w-5xl mx-auto px-4 py-20"
          >
            <div className={`text-center mb-12 ${getAnimationClass('galeria')}`}>
              <h2
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
              >
                Nuestra Historia
              </h2>
              <p className="text-lg" style={{ color: tema.color_texto_claro }}>
                Momentos que atesoramos
              </p>
            </div>

            {/* Masonry-style grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galeria.map((url, idx) => (
                <MarcoFoto
                  key={idx}
                  marco={tema.marco_fotos}
                  colorPrimario={tema.color_primario}
                  colorSecundario={tema.color_secundario}
                  className={`
                    ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}
                    ${visibleSections.has('galeria') ? 'animate-scaleIn' : 'opacity-0'}
                  `}
                >
                  <div
                    className={`
                      relative overflow-hidden cursor-pointer group
                      ${tema.marco_fotos === 'none' ? 'rounded-2xl' : ''}
                      ${idx === 0 ? 'aspect-square md:aspect-auto' : 'aspect-square'}
                    `}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    onClick={() => openLightbox(idx)}
                  >
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ backgroundColor: `${tema.color_primario}30` }}
                    />
                  </div>
                </MarcoFoto>
              ))}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
                onClick={closeLightbox}
              >
                <button
                  className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                  onClick={closeLightbox}
                >
                  <X className="w-8 h-8" />
                </button>
                <button
                  className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <img
                  src={galeria[lightboxIndex]}
                  alt={`Foto ${lightboxIndex + 1}`}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
                <div className="absolute bottom-4 text-white text-sm">
                  {lightboxIndex + 1} / {galeria.length}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Ubicaciones */}
        {configuracion.mostrar_ubicaciones !== false && ubicaciones.length > 0 && (
          <EventoUbicaciones
            ref={sectionRefs.ubicaciones}
            ubicaciones={ubicaciones}
            tema={tema}
            visibleSections={visibleSections}
          />
        )}

        {/* Mesa de Regalos */}
        {configuracion.mostrar_mesa_regalos !== false && regalos.length > 0 && (
          <EventoRegalos
            ref={sectionRefs.regalos}
            regalos={regalos}
            tema={tema}
            visibleSections={visibleSections}
          />
        )}

        {/* Felicitaciones */}
        {configuracion.permitir_felicitaciones !== false && (
          <EventoFelicitaciones
            ref={sectionRefs.felicitaciones}
            felicitaciones={felicitaciones}
            tema={tema}
            visibleSections={visibleSections}
            form={felicitacionForm}
            setForm={setFelicitacionForm}
            onSubmit={handleEnviarFelicitacion}
          />
        )}

        {/* RSVP */}
        {token && invitado && (
          <EventoRSVP
            ref={sectionRefs.rsvp}
            invitado={invitado}
            configuracion={configuracion}
            tema={tema}
            visibleSections={visibleSections}
            rsvpForm={rsvpForm}
            setRsvpForm={setRsvpForm}
            onConfirm={handleRSVP}
            isLoading={confirmarRSVP.isLoading}
            qrImage={qrImage}
            loadingQR={loadingQR}
          />
        )}

        {/* Galería Compartida - Fotos de Invitados (al final) */}
        {configuracion.habilitar_galeria_compartida !== false && (
          <section
            ref={sectionRefs.fotos}
            data-section="fotos"
            className="py-20"
            style={{ backgroundColor: tema.color_secundario + '20' }}
          >
            <div className="max-w-5xl mx-auto px-4">
              <div className={`text-center mb-12 ${getAnimationClass('fotos')}`}>
                <h2
                  className="text-4xl sm:text-5xl font-bold mb-4"
                  style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
                >
                  <Camera className="inline-block w-10 h-10 mr-3" style={{ color: tema.color_primario }} />
                  Fotos del Evento
                </h2>
                <p className="text-lg" style={{ color: tema.color_texto_claro }}>
                  {token
                    ? '¡Comparte tus mejores momentos!'
                    : 'Momentos capturados por los invitados'}
                </p>
              </div>

              <div
                className={`
                  bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8
                  ${visibleSections.has('fotos') ? 'animate-fadeIn' : 'opacity-0'}
                `}
                style={{ boxShadow: `0 10px 40px ${tema.color_primario}15` }}
              >
                <GaleriaCompartida
                  slug={slug}
                  token={token}
                  isAdmin={false}
                  permitirSubida={configuracion.permitir_subida_invitados !== false}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-8 text-center border-t"
        style={{
          borderColor: tema.color_secundario,
          backgroundColor: tema.color_fondo
        }}
      >
        <p className="text-sm flex items-center justify-center gap-1" style={{ color: tema.color_texto_claro }}>
          Hecho con <Heart className="w-4 h-4 fill-current" style={{ color: tema.color_primario }} /> usando
          {' '}
          <span className="font-semibold" style={{ color: tema.color_primario }}>Nexo</span>
        </p>
      </footer>
    </div>
  );
}

export default EventoPublicoPage;
