/**
 * CompartirLinks — Links de compartir: copiar, WhatsApp, QR
 */
import { useState, memo } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

const CompartirLinks = memo(function CompartirLinks({ slug }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${window.location.origin}/e/${slug}`;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const texto = encodeURIComponent(`¡Estás invitado! Abre tu invitación aquí: ${url}`);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Link copiable */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Link de tu invitación
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={handleCopiar}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Botones de compartir */}
      <div className="flex gap-3">
        <button
          onClick={handleWhatsApp}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Compartir por WhatsApp
        </button>
      </div>
    </div>
  );
});

export default CompartirLinks;
