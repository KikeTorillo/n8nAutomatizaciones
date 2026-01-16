import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, User } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea
} from '@/components/ui';

/**
 * EquipoEditor - Editor del bloque Equipo
 */
function EquipoEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Nuestro Equipo',
    subtitulo: contenido.subtitulo || '',
    miembros: contenido.miembros || [
      { nombre: '', cargo: '', foto: '', bio: '' }
    ],
    columnas: contenido.columnas || 3,
    mostrar_redes: contenido.mostrar_redes !== false,
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || 'Nuestro Equipo',
      subtitulo: contenido.subtitulo || '',
      miembros: contenido.miembros || [
        { nombre: '', cargo: '', foto: '', bio: '' }
      ],
      columnas: contenido.columnas || 3,
      mostrar_redes: contenido.mostrar_redes !== false,
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
      miembros: [...form.miembros, { nombre: '', cargo: '', foto: '', bio: '' }]
    });
  };

  const handleEliminar = (index) => {
    setForm({
      ...form,
      miembros: form.miembros.filter((_, i) => i !== index)
    });
  };

  const handleChange = (index, campo, valor) => {
    const nuevos = [...form.miembros];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, miembros: nuevos });
  };

  const columnasOptions = [
    { value: '2', label: '2 columnas' },
    { value: '3', label: '3 columnas' },
    { value: '4', label: '4 columnas' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Título de sección"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Nuestro Equipo"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Columnas"
          value={String(form.columnas)}
          onChange={(e) => setForm({ ...form, columnas: parseInt(e.target.value) })}
          options={columnasOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtítulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
        placeholder="Los profesionales que te atenderán"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de miembros */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Miembros ({form.miembros.length})
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
          {form.miembros.map((miembro, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {miembro.foto ? (
                    <img
                      src={miembro.foto}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {miembro.nombre || `Miembro ${index + 1}`}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminar(index)}
                  className="text-gray-400 hover:text-red-500 dark:hover:bg-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={miembro.nombre}
                    onChange={(e) => handleChange(index, 'nombre', e.target.value)}
                    placeholder="Nombre completo"
                    inputSize="sm"
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                  <Input
                    value={miembro.cargo}
                    onChange={(e) => handleChange(index, 'cargo', e.target.value)}
                    placeholder="Cargo o especialidad"
                    inputSize="sm"
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                </div>

                <Input
                  type="url"
                  value={miembro.foto}
                  onChange={(e) => handleChange(index, 'foto', e.target.value)}
                  placeholder="URL de foto"
                  inputSize="sm"
                  className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                />

                <Textarea
                  value={miembro.bio}
                  onChange={(e) => handleChange(index, 'bio', e.target.value)}
                  placeholder="Biografía breve (opcional)"
                  rows={2}
                  className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <h4 className="font-bold text-center mb-4" style={{ color: tema?.colores?.texto }}>
          {form.titulo}
        </h4>
        <div className="flex justify-center gap-6">
          {form.miembros.slice(0, 3).map((miembro, i) => (
            <div key={i} className="text-center">
              {miembro.foto ? (
                <img
                  src={miembro.foto}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <p className="text-sm font-medium" style={{ color: tema?.colores?.texto }}>
                {miembro.nombre || 'Nombre'}
              </p>
              <p className="text-xs" style={{ color: tema?.colores?.primario }}>
                {miembro.cargo || 'Cargo'}
              </p>
            </div>
          ))}
        </div>
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

export default EquipoEditor;
