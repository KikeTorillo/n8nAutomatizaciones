import { useState, useCallback } from 'react';
import { useUploadArchivo } from './useStorage';
import { useToast } from './useToast';

interface UseImageUploadOptions {
  /** Carpeta destino en storage (ej: 'servicios', 'clientes') */
  folder: string;
  /** Tamaño máximo en MB (default: 5) */
  maxSizeMB?: number;
}

interface UseImageUploadReturn {
  /** Archivo seleccionado pendiente de subir */
  file: File | null;
  /** URL de preview (blob o url remota) */
  preview: string | null;
  /** URL remota ya subida (o existente en edición) */
  url: string | null;
  /** Si el upload está en progreso */
  isPending: boolean;
  /** Handler para input[type=file] onChange */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Eliminar imagen (file + preview + url) */
  handleEliminar: () => void;
  /** Sube el file si existe, sino retorna url actual */
  upload: () => Promise<string | null>;
  /** Reset completo (para cuando cierra el drawer) */
  reset: () => void;
  /** Cargar url existente en modo edición */
  loadFromUrl: (url: string | null) => void;
}

/**
 * Hook reutilizable para manejo de imagen en formularios.
 * Encapsula: selección de archivo, validación, preview, upload y reset.
 *
 * @example
 * const imagen = useImageUpload({ folder: 'servicios' });
 * // En JSX: <input type="file" onChange={imagen.handleChange} />
 * // En submit: const url = await imagen.upload();
 */
export function useImageUpload({ folder, maxSizeMB = 5 }: UseImageUploadOptions): UseImageUploadReturn {
  const { error: showError } = useToast() as { error: (msg: string) => void };
  const uploadMutation = useUploadArchivo();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      showError('Solo se permiten archivos de imagen');
      return;
    }
    if (selected.size > maxSizeMB * 1024 * 1024) {
      showError(`La imagen no debe superar ${maxSizeMB}MB`);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }, [maxSizeMB, showError]);

  const handleEliminar = useCallback(() => {
    setFile(null);
    setPreview(null);
    setUrl(null);
  }, []);

  const upload = useCallback(async (): Promise<string | null> => {
    if (!file) return url;

    const resultado = await uploadMutation.mutateAsync({
      file,
      folder,
      isPublic: true,
    });
    return (resultado as { url?: string })?.url || (resultado as string);
  }, [file, url, folder, uploadMutation]);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setUrl(null);
  }, []);

  const loadFromUrl = useCallback((remoteUrl: string | null) => {
    if (remoteUrl) {
      setUrl(remoteUrl);
      setPreview(remoteUrl);
    } else {
      setUrl(null);
      setPreview(null);
    }
    setFile(null);
  }, []);

  return {
    file,
    preview,
    url,
    isPending: uploadMutation.isPending,
    handleChange,
    handleEliminar,
    upload,
    reset,
    loadFromUrl,
  };
}
