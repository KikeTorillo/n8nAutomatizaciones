-- ====================================================================
-- MÓDULO AGENDAMIENTO: SEEDS - CATEGORÍAS
-- ====================================================================
--
-- Descripción: Categorías específicas para sistemas de agendamiento
-- Ubicación: sql/agendamiento/templates/seeds/
-- Ejecutar: DESPUÉS de sql/core/schema/01-tabla-categorias.sql
--
-- Contenido: 11 categorías de servicios profesionales
-- ====================================================================

INSERT INTO categorias (codigo, nombre, sector, descripcion, icono, metadata, orden) VALUES
    (
        'barberia',
        'Barbería',
        'services',
        'Barberías y peluquerías masculinas',
        'scissors',
        '{"tipos_profesional": ["barbero", "estilista_masculino"]}'::jsonb,
        10
    ),
    (
        'salon_belleza',
        'Salón de Belleza',
        'services',
        'Salones de belleza y peluquerías',
        'user',
        '{"tipos_profesional": ["estilista", "colorista", "manicurista"]}'::jsonb,
        11
    ),
    (
        'estetica',
        'Estética',
        'services',
        'Centros de estética y tratamientos faciales',
        'sparkles',
        '{"tipos_profesional": ["esteticista", "cosmetologo"]}'::jsonb,
        12
    ),
    (
        'spa',
        'Spa y Relajación',
        'services',
        'Spas y centros de relajación',
        'spa',
        '{"tipos_profesional": ["masajista", "terapeuta_spa", "aromaterapeuta"]}'::jsonb,
        13
    ),
    (
        'podologia',
        'Podología',
        'health',
        'Consultorios podológicos',
        'foot',
        '{"tipos_profesional": ["podologo", "asistente_podologia"]}'::jsonb,
        14
    ),
    (
        'consultorio_medico',
        'Consultorio Médico',
        'health',
        'Consultorios médicos generales',
        'stethoscope',
        '{"tipos_profesional": ["doctor_general", "enfermero"], "requiere_licencia": true}'::jsonb,
        15
    ),
    (
        'academia',
        'Academia',
        'education',
        'Academias de enseñanza (idiomas, música, etc.)',
        'book',
        '{"tipos_profesional": ["instructor", "profesor", "tutor"]}'::jsonb,
        16
    ),
    (
        'taller_tecnico',
        'Taller Técnico',
        'services',
        'Talleres técnicos (autos, electrónicos, etc.)',
        'wrench',
        '{"tipos_profesional": ["tecnico_auto", "tecnico_electronico", "mecanico"]}'::jsonb,
        17
    ),
    (
        'centro_fitness',
        'Centro Fitness',
        'health',
        'Gimnasios y centros de fitness',
        'dumbbell',
        '{"tipos_profesional": ["entrenador_personal", "instructor_yoga", "nutricionista"]}'::jsonb,
        18
    ),
    (
        'veterinaria',
        'Veterinaria',
        'health',
        'Clínicas veterinarias',
        'paw',
        '{"tipos_profesional": ["veterinario", "asistente_veterinario", "groomer"]}'::jsonb,
        19
    ),
    (
        'otro_agendamiento',
        'Otros Servicios',
        'services',
        'Otras industrias de servicios no categorizadas',
        'more-horizontal',
        '{}'::jsonb,
        20
    );

-- ====================================================================
-- NOTA: Estas categorías son específicas para el template de agendamiento
-- Para otros SaaS, crear archivos de seeds correspondientes
-- ====================================================================
