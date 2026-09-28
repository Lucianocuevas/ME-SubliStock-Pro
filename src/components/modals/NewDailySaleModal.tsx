import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { ProductItem, DailySaleItem } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSaleCreated: () => void;
}

export const NewDailySaleModal: React.FC<Props> = ({ isOpen, onClose, products, onSaleCreated }) => {
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'mercadopago'>('efectivo');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DailySaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [itemSaleMode, setItemSaleMode] = useState<'con_diseno' | 'lisa'>('con_diseno');

  if (!isOpen) return null;

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = itemSaleMode === 'lisa' ? Math.round(prod.salePrice * 0.85) : prod.salePrice;

    // Check if already in items with same mode
    const existingIndex = items.findIndex(i => i.productId === selectedProductId && i.saleMode === itemSaleMode);
    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name + (prod.size ? ` (${prod.size})` : ''),
          quantity,
          unitPrice,
          unitCost: prod.costPrice,
          totalPrice: unitPrice * quantity,
          saleMode: itemSaleMode
        }
      ]);
    }

    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index].unitPrice = newPrice;
    updated[index].totalPrice = updated[index].quantity * newPrice;
    setItems(updated);
  };

  const totalAmount = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalCost = items.reduce((acc, curr) => acc + (curr.unitCost * curr.quantity), 0);
  const estimatedProfit = totalAmount - totalCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Debes agregar al menos un producto a la venta');
      return;
    }

    StorageService.addDailySale({
      customerName: customerName.trim() || 'Cliente Mostrador',
      paymentMethod,
      items,
      totalAmount,
      totalCost,
      notes: notes.trim() || undefined
    });

    onSaleCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registrar Venta de Mostrador</h2>
              <p className="text-xs text-slate-400">Venta directa con deducción inmediata del stock de insumos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente o Mostrador"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Medio de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="mercadopago">Mercado Pago / QR</option>
                <option value="tarjeta">Tarjeta Débito/Crédito</option>
              </select>
            </div>
          </div>

          {/* Add product section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Agregar Insumo / Producto al Carrito
              </span>

              {/* Lisa vs Con Diseño Toggle */}
              <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                <label className="flex items-center gap-1 cursor-pointer font-medium text-slate-200">
                  <input
                    type="radio"
                    name="dailySaleMode"
                    checked={itemSaleMode === 'con_diseno'}
                    onChange={() => setItemSaleMode('con_diseno')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-emerald-400">🎨 Estampada</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-medium text-slate-200">
                  <input
                    type="radio"
                    name="dailySaleMode"
                    checked={itemSaleMode === 'lisa'}
                    onChange={() => setItemSaleMode('lisa')}
                    className="text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-cyan-400">👕 Lisa</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-8">
                <label className="block text-[11px] text-slate-400 mb-1">Seleccionar Producto</label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Buscar por nombre, talle o rubro --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                      {p.name} {p.size ? `[${p.size}]` : ''} {p.color ? `(${p.color})` : ''} - Stock: {p.currentStock} - ${p.salePrice}
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 text-center"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cart items list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Ítems de la Venta ({items.length})
              </h3>
              {items.length > 0 && (
                <span className="text-xs text-slate-400">Total costo base: {formatCurrency(totalCost)}</span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-500 text-sm">
                No hay productos en esta venta. Selecciona uno arriba y haz clic en &ldquo;Añadir&rdquo;.
              </div>
            ) : (
              <div className="space-y-2 border border-slate-800 rounded-lg p-2 bg-slate-950/40">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-md border border-slate-800/80 text-sm">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-100 truncate">{item.productName}</p>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          item.saleMode === 'lisa' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {item.saleMode === 'lisa' ? 'Lisa' : 'Estampada'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Costo unitario: {formatCurrency(item.unitCost)} · Cant: {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-right text-xs"
                          title="Precio de venta unitario"
                        />
                      </div>
                      <span className="font-bold text-white w-20 text-right">
                        {formatCurrency(item.totalPrice)}
                      </span>
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Retiró en mostrador, comprobante enviado por WhatsApp"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Totals Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Ganancia Estimada de la Venta</div>
              <div className="text-base font-semibold text-emerald-400">
                {formatCurrency(estimatedProfit)} {totalAmount > 0 ? `(${((estimatedProfit / totalAmount) * 100).toFixed(0)}% margen)` : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total a Cobrar</div>
              <div className="text-2xl font-black text-white">
                {formatCurrency(totalAmount)}
              </div>
            </div>
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
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Venta y Descontar Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
