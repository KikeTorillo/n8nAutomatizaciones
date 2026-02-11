import { memo } from 'react';
import { SearchInput } from '../../organisms/SearchInput';
import { Button } from '../../atoms/Button';
import { Download } from 'lucide-react';

interface ListadoFiltersProps {
  filtros: Record<string, unknown>;
  setFiltro: (key: string, value: unknown) => void;
  limpiarFiltros: () => void;
  filtrosActivos: number;
  resetPage: () => void;
  exportConfig?: unknown;
  itemsCount: number;
  onExport: () => void;
}

export const ListadoFilters = memo(function ListadoFilters({
  filtros,
  setFiltro,
  limpiarFiltros,
  filtrosActivos,
  resetPage,
  exportConfig,
  itemsCount,
  onExport,
}: ListadoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <SearchInput
          value={(filtros.busqueda as string) || ''}
          onChange={(e) => {
            setFiltro('busqueda', (e.target as HTMLInputElement).value);
            resetPage();
          }}
          placeholder="Buscar..."
        />
      </div>
      <div className="flex gap-2">
        {filtrosActivos > 0 && (
          <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
        {exportConfig && itemsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        )}
      </div>
    </div>
  );
});
