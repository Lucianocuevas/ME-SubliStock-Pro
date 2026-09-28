import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Truck, Sparkles, Check } from 'lucide-react';
import { Supplier, ProductItem, PurchaseOrderItem } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: ProductItem[];
  preselectedSupplierId?: string;
  onPurchaseCreated: () => void;
}

export const NewPurchaseOrderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  preselectedSupplierId,
  onPurchaseCreated
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState<'pendiente' | 'recibido'>('recibido');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  // Item selector state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(20);
  const [unitCost, setUnitCost] = useState(0);

  useEffect(() => {
    if (preselectedSupplierId) {
      setSupplierId(preselectedSupplierId);
    } else if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [preselectedSupplierId, suppliers, supplierId, isOpen]);

  useEffect(() => {
    if (selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        setUnitCost(prod.costPrice);
      }
    }
  }, [selectedProductId, products]);

  if (!isOpen) return null;

  const currentSupplier = suppliers.find(s => s.id === supplierId);

  // Auto-fill critical items for this supplier
  const handleAutoLoadCriticalItems = () => {
    const criticalProds = products.filter(
      p => p.supplierId === supplierId && p.currentStock <= p.minStock
    );

    if (criticalProds.length === 0) {
      alert('No hay insumos en nivel crítico registrados para este proveedor específico.');
      return;
    }

    const newItems: PurchaseOrderItem[] = criticalProds.map(p => {
      // Suggest order amount to reach 2x minStock
      const suggestedQty = Math.max(10, (p.minStock * 2) - p.currentStock);
      return {
        productId: p.id,
        productName: p.name + (p.size ? ` (${p.size})` : ''),
        quantity: suggestedQty,
        unitCost: p.costPrice,
        totalCost: suggestedQty * p.costPrice
      };
    });

    setItems([...items, ...newItems]);
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const existingIdx = items.findIndex(i => i.productId === selectedProductId);
    if (existingIdx !== -1) {
      const updated = [...items];
      updated[existingIdx].quantity += quantity;
      updated[existingIdx].totalCost = updated[existingIdx].quantity * updated[existingIdx].unitCost;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name + (prod.size ? ` (${p_size(prod)})` : ''),
          quantity,
          unitCost: unitCost || prod.costPrice,
          totalCost: (unitCost || prod.costPrice) * quantity
        }
      ]);
    }

    setQuantity(20);
  };

  const p_size = (p: ProductItem) => p.size || '';

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCostChange = (index: number, newCost: number) => {
    const updated = [...items];
    updated[index].unitCost = newCost;
    updated[index].totalCost = updated[index].quantity * newCost;
    setItems(updated);
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, newQty);
    updated[index].totalCost = updated[index].quantity * updated[index].unitCost;
    setItems(updated);
  };

  const totalAmount = items.reduce((acc, curr) => acc + curr.totalCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Selecciona un proveedor');
      return;
    }
    if (items.length === 0) {
      alert('Debes agregar al menos un insumo a la orden de compra');
      return;
    }

    const supplierName = currentSupplier?.name || 'Proveedor';

    StorageService.addPurchaseOrder({
      supplierId,
      supplierName,
      date: new Date().toISOString().split('T')[0],
      status,
      items,
      totalAmount,
      invoiceNumber: invoiceNumber.trim() || undefined,
      receivedDate: status === 'recibido' ? new Date().toISOString().split('T')[0] : undefined,
      notes: notes.trim() || undefined
    });

    onPurchaseCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nueva Compra / Orden a Proveedor</h2>
              <p className="text-xs text-slate-400">Reabastece insumos y actualiza el historial de compras del taller</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Proveedor
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">-- Seleccionar proveedor --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                N° Factura / Remito
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="Ej: FACT-004-9842"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Estado de la Compra
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="recibido">Mercadería Recibida (Sumar a Stock YA)</option>
                <option value="pendiente">Pendiente de Entrega</option>
              </select>
            </div>
          </div>

          {/* Quick auto-fill button */}
          {supplierId && (
            <div className="flex items-center justify-between p-2.5 bg-indigo-950/30 border border-indigo-800/40 rounded-lg text-xs">
              <span className="text-indigo-200">
                ¿Insumos bajos de {currentSupplier?.name}?
              </span>
              <button
                type="button"
                onClick={handleAutoLoadCriticalItems}
                className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 bg-indigo-900/60 px-3 py-1 rounded border border-indigo-700/60 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cargar insumos críticos automáticamente</span>
              </button>
            </div>
          )}

          {/* Item selector */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
              Agregar Insumo a la Compra
            </span>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-6">
                <label className="block text-[11px] text-slate-400 mb-1">Insumo</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Seleccionar insumo --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.size ? `[${p.size}]` : ''} - Stock actual: {p.currentStock} - Costo: ${p.costPrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Costo Unit. ($)</label>
                <input
                  type="number"
                  min="0"
                  value={unitCost}
                  onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Ítems en esta Compra ({items.length})
            </h3>

            {items.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-lg p-5 text-center text-slate-500 text-sm">
                No hay insumos añadidos todavía.
              </div>
            ) : (
              <div className="space-y-2 border border-slate-800 rounded-lg p-2.5 bg-slate-950/40">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{item.productName}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block text-right">Cant.</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-center text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block text-right">Costo Unit.</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitCost}
                          onChange={e => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-right text-xs"
                        />
                      </div>

                      <div className="text-right w-24">
                        <span className="text-[10px] text-slate-400 block">Total</span>
                        <span className="font-bold text-white text-sm">
                          {formatCurrency(item.totalCost)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {status === 'recibido'
                ? 'Los productos se sumarán directamente al stock actual al confirmar.'
                : 'La compra quedará como pendiente de arribo al taller.'}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Inversión Total</span>
              <span className="text-2xl font-black text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Notas Adicionales
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Pago realizado por e-check 30 días, entrega por expreso"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={items.length === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Orden de Compra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
