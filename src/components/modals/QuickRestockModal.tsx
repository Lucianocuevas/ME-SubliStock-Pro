import React, { useState } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import { ProductItem } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onRestocked: () => void;
}

export const QuickRestockModal: React.FC<Props> = ({ isOpen, onClose, product, onRestocked }) => {
  const [quantityToAdd, setQuantityToAdd] = useState<number>(20);
  const [newCostPrice, setNewCostPrice] = useState<number>(product?.costPrice || 0);

  if (!isOpen || !product) return null;

  const handleQuickAdd = (qty: number) => {
    setQuantityToAdd(qty);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityToAdd <= 0) {
      alert('La cantidad a reponer debe ser mayor a cero');
      return;
    }

    StorageService.quickRestock(product.id, quantityToAdd, newCostPrice);
    onRestocked();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Reponer Stock Rápido</h2>
              <p className="text-xs text-slate-400">Actualizar inventario inmediatamente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <p className="font-semibold text-white text-sm">{product.name}</p>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>Stock actual: <strong className="text-orange-400">{product.currentStock} {product.unit}</strong></span>
              <span>Stock mínimo: {product.minStock} {product.unit}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Cantidad a Sumar al Stock
            </label>
            <input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={e => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xl font-bold text-center text-white focus:outline-none focus:border-orange-500"
              required
            />
            <div className="flex items-center justify-center gap-2 mt-2">
              {[10, 25, 50, 100].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Costo Unitario de Compra Actual ($)
            </label>
            <input
              type="number"
              min="0"
              value={newCostPrice || product.costPrice}
              onChange={e => setNewCostPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300">
            Nuevo stock resultante: <strong className="text-emerald-400 text-sm">{product.currentStock + quantityToAdd} {product.unit}</strong>
            <br />
            Inversión en reposición: <strong>{formatCurrency(quantityToAdd * (newCostPrice || product.costPrice))}</strong>
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
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2 shadow-lg shadow-orange-950/50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Reposición</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
