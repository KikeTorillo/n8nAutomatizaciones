import { useRef, useEffect, useCallback } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';

// Colores por tipo de empleado
const TIPO_COLORS = {
  gerencial: '#9333ea',
  administrativo: '#3b82f6',
  operativo: '#22c55e',
  ventas: '#f59e0b',
};

const TIPO_LABELS = {
  gerencial: 'Gerencial',
  administrativo: 'Administrativo',
  operativo: 'Operativo',
  ventas: 'Ventas',
};

// Colores por estado
const ESTADO_COLORS = {
  activo: '#22c55e',
  vacaciones: '#eab308',
  incapacidad: '#f97316',
  suspendido: '#ef4444',
  baja: '#6b7280',
};

/**
 * Convierte el árbol jerárquico a formato plano para d3-org-chart
 * d3-org-chart espera: [{ id, parentId, ...data }]
 */
function flattenTree(nodes, parentId = null) {
  const result = [];

  nodes.forEach(node => {
    result.push({
      id: String(node.id),
      parentId: parentId ? String(parentId) : null,
      nombre_completo: node.nombre_completo || 'Sin nombre',
      foto_url: node.foto_url,
      puesto_nombre: node.puesto?.nombre || node.puesto_nombre || '',
      departamento_nombre: node.departamento?.nombre || node.departamento_nombre || '',
      estado: node.estado || 'activo',
      tipo: node.tipo || '',
      email: node.email || '',
      telefono: node.telefono || '',
      color_calendario: node.color_calendario || '#753572',
      childrenCount: node.children?.length || 0,
      _raw: node, // Guardar datos originales
    });

    if (node.children?.length > 0) {
      result.push(...flattenTree(node.children, node.id));
    }
  });

  return result;
}

/**
 * Genera las iniciales del nombre
 */
function getInitials(nombre) {
  if (!nombre) return '??';
  const parts = nombre.split(' ');
  return (parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '');
}

/**
 * Genera el HTML del contenido del nodo
 */
function renderNodeContent(d, isDarkMode) {
  const data = d.data;
  const estadoColor = ESTADO_COLORS[data.estado] || ESTADO_COLORS.activo;
  const tipoColor = TIPO_COLORS[data.tipo] || '#6b7280';
  const tipoLabel = TIPO_LABELS[data.tipo] || '';

  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#f3f4f6' : '#111827';
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';

  // Avatar: foto o iniciales
  const avatarHtml = data.foto_url
    ? `<img src="${data.foto_url}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid ${data.color_calendario};" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:${data.color_calendario};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px;">${getInitials(data.nombre_completo)}</div>`;

  // Badge de tipo
  const tipoBadge = tipoLabel
    ? `<span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:${tipoColor}20;color:${tipoColor};border:1px solid ${tipoColor}40;">${tipoLabel}</span>`
    : '';

  // Contador de subordinados
  const childrenBadge = data.childrenCount > 0
    ? `<div style="font-size:11px;color:${textSecondary};margin-top:4px;">${data.childrenCount} reporte${data.childrenCount !== 1 ? 's' : ''}</div>`
    : '';

  return `
    <div style="
      background:${bgColor};
      border:1px solid ${borderColor};
      border-left:4px solid ${estadoColor};
      border-radius:12px;
      padding:12px;
      width:${d.width}px;
      height:${d.height}px;
      box-shadow:0 2px 8px rgba(0,0,0,0.1);
      display:flex;
      flex-direction:column;
      cursor:pointer;
      transition:box-shadow 0.2s;
    " onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        ${avatarHtml}
        <div style="flex:1;min-width:0;overflow:hidden;">
          <div style="font-weight:600;color:${textColor};font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${data.nombre_completo}
          </div>
          <div style="font-size:11px;color:${textSecondary};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${data.puesto_nombre || 'Sin puesto'}
          </div>
          <div style="font-size:10px;color:${textSecondary};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${data.departamento_nombre || ''}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:8px;">
        ${tipoBadge}
        ${childrenBadge}
      </div>
    </div>
  `;
}

/**
 * Componente de Organigrama con D3.js
 * Usa d3-org-chart para renderizar un organigrama interactivo
 */
function D3OrgChart({
  data,
  onNodeClick,
  isDarkMode = false,
  organizacionNombre = 'Organización',
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  // Exponer métodos del chart
  const expandAll = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.expandAll().render();
    }
  }, []);

  const collapseAll = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.collapseAll().render();
    }
  }, []);

  const fit = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.fit();
    }
  }, []);

  const zoomIn = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.zoomOut();
    }
  }, []);

  // Efecto para inicializar y actualizar el chart
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Transformar datos
    let chartData = flattenTree(data);

    // Si hay múltiples raíces, crear nodo virtual de organización
    const rootNodes = chartData.filter(d => !d.parentId);
    if (rootNodes.length > 1) {
      chartData = [
        {
          id: 'org-root',
          parentId: null,
          nombre_completo: organizacionNombre,
          foto_url: null,
          puesto_nombre: 'Organización',
          departamento_nombre: '',
          estado: 'activo',
          tipo: 'gerencial',
          color_calendario: '#753572',
          childrenCount: rootNodes.length,
          _isVirtual: true,
        },
        ...chartData.map(d => ({
          ...d,
          parentId: d.parentId || 'org-root',
        })),
      ];
    }

    // Crear o actualizar chart
    if (!chartRef.current) {
      chartRef.current = new OrgChart();
    }

    const linkColor = isDarkMode ? '#4b5563' : '#d1d5db';

    chartRef.current
      .container(containerRef.current)
      .data(chartData)
      .nodeWidth(() => 220)
      .nodeHeight(() => 110)
      .childrenMargin(() => 40)
      .compactMarginBetween(() => 25)
      .siblingsMargin(() => 20)
      .neighbourMargin(() => 40)
      .layout('top') // Layout vertical top-down
      .compact(false)
      .linkUpdate(function (d) {
        // Estilizar las líneas de conexión
        d3.select(this)
          .attr('stroke', linkColor)
          .attr('stroke-width', 2);
      })
      .nodeContent((d) => renderNodeContent(d, isDarkMode))
      .onNodeClick((d) => {
        if (d.data._isVirtual) return; // No hacer nada en nodo virtual
        onNodeClick?.(d.data._raw || d.data);
      })
      .render()
      .fit();

    // Cleanup
    return () => {
      // d3-org-chart no tiene método destroy explícito
      // pero al re-renderizar se limpia automáticamente
    };
  }, [data, isDarkMode, organizacionNombre, onNodeClick]);

  // Re-renderizar cuando cambia el tema
  useEffect(() => {
    if (chartRef.current && data?.length > 0) {
      chartRef.current.render();
    }
  }, [isDarkMode]);

  return (
    <div className="relative">
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={expandAll}
          className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Expandir todo"
        >
          Expandir
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Colapsar todo"
        >
          Colapsar
        </button>
        <button
          onClick={fit}
          className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Ajustar a pantalla"
        >
          Ajustar
        </button>
        <button
          onClick={zoomIn}
          className="w-8 h-8 flex items-center justify-center text-lg font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Acercar"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 flex items-center justify-center text-lg font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Alejar"
        >
          −
        </button>
      </div>

      {/* Container del chart */}
      <div
        ref={containerRef}
        className="w-full h-[600px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      />

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
        Usa la rueda del mouse para zoom • Arrastra para mover • Click en nodo para ver detalle
      </div>
    </div>
  );
}

export default D3OrgChart;
