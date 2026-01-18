-- ====================================================================
-- MÓDULO ORGANIZACIÓN: FOREIGN KEYS DIFERIDAS
-- ====================================================================
-- FKs que no pueden agregarse durante CREATE TABLE porque las tablas
-- se crean en orden diferente.
--
-- ORDEN DE EJECUCIÓN:
-- Este archivo debe ejecutarse DESPUÉS de:
-- - sql/organizacion/01-tablas.sql
-- - sql/servicios/01-tablas.sql
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- 🔗 FKs PARA PROFESIONALES
-- ====================================================================

-- FK: profesionales.supervisor_id → profesionales.id
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_supervisor
FOREIGN KEY (supervisor_id) REFERENCES profesionales(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- FK: profesionales.departamento_id → departamentos.id
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_departamento
FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- FK: profesionales.puesto_id → puestos.id
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_puesto
FOREIGN KEY (puesto_id) REFERENCES puestos(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ====================================================================
-- 🔗 FKs PARA DEPARTAMENTOS
-- ====================================================================

-- FK: departamentos.gerente_id → profesionales.id
ALTER TABLE departamentos
ADD CONSTRAINT fk_departamentos_gerente
FOREIGN KEY (gerente_id) REFERENCES profesionales(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ====================================================================
-- 🔗 FKs PARA PROFESIONALES_CATEGORIAS
-- ====================================================================

-- FK: profesionales_categorias.profesional_id → profesionales.id
ALTER TABLE profesionales_categorias
ADD CONSTRAINT fk_prof_cat_profesional
FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ====================================================================
-- 📝 COMENTARIOS
-- ====================================================================
COMMENT ON CONSTRAINT fk_profesionales_supervisor ON profesionales IS
'Referencia al jefe directo. SET NULL si el supervisor es eliminado.';

COMMENT ON CONSTRAINT fk_profesionales_departamento ON profesionales IS
'Departamento asignado. SET NULL si el departamento es eliminado.';

COMMENT ON CONSTRAINT fk_profesionales_puesto ON profesionales IS
'Puesto de trabajo. SET NULL si el puesto es eliminado.';

COMMENT ON CONSTRAINT fk_departamentos_gerente ON departamentos IS
'Profesional responsable del departamento.';
