-- =====================================================================
-- PLANTILLAS DE SERVICIOS POR INDUSTRIA
-- Sistema SaaS Multi-Tenant
-- Fecha: 2025-01-16
-- =====================================================================

-- Este archivo contiene plantillas pre-configuradas de servicios
-- para diferentes industrias que se pueden usar como base

-- IMPORTANTE: Ejecutar después de diseno_base_datos_saas.sql

-- =====================================================================
-- BARBERÍA - Servicios Tradicionales
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Servicios básicos de corte
('barberia', 'Corte Clásico', 'Corte tradicional con tijeras y máquina', 'Corte', 30, 150.00,
 ARRAY['corte', 'clasico', 'basico'],
 '{"herramientas": ["tijeras", "maquina"], "tecnicas": ["degradado", "tijera_sobre_peine"]}'),

('barberia', 'Corte Moderno', 'Corte contemporáneo con técnicas actuales', 'Corte', 45, 200.00,
 ARRAY['corte', 'moderno', 'tendencia'],
 '{"herramientas": ["tijeras", "maquina", "navaja"], "tecnicas": ["fade", "undercut", "texturizado"]}'),

('barberia', 'Corte + Barba', 'Servicio completo de corte y arreglo de barba', 'Combo', 60, 250.00,
 ARRAY['corte', 'barba', 'combo', 'completo'],
 '{"incluye": ["corte_cabello", "arreglo_barba", "hidratacion"], "herramientas": ["tijeras", "maquina", "navaja"]}'),

-- Servicios de barba
('barberia', 'Arreglo de Barba', 'Recorte y perfilado de barba', 'Barba', 25, 120.00,
 ARRAY['barba', 'recorte', 'perfilado'],
 '{"tecnicas": ["recorte", "perfilado", "hidratacion"], "productos": ["aceite_barba", "balsamo"]}'),

('barberia', 'Afeitado Clásico', 'Afeitado tradicional con navaja', 'Barba', 35, 180.00,
 ARRAY['afeitado', 'navaja', 'tradicional', 'premium'],
 '{"tecnicas": ["navaja_tradicional", "toallas_calientes"], "productos": ["espuma_afeitado", "aftershave"]}'),

-- Servicios adicionales
('barberia', 'Cejas', 'Arreglo y perfilado de cejas masculinas', 'Facial', 15, 80.00,
 ARRAY['cejas', 'facial', 'perfilado'],
 '{"tecnicas": ["recorte", "perfilado"], "herramientas": ["tijeras_precision", "pinzas"]}'),

('barberia', 'Lavado de Cabello', 'Lavado profundo con masaje', 'Cuidado', 20, 100.00,
 ARRAY['lavado', 'masaje', 'relajacion'],
 '{"productos": ["champu_profesional", "acondicionador"], "incluye": ["masaje_cuero_cabelludo"]}');

-- =====================================================================
-- SALÓN DE BELLEZA - Servicios Integrales
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Servicios de cabello
('salon_belleza', 'Corte Dama', 'Corte femenino personalizado', 'Corte', 45, 300.00,
 ARRAY['corte', 'femenino', 'personalizado'],
 '{"tecnicas": ["corte_en_capas", "desfilado", "texturizado"], "incluye": ["lavado", "secado"]}'),

('salon_belleza', 'Peinado Evento', 'Peinado elegante para ocasiones especiales', 'Peinado', 90, 800.00,
 ARRAY['peinado', 'evento', 'elegante', 'especial'],
 '{"estilos": ["recogido", "ondas", "trenza"], "incluye": ["productos_fijacion"]}'),

('salon_belleza', 'Tinte Completo', 'Coloración completa del cabello', 'Color', 120, 1200.00,
 ARRAY['tinte', 'color', 'coloracion', 'completo'],
 '{"tipos": ["permanente", "semipermanente"], "incluye": ["prueba_alergia", "tratamiento_post"]}'),

('salon_belleza', 'Mechas', 'Iluminación con mechas', 'Color', 150, 1500.00,
 ARRAY['mechas', 'iluminacion', 'highlights'],
 '{"tecnicas": ["papel_aluminio", "gorrito", "mano_alzada"], "incluye": ["matizacion"]}'),

-- Servicios de uñas
('salon_belleza', 'Manicure Clásico', 'Manicure tradicional con esmaltado', 'Uñas', 60, 250.00,
 ARRAY['manicure', 'unas', 'clasico'],
 '{"incluye": ["limado", "cuticulas", "hidratacion", "esmaltado"], "duracion_esmaltado": "7-10_dias"}'),

('salon_belleza', 'Manicure Gel', 'Manicure con esmaltado en gel', 'Uñas', 75, 400.00,
 ARRAY['manicure', 'gel', 'duradero'],
 '{"duracion_esmaltado": "2-3_semanas", "requiere": ["lampara_uv"], "incluye": ["base", "color", "top_coat"]}'),

('salon_belleza', 'Pedicure Spa', 'Pedicure relajante con tratamiento spa', 'Uñas', 90, 350.00,
 ARRAY['pedicure', 'spa', 'relajante', 'premium'],
 '{"incluye": ["remojo", "exfoliacion", "masaje", "hidratacion", "esmaltado"]}'),

-- Servicios faciales
('salon_belleza', 'Facial Básico', 'Limpieza facial profunda', 'Facial', 60, 400.00,
 ARRAY['facial', 'limpieza', 'basico'],
 '{"pasos": ["desmaquillado", "exfoliacion", "extraccion", "mascarilla", "hidratacion"]}'),

('salon_belleza', 'Depilación Cejas', 'Depilación y diseño de cejas', 'Depilación', 30, 150.00,
 ARRAY['depilacion', 'cejas', 'diseno'],
 '{"tecnicas": ["cera", "pinzas", "hilo"], "incluye": ["diseno_personalizado"]}');

-- =====================================================================
-- ESTÉTICA - Tratamientos Especializados
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Tratamientos faciales avanzados
('estetica', 'Hydrafacial', 'Tratamiento de hidratación profunda facial', 'Facial Avanzado', 60, 1200.00,
 ARRAY['hydrafacial', 'hidratacion', 'antienvejecimiento'],
 '{"equipos": ["hydrafacial_machine"], "incluye": ["limpieza", "exfoliacion", "hidratacion"], "requiere_licencia": true}'),

('estetica', 'Peeling Químico', 'Exfoliación química para renovación celular', 'Facial Avanzado', 45, 800.00,
 ARRAY['peeling', 'quimico', 'renovacion', 'antienvejecimiento'],
 '{"tipos": ["superficial", "medio"], "requiere_licencia": true, "contraindicaciones": ["embarazo", "lactancia"]}'),

('estetica', 'Radiofrecuencia Facial', 'Tratamiento de tensado facial', 'Antienvejecimiento', 60, 1000.00,
 ARRAY['radiofrecuencia', 'tensado', 'lifting', 'antienvejecimiento'],
 '{"equipos": ["radiofrecuencia"], "zonas": ["rostro", "cuello"], "sesiones_recomendadas": 6}'),

-- Tratamientos corporales
('estetica', 'Cavitación', 'Reducción de grasa localizada', 'Corporal', 60, 800.00,
 ARRAY['cavitacion', 'reduccion_grasa', 'corporal'],
 '{"equipos": ["cavitacion_ultrasonica"], "zonas": ["abdomen", "muslos", "brazos"], "requiere_evaluacion": true}'),

('estetica', 'Presoterapia', 'Drenaje linfático con presión', 'Corporal', 45, 600.00,
 ARRAY['presoterapia', 'drenaje', 'circulacion'],
 '{"equipos": ["presoterapia"], "beneficios": ["drenaje_linfatico", "circulacion"], "contraindicaciones": ["embarazo"]}'),

-- Depilación láser
('estetica', 'Depilación Láser Facial', 'Depilación permanente facial', 'Depilación Láser', 30, 500.00,
 ARRAY['depilacion', 'laser', 'facial', 'permanente'],
 '{"equipos": ["laser_diodo"], "zonas": ["bozo", "cejas", "patillas"], "sesiones_minimas": 6, "requiere_licencia": true}'),

('estetica', 'Depilación Láser Corporal', 'Depilación permanente en zonas corporales', 'Depilación Láser', 45, 800.00,
 ARRAY['depilacion', 'laser', 'corporal', 'permanente'],
 '{"zonas": ["axilas", "brazos", "piernas", "bikini"], "sesiones_minimas": 8, "requiere_evaluacion": true}');

-- =====================================================================
-- SPA - Tratamientos de Relajación
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Masajes terapéuticos
('spa', 'Masaje Relajante', 'Masaje de cuerpo completo para relajación', 'Masaje', 60, 800.00,
 ARRAY['masaje', 'relajante', 'cuerpo_completo'],
 '{"tecnicas": ["sueco", "relajante"], "aceites": ["lavanda", "eucalipto"], "presion": "suave_media"}'),

('spa', 'Masaje Descontracturante', 'Masaje terapéutico para tensión muscular', 'Masaje', 75, 1000.00,
 ARRAY['masaje', 'terapeutico', 'descontracturante'],
 '{"tecnicas": ["tejido_profundo", "trigger_points"], "zonas_enfoque": ["espalda", "cuello", "hombros"]}'),

('spa', 'Masaje con Piedras Calientes', 'Masaje relajante con termoterapia', 'Masaje', 90, 1200.00,
 ARRAY['masaje', 'piedras_calientes', 'termoterapia', 'premium'],
 '{"elementos": ["piedras_volcanicas"], "temperatura": "50-60_celsius", "beneficios": ["relajacion_profunda"]}'),

-- Tratamientos faciales spa
('spa', 'Facial Hidratante Spa', 'Tratamiento facial con técnicas de spa', 'Facial Spa', 75, 900.00,
 ARRAY['facial', 'hidratante', 'spa', 'relajante'],
 '{"incluye": ["limpieza", "exfoliacion", "mascarilla", "masaje_facial"], "productos": ["naturales", "organicos"]}'),

-- Rituales y paquetes
('spa', 'Ritual de Chocolate', 'Tratamiento corporal con chocolate', 'Ritual', 120, 1800.00,
 ARRAY['ritual', 'chocolate', 'corporal', 'premium'],
 '{"fases": ["exfoliacion", "envoltura", "masaje"], "beneficios": ["hidratacion", "antioxidantes"]}'),

('spa', 'Day Spa Completo', 'Día completo de relajación y bienestar', 'Paquete', 240, 3500.00,
 ARRAY['day_spa', 'paquete', 'completo', 'premium'],
 '{"incluye": ["masaje", "facial", "manicure", "pedicure", "almuerzo"], "duracion_total": "4_horas"}');

-- =====================================================================
-- PODOLOGÍA - Servicios Médicos del Pie
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Servicios básicos
('podologia', 'Consulta Podológica', 'Evaluación y diagnóstico podológico', 'Consulta', 45, 600.00,
 ARRAY['consulta', 'diagnostico', 'evaluacion'],
 '{"incluye": ["anamnesis", "exploracion", "diagnostico"], "requiere_licencia": true, "tipo_profesional": "podologo"}'),

('podologia', 'Quiropedia Básica', 'Cuidado básico de uñas y pies', 'Tratamiento', 60, 400.00,
 ARRAY['quiropedia', 'basico', 'cuidado_pies'],
 '{"incluye": ["corte_unas", "limado", "curacion_heridas_menores"], "instrumental": ["esterilizado"]}'),

('podologia', 'Tratamiento de Callos', 'Eliminación y tratamiento de callosidades', 'Tratamiento', 45, 500.00,
 ARRAY['callos', 'callosidades', 'quiropedia'],
 '{"tecnicas": ["fresado", "escalpelo"], "incluye": ["hidratacion"], "seguimiento": "recomendado"}'),

-- Tratamientos especializados
('podologia', 'Tratamiento de Hongos', 'Tratamiento para onicomicosis', 'Tratamiento Especializado', 30, 800.00,
 ARRAY['hongos', 'onicomicosis', 'especializado'],
 '{"requiere_cultivo": true, "duracion_tratamiento": "3-6_meses", "seguimiento": "obligatorio"}'),

('podologia', 'Uña Encarnada', 'Tratamiento de onicocriptosis', 'Cirugía Menor', 60, 1200.00,
 ARRAY['una_encarnada', 'onicocriptosis', 'cirugia_menor'],
 '{"tecnicas": ["conservadora", "quirurgica"], "anestesia_local": true, "cuidados_post": "14_dias"}'),

('podologia', 'Plantillas Ortopédicas', 'Diseño y elaboración de plantillas', 'Ortopedia', 90, 1500.00,
 ARRAY['plantillas', 'ortopedicas', 'personalizadas'],
 '{"incluye": ["estudio_pies", "molde", "elaboracion"], "tiempo_entrega": "7-10_dias", "garantia": "6_meses"}');

-- =====================================================================
-- CONSULTORIO MÉDICO - Servicios de Salud
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Consultas generales
('consultorio_medico', 'Consulta General', 'Consulta médica general', 'Consulta', 30, 800.00,
 ARRAY['consulta', 'general', 'medicina_general'],
 '{"incluye": ["anamnesis", "exploracion_fisica", "diagnostico"], "requiere_licencia": true, "cedula_profesional": true}'),

('consultorio_medico', 'Consulta de Seguimiento', 'Consulta de control y seguimiento', 'Consulta', 20, 500.00,
 ARRAY['seguimiento', 'control', 'revision'],
 '{"incluye": ["revision_tratamiento", "ajuste_medicacion"], "requiere_expediente": true}'),

('consultorio_medico', 'Consulta Especializada', 'Consulta con médico especialista', 'Especialidad', 45, 1200.00,
 ARRAY['especialista', 'especializada', 'segunda_opinion'],
 '{"especialidades": ["cardiologia", "dermatologia", "ginecologia"], "requiere_referencia": false}'),

-- Procedimientos menores
('consultorio_medico', 'Electrocardiograma', 'Estudio de función cardíaca', 'Estudio', 20, 300.00,
 ARRAY['ecg', 'cardiograma', 'cardiologia'],
 '{"equipos": ["electrocardiografo"], "interpretacion": "incluida", "entrega": "inmediata"}'),

('consultorio_medico', 'Curación de Heridas', 'Curación y tratamiento de heridas', 'Procedimiento', 30, 400.00,
 ARRAY['curacion', 'heridas', 'procedimiento'],
 '{"incluye": ["limpieza", "desinfeccion", "vendaje"], "seguimiento": "48-72_horas"}'),

('consultorio_medico', 'Toma de Signos Vitales', 'Medición de signos vitales básicos', 'Evaluación', 15, 150.00,
 ARRAY['signos_vitales', 'presion', 'evaluacion'],
 '{"incluye": ["presion_arterial", "frecuencia_cardiaca", "temperatura", "saturacion_oxigeno"]}');

-- =====================================================================
-- CENTRO FITNESS - Entrenamiento y Bienestar
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Entrenamiento personal
('centro_fitness', 'Entrenamiento Personal', 'Sesión de entrenamiento individualizada', 'Entrenamiento', 60, 500.00,
 ARRAY['personal', 'individualizado', 'entrenamiento'],
 '{"incluye": ["calentamiento", "rutina_personalizada", "estiramiento"], "equipos": ["pesas", "cardio"]}'),

('centro_fitness', 'Evaluación Física', 'Evaluación completa de condición física', 'Evaluación', 60, 400.00,
 ARRAY['evaluacion', 'fisica', 'diagnostico'],
 '{"incluye": ["composicion_corporal", "flexibilidad", "fuerza", "resistencia"], "entrega_reporte": true}'),

-- Clases grupales
('centro_fitness', 'Clase de Yoga', 'Clase grupal de yoga', 'Clase Grupal', 60, 200.00,
 ARRAY['yoga', 'grupal', 'relajacion', 'flexibilidad'],
 '{"max_participantes": 15, "incluye": ["mat", "bloques"], "nivel": "todos"}'),

('centro_fitness', 'Clase de Spinning', 'Clase de ciclismo indoor', 'Clase Grupal', 45, 150.00,
 ARRAY['spinning', 'cardio', 'grupal', 'intenso'],
 '{"max_participantes": 20, "equipos": ["bicicletas_spinning"], "intensidad": "moderada-alta"}'),

('centro_fitness', 'Entrenamiento Funcional', 'Entrenamiento funcional grupal', 'Clase Grupal', 50, 180.00,
 ARRAY['funcional', 'grupal', 'fuerza', 'resistencia'],
 '{"max_participantes": 12, "equipos": ["kettlebells", "trx", "medicine_ball"], "nivel": "intermedio"}');

-- =====================================================================
-- ACADEMIA - Servicios Educativos
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Clases individuales
('academia', 'Clase Individual', 'Clase personalizada uno a uno', 'Individual', 60, 400.00,
 ARRAY['individual', 'personalizada', 'privada'],
 '{"max_estudiantes": 1, "incluye": ["material_estudio"], "nivel": "todos"}'),

('academia', 'Clase Grupal', 'Clase en grupo reducido', 'Grupal', 90, 200.00,
 ARRAY['grupal', 'interactiva', 'colaborativa'],
 '{"max_estudiantes": 8, "incluye": ["material_compartido"], "nivel": "intermedio"}'),

-- Cursos especializados
('academia', 'Curso Intensivo', 'Curso acelerado de especialización', 'Curso', 120, 600.00,
 ARRAY['intensivo', 'especializado', 'certificacion'],
 '{"duracion_total": "2_semanas", "incluye": ["certificado", "material_completo"], "evaluacion": "continua"}'),

('academia', 'Tutoría Académica', 'Apoyo académico personalizado', 'Tutoría', 45, 300.00,
 ARRAY['tutoria', 'apoyo', 'refuerzo'],
 '{"incluye": ["plan_estudio", "seguimiento"], "areas": ["matematicas", "ciencias", "idiomas"]}');

-- =====================================================================
-- TALLER TÉCNICO - Servicios de Reparación
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Diagnósticos
('taller_tecnico', 'Diagnóstico Técnico', 'Evaluación y diagnóstico de fallas', 'Diagnóstico', 45, 250.00,
 ARRAY['diagnostico', 'evaluacion', 'revision'],
 '{"incluye": ["revision_completa", "reporte_estado"], "equipos": ["multimetro", "osciloscopio"]}'),

('taller_tecnico', 'Mantenimiento Preventivo', 'Servicio de mantenimiento regular', 'Mantenimiento', 90, 400.00,
 ARRAY['mantenimiento', 'preventivo', 'rutinario'],
 '{"incluye": ["limpieza", "lubricacion", "ajustes"], "periodicidad": "trimestral"}'),

-- Reparaciones
('taller_tecnico', 'Reparación Menor', 'Reparación de componentes básicos', 'Reparación', 60, 300.00,
 ARRAY['reparacion', 'menor', 'componentes'],
 '{"incluye": ["mano_obra"], "garantia": "30_dias", "repuestos": "cotizacion_separada"}'),

('taller_tecnico', 'Reparación Mayor', 'Reparación completa o reconstrucción', 'Reparación', 180, 800.00,
 ARRAY['reparacion', 'mayor', 'completa', 'especializada'],
 '{"incluye": ["desmontaje", "reparacion", "montaje"], "garantia": "90_dias", "tiempo_entrega": "3-5_dias"}');

-- =====================================================================
-- VETERINARIA - Servicios de Salud Animal
-- =====================================================================

INSERT INTO plantillas_servicios (
    tipo_industria, nombre, descripcion, categoria, duracion_minutos,
    precio_sugerido, tags, configuracion_especifica
) VALUES
-- Consultas veterinarias
('veterinaria', 'Consulta General', 'Consulta veterinaria de rutina', 'Consulta', 30, 400.00,
 ARRAY['consulta', 'general', 'rutina'],
 '{"incluye": ["examen_fisico", "diagnostico"], "requiere_licencia": true, "especies": ["perros", "gatos", "aves"]}'),

('veterinaria', 'Consulta de Emergencia', 'Atención veterinaria de urgencia', 'Emergencia', 45, 800.00,
 ARRAY['emergencia', 'urgencia', 'critica'],
 '{"disponibilidad": "24h", "incluye": ["estabilizacion", "tratamiento_inmediato"], "prioridad": "alta"}'),

-- Procedimientos preventivos
('veterinaria', 'Vacunación', 'Aplicación de vacunas preventivas', 'Prevención', 20, 200.00,
 ARRAY['vacunacion', 'preventivo', 'inmunizacion'],
 '{"tipos_vacuna": ["multiples", "rabia", "parvovirus"], "incluye": ["cartilla_vacunacion"], "seguimiento": "anual"}'),

('veterinaria', 'Desparasitación', 'Tratamiento antiparasitario', 'Prevención', 15, 150.00,
 ARRAY['desparasitacion', 'preventivo', 'parasitos'],
 '{"tipos": ["interna", "externa"], "incluye": ["medicamento"], "periodicidad": "trimestral"}'),

-- Cirugías
('veterinaria', 'Esterilización', 'Cirugía de esterilización', 'Cirugía', 90, 1500.00,
 ARRAY['cirugia', 'esterilizacion', 'castration'],
 '{"incluye": ["anestesia", "cirugia", "medicamentos"], "cuidados_post": "7_dias", "seguimiento": "obligatorio"}');

-- =====================================================================
-- COMENTARIOS Y METADATOS
-- =====================================================================

-- Agregar metadatos a las plantillas
COMMENT ON TABLE plantillas_servicios IS 'Plantillas pre-configuradas de servicios por industria para facilitar setup inicial';

-- Estadísticas de plantillas creadas
SELECT
    tipo_industria,
    COUNT(*) as total_plantillas,
    STRING_AGG(DISTINCT categoria, ', ') as categorias_disponibles
FROM plantillas_servicios
GROUP BY tipo_industria
ORDER BY tipo_industria;

-- Verificación final
SELECT 'Plantillas de servicios creadas exitosamente. Total: ' || COUNT(*) || ' servicios para ' || COUNT(DISTINCT tipo_industria) || ' industrias.'
FROM plantillas_servicios;