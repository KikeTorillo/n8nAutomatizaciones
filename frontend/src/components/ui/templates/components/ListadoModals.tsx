import { memo } from 'react';
import {
  ConfirmDialog,
  type ConfirmDialogProps,
} from '../../organisms/ConfirmDialog';
import type { DeleteConfirmProps } from '../../hooks/useDeleteConfirmation';

interface OverlayComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  data?: unknown;
  [key: string]: unknown;
}

interface ExtraModalConfig {
  component: React.ComponentType<OverlayComponentProps>;
  mapData?: (data: unknown) => Record<string, unknown>;
  props?: Record<string, unknown>;
}

interface ListadoModalsProps {
  FormDrawer?: React.ComponentType<OverlayComponentProps>;
  formDrawerProps: Record<string, unknown>;
  mapFormData?: (data: unknown) => Record<string, unknown>;
  StatsModal?: React.ComponentType<OverlayComponentProps>;
  statsModalProps: Record<string, unknown>;
  mapStatsData?: (data: unknown) => Record<string, unknown>;
  extraModals: Record<string, ExtraModalConfig>;
  deleteMutation: unknown;
  deleteConfirmProps: DeleteConfirmProps;
  isOpen: (key: string) => boolean;
  closeModal: (key: string) => void;
  getModalData: (key: string) => unknown;
}

export const ListadoModals = memo(function ListadoModals({
  FormDrawer,
  formDrawerProps,
  mapFormData,
  StatsModal,
  statsModalProps,
  mapStatsData,
  extraModals,
  deleteMutation,
  deleteConfirmProps,
  isOpen,
  closeModal,
  getModalData,
}: ListadoModalsProps) {
  return (
    <>
      {/* Form Drawer */}
      {FormDrawer && isOpen('form') && (
        <FormDrawer
          key={`form-${(getModalData('form') as Record<string, unknown>)?.id || 'new'}`}
          isOpen={isOpen('form')}
          onClose={() => closeModal('form')}
          onSuccess={() => closeModal('form')}
          {...(mapFormData?.(getModalData('form')) ?? {
            data: getModalData('form'),
          })}
          {...formDrawerProps}
        />
      )}

      {/* Stats Modal */}
      {StatsModal && (
        <StatsModal
          isOpen={isOpen('stats')}
          onClose={() => closeModal('stats')}
          {...(mapStatsData?.(getModalData('stats')) ?? {
            data: getModalData('stats'),
          })}
          {...statsModalProps}
        />
      )}

      {/* Extra Modals */}
      {Object.entries(extraModals).map(([modalKey, modalConfig]) => {
        const {
          component: ModalComponent,
          mapData,
          props: modalProps = {},
        } = modalConfig;
        if (!ModalComponent) return null;
        return (
          <ModalComponent
            key={modalKey}
            isOpen={isOpen(modalKey)}
            onClose={() => closeModal(modalKey)}
            {...(mapData
              ? mapData(getModalData(modalKey))
              : { data: getModalData(modalKey) })}
            {...modalProps}
          />
        );
      })}

      {/* Delete Confirmation */}
      {deleteMutation && (
        <ConfirmDialog {...(deleteConfirmProps as ConfirmDialogProps)} />
      )}
    </>
  );
});
