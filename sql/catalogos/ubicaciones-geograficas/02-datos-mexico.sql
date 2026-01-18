-- ====================================================================
-- MÓDULO CATÁLOGOS: DATOS SEMILLA - UBICACIONES DE MÉXICO
-- ====================================================================
-- Datos iniciales para catálogos de ubicaciones geográficas.
-- Incluye: 1 país (México), 32 estados, ciudades principales.
--
-- Fuente: INEGI (Instituto Nacional de Estadística y Geografía)
-- Fecha creación: 24 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- 1. PAÍS: MÉXICO
-- ====================================================================

INSERT INTO paises (codigo, codigo_alfa2, nombre, nombre_oficial, codigo_telefonico, moneda_codigo, zona_horaria_default, es_default)
VALUES ('MEX', 'MX', 'México', 'Estados Unidos Mexicanos', '+52', 'MXN', 'America/Mexico_City', true);

-- ====================================================================
-- 2. ESTADOS DE MÉXICO (32 Entidades Federativas)
-- ====================================================================
-- Ordenados por clave INEGI (código oficial)

INSERT INTO estados (pais_id, codigo, abreviatura, nombre, nombre_corto, zona_horaria, orden_display)
SELECT
    (SELECT id FROM paises WHERE codigo = 'MEX'),
    e.codigo,
    e.abreviatura,
    e.nombre,
    e.nombre_corto,
    e.zona_horaria,
    e.orden_display
FROM (VALUES
    ('01', 'AGS',   'Aguascalientes',                           'Aguascalientes',   'America/Mexico_City',      1),
    ('02', 'BC',    'Baja California',                          'Baja California',  'America/Tijuana',          2),
    ('03', 'BCS',   'Baja California Sur',                      'Baja California Sur', 'America/Mazatlan',      3),
    ('04', 'CAMP',  'Campeche',                                 'Campeche',         'America/Merida',           4),
    ('05', 'COAH',  'Coahuila de Zaragoza',                     'Coahuila',         'America/Monterrey',        5),
    ('06', 'COL',   'Colima',                                   'Colima',           'America/Mexico_City',      6),
    ('07', 'CHIS',  'Chiapas',                                  'Chiapas',          'America/Mexico_City',      7),
    ('08', 'CHIH',  'Chihuahua',                                'Chihuahua',        'America/Chihuahua',        8),
    ('09', 'CDMX',  'Ciudad de México',                         'CDMX',             'America/Mexico_City',      9),
    ('10', 'DGO',   'Durango',                                  'Durango',          'America/Monterrey',        10),
    ('11', 'GTO',   'Guanajuato',                               'Guanajuato',       'America/Mexico_City',      11),
    ('12', 'GRO',   'Guerrero',                                 'Guerrero',         'America/Mexico_City',      12),
    ('13', 'HGO',   'Hidalgo',                                  'Hidalgo',          'America/Mexico_City',      13),
    ('14', 'JAL',   'Jalisco',                                  'Jalisco',          'America/Mexico_City',      14),
    ('15', 'MEX',   'Estado de México',                         'Edomex',           'America/Mexico_City',      15),
    ('16', 'MICH',  'Michoacán de Ocampo',                      'Michoacán',        'America/Mexico_City',      16),
    ('17', 'MOR',   'Morelos',                                  'Morelos',          'America/Mexico_City',      17),
    ('18', 'NAY',   'Nayarit',                                  'Nayarit',          'America/Mazatlan',         18),
    ('19', 'NL',    'Nuevo León',                               'Nuevo León',       'America/Monterrey',        19),
    ('20', 'OAX',   'Oaxaca',                                   'Oaxaca',           'America/Mexico_City',      20),
    ('21', 'PUE',   'Puebla',                                   'Puebla',           'America/Mexico_City',      21),
    ('22', 'QRO',   'Querétaro',                                'Querétaro',        'America/Mexico_City',      22),
    ('23', 'QROO',  'Quintana Roo',                             'Quintana Roo',     'America/Cancun',           23),
    ('24', 'SLP',   'San Luis Potosí',                          'San Luis Potosí',  'America/Mexico_City',      24),
    ('25', 'SIN',   'Sinaloa',                                  'Sinaloa',          'America/Mazatlan',         25),
    ('26', 'SON',   'Sonora',                                   'Sonora',           'America/Hermosillo',       26),
    ('27', 'TAB',   'Tabasco',                                  'Tabasco',          'America/Mexico_City',      27),
    ('28', 'TAMPS', 'Tamaulipas',                               'Tamaulipas',       'America/Monterrey',        28),
    ('29', 'TLAX',  'Tlaxcala',                                 'Tlaxcala',         'America/Mexico_City',      29),
    ('30', 'VER',   'Veracruz de Ignacio de la Llave',          'Veracruz',         'America/Mexico_City',      30),
    ('31', 'YUC',   'Yucatán',                                  'Yucatán',          'America/Merida',           31),
    ('32', 'ZAC',   'Zacatecas',                                'Zacatecas',        'America/Mexico_City',      32)
) AS e(codigo, abreviatura, nombre, nombre_corto, zona_horaria, orden_display);

-- ====================================================================
-- 3. CIUDADES PRINCIPALES (Capitales + Ciudades Importantes)
-- ====================================================================
-- Incluye capitales de estado y ciudades con alta población/actividad económica

-- Función auxiliar para insertar ciudades por estado
DO $$
DECLARE
    v_estado_id INTEGER;
BEGIN
    -- AGUASCALIENTES (01)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '01';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Aguascalientes', true, true, 863893);

    -- BAJA CALIFORNIA (02)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '02';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Mexicali', true, true, 1049792),
        (v_estado_id, 'Tijuana', false, true, 1922523),
        (v_estado_id, 'Ensenada', false, true, 519813),
        (v_estado_id, 'Rosarito', false, false, 108435);

    -- BAJA CALIFORNIA SUR (03)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '03';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'La Paz', true, true, 290286),
        (v_estado_id, 'Los Cabos', false, true, 351111);

    -- CAMPECHE (04)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '04';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Campeche', true, true, 294077),
        (v_estado_id, 'Ciudad del Carmen', false, true, 235263);

    -- COAHUILA (05)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '05';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Saltillo', true, true, 823128),
        (v_estado_id, 'Torreón', false, true, 720648),
        (v_estado_id, 'Monclova', false, true, 237219);

    -- COLIMA (06)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '06';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Colima', true, true, 150673),
        (v_estado_id, 'Manzanillo', false, true, 184541);

    -- CHIAPAS (07)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '07';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Tuxtla Gutiérrez', true, true, 604147),
        (v_estado_id, 'San Cristóbal de las Casas', false, true, 215874),
        (v_estado_id, 'Tapachula', false, true, 353706);

    -- CHIHUAHUA (08)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '08';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Chihuahua', true, true, 925762),
        (v_estado_id, 'Ciudad Juárez', false, true, 1512450);

    -- CIUDAD DE MÉXICO (09)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '09';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Ciudad de México', true, true, 9209944),
        (v_estado_id, 'Coyoacán', false, true, 614447),
        (v_estado_id, 'Gustavo A. Madero', false, true, 1164477),
        (v_estado_id, 'Iztapalapa', false, true, 1835486),
        (v_estado_id, 'Tlalpan', false, true, 699928);

    -- DURANGO (10)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '10';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Durango', true, true, 654876),
        (v_estado_id, 'Gómez Palacio', false, true, 367108);

    -- GUANAJUATO (11)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '11';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Guanajuato', true, true, 193451),
        (v_estado_id, 'León', false, true, 1579803),
        (v_estado_id, 'Irapuato', false, true, 574344),
        (v_estado_id, 'Celaya', false, true, 521169),
        (v_estado_id, 'Salamanca', false, false, 273271);

    -- GUERRERO (12)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '12';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Chilpancingo', true, true, 283354),
        (v_estado_id, 'Acapulco', false, true, 779566);

    -- HIDALGO (13)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '13';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Pachuca', true, true, 314331),
        (v_estado_id, 'Tulancingo', false, false, 161069);

    -- JALISCO (14)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '14';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Guadalajara', true, true, 1385629),
        (v_estado_id, 'Zapopan', false, true, 1476491),
        (v_estado_id, 'Tlaquepaque', false, true, 687127),
        (v_estado_id, 'Tonalá', false, true, 569913),
        (v_estado_id, 'Puerto Vallarta', false, true, 291839);

    -- ESTADO DE MÉXICO (15)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '15';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Toluca', true, true, 910608),
        (v_estado_id, 'Ecatepec', false, true, 1645352),
        (v_estado_id, 'Nezahualcóyotl', false, true, 1077208),
        (v_estado_id, 'Naucalpan', false, true, 844219),
        (v_estado_id, 'Tlalnepantla', false, true, 672202);

    -- MICHOACÁN (16)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '16';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Morelia', true, true, 849053),
        (v_estado_id, 'Uruapan', false, true, 334749),
        (v_estado_id, 'Zamora', false, false, 196208);

    -- MORELOS (17)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '17';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Cuernavaca', true, true, 378476),
        (v_estado_id, 'Jiutepec', false, false, 214137);

    -- NAYARIT (18)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '18';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Tepic', true, true, 424661),
        (v_estado_id, 'Bahía de Banderas', false, true, 187869);

    -- NUEVO LEÓN (19)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '19';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Monterrey', true, true, 1142994),
        (v_estado_id, 'Guadalupe', false, true, 682880),
        (v_estado_id, 'San Nicolás de los Garza', false, true, 430143),
        (v_estado_id, 'Apodaca', false, true, 597207),
        (v_estado_id, 'San Pedro Garza García', false, true, 122659);

    -- OAXACA (20)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '20';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Oaxaca de Juárez', true, true, 270955),
        (v_estado_id, 'Salina Cruz', false, false, 86626);

    -- PUEBLA (21)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '21';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Puebla', true, true, 1692181),
        (v_estado_id, 'Tehuacán', false, true, 319375),
        (v_estado_id, 'San Martín Texmelucan', false, false, 152051);

    -- QUERÉTARO (22)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '22';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Querétaro', true, true, 1049777),
        (v_estado_id, 'San Juan del Río', false, true, 287875);

    -- QUINTANA ROO (23)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '23';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Chetumal', true, true, 224080),
        (v_estado_id, 'Cancún', false, true, 888797),
        (v_estado_id, 'Playa del Carmen', false, true, 333800);

    -- SAN LUIS POTOSÍ (24)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '24';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'San Luis Potosí', true, true, 911908),
        (v_estado_id, 'Soledad de Graciano Sánchez', false, true, 342782);

    -- SINALOA (25)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '25';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Culiacán', true, true, 905265),
        (v_estado_id, 'Mazatlán', false, true, 502547),
        (v_estado_id, 'Los Mochis', false, true, 416299);

    -- SONORA (26)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '26';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Hermosillo', true, true, 936263),
        (v_estado_id, 'Ciudad Obregón', false, true, 409310),
        (v_estado_id, 'Nogales', false, true, 264782);

    -- TABASCO (27)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '27';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Villahermosa', true, true, 684113);

    -- TAMAULIPAS (28)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '28';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Ciudad Victoria', true, true, 361078),
        (v_estado_id, 'Reynosa', false, true, 704767),
        (v_estado_id, 'Matamoros', false, true, 520367),
        (v_estado_id, 'Nuevo Laredo', false, true, 425058),
        (v_estado_id, 'Tampico', false, true, 314418);

    -- TLAXCALA (29)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '29';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Tlaxcala', true, true, 103435),
        (v_estado_id, 'Apizaco', false, false, 81565);

    -- VERACRUZ (30)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '30';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Xalapa', true, true, 513443),
        (v_estado_id, 'Veracruz', false, true, 607209),
        (v_estado_id, 'Coatzacoalcos', false, true, 319187),
        (v_estado_id, 'Córdoba', false, true, 218153),
        (v_estado_id, 'Poza Rica', false, true, 200119);

    -- YUCATÁN (31)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '31';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Mérida', true, true, 995129),
        (v_estado_id, 'Valladolid', false, false, 80313);

    -- ZACATECAS (32)
    SELECT id INTO v_estado_id FROM estados WHERE codigo = '32';
    INSERT INTO ciudades (estado_id, nombre, es_capital, es_principal, poblacion) VALUES
        (v_estado_id, 'Zacatecas', true, true, 153461),
        (v_estado_id, 'Fresnillo', false, true, 230865);

END $$;

-- ====================================================================
-- 4. VERIFICACIÓN DE DATOS
-- ====================================================================

DO $$
DECLARE
    v_paises INTEGER;
    v_estados INTEGER;
    v_ciudades INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_paises FROM paises;
    SELECT COUNT(*) INTO v_estados FROM estados;
    SELECT COUNT(*) INTO v_ciudades FROM ciudades;

    RAISE NOTICE '✅ Catálogos de ubicaciones cargados:';
    RAISE NOTICE '   - Países: %', v_paises;
    RAISE NOTICE '   - Estados: %', v_estados;
    RAISE NOTICE '   - Ciudades: %', v_ciudades;
END $$;
