import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  Gift,
  Heart,
  Send,
  ExternalLink,
  Check,
  X,
  PartyPopper,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  QrCode
} from 'lucide-react';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import {
  useEventoPublico,
  useInvitacionPublica,
  useConfirmarRSVP,
} from '@/hooks/useEventosDigitales';
import { eventosDigitalesApi } from '@/services/api/endpoints';

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
  const tema = evento?.tema || {
    color_primario: '#ec4899',
    color_secundario: '#fce7f3',
    color_fondo: '#fdf2f8',
    color_texto: '#1f2937',
    color_texto_claro: '#6b7280',
    fuente_titulo: 'Playfair Display',
    fuente_cuerpo: 'Inter'
  };

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

  const sections = [
    { id: 'inicio', label: 'Inicio' },
    ...(galeria.length > 0 ? [{ id: 'galeria', label: 'Galería' }] : []),
    ...(configuracion.mostrar_ubicaciones !== false && ubicaciones.length > 0 ? [{ id: 'ubicaciones', label: 'Ubicaciones' }] : []),
    ...(configuracion.mostrar_mesa_regalos !== false && regalos.length > 0 ? [{ id: 'regalos', label: 'Regalos' }] : []),
    ...(configuracion.permitir_felicitaciones !== false ? [{ id: 'felicitaciones', label: 'Felicitaciones' }] : []),
    ...(token ? [{ id: 'rsvp', label: 'Confirmar' }] : []),
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
      {/* Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.7s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out forwards;
        }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
      `}</style>

      {/* Hero Section - Fullscreen */}
      <section
        ref={sectionRefs.inicio}
        data-section="inicio"
        className="relative min-h-screen flex flex-col"
      >
        {/* Background Image */}
        {evento.portada_url ? (
          <div className="absolute inset-0">
            <img
              src={evento.portada_url}
              alt={evento.nombre}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, ${tema.color_fondo} 100%)`
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

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          {/* Saludo personalizado */}
          {invitado && (
            <p
              className={`text-lg sm:text-xl mb-4 ${getAnimationClass('inicio')}`}
              style={{
                color: evento.portada_url ? 'white' : tema.color_primario,
                textShadow: evento.portada_url ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              Querido/a <span className="font-semibold">{invitado.nombre}</span>
            </p>
          )}

          {/* Título principal */}
          <h1
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight ${getAnimationClass('inicio')} stagger-1`}
            style={{
              fontFamily: tema.fuente_titulo,
              color: evento.portada_url ? 'white' : tema.color_texto,
              textShadow: evento.portada_url ? '0 4px 20px rgba(0,0,0,0.4)' : 'none'
            }}
          >
            {evento.nombre}
          </h1>

          {/* Descripción */}
          {evento.descripcion && (
            <p
              className={`text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-8 font-light italic ${getAnimationClass('inicio')} stagger-2`}
              style={{
                color: evento.portada_url ? 'rgba(255,255,255,0.9)' : tema.color_texto_claro,
                textShadow: evento.portada_url ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {configuracion.mensaje_bienvenida || evento.descripcion}
            </p>
          )}

          {/* Fecha destacada */}
          <div
            className={`inline-flex items-center gap-3 sm:gap-6 px-6 sm:px-10 py-4 sm:py-5 rounded-full backdrop-blur-sm mb-8 ${getAnimationClass('inicio', 'animate-scaleIn')} stagger-3`}
            style={{
              backgroundColor: evento.portada_url ? 'rgba(255,255,255,0.2)' : tema.color_secundario,
              border: `1px solid ${evento.portada_url ? 'rgba(255,255,255,0.3)' : tema.color_primario}20`
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: evento.portada_url ? 'white' : tema.color_primario }} />
              <span
                className="text-base sm:text-lg font-medium"
                style={{ color: evento.portada_url ? 'white' : tema.color_texto }}
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
                  style={{ backgroundColor: evento.portada_url ? 'rgba(255,255,255,0.4)' : tema.color_primario }}
                />
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: evento.portada_url ? 'white' : tema.color_primario }} />
                  <span
                    className="text-base sm:text-lg font-medium"
                    style={{ color: evento.portada_url ? 'white' : tema.color_texto }}
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
                      color: evento.portada_url ? 'white' : tema.color_primario,
                      textShadow: evento.portada_url ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div
                    className="text-xs sm:text-sm uppercase tracking-wider"
                    style={{
                      color: evento.portada_url ? 'rgba(255,255,255,0.8)' : tema.color_texto_claro
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: evento.portada_url ? 'rgba(255,255,255,0.2)' : tema.color_secundario,
                color: evento.portada_url ? 'white' : tema.color_primario,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${evento.portada_url ? 'rgba(255,255,255,0.3)' : tema.color_primario}30`
              }}
            >
              <CalendarPlus className="w-4 h-4" />
              Google Calendar
            </a>

            {/* Descargar .ics */}
            <a
              href={`${import.meta.env.VITE_API_URL || ''}/public/evento/${slug}/calendario`}
              download={`${slug}.ics`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: evento.portada_url ? 'rgba(255,255,255,0.2)' : tema.color_secundario,
                color: evento.portada_url ? 'white' : tema.color_primario,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${evento.portada_url ? 'rgba(255,255,255,0.3)' : tema.color_primario}30`
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
                backgroundColor: evento.portada_url ? 'rgba(255,255,255,0.2)' : tema.color_secundario,
                color: evento.portada_url ? 'white' : tema.color_primario,
                backdropFilter: 'blur(10px)'
              }}
            >
              <span className="flex items-center gap-2">
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
            style={{ color: evento.portada_url ? 'white' : tema.color_primario }}
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
                <div
                  key={idx}
                  className={`
                    relative overflow-hidden rounded-2xl cursor-pointer group
                    ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}
                    ${idx === 0 ? 'aspect-square md:aspect-auto' : 'aspect-square'}
                    ${visibleSections.has('galeria') ? 'animate-scaleIn' : 'opacity-0'}
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
          <section
            ref={sectionRefs.ubicaciones}
            data-section="ubicaciones"
            className="py-20"
            style={{ backgroundColor: tema.color_secundario + '30' }}
          >
            <div className="max-w-5xl mx-auto px-4">
              <div className={`text-center mb-12 ${getAnimationClass('ubicaciones')}`}>
                <h2
                  className="text-4xl sm:text-5xl font-bold mb-4"
                  style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
                >
                  Ubicaciones
                </h2>
                <p className="text-lg" style={{ color: tema.color_texto_claro }}>
                  Te esperamos en
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {ubicaciones.map((ubi, ubiIdx) => (
                  <div
                    key={ubi.id}
                    className={`relative overflow-hidden rounded-3xl p-8 transition-transform hover:scale-[1.02] ${visibleSections.has('ubicaciones') ? (ubiIdx % 2 === 0 ? 'animate-slideInLeft' : 'animate-slideInRight') : 'opacity-0'}`}
                    style={{
                      animationDelay: `${ubiIdx * 0.15}s`,
                      backgroundColor: 'white',
                      boxShadow: `0 10px 40px ${tema.color_primario}15`
                    }}
                  >
                    {/* Decorative corner */}
                    <div
                      className="absolute top-0 right-0 w-24 h-24 opacity-10"
                      style={{
                        background: `radial-gradient(circle at top right, ${tema.color_primario}, transparent)`
                      }}
                    />

                    <div className="flex items-start gap-5">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: tema.color_secundario }}
                      >
                        <MapPin className="w-8 h-8" style={{ color: tema.color_primario }} />
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-sm font-semibold uppercase tracking-wider mb-1"
                          style={{ color: tema.color_primario }}
                        >
                          {ubi.tipo}
                        </p>
                        <h3
                          className="text-2xl font-bold mb-3"
                          style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
                        >
                          {ubi.nombre}
                        </h3>
                        {ubi.hora_inicio && (
                          <p className="flex items-center gap-2 mb-2" style={{ color: tema.color_texto_claro }}>
                            <Clock className="w-4 h-4" />
                            {ubi.hora_inicio}{ubi.hora_fin ? ` - ${ubi.hora_fin}` : ''}
                          </p>
                        )}
                        {ubi.direccion && (
                          <p className="mb-2" style={{ color: tema.color_texto_claro }}>{ubi.direccion}</p>
                        )}
                        {ubi.codigo_vestimenta && (
                          <p className="text-sm mb-3" style={{ color: tema.color_texto_claro }}>
                            <span className="font-medium">Vestimenta:</span> {ubi.codigo_vestimenta}
                          </p>
                        )}
                        {ubi.google_maps_url && (
                          <a
                            href={ubi.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
                            style={{
                              backgroundColor: tema.color_primario,
                              color: 'white'
                            }}
                          >
                            <MapPin className="w-4 h-4" />
                            Ver en Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mesa de Regalos */}
        {configuracion.mostrar_mesa_regalos !== false && regalos.length > 0 && (
          <section
            ref={sectionRefs.regalos}
            data-section="regalos"
            className="max-w-5xl mx-auto px-4 py-20"
          >
            <div className={`text-center mb-12 ${getAnimationClass('regalos')}`}>
              <h2
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
              >
                Mesa de Regalos
              </h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color: tema.color_texto_claro }}>
                Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regalos.filter(r => !r.comprado).map((regalo, idx) => (
                <div
                  key={regalo.id}
                  className={`group relative overflow-hidden rounded-3xl p-6 transition-all hover:scale-[1.02] ${visibleSections.has('regalos') ? 'animate-scaleIn' : 'opacity-0'}`}
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    backgroundColor: 'white',
                    boxShadow: `0 10px 40px ${tema.color_primario}10`
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: tema.color_secundario }}
                  >
                    <Gift className="w-7 h-7" style={{ color: tema.color_primario }} />
                  </div>
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: tema.color_texto }}
                  >
                    {regalo.nombre}
                  </h3>
                  {regalo.descripcion && (
                    <p className="text-sm mb-3" style={{ color: tema.color_texto_claro }}>
                      {regalo.descripcion}
                    </p>
                  )}
                  {regalo.precio && (
                    <p
                      className="text-2xl font-bold mb-4"
                      style={{ color: tema.color_primario }}
                    >
                      ${regalo.precio.toLocaleString()}
                    </p>
                  )}
                  {regalo.url_externa && (
                    <a
                      href={regalo.url_externa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: tema.color_primario }}
                    >
                      Ver regalo
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Felicitaciones */}
        {configuracion.permitir_felicitaciones !== false && (
          <section
            ref={sectionRefs.felicitaciones}
            data-section="felicitaciones"
            className="py-20"
            style={{ backgroundColor: tema.color_secundario + '30' }}
          >
            <div className="max-w-5xl mx-auto px-4">
              <div className={`text-center mb-12 ${getAnimationClass('felicitaciones')}`}>
                <h2
                  className="text-4xl sm:text-5xl font-bold mb-4"
                  style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
                >
                  Libro de Firmas
                </h2>
                <p className="text-lg" style={{ color: tema.color_texto_claro }}>
                  Déjanos tus buenos deseos
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleEnviarFelicitacion}
                className={`max-w-xl mx-auto rounded-3xl p-8 ${visibleSections.has('felicitaciones') ? 'animate-scaleIn stagger-2' : 'opacity-0'}`}
                style={{
                  backgroundColor: 'white',
                  boxShadow: `0 10px 40px ${tema.color_primario}10`
                }}
              >
                <div className="space-y-5">
                  <Input
                    label="Tu Nombre"
                    value={felicitacionForm.nombre_autor}
                    onChange={(e) => setFelicitacionForm({ ...felicitacionForm, nombre_autor: e.target.value })}
                    placeholder="Escribe tu nombre"
                    required
                  />
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: tema.color_texto }}
                    >
                      Tu Mensaje
                    </label>
                    <textarea
                      value={felicitacionForm.mensaje}
                      onChange={(e) => setFelicitacionForm({ ...felicitacionForm, mensaje: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
                      style={{
                        borderColor: tema.color_secundario,
                        '--tw-ring-color': tema.color_primario
                      }}
                      placeholder="Escribe tus buenos deseos..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: tema.color_primario,
                      boxShadow: `0 10px 30px ${tema.color_primario}40`
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      Enviar Felicitación
                    </span>
                  </button>
                </div>
              </form>

              {/* Messages */}
              {felicitaciones.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-6 mt-12">
                  {felicitaciones.map((fel, idx) => (
                    <div
                      key={fel.id}
                      className={`relative rounded-3xl p-6 transition-transform hover:scale-[1.02] ${visibleSections.has('felicitaciones') ? 'animate-fadeInUp' : 'opacity-0'}`}
                      style={{
                        animationDelay: `${0.3 + idx * 0.1}s`,
                        backgroundColor: 'white',
                        boxShadow: `0 5px 20px ${tema.color_primario}10`
                      }}
                    >
                      <div
                        className="absolute top-6 left-6 text-6xl opacity-10"
                        style={{ color: tema.color_primario, fontFamily: 'serif' }}
                      >
                        "
                      </div>
                      <p
                        className="text-lg italic mb-4 relative z-10"
                        style={{ color: tema.color_texto }}
                      >
                        {fel.mensaje}
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: tema.color_primario }}
                      >
                        — {fel.nombre_autor}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* RSVP */}
        {token && invitado && (
          <section
            ref={sectionRefs.rsvp}
            data-section="rsvp"
            className="max-w-5xl mx-auto px-4 py-20"
          >
            <div className="max-w-lg mx-auto">
              <div className={`text-center mb-10 ${getAnimationClass('rsvp')}`}>
                <h2
                  className="text-4xl sm:text-5xl font-bold mb-4"
                  style={{ color: tema.color_texto, fontFamily: tema.fuente_titulo }}
                >
                  Confirmar Asistencia
                </h2>
              </div>

              {invitado.estado_rsvp === 'pendiente' ? (
                <div
                  className={`rounded-3xl p-8 ${visibleSections.has('rsvp') ? 'animate-scaleIn stagger-2' : 'opacity-0'}`}
                  style={{
                    backgroundColor: 'white',
                    boxShadow: `0 20px 60px ${tema.color_primario}15`
                  }}
                >
                  <div className="text-center mb-8">
                    <p className="text-lg" style={{ color: tema.color_texto_claro }}>
                      Hola <span className="font-bold" style={{ color: tema.color_primario }}>{invitado.nombre}</span>
                    </p>
                    <p style={{ color: tema.color_texto_claro }}>
                      Nos encantaría contar con tu presencia
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: tema.color_texto }}
                      >
                        Número de personas
                      </label>
                      <select
                        value={rsvpForm.num_asistentes}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, num_asistentes: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 rounded-xl"
                        style={{ borderColor: tema.color_secundario }}
                      >
                        {[...Array(invitado.max_acompanantes + 1)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} persona{i > 0 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: tema.color_texto }}
                      >
                        Mensaje (opcional)
                      </label>
                      <textarea
                        value={rsvpForm.mensaje_rsvp}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, mensaje_rsvp: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border-2 rounded-xl"
                        style={{ borderColor: tema.color_secundario }}
                        placeholder="Un mensaje especial..."
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: tema.color_texto }}
                      >
                        Restricciones dietéticas (opcional)
                      </label>
                      <Input
                        value={rsvpForm.restricciones_dieteticas}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, restricciones_dieteticas: e.target.value })}
                        placeholder="Ej: Vegetariano, sin gluten..."
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => handleRSVP(true)}
                        disabled={confirmarRSVP.isLoading}
                        className="flex-1 py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                        style={{
                          backgroundColor: tema.color_primario,
                          boxShadow: `0 10px 30px ${tema.color_primario}40`
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-5 h-5" />
                          Confirmo
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRSVP(false)}
                        disabled={confirmarRSVP.isLoading}
                        className="flex-1 py-4 rounded-xl font-semibold border-2 transition-all hover:scale-[1.02]"
                        style={{
                          borderColor: tema.color_secundario,
                          color: tema.color_texto_claro
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <X className="w-5 h-5" />
                          No asistiré
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center rounded-3xl p-10 ${visibleSections.has('rsvp') ? 'animate-scaleIn' : 'opacity-0'}`}
                  style={{
                    backgroundColor: invitado.estado_rsvp === 'confirmado' ? tema.color_secundario : '#fee2e2'
                  }}
                >
                  <div
                    className="inline-flex items-center gap-3 text-2xl font-bold mb-4"
                    style={{
                      color: invitado.estado_rsvp === 'confirmado' ? tema.color_primario : '#dc2626'
                    }}
                  >
                    {invitado.estado_rsvp === 'confirmado' ? (
                      <>
                        <Check className="w-8 h-8" />
                        <span>¡Asistencia Confirmada!</span>
                      </>
                    ) : (
                      <>
                        <X className="w-8 h-8" />
                        <span>No asistirás al evento</span>
                      </>
                    )}
                  </div>
                  {invitado.estado_rsvp === 'confirmado' && invitado.num_asistentes > 0 && (
                    <p style={{ color: tema.color_texto_claro }}>
                      {invitado.num_asistentes} persona{invitado.num_asistentes > 1 ? 's' : ''} confirmada{invitado.num_asistentes > 1 ? 's' : ''}
                    </p>
                  )}
                  {/* Mensaje de confirmación personalizado */}
                  {invitado.estado_rsvp === 'confirmado' && configuracion.mensaje_confirmacion && (
                    <p className="mt-4 text-lg italic" style={{ color: tema.color_texto }}>
                      {configuracion.mensaje_confirmacion}
                    </p>
                  )}

                  {/* Código QR para check-in (solo si el organizador lo habilitó) */}
                  {invitado.estado_rsvp === 'confirmado' && configuracion.mostrar_qr_invitado === true && (
                    <div className="mt-8 pt-6 border-t" style={{ borderColor: tema.color_secundario }}>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <QrCode className="w-5 h-5" style={{ color: tema.color_primario }} />
                        <p className="font-medium" style={{ color: tema.color_texto }}>
                          Tu pase de entrada
                        </p>
                      </div>
                      {loadingQR ? (
                        <div className="flex justify-center py-4">
                          <LoadingSpinner />
                        </div>
                      ) : qrImage ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
                            <img
                              src={qrImage}
                              alt="Código QR de entrada"
                              className="w-48 h-48"
                            />
                          </div>
                          <p className="text-sm mt-4" style={{ color: tema.color_texto_claro }}>
                            Muestra este código en la entrada
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Mesa asignada (si tiene seating chart habilitado) */}
                  {invitado.estado_rsvp === 'confirmado' && invitado.mesa_nombre && (
                    <div className="mt-8 pt-6 border-t" style={{ borderColor: tema.color_secundario }}>
                      <div className="text-center">
                        <p className="text-sm mb-2" style={{ color: tema.color_texto_claro }}>
                          Tu mesa asignada
                        </p>
                        <p
                          className="text-3xl font-bold"
                          style={{ color: tema.color_primario }}
                        >
                          {invitado.mesa_numero ? `Mesa ${invitado.mesa_numero}` : invitado.mesa_nombre}
                        </p>
                        {invitado.mesa_numero && invitado.mesa_nombre !== `Mesa ${invitado.mesa_numero}` && (
                          <p className="text-sm mt-1" style={{ color: tema.color_texto_claro }}>
                            {invitado.mesa_nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
