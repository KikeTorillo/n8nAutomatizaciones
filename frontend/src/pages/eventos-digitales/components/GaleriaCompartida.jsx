/**
 * Componente GaleriaCompartida
 * Galería de fotos del evento donde invitados pueden subir y ver fotos.
 * Soporta modo admin (moderación) y modo público (solo ver y subir).
 *
 * @param {Object} props
 * @param {number} props.eventoId - ID del evento (modo admin)
 * @param {string} props.slug - Slug del evento (modo público)
 * @param {string} props.token - Token del invitado (modo público, para subir)
 * @param {boolean} props.isAdmin - true para modo admin con moderación
 * @param {boolean} props.permitirSubida - true si invitados pueden subir fotos
 *
 * @example Admin:
 * <GaleriaCompartida eventoId={123} isAdmin={true} />
 *
 * @example Público:
 * <GaleriaCompartida slug="mi-boda" token="abc123" isAdmin={false} permitirSubida={true} />
 */
import { useState, useRef } from 'react';
import {
  Camera,
  Image,
  Eye,
  EyeOff,
  Trash2,
  Flag,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Plus,
  ImagePlus
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  useGaleria,
  useGaleriaPublica,
  useCambiarEstadoFoto,
  useEliminarFoto,
  useReportarFoto,
  useSubirFotoPublica
} from '@/hooks/useEventosDigitales';

function GaleriaCompartida({
  eventoId,
  slug,
  token,
  isAdmin = false,
  permitirSubida = true
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Estado local
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFotoId, setReportFotoId] = useState(null);
  const [reportMotivo, setReportMotivo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(''); // '', 'visible', 'oculta'

  // Estado para subida de fotos
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');

  // Queries - usar el hook correcto según el modo
  const galeriaAdmin = useGaleria(eventoId, { estado: filtroEstado || undefined });
  const galeriaPublica = useGaleriaPublica(slug);

  const { data, isLoading, error } = isAdmin ? galeriaAdmin : galeriaPublica;

  // Mutations
  const cambiarEstado = useCambiarEstadoFoto();
  const eliminarFoto = useEliminarFoto();
  const reportarFoto = useReportarFoto();
  const subirFoto = useSubirFotoPublica();

  // Mostrar botón de subida solo si hay token y permitirSubida es true
  const puedeSubir = !isAdmin && token && permitirSubida;

  // Extraer fotos del resultado
  const fotos = data?.fotos || [];
  const estadisticas = data?.estadisticas || null;

  // Handlers
  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const handlePrev = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : fotos.length - 1));
  };

  const handleNext = () => {
    setLightboxIndex((prev) => (prev < fotos.length - 1 ? prev + 1 : 0));
  };

  const handleToggleVisibilidad = async (foto) => {
    const nuevoEstado = foto.estado === 'visible' ? 'oculta' : 'visible';
    try {
      await cambiarEstado.mutateAsync({
        fotoId: foto.id,
        estado: nuevoEstado,
        eventoId
      });
      toast.success(nuevoEstado === 'visible' ? 'Foto visible' : 'Foto ocultada');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEliminar = async (fotoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await eliminarFoto.mutateAsync({ fotoId, eventoId });
      toast.success('Foto eliminada');
      if (lightboxOpen) setLightboxOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenReport = (fotoId) => {
    setReportFotoId(fotoId);
    setReportMotivo('');
    setShowReportModal(true);
  };

  const handleReportar = async () => {
    if (!reportMotivo.trim()) {
      toast.error('Indica el motivo del reporte');
      return;
    }
    try {
      await reportarFoto.mutateAsync({ fotoId: reportFotoId, motivo: reportMotivo });
      toast.success('Reporte enviado. Gracias por ayudarnos.');
      setShowReportModal(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handlers de subida
  const handleOpenUpload = () => {
    setShowUploadModal(true);
  };

  const handleCloseUpload = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPEG, PNG, WebP o GIF');
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubirFoto = async () => {
    if (!selectedFile) {
      toast.error('Selecciona una imagen');
      return;
    }

    try {
      await subirFoto.mutateAsync({
        slug,
        token,
        file: selectedFile,
        caption
      });
      toast.success('¡Foto subida exitosamente!');
      handleCloseUpload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') handleCloseLightbox();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Error al cargar la galería</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header con filtros (solo admin) */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Galería Compartida
            </h2>
            {estadisticas && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({estadisticas.total_visibles} visibles, {estadisticas.total_ocultas} ocultas)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todas</option>
              <option value="visible">Visibles</option>
              <option value="oculta">Ocultas</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid de fotos */}
      {fotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {fotos.map((foto, index) => (
            <div
              key={foto.id}
              className={`
                relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer
                ${foto.estado === 'oculta' ? 'opacity-50' : ''}
              `}
              onClick={() => handleOpenLightbox(index)}
            >
              <img
                src={foto.thumbnail_url || foto.url}
                alt={foto.caption || 'Foto del evento'}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Overlay con info */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {foto.nombre_autor && (
                    <p className="text-white text-xs truncate">{foto.nombre_autor}</p>
                  )}
                </div>
              </div>

              {/* Badge de estado (admin) */}
              {isAdmin && foto.estado === 'oculta' && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-full flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Oculta
                  </span>
                </div>
              )}

              {/* Badge de reportada (admin) */}
              {isAdmin && foto.reportada && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                  </span>
                </div>
              )}

              {/* Acciones rápidas (admin) */}
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibilidad(foto);
                    }}
                    className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={foto.estado === 'visible' ? 'Ocultar' : 'Mostrar'}
                  >
                    {foto.estado === 'visible' ? (
                      <EyeOff className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(foto.id);
                    }}
                    className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Image className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay fotos en la galería todavía
          </p>
          {puedeSubir && (
            <>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                ¡Sé el primero en compartir un momento!
              </p>
              <Button
                onClick={handleOpenUpload}
                className="mt-4"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Subir Foto
              </Button>
            </>
          )}
        </div>
      )}

      {/* Botón flotante de subida (cuando hay fotos) */}
      {puedeSubir && fotos.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleOpenUpload}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Foto
          </Button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && fotos[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={handleCloseLightbox}
        >
          {/* Close button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fotos[lightboxIndex].url}
              alt={fotos[lightboxIndex].caption || 'Foto del evento'}
              className="max-w-full max-h-[75vh] object-contain"
            />

            {/* Info y acciones */}
            <div className="mt-4 flex items-center gap-4">
              {fotos[lightboxIndex].nombre_autor && (
                <span className="text-white text-sm">
                  Por: {fotos[lightboxIndex].nombre_autor}
                </span>
              )}
              {fotos[lightboxIndex].caption && (
                <span className="text-white/70 text-sm italic">
                  "{fotos[lightboxIndex].caption}"
                </span>
              )}

              {/* Botón de reportar (público) */}
              {!isAdmin && (
                <button
                  onClick={() => handleOpenReport(fotos[lightboxIndex].id)}
                  className="text-white/70 hover:text-red-400 text-sm flex items-center gap-1"
                >
                  <Flag className="w-4 h-4" />
                  Reportar
                </button>
              )}
            </div>

            {/* Counter */}
            <div className="mt-2 text-white/50 text-sm">
              {lightboxIndex + 1} / {fotos.length}
            </div>
          </div>
        </div>
      )}

      {/* Input oculto para selección de archivo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Modal de Subida */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-500" />
                Subir foto
              </h3>
              <button
                onClick={handleCloseUpload}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Área de preview/selección */}
            {previewUrl ? (
              <div className="relative mb-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
              >
                <ImagePlus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  Haz clic para seleccionar una imagen
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  JPEG, PNG, WebP o GIF (máx. 10MB)
                </p>
              </div>
            )}

            {/* Campo de caption */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Añade una descripción a tu foto..."
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCloseUpload}>
                Cancelar
              </Button>
              {previewUrl ? (
                <Button
                  onClick={handleSubirFoto}
                  disabled={subirFoto.isPending}
                >
                  {subirFoto.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Seleccionar imagen
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reporte */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Reportar foto
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Si esta foto es inapropiada, ofensiva o viola las normas del evento, por favor reportala.
            </p>

            <textarea
              value={reportMotivo}
              onChange={(e) => setReportMotivo(e.target.value)}
              placeholder="Describe el motivo del reporte..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReportar}
                disabled={reportarFoto.isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {reportarFoto.isLoading ? 'Enviando...' : 'Enviar reporte'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GaleriaCompartida;
