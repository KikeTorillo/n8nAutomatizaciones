import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PartyPopper, Save, Image, Trash2, Plus, Upload } from 'lucide-react';
import {
  BackButton,
  Button,
  Checkbox,
  Input,
  LoadingSpinner
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useUploadArchivo } from '@/hooks/utils';
import {
  useEvento,
  usePlantillasPorTipo,
  useCrearEvento,
  useActualizarEvento
} from '@/hooks/otros';

/**
 * Página de formulario para crear/editar evento digital
 */
function EventoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'boda',
    descripcion: '',
    fecha_evento: '',
    hora_evento: '',
    fecha_limite_rsvp: '',
    plantilla_id: '',
    portada_url: '',
    galeria_urls: [],
    configuracion: {
      mostrar_mesa_regalos: true,
      permitir_felicitaciones: true,
      mostrar_ubicaciones: true,
      mostrar_contador: true,
      mostrar_qr_invitado: false,
      habilitar_seating_chart: false,
      mensaje_confirmacion: '',
    }
  });

  // Estados para subida de imágenes
  const [uploadingPortada, setUploadingPortada] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const portadaInputRef = useRef(null);
  const galeriaInputRef = useRef(null);

  // Queries
  const { data: evento, isLoading: loadingEvento } = useEvento(isEditing ? id : null);
  const { data: plantillas } = usePlantillasPorTipo(formData.tipo);

  // Mutations
  const crearEvento = useCrearEvento();
  const actualizarEvento = useActualizarEvento();
  const uploadArchivo = useUploadArchivo();

  // Cargar datos si es edición
  useEffect(() => {
    if (evento) {
      setFormData({
        nombre: evento.nombre || '',
        tipo: evento.tipo || 'boda',
        descripcion: evento.descripcion || '',
        fecha_evento: evento.fecha_evento ? evento.fecha_evento.split('T')[0] : '',
        hora_evento: evento.hora_evento ? evento.hora_evento.substring(0, 5) : '',
        fecha_limite_rsvp: evento.fecha_limite_rsvp ? evento.fecha_limite_rsvp.split('T')[0] : '',
        plantilla_id: evento.plantilla_id || '',
        portada_url: evento.portada_url || '',
        galeria_urls: evento.galeria_urls || [],
        configuracion: {
          mostrar_mesa_regalos: evento.configuracion?.mostrar_mesa_regalos ?? true,
          permitir_felicitaciones: evento.configuracion?.permitir_felicitaciones ?? true,
          mostrar_ubicaciones: evento.configuracion?.mostrar_ubicaciones ?? true,
          mostrar_contador: evento.configuracion?.mostrar_contador ?? true,
          mostrar_qr_invitado: evento.configuracion?.mostrar_qr_invitado ?? false,
          habilitar_seating_chart: evento.configuracion?.habilitar_seating_chart ?? false,
          mensaje_confirmacion: evento.configuracion?.mensaje_confirmacion || '',
        }
      });
    }
  }, [evento]);

  const tiposEvento = [
    { value: 'boda', label: 'Boda', emoji: '' },
    { value: 'xv_anos', label: 'XV Años', emoji: '' },
    { value: 'bautizo', label: 'Bautizo', emoji: '' },
    { value: 'cumpleanos', label: 'Cumpleaños', emoji: '' },
    { value: 'corporativo', label: 'Corporativo', emoji: '' },
    { value: 'otro', label: 'Otro', emoji: '' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('config_')) {
      const configKey = name.replace('config_', '');
      setFormData(prev => ({
        ...prev,
        configuracion: {
          ...prev.configuracion,
          [configKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handler para subir imagen de portada
  const handlePortadaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingPortada(true);
    try {
      const resultado = await uploadArchivo.mutateAsync({
        file,
        folder: 'eventos-digitales/portadas',
        isPublic: true,
        entidadTipo: 'evento_digital',
        entidadId: id || undefined,
      });

      setFormData(prev => ({
        ...prev,
        portada_url: resultado.url
      }));
      toast.success('Portada subida correctamente');
    } catch (error) {
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploadingPortada(false);
      if (portadaInputRef.current) {
        portadaInputRef.current.value = '';
      }
    }
  };

  // Handler para subir imagen a galería
  const handleGaleriaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    // Máximo 10 imágenes en galería
    if (formData.galeria_urls.length >= 10) {
      toast.error('Máximo 10 imágenes en la galería');
      return;
    }

    setUploadingGaleria(true);
    try {
      const resultado = await uploadArchivo.mutateAsync({
        file,
        folder: 'eventos-digitales/galeria',
        isPublic: true,
        entidadTipo: 'evento_digital',
        entidadId: id || undefined,
      });

      setFormData(prev => ({
        ...prev,
        galeria_urls: [...prev.galeria_urls, resultado.url]
      }));
      toast.success('Imagen agregada a la galería');
    } catch (error) {
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploadingGaleria(false);
      if (galeriaInputRef.current) {
        galeriaInputRef.current.value = '';
      }
    }
  };

  // Handler para eliminar portada
  const handleRemovePortada = () => {
    setFormData(prev => ({
      ...prev,
      portada_url: ''
    }));
  };

  // Handler para eliminar imagen de galería
  const handleRemoveGaleriaImage = (index) => {
    setFormData(prev => ({
      ...prev,
      galeria_urls: prev.galeria_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!formData.fecha_evento) {
      toast.error('La fecha del evento es requerida');
      return;
    }

    try {
      const data = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim() || undefined,
        fecha_evento: formData.fecha_evento,
        hora_evento: formData.hora_evento ? formData.hora_evento.substring(0, 5) : undefined,
        fecha_limite_rsvp: formData.fecha_limite_rsvp || undefined,
        plantilla_id: formData.plantilla_id ? parseInt(formData.plantilla_id) : undefined,
        portada_url: formData.portada_url || null,
        galeria_urls: formData.galeria_urls,
        configuracion: formData.configuracion,
      };

      if (isEditing) {
        await actualizarEvento.mutateAsync({ id, data });
        toast.success('Evento actualizado correctamente');
      } else {
        const nuevoEvento = await crearEvento.mutateAsync(data);
        toast.success('Evento creado correctamente');
        navigate(`/eventos-digitales/${nuevoEvento.id}`);
        return;
      }

      navigate(`/eventos-digitales/${id}`);
    } catch (error) {
      toast.error(error.message || 'Error al guardar evento');
    }
  };

  if (isEditing && loadingEvento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton
          to={isEditing ? `/eventos-digitales/${id}` : '/eventos-digitales'}
          className="mb-3"
        />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 dark:bg-pink-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <PartyPopper className="h-6 w-6 sm:h-7 sm:w-7 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {isEditing ? 'Modifica los datos de tu evento' : 'Crea una invitación digital para tu evento'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información Básica</h2>

            <div className="space-y-4">
              <Input
                label="Nombre del Evento *"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Boda de Juan y María"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Evento *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tiposEvento.map((tipo) => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipo: tipo.value, plantilla_id: '' }))}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${formData.tipo === tipo.value
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                        }
                      `}
                    >
                      <span className="text-2xl">{tipo.emoji}</span>
                      <p className="text-sm font-medium mt-1">{tipo.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Cuéntale a tus invitados sobre tu evento..."
                />
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Fechas</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Fecha del Evento *"
                name="fecha_evento"
                type="date"
                value={formData.fecha_evento}
                onChange={handleChange}
                required
              />

              <Input
                label="Hora del Evento"
                name="hora_evento"
                type="time"
                value={formData.hora_evento}
                onChange={handleChange}
              />

              <Input
                label="Fecha Límite RSVP"
                name="fecha_limite_rsvp"
                type="date"
                value={formData.fecha_limite_rsvp}
                onChange={handleChange}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Imágenes</h2>

            <div className="space-y-6">
              {/* Portada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagen de Portada
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Esta imagen se mostrará como fondo principal de tu invitación
                </p>

                {formData.portada_url ? (
                  <div className="relative inline-block group">
                    <img
                      src={formData.portada_url}
                      alt="Portada del evento"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                      onClick={() => !uploadingPortada && portadaInputRef.current?.click()}
                    />
                    {/* Overlay al hacer hover */}
                    <div
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                      onClick={() => !uploadingPortada && portadaInputRef.current?.click()}
                    >
                      {uploadingPortada ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <div className="text-white text-center">
                          <Upload className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-sm">Cambiar imagen</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePortada}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                      title="Eliminar portada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadingPortada && portadaInputRef.current?.click()}
                    className={`
                      w-full max-w-md h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                      ${uploadingPortada ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'}
                    `}
                  >
                    {uploadingPortada ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Image className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Click para subir portada</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG hasta 5MB</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={portadaInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePortadaUpload}
                  className="hidden"
                />
              </div>

              {/* Galería */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Galería de Fotos
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Agrega hasta 10 fotos para mostrar en tu invitación ({formData.galeria_urls.length}/10)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {/* Imágenes existentes */}
                  {formData.galeria_urls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Galería ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGaleriaImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Botón agregar */}
                  {formData.galeria_urls.length < 10 && (
                    <div
                      onClick={() => !uploadingGaleria && galeriaInputRef.current?.click()}
                      className={`
                        aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors
                        ${uploadingGaleria ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'}
                      `}
                    >
                      {uploadingGaleria ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs text-gray-400 dark:text-gray-500">Agregar</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={galeriaInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGaleriaUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Plantilla */}
          {plantillas && plantillas.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Plantilla de Diseño</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Selecciona un estilo visual para tu invitación</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {plantillas.map((plantilla) => {
                  const tema = plantilla.tema || {
                    color_primario: '#ec4899',
                    color_secundario: '#fce7f3',
                    color_fondo: '#fdf2f8',
                    color_texto: '#1f2937',
                  };

                  return (
                    <button
                      key={plantilla.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, plantilla_id: plantilla.id }))}
                      className={`
                        relative rounded-lg border-2 overflow-hidden transition-all
                        ${formData.plantilla_id == plantilla.id
                          ? 'ring-2 ring-offset-2'
                          : 'hover:border-gray-300'
                        }
                      `}
                      style={{
                        borderColor: formData.plantilla_id == plantilla.id ? tema.color_primario : undefined,
                        '--tw-ring-color': tema.color_primario,
                      }}
                    >
                      {/* Preview del tema */}
                      <div
                        className="aspect-[3/4] flex flex-col items-center justify-center p-3"
                        style={{ backgroundColor: tema.color_fondo }}
                      >
                        {plantilla.preview_url ? (
                          <img src={plantilla.preview_url} alt={plantilla.nombre} className="w-full h-full object-cover rounded" />
                        ) : (
                          <>
                            {/* Mini preview de colores */}
                            <div className="flex gap-1 mb-2">
                              <div
                                className="w-4 h-4 rounded-full border border-white/50"
                                style={{ backgroundColor: tema.color_primario }}
                                title="Color primario"
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-white/50"
                                style={{ backgroundColor: tema.color_secundario }}
                                title="Color secundario"
                              />
                            </div>
                            {/* Simulación de invitación */}
                            <div
                              className="w-full rounded-lg p-2 text-center"
                              style={{ backgroundColor: tema.color_secundario }}
                            >
                              <div
                                className="text-[10px] font-bold mb-1"
                                style={{ color: tema.color_texto }}
                              >
                                Evento
                              </div>
                              <div
                                className="w-full h-1 rounded mb-1"
                                style={{ backgroundColor: tema.color_primario }}
                              />
                              <div className="flex justify-center gap-1">
                                {[1, 2, 3].map(i => (
                                  <div
                                    key={i}
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: tema.color_fondo, border: `1px solid ${tema.color_primario}` }}
                                  />
                                ))}
                              </div>
                            </div>
                            <PartyPopper className="w-8 h-8 mt-2" style={{ color: tema.color_primario }} />
                          </>
                        )}
                      </div>

                      {/* Info de la plantilla */}
                      <div className="p-2 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{plantilla.nombre}</p>
                        <div className="flex items-center justify-between mt-1">
                          {/* Paleta de colores */}
                          <div className="flex gap-0.5">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tema.color_primario }}
                            />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tema.color_secundario }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: tema.color_fondo }}
                            />
                          </div>
                          {plantilla.es_premium && (
                            <span className="text-xs text-yellow-600 font-medium">Premium</span>
                          )}
                        </div>
                      </div>

                      {/* Indicador de seleccionado */}
                      {formData.plantilla_id == plantilla.id && (
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: tema.color_primario }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Configuración */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Configuración</h2>

            <div className="space-y-4">
              <Checkbox
                name="config_mostrar_mesa_regalos"
                checked={formData.configuracion.mostrar_mesa_regalos}
                onChange={handleChange}
                label="Mostrar mesa de regalos"
              />

              <Checkbox
                name="config_permitir_felicitaciones"
                checked={formData.configuracion.permitir_felicitaciones}
                onChange={handleChange}
                label="Permitir felicitaciones públicas"
              />

              <Checkbox
                name="config_mostrar_ubicaciones"
                checked={formData.configuracion.mostrar_ubicaciones}
                onChange={handleChange}
                label="Mostrar ubicaciones con mapa"
              />

              <Checkbox
                name="config_mostrar_contador"
                checked={formData.configuracion.mostrar_contador}
                onChange={handleChange}
                label="Mostrar contador regresivo"
              />

              <Checkbox
                name="config_mostrar_qr_invitado"
                checked={formData.configuracion.mostrar_qr_invitado}
                onChange={handleChange}
                label="Mostrar QR de entrada al invitado"
                description="Muestra un código QR cuando el invitado confirma asistencia"
              />

              <Checkbox
                name="config_habilitar_seating_chart"
                checked={formData.configuracion.habilitar_seating_chart}
                onChange={handleChange}
                label="Habilitar asignación de mesas"
                description="Permite asignar invitados a mesas y mostrar su ubicación"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensaje de Confirmación</label>
                <textarea
                  name="config_mensaje_confirmacion"
                  value={formData.configuracion.mensaje_confirmacion}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Mensaje que verán después de confirmar asistencia"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/eventos-digitales/${id}` : '/eventos-digitales')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={crearEvento.isLoading || actualizarEvento.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {crearEvento.isLoading || actualizarEvento.isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventoFormPage;
