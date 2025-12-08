import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  XCircle,
  Package,
  DollarSign,
  Filter,
  Search,
  Calendar,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import {
  useOrdenesCompra,
  useEliminarOrdenCompra,
  useEnviarOrdenCompra,
  useCancelarOrdenCompra,
} from '@/hooks/useOrdenesCompra';
import { useProveedores } from '@/hooks/useProveedores';
import OrdenCompraFormModal from '@/components/inventario/ordenes-compra/OrdenCompraFormModal';
import OrdenCompraDetalleModal from '@/components/inventario/ordenes-compra/OrdenCompraDetalleModal';
import RecibirMercanciaModal from '@/components/inventario/ordenes-compra/RecibirMercanciaModal';
import RegistrarPagoModal from '@/components/inventario/ordenes-compra/RegistrarPagoModal';

/**
 * Página principal de Órdenes de Compra
 * Gestión completa del ciclo de compras a proveedores
 */
export default function OrdenesCompraPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    proveedor_id: '',
    estado: '',
    estado_pago: '',
    fecha_desde: '',
    fecha_hasta: '',
    folio: '',
    limit: 50,
    offset: 0,
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estado de modales
  const [modalForm, setModalForm] = useState({ isOpen: false, orden: null, mode: 'create' });
  const [modalDetalle, setModalDetalle] = useState({ isOpen: false, ordenId: null });
  const [modalRecibir, setModalRecibir] = useState({ isOpen: false, orden: null });
  const [modalPago, setModalPago] = useState({ isOpen: false, orden: null });
  const [modalEliminar, setModalEliminar] = useState({ isOpen: false, orden: null });
  const [modalCancelar, setModalCancelar] = useState({ isOpen: false, orden: null });
  const [modalEnviar, setModalEnviar] = useState({ isOpen: false, orden: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Queries
  const { data: ordenesData, isLoading } = useOrdenesCompra(filtros);
  const ordenes = ordenesData?.ordenes || [];
  const totales = ordenesData?.totales || {};
  const total = totales.cantidad || 0;

  const { data: proveedoresData } = useProveedores({ activo: true, limit: 100 });
  const proveedores = proveedoresData?.proveedores || [];

  // Mutations
  const eliminarMutation = useEliminarOrdenCompra();
  const enviarMutation = useEnviarOrdenCompra();
  const cancelarMutation = useCancelarOrdenCompra();

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor, offset: 0 }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      proveedor_id: '',
      estado: '',
      estado_pago: '',
      fecha_desde: '',
      fecha_hasta: '',
      folio: '',
      limit: 50,
      offset: 0,
    });
  };

  // Handlers de acciones
  const handleNuevaOrden = () => {
    setModalForm({ isOpen: true, orden: null, mode: 'create' });
  };

  const handleEditar = (orden) => {
    if (orden.estado !== 'borrador') {
      showWarning('Solo se pueden editar órdenes en estado borrador');
      return;
    }
    setModalForm({ isOpen: true, orden, mode: 'edit' });
  };

  const handleVerDetalle = (ordenId) => {
    setModalDetalle({ isOpen: true, ordenId });
  };

  const handleAbrirModalEliminar = (orden) => {
    if (orden.estado !== 'borrador') {
      showWarning('Solo se pueden eliminar órdenes en estado borrador');
      return;
    }
    setModalEliminar({ isOpen: true, orden });
  };

  const handleEliminar = () => {
    eliminarMutation.mutate(modalEliminar.orden.id, {
      onSuccess: () => {
        showSuccess('Orden de compra eliminada correctamente');
        setModalEliminar({ isOpen: false, orden: null });
      },
      onError: (error) => {
        showError(error.response?.data?.mensaje || 'Error al eliminar la orden');
      },
    });
  };

  const handleAbrirModalEnviar = (orden) => {
    if (orden.estado !== 'borrador') {
      showWarning('Solo se pueden enviar órdenes en estado borrador');
      return;
    }
    if (!orden.items_count || orden.items_count === 0) {
      showWarning('La orden debe tener al menos un item para enviar');
      return;
    }
    setModalEnviar({ isOpen: true, orden });
  };

  const handleEnviar = () => {
    enviarMutation.mutate(modalEnviar.orden.id, {
      onSuccess: () => {
        showSuccess('Orden enviada al proveedor correctamente');
        setModalEnviar({ isOpen: false, orden: null });
      },
      onError: (error) => {
        showError(error.response?.data?.mensaje || 'Error al enviar la orden');
      },
    });
  };

  const handleAbrirModalCancelar = (orden) => {
    if (!['borrador', 'enviada', 'parcial'].includes(orden.estado)) {
      showWarning('Esta orden no puede ser cancelada');
      return;
    }
    setMotivoCancelacion('');
    setModalCancelar({ isOpen: true, orden });
  };

  const handleCancelar = () => {
    cancelarMutation.mutate(
      { id: modalCancelar.orden.id, motivo: motivoCancelacion || undefined },
      {
        onSuccess: () => {
          showSuccess('Orden cancelada correctamente');
          setModalCancelar({ isOpen: false, orden: null });
          setMotivoCancelacion('');
        },
        onError: (error) => {
          showError(error.response?.data?.mensaje || 'Error al cancelar la orden');
        },
      }
    );
  };

  const handleRecibirMercancia = (orden) => {
    if (!['enviada', 'parcial'].includes(orden.estado)) {
      showWarning('Solo se puede recibir mercancía de órdenes enviadas o parciales');
      return;
    }
    setModalRecibir({ isOpen: true, orden });
  };

  const handleRegistrarPago = (orden) => {
    if (orden.estado_pago === 'pagado') {
      showInfo('Esta orden ya está completamente pagada');
      return;
    }
    if (orden.estado === 'cancelada' || orden.estado === 'borrador') {
      showWarning('No se pueden registrar pagos en órdenes canceladas o en borrador');
      return;
    }
    setModalPago({ isOpen: true, orden });
  };

  // Helpers de visualización
  const getBadgeEstado = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      parcial: 'bg-yellow-100 text-yellow-800',
      recibida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getBadgeEstadoPago = (estadoPago) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      parcial: 'bg-orange-100 text-orange-800',
      pagado: 'bg-green-100 text-green-800',
    };
    return badges[estadoPago] || 'bg-gray-100 text-gray-800';
  };

  const formatearEstado = (estado) => {
    const estados = {
      borrador: 'Borrador',
      enviada: 'Enviada',
      parcial: 'Parcial',
      recibida: 'Recibida',
      cancelada: 'Cancelada',
    };
    return estados[estado] || estado;
  };

  const formatearEstadoPago = (estado) => {
    const estados = {
      pendiente: 'Pendiente',
      parcial: 'Parcial',
      pagado: 'Pagado',
    };
    return estados[estado] || estado;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>

        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header de sección */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Órdenes de Compra</h2>
              <p className="text-sm text-gray-500 hidden sm:block">
                Gestiona las órdenes de compra a proveedores
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={mostrarFiltros ? 'secondary' : 'outline'}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              icon={Filter}
              className="flex-1 sm:flex-none text-sm"
            >
              <span className="hidden sm:inline">{mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros</span>
              <span className="sm:hidden">Filtros</span>
            </Button>
            <Button variant="primary" onClick={handleNuevaOrden} icon={Plus} className="flex-1 sm:flex-none text-sm">
              <span className="hidden sm:inline">Nueva Orden</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
      </div>

      {/* Resumen de totales */}
      {totales && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500">Total Órdenes</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{totales.cantidad || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500">Valor Total</div>
            <div className="text-lg sm:text-2xl font-bold text-indigo-600">
              ${parseFloat(totales.valor_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500">Total Pagado</div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              ${parseFloat(totales.total_pagado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-500 truncate">Pendiente de Pago</div>
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              ${parseFloat(totales.pendiente_pago || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda por folio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por folio
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filtros.folio}
                  onChange={(e) => handleFiltroChange('folio', e.target.value)}
                  placeholder="OC-2025-0001"
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                value={filtros.proveedor_id}
                onChange={(e) => handleFiltroChange('proveedor_id', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="parcial">Parcial</option>
                <option value="recibida">Recibida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* Estado de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Pago
              </label>
              <select
                value={filtros.estado_pago}
                onChange={(e) => handleFiltroChange('estado_pago', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleLimpiarFiltros}>
              Limpiar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            Cargando órdenes de compra...
          </div>
        ) : ordenes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No se encontraron órdenes de compra</p>
            <p className="text-sm mt-1">Crea una nueva orden para comenzar</p>
            <div className="mt-4">
              <Button variant="primary" onClick={handleNuevaOrden} icon={Plus}>
                Nueva Orden
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordenes.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-indigo-600">{orden.folio}</div>
                        {orden.referencia_proveedor && (
                          <div className="text-xs text-gray-400">Ref: {orden.referencia_proveedor}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(orden.fecha_orden).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {orden.fecha_entrega_esperada && (
                          <div className="text-xs text-gray-400">
                            Entrega: {new Date(orden.fecha_entrega_esperada).toLocaleDateString('es-MX')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <div className="text-sm text-gray-900">{orden.proveedor_nombre}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{orden.items_count || 0} productos</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${parseFloat(orden.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        {parseFloat(orden.monto_pagado || 0) > 0 && (
                          <div className="text-xs text-green-600">
                            Pagado: ${parseFloat(orden.monto_pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeEstado(
                            orden.estado
                          )}`}
                        >
                          {formatearEstado(orden.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeEstadoPago(
                            orden.estado_pago
                          )}`}
                        >
                          {formatearEstadoPago(orden.estado_pago)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-1">
                          {/* Ver detalle */}
                          <button
                            onClick={() => handleVerDetalle(orden.id)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Editar (solo borrador) */}
                          {orden.estado === 'borrador' && (
                            <button
                              onClick={() => handleEditar(orden)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}

                          {/* Enviar (solo borrador con items) */}
                          {orden.estado === 'borrador' && (orden.items_count || 0) > 0 && (
                            <button
                              onClick={() => handleAbrirModalEnviar(orden)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                              title="Enviar al proveedor"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}

                          {/* Recibir mercancía (enviada o parcial) */}
                          {['enviada', 'parcial'].includes(orden.estado) && (
                            <button
                              onClick={() => handleRecibirMercancia(orden)}
                              className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                              title="Recibir mercancía"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                          )}

                          {/* Registrar pago (no cancelada, no borrador, no pagada) */}
                          {orden.estado !== 'cancelada' &&
                           orden.estado !== 'borrador' &&
                           orden.estado_pago !== 'pagado' && (
                            <button
                              onClick={() => handleRegistrarPago(orden)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded"
                              title="Registrar pago"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          )}

                          {/* Cancelar (borrador, enviada, parcial) */}
                          {['borrador', 'enviada', 'parcial'].includes(orden.estado) && (
                            <button
                              onClick={() => handleAbrirModalCancelar(orden)}
                              className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded"
                              title="Cancelar orden"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          {/* Eliminar (solo borrador) */}
                          {orden.estado === 'borrador' && (
                            <button
                              onClick={() => handleAbrirModalEliminar(orden)}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{ordenes.length}</span> de{' '}
                  <span className="font-medium">{total}</span> órdenes
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      {/* Modales */}
      <OrdenCompraFormModal
        isOpen={modalForm.isOpen}
        onClose={() => setModalForm({ isOpen: false, orden: null, mode: 'create' })}
        orden={modalForm.orden}
        mode={modalForm.mode}
      />

      <OrdenCompraDetalleModal
        isOpen={modalDetalle.isOpen}
        onClose={() => setModalDetalle({ isOpen: false, ordenId: null })}
        ordenId={modalDetalle.ordenId}
        onEditar={(orden) => {
          setModalDetalle({ isOpen: false, ordenId: null });
          handleEditar(orden);
        }}
        onEnviar={(orden) => {
          setModalDetalle({ isOpen: false, ordenId: null });
          handleAbrirModalEnviar(orden);
        }}
        onRecibir={(orden) => {
          setModalDetalle({ isOpen: false, ordenId: null });
          handleRecibirMercancia(orden);
        }}
        onPago={(orden) => {
          setModalDetalle({ isOpen: false, ordenId: null });
          handleRegistrarPago(orden);
        }}
      />

      <RecibirMercanciaModal
        isOpen={modalRecibir.isOpen}
        onClose={() => setModalRecibir({ isOpen: false, orden: null })}
        orden={modalRecibir.orden}
      />

      <RegistrarPagoModal
        isOpen={modalPago.isOpen}
        onClose={() => setModalPago({ isOpen: false, orden: null })}
        orden={modalPago.orden}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={modalEliminar.isOpen}
        onClose={() => setModalEliminar({ isOpen: false, orden: null })}
        title="Eliminar Orden de Compra"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la orden{' '}
            <strong className="text-gray-900">{modalEliminar.orden?.folio}</strong>?
          </p>
          <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setModalEliminar({ isOpen: false, orden: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleEliminar}
              isLoading={eliminarMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación de Envío */}
      <Modal
        isOpen={modalEnviar.isOpen}
        onClose={() => setModalEnviar({ isOpen: false, orden: null })}
        title="Enviar Orden al Proveedor"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Confirmas que deseas enviar la orden{' '}
            <strong className="text-gray-900">{modalEnviar.orden?.folio}</strong> al proveedor{' '}
            <strong className="text-gray-900">{modalEnviar.orden?.proveedor_nombre}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Una vez enviada, no podrás modificar los items de la orden.
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setModalEnviar({ isOpen: false, orden: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEnviar}
              isLoading={enviarMutation.isPending}
              icon={Send}
            >
              Confirmar Envío
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cancelación */}
      <Modal
        isOpen={modalCancelar.isOpen}
        onClose={() => setModalCancelar({ isOpen: false, orden: null })}
        title="Cancelar Orden de Compra"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas cancelar la orden{' '}
            <strong className="text-gray-900">{modalCancelar.orden?.folio}</strong>?
          </p>

          <Textarea
            label="Motivo de cancelación (opcional)"
            value={motivoCancelacion}
            onChange={(e) => setMotivoCancelacion(e.target.value)}
            rows={3}
            placeholder="Indica el motivo de la cancelación..."
          />

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setModalCancelar({ isOpen: false, orden: null })}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelar}
              isLoading={cancelarMutation.isPending}
              icon={XCircle}
            >
              Cancelar Orden
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
