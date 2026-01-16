import { useState, useEffect } from 'react';
import { Button, Modal, Textarea } from '@/components/ui';
import { ClipboardList, Calendar, User, Info } from 'lucide-react';
import { useCategorias } from '@/hooks/useCategorias';
import { useUsuarios } from '@/hooks/useUsuarios';
import { TIPOS_CONTEO, TIPOS_CONTEO_LABELS } from '@/hooks/useConteos';

/**
 * Modal para crear un nuevo conteo de inventario
 */
export default function ConteoFormModal({ isOpen, onClose, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        tipo_conteo: TIPOS_CONTEO.TOTAL,
        filtros: {
            categoria_id: '',
            ubicacion_id: '',
            producto_ids: [],
            cantidad_muestra: 50,
            solo_con_stock: false,
        },
        fecha_programada: '',
        usuario_contador_id: '',
        usuario_supervisor_id: '',
        notas: '',
    });

    // Queries
    const { data: categoriasData } = useCategorias({ activo: true });
    const categorias = categoriasData?.categorias || [];

    const { data: usuariosData } = useUsuarios({ activo: true, limit: 100 });
    const usuarios = usuariosData?.usuarios || [];

    // Reset form on close
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                tipo_conteo: TIPOS_CONTEO.TOTAL,
                filtros: {
                    categoria_id: '',
                    ubicacion_id: '',
                    producto_ids: [],
                    cantidad_muestra: 50,
                    solo_con_stock: false,
                },
                fecha_programada: '',
                usuario_contador_id: '',
                usuario_supervisor_id: '',
                notas: '',
            });
        }
    }, [isOpen]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFiltroChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            filtros: { ...prev.filtros, [field]: value },
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Preparar datos para enviar
        const data = {
            tipo_conteo: formData.tipo_conteo,
            filtros: {},
            fecha_programada: formData.fecha_programada || undefined,
            usuario_contador_id: formData.usuario_contador_id ? parseInt(formData.usuario_contador_id) : undefined,
            usuario_supervisor_id: formData.usuario_supervisor_id ? parseInt(formData.usuario_supervisor_id) : undefined,
            notas: formData.notas || undefined,
        };

        // Agregar filtros según tipo
        if (formData.tipo_conteo === TIPOS_CONTEO.POR_CATEGORIA && formData.filtros.categoria_id) {
            data.filtros.categoria_id = parseInt(formData.filtros.categoria_id);
        }

        if (formData.tipo_conteo === TIPOS_CONTEO.ALEATORIO) {
            data.filtros.cantidad_muestra = parseInt(formData.filtros.cantidad_muestra) || 50;
        }

        if (formData.filtros.solo_con_stock) {
            data.filtros.solo_con_stock = true;
        }

        onSubmit(data);
    };

    // Descripción del tipo de conteo
    const tipoDescripciones = {
        [TIPOS_CONTEO.TOTAL]: 'Conteo de todos los productos activos de la organización.',
        [TIPOS_CONTEO.POR_CATEGORIA]: 'Conteo de productos de una categoría específica.',
        [TIPOS_CONTEO.POR_UBICACION]: 'Conteo de productos en una ubicación de almacén.',
        [TIPOS_CONTEO.CICLICO]: 'Conteo de productos seleccionados manualmente.',
        [TIPOS_CONTEO.ALEATORIO]: 'Muestra aleatoria de productos para verificación.',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Conteo de Inventario" size="lg">
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
                {/* Tipo de conteo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Conteo
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(TIPOS_CONTEO_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleChange('tipo_conteo', key)}
                                className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                                    formData.tipo_conteo === key
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {tipoDescripciones[formData.tipo_conteo]}
                    </p>
                </div>

                {/* Filtros según tipo */}
                {formData.tipo_conteo === TIPOS_CONTEO.POR_CATEGORIA && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Categoría *
                        </label>
                        <select
                            value={formData.filtros.categoria_id}
                            onChange={(e) => handleFiltroChange('categoria_id', e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Selecciona una categoría</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {formData.tipo_conteo === TIPOS_CONTEO.ALEATORIO && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cantidad de productos
                        </label>
                        <input
                            type="number"
                            value={formData.filtros.cantidad_muestra}
                            onChange={(e) => handleFiltroChange('cantidad_muestra', e.target.value)}
                            min="10"
                            max="500"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Número de productos aleatorios a incluir (10-500)
                        </p>
                    </div>
                )}

                {/* Solo con stock */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="solo_con_stock"
                        checked={formData.filtros.solo_con_stock}
                        onChange={(e) => handleFiltroChange('solo_con_stock', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                        htmlFor="solo_con_stock"
                        className="text-sm text-gray-700 dark:text-gray-300"
                    >
                        Solo incluir productos con stock mayor a 0
                    </label>
                </div>

                {/* Fecha programada */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Fecha Programada (opcional)
                    </label>
                    <input
                        type="date"
                        value={formData.fecha_programada}
                        onChange={(e) => handleChange('fecha_programada', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Usuarios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <User className="h-4 w-4 inline mr-1" />
                            Contador (opcional)
                        </label>
                        <select
                            value={formData.usuario_contador_id}
                            onChange={(e) => handleChange('usuario_contador_id', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Sin asignar</option>
                            {usuarios.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <User className="h-4 w-4 inline mr-1" />
                            Supervisor (opcional)
                        </label>
                        <select
                            value={formData.usuario_supervisor_id}
                            onChange={(e) => handleChange('usuario_supervisor_id', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Sin asignar</option>
                            {usuarios.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notas */}
                <div>
                    <Textarea
                        label="Notas (opcional)"
                        value={formData.notas}
                        onChange={(e) => handleChange('notas', e.target.value)}
                        placeholder="Instrucciones especiales o comentarios..."
                        rows={3}
                    />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Crear Conteo
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
