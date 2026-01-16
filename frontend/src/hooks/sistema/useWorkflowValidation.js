/**
 * ====================================================================
 * HOOK - useWorkflowValidation
 * ====================================================================
 *
 * Validación completa de workflows para el editor visual.
 * Incluye validación de estructura, conexiones, ciclos y configuración.
 *
 * Enero 2026
 */

import { useMemo, useCallback } from 'react';

// ==================== TIPOS DE ERROR ====================

export const ERROR_TYPES = {
  ESTRUCTURA: 'estructura',
  CONEXION: 'conexion',
  CICLO: 'ciclo',
  CONFIGURACION: 'configuracion',
  DATOS: 'datos',
};

export const ERROR_SEVERITY = {
  ERROR: 'error',     // Bloquea guardado
  WARNING: 'warning', // Permite guardar pero advierte
  INFO: 'info',       // Solo informativo
};

// ==================== VALIDADORES ====================

/**
 * Valida que exista exactamente un nodo de inicio
 */
function validarNodoInicio(nodes) {
  const errores = [];
  const nodosInicio = nodes.filter((n) => n.type === 'inicio');

  if (nodosInicio.length === 0) {
    errores.push({
      tipo: ERROR_TYPES.ESTRUCTURA,
      severidad: ERROR_SEVERITY.ERROR,
      mensaje: 'Falta nodo de inicio',
      detalle: 'El workflow debe tener un nodo de inicio para comenzar el flujo.',
      nodoId: null,
    });
  } else if (nodosInicio.length > 1) {
    errores.push({
      tipo: ERROR_TYPES.ESTRUCTURA,
      severidad: ERROR_SEVERITY.ERROR,
      mensaje: 'Múltiples nodos de inicio',
      detalle: `Solo puede haber un nodo de inicio. Se encontraron ${nodosInicio.length}.`,
      nodoId: nodosInicio.map((n) => n.id),
    });
  }

  return errores;
}

/**
 * Valida que exista al menos un nodo de fin
 */
function validarNodosFin(nodes) {
  const errores = [];
  const nodosFin = nodes.filter((n) => n.type === 'fin');

  if (nodosFin.length === 0) {
    errores.push({
      tipo: ERROR_TYPES.ESTRUCTURA,
      severidad: ERROR_SEVERITY.ERROR,
      mensaje: 'Falta nodo de fin',
      detalle: 'El workflow debe tener al menos un nodo de fin para terminar el flujo.',
      nodoId: null,
    });
  }

  return errores;
}

/**
 * Valida que todos los nodos estén conectados (no huérfanos)
 */
function validarNodosConectados(nodes, edges) {
  const errores = [];

  if (nodes.length <= 1) return errores;

  // Crear set de nodos conectados
  const nodosConectados = new Set();
  edges.forEach((e) => {
    nodosConectados.add(e.source);
    nodosConectados.add(e.target);
  });

  // Encontrar nodos huérfanos
  const nodosHuerfanos = nodes.filter((n) => !nodosConectados.has(n.id));

  if (nodosHuerfanos.length > 0) {
    nodosHuerfanos.forEach((nodo) => {
      errores.push({
        tipo: ERROR_TYPES.CONEXION,
        severidad: ERROR_SEVERITY.ERROR,
        mensaje: `Nodo sin conexión: "${nodo.data?.label || nodo.id}"`,
        detalle: 'Este nodo no está conectado al flujo principal.',
        nodoId: nodo.id,
      });
    });
  }

  return errores;
}

/**
 * Valida que el nodo de inicio tenga conexión de salida
 */
function validarSalidaInicio(nodes, edges) {
  const errores = [];
  const nodoInicio = nodes.find((n) => n.type === 'inicio');

  if (nodoInicio) {
    const salidasInicio = edges.filter((e) => e.source === nodoInicio.id);
    if (salidasInicio.length === 0) {
      errores.push({
        tipo: ERROR_TYPES.CONEXION,
        severidad: ERROR_SEVERITY.ERROR,
        mensaje: 'Nodo de inicio sin salida',
        detalle: 'El nodo de inicio debe conectarse a otro nodo.',
        nodoId: nodoInicio.id,
      });
    }
  }

  return errores;
}

/**
 * Valida que los nodos de fin no tengan conexiones de salida
 */
function validarNodosFinSinSalida(nodes, edges) {
  const errores = [];
  const nodosFin = nodes.filter((n) => n.type === 'fin');

  nodosFin.forEach((nodo) => {
    const salidasFin = edges.filter((e) => e.source === nodo.id);
    if (salidasFin.length > 0) {
      errores.push({
        tipo: ERROR_TYPES.CONEXION,
        severidad: ERROR_SEVERITY.WARNING,
        mensaje: `Nodo de fin "${nodo.data?.label}" tiene salidas`,
        detalle: 'Los nodos de fin normalmente no deberían tener conexiones de salida.',
        nodoId: nodo.id,
      });
    }
  });

  return errores;
}

/**
 * Valida que los nodos de condición tengan exactamente 2 salidas (Sí/No)
 */
function validarNodosCondicion(nodes, edges) {
  const errores = [];
  const nodosCondicion = nodes.filter((n) => n.type === 'condicion');

  nodosCondicion.forEach((nodo) => {
    const salidas = edges.filter((e) => e.source === nodo.id);

    if (salidas.length === 0) {
      errores.push({
        tipo: ERROR_TYPES.CONEXION,
        severidad: ERROR_SEVERITY.ERROR,
        mensaje: `Nodo condición "${nodo.data?.label}" sin salidas`,
        detalle: 'Los nodos de condición deben tener 2 salidas: Sí y No.',
        nodoId: nodo.id,
      });
    } else if (salidas.length === 1) {
      errores.push({
        tipo: ERROR_TYPES.CONEXION,
        severidad: ERROR_SEVERITY.ERROR,
        mensaje: `Nodo condición "${nodo.data?.label}" tiene solo 1 salida`,
        detalle: 'Debe tener exactamente 2 salidas: una para Sí y otra para No.',
        nodoId: nodo.id,
      });
    } else if (salidas.length > 2) {
      errores.push({
        tipo: ERROR_TYPES.CONEXION,
        severidad: ERROR_SEVERITY.WARNING,
        mensaje: `Nodo condición "${nodo.data?.label}" tiene ${salidas.length} salidas`,
        detalle: 'Normalmente solo debería tener 2 salidas.',
        nodoId: nodo.id,
      });
    }

    // Validar que tenga configuración de condición
    const config = nodo.data?.config;
    if (!config?.condicion || !config.condicion.condiciones?.length) {
      errores.push({
        tipo: ERROR_TYPES.CONFIGURACION,
        severidad: ERROR_SEVERITY.ERROR,
        mensaje: `Nodo condición "${nodo.data?.label}" sin condiciones`,
        detalle: 'Debes configurar al menos una condición para evaluar.',
        nodoId: nodo.id,
      });
    }
  });

  return errores;
}

/**
 * Valida que los nodos de aprobación tengan configuración completa
 */
function validarNodosAprobacion(nodes) {
  const errores = [];
  const nodosAprobacion = nodes.filter((n) => n.type === 'aprobacion');

  nodosAprobacion.forEach((nodo) => {
    const config = nodo.data?.config;

    // Validar que tenga aprobador configurado
    if (!config?.aprobador || !config.aprobador.valor) {
      errores.push({
        tipo: ERROR_TYPES.CONFIGURACION,
        severidad: ERROR_SEVERITY.ERROR,
        mensaje: `Nodo aprobación "${nodo.data?.label}" sin aprobador`,
        detalle: 'Debes seleccionar quién puede aprobar este paso.',
        nodoId: nodo.id,
      });
    }

    // Validar timeout
    if (config?.timeout_horas && config.timeout_horas < 1) {
      errores.push({
        tipo: ERROR_TYPES.CONFIGURACION,
        severidad: ERROR_SEVERITY.WARNING,
        mensaje: `Nodo aprobación "${nodo.data?.label}" con timeout muy bajo`,
        detalle: 'El timeout debe ser al menos 1 hora.',
        nodoId: nodo.id,
      });
    }
  });

  return errores;
}

/**
 * Valida que los nodos de acción tengan configuración completa
 */
function validarNodosAccion(nodes) {
  const errores = [];
  const nodosAccion = nodes.filter((n) => n.type === 'accion');

  nodosAccion.forEach((nodo) => {
    const config = nodo.data?.config;

    // Validar que tenga tipo de acción
    if (!config?.tipo_accion) {
      errores.push({
        tipo: ERROR_TYPES.CONFIGURACION,
        severidad: ERROR_SEVERITY.ERROR,
        mensaje: `Nodo acción "${nodo.data?.label}" sin tipo de acción`,
        detalle: 'Debes seleccionar qué tipo de acción ejecutará este nodo.',
        nodoId: nodo.id,
      });
    } else {
      // Validar configuración específica según tipo
      const configAccion = config.config_accion || {};

      switch (config.tipo_accion) {
        case 'cambiar_estado':
          if (!configAccion.nuevo_estado) {
            errores.push({
              tipo: ERROR_TYPES.CONFIGURACION,
              severidad: ERROR_SEVERITY.ERROR,
              mensaje: `Nodo "${nodo.data?.label}" sin estado destino`,
              detalle: 'Debes seleccionar el nuevo estado para la entidad.',
              nodoId: nodo.id,
            });
          }
          break;

        case 'notificar':
          if (!configAccion.destino) {
            errores.push({
              tipo: ERROR_TYPES.CONFIGURACION,
              severidad: ERROR_SEVERITY.ERROR,
              mensaje: `Nodo "${nodo.data?.label}" sin destinatario`,
              detalle: 'Debes seleccionar a quién enviar la notificación.',
              nodoId: nodo.id,
            });
          }
          if (!configAccion.titulo) {
            errores.push({
              tipo: ERROR_TYPES.CONFIGURACION,
              severidad: ERROR_SEVERITY.WARNING,
              mensaje: `Nodo "${nodo.data?.label}" sin título de notificación`,
              detalle: 'Es recomendable agregar un título a la notificación.',
              nodoId: nodo.id,
            });
          }
          break;

        case 'webhook':
          if (!configAccion.url) {
            errores.push({
              tipo: ERROR_TYPES.CONFIGURACION,
              severidad: ERROR_SEVERITY.ERROR,
              mensaje: `Nodo "${nodo.data?.label}" sin URL de webhook`,
              detalle: 'Debes ingresar la URL del endpoint a llamar.',
              nodoId: nodo.id,
            });
          } else if (!configAccion.url.startsWith('http')) {
            errores.push({
              tipo: ERROR_TYPES.CONFIGURACION,
              severidad: ERROR_SEVERITY.ERROR,
              mensaje: `Nodo "${nodo.data?.label}" con URL inválida`,
              detalle: 'La URL debe comenzar con http:// o https://',
              nodoId: nodo.id,
            });
          }
          break;
      }
    }
  });

  return errores;
}

/**
 * Detecta ciclos infinitos en el grafo usando DFS
 */
function detectarCiclos(nodes, edges) {
  const errores = [];

  // Construir grafo de adyacencia
  const grafo = new Map();
  nodes.forEach((node) => {
    grafo.set(node.id, []);
  });
  edges.forEach((edge) => {
    if (grafo.has(edge.source)) {
      grafo.get(edge.source).push(edge.target);
    }
  });

  // DFS para detectar ciclos
  const visitado = new Set();
  const enPila = new Set();
  const ciclosEncontrados = [];

  function dfs(nodoId, camino = []) {
    if (enPila.has(nodoId)) {
      // Encontramos un ciclo
      const inicioCiclo = camino.indexOf(nodoId);
      const ciclo = camino.slice(inicioCiclo);
      ciclo.push(nodoId);
      ciclosEncontrados.push(ciclo);
      return true;
    }

    if (visitado.has(nodoId)) {
      return false;
    }

    visitado.add(nodoId);
    enPila.add(nodoId);
    camino.push(nodoId);

    const vecinos = grafo.get(nodoId) || [];
    for (const vecino of vecinos) {
      dfs(vecino, [...camino]);
    }

    enPila.delete(nodoId);
    return false;
  }

  // Iniciar DFS desde cada nodo
  nodes.forEach((node) => {
    if (!visitado.has(node.id)) {
      dfs(node.id, []);
    }
  });

  // Crear errores para ciclos encontrados
  if (ciclosEncontrados.length > 0) {
    // Eliminar duplicados (el mismo ciclo puede encontrarse múltiples veces)
    const ciclosUnicos = [];
    const ciclosVistos = new Set();

    ciclosEncontrados.forEach((ciclo) => {
      const cicloStr = ciclo.sort().join('-');
      if (!ciclosVistos.has(cicloStr)) {
        ciclosVistos.add(cicloStr);
        ciclosUnicos.push(ciclo);
      }
    });

    ciclosUnicos.forEach((ciclo) => {
      const nodosDelCiclo = ciclo.map((id) => {
        const nodo = nodes.find((n) => n.id === id);
        return nodo?.data?.label || id;
      });

      errores.push({
        tipo: ERROR_TYPES.CICLO,
        severidad: ERROR_SEVERITY.WARNING,
        mensaje: 'Ciclo detectado en el workflow',
        detalle: `El flujo puede entrar en un bucle infinito: ${nodosDelCiclo.join(' → ')}`,
        nodoId: ciclo,
      });
    });
  }

  return errores;
}

/**
 * Valida que el workflow tenga un camino desde inicio hasta al menos un fin
 */
function validarCaminoCompleto(nodes, edges) {
  const errores = [];

  const nodoInicio = nodes.find((n) => n.type === 'inicio');
  const nodosFin = nodes.filter((n) => n.type === 'fin');

  if (!nodoInicio || nodosFin.length === 0) {
    return errores; // Ya validado en otras funciones
  }

  // BFS desde inicio
  const visitados = new Set();
  const cola = [nodoInicio.id];

  while (cola.length > 0) {
    const actual = cola.shift();
    if (visitados.has(actual)) continue;
    visitados.add(actual);

    // Encontrar vecinos (nodos destino de edges desde el actual)
    const vecinos = edges
      .filter((e) => e.source === actual)
      .map((e) => e.target);

    vecinos.forEach((v) => {
      if (!visitados.has(v)) {
        cola.push(v);
      }
    });
  }

  // Verificar si algún nodo de fin es alcanzable
  const finAlcanzable = nodosFin.some((fin) => visitados.has(fin.id));

  if (!finAlcanzable) {
    errores.push({
      tipo: ERROR_TYPES.CONEXION,
      severidad: ERROR_SEVERITY.ERROR,
      mensaje: 'No hay camino al nodo de fin',
      detalle: 'El flujo no puede llegar desde el inicio hasta ningún nodo de fin.',
      nodoId: null,
    });
  }

  return errores;
}

/**
 * Valida los datos generales del workflow
 */
function validarDatosWorkflow(workflowData) {
  const errores = [];

  if (!workflowData.codigo?.trim()) {
    errores.push({
      tipo: ERROR_TYPES.DATOS,
      severidad: ERROR_SEVERITY.ERROR,
      mensaje: 'Código del workflow requerido',
      detalle: 'Debes ingresar un código único para el workflow.',
      nodoId: null,
    });
  } else if (!/^[a-z0-9_]+$/.test(workflowData.codigo)) {
    errores.push({
      tipo: ERROR_TYPES.DATOS,
      severidad: ERROR_SEVERITY.WARNING,
      mensaje: 'Código con formato no recomendado',
      detalle: 'Se recomienda usar solo letras minúsculas, números y guiones bajos.',
      nodoId: null,
    });
  }

  if (!workflowData.nombre?.trim()) {
    errores.push({
      tipo: ERROR_TYPES.DATOS,
      severidad: ERROR_SEVERITY.ERROR,
      mensaje: 'Nombre del workflow requerido',
      detalle: 'Debes ingresar un nombre descriptivo para el workflow.',
      nodoId: null,
    });
  }

  if (!workflowData.entidad_tipo) {
    errores.push({
      tipo: ERROR_TYPES.DATOS,
      severidad: ERROR_SEVERITY.ERROR,
      mensaje: 'Tipo de entidad requerido',
      detalle: 'Debes seleccionar sobre qué tipo de entidad aplica el workflow.',
      nodoId: null,
    });
  }

  return errores;
}

// ==================== HOOK PRINCIPAL ====================

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

// ==================== EXPORTACIONES ====================

export default useWorkflowValidation;

// Exportar funciones individuales para testing
export {
  validarNodoInicio,
  validarNodosFin,
  validarNodosConectados,
  validarNodosCondicion,
  validarNodosAprobacion,
  validarNodosAccion,
  detectarCiclos,
  validarCaminoCompleto,
  validarDatosWorkflow,
};
