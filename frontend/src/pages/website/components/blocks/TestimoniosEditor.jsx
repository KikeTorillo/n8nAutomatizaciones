import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Star } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

/**
 * TestimoniosEditor - Editor del bloque Testimonios
 */
function TestimoniosEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Lo que dicen nuestros clientes',
    subtitulo: contenido.subtitulo || '',
    testimonios: contenido.testimonios || [
      { autor: '', cargo: '', texto: '', estrellas: 5, foto: '' }
    ],
    estilo: contenido.estilo || 'cards',
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || 'Lo que dicen nuestros clientes',
      subtitulo: contenido.subtitulo || '',
      testimonios: contenido.testimonios || [
        { autor: '', cargo: '', texto: '', estrellas: 5, foto: '' }
      ],
      estilo: contenido.estilo || 'cards',
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const handleAgregar = () => {
    setForm({
      ...form,
      testimonios: [...form.testimonios, { autor: '', cargo: '', texto: '', estrellas: 5, foto: '' }]
    });
  };

  const handleEliminar = (index) => {
    setForm({
      ...form,
      testimonios: form.testimonios.filter((_, i) => i !== index)
    });
  };

  const handleChange = (index, campo, valor) => {
    const nuevos = [...form.testimonios];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, testimonios: nuevos });
  };

  const estiloOptions = [
    { value: 'cards', label: 'Tarjetas' },
    { value: 'carousel', label: 'Carrusel' },
    { value: 'simple', label: 'Simple' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Título de sección"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Lo que dicen nuestros clientes"
        />
        <Select
          label="Estilo de presentación"
          value={form.estilo}
          onChange={(e) => setForm({ ...form, estilo: e.target.value })}
          options={estiloOptions}
        />
      </div>

      <Input
        label="Subtítulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
        placeholder="Opiniones reales de clientes satisfechos"
      />

      {/* Lista de testimonios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Testimonios ({form.testimonios.length})
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAgregar}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3">
          {form.testimonios.map((testimonio, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500">Testimonio {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminar(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={testimonio.texto}
                  onChange={(e) => handleChange(index, 'texto', e.target.value)}
                  placeholder="El texto del testimonio..."
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={testimonio.autor}
                    onChange={(e) => handleChange(index, 'autor', e.target.value)}
                    placeholder="Nombre del cliente"
                    inputSize="sm"
                  />
                  <Input
                    value={testimonio.cargo}
                    onChange={(e) => handleChange(index, 'cargo', e.target.value)}
                    placeholder="Cargo o ubicación"
                    inputSize="sm"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 mr-2">Estrellas:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleChange(index, 'estrellas', n)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            n <= testimonio.estrellas
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Input
                    type="url"
                    value={testimonio.foto}
                    onChange={(e) => handleChange(index, 'foto', e.target.value)}
                    placeholder="URL foto (opcional)"
                    inputSize="sm"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-center mb-4" style={{ color: tema?.colores?.texto }}>
          {form.titulo}
        </h4>
        {form.testimonios[0] && (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${
                    n <= (form.testimonios[0].estrellas || 5)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm italic text-gray-600 mb-2">
              "{form.testimonios[0].texto || 'Excelente servicio...'}"
            </p>
            <p className="text-xs font-medium" style={{ color: tema?.colores?.primario }}>
              - {form.testimonios[0].autor || 'Cliente'}
              {form.testimonios[0].cargo && `, ${form.testimonios[0].cargo}`}
            </p>
          </div>
        )}
      </div>

      {/* Botón guardar */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default TestimoniosEditor;
