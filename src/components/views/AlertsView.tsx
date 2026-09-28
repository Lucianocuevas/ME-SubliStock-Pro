import React from 'react';
import {
  AlertTriangle,
  Flame,
  Truck,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { ProductItem, StockAlert, Supplier } from '../../types';
import { formatCurrency } from '../../services/storageService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';

interface Props {
  stockAlerts: StockAlert[];
  suppliers: Supplier[];
  onQuickRestock: (product: ProductItem) => void;
  onOpenPurchaseOrder: (supplierId?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const AlertsView: React.FC<Props> = ({
  stockAlerts,
  suppliers,
  onQuickRestock,
  onOpenPurchaseOrder,
  onNavigateTab
}) => {
  const outOfStockItems = stockAlerts.filter(a => a.severity === 'out_of_stock');
  const criticalItems = stockAlerts.filter(a => a.severity === 'critical');
  const warningItems = stockAlerts.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border border-rose-800/60 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </span>
            <h2 className="text-xl font-black text-white">
              Centro de Alertas Automáticas de Insumos Críticos
            </h2>
          </div>
          <p className="text-xs text-rose-200/90 max-w-2xl">
            Monitoreo en tiempo real de insumos de sublimación por debajo del stock de seguridad. Evita paradas en la producción de pedidos y asegura el cumplimiento con tus clientes.
          </p>
        </div>

        <button
          onClick={() => onOpenPurchaseOrder()}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/80 transition-all shrink-0"
        >
          <Truck className="w-4 h-4" />
          <span>Generar Orden de Compra General</span>
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-rose-900/60 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
              Insumos Agotados (Stock 0)
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {outOfStockItems.length}
            </span>
            <span className="text-[11px] text-slate-400">Requieren compra urgente</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-950 flex items-center justify-center text-rose-400 font-bold border border-rose-800">
            !
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-900/60 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Nivel Crítico (&le; Mínimo)
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {criticalItems.length}
            </span>
            <span className="text-[11px] text-slate-400">Stock por debajo de seguridad</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-950 flex items-center justify-center text-amber-400 font-bold border border-amber-800">
            {criticalItems.length}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider block">
              Stock en Advertencia
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {warningItems.length}
            </span>
            <span className="text-[11px] text-slate-400">Cercanos a agotarse</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-yellow-400 font-bold border border-slate-700">
            {warningItems.length}
          </div>
        </div>
      </div>

      {/* Main Alerts List */}
      {stockAlerts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <PackageCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">¡Inventario Saludable!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Todos los insumos de sublimación se encuentran por encima de su nivel de reorden mínimo. No hay alertas activas en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Detalle de Insumos con Déficit ({stockAlerts.length})</span>
          </h3>

          <div className="space-y-3">
            {stockAlerts.map(({ product, severity, deficit, ordersImpactedCount }) => {
              const supplier = suppliers.find(s => s.id === product.supplierId);

              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-xl border transition-all ${
                    severity === 'out_of_stock'
                      ? 'bg-rose-950/30 border-rose-800/80 shadow-rose-950/30'
                      : severity === 'critical'
                      ? 'bg-slate-900/90 border-amber-800/60'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Insumo Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{product.sku}</span>
                        <h4 className="font-bold text-white text-base truncate">{product.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          severity === 'out_of_stock'
                            ? 'bg-rose-900 text-rose-200 border border-rose-600'
                            : severity === 'critical'
                            ? 'bg-amber-900 text-amber-200 border border-amber-600'
                            : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                        }`}>
                          {severity === 'out_of_stock' ? 'AGOTADO (0 u.)' : (severity === 'critical' ? 'CRÍTICO' : 'STOCK BAJO')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>Rubro: <strong className="text-slate-200">{CATEGORY_LABELS[product.category]?.label || product.category}</strong></span>
                        <span>Material: <strong className="text-cyan-300">{MATERIAL_LABELS[product.material] || product.material}</strong></span>
                        {product.size && <span>Talle/Tamaño: <strong className="text-slate-200">{product.size}</strong></span>}
                        {product.color && <span>Color: <strong className="text-slate-200">{product.color}</strong></span>}
                      </div>

                      {supplier && (
                        <p className="text-xs text-slate-400">
                          Proveedor asignado: <strong className="text-white">{supplier.name}</strong> (Demora est.: {supplier.leadTimeDays} días)
                        </p>
                      )}

                      {ordersImpactedCount > 0 && (
                        <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" />
                          Hay pedidos de clientes en cola esperando este insumo para finalizar producción.
                        </p>
                      )}
                    </div>

                    {/* Stock Numbers & Deficit */}
                    <div className="flex items-center gap-6 shrink-0 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stock Actual</span>
                        <span className={`text-xl font-black ${product.currentStock === 0 ? 'text-rose-500' : 'text-amber-400'}`}>
                          {product.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{product.unit}</span>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mínimo</span>
                        <span className="text-xl font-bold text-slate-300">
                          {product.minStock}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{product.unit}</span>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-bold">Déficit</span>
                        <span className="text-xl font-black text-rose-400">
                          -{deficit}
                        </span>
                        <span className="text-[10px] text-slate-500 block">u. sugeridas</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                      <button
                        onClick={() => onQuickRestock(product)}
                        className="w-full px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-950/50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reponer Stock</span>
                      </button>

                      <button
                        onClick={() => onOpenPurchaseOrder(product.supplierId)}
                        className="w-full px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Pedir a Proveedor</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
