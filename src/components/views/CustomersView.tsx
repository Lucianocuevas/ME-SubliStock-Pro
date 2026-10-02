import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  DollarSign,
  Package,
  Edit2,
  CreditCard,
  UserX,
  UserCheck,
  Trash2,
  AlertTriangle,
  Power
} from 'lucide-react';
import { Customer, CustomerOrder } from '../../types';
import { formatCurrency, calculateOrderUrgency, StorageService } from '../../services/storageService';

interface Props {
  customers: Customer[];
  orders: CustomerOrder[];
  onOpenNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onOpenNewOrderForCustomer: (customerId: string) => void;
  onNavigateToCurrentAccounts?: (customerId?: string) => void;
  onOpenNewPayment?: (customerId: string) => void;
  onCustomerUpdated?: () => void;
}

export const CustomersView: React.FC<Props> = ({
  customers,
  orders,
  onOpenNewCustomer,
  onEditCustomer,
  onOpenNewOrderForCustomer,
  onNavigateToCurrentAccounts,
  onOpenNewPayment,
  onCustomerUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo'>('all');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const activeCount = customers.filter(c => c.status !== 'inactivo' && c.isActive !== false).length;
  const inactiveCount = customers.filter(c => c.status === 'inactivo' || c.isActive === false).length;

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.businessOrContact && c.businessOrContact.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phone.includes(searchTerm);
    const isInactive = c.status === 'inactivo' || c.isActive === false;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'inactivo' && isInactive) ||
      (statusFilter === 'activo' && !isInactive);
    return matchesSearch && matchesStatus;
  });

  const totalOutstandingBalance = customers.reduce((acc, curr) => acc + curr.currentBalance, 0);

  const getCleanPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  const handleToggleCustomerActive = (customer: Customer) => {
    StorageService.toggleCustomerActive(customer.id);
    onCustomerUpdated?.();
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      StorageService.deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
      onCustomerUpdated?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Cartera de Clientes y Cuentas Corrientes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de clientes, activación/inactivación, cuentas corrientes y WhatsApp directo
          </p>
        </div>

        <button
          onClick={onOpenNewCustomer}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Cliente</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            statusFilter === 'all' ? 'bg-slate-800 border-cyan-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Total Clientes</span>
          <span className="text-xl font-bold text-white">{customers.length}</span>
        </div>

        <div
          onClick={() => setStatusFilter('activo')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            statusFilter === 'activo' ? 'bg-emerald-950/60 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-emerald-400 block uppercase font-medium">Clientes Activos</span>
          <span className="text-xl font-bold text-emerald-400">{activeCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('inactivo')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            statusFilter === 'inactivo' ? 'bg-amber-950/60 border-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-amber-400 block uppercase font-medium">Clientes Inactivos</span>
          <span className="text-xl font-bold text-amber-400">{inactiveCount}</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-amber-400 block uppercase font-medium">Saldos por Cobrar</span>
          <span className="text-xl font-bold text-amber-400">{formatCurrency(totalOutstandingBalance)}</span>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, institución o WhatsApp..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              statusFilter === 'activo' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactivo')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              statusFilter === 'inactivo' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Inactivos ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold text-slate-400">No se encontraron clientes</p>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter === 'inactivo'
              ? 'No hay clientes marcados como inactivos.'
              : 'Agrega un cliente nuevo usando el botón superior.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const isInactive = customer.status === 'inactivo' || customer.isActive === false;
            const customerActiveOrders = orders.filter(
              o => o.customerId === customer.id && o.productionStatus !== 'entregado' && o.productionStatus !== 'cancelado'
            );

            const waPhone = getCleanPhoneForWhatsApp(customer.phone);
            const waMessage = encodeURIComponent(
              `¡Hola ${customer.name}! Nos comunicamos desde el Taller de Sublimación para coordinar los detalles de tu pedido.`
            );

            return (
              <div
                key={customer.id}
                className={`border rounded-xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between ${
                  isInactive
                    ? 'bg-slate-950/80 border-slate-800 opacity-80 hover:opacity-100 hover:border-amber-700/60'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{customer.name}</h3>
                        {isInactive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                            <UserX className="w-3 h-3" /> Inactivo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                      {customer.businessOrContact && (
                        <p className="text-xs text-cyan-400 font-medium mt-0.5">{customer.businessOrContact}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCustomer(customer)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        title="Editar datos del cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCustomerToDelete(customer)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-200">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Outstanding balance badge if any */}
                  {customer.currentBalance > 0 ? (
                    <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-medium">Saldo Adeudado:</span>
                      <strong className="text-amber-400 text-sm font-bold">{formatCurrency(customer.currentBalance)}</strong>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                      <span>Cuenta corriente al día</span>
                      <span className="text-emerald-400 font-medium">$0 saldo</span>
                    </div>
                  )}

                  {/* Active orders count */}
                  {customerActiveOrders.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
                        {customerActiveOrders.length} pedido(s) en producción:
                      </span>
                      {customerActiveOrders.map(o => {
                        const urg = calculateOrderUrgency(o.deliveryDate, o.productionStatus);
                        return (
                          <div key={o.id} className="text-xs bg-slate-950 p-1.5 rounded flex items-center justify-between">
                            <span className="font-mono text-slate-300">{o.orderNumber}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] ${urg.badgeClass}`}>
                              {urg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                  {/* Inactivate / Reactivate button */}
                  <button
                    onClick={() => handleToggleCustomerActive(customer)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      isInactive
                        ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                        : 'bg-slate-800 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-700'
                    }`}
                    title={isInactive ? 'Habilitar y activar cliente' : 'Inactivar cliente para pausarlo'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isInactive ? 'Reactivar' : 'Inactivar'}</span>
                  </button>

                  {onNavigateToCurrentAccounts && (
                    <button
                      onClick={() => onNavigateToCurrentAccounts(customer.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                      title="Ver Cuenta Corriente & Extracto"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}

                  {onOpenNewPayment && customer.currentBalance > 0 && (
                    <button
                      onClick={() => onOpenNewPayment(customer.id)}
                      className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="Registrar Cobro"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Cobro</span>
                    </button>
                  )}

                  {waPhone ? (
                    <a
                      href={`https://wa.me/${waPhone}?text=${waMessage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-emerald-950/50 hover:bg-emerald-600 border border-emerald-800 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                      title="Enviar WhatsApp al cliente"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  ) : null}

                  <button
                    onClick={() => onOpenNewOrderForCustomer(customer.id)}
                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors text-center"
                  >
                    + Cargar Pedido
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal to Delete Customer */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">¿Eliminar Cliente?</h3>
                <p className="text-xs text-slate-400">{customerToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción eliminará al cliente de tu base de datos.
              {customerToDelete.currentBalance > 0 ? (
                <span className="block mt-2 font-bold text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800">
                  ¡Atención! Este cliente tiene un saldo adeudado de {formatCurrency(customerToDelete.currentBalance)}.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomer}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-rose-950/50"
              >
                Sí, Eliminar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

