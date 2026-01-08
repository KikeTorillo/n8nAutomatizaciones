-- =====================================================
-- MÓDULO INCAPACIDADES - Tipo de Bloqueo
-- Enero 2026
-- =====================================================
-- Agrega el tipo de bloqueo 'incapacidad' al catálogo
-- del sistema para integración con bloqueos_horarios
-- =====================================================

-- Agregar tipo de bloqueo 'incapacidad' si no existe
INSERT INTO tipos_bloqueo (
    organizacion_id,
    codigo,
    nombre,
    descripcion,
    es_sistema,
    permite_todo_el_dia,
    permite_horario_especifico,
    requiere_aprobacion,
    orden_display,
    activo,
    metadata
) VALUES (
    NULL,                                    -- NULL = tipo global del sistema
    'incapacidad',                           -- Código único
    'Incapacidad Médica',                    -- Nombre para mostrar
    'Incapacidad médica por enfermedad general, maternidad o riesgo de trabajo (IMSS)',
    true,                                    -- Es tipo del sistema
    true,                                    -- Permite todo el día
    false,                                   -- NO permite horario específico (siempre día completo)
    false,                                   -- No requiere aprobación
    10,                                      -- Orden en lista (después de los 9 existentes)
    true,                                    -- Activo
    '{"color": "rose", "icon": "heart-pulse", "origen": "incapacidad"}'::jsonb
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIO
-- =====================================================
COMMENT ON TABLE tipos_bloqueo IS
'Catálogo de tipos de bloqueo. Incluye 10 tipos del sistema:
vacaciones, feriado, mantenimiento, evento_especial, emergencia,
personal, organizacional, hora_comida, descanso, incapacidad.';
