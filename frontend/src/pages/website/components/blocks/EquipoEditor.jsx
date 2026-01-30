import { useMemo } from 'react';
import { Save, Plus, Trash2, User } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { useBlockEditor, useArrayItems } from '../../hooks';

/**
 * EquipoEditor - Editor del bloque Equipo
 */
function EquipoEditor({ contenido, onGuardar, tema, isSaving }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: 'Nuestro Equipo',
    subtitulo: '',
    miembros: [{ nombre: '', cargo: '', foto: '', bio: '' }],
    columnas: 3,
    mostrar_redes: true,
  }), []);

  // Default item para nuevos miembros
  const defaultMiembro = useMemo(() => ({
    nombre: '',
    cargo: '',
    foto: '',
    bio: '',
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de miembros
  const {
    handleAgregar,
    handleEliminar,
    handleChange,
  } = useArrayItems(setForm, 'miembros', defaultMiembro);

  const columnasOptions = [
    { value: '2', label: '2 columnas' },
    { value: '3', label: '3 columnas' },
    { value: '4', label: '4 columnas' },
  ];

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Título de sección"
          value={form.titulo}
          onChange={(e) => handleFieldChange('titulo', e.target.value)}
          placeholder="Nuestro Equipo"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Columnas"
          value={String(form.columnas)}
          onChange={(e) => handleFieldChange('columnas', parseInt(e.target.value))}
          options={columnasOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtítulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
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
                    size="sm"
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                  <Input
                    value={miembro.cargo}
                    onChange={(e) => handleChange(index, 'cargo', e.target.value)}
                    placeholder="Cargo o especialidad"
                    size="sm"
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                </div>

                <Input
                  type="url"
                  value={miembro.foto}
                  onChange={(e) => handleChange(index, 'foto', e.target.value)}
                  placeholder="URL de foto"
                  size="sm"
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
