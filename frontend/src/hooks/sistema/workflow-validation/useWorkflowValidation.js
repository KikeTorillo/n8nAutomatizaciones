/**
 * Hook principal para validación de workflows
 */

import { useMemo, useCallback } from 'react';
import { ERROR_SEVERITY } from './constants';
import {
  validarNodoInicio,
  validarNodosFin,
  validarNodosConectados,
  validarSalidaInicio,
  validarNodosFinSinSalida,
  validarNodosCondicion,
  validarNodosAprobacion,
  validarNodosAccion,
  validarCaminoCompleto,
  detectarCiclos,
  validarDatosWorkflow,
} from './validators';

/**
 * Hook para validar un workflow completo
 * @param {Array} nodes - Nodos de React Flow
 * @param {Array} edges - Edges de React Flow
 * @param {Object} workflowData - Datos del workflow (codigo, nombre, etc.)
 * @returns {Object} { validar, errores, warnings, isValid, errorCount, warningCount }
 */
export function useWorkflowValidation(nodes = [], edges = [], workflowData = {}) {
  // Función de validación completa
  const validar = useCallback(() => {
    const todosErrores = [
      ...validarDatosWorkflow(workflowData),
      ...validarNodoInicio(nodes),
      ...validarNodosFin(nodes),
      ...validarNodosConectados(nodes, edges),
      ...validarSalidaInicio(nodes, edges),
      ...validarNodosFinSinSalida(nodes, edges),
      ...validarNodosCondicion(nodes, edges),
      ...validarNodosAprobacion(nodes),
      ...validarNodosAccion(nodes),
      ...validarCaminoCompleto(nodes, edges),
      ...detectarCiclos(nodes, edges),
    ];

    return todosErrores;
  }, [nodes, edges, workflowData]);

  // Ejecutar validación y memorizar resultados
  const resultados = useMemo(() => {
    const todosErrores = validar();

    const errores = todosErrores.filter((e) => e.severidad === ERROR_SEVERITY.ERROR);
    const warnings = todosErrores.filter((e) => e.severidad === ERROR_SEVERITY.WARNING);
    const infos = todosErrores.filter((e) => e.severidad === ERROR_SEVERITY.INFO);

    return {
      todos: todosErrores,
      errores,
      warnings,
      infos,
      isValid: errores.length === 0,
      errorCount: errores.length,
      warningCount: warnings.length,
      infoCount: infos.length,
    };
  }, [validar]);

  // Función para validar un nodo específico
  const validarNodo = useCallback(
    (nodeId) => {
      const nodo = nodes.find((n) => n.id === nodeId);
      if (!nodo) return [];

      const erroresNodo = [];

      // Validar según tipo
      switch (nodo.type) {
        case 'aprobacion':
          erroresNodo.push(...validarNodosAprobacion([nodo]));
          break;
        case 'condicion':
          erroresNodo.push(...validarNodosCondicion([nodo], edges));
          break;
        case 'accion':
          erroresNodo.push(...validarNodosAccion([nodo]));
          break;
      }

      return erroresNodo;
    },
    [nodes, edges]
  );

  // Obtener errores de un nodo específico
  const getErroresNodo = useCallback(
    (nodeId) => {
      return resultados.todos.filter(
        (e) =>
          e.nodoId === nodeId ||
          (Array.isArray(e.nodoId) && e.nodoId.includes(nodeId))
      );
    },
    [resultados.todos]
  );

  // Verificar si un nodo tiene errores
  const nodoTieneError = useCallback(
    (nodeId) => {
      return resultados.errores.some(
        (e) =>
          e.nodoId === nodeId ||
          (Array.isArray(e.nodoId) && e.nodoId.includes(nodeId))
      );
    },
    [resultados.errores]
  );

  // Verificar si un nodo tiene warnings
  const nodoTieneWarning = useCallback(
    (nodeId) => {
      return resultados.warnings.some(
        (e) =>
          e.nodoId === nodeId ||
          (Array.isArray(e.nodoId) && e.nodoId.includes(nodeId))
      );
    },
    [resultados.warnings]
  );

  return {
    // Función para re-validar manualmente
    validar,
    // Resultados
    ...resultados,
    // Funciones de utilidad
    validarNodo,
    getErroresNodo,
    nodoTieneError,
    nodoTieneWarning,
  };
}

export default useWorkflowValidation;
