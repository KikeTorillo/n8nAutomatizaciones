/**
 * ====================================================================
 * WEBSITE TEMPLATE GALLERY
 * ====================================================================
 * Wrapper de TemplateGalleryModal para el módulo Website.
 * Data fetching + mutation. Usa DefaultGalleryCard del modal.
 *
 * @version 1.1.0
 * @since 2026-02-05
 */

import { memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/hooks/config';
import { websiteApi } from '@/services/api/modules/website.api';
import { TemplateGalleryModal } from '@/components/editor-framework';

/**
 * WebsiteTemplateGallery
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onTemplateApplied
 */
function WebsiteTemplateGallery({ isOpen, onClose, onTemplateApplied }) {
  const queryClient = useQueryClient();

  // Queries
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: queryKeys.website.templates.all,
    queryFn: () => websiteApi.listarTemplates(),
    enabled: isOpen,
  });

  const { data: industrias = [] } = useQuery({
    queryKey: queryKeys.website.templates.industrias,
    queryFn: () => websiteApi.listarIndustrias(),
    enabled: isOpen,
  });

  // Mutation
  const aplicarTemplate = useMutation({
    mutationFn: (templateId) => websiteApi.aplicarTemplate(templateId, {}),
    onSuccess: () => {
      toast.success('Plantilla aplicada exitosamente');
      queryClient.invalidateQueries(['website']);
      onTemplateApplied?.();
      onClose?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al aplicar plantilla');
    },
  });

  // Mapear industrias a categorías
  const categories = industrias.map((ind) => ({
    key: ind.industria,
    label: ind.label,
  }));

  return (
    <TemplateGalleryModal
      isOpen={isOpen}
      onClose={onClose}
      templates={templates}
      isLoading={loadingTemplates}
      categories={categories}
      categoryField="industria"
      previewWidth={320}
      onApply={(template) => aplicarTemplate.mutate(template.id)}
      isApplying={aplicarTemplate.isPending}
      subtitle="Elige un diseño profesional para tu sitio web"
    />
  );
}

export default memo(WebsiteTemplateGallery);
