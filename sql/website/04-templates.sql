-- ====================================================================
-- MÓDULO WEBSITE: TEMPLATES PREDISEÑADOS
-- Archivo: sql/website/04-templates.sql
-- Versión: 1.0.0
-- Descripción: Templates prediseñados para crear sitios web rápidamente
-- ====================================================================

-- ====================================================================
-- TABLA: website_templates
-- ====================================================================

CREATE TABLE IF NOT EXISTS website_templates (
    -- Identificador único
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información del template
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    industria VARCHAR(50), -- 'salon', 'restaurante', 'consultorio', 'gym', 'landing', 'portfolio', 'tienda', 'agencia'

    -- Assets
    thumbnail_url TEXT, -- Vista previa del template

    -- Estructura del template (páginas y bloques)
    estructura JSONB NOT NULL DEFAULT '{}',
    -- Formato:
    -- {
    --   "paginas": [
    --     { "slug": "inicio", "titulo": "Inicio", "es_inicio": true },
    --     { "slug": "servicios", "titulo": "Servicios" },
    --     { "slug": "nosotros", "titulo": "Nosotros" },
    --     { "slug": "contacto", "titulo": "Contacto" }
    --   ],
    --   "bloques_por_pagina": {
    --     "inicio": [
    --       { "tipo": "hero", "contenido": {...} },
    --       { "tipo": "servicios", "contenido": {...} }
    --     ]
    --   }
    -- }

    -- Tema por defecto
    tema_default JSONB DEFAULT '{}',
    -- { "color_primario": "#753572", "color_secundario": "#1F2937", ... }

    -- Flags
    es_premium BOOLEAN DEFAULT false, -- Templates de pago
    es_publico BOOLEAN DEFAULT true,  -- Visible para todos (templates de Nexo Team)
    es_destacado BOOLEAN DEFAULT false, -- Mostrar primero

    -- Multi-tenant: templates personalizados por organización
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Estadísticas
    veces_usado INTEGER DEFAULT 0,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE website_templates IS 'Templates prediseñados para crear sitios web rápidamente';
COMMENT ON COLUMN website_templates.industria IS 'Categoría del template por tipo de negocio';
COMMENT ON COLUMN website_templates.estructura IS 'JSON con páginas y bloques del template';
COMMENT ON COLUMN website_templates.es_publico IS 'Templates públicos de Nexo Team (visible para todos)';

-- ====================================================================
-- ÍNDICES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_website_templates_industria
    ON website_templates(industria) WHERE industria IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_templates_publico
    ON website_templates(es_publico, es_destacado) WHERE es_publico = true;

CREATE INDEX IF NOT EXISTS idx_website_templates_org
    ON website_templates(organizacion_id) WHERE organizacion_id IS NOT NULL;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE website_templates ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer templates públicos
CREATE POLICY website_templates_public_read ON website_templates
    FOR SELECT
    USING (es_publico = true);

-- Política: Organización puede leer sus templates personalizados
CREATE POLICY website_templates_org_read ON website_templates
    FOR SELECT
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Política: Organización puede crear sus propios templates
CREATE POLICY website_templates_org_insert ON website_templates
    FOR INSERT
    WITH CHECK (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Política: Organización puede modificar sus templates
CREATE POLICY website_templates_org_update ON website_templates
    FOR UPDATE
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Política: Organización puede eliminar sus templates
CREATE POLICY website_templates_org_delete ON website_templates
    FOR DELETE
    USING (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER);

-- Política: SuperAdmin puede hacer todo
CREATE POLICY website_templates_superadmin ON website_templates
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- DATOS INICIALES: 6 Templates prediseñados
-- ====================================================================

INSERT INTO website_templates (nombre, descripcion, industria, es_publico, es_destacado, estructura, tema_default) VALUES

-- 1. Salón de Belleza / Spa
('Salón de Belleza', 'Template elegante para salones de belleza y spas', 'salon', true, true, '{
  "paginas": [
    {"slug": "inicio", "titulo": "Inicio", "es_inicio": true, "visible_menu": true},
    {"slug": "servicios", "titulo": "Servicios", "visible_menu": true},
    {"slug": "equipo", "titulo": "Nuestro Equipo", "visible_menu": true},
    {"slug": "contacto", "titulo": "Contacto", "visible_menu": true}
  ],
  "bloques_por_pagina": {
    "inicio": [
      {"tipo": "hero", "contenido": {"titulo": "Tu Belleza, Nuestra Pasión", "subtitulo": "Expertos en cuidado personal y estética", "boton_texto": "Agenda tu cita", "boton_tipo": "agendar", "alineacion": "center"}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Nuestros Servicios", "columnas": 3, "items": [{"icono": "Scissors", "titulo": "Corte y Peinado", "descripcion": "Cortes modernos y clásicos"}, {"icono": "Brush", "titulo": "Coloración", "descripcion": "Técnicas de vanguardia"}, {"icono": "Sparkles", "titulo": "Tratamientos", "descripcion": "Hidratación y keratina"}]}},
      {"tipo": "testimonios", "contenido": {"titulo": "Lo que dicen nuestros clientes", "subtitulo": "", "testimonios": [{"nombre": "María García", "texto": "Excelente servicio, muy profesionales y atentos. Lo recomiendo totalmente.", "calificacion": 5, "cargo": "Cliente frecuente"}, {"nombre": "Carlos López", "texto": "La mejor experiencia que he tenido. Definitivamente volveré.", "calificacion": 5, "cargo": "Cliente nuevo"}, {"nombre": "Ana Martínez", "texto": "Superaron mis expectativas. El equipo es increíble.", "calificacion": 5, "cargo": "Cliente VIP"}]}},
      {"tipo": "cta", "contenido": {"titulo": "¿Lista para un cambio?", "descripcion": "Agenda tu cita hoy y recibe 10% de descuento", "boton_texto": "Agendar ahora", "boton_tipo": "agendar"}}
    ],
    "servicios": [
      {"tipo": "hero", "contenido": {"titulo": "Nuestros Servicios", "subtitulo": "Todo lo que necesitas para lucir espectacular", "alineacion": "center"}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "", "columnas": 3, "mostrar_precio": true, "origen": "modulo"}}
    ],
    "equipo": [
      {"tipo": "hero", "contenido": {"titulo": "Conoce a Nuestro Equipo", "subtitulo": "Profesionales apasionados por la belleza", "alineacion": "center"}},
      {"tipo": "equipo", "contenido": {"titulo_seccion": "", "mostrar_redes": true, "origen": "profesionales"}}
    ],
    "contacto": [
      {"tipo": "hero", "contenido": {"titulo": "Contáctanos", "subtitulo": "Estamos para atenderte", "alineacion": "center"}},
      {"tipo": "contacto", "contenido": {"titulo_seccion": "", "mostrar_formulario": true, "mostrar_info": true}},
      {"tipo": "footer", "contenido": {"mostrar_redes": true}}
    ]
  }
}', '{"color_primario": "#D4A5A5", "color_secundario": "#2D2D2D", "color_acento": "#B8860B", "fuente_titulos": "Playfair Display", "fuente_cuerpo": "Lato"}'),

-- 2. Restaurante / Café
('Restaurante', 'Template con menú y reservaciones para restaurantes', 'restaurante', true, true, '{
  "paginas": [
    {"slug": "inicio", "titulo": "Inicio", "es_inicio": true, "visible_menu": true},
    {"slug": "menu", "titulo": "Menú", "visible_menu": true},
    {"slug": "nosotros", "titulo": "Nosotros", "visible_menu": true},
    {"slug": "reservaciones", "titulo": "Reservaciones", "visible_menu": true}
  ],
  "bloques_por_pagina": {
    "inicio": [
      {"tipo": "hero", "contenido": {"titulo": "Una Experiencia Gastronómica Única", "subtitulo": "Sabores que conquistan", "boton_texto": "Reservar Mesa", "boton_tipo": "agendar", "alineacion": "center"}},
      {"tipo": "galeria", "contenido": {"titulo_seccion": "Nuestros Platillos", "layout": "grid", "columnas": 3}},
      {"tipo": "testimonios", "contenido": {"titulo": "Reseñas de Clientes", "subtitulo": "", "testimonios": [{"nombre": "Roberto Sánchez", "texto": "La comida es espectacular, sabores auténticos. Un lugar que vale la pena visitar.", "calificacion": 5, "cargo": "Crítico gastronómico"}, {"nombre": "Laura Fernández", "texto": "El ambiente es acogedor y el servicio impecable. Mi restaurante favorito.", "calificacion": 5, "cargo": "Cliente frecuente"}, {"nombre": "Diego Ramírez", "texto": "Cada platillo es una obra de arte. Precios justos por calidad excepcional.", "calificacion": 5, "cargo": "Food blogger"}]}},
      {"tipo": "cta", "contenido": {"titulo": "¿Listo para una experiencia inolvidable?", "boton_texto": "Hacer Reservación"}}
    ],
    "menu": [
      {"tipo": "hero", "contenido": {"titulo": "Nuestro Menú", "subtitulo": "Platillos preparados con amor", "alineacion": "center"}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Entradas", "columnas": 2, "mostrar_precio": true}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Platos Fuertes", "columnas": 2, "mostrar_precio": true}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Postres", "columnas": 3, "mostrar_precio": true}}
    ],
    "nosotros": [
      {"tipo": "hero", "contenido": {"titulo": "Nuestra Historia", "subtitulo": "Tradición y sabor desde 1990", "alineacion": "center"}},
      {"tipo": "texto", "contenido": {"contenido": "<p>Somos un restaurante familiar con más de 30 años de historia...</p>", "alineacion": "center"}},
      {"tipo": "equipo", "contenido": {"titulo_seccion": "Nuestro Equipo", "mostrar_redes": false}}
    ],
    "reservaciones": [
      {"tipo": "contacto", "contenido": {"titulo_seccion": "Reserva tu Mesa", "mostrar_formulario": true, "mostrar_info": true}},
      {"tipo": "footer", "contenido": {"mostrar_redes": true}}
    ]
  }
}', '{"color_primario": "#8B4513", "color_secundario": "#1C1C1C", "color_acento": "#DAA520", "fuente_titulos": "Cinzel", "fuente_cuerpo": "Open Sans"}'),

-- 3. Consultorio Médico
('Consultorio Médico', 'Template profesional para doctores y clínicas', 'consultorio', true, true, '{
  "paginas": [
    {"slug": "inicio", "titulo": "Inicio", "es_inicio": true, "visible_menu": true},
    {"slug": "servicios", "titulo": "Servicios", "visible_menu": true},
    {"slug": "doctor", "titulo": "El Doctor", "visible_menu": true},
    {"slug": "citas", "titulo": "Agendar Cita", "visible_menu": true}
  ],
  "bloques_por_pagina": {
    "inicio": [
      {"tipo": "hero", "contenido": {"titulo": "Tu Salud en las Mejores Manos", "subtitulo": "Atención médica de calidad con calidez humana", "boton_texto": "Agendar Consulta", "boton_tipo": "agendar", "alineacion": "center"}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Especialidades", "columnas": 4, "items": [{"icono": "Heart", "titulo": "Cardiología", "descripcion": "Cuidado del corazón"}, {"icono": "Brain", "titulo": "Neurología", "descripcion": "Sistema nervioso"}, {"icono": "Bone", "titulo": "Traumatología", "descripcion": "Sistema óseo"}, {"icono": "Eye", "titulo": "Oftalmología", "descripcion": "Salud visual"}]}},
      {"tipo": "cta", "contenido": {"titulo": "¿Necesitas una consulta?", "descripcion": "Agenda tu cita hoy mismo", "boton_texto": "Agendar Cita", "boton_tipo": "agendar"}}
    ],
    "doctor": [
      {"tipo": "hero", "contenido": {"titulo": "Conozca al Doctor", "alineacion": "center"}},
      {"tipo": "equipo", "contenido": {"titulo_seccion": "", "mostrar_redes": true}},
      {"tipo": "texto", "contenido": {"contenido": "<h3>Formación Académica</h3><p>Universidad Nacional...</p>", "alineacion": "left"}}
    ],
    "citas": [
      {"tipo": "contacto", "contenido": {"titulo_seccion": "Agende su Consulta", "mostrar_formulario": true, "mostrar_info": true, "campos_formulario": ["nombre", "email", "telefono", "mensaje"]}},
      {"tipo": "footer", "contenido": {"mostrar_redes": true}}
    ]
  }
}', '{"color_primario": "#0077B6", "color_secundario": "#023E8A", "color_acento": "#00B4D8", "fuente_titulos": "Montserrat", "fuente_cuerpo": "Roboto"}'),

-- 4. Gimnasio / Fitness
('Gimnasio Fitness', 'Template dinámico para gimnasios y centros de fitness', 'gym', true, false, '{
  "paginas": [
    {"slug": "inicio", "titulo": "Inicio", "es_inicio": true, "visible_menu": true},
    {"slug": "clases", "titulo": "Clases", "visible_menu": true},
    {"slug": "entrenadores", "titulo": "Entrenadores", "visible_menu": true},
    {"slug": "contacto", "titulo": "Únete", "visible_menu": true}
  ],
  "bloques_por_pagina": {
    "inicio": [
      {"tipo": "hero", "contenido": {"titulo": "Transforma Tu Cuerpo", "subtitulo": "Entrena con los mejores", "boton_texto": "Empieza Hoy", "boton_tipo": "link", "alineacion": "center"}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Nuestras Clases", "columnas": 3, "items": [{"icono": "Dumbbell", "titulo": "Pesas", "descripcion": "Fortalece tu cuerpo"}, {"icono": "Heart", "titulo": "Cardio", "descripcion": "Mejora tu resistencia"}, {"icono": "Zap", "titulo": "HIIT", "descripcion": "Quema calorías rápido"}]}},
      {"tipo": "video", "contenido": {"titulo_seccion": "Conoce Nuestras Instalaciones"}},
      {"tipo": "testimonios", "contenido": {"titulo": "Historias de Éxito", "subtitulo": "", "testimonios": [{"nombre": "Javier Torres", "texto": "Perdí 15 kilos en 3 meses. Los entrenadores son increíbles y te motivan constantemente.", "calificacion": 5, "cargo": "Miembro desde 2024"}, {"nombre": "Patricia Ruiz", "texto": "El mejor gimnasio de la ciudad. Equipos modernos y clases muy dinámicas.", "calificacion": 5, "cargo": "Atleta amateur"}, {"nombre": "Miguel Ángel", "texto": "Transformé mi vida completamente. El ambiente es muy positivo y familiar.", "calificacion": 5, "cargo": "Nuevo miembro"}]}},
      {"tipo": "cta", "contenido": {"titulo": "Primera Clase Gratis", "descripcion": "Ven a conocernos sin compromiso", "boton_texto": "Agendar Clase"}}
    ],
    "entrenadores": [
      {"tipo": "hero", "contenido": {"titulo": "Nuestros Entrenadores", "subtitulo": "Profesionales certificados", "alineacion": "center"}},
      {"tipo": "equipo", "contenido": {"titulo_seccion": "", "mostrar_redes": true, "origen": "profesionales"}}
    ],
    "contacto": [
      {"tipo": "contacto", "contenido": {"titulo_seccion": "Únete a la Familia", "mostrar_formulario": true, "mostrar_info": true}},
      {"tipo": "footer", "contenido": {"mostrar_redes": true}}
    ]
  }
}', '{"color_primario": "#FF6B35", "color_secundario": "#1A1A2E", "color_acento": "#FFE66D", "fuente_titulos": "Bebas Neue", "fuente_cuerpo": "Poppins"}'),

-- 5. Landing Page
('Landing Page', 'Template minimalista de una sola página', 'landing', true, true, '{
  "paginas": [
    {"slug": "inicio", "titulo": "Inicio", "es_inicio": true, "visible_menu": false}
  ],
  "bloques_por_pagina": {
    "inicio": [
      {"tipo": "hero", "contenido": {"titulo": "El Producto que Necesitas", "subtitulo": "La solución perfecta para tu negocio", "boton_texto": "Empezar Ahora", "boton_tipo": "link", "alineacion": "center"}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Características", "columnas": 3, "items": [{"icono": "Zap", "titulo": "Rápido", "descripcion": "Resultados inmediatos"}, {"icono": "Shield", "titulo": "Seguro", "descripcion": "Protección garantizada"}, {"icono": "Award", "titulo": "Premium", "descripcion": "Calidad superior"}]}},
      {"tipo": "testimonios", "contenido": {"titulo": "Lo que Dicen Nuestros Clientes", "subtitulo": "", "testimonios": [{"nombre": "Empresa ABC", "texto": "Incrementamos nuestras ventas un 40% desde que usamos este producto. Totalmente recomendado.", "calificacion": 5, "cargo": "Director de Marketing"}, {"nombre": "StartUp XYZ", "texto": "La mejor inversión que hemos hecho. Soporte excepcional y resultados inmediatos.", "calificacion": 5, "cargo": "CEO & Fundador"}, {"nombre": "Comercio Local", "texto": "Fácil de usar y muy efectivo. Nuestros clientes están más satisfechos que nunca.", "calificacion": 5, "cargo": "Propietario"}]}},
      {"tipo": "cta", "contenido": {"titulo": "¿Listo para Empezar?", "descripcion": "Únete a miles de clientes satisfechos", "boton_texto": "Comenzar Gratis"}},
      {"tipo": "contacto", "contenido": {"titulo_seccion": "Contáctanos", "mostrar_formulario": true, "mostrar_info": false}},
      {"tipo": "footer", "contenido": {"mostrar_redes": true}}
    ]
  }
}', '{"color_primario": "#753572", "color_secundario": "#1F2937", "color_acento": "#F59E0B", "fuente_titulos": "Inter", "fuente_cuerpo": "Inter"}'),

-- 6. Portfolio / Freelancer
('Portfolio', 'Template para freelancers y creativos', 'portfolio', true, false, '{
  "paginas": [
    {"slug": "inicio", "titulo": "Inicio", "es_inicio": true, "visible_menu": true},
    {"slug": "proyectos", "titulo": "Proyectos", "visible_menu": true},
    {"slug": "sobre-mi", "titulo": "Sobre Mí", "visible_menu": true},
    {"slug": "contacto", "titulo": "Contacto", "visible_menu": true}
  ],
  "bloques_por_pagina": {
    "inicio": [
      {"tipo": "hero", "contenido": {"titulo": "Diseñador & Desarrollador", "subtitulo": "Creando experiencias digitales memorables", "boton_texto": "Ver Proyectos", "boton_tipo": "link", "boton_url": "#proyectos", "alineacion": "left"}},
      {"tipo": "galeria", "contenido": {"titulo_seccion": "Proyectos Destacados", "layout": "masonry", "columnas": 3}},
      {"tipo": "servicios", "contenido": {"titulo_seccion": "Servicios", "columnas": 3, "items": [{"icono": "Palette", "titulo": "Diseño UI/UX", "descripcion": "Interfaces intuitivas"}, {"icono": "Code", "titulo": "Desarrollo Web", "descripcion": "Sitios modernos"}, {"icono": "Smartphone", "titulo": "Apps Móviles", "descripcion": "iOS y Android"}]}},
      {"tipo": "cta", "contenido": {"titulo": "¿Tienes un proyecto en mente?", "descripcion": "Trabajemos juntos para hacerlo realidad", "boton_texto": "Contactar"}}
    ],
    "proyectos": [
      {"tipo": "hero", "contenido": {"titulo": "Mis Proyectos", "subtitulo": "Una selección de mi trabajo reciente", "alineacion": "center"}},
      {"tipo": "galeria", "contenido": {"titulo_seccion": "", "layout": "grid", "columnas": 3}}
    ],
    "sobre-mi": [
      {"tipo": "hero", "contenido": {"titulo": "Sobre Mí", "alineacion": "center"}},
      {"tipo": "texto", "contenido": {"contenido": "<p>Soy un diseñador y desarrollador con más de 5 años de experiencia...</p>", "alineacion": "left"}},
      {"tipo": "testimonios", "contenido": {"titulo": "Lo que Dicen Mis Clientes", "subtitulo": "", "testimonios": [{"nombre": "Tech Startup", "texto": "Entregó un trabajo excepcional. Muy profesional y cumplió todos los plazos.", "calificacion": 5, "cargo": "Product Manager"}, {"nombre": "Agencia Digital", "texto": "Creatividad y técnica en perfecto balance. Definitivamente volveremos a trabajar juntos.", "calificacion": 5, "cargo": "Director Creativo"}, {"nombre": "E-commerce Plus", "texto": "Nuestra nueva web superó todas las expectativas. Muy recomendado.", "calificacion": 5, "cargo": "Fundador"}]}}
    ],
    "contacto": [
      {"tipo": "contacto", "contenido": {"titulo_seccion": "Trabajemos Juntos", "mostrar_formulario": true, "mostrar_info": true}},
      {"tipo": "footer", "contenido": {"mostrar_redes": true}}
    ]
  }
}', '{"color_primario": "#2D3436", "color_secundario": "#0984E3", "color_acento": "#00B894", "fuente_titulos": "Space Grotesk", "fuente_cuerpo": "DM Sans"}')

ON CONFLICT DO NOTHING;

-- ====================================================================
-- TRIGGER: Actualizar timestamp
-- ====================================================================

CREATE OR REPLACE FUNCTION update_website_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_website_templates_timestamp ON website_templates;
CREATE TRIGGER trigger_website_templates_timestamp
    BEFORE UPDATE ON website_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_website_templates_timestamp();

-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
