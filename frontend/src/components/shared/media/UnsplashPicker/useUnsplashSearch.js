/**
 * ====================================================================
 * USE UNSPLASH SEARCH HOOK
 * ====================================================================
 * Hook para buscar imagenes en Unsplash con debounce.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/config';
import imagesApi from '@/services/api/modules/images.api';

/**
 * Hook para buscar imagenes en Unsplash
 * @param {Object} options - Opciones de configuracion
 * @param {number} options.debounceMs - Tiempo de debounce en ms (default: 300)
 * @param {Object} options.apiClient - API client con buscarImagenes y descargarImagen (default: imagesApi)
 * @returns {Object} Estado y funciones de busqueda
 */
export function useUnsplashSearch({ debounceMs = 300, apiClient = imagesApi } = {}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  // Debounce del query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset page on new search
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Query para buscar imagenes
  const {
    data: searchResults,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.storage.unsplash(debouncedQuery, page),
    queryFn: () =>
      apiClient.buscarImagenes({
        query: debouncedQuery,
        page,
        per_page: 20,
      }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
    keepPreviousData: true,
  });

  // Mutation para descargar imagen
  const downloadMutation = useMutation({
    mutationFn: (imageData) => apiClient.descargarImagen(imageData),
  });

  // Handlers
  const handleSearch = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  const handleNextPage = useCallback(() => {
    if (searchResults?.total_pages > page) {
      setPage((p) => p + 1);
    }
  }, [searchResults?.total_pages, page]);

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [page]);

  const handleDownload = useCallback(
    async (image) => {
      try {
        const result = await downloadMutation.mutateAsync({
          url: image.urls.regular,
          photographer: image.user.name,
          unsplashId: image.id,
          downloadLocation: image.links.download_location,
        });
        return result.url;
      } catch (error) {
        throw error;
      }
    },
    [downloadMutation]
  );

  return {
    // Estado
    query,
    page,
    images: searchResults?.results || [],
    totalPages: searchResults?.total_pages || 0,
    totalResults: searchResults?.total || 0,
    isLoading: isLoading || isFetching,
    isDownloading: downloadMutation.isPending,
    error,

    // Handlers
    handleSearch,
    handleNextPage,
    handlePrevPage,
    handleDownload,
    refetch,
  };
}

export default useUnsplashSearch;
