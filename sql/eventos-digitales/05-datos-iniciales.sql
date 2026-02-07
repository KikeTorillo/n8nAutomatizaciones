-- ====================================================================
-- MODULO EVENTOS DIGITALES - DATOS INICIALES
-- ====================================================================
-- 18 plantillas de eventos con bloques completos e imagenes Unsplash
-- 3 por tipo: boda, xv_anos, bautizo, cumpleanos, corporativo, universal
--
-- Fecha creacion: 4 Diciembre 2025
-- Actualizado: 7 Febrero 2026 - 18 plantillas con bloques reales
-- ====================================================================

-- Eliminar plantillas anteriores
DELETE FROM plantillas_evento WHERE codigo IN ('cumple-guerreras-kpop','cumple-mario-bros','boda-quiet-luxury-2025');

-- BODA: Elegancia Dorada
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'boda-elegancia-dorada',
    'Elegancia Dorada',
    'boda',
    'elegante',
    'dorado',
    'Invitacion de boda elegante con acentos dorados y tipografia clasica. Perfecta para bodas formales y sofisticadas.',
    '{"color_primario":"#A47B67","color_secundario":"#D4AF37","color_fondo":"#FDF8F3","color_texto":"#3D2B1F","color_texto_claro":"#8B7355","fuente_titulo":"Cormorant Garamond","fuente_cuerpo":"Montserrat","patron_fondo":"none","patron_opacidad":0.05,"decoracion_esquinas":"flores","icono_principal":"ring","animacion_entrada":"fade","efecto_titulo":"none","marco_fotos":"ornate","stickers":["💍","🤍","✨"]}',
    '[{"id":"tpl-1","tipo":"apertura","orden":0,"visible":true,"contenido":{"modo":"animacion","animacion":"sobre","texto":"Desliza para abrir","direccion_apertura":"vertical"},"estilos":{}},{"id":"tpl-2","tipo":"hero_invitacion","orden":1,"visible":true,"contenido":{"titulo":"Ana & Carlos","subtitulo":"Nos casamos","imagen_url":"https://images.unsplash.com/photo-1768611265212-4c2169dd754a?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.3,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-3","tipo":"separador","orden":2,"visible":true,"contenido":{"estilo":"linea","altura":40,"color":""},"estilos":{}},{"id":"tpl-4","tipo":"countdown","orden":3,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-5","tipo":"timeline","orden":4,"visible":true,"contenido":{"titulo_seccion":"Itinerario","subtitulo_seccion":"","items":[{"hora":"16:00","titulo":"Ceremonia Religiosa","descripcion":"Parroquia","icono":"Church"},{"hora":"17:30","titulo":"Coctel de Bienvenida","descripcion":"Terraza del salon","icono":"Wine"},{"hora":"19:00","titulo":"Recepcion","descripcion":"Salon principal","icono":"UtensilsCrossed"},{"hora":"20:30","titulo":"Primer Vals","descripcion":"Baile de los novios","icono":"Music"},{"hora":"21:00","titulo":"¡Fiesta!","descripcion":"Musica y diversion toda la noche","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-6","tipo":"ubicacion","orden":5,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-7","tipo":"galeria","orden":6,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1691439262095-d55b96c6e9df?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1758995115475-7b7d6eb060ba?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1743594789385-323b38491cdc?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1632406475389-7ac505467d45?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-8","tipo":"mesa_regalos","orden":7,"visible":true,"contenido":{"titulo":"Mesa de Regalos","subtitulo":"Tu presencia es nuestro mejor regalo","usar_mesa_evento":true,"items":[],"layout":"grid"},"estilos":{}},{"id":"tpl-9","tipo":"rsvp","orden":8,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-10","tipo":"felicitaciones","orden":9,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    1
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- BODA: Jardin Romantico
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'boda-jardin-romantico',
    'Jardin Romantico',
    'boda',
    'rustico',
    'botanico',
    'Invitacion de boda con estetica de jardin, flores y naturaleza. Ideal para bodas al aire libre y celebraciones campestres.',
    '{"color_primario":"#059669","color_secundario":"#F9A8D4","color_fondo":"#F0FDF4","color_texto":"#1F2937","color_texto_claro":"#6B7280","fuente_titulo":"Playfair Display","fuente_cuerpo":"Lora","patron_fondo":"none","patron_opacidad":0.08,"decoracion_esquinas":"hojas","icono_principal":"heart","animacion_entrada":"fade","efecto_titulo":"none","marco_fotos":"vintage","stickers":["🌿","💐","🤍"]}',
    '[{"id":"tpl-101","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Maria & Juan","subtitulo":"Celebremos juntos","imagen_url":"https://images.unsplash.com/photo-1765614767136-36d6ec4eb340?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.35,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-102","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-103","tipo":"texto","orden":2,"visible":true,"contenido":{"contenido":"Con la bendicion de Dios y nuestras familias, los invitamos a celebrar nuestra union.","alineacion":"center","tamano_fuente":"normal"},"estilos":{}},{"id":"tpl-104","tipo":"timeline","orden":3,"visible":true,"contenido":{"titulo_seccion":"Programa del Dia","subtitulo_seccion":"","items":[{"hora":"16:00","titulo":"Ceremonia Religiosa","descripcion":"Parroquia","icono":"Church"},{"hora":"17:30","titulo":"Coctel de Bienvenida","descripcion":"Terraza del salon","icono":"Wine"},{"hora":"19:00","titulo":"Recepcion","descripcion":"Salon principal","icono":"UtensilsCrossed"},{"hora":"20:30","titulo":"Primer Vals","descripcion":"Baile de los novios","icono":"Music"},{"hora":"21:00","titulo":"¡Fiesta!","descripcion":"Musica y diversion toda la noche","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-105","tipo":"ubicacion","orden":4,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-106","tipo":"galeria","orden":5,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1769990878935-a7300c5e5825?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1769311732015-b4ff72238961?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1763817726601-54372d0f1ccd?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1762328853228-0a6ae9fd5e72?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-107","tipo":"mesa_regalos","orden":6,"visible":true,"contenido":{"titulo":"Mesa de Regalos","subtitulo":"Tu presencia es nuestro mejor regalo","usar_mesa_evento":true,"items":[],"layout":"grid"},"estilos":{}},{"id":"tpl-108","tipo":"rsvp","orden":7,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-109","tipo":"felicitaciones","orden":8,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    2
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- BODA: Minimalista Moderna
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'boda-minimalista-moderna',
    'Minimalista Moderna',
    'boda',
    'moderno',
    'clean',
    'Diseno limpio y contemporaneo para parejas modernas. Minimalismo sofisticado con tipografia sans-serif.',
    '{"color_primario":"#1F2937","color_secundario":"#F9FAFB","color_fondo":"#FFFFFF","color_texto":"#111827","color_texto_claro":"#6B7280","fuente_titulo":"Montserrat","fuente_cuerpo":"Inter","patron_fondo":"none","patron_opacidad":0,"decoracion_esquinas":"none","icono_principal":"heart","animacion_entrada":"slide","efecto_titulo":"none","marco_fotos":"rounded","stickers":[]}',
    '[{"id":"tpl-201","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Laura & Diego","subtitulo":"Save the Date","imagen_url":"https://images.unsplash.com/photo-1532276796841-9a5a09e5a4a6?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.25,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-202","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-203","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Itinerario","subtitulo_seccion":"","items":[{"hora":"16:00","titulo":"Ceremonia Religiosa","descripcion":"Parroquia","icono":"Church"},{"hora":"17:30","titulo":"Coctel de Bienvenida","descripcion":"Terraza del salon","icono":"Wine"},{"hora":"19:00","titulo":"Recepcion","descripcion":"Salon principal","icono":"UtensilsCrossed"},{"hora":"20:30","titulo":"Primer Vals","descripcion":"Baile de los novios","icono":"Music"},{"hora":"21:00","titulo":"¡Fiesta!","descripcion":"Musica y diversion toda la noche","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-204","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-205","tipo":"rsvp","orden":4,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-206","tipo":"felicitaciones","orden":5,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    3
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- XV_ANOS: Sueno Rosa
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'xv-sueno-rosa',
    'Sueno Rosa',
    'xv_anos',
    'elegante',
    'princesa',
    'Invitacion de XV anos en tonos rosa y dorado. Estilo princesa con tipografia elegante y detalles brillantes.',
    '{"color_primario":"#DB2777","color_secundario":"#D4AF37","color_fondo":"#FDF2F8","color_texto":"#1F2937","color_texto_claro":"#9CA3AF","fuente_titulo":"Great Vibes","fuente_cuerpo":"Quicksand","patron_fondo":"hearts","patron_opacidad":0.08,"decoracion_esquinas":"corazones","icono_principal":"crown","animacion_entrada":"fade","efecto_titulo":"sparkle","marco_fotos":"ornate","stickers":["👑","💖","✨","🎀"]}',
    '[{"id":"tpl-301","tipo":"apertura","orden":0,"visible":true,"contenido":{"modo":"animacion","animacion":"sobre","texto":"Desliza para abrir","direccion_apertura":"vertical"},"estilos":{}},{"id":"tpl-302","tipo":"hero_invitacion","orden":1,"visible":true,"contenido":{"titulo":"Mis XV Anos","subtitulo":"Valentina","imagen_url":"https://images.unsplash.com/photo-1676818248411-a6f5277309f7?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.35,"tipo_overlay":"uniforme","color_overlay":"#831843","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-303","tipo":"countdown","orden":2,"visible":true,"contenido":{"titulo":"Cuenta Regresiva","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-304","tipo":"timeline","orden":3,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"15:00","titulo":"Misa de Accion de Gracias","descripcion":"Parroquia","icono":"Church"},{"hora":"16:30","titulo":"Sesion de Fotos","descripcion":"Jardin","icono":"Camera"},{"hora":"17:30","titulo":"Recepcion","descripcion":"Salon de fiestas","icono":"UtensilsCrossed"},{"hora":"19:00","titulo":"Vals y Brindis","descripcion":"Pista principal","icono":"Music"},{"hora":"20:00","titulo":"¡Fiesta!","descripcion":"DJ y musica toda la noche","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-305","tipo":"ubicacion","orden":4,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-306","tipo":"galeria","orden":5,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1767070805792-3768aeffb6ff?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1767070806645-b0d595fa2c6a?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1748892956048-863be7d2bf47?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1726828952326-c82f9683f3bb?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-307","tipo":"rsvp","orden":6,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-308","tipo":"felicitaciones","orden":7,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    4
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- XV_ANOS: Noche de Estrellas
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'xv-noche-estrellas',
    'Noche de Estrellas',
    'xv_anos',
    'moderno',
    'neon',
    'Invitacion moderna con estetica nocturna, luces y tonos purpura. Para celebraciones juveniles y vibrantes.',
    '{"color_primario":"#8B5CF6","color_secundario":"#14B8A6","color_fondo":"#0F172A","color_texto":"#F8FAFC","color_texto_claro":"#94A3B8","fuente_titulo":"Poppins","fuente_cuerpo":"Inter","patron_fondo":"stars","patron_opacidad":0.2,"decoracion_esquinas":"estrellas","icono_principal":"star","animacion_entrada":"zoom","efecto_titulo":"glow","marco_fotos":"neon","stickers":["⭐","🌙","✨","💜"]}',
    '[{"id":"tpl-401","tipo":"apertura","orden":0,"visible":true,"contenido":{"modo":"animacion","animacion":"sobre","texto":"Desliza para abrir","direccion_apertura":"vertical"},"estilos":{}},{"id":"tpl-402","tipo":"hero_invitacion","orden":1,"visible":true,"contenido":{"titulo":"Mis XV Anos","subtitulo":"Camila","imagen_url":"https://images.unsplash.com/photo-1663534345763-791596a14227?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.4,"tipo_overlay":"uniforme","color_overlay":"#1E1B4B","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-403","tipo":"countdown","orden":2,"visible":true,"contenido":{"titulo":"Cuenta Regresiva","texto_finalizado":"¡Llego el gran dia!","estilo":"flip","mostrar_segundos":false},"estilos":{}},{"id":"tpl-404","tipo":"timeline","orden":3,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"15:00","titulo":"Misa de Accion de Gracias","descripcion":"Parroquia","icono":"Church"},{"hora":"16:30","titulo":"Sesion de Fotos","descripcion":"Jardin","icono":"Camera"},{"hora":"17:30","titulo":"Recepcion","descripcion":"Salon de fiestas","icono":"UtensilsCrossed"},{"hora":"19:00","titulo":"Vals y Brindis","descripcion":"Pista principal","icono":"Music"},{"hora":"20:00","titulo":"¡Fiesta!","descripcion":"DJ y musica toda la noche","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-405","tipo":"ubicacion","orden":4,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-406","tipo":"galeria","orden":5,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1760577034875-2540ef782ed5?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1758844899195-c0b5829cbe8f?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1760411537843-7eee52d25fbe?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1686040876423-62ea35ba6da9?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-407","tipo":"rsvp","orden":6,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-408","tipo":"felicitaciones","orden":7,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    5
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- XV_ANOS: Mariposas Doradas
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'xv-mariposas-doradas',
    'Mariposas Doradas',
    'xv_anos',
    'elegante',
    'dorado',
    'Elegante diseno con mariposas doradas y flores. Combina lo clasico con lo juvenil para una celebracion inolvidable.',
    '{"color_primario":"#B45309","color_secundario":"#F472B6","color_fondo":"#FFFBEB","color_texto":"#1F2937","color_texto_claro":"#92400E","fuente_titulo":"Cormorant Garamond","fuente_cuerpo":"Quicksand","patron_fondo":"none","patron_opacidad":0.05,"decoracion_esquinas":"flores","icono_principal":"crown","animacion_entrada":"fade","efecto_titulo":"gradient","marco_fotos":"vintage","stickers":["🦋","✨","🌸","👑"]}',
    '[{"id":"tpl-501","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Mis XV Anos","subtitulo":"Sofia","imagen_url":"https://images.unsplash.com/photo-1660898907248-e54b937d5c3c?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.3,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-502","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-503","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"15:00","titulo":"Misa de Accion de Gracias","descripcion":"Parroquia","icono":"Church"},{"hora":"16:30","titulo":"Sesion de Fotos","descripcion":"Jardin","icono":"Camera"},{"hora":"17:30","titulo":"Recepcion","descripcion":"Salon de fiestas","icono":"UtensilsCrossed"},{"hora":"19:00","titulo":"Vals y Brindis","descripcion":"Pista principal","icono":"Music"},{"hora":"20:00","titulo":"¡Fiesta!","descripcion":"DJ y musica toda la noche","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-504","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-505","tipo":"galeria","orden":4,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1586109677700-13a9f24eceb6?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1760492295188-21b30deecd15?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1731054199038-753c94ce7e83?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1722002208413-24a00591d204?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-506","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-507","tipo":"felicitaciones","orden":6,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    6
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- BAUTIZO: Angelito Celeste
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'bautizo-angelito-celeste',
    'Angelito Celeste',
    'bautizo',
    'infantil',
    'celestial',
    'Invitacion de bautizo en tonos celestes con detalles tiernos. Perfecta para dar la bienvenida al bebe a la fe.',
    '{"color_primario":"#38BDF8","color_secundario":"#BAE6FD","color_fondo":"#F0F9FF","color_texto":"#0C4A6E","color_texto_claro":"#7DD3FC","fuente_titulo":"Quicksand","fuente_cuerpo":"Nunito","patron_fondo":"dots","patron_opacidad":0.08,"decoracion_esquinas":"lazos","icono_principal":"baby","animacion_entrada":"fade","efecto_titulo":"none","marco_fotos":"rounded","stickers":["👼","💙","🕊️","✨"]}',
    '[{"id":"tpl-601","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Mi Bautizo","subtitulo":"Santiago","imagen_url":"https://images.unsplash.com/photo-1502201661686-673f2fdb8da7?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.25,"tipo_overlay":"uniforme","color_overlay":"#0C4A6E","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-602","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el dia de mi bautizo!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-603","tipo":"ubicacion","orden":2,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-604","tipo":"galeria","orden":3,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1768776183151-a80ccea20f77?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1768776182056-73b5d4b8a381?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1765317270548-25d6c3547ffe?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1767396867553-596fef4e70c3?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-605","tipo":"rsvp","orden":4,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-606","tipo":"felicitaciones","orden":5,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    7
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- BAUTIZO: Rosa Bendicion
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'bautizo-rosa-bendicion',
    'Rosa Bendicion',
    'bautizo',
    'infantil',
    'dulce',
    'Dulce invitacion de bautizo en tonos rosa con flores. Tierna y delicada para celebrar este momento especial.',
    '{"color_primario":"#F472B6","color_secundario":"#FBCFE8","color_fondo":"#FDF2F8","color_texto":"#831843","color_texto_claro":"#F9A8D4","fuente_titulo":"Lora","fuente_cuerpo":"Quicksand","patron_fondo":"dots","patron_opacidad":0.06,"decoracion_esquinas":"flores","icono_principal":"baby","animacion_entrada":"fade","efecto_titulo":"none","marco_fotos":"polaroid","stickers":["👼","💗","🌸","🎀"]}',
    '[{"id":"tpl-701","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Mi Bautizo","subtitulo":"Isabella","imagen_url":"https://images.unsplash.com/photo-1731743215053-53eb81151f60?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.25,"tipo_overlay":"uniforme","color_overlay":"#831843","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-702","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el dia de mi bautizo!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-703","tipo":"ubicacion","orden":2,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-704","tipo":"galeria","orden":3,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1759490783759-442e7a690c29?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1680870043938-5e78b1ba074f?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1590462764062-75098d55564c?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1738688376467-9a6342c3b575?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-705","tipo":"rsvp","orden":4,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-706","tipo":"felicitaciones","orden":5,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    8
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- BAUTIZO: Botanico Natural
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'bautizo-botanico-natural',
    'Botanico Natural',
    'bautizo',
    'moderno',
    'botanico',
    'Diseno fresco y natural con tonos verdes y elementos botanicos. Moderno y elegante para familias contemporaneas.',
    '{"color_primario":"#34D399","color_secundario":"#FEF3C7","color_fondo":"#ECFDF5","color_texto":"#064E3B","color_texto_claro":"#6EE7B7","fuente_titulo":"Montserrat","fuente_cuerpo":"Inter","patron_fondo":"none","patron_opacidad":0,"decoracion_esquinas":"hojas","icono_principal":"baby","animacion_entrada":"slide","efecto_titulo":"none","marco_fotos":"rounded","stickers":["🌿","👼","🍃"]}',
    '[{"id":"tpl-801","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Mi Bautizo","subtitulo":"Mateo","imagen_url":"https://images.unsplash.com/photo-1658048553220-496f77b9b5e6?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.25,"tipo_overlay":"uniforme","color_overlay":"#064E3B","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-802","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-803","tipo":"texto","orden":2,"visible":true,"contenido":{"contenido":"Con la bendicion de Dios, los invitamos a celebrar el bautizo de nuestro pequeno.","alineacion":"center","tamano_fuente":"normal"},"estilos":{}},{"id":"tpl-804","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-805","tipo":"rsvp","orden":4,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-806","tipo":"felicitaciones","orden":5,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    9
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- CUMPLEANOS: Fiesta Tropical
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'cumple-fiesta-tropical',
    'Fiesta Tropical',
    'cumpleanos',
    'moderno',
    'tropical',
    'Invitacion vibrante y colorida con estetica tropical. Ideal para fiestas de cumpleanos al aire libre.',
    '{"color_primario":"#F59E0B","color_secundario":"#EF4444","color_fondo":"#FFFBEB","color_texto":"#1F2937","color_texto_claro":"#92400E","fuente_titulo":"Poppins","fuente_cuerpo":"Nunito","patron_fondo":"confetti","patron_opacidad":0.12,"decoracion_esquinas":"globos","icono_principal":"cake","animacion_entrada":"bounce","efecto_titulo":"shadow","marco_fotos":"rounded","stickers":["🎉","🌴","🎂","🎈"]}',
    '[{"id":"tpl-901","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"¡Fiesta!","subtitulo":"Cumpleanos de Pablo","imagen_url":"https://images.unsplash.com/photo-1746003625453-4b4cfaa0401b?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.3,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-902","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Es hoy!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-903","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"14:00","titulo":"Bienvenida","descripcion":"Llegada de invitados","icono":"Users"},{"hora":"15:00","titulo":"Actividades","descripcion":"Juegos y diversion","icono":"Gamepad2"},{"hora":"16:30","titulo":"Comida","descripcion":"Banquete","icono":"UtensilsCrossed"},{"hora":"17:30","titulo":"Pastel y Cancion","descripcion":"¡Feliz cumpleanos!","icono":"Cake"},{"hora":"18:00","titulo":"¡Fiesta!","descripcion":"Musica y baile","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-904","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-905","tipo":"galeria","orden":4,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1765947381208-4dc226967f6a?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1765947381462-184c2a771210?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1765947379899-37a389330d77?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1530104091755-015d31dfa0b9?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-906","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}}]',
    false,
    10
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- CUMPLEANOS: Elegante Celebracion
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'cumple-elegante-celebracion',
    'Elegante Celebracion',
    'cumpleanos',
    'adulto',
    'dorado',
    'Invitacion sofisticada en negro y dorado para cumpleanos de adultos. Perfecta para celebraciones formales.',
    '{"color_primario":"#1F2937","color_secundario":"#D4AF37","color_fondo":"#111827","color_texto":"#F9FAFB","color_texto_claro":"#D1D5DB","fuente_titulo":"Playfair Display","fuente_cuerpo":"Montserrat","patron_fondo":"none","patron_opacidad":0,"decoracion_esquinas":"none","icono_principal":"cake","animacion_entrada":"fade","efecto_titulo":"gradient","marco_fotos":"rounded","stickers":["🥂","✨","🎂"]}',
    '[{"id":"tpl-1001","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Celebremos Juntos","subtitulo":"Cumpleanos de Andrea","imagen_url":"https://images.unsplash.com/photo-1758738180478-0fd260c86605?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.4,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1002","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Cuenta Regresiva","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1003","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"14:00","titulo":"Bienvenida","descripcion":"Llegada de invitados","icono":"Users"},{"hora":"15:00","titulo":"Actividades","descripcion":"Juegos y diversion","icono":"Gamepad2"},{"hora":"16:30","titulo":"Comida","descripcion":"Banquete","icono":"UtensilsCrossed"},{"hora":"17:30","titulo":"Pastel y Cancion","descripcion":"¡Feliz cumpleanos!","icono":"Cake"},{"hora":"18:00","titulo":"¡Fiesta!","descripcion":"Musica y baile","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1004","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1005","tipo":"rsvp","orden":4,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-1006","tipo":"felicitaciones","orden":5,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    11
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- CUMPLEANOS: Pastel Party
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'cumple-pastel-party',
    'Pastel Party',
    'cumpleanos',
    'infantil',
    'dulce',
    'Divertida invitacion en colores pastel con globos y confetti. Ideal para fiestas infantiles llenas de alegria.',
    '{"color_primario":"#EC4899","color_secundario":"#A78BFA","color_fondo":"#FDF2F8","color_texto":"#1F2937","color_texto_claro":"#9CA3AF","fuente_titulo":"Quicksand","fuente_cuerpo":"Nunito","patron_fondo":"confetti","patron_opacidad":0.15,"decoracion_esquinas":"globos","icono_principal":"balloon","animacion_entrada":"bounce","efecto_titulo":"shadow","marco_fotos":"polaroid","stickers":["🎈","🎂","🌈","🦄"]}',
    '[{"id":"tpl-1101","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"¡Fiesta!","subtitulo":"Cumple de Lucia","imagen_url":"https://images.unsplash.com/photo-1523754569648-43ccb845c9d8?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.25,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1102","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Es hoy!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1103","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"14:00","titulo":"Bienvenida","descripcion":"Llegada de invitados","icono":"Users"},{"hora":"15:00","titulo":"Actividades","descripcion":"Juegos y diversion","icono":"Gamepad2"},{"hora":"16:30","titulo":"Comida","descripcion":"Banquete","icono":"UtensilsCrossed"},{"hora":"17:30","titulo":"Pastel y Cancion","descripcion":"¡Feliz cumpleanos!","icono":"Cake"},{"hora":"18:00","titulo":"¡Fiesta!","descripcion":"Musica y baile","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1104","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1105","tipo":"galeria","orden":4,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1714630011903-77155c14028e?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1626980714826-ad7bf460a027?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1733938797036-d0ef83394294?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1761296152332-88ada22be48a?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-1106","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}}]',
    false,
    12
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- CORPORATIVO: Corporativo Premium
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'corp-corporativo-premium',
    'Corporativo Premium',
    'corporativo',
    'elegante',
    'formal',
    'Invitacion corporativa profesional en azul. Ideal para conferencias, seminarios y eventos empresariales.',
    '{"color_primario":"#1E40AF","color_secundario":"#3B82F6","color_fondo":"#EFF6FF","color_texto":"#1E3A5F","color_texto_claro":"#60A5FA","fuente_titulo":"Montserrat","fuente_cuerpo":"Inter","patron_fondo":"none","patron_opacidad":0,"decoracion_esquinas":"none","icono_principal":"none","animacion_entrada":"fade","efecto_titulo":"none","marco_fotos":"rounded","stickers":[]}',
    '[{"id":"tpl-1201","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Conferencia Anual","subtitulo":"Innovacion y Tecnologia 2026","imagen_url":"https://images.unsplash.com/photo-1764726354430-1b85fa37234f?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.45,"tipo_overlay":"uniforme","color_overlay":"#1E3A5F","mostrar_calendario":false,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1202","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Inicia en","texto_finalizado":"¡El evento ha comenzado!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1203","tipo":"texto","orden":2,"visible":true,"contenido":{"contenido":"Lo invitamos a participar en nuestra conferencia anual donde exploraremos las ultimas tendencias en tecnologia e innovacion.","alineacion":"center","tamano_fuente":"normal"},"estilos":{}},{"id":"tpl-1204","tipo":"timeline","orden":3,"visible":true,"contenido":{"titulo_seccion":"Agenda","subtitulo_seccion":"","items":[{"hora":"09:00","titulo":"Registro","descripcion":"Acreditacion de asistentes","icono":"ClipboardCheck"},{"hora":"09:30","titulo":"Conferencia Principal","descripcion":"Auditorio","icono":"Presentation"},{"hora":"11:00","titulo":"Coffee Break","descripcion":"Networking","icono":"Coffee"},{"hora":"11:30","titulo":"Paneles","descripcion":"Sesiones tematicas","icono":"Users"},{"hora":"13:30","titulo":"Cierre y Networking","descripcion":"Comida","icono":"Handshake"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1205","tipo":"ubicacion","orden":4,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1206","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Registro","subtitulo":"Confirme su asistencia","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}}]',
    false,
    13
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- CORPORATIVO: Tech Summit
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'corp-tech-summit',
    'Tech Summit',
    'corporativo',
    'moderno',
    'tech',
    'Invitacion moderna para eventos de tecnologia. Diseno limpio con acentos verdes para summits y hackathons.',
    '{"color_primario":"#059669","color_secundario":"#F0FDF4","color_fondo":"#FFFFFF","color_texto":"#111827","color_texto_claro":"#6B7280","fuente_titulo":"Inter","fuente_cuerpo":"Montserrat","patron_fondo":"geometric","patron_opacidad":0.05,"decoracion_esquinas":"none","icono_principal":"none","animacion_entrada":"slide","efecto_titulo":"none","marco_fotos":"rounded","stickers":[]}',
    '[{"id":"tpl-1301","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Tech Summit 2026","subtitulo":"El futuro es ahora","imagen_url":"https://images.unsplash.com/photo-1560523159-94c9d18bcf27?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.4,"tipo_overlay":"uniforme","color_overlay":"#064E3B","mostrar_calendario":false,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1302","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Comienza en","texto_finalizado":"¡Bienvenidos!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1303","tipo":"texto","orden":2,"visible":true,"contenido":{"contenido":"Un dia completo de charlas, talleres y networking con los lideres de la industria tecnologica.","alineacion":"center","tamano_fuente":"normal"},"estilos":{}},{"id":"tpl-1304","tipo":"timeline","orden":3,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"09:00","titulo":"Registro","descripcion":"Acreditacion de asistentes","icono":"ClipboardCheck"},{"hora":"09:30","titulo":"Conferencia Principal","descripcion":"Auditorio","icono":"Presentation"},{"hora":"11:00","titulo":"Coffee Break","descripcion":"Networking","icono":"Coffee"},{"hora":"11:30","titulo":"Paneles","descripcion":"Sesiones tematicas","icono":"Users"},{"hora":"13:30","titulo":"Cierre y Networking","descripcion":"Comida","icono":"Handshake"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1305","tipo":"ubicacion","orden":4,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1306","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Registrarse","subtitulo":"Cupo limitado","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}}]',
    false,
    14
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- CORPORATIVO: Gala Ejecutiva
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'corp-gala-ejecutiva',
    'Gala Ejecutiva',
    'corporativo',
    'elegante',
    'premium',
    'Invitacion premium para galas y cenas ejecutivas. Negro y dorado para eventos de alto nivel.',
    '{"color_primario":"#1F2937","color_secundario":"#D4AF37","color_fondo":"#111827","color_texto":"#F9FAFB","color_texto_claro":"#D1D5DB","fuente_titulo":"Playfair Display","fuente_cuerpo":"Montserrat","patron_fondo":"none","patron_opacidad":0,"decoracion_esquinas":"none","icono_principal":"none","animacion_entrada":"fade","efecto_titulo":"gradient","marco_fotos":"rounded","stickers":["✨"]}',
    '[{"id":"tpl-1401","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Gala Anual 2026","subtitulo":"Cena de Premiacion","imagen_url":"https://images.unsplash.com/photo-1768508950637-7ecb769e686c?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.5,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":false,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1402","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Inicia en","texto_finalizado":"¡Bienvenidos a la gala!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1403","tipo":"texto","orden":2,"visible":true,"contenido":{"contenido":"Es un honor invitarle a nuestra gala anual de premiacion, donde reconoceremos la excelencia y el liderazgo.","alineacion":"center","tamano_fuente":"normal"},"estilos":{}},{"id":"tpl-1404","tipo":"timeline","orden":3,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"09:00","titulo":"Registro","descripcion":"Acreditacion de asistentes","icono":"ClipboardCheck"},{"hora":"09:30","titulo":"Conferencia Principal","descripcion":"Auditorio","icono":"Presentation"},{"hora":"11:00","titulo":"Coffee Break","descripcion":"Networking","icono":"Coffee"},{"hora":"11:30","titulo":"Paneles","descripcion":"Sesiones tematicas","icono":"Users"},{"hora":"13:30","titulo":"Cierre y Networking","descripcion":"Comida","icono":"Handshake"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1405","tipo":"ubicacion","orden":4,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1406","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Confirmar Asistencia","subtitulo":"Codigo de vestimenta: Formal","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}}]',
    false,
    15
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- UNIVERSAL: Celebra con Estilo
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'universal-celebra-estilo',
    'Celebra con Estilo',
    'universal',
    'moderno',
    'festivo',
    'Invitacion versatil y festiva para cualquier tipo de celebracion. Colores vibrantes y diseno alegre.',
    '{"color_primario":"#7C3AED","color_secundario":"#EC4899","color_fondo":"#FAF5FF","color_texto":"#1F2937","color_texto_claro":"#9CA3AF","fuente_titulo":"Poppins","fuente_cuerpo":"Nunito","patron_fondo":"confetti","patron_opacidad":0.1,"decoracion_esquinas":"estrellas","icono_principal":"star","animacion_entrada":"bounce","efecto_titulo":"sparkle","marco_fotos":"rounded","stickers":["🎉","⭐","🎊","✨"]}',
    '[{"id":"tpl-1501","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"¡Celebremos!","subtitulo":"Estas invitado","imagen_url":"https://images.unsplash.com/photo-1526653054275-5a4f37ea1c64?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.3,"tipo_overlay":"uniforme","color_overlay":"#4C1D95","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1502","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1503","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"16:00","titulo":"Bienvenida","descripcion":"Llegada de invitados","icono":"Users"},{"hora":"17:00","titulo":"Programa Principal","descripcion":"Evento central","icono":"Star"},{"hora":"18:30","titulo":"Cena","descripcion":"Banquete","icono":"UtensilsCrossed"},{"hora":"20:00","titulo":"Celebracion","descripcion":"Musica y diversion","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1504","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1505","tipo":"galeria","orden":4,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1731596153022-4cedafe3330a?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1731596153338-dd52df3e63c1?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1731596153373-7b13275e79cb?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1731596152912-249a2511f966?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-1506","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-1507","tipo":"felicitaciones","orden":6,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    16
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- UNIVERSAL: Natural Elegance
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'universal-natural-elegance',
    'Natural Elegance',
    'universal',
    'elegante',
    'botanico',
    'Elegancia natural con tonos verdes y crema. Versatil para bodas, bautizos y cualquier celebracion al aire libre.',
    '{"color_primario":"#059669","color_secundario":"#FEF3C7","color_fondo":"#ECFDF5","color_texto":"#064E3B","color_texto_claro":"#6EE7B7","fuente_titulo":"Cormorant Garamond","fuente_cuerpo":"Lora","patron_fondo":"none","patron_opacidad":0,"decoracion_esquinas":"hojas","icono_principal":"heart","animacion_entrada":"fade","efecto_titulo":"none","marco_fotos":"vintage","stickers":["🌿","🍃","✨"]}',
    '[{"id":"tpl-1601","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Te Invitamos","subtitulo":"A nuestra celebracion","imagen_url":"https://images.unsplash.com/photo-1769668812792-aa45d1369934?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.3,"tipo_overlay":"uniforme","color_overlay":"#064E3B","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1602","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1603","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"16:00","titulo":"Bienvenida","descripcion":"Llegada de invitados","icono":"Users"},{"hora":"17:00","titulo":"Programa Principal","descripcion":"Evento central","icono":"Star"},{"hora":"18:30","titulo":"Cena","descripcion":"Banquete","icono":"UtensilsCrossed"},{"hora":"20:00","titulo":"Celebracion","descripcion":"Musica y diversion","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1604","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1605","tipo":"galeria","orden":4,"visible":true,"contenido":{"titulo_seccion":"Galeria","subtitulo_seccion":"","usar_galeria_evento":false,"imagenes":[{"url":"https://images.unsplash.com/photo-1770274763617-d4544ec7acb4?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1770274764010-d6fd47a18aba?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1759927328816-f74d0635b626?w=1080&q=80&fit=crop&fm=jpg","alt":""},{"url":"https://images.unsplash.com/photo-1765122982483-d3fe4008311d?w=1080&q=80&fit=crop&fm=jpg","alt":""}],"layout":"grid","columnas":2},"estilos":{}},{"id":"tpl-1606","tipo":"rsvp","orden":5,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}},{"id":"tpl-1607","tipo":"felicitaciones","orden":6,"visible":true,"contenido":{"titulo":"Libro de Firmas","subtitulo":"Dejanos tus buenos deseos","placeholder_mensaje":"Escribe tus buenos deseos...","texto_agradecimiento":"¡Gracias por tus palabras!"},"estilos":{}}]',
    false,
    17
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

-- UNIVERSAL: Simple & Chic
INSERT INTO plantillas_evento (
    codigo, nombre, tipo_evento, categoria, subcategoria, descripcion,
    tema, bloques_plantilla, es_premium, orden
) VALUES (
    'universal-simple-chic',
    'Simple & Chic',
    'universal',
    'moderno',
    'clean',
    'Diseno minimalista y chic para cualquier evento. Limpio, moderno y elegante en su simplicidad.',
    '{"color_primario":"#6B7280","color_secundario":"#F9FAFB","color_fondo":"#FFFFFF","color_texto":"#111827","color_texto_claro":"#9CA3AF","fuente_titulo":"Inter","fuente_cuerpo":"Montserrat","patron_fondo":"none","patron_opacidad":0,"decoracion_esquinas":"none","icono_principal":"none","animacion_entrada":"slide","efecto_titulo":"none","marco_fotos":"rounded","stickers":[]}',
    '[{"id":"tpl-1701","tipo":"hero_invitacion","orden":0,"visible":true,"contenido":{"titulo":"Estas Invitado","subtitulo":"Acompananos","imagen_url":"https://images.unsplash.com/photo-1705955477311-61da0131005b?w=1080&q=80&fit=crop&fm=jpg","imagen_overlay":0.3,"tipo_overlay":"uniforme","color_overlay":"#000000","mostrar_calendario":true,"mostrar_fecha":true,"altura":"full","alineacion":"center"},"estilos":{}},{"id":"tpl-1702","tipo":"countdown","orden":1,"visible":true,"contenido":{"titulo":"Faltan","texto_finalizado":"¡Llego el gran dia!","estilo":"cajas","mostrar_segundos":false},"estilos":{}},{"id":"tpl-1703","tipo":"timeline","orden":2,"visible":true,"contenido":{"titulo_seccion":"Programa","subtitulo_seccion":"","items":[{"hora":"16:00","titulo":"Bienvenida","descripcion":"Llegada de invitados","icono":"Users"},{"hora":"17:00","titulo":"Programa Principal","descripcion":"Evento central","icono":"Star"},{"hora":"18:30","titulo":"Cena","descripcion":"Banquete","icono":"UtensilsCrossed"},{"hora":"20:00","titulo":"Celebracion","descripcion":"Musica y diversion","icono":"PartyPopper"}],"layout":"alternado","color_linea":""},"estilos":{}},{"id":"tpl-1704","tipo":"ubicacion","orden":3,"visible":true,"contenido":{"titulo":"Ubicacion","subtitulo":"","mostrar_todas":true,"mostrar_mapa":true,"altura_mapa":300},"estilos":{}},{"id":"tpl-1705","tipo":"rsvp","orden":4,"visible":true,"contenido":{"titulo":"Confirma tu Asistencia","subtitulo":"¡Esperamos contar contigo!","texto_confirmado":"¡Gracias por confirmar!","texto_rechazado":"Lamentamos que no puedas asistir","pedir_restricciones":false},"estilos":{}}]',
    false,
    18
) ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tema = EXCLUDED.tema,
    bloques_plantilla = EXCLUDED.bloques_plantilla,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    orden = EXCLUDED.orden;

