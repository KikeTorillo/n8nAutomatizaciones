import { useState, useCallback, useMemo } from 'react';
import { useForm, type FieldValues, type UseFormReturn, type DefaultValues, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { useToast } from './useToast';
import type { FormDrawerProps } from '@/components/ui/organisms/FormDrawer';

interface MutationLike {
  mutateAsync: (data: unknown) => Promise<unknown>;
  isPending: boolean;
}

export interface UseFormDrawerOptions<TForm extends FieldValues, TEntity = unknown> {
  /** Schema Zod para validación */
  schema: ZodType<TForm>;
  /** Valores por defecto del form */
  defaultValues: DefaultValues<TForm>;
  /** Mutation de TanStack Query para crear */
  createMutation?: MutationLike;
  /** Mutation de TanStack Query para actualizar */
  updateMutation?: MutationLike;
  /** Nombre de la entidad ("Etiqueta", "Producto") */
  entityName: string;
  /** Convierte entidad del backend a valores del form */
  entityToFormValues?: (entity: TEntity) => Partial<TForm>;
  /** Prepara el payload antes de enviar a la mutation */
  preparePayload?: (data: TForm, mode: 'create' | 'edit', entity: TEntity | null) => unknown;
  /** Callback tras éxito */
  onSuccess?: (result: unknown, mode: 'create' | 'edit') => void;
  /** Callback tras error */
  onError?: (error: Error, mode: 'create' | 'edit') => void;
  /** Mensajes personalizados de toast */
  messages?: {
    createSuccess?: string;
    updateSuccess?: string;
    createError?: string;
    updateError?: string;
  };
}

export interface UseFormDrawerReturn<TForm extends FieldValues, TEntity = unknown> {
  /** Si el drawer está abierto */
  isOpen: boolean;
  /** Modo actual */
  mode: 'create' | 'edit';
  /** Entidad que se está editando */
  entity: TEntity | null;
  /** Abrir en modo crear */
  openCreate: () => void;
  /** Abrir en modo editar */
  openEdit: (entity: TEntity) => void;
  /** Cerrar drawer */
  close: () => void;
  /** React Hook Form completo */
  form: UseFormReturn<TForm>;
  /** Handler de submit ya conectado */
  handleFormSubmit: (e: React.FormEvent) => void;
  /** Si está enviando */
  isSubmitting: boolean;
  /** Props listas para spread en FormDrawer */
  formDrawerProps: Pick<FormDrawerProps, 'isOpen' | 'onClose' | 'entityName' | 'mode' | 'onSubmit' | 'isSubmitting'>;
}

/**
 * Hook que encapsula el patrón completo de drawer CRUD:
 * estado open/close + react-hook-form + mutations + toast + reset.
 *
 * @example
 * const { formDrawerProps, form } = useFormDrawer({
 *   schema: etiquetaSchema,
 *   defaultValues: { nombre: '', color: '#6366F1' },
 *   createMutation: useCrearEtiqueta(),
 *   updateMutation: useActualizarEtiqueta(),
 *   entityName: 'Etiqueta',
 *   entityToFormValues: (e) => ({ nombre: e.nombre, color: e.color }),
 * });
 *
 * return (
 *   <FormDrawer {...formDrawerProps}>
 *     <FormGroup label="Nombre"><Input {...form.register('nombre')} /></FormGroup>
 *   </FormDrawer>
 * );
 */
export function useFormDrawer<TForm extends FieldValues, TEntity = unknown>(
  options: UseFormDrawerOptions<TForm, TEntity>
): UseFormDrawerReturn<TForm, TEntity> {
  const {
    schema,
    defaultValues,
    createMutation,
    updateMutation,
    entityName,
    entityToFormValues,
    preparePayload,
    onSuccess,
    onError,
    messages = {},
  } = options;

  const { success: showSuccess, error: showError } = useToast() as {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [entity, setEntity] = useState<TEntity | null>(null);

  const form = useForm<TForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues,
  });

  const openCreate = useCallback(() => {
    form.reset(defaultValues);
    setEntity(null);
    setMode('create');
    setIsOpen(true);
  }, [form, defaultValues]);

  const openEdit = useCallback((e: TEntity) => {
    const values = entityToFormValues
      ? { ...defaultValues, ...entityToFormValues(e) }
      : defaultValues;
    form.reset(values as DefaultValues<TForm>);
    setEntity(e);
    setMode('edit');
    setIsOpen(true);
  }, [form, defaultValues, entityToFormValues]);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setEntity(null);
      form.reset(defaultValues);
    }, 300);
  }, [form, defaultValues]);

  const mutation = mode === 'edit' ? updateMutation : createMutation;
  const isSubmitting = mutation?.isPending ?? false;

  const onSubmitHandler = useCallback(async (data: TForm) => {
    if (!mutation) return;

    const payload = preparePayload
      ? preparePayload(data, mode, entity)
      : data;

    try {
      const result = await mutation.mutateAsync(payload);
      const successMsg = mode === 'edit'
        ? (messages.updateSuccess ?? `${entityName} actualizado/a correctamente`)
        : (messages.createSuccess ?? `${entityName} creado/a correctamente`);
      showSuccess(successMsg);
      onSuccess?.(result, mode);
      close();
    } catch (err) {
      const error = err as Error & { response?: { data?: { mensaje?: string } } };
      const errorMsg = error.response?.data?.mensaje
        ?? error.message
        ?? (mode === 'edit'
          ? (messages.updateError ?? `Error al actualizar ${entityName}`)
          : (messages.createError ?? `Error al crear ${entityName}`));
      showError(errorMsg);
      onError?.(error, mode);
    }
  }, [mutation, preparePayload, mode, entity, messages, entityName, showSuccess, showError, onSuccess, onError, close]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.handleSubmit(onSubmitHandler as any)(e);
  }, [form, onSubmitHandler]);

  const formDrawerProps = useMemo(() => ({
    isOpen,
    onClose: close,
    entityName,
    mode,
    onSubmit: handleFormSubmit,
    isSubmitting,
  }), [isOpen, close, entityName, mode, handleFormSubmit, isSubmitting]);

  return {
    isOpen,
    mode,
    entity,
    openCreate,
    openEdit,
    close,
    form,
    handleFormSubmit,
    isSubmitting,
    formDrawerProps,
  };
}
