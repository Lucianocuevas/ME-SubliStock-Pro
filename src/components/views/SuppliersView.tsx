import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import { Supplier, PurchaseOrder } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { CATEGORY_LABELS } from '../../data/initialData';

interface Props {
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  onOpenNewSupplier: () => void;
  onOpenNewPurchase: (supplierId?: string) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onRefreshData: () => void;
}

export const SuppliersView: React.FC<Props> = ({
  suppliers,
  purchases,
  onOpenNewSupplier,
  onOpenNewPurchase,
  onEditSupplier,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');

  const handleMarkAsReceived = (orderId: string) => {
    if (confirm('¿Confirmas la recepción de esta mercadería? Se sumará automáticamente el stock a tu taller.')) {
      StorageService.markPurchaseAsReceived(orderId);
      onRefreshData();
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const filteredPurchases = purchases.filter(p =>
    p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSpentPurchases = purchases
    .filter(p => p.status === 'recibido')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-400" />
            <span>Gestión de Proveedores e Historial de Compras</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Control de insumos adquiridos, remitos, demoras de entrega y reabastecimiento del taller
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenNewSupplier()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Proveedor</span>
          </button>

          <button
            onClick={() => onOpenNewPurchase()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>+ Registrar Compra</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'suppliers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Directorio de Proveedores ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'purchases' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Historial de Compras ({purchases.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'suppliers' ? 'Buscar proveedor...' : 'Buscar compra o remito...'}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* View 1: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
            const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
            const totalBought = supplierPurchases.reduce((acc, curr) => acc + curr.totalAmount, 0);

            return (
              <div
                key={supplier.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base">{supplier.name}</h3>
                      <p className="text-xs text-indigo-400 font-medium">Contacto: {supplier.contactPerson}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                      Demora: {supplier.leadTimeDays}d
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-200">{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    {supplier.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Supplied Categories */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Rubros Suministrados:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {supplier.suppliedCategories.map(cat => (
                        <span key={cat} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                          {CATEGORY_LABELS[cat]?.label || cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {supplier.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                      {supplier.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Comprado:</span>
                    <strong className="text-white">{formatCurrency(totalBought)}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditSupplier(supplier)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onOpenNewPurchase(supplier.id)}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Comprar Insumos
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: Purchase Orders History */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Orden / Fecha</th>
                    <th className="py-3 px-3">Proveedor</th>
                    <th className="py-3 px-3">Comprobante / Remito</th>
                    <th className="py-3 px-3">Detalle Insumos Recibidos</th>
                    <th className="py-3 px-3 text-right">Inversión Total</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        No hay registros de compras a proveedores.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map(purchase => (
                      <tr key={purchase.id} className="hover:bg-slate-950/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-white block">{purchase.orderNumber}</span>
                          <span className="text-[11px] text-slate-400">{purchase.date}</span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-200 text-sm block">{purchase.supplierName}</span>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-slate-400">
                          {purchase.invoiceNumber || '-'}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5 max-w-xs">
                            {purchase.items.map((i, idx) => (
                              <div key={idx} className="text-slate-300 text-[11px] truncate">
                                <strong className="text-indigo-400">{i.quantity}x</strong> {i.productName}
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right font-black text-white text-sm">
                          {formatCurrency(purchase.totalAmount)}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {purchase.status === 'recibido' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                              RECIBIDO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                              PENDIENTE
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {purchase.status === 'pendiente' ? (
                            <button
                              onClick={() => handleMarkAsReceived(purchase.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 ml-auto shadow transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Marcar Recibido</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">En almacén</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <span>Total compras recibidas e ingresadas a inventario:</span>
            <strong className="text-white text-base font-bold">{formatCurrency(totalSpentPurchases)}</strong>
          </div>
        </div>
      )}
    </div>
  );
};
