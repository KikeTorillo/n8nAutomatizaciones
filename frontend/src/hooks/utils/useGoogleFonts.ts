import { useEffect } from 'react';

interface GoogleFontsOptions {
  enabled?: boolean;
}

/**
 * Carga Google Fonts dinámicamente.
 */
export function useGoogleFonts(fuentes: string[], { enabled = true }: GoogleFontsOptions = {}): void {
  useEffect(() => {
    if (!enabled) return;
    const unicas = [...new Set(fuentes.filter(Boolean))];
    if (unicas.length === 0) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${unicas.map((f) => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [fuentes.join(','), enabled]);
}
