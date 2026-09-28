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
  Edit2
} from 'lucide-react';
import { Customer, CustomerOrder } from '../../types';
import { formatCurrency, calculateOrderUrgency } from '../../services/storageService';

interface Props {
  customers: Customer[];
  orders: CustomerOrder[];
  onOpenNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onOpenNewOrderForCustomer: (customerId: string) => void;
}

export const CustomersView: React.FC<Props> = ({
  customers,
  orders,
  onOpenNewCustomer,
  onEditCustomer,
  onOpenNewOrderForCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.businessOrContact && c.businessOrContact.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.phone.includes(searchTerm)
  );

  const totalOutstandingBalance = customers.reduce((acc, curr) => acc + curr.currentBalance, 0);

  const getCleanPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
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
            Gestión de colegios, empresas, clubes y particulares con historial y saldos adeudados
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Clientes Registrados</span>
          <span className="text-xl font-bold text-white">{customers.length}</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-amber-400 block uppercase font-medium">Saldos Totales por Cobrar</span>
          <span className="text-xl font-bold text-amber-400">{formatCurrency(totalOutstandingBalance)}</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Total Facturado Histórico</span>
          <span className="text-xl font-bold text-emerald-400">
            {formatCurrency(customers.reduce((acc, c) => acc + c.totalSpent, 0))}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, institución o WhatsApp..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => {
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
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{customer.name}</h3>
                    {customer.businessOrContact && (
                      <p className="text-xs text-cyan-400 font-medium">{customer.businessOrContact}</p>
                    )}
                  </div>

                  <button
                    onClick={() => onEditCustomer(customer)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Editar datos del cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
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
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
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
    </div>
  );
};
