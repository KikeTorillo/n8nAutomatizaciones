/**
 * ====================================================================
 * EQUIPO EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Equipo.
 * Usa BaseBlockEditor y ArrayItemsEditor para miembros.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { useCallback, useMemo } from 'react';
import { User } from 'lucide-react';
import { Input, Select, Textarea } from '@/components/ui';
import { useBlockEditor, useArrayItems } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';
import { SectionTitleField, ArrayItemsEditor } from './fields';

/**
 * EquipoEditor - Editor del bloque Equipo
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
 */
function EquipoEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
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

  // Opciones de select
  const columnasOptions = [
    { value: '2', label: '2 columnas' },
    { value: '3', label: '3 columnas' },
    { value: '4', label: '4 columnas' },
  ];

  // Renderizador de cada miembro
  const renderMiembroItem = useCallback((miembro, index) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
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
        placeholder="Biografia breve (opcional)"
        rows={2}
        className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
      />
    </div>
  ), [handleChange]);

  // Componente de preview
  const preview = useMemo(() => (
    <>
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
    </>
  ), [form.titulo, form.miembros, tema?.colores]);

  return (
    <BaseBlockEditor
      tipo="equipo"
      industria={industria}
      mostrarAIBanner={false}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      <div className="grid grid-cols-2 gap-4">
        <SectionTitleField
          label="Titulo de seccion"
          value={form.titulo}
          onChange={(val) => handleFieldChange('titulo', val)}
          tipo="equipo"
          industria={industria}
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
        label="Subtitulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Los profesionales que te atenderan"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de miembros */}
      <ArrayItemsEditor
        items={form.miembros}
        label="Miembros"
        onAgregar={handleAgregar}
        onEliminar={handleEliminar}
        itemName="Miembro"
        itemIcon={User}
        iconColor="text-purple-500"
        showDragHandle={true}
        renderItem={renderMiembroItem}
      />
    </BaseBlockEditor>
  );
}

export default EquipoEditor;
