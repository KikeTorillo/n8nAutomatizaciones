import { useMemo } from 'react';
import { useProfesionales } from './useProfesionales';
import { useDepartamentos } from './useDepartamentos';

/**
 * Hook para obtener el organigrama jerárquico de profesionales
 * Construye un árbol basado en supervisor_id
 */
export function useOrganigrama() {
  const { data: profesionalesData, isLoading: loadingProfesionales } = useProfesionales();
  const profesionales = profesionalesData?.profesionales || [];
  const { data: departamentos = [], isLoading: loadingDepartamentos } = useDepartamentos();

  // Construir árbol jerárquico
  const arbol = useMemo(() => {
    if (!profesionales.length) return [];

    // Crear mapa de departamentos para lookup rápido
    const deptMap = departamentos.reduce((acc, d) => {
      acc[d.id] = d;
      return acc;
    }, {});

    // Crear mapa de profesionales
    const profMap = new Map();
    profesionales.forEach(p => {
      profMap.set(p.id, {
        ...p,
        departamento: deptMap[p.departamento_id] || null,
        children: [],
      });
    });

    // Construir árbol
    const roots = [];
    profMap.forEach(prof => {
      if (prof.supervisor_id && profMap.has(prof.supervisor_id)) {
        // Tiene supervisor válido - agregar como hijo
        profMap.get(prof.supervisor_id).children.push(prof);
      } else {
        // Sin supervisor o supervisor no existe - es raíz
        roots.push(prof);
      }
    });

    // Ordenar hijos por nombre
    const sortChildren = (nodes) => {
      nodes.sort((a, b) => a.nombre_completo?.localeCompare(b.nombre_completo));
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortChildren(node.children);
        }
      });
    };
    sortChildren(roots);

    return roots;
  }, [profesionales, departamentos]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = profesionales.length;
    const activos = profesionales.filter(p => p.estado === 'activo').length;
    const conSupervisor = profesionales.filter(p => p.supervisor_id).length;
    const sinSupervisor = total - conSupervisor;

    // Contar por tipo
    const porTipo = profesionales.reduce((acc, p) => {
      const tipo = p.tipo || 'sin_tipo';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    // Contar por departamento
    const porDepartamento = profesionales.reduce((acc, p) => {
      const dept = p.departamento_id || 'sin_departamento';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    // Calcular profundidad máxima
    const calcularProfundidad = (nodes, nivel = 0) => {
      if (!nodes.length) return nivel;
      return Math.max(...nodes.map(n =>
        n.children.length > 0
          ? calcularProfundidad(n.children, nivel + 1)
          : nivel + 1
      ));
    };
    const profundidadMaxima = arbol.length > 0 ? calcularProfundidad(arbol) : 0;

    return {
      total,
      activos,
      conSupervisor,
      sinSupervisor,
      porTipo,
      porDepartamento,
      profundidadMaxima,
      raices: arbol.length,
    };
  }, [profesionales, arbol]);

  return {
    arbol,
    profesionales,
    departamentos,
    stats,
    isLoading: loadingProfesionales || loadingDepartamentos,
  };
}

export default useOrganigrama;
