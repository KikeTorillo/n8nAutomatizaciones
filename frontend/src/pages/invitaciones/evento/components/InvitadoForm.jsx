/**
 * InvitadoForm — Formulario inline para agregar un invitado
 */
import { useState, memo } from 'react';
import { Plus, Loader2 } from 'lucide-react';

const INITIAL_STATE = { nombre: '', email: '', telefono: '', num_acompanantes: 0, grupo_familiar: '' };

const InvitadoForm = memo(function InvitadoForm({ onSubmit, isLoading }) {
  const [datos, setDatos] = useState(INITIAL_STATE);

  const handleChange = (campo, valor) => {
    setDatos(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!datos.nombre.trim()) return;
    onSubmit({
      nombre: datos.nombre.trim(),
      ...(datos.email?.trim() && { email: datos.email.trim() }),
      ...(datos.telefono?.trim() && { telefono: datos.telefono.trim() }),
      ...(datos.num_acompanantes > 0 && { num_acompanantes: datos.num_acompanantes }),
      ...(datos.grupo_familiar?.trim() && { grupo_familiar: datos.grupo_familiar.trim() }),
    });
    setDatos(INITIAL_STATE);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <input
          type="text"
          placeholder="Nombre *"
          value={datos.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={datos.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={datos.telefono}
          onChange={(e) => handleChange('telefono', e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
        />
        <input
          type="text"
          placeholder="Grupo familiar"
          value={datos.grupo_familiar}
          onChange={(e) => handleChange('grupo_familiar', e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
        />
      </div>
      <button
        type="submit"
        disabled={!datos.nombre.trim() || isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Agregar invitado
      </button>
    </form>
  );
});

export default InvitadoForm;
