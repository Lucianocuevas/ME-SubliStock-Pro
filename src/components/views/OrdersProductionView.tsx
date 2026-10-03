import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  DollarSign,
  User,
  Filter,
  Trash2
} from 'lucide-react';
import { CustomerOrder, ProductionStatus } from '../../types';
import { formatCurrency, calculateOrderUrgency, StorageService } from '../../services/storageService';
import { STATUS_LABELS } from '../../data/initialData';

interface Props {
  orders: CustomerOrder[];
  onOpenNewOrder: () => void;
  onSelectOrder: (order: CustomerOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: ProductionStatus) => void;
  onOrderDeleted?: () => void;
}

export const OrdersProductionView: React.FC<Props> = ({
  orders,
  onOpenNewOrder,
  onSelectOrder,
  onUpdateOrderStatus,
  onOrderDeleted
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'today' | 'active'>('all');
  const [orderToDelete, setOrderToDelete] = useState<CustomerOrder | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState(true);

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      StorageService.deleteCustomerOrder(orderToDelete.id, restoreStockOnDelete);
      setOrderToDelete(null);
      onOrderDeleted?.();
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const urg = calculateOrderUrgency(order.deliveryDate, order.productionStatus);

      // Search match
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm) ||
        order.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status match
      const matchesStatus = statusFilter === 'all' || order.productionStatus === statusFilter;

      // Urgency filter match
      let matchesUrgency = true;
      if (urgencyFilter === 'urgent') {
        matchesUrgency = urg.urgency === 'overdue';
      } else if (urgencyFilter === 'today') {
        matchesUrgency = urg.urgency === 'today';
      } else if (urgencyFilter === 'active') {
        matchesUrgency = order.productionStatus !== 'entregado' && order.productionStatus !== 'cancelado';
      }

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [orders, searchTerm, statusFilter, urgencyFilter]);

  // Counts
  const activeCount = orders.filter(o => o.productionStatus !== 'entregado' && o.productionStatus !== 'cancelado').length;
  const overdueCount = orders.filter(o => {
    const urg = calculateOrderUrgency(o.deliveryDate, o.productionStatus);
    return urg.urgency === 'overdue';
  }).length;
  const todayCount = orders.filter(o => {
    const urg = calculateOrderUrgency(o.deliveryDate, o.productionStatus);
    return urg.urgency === 'today';
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-cyan-400" />
            <span>Taller de Sublimación: Producción y Pedidos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seguimiento de pedidos vinculados al stock con alertas de vencimiento por fecha prometida
          </p>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cargar Nuevo Pedido</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setUrgencyFilter('active')}
          className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
        >
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Pedidos Activos en Taller</span>
          <span className="text-xl font-bold text-cyan-400">{activeCount} pedidos</span>
        </div>

        <div
          onClick={() => setUrgencyFilter('urgent')}
          className={`p-3.5 rounded-lg cursor-pointer transition-colors border ${
            overdueCount > 0 ? 'bg-rose-950/40 border-rose-800' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <span className="text-[11px] text-rose-400 block uppercase font-bold">¡Atrasados / Vencidos!</span>
          <span className="text-xl font-black text-rose-400">{overdueCount}</span>
        </div>

        <div
          onClick={() => setUrgencyFilter('today')}
          className={`p-3.5 rounded-lg cursor-pointer transition-colors border ${
            todayCount > 0 ? 'bg-amber-950/40 border-amber-800' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <span className="text-[11px] text-amber-300 block uppercase font-bold">Por Entregar Hoy</span>
          <span className="text-xl font-black text-amber-300">{todayCount}</span>
        </div>

        <div
          onClick={() => { setStatusFilter('entregado'); setUrgencyFilter('all'); }}
          className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
        >
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Entregados / Completados</span>
          <span className="text-xl font-bold text-emerald-400">
            {orders.filter(o => o.productionStatus === 'entregado').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° pedido, cliente, teléfono o ítem..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todos los Estados de Producción</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todas las Fechas</option>
              <option value="active">Solo Activos en Taller</option>
              <option value="today">Vencen Hoy</option>
              <option value="urgent">Atrasados (¡Atención!)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-sm">
          No se encontraron pedidos con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map(order => {
            const urg = calculateOrderUrgency(order.deliveryDate, order.productionStatus);
            const statusMeta = STATUS_LABELS[order.productionStatus] || STATUS_LABELS.diseno_pendiente;

            return (
              <div
                key={order.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Header of card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 text-[11px] rounded-full border ${urg.badgeClass}`}>
                        {urg.label}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200 text-sm">{order.customerName}</span>
                    <span>Tel: {order.customerPhone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Entrega: <strong className="text-white">{order.deliveryDate}</strong> {order.deliveryTime ? `a las ${order.deliveryTime} hs` : ''}</span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5 py-1 border-t border-b border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Insumos del Pedido:
                  </span>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-center justify-between">
                      <span className="truncate pr-2">
                        <strong className="text-cyan-400 font-bold">{item.quantity}x</strong> {item.productName}
                        {item.size ? ` (${item.size})` : ''}
                      </span>
                      <span className="text-slate-400 shrink-0">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  {order.items.some(i => i.customizationDetails) && (
                    <p className="text-[11px] text-cyan-300/80 italic mt-1 bg-cyan-950/30 p-1.5 rounded">
                      Diseño: {order.items.find(i => i.customizationDetails)?.customizationDetails}
                    </p>
                  )}
                </div>

                {/* Financial Summary & Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">Total:</span>
                      <strong className="text-white text-base">{formatCurrency(order.totalAmount)}</strong>
                    </div>

                    <div className="text-center">
                      <span className="text-slate-400 block">Seña / Adelanto:</span>
                      <strong className="text-cyan-400">{formatCurrency(order.depositAmount)}</strong>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block">Saldo Pendiente:</span>
                      <strong className={`text-base ${order.remainingBalance > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                        {formatCurrency(order.remainingBalance)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors text-center"
                    >
                      Ver Detalle / Cobrar / Imprimir
                    </button>

                    <button
                      onClick={() => {
                        setOrderToDelete(order);
                        setRestoreStockOnDelete(order.productionStatus !== 'entregado');
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                      title="Eliminar pedido permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {order.productionStatus !== 'entregado' && (
                      <button
                        onClick={() => {
                          const nextStatus: Record<ProductionStatus, ProductionStatus> = {
                            diseno_pendiente: 'en_produccion',
                            en_produccion: 'control_calidad',
                            control_calidad: 'listo_entrega',
                            listo_entrega: 'entregado',
                            entregado: 'entregado',
                            cancelado: 'diseno_pendiente'
                          };
                          onUpdateOrderStatus(order.id, nextStatus[order.productionStatus]);
                        }}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                        title="Avanzar al siguiente paso del taller"
                      >
                        Avanzar &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">¿Eliminar Pedido?</h3>
                <p className="text-xs text-slate-400 font-mono">{orderToDelete.orderNumber} · {orderToDelete.customerName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer y borrará el registro de producción y los cargos vinculados.
            </p>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={restoreStockOnDelete}
                onChange={e => setRestoreStockOnDelete(e.target.checked)}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs text-slate-200">
                Restaurar automáticamente los insumos al stock del inventario
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-rose-950/50"
              >
                Sí, Eliminar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
