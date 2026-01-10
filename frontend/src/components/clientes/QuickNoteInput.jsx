/**
 * ====================================================================
 * QUICK NOTE INPUT - INPUT RÁPIDO PARA NOTAS
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * Input inline para agregar notas rápidas al timeline
 *
 * ====================================================================
 */

import { useState } from 'react';
import { FileText, Phone, Mail, ListTodo, Send, Loader2 } from 'lucide-react';

const TIPOS_RAPIDOS = [
  { value: 'nota', icon: FileText, label: 'Nota', color: 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30' },
  { value: 'llamada', icon: Phone, label: 'Llamada', color: 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30' },
  { value: 'email', icon: Mail, label: 'Email', color: 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30' },
];

export default function QuickNoteInput({
  onSubmit,
  onOpenTareaDrawer,
  isLoading = false,
  placeholder = 'Agregar una nota rápida...',
}) {
  const [tipo, setTipo] = useState('nota');
  const [titulo, setTitulo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!titulo.trim()) return;

    await onSubmit({
      tipo,
      titulo: titulo.trim(),
      fuente: 'manual',
    });

    setTitulo('');
    setTipo('nota');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      {/* Selector de tipo */}
      <div className="flex items-center gap-1 mb-3">
        {TIPOS_RAPIDOS.map(({ value, icon: Icon, label, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTipo(value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${tipo === value
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : `text-gray-600 dark:text-gray-400 ${color}`
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        {/* Botón para tarea completa */}
        {onOpenTareaDrawer && (
          <button
            type="button"
            onClick={onOpenTareaDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all ml-auto"
            title="Crear tarea con más detalles"
          >
            <ListTodo className="w-4 h-4" />
            <span className="hidden sm:inline">Tarea</span>
          </button>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="
            flex-1 px-4 py-2.5 rounded-lg
            bg-gray-50 dark:bg-gray-900
            border border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />

        <button
          type="submit"
          disabled={isLoading || !titulo.trim()}
          className="
            flex items-center justify-center
            w-10 h-10 rounded-lg
            bg-primary-500 hover:bg-primary-600
            text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
