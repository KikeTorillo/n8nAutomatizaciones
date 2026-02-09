/**
 * EjemplosPage — Galería de todas las plantillas, filtrable por tipo
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { usePlantillas } from '@/hooks/otros/eventos-digitales';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';

const FILTROS = [
  { label: 'Todas', value: '' },
  { label: 'Bodas', value: 'boda' },
  { label: 'XV Años', value: 'xv' },
  { label: 'Bautizos', value: 'bautizo' },
  { label: 'Cumpleaños', value: 'cumpleanos' },
];

export default function EjemplosPage() {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const params = useMemo(() => ({
    activo: true,
    ...(filtroTipo && { tipo_evento: filtroTipo }),
  }), [filtroTipo]);

  const { data: plantillasData, isLoading } = usePlantillas(params);
  const plantillas = useMemo(() => {
    const data = plantillasData?.data || plantillasData || [];
    if (!busqueda.trim()) return data;
    const term = busqueda.toLowerCase();
    return data.filter(p =>
      p.nombre?.toLowerCase().includes(term) ||
      p.descripcion?.toLowerCase().includes(term)
    );
  }, [plantillasData, busqueda]);

  return (
    <InvitacionesPublicLayout>
      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Galería de plantillas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explora todos nuestros diseños y elige el que más te guste para tu evento
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar plantilla..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {FILTROS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFiltroTipo(f.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filtroTipo === f.value
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
            </div>
          ) : plantillas.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No se encontraron plantillas
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Intenta con otro filtro o término de búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plantillas.map((p) => (
                <Link
                  key={p.id}
                  to={`/invitaciones/crear?plantilla=${p.id}`}
                  className="group"
                >
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 shadow-sm group-hover:shadow-lg transition-shadow">
                    {p.imagen_preview || p.thumbnail ? (
                      <img
                        src={p.imagen_preview || p.thumbnail}
                        alt={p.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20">
                        <span className="text-5xl">💌</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{p.nombre}</h3>
                  <p className="text-sm text-pink-600 dark:text-pink-400 capitalize">
                    {p.tipo_evento?.replace('_', ' ')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
