-- ====================================================================
-- MÓDULO MARKETPLACE: DATOS INICIALES
-- ====================================================================
-- Inserta catálogo base de 10 categorías principales para organizar
-- el directorio público del marketplace.
--
-- CATEGORÍAS (10):
-- 1. Belleza y Estética - Salones, peluquerías, maquillaje
-- 2. Salud y Bienestar - Nutrición, terapias, psicología
-- 3. Barberías - Cortes masculinos, afeitado, grooming
-- 4. Spas y Relajación - Masajes, tratamientos spa
-- 5. Fitness y Deporte - Gimnasios, entrenadores, yoga
-- 6. Medicina y Consultas - Médicos, dentistas, especialistas
-- 7. Veterinaria - Clínicas veterinarias, grooming mascotas
-- 8. Servicios Técnicos - Reparaciones, mantenimiento
-- 9. Educación y Formación - Clases, tutorías, capacitación
-- 10. Otros Servicios - Categoría catch-all
--
-- CARACTERÍSTICAS:
-- • Iconos compatibles con Lucide React
-- • Slugs SEO-friendly
-- • Meta tags pre-configurados
-- • Orden para UI
--
-- NOTA: Los negocios pueden agregar categorías personalizadas adicionales
-- desde el panel de super_admin.
--
-- Fecha creación: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- INSERTAR 10 CATEGORÍAS PRINCIPALES
-- ====================================================================

INSERT INTO marketplace_categorias (
    nombre,
    slug,
    icono,
    meta_titulo,
    meta_descripcion,
    activo,
    orden
) VALUES
    -- ================================================================
    -- CATEGORÍA 1: Belleza y Estética
    -- ================================================================
    (
        'Belleza y Estética',
        'belleza-estetica',
        'sparkles',
        'Salones de Belleza y Estética | Directorio',
        'Encuentra los mejores salones de belleza, peluquerías y centros de estética cerca de ti. Reserva tu cita online.',
        true,
        1
    ),

    -- ================================================================
    -- CATEGORÍA 2: Salud y Bienestar
    -- ================================================================
    (
        'Salud y Bienestar',
        'salud-bienestar',
        'heart-pulse',
        'Centros de Salud y Bienestar | Directorio',
        'Consulta nutricionistas, terapeutas y especialistas en bienestar. Agenda tu cita de forma fácil y rápida.',
        true,
        2
    ),

    -- ================================================================
    -- CATEGORÍA 3: Barberías
    -- ================================================================
    (
        'Barberías',
        'barberias',
        'scissors',
        'Barberías Profesionales | Directorio',
        'Descubre las mejores barberías para cortes masculinos, afeitado y grooming. Reserva tu cita ahora.',
        true,
        3
    ),

    -- ================================================================
    -- CATEGORÍA 4: Spas y Relajación
    -- ================================================================
    (
        'Spas y Relajación',
        'spas-relajacion',
        'spa',
        'Spas y Centros de Relajación | Directorio',
        'Encuentra spas, centros de masajes y tratamientos de relajación. Agenda tu sesión de bienestar.',
        true,
        4
    ),

    -- ================================================================
    -- CATEGORÍA 5: Fitness y Deporte
    -- ================================================================
    (
        'Fitness y Deporte',
        'fitness-deporte',
        'dumbbell',
        'Gimnasios y Entrenadores | Directorio',
        'Busca gimnasios, entrenadores personales y clases de yoga. Reserva tu sesión de entrenamiento.',
        true,
        5
    ),

    -- ================================================================
    -- CATEGORÍA 6: Medicina y Consultas
    -- ================================================================
    (
        'Medicina y Consultas',
        'medicina-consultas',
        'stethoscope',
        'Médicos y Consultas Médicas | Directorio',
        'Encuentra médicos, dentistas y especialistas de la salud. Agenda tu consulta médica online.',
        true,
        6
    ),

    -- ================================================================
    -- CATEGORÍA 7: Veterinaria
    -- ================================================================
    (
        'Veterinaria',
        'veterinaria',
        'paw-print',
        'Clínicas Veterinarias | Directorio',
        'Consulta clínicas veterinarias, servicios de grooming para mascotas y atención veterinaria. Reserva cita.',
        true,
        7
    ),

    -- ================================================================
    -- CATEGORÍA 8: Servicios Técnicos
    -- ================================================================
    (
        'Servicios Técnicos',
        'servicios-tecnicos',
        'wrench',
        'Servicios Técnicos y Reparaciones | Directorio',
        'Encuentra profesionales para reparaciones, mantenimiento y servicios técnicos. Agenda tu servicio.',
        true,
        8
    ),

    -- ================================================================
    -- CATEGORÍA 9: Educación y Formación
    -- ================================================================
    (
        'Educación y Formación',
        'educacion-formacion',
        'graduation-cap',
        'Clases y Formación | Directorio',
        'Busca profesores, tutores y centros de capacitación. Reserva tu clase o sesión de formación.',
        true,
        9
    ),

    -- ================================================================
    -- CATEGORÍA 10: Otros Servicios
    -- ================================================================
    (
        'Otros Servicios',
        'otros-servicios',
        'briefcase',
        'Otros Servicios Profesionales | Directorio',
        'Encuentra una amplia variedad de servicios profesionales para agendar citas online.',
        true,
        10
    );

-- ====================================================================
-- 🎯 RESUMEN DE INSERCIÓN
-- ====================================================================

-- Total de categorías insertadas: 10
-- Todas activas por defecto: true
-- Ordenadas del 1 al 10 para UI
-- Meta tags optimizados para SEO local
-- Iconos compatibles con Lucide React

-- ====================================================================
-- 📝 NOTAS DE USO
-- ====================================================================

-- • Super Admin puede agregar más categorías desde el panel
-- • Los slugs deben ser únicos (constraint UNIQUE)
-- • Los iconos se mapean a componentes Lucide en el frontend
-- • El orden determina cómo aparecen en filtros y navegación
-- • Meta tags mejoran posicionamiento SEO en búsquedas

-- ====================================================================
-- 🔍 CONSULTA DE VERIFICACIÓN
-- ====================================================================

-- Para verificar la inserción correcta:
-- SELECT id, nombre, slug, icono, orden, activo FROM marketplace_categorias ORDER BY orden;

