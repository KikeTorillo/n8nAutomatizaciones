import { useState } from 'react';
import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';
import DirectorioFiltros from '@/components/marketplace/DirectorioFiltros';
import DirectorioGrid from '@/components/marketplace/DirectorioGrid';
import { usePerfilesMarketplace } from '@/hooks/useMarketplace';

/**
 * Página pública del directorio de marketplace
 * Permite buscar y filtrar negocios por ciudad, categoría y rating
 * No requiere autenticación
 */
function DirectorioMarketplacePage() {
  // Estado de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    ciudad: '',
    categoria_id: '', // ID de categoría (industria)
    rating_min: '',
    pagina: 1,
    limite: 12,
  });

  // Hook para obtener perfiles (con filtros y paginación)
  const { data, isLoading, error } = usePerfilesMarketplace(filtros);

  // Handler para cambiar un filtro individual
  const handleFiltroChange = (key, value) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      pagina: 1, // ⚠️ CRÍTICO: Resetear página cuando cambian los filtros
    }));
  };

  // Handler para limpiar todos los filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      ciudad: '',
      categoria_id: '',
      rating_min: '',
      pagina: 1,
      limite: 12,
    });
  };

  // Handler para cambiar de página
  const handlePageChange = (page) => {
    setFiltros((prev) => ({ ...prev, pagina: page }));
    // Scroll to top suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título y descripción */}
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Encuentra el negocio perfecto
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              Descubre los mejores profesionales cerca de ti
            </p>
          </div>

          {/* Búsqueda principal */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar por nombre o categoría..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg bg-white text-gray-900 placeholder-gray-500 shadow-xl"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            </div>

            {/* Hint de búsqueda */}
            <p className="text-sm text-primary-100 mt-3 text-center">
              Ejemplo: "barbería", "spa", "entrenador personal"
            </p>
          </div>
        </div>
      </section>

      {/* Directorio - Layout con Sidebar + Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filtros (sticky en desktop) */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <DirectorioFiltros
              filtros={filtros}
              onChange={handleFiltroChange}
              onLimpiar={handleLimpiarFiltros}
            />
          </aside>

          {/* Contenido Principal - Grid de Negocios */}
          <main className="flex-1 min-w-0">
            <DirectorioGrid
              perfiles={data?.perfiles}
              paginacion={data?.paginacion}
              isLoading={isLoading}
              error={error}
              onPageChange={handlePageChange}
            />
          </main>
        </div>
      </section>

      {/* Footer Section (opcional - info adicional) */}
      <section className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              ¿Tienes un negocio?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Únete a nuestro marketplace y conecta con nuevos clientes
            </p>
            <a
              href="/registro"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Registra tu negocio
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DirectorioMarketplacePage;
