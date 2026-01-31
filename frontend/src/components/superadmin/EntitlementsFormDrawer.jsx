/**
 * ====================================================================
 * ENTITLEMENTS FORM DRAWER
 * ====================================================================
 * Drawer para editar límites y módulos de un plan de Nexo Team.
 * Permite configurar: usuarios, límites de recursos, y módulos activos.
 *
 * @module components/superadmin/EntitlementsFormDrawer
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, FormGroup, Input, CheckboxField, Button } from '@/components/ui';
import { useActualizarEntitlements } from '@/hooks/superadmin/useEntitlements';
import { useToast } from '@/hooks/utils';

/**
 * Helper para convertir strings vacíos a null en campos numéricos opcionales
 */
const optionalNumber = z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().nullable().optional()
);

const optionalPositiveNumber = z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().min(0).nullable().optional()
);

const optionalInt = z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number().int().optional()
);

/**
 * Schema de validación Zod
 */
const schema = z.object({
    usuarios_incluidos: z.coerce.number().min(1, 'Mínimo 1 usuario'),
    precio_usuario_adicional: optionalPositiveNumber,
    max_usuarios_hard: optionalNumber,
    limites: z.object({
        citas: optionalInt,
        profesionales: optionalInt,
        servicios: optionalInt,
        clientes: optionalInt,
        sucursales: optionalInt,
    }).optional(),
    features: z.array(z.string()).default([]),
});

/**
 * Drawer para editar entitlements de un plan
 */
function EntitlementsFormDrawer({ isOpen, onClose, plan, modulosDisponibles = [] }) {
    const { success, error: showError } = useToast();
    const mutation = useActualizarEntitlements();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            usuarios_incluidos: 5,
            precio_usuario_adicional: null,
            max_usuarios_hard: null,
            limites: {},
            features: [],
        }
    });

    const selectedFeatures = watch('features') || [];

    // Cargar datos del plan al abrir
    useEffect(() => {
        if (plan) {
            reset({
                usuarios_incluidos: plan.usuarios_incluidos || 5,
                precio_usuario_adicional: plan.precio_usuario_adicional ?? '',
                max_usuarios_hard: plan.max_usuarios_hard ?? '',
                limites: plan.limites || {},
                features: plan.features || [],
            });
        }
    }, [plan, reset]);

    /**
     * Toggle de feature (módulo)
     */
    const toggleFeature = (feature) => {
        const current = selectedFeatures;
        if (current.includes(feature)) {
            setValue('features', current.filter(f => f !== feature));
        } else {
            setValue('features', [...current, feature]);
        }
    };

    /**
     * Formatear nombre de módulo para display
     */
    const formatModuloName = (modulo) => {
        return modulo
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    /**
     * Submit handler
     */
    const onSubmit = (data) => {
        // Sanitizar valores vacíos a null
        const sanitize = (val) => (val === '' || val === 0) ? null : val;

        mutation.mutate({
            id: plan.id,
            data: {
                ...data,
                precio_usuario_adicional: sanitize(data.precio_usuario_adicional),
                max_usuarios_hard: sanitize(data.max_usuarios_hard),
            }
        }, {
            onSuccess: () => {
                success('Entitlements actualizados correctamente');
                onClose();
            },
            onError: (err) => showError(err.message || 'Error al actualizar entitlements')
        });
    };

    if (!plan) return null;

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Entitlements: ${plan.nombre}`}
            subtitle="Configura límites y módulos para este plan"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Sección: Límites de Usuarios */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                        Límites de Usuarios
                    </h4>

                    <FormGroup
                        label="Usuarios Incluidos"
                        error={errors.usuarios_incluidos?.message}
                        required
                    >
                        <Input
                            type="number"
                            min="1"
                            {...register('usuarios_incluidos')}
                            hasError={!!errors.usuarios_incluidos}
                        />
                    </FormGroup>

                    <div className="grid grid-cols-2 gap-4">
                        <FormGroup
                            label="$ Usuario Adicional"
                            helper="Vacío = no permite extras"
                        >
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...register('precio_usuario_adicional')}
                                placeholder="49.00"
                            />
                        </FormGroup>
                        <FormGroup
                            label="Máximo Usuarios (Hard)"
                            helper="Vacío = ilimitado"
                        >
                            <Input
                                type="number"
                                min="1"
                                {...register('max_usuarios_hard')}
                                placeholder="∞"
                            />
                        </FormGroup>
                    </div>
                </div>

                {/* Sección: Otros Límites */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                        Límites de Recursos
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Usa -1 para ilimitado
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <FormGroup label="Citas/mes">
                            <Input
                                type="number"
                                {...register('limites.citas')}
                                placeholder="-1"
                            />
                        </FormGroup>
                        <FormGroup label="Profesionales">
                            <Input
                                type="number"
                                {...register('limites.profesionales')}
                                placeholder="-1"
                            />
                        </FormGroup>
                        <FormGroup label="Servicios">
                            <Input
                                type="number"
                                {...register('limites.servicios')}
                                placeholder="-1"
                            />
                        </FormGroup>
                        <FormGroup label="Clientes">
                            <Input
                                type="number"
                                {...register('limites.clientes')}
                                placeholder="-1"
                            />
                        </FormGroup>
                        <FormGroup label="Sucursales">
                            <Input
                                type="number"
                                {...register('limites.sucursales')}
                                placeholder="-1"
                            />
                        </FormGroup>
                    </div>
                </div>

                {/* Sección: Módulos */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                        Módulos Activados
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                        {modulosDisponibles.map((modulo) => (
                            <CheckboxField
                                key={modulo}
                                label={formatModuloName(modulo)}
                                checked={selectedFeatures.includes(modulo)}
                                onChange={() => toggleFeature(modulo)}
                            />
                        ))}
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={mutation.isPending}>
                        Guardar
                    </Button>
                </div>
            </form>
        </Drawer>
    );
}

export default EntitlementsFormDrawer;
