import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Globe,
  FileText,
  Code,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { websiteApi } from '@/services/api/modules/website.api';

/**
 * SEOPanel - Panel completo de SEO con auditoria y preview
 */
function SEOPanel({ websiteId, slug }) {
  const [expandedCat, setExpandedCat] = useState(null);
  const [showSchema, setShowSchema] = useState(false);

  // Query para auditoria SEO
  const {
    data: auditoria,
    isLoading: loadingAuditoria,
    refetch: refetchAuditoria,
  } = useQuery({
    queryKey: ['website', 'seo', 'auditoria', websiteId],
    queryFn: () => websiteApi.obtenerAuditoriaSEO(websiteId),
    enabled: !!websiteId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Query para preview de Google
  const {
    data: previewGoogle,
    isLoading: loadingPreview,
  } = useQuery({
    queryKey: ['website', 'seo', 'preview', websiteId],
    queryFn: () => websiteApi.obtenerPreviewGoogle(websiteId),
    enabled: !!websiteId,
    staleTime: 1000 * 60 * 5,
  });

  // Query para schema
  const {
    data: schema,
    isLoading: loadingSchema,
  } = useQuery({
    queryKey: ['website', 'seo', 'schema', websiteId],
    queryFn: () => websiteApi.obtenerSchemaSEO(websiteId),
    enabled: !!websiteId && showSchema,
  });

  const getScoreColor = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'text-green-600 dark:text-green-400';
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">SEO</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Optimizacion para buscadores
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetchAuditoria()}
          className="p-2"
        >
          <RefreshCw className={`w-4 h-4 ${loadingAuditoria ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Score general */}
      {auditoria && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Puntuacion SEO</h4>
            <span className={`text-3xl font-bold ${getScoreColor(auditoria.score, auditoria.maximo)}`}>
              {auditoria.score}/{auditoria.maximo}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full ${getScoreBg(auditoria.score, auditoria.maximo)} transition-all`}
              style={{ width: `${(auditoria.score / auditoria.maximo) * 100}%` }}
            />
          </div>

          {/* Categorias */}
          <div className="space-y-3">
            {Object.entries(auditoria.categorias).map(([key, cat]) => (
              <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCat(expandedCat === key ? null : key)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                      {key}
                    </span>
                    <span className={`text-sm ${getScoreColor(cat.score, cat.maximo)}`}>
                      {cat.score}/{cat.maximo}
                    </span>
                  </div>
                  {expandedCat === key ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {expandedCat === key && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-700/30">
                    <div className="space-y-2">
                      {cat.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {item.estado === 'ok' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {item.estado === 'warning' && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                            {item.estado === 'error' && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-gray-700 dark:text-gray-300">{item.nombre}</span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            +{item.puntos} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview de Google */}
      {previewGoogle && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Preview en Google</h4>
          </div>

          {/* SERP Preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 font-sans">
            <div className="flex items-center gap-2 mb-1">
              {previewGoogle.favicon && (
                <img src={previewGoogle.favicon} alt="" className="w-4 h-4 rounded" />
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {previewGoogle.url}
              </span>
            </div>
            <h5 className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer mb-1">
              {previewGoogle.titulo}
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {previewGoogle.descripcion}
            </p>
          </div>

          {/* Advertencias */}
          {(previewGoogle.advertencias?.titulo || previewGoogle.advertencias?.descripcion) && (
            <div className="mt-3 space-y-1">
              {previewGoogle.advertencias.titulo && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  {previewGoogle.advertencias.titulo}
                </div>
              )}
              {previewGoogle.advertencias.descripcion && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  {previewGoogle.advertencias.descripcion}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Links utiles */}
      {slug && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Archivos SEO</h4>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/v1/public/sitio/${slug}/sitemap.xml`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Code className="w-3 h-3" />
              sitemap.xml
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`/api/v1/public/sitio/${slug}/robots.txt`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Code className="w-3 h-3" />
              robots.txt
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Schema markup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => setShowSchema(!showSchema)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Schema Markup (JSON-LD)</h4>
          </div>
          {showSchema ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showSchema && schema && (
          <div className="mt-3">
            <pre className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
              {JSON.stringify(schema, null, 2)}
            </pre>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Este codigo se incluye automaticamente en tu sitio publico.
            </p>
          </div>
        )}
      </div>

      {/* Recomendaciones */}
      {auditoria?.recomendaciones?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="font-medium text-amber-700 dark:text-amber-300">Recomendaciones</h4>
          </div>

          <ul className="space-y-2">
            {auditoria.recomendaciones.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                <span className="text-amber-400 mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SEOPanel;
