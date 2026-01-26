import { useState, useEffect, useCallback } from 'react';
import { Save, MapPin, Phone, Mail, Clock, Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { Button, CheckboxField, Input, Select, ToggleSwitch } from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';

/**
 * ContactoEditor - Editor del bloque Contacto
 * Soporta formularios simples y multi-step
 */
function ContactoEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Contactanos',
    subtitulo: contenido.subtitulo || '',
    direccion: contenido.direccion || '',
    telefono: contenido.telefono || '',
    email: contenido.email || '',
    horario: contenido.horario || '',
    mostrar_mapa: contenido.mostrar_mapa || false,
    mapa_url: contenido.mapa_url || '',
    mostrar_formulario: contenido.mostrar_formulario !== false,
    // Nuevos campos para multi-step
    tipo_formulario: contenido.tipo_formulario || 'simple', // simple | multi_step
    formulario_campos: contenido.formulario_campos || ['nombre', 'email', 'mensaje'],
    pasos: contenido.pasos || [
      { titulo: 'Informacion basica', campos: ['nombre', 'email'] },
      { titulo: 'Tu consulta', campos: ['servicio', 'mensaje'] },
    ],
    campos_config: contenido.campos_config || {},
    crear_cliente_crm: contenido.crear_cliente_crm !== false,
    texto_boton: contenido.texto_boton || 'Enviar',
    mensaje_exito: contenido.mensaje_exito || 'Gracias por contactarnos. Te responderemos pronto.',
  });

  const [cambios, setCambios] = useState(false);
  const [tabActiva, setTabActiva] = useState('info'); // info | formulario | avanzado

  // Verificar si el contenido esta vacio
  const contenidoVacio = contenido.titulo === 'Contactanos' || !contenido.titulo;

  useEffect(() => {
    const original = {
      titulo: contenido.titulo || 'Contactanos',
      subtitulo: contenido.subtitulo || '',
      direccion: contenido.direccion || '',
      telefono: contenido.telefono || '',
      email: contenido.email || '',
      horario: contenido.horario || '',
      mostrar_mapa: contenido.mostrar_mapa || false,
      mapa_url: contenido.mapa_url || '',
      mostrar_formulario: contenido.mostrar_formulario !== false,
      tipo_formulario: contenido.tipo_formulario || 'simple',
      formulario_campos: contenido.formulario_campos || ['nombre', 'email', 'mensaje'],
      pasos: contenido.pasos || [],
      campos_config: contenido.campos_config || {},
      crear_cliente_crm: contenido.crear_cliente_crm !== false,
      texto_boton: contenido.texto_boton || 'Enviar',
      mensaje_exito: contenido.mensaje_exito || 'Gracias por contactarnos. Te responderemos pronto.',
    };
    setCambios(JSON.stringify(form) !== JSON.stringify(original));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      subtitulo: generatedContent.subtitulo || prev.subtitulo,
    }));
  }, []);

  // Campos disponibles para formularios
  const camposDisponibles = [
    { id: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
    { id: 'email', label: 'Email', tipo: 'email', requerido: true },
    { id: 'telefono', label: 'Telefono', tipo: 'tel', requerido: false },
    { id: 'empresa', label: 'Empresa', tipo: 'text', requerido: false },
    { id: 'servicio', label: 'Servicio de interes', tipo: 'select', requerido: false },
    { id: 'presupuesto', label: 'Presupuesto', tipo: 'select', requerido: false },
    { id: 'asunto', label: 'Asunto', tipo: 'text', requerido: false },
    { id: 'mensaje', label: 'Mensaje', tipo: 'textarea', requerido: false },
  ];

  const toggleCampo = (campo) => {
    const campos = [...form.formulario_campos];
    const index = campos.indexOf(campo);
    if (index > -1) {
      campos.splice(index, 1);
    } else {
      campos.push(campo);
    }
    setForm({ ...form, formulario_campos: campos });
  };

  // Funciones para multi-step
  const agregarPaso = () => {
    setForm({
      ...form,
      pasos: [...form.pasos, { titulo: `Paso ${form.pasos.length + 1}`, campos: [] }]
    });
  };

  const eliminarPaso = (index) => {
    setForm({
      ...form,
      pasos: form.pasos.filter((_, i) => i !== index)
    });
  };

  const actualizarPaso = (index, campo, valor) => {
    const nuevos = [...form.pasos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, pasos: nuevos });
  };

  const toggleCampoPaso = (pasoIndex, campoId) => {
    const nuevos = [...form.pasos];
    const campos = nuevos[pasoIndex].campos || [];
    const index = campos.indexOf(campoId);
    if (index > -1) {
      campos.splice(index, 1);
    } else {
      campos.push(campoId);
    }
    nuevos[pasoIndex].campos = campos;
    setForm({ ...form, pasos: nuevos });
  };

  const tipoFormularioOptions = [
    { value: 'simple', label: 'Simple (una pagina)' },
    { value: 'multi_step', label: 'Multi-paso (wizard)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {contenidoVacio && (
        <AISuggestionBanner
          tipo="contacto"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      {/* Tabs de navegacion */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTabActiva('info')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tabActiva === 'info'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Informacion
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('formulario')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tabActiva === 'formulario'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Formulario
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('avanzado')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tabActiva === 'avanzado'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Avanzado
        </button>
      </div>

      {/* Tab: Informacion */}
      {tabActiva === 'info' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={
                <span className="flex items-center gap-2">
                  Titulo
                  <AIGenerateButton
                    tipo="contacto"
                    campo="titulo"
                    industria={industria}
                    onGenerate={(text) => setForm({ ...form, titulo: text })}
                    size="sm"
                  />
                </span>
              }
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Contactanos"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <Input
              label={
                <span className="flex items-center gap-2">
                  Subtitulo
                  <AIGenerateButton
                    tipo="contacto"
                    campo="subtitulo"
                    industria={industria}
                    onGenerate={(text) => setForm({ ...form, subtitulo: text })}
                    size="sm"
                  />
                </span>
              }
              value={form.subtitulo}
              onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
              placeholder="Estamos aqui para ayudarte"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Informacion de contacto</h4>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={
                  <span className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" />
                    Direccion
                  </span>
                }
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Calle 123, Ciudad"
                size="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
              <Input
                label={
                  <span className="flex items-center gap-1 text-xs">
                    <Phone className="w-3 h-3" />
                    Telefono
                  </span>
                }
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="+52 123 456 7890"
                size="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
              <Input
                type="email"
                label={
                  <span className="flex items-center gap-1 text-xs">
                    <Mail className="w-3 h-3" />
                    Email
                  </span>
                }
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@negocio.com"
                size="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
              <Input
                label={
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    Horario
                  </span>
                }
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
                placeholder="Lun-Vie 9:00-18:00"
                size="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mapa de Google</h4>
              <CheckboxField
                label="Mostrar"
                checked={form.mostrar_mapa}
                onChange={(e) => setForm({ ...form, mostrar_mapa: e.target.checked })}
              />
            </div>

            {form.mostrar_mapa && (
              <Input
                type="url"
                value={form.mapa_url}
                onChange={(e) => setForm({ ...form, mapa_url: e.target.value })}
                placeholder="URL del embed de Google Maps"
                size="sm"
                className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              />
            )}
          </div>
        </div>
      )}

      {/* Tab: Formulario */}
      {tabActiva === 'formulario' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ToggleSwitch
                checked={form.mostrar_formulario}
                onChange={(checked) => setForm({ ...form, mostrar_formulario: checked })}
                label="Mostrar formulario"
              />
            </div>
            {form.mostrar_formulario && (
              <Select
                value={form.tipo_formulario}
                onChange={(e) => setForm({ ...form, tipo_formulario: e.target.value })}
                options={tipoFormularioOptions}
                className="w-48 dark:bg-gray-700 dark:border-gray-600"
              />
            )}
          </div>

          {form.mostrar_formulario && form.tipo_formulario === 'simple' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Selecciona los campos del formulario:
              </p>
              <div className="flex flex-wrap gap-2">
                {camposDisponibles.map((campo) => (
                  <Button
                    key={campo.id}
                    type="button"
                    variant={form.formulario_campos.includes(campo.id) ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => toggleCampo(campo.id)}
                    className="text-xs"
                  >
                    {campo.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {form.mostrar_formulario && form.tipo_formulario === 'multi_step' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Pasos del formulario ({form.pasos.length})
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={agregarPaso}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar paso
                </Button>
              </div>

              {form.pasos.map((paso, pasoIndex) => (
                <div
                  key={pasoIndex}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        Paso {pasoIndex + 1}
                      </span>
                    </div>
                    {form.pasos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarPaso(pasoIndex)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <Input
                    label="Titulo del paso"
                    value={paso.titulo}
                    onChange={(e) => actualizarPaso(pasoIndex, 'titulo', e.target.value)}
                    placeholder="Ej: Informacion personal"
                    size="sm"
                    className="mb-3 dark:bg-gray-600 dark:border-gray-500"
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Campos en este paso:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {camposDisponibles.map((campo) => (
                      <Button
                        key={campo.id}
                        type="button"
                        variant={(paso.campos || []).includes(campo.id) ? 'primary' : 'outline'}
                        size="xs"
                        onClick={() => toggleCampoPaso(pasoIndex, campo.id)}
                        className="text-xs"
                      >
                        {campo.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Configuracion del boton y mensaje */}
          {form.mostrar_formulario && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Texto del boton"
                value={form.texto_boton}
                onChange={(e) => setForm({ ...form, texto_boton: e.target.value })}
                placeholder="Enviar"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
              <Input
                label="Mensaje de exito"
                value={form.mensaje_exito}
                onChange={(e) => setForm({ ...form, mensaje_exito: e.target.value })}
                placeholder="Gracias por contactarnos..."
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          )}
        </div>
      )}

      {/* Tab: Avanzado */}
      {tabActiva === 'avanzado' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Integracion con CRM
              </h4>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
              Al recibir un contacto, se creara automaticamente un cliente en el CRM de Nexo.
            </p>
            <ToggleSwitch
              checked={form.crear_cliente_crm}
              onChange={(checked) => setForm({ ...form, crear_cliente_crm: checked })}
              label="Crear cliente en CRM"
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Configuracion de campos
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Proximamente: validaciones personalizadas, campos condicionales y opciones de select.
            </p>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <h4 className="font-bold mb-3 text-gray-900 dark:text-white">
          {form.titulo}
        </h4>
        {form.subtitulo && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{form.subtitulo}</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {form.direccion && (
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: tema?.color_primario || '#753572' }} />
                {form.direccion}
              </p>
            )}
            {form.telefono && (
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: tema?.color_primario || '#753572' }} />
                {form.telefono}
              </p>
            )}
            {form.email && (
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: tema?.color_primario || '#753572' }} />
                {form.email}
              </p>
            )}
          </div>
          {form.mostrar_formulario && (
            <div className="space-y-2">
              {form.tipo_formulario === 'multi_step' && form.pasos.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  {form.pasos.map((paso, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          idx === 0
                            ? 'text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                        }`}
                        style={idx === 0 ? { backgroundColor: tema?.color_primario || '#753572' } : {}}
                      >
                        {idx + 1}
                      </div>
                      {idx < form.pasos.length - 1 && (
                        <div className="w-4 h-0.5 bg-gray-200 dark:bg-gray-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {(form.tipo_formulario === 'simple' ? form.formulario_campos : form.pasos[0]?.campos || [])
                .slice(0, 2)
                .map((campoId) => {
                  const campo = camposDisponibles.find(c => c.id === campoId);
                  return campo ? (
                    <input
                      key={campoId}
                      placeholder={campo.label}
                      className="w-full px-3 py-2 text-xs border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded"
                      disabled
                    />
                  ) : null;
                })}
              <button
                className="w-full py-2 text-white text-xs rounded"
                style={{ backgroundColor: tema?.color_primario || '#753572' }}
              >
                {form.tipo_formulario === 'multi_step' ? 'Siguiente' : form.texto_boton}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Boton guardar */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default ContactoEditor;
