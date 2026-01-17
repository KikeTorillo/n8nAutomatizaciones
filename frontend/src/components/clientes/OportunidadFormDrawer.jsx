/**
 * ====================================================================
 * OPORTUNIDAD FORM DRAWER
 * ====================================================================
 *
 * Fase 5 - Oportunidades B2B (Ene 2026)
 * Drawer para crear/editar oportunidades
 *
 * ====================================================================
 */

import { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, Target, Calendar, User } from 'lucide-react';
import { Button, Drawer } from '@/components/ui';
import { PRIORIDADES_OPORTUNIDAD, FUENTES_OPORTUNIDAD } from '@/hooks/personas';

export default function OportunidadFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  oportunidad,
  etapas = [],
  usuarios = [],
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    etapa_id: '',
    probabilidad: 10,
    fecha_cierre_esperada: '',
    ingreso_esperado: '',
    moneda: 'MXN',
    vendedor_id: '',
    prioridad: 'normal',
    fuente: '',
  });

  const [errors, setErrors] = useState({});

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      if (oportunidad) {
        setFormData({
          nombre: oportunidad.nombre || '',
          descripcion: oportunidad.descripcion || '',
          etapa_id: oportunidad.etapa_id || '',
          probabilidad: oportunidad.probabilidad || 10,
          fecha_cierre_esperada: oportunidad.fecha_cierre_esperada
            ? oportunidad.fecha_cierre_esperada.split('T')[0]
            : '',
          ingreso_esperado: oportunidad.ingreso_esperado || '',
          moneda: oportunidad.moneda || 'MXN',
          vendedor_id: oportunidad.vendedor_id || '',
          prioridad: oportunidad.prioridad || 'normal',
          fuente: oportunidad.fuente || '',
        });
      } else {
        // Default: primera etapa activa
        const primeraEtapa = etapas.find(e => !e.es_ganada && !e.es_perdida);
        setFormData({
          nombre: '',
          descripcion: '',
          etapa_id: primeraEtapa?.id || '',
          probabilidad: primeraEtapa?.probabilidad_default || 10,
          fecha_cierre_esperada: '',
          ingreso_esperado: '',
          moneda: 'MXN',
          vendedor_id: '',
          prioridad: 'normal',
          fuente: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, oportunidad, etapas]);

  // Update probability when stage changes
  const handleEtapaChange = (etapaId) => {
    const etapa = etapas.find(e => e.id === parseInt(etapaId));
    setFormData(prev => ({
      ...prev,
      etapa_id: etapaId,
      probabilidad: etapa?.probabilidad_default || prev.probabilidad,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Preparar datos
    const submitData = {
      ...formData,
      etapa_id: formData.etapa_id ? parseInt(formData.etapa_id) : null,
      probabilidad: parseInt(formData.probabilidad),
      ingreso_esperado: formData.ingreso_esperado ? parseFloat(formData.ingreso_esperado) : 0,
      vendedor_id: formData.vendedor_id ? parseInt(formData.vendedor_id) : null,
      fecha_cierre_esperada: formData.fecha_cierre_esperada || null,
      fuente: formData.fuente || null,
      descripcion: formData.descripcion || null,
    };

    await onSubmit(submitData);
  };

  // Filtrar etapas activas (no ganada/perdida para selección)
  const etapasActivas = etapas.filter(e => !e.es_ganada && !e.es_perdida);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={oportunidad ? 'Editar oportunidad' : 'Nueva oportunidad'}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Contrato anual de servicios"
              className={`
                w-full px-3 py-2 rounded-lg border
                ${errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              `}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Detalles de la oportunidad..."
              rows={3}
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            />
          </div>

          {/* Etapa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Etapa
            </label>
            <select
              value={formData.etapa_id}
              onChange={(e) => handleEtapaChange(e.target.value)}
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            >
              <option value="">Sin etapa</option>
              {etapasActivas.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nombre} ({etapa.probabilidad_default}%)
                </option>
              ))}
            </select>
          </div>

          {/* Valor esperado y Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign className="inline-block w-4 h-4 mr-1" />
                Valor esperado
              </label>
              <input
                type="number"
                value={formData.ingreso_esperado}
                onChange={(e) => setFormData({ ...formData, ingreso_esperado: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                className="
                  w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Moneda
              </label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                className="
                  w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                "
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="COP">COP</option>
              </select>
            </div>
          </div>

          {/* Probabilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Target className="inline-block w-4 h-4 mr-1" />
              Probabilidad de cierre ({formData.probabilidad}%)
            </label>
            <input
              type="range"
              value={formData.probabilidad}
              onChange={(e) => setFormData({ ...formData, probabilidad: e.target.value })}
              min="0"
              max="100"
              step="5"
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Fecha cierre esperada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="inline-block w-4 h-4 mr-1" />
              Fecha de cierre esperada
            </label>
            <input
              type="date"
              value={formData.fecha_cierre_esperada}
              onChange={(e) => setFormData({ ...formData, fecha_cierre_esperada: e.target.value })}
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prioridad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORIDADES_OPORTUNIDAD.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, prioridad: p.value })}
                  className={`
                    px-3 py-2 text-sm rounded-lg border transition-colors
                    ${formData.prioridad === p.value
                      ? `${p.bgColor} ${p.color} border-current`
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vendedor */}
          {usuarios.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <User className="inline-block w-4 h-4 mr-1" />
                Vendedor asignado
              </label>
              <select
                value={formData.vendedor_id}
                onChange={(e) => setFormData({ ...formData, vendedor_id: e.target.value })}
                className="
                  w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                "
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fuente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fuente / Origen
            </label>
            <select
              value={formData.fuente}
              onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}
              className="
                w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            >
              <option value="">Sin especificar</option>
              {FUENTES_OPORTUNIDAD.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                oportunidad ? 'Guardar cambios' : 'Crear oportunidad'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
