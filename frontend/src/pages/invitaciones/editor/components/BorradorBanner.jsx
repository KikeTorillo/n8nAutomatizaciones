/**
 * BorradorBanner — Banner informativo sobre el estado de borrador local
 */
import { memo } from 'react';
import { Cloud, ArrowRight } from 'lucide-react';
import { useBorradorEditor } from '../context/BorradorEditorContext';

const BorradorBanner = memo(function BorradorBanner() {
  const { abrirGateModal } = useBorradorEditor();

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
        <Cloud className="w-4 h-4 flex-shrink-0" />
        <span>Borrador local — Los cambios se guardan en este dispositivo.</span>
      </div>
      <button
        onClick={abrirGateModal}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors flex-shrink-0"
      >
        Guardar mi invitaci\u00f3n
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

export default BorradorBanner;
