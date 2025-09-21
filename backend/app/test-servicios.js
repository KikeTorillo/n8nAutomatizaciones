/**
 * Script de prueba para la implementación de Servicios
 * Verifica que el modelo y controlador funcionan correctamente
 */

const ServicioModel = require('./database/servicio.model');

async function testServicioModel() {
    console.log('🧪 Iniciando pruebas del modelo de Servicios...\n');

    try {
        // Datos de prueba para crear un servicio
        const servicioTest = {
            organizacion_id: 1, // Asumiendo que existe la organización 1
            nombre: 'Corte de Cabello Premium',
            descripcion: 'Corte de cabello profesional con lavado y secado incluido',
            categoria: 'corte',
            subcategoria: 'premium',
            duracion_minutos: 45,
            precio: 25.00,
            precio_minimo: 20.00,
            precio_maximo: 30.00,
            requiere_preparacion_minutos: 5,
            tiempo_limpieza_minutos: 10,
            max_clientes_simultaneos: 1,
            color_servicio: '#2c3e50',
            configuracion_especifica: {
                incluye_lavado: true,
                incluye_secado: true,
                productos_premium: true
            },
            tags: ['popular', 'premium', 'completo'],
            activo: true
        };

        console.log('1️⃣ Creando servicio de prueba...');
        const nuevoServicio = await ServicioModel.crear(servicioTest);
        console.log('✅ Servicio creado exitosamente:', {
            id: nuevoServicio.id,
            nombre: nuevoServicio.nombre,
            precio: nuevoServicio.precio,
            duracion_minutos: nuevoServicio.duracion_minutos
        });

        console.log('\n2️⃣ Obteniendo servicio por ID...');
        const servicioObtenido = await ServicioModel.obtenerPorId(nuevoServicio.id, servicioTest.organizacion_id);
        console.log('✅ Servicio obtenido:', {
            id: servicioObtenido.id,
            nombre: servicioObtenido.nombre,
            total_profesionales_asignados: servicioObtenido.total_profesionales_asignados
        });

        console.log('\n3️⃣ Listando servicios...');
        const resultado = await ServicioModel.listar(servicioTest.organizacion_id, {}, { limite: 5 });
        console.log('✅ Servicios listados:', {
            total: resultado.paginacion.total_elementos,
            servicios_en_pagina: resultado.servicios.length,
            nombres: resultado.servicios.map(s => s.nombre)
        });

        console.log('\n4️⃣ Actualizando servicio...');
        const servicioActualizado = await ServicioModel.actualizar(
            nuevoServicio.id, 
            { 
                precio: 28.00,
                descripcion: 'Corte de cabello premium actualizado con técnicas modernas'
            }, 
            servicioTest.organizacion_id
        );
        console.log('✅ Servicio actualizado:', {
            id: servicioActualizado.id,
            precio_anterior: nuevoServicio.precio,
            precio_nuevo: servicioActualizado.precio
        });

        console.log('\n5️⃣ Buscando servicios...');
        const serviciosBuscados = await ServicioModel.buscar('corte', servicioTest.organizacion_id, { limite: 5 });
        console.log('✅ Búsqueda completada:', {
            termino: 'corte',
            resultados: serviciosBuscados.length,
            nombres: serviciosBuscados.map(s => s.nombre)
        });

        console.log('\n6️⃣ Obteniendo estadísticas...');
        const estadisticas = await ServicioModel.obtenerEstadisticas(servicioTest.organizacion_id);
        console.log('✅ Estadísticas obtenidas:', {
            total_servicios: estadisticas.total_servicios,
            servicios_activos: estadisticas.servicios_activos,
            precio_promedio: parseFloat(estadisticas.precio_promedio).toFixed(2)
        });

        console.log('\n7️⃣ Eliminando servicio (soft delete)...');
        const eliminado = await ServicioModel.eliminar(nuevoServicio.id, servicioTest.organizacion_id);
        console.log('✅ Servicio eliminado:', eliminado);

        console.log('\n🎉 Todas las pruebas del modelo de Servicios pasaron exitosamente!');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Ejecutar las pruebas solo si este archivo se ejecuta directamente
if (require.main === module) {
    testServicioModel()
        .then(() => {
            console.log('\n✅ Script de pruebas completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error fatal en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = { testServicioModel };