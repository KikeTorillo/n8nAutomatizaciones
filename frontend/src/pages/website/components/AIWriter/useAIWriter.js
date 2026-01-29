/**
 * ====================================================================
 * USE AI WRITER HOOK
 * ====================================================================
 * Hook para generar texto con IA usando diferentes tonos.
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import websiteApi from '@/services/api/modules/website.api';

// Tonos disponibles
export const TONOS = [
  {
    id: 'profesional',
    nombre: 'Profesional',
    descripcion: 'Formal y corporativo',
    emoji: '👔',
  },
  {
    id: 'casual',
    nombre: 'Casual',
    descripcion: 'Amigable y cercano',
    emoji: '😊',
  },
  {
    id: 'persuasivo',
    nombre: 'Persuasivo',
    descripcion: 'Orientado a ventas',
    emoji: '🎯',
  },
  {
    id: 'informativo',
    nombre: 'Informativo',
    descripcion: 'Educativo y claro',
    emoji: '📖',
  },
  {
    id: 'emotivo',
    nombre: 'Emotivo',
    descripcion: 'Conecta emocionalmente',
    emoji: '❤️',
  },
];

// Longitudes disponibles
export const LONGITUDES = [
  { id: 'corto', nombre: 'Corto', palabras: '10-20' },
  { id: 'medio', nombre: 'Medio', palabras: '30-50' },
  { id: 'largo', nombre: 'Largo', palabras: '70-100' },
];

/**
 * Hook para generacion de texto con IA
 * @param {Object} options - Opciones de configuracion
 * @param {string} options.industria - Industria del negocio
 * @param {Function} options.onSuccess - Callback al generar texto
 * @param {Function} options.onError - Callback en caso de error
 * @returns {Object} Estado y funciones de generacion
 */
export function useAIWriter({ industria = 'default', onSuccess, onError } = {}) {
  const [selectedTono, setSelectedTono] = useState('profesional');
  const [selectedLongitud, setSelectedLongitud] = useState('medio');

  // Mutation para generar texto
  const generateMutation = useMutation({
    mutationFn: ({ campo, contexto }) =>
      websiteApi.generarTextoConTono({
        campo,
        industria,
        tono: selectedTono,
        contexto,
        longitud: selectedLongitud,
      }),
    onSuccess: (data) => {
      onSuccess?.(data?.texto || data);
    },
    onError: (error) => {
      onError?.(error.response?.data?.message || 'Error al generar texto');
    },
  });

  // Generar texto
  const generateText = useCallback(
    (campo, contexto = {}) => {
      generateMutation.mutate({ campo, contexto });
    },
    [generateMutation]
  );

  // Reset
  const reset = useCallback(() => {
    setSelectedTono('profesional');
    setSelectedLongitud('medio');
    generateMutation.reset();
  }, [generateMutation]);

  return {
    // Estado
    selectedTono,
    selectedLongitud,
    isGenerating: generateMutation.isPending,
    generatedText: generateMutation.data?.texto || generateMutation.data,
    error: generateMutation.error,

    // Constantes
    tonos: TONOS,
    longitudes: LONGITUDES,

    // Handlers
    setTono: setSelectedTono,
    setLongitud: setSelectedLongitud,
    generateText,
    reset,
  };
}

export default useAIWriter;
