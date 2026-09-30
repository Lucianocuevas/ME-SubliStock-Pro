import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Truck,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  PackageCheck,
  BellOff,
  Bell,
  EyeOff,
  RotateCcw,
  Sliders,
  Settings as SettingsIcon,
  ShieldCheck,
  Info
} from 'lucide-react';
import { ProductItem, StockAlert, Supplier } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';

interface Props {
  stockAlerts: StockAlert[];
  suppliers: Supplier[];
  onQuickRestock: (product: ProductItem) => void;
  onOpenPurchaseOrder: (supplierId?: string) => void;
  onNavigateTab: (tab: string) => void;
  onRefreshData: () => void;
}

export const AlertsView: React.FC<Props> = ({
  stockAlerts,
  suppliers,
  onQuickRestock,
  onOpenPurchaseOrder,
  onNavigateTab,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'dismissed'>('active');
  const [dismissSuccessMsg, setDismissSuccessMsg] = useState<string | null>(null);

  const settings = StorageService.getSettings();
  const isAlertsEnabled = settings.enableStockAlerts !== false;
  const dismissedAlerts = StorageService.getDismissedStockAlerts();

  const outOfStockItems = stockAlerts.filter(a => a.severity === 'out_of_stock');
  const criticalItems = stockAlerts.filter(a => a.severity === 'critical');
  const warningItems = stockAlerts.filter(a => a.severity === 'warning');

  const showNotification = (msg: string) => {
    setDismissSuccessMsg(msg);
    setTimeout(() => setDismissSuccessMsg(null), 3000);
  };

  const handleDismissSingle = (productId: string, productName: string) => {
    StorageService.dismissStockAlert(productId);
    showNotification(`Alerta de "${productName}" sacada del panel.`);
    onRefreshData();
  };

  const handleRestoreSingle = (productId: string, productName: string) => {
    StorageService.restoreStockAlert(productId);
    showNotification(`Alerta de "${productName}" reactivada.`);
    onRefreshData();
  };

  const handleDismissAll = () => {
    if (confirm('¿Deseas sacar y silenciar todas las alertas de inventario activas actuales?')) {
      StorageService.dismissAllStockAlerts();
      showNotification('Todas las alertas actuales fueron silenciadas.');
      onRefreshData();
    }
  };

  const handleRestoreAll = () => {
    StorageService.restoreAllStockAlerts();
    showNotification('Todas las alertas fueron reactivadas y restablecidas.');
    onRefreshData();
  };

  const handleToggleGlobalAlerts = (enabled: boolean) => {
    StorageService.setStockAlertsEnabled(enabled);
    showNotification(enabled ? 'Sistema de alertas de stock activado.' : 'Sistema de alertas de stock desactivado globalmente.');
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {dismissSuccessMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{dismissSuccessMsg}</span>
          </div>
          <button
            onClick={() => setDismissSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs underline font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header banner */}
      <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border border-rose-800/60 rounded-xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </span>
            <h2 className="text-xl font-black text-white">
              Centro de Alertas de Inventario
            </h2>
            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
              isAlertsEnabled
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-300 border-slate-600'
            }`}>
              {isAlertsEnabled ? 'Alertas Activas' : 'Alertas Desactivadas Globalmente'}
            </span>
          </div>
          <p className="text-xs text-rose-200/90 max-w-2xl">
            Monitorea faltantes de stock o saca/silencia alertas de insumos que no requieras reponer en este momento.
          </p>
        </div>

        {/* Global Alert Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Toggle Global Alerts Switch */}
          <button
            onClick={() => handleToggleGlobalAlerts(!isAlertsEnabled)}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isAlertsEnabled
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-950'
            }`}
            title={isAlertsEnabled ? 'Desactivar todo el sistema de alertas' : 'Activar sistema de alertas'}
          >
            {isAlertsEnabled ? <BellOff className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4" />}
            <span>{isAlertsEnabled ? 'Desactivar Alertas' : 'Activar Alertas'}</span>
          </button>

          {/* Dismiss All */}
          {stockAlerts.length > 0 && (
            <button
              onClick={handleDismissAll}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/80 hover:border-amber-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Sacar y silenciar todas las alertas actuales del panel"
            >
              <EyeOff className="w-4 h-4" />
              <span>Sacar Todas</span>
            </button>
          )}

          {/* Quick PO Button */}
          <button
            onClick={() => onOpenPurchaseOrder()}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/80 transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>Generar Compra</span>
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-rose-900/60 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
              Agotados (Stock 0)
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {outOfStockItems.length}
            </span>
            <span className="text-[11px] text-slate-400">Sin unidades en taller</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-950 flex items-center justify-center text-rose-400 font-bold border border-rose-800">
            !
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-900/60 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Nivel Crítico (&le; Mín)
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {criticalItems.length}
            </span>
            <span className="text-[11px] text-slate-400">Por debajo de seguridad</span>
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
            <span className="text-[11px] text-slate-400">Próximos a reorden</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-yellow-400 font-bold border border-slate-700">
            {warningItems.length}
          </div>
        </div>

        {/* Silenced Alerts Counter */}
        <div
          onClick={() => setActiveTab('dismissed')}
          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'dismissed'
              ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
              Alertas Sacadas / Silenciadas
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {dismissedAlerts.length}
            </span>
            <span className="text-[11px] text-slate-400">Ocultas del panel</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-cyan-400 font-bold border border-slate-800">
            <BellOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs: Active vs Dismissed */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'active'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alertas Activas ({stockAlerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dismissed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'dismissed'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BellOff className="w-3.5 h-3.5" />
            <span>Alertas Sacadas / Silenciadas ({dismissedAlerts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'dismissed' && dismissedAlerts.length > 0 && (
            <button
              onClick={handleRestoreAll}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reactivar Todas las Alertas</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('settings')}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Configurar Empresa & Stock</span>
          </button>
        </div>
      </div>

      {/* Main Alerts List */}
      {activeTab === 'active' ? (
        stockAlerts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <PackageCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">¡No hay alertas activas en el inventario!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {!isAlertsEnabled
                ? 'Las alertas automáticas de inventario están desactivadas globalmente en las preferencias.'
                : dismissedAlerts.length > 0
                ? `Tienes ${dismissedAlerts.length} alerta(s) silenciadas/sacadas manualmente. Puedes verlas en la pestaña "Alertas Sacadas".`
                : 'Todos los insumos de sublimación se encuentran por encima de su nivel de reorden mínimo.'}
            </p>
            {dismissedAlerts.length > 0 && (
              <button
                onClick={() => setActiveTab('dismissed')}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span>Ver las {dismissedAlerts.length} alertas silenciadas</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Mostrando {stockAlerts.length} insumos con déficit
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Haz clic en "Sacar Alerta" para quitar cualquier insumo de esta lista y del panel principal.
              </span>
            </div>

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
                            Proveedor: <strong className="text-white">{supplier.name}</strong> (Demora est.: {supplier.leadTimeDays} días)
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

                      {/* Action Buttons with "Sacar Alerta" */}
                      <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                        {/* SACAR ALERTA BUTTON */}
                        <button
                          onClick={() => handleDismissSingle(product.id, product.name)}
                          className="w-full px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-700/80 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          title="Sacar esta alerta para que no aparezca en el panel"
                        >
                          <BellOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sacar Alerta</span>
                        </button>

                        <button
                          onClick={() => onQuickRestock(product)}
                          className="w-full px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-950/50"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reponer Stock</span>
                        </button>

                        <button
                          onClick={() => onOpenPurchaseOrder(product.supplierId)}
                          className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
        )
      ) : (
        /* DISMISSED / SILENCED ALERTS TAB */
        dismissedAlerts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No hay alertas silenciadas</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Todas las alertas de stock se encuentran activas en el panel. Si deseas silenciar un producto específico, haz clic en "Sacar Alerta" en la pestaña de Alertas Activas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <BellOff className="w-4 h-4" />
                Insumos con Alertas Sacadas / Silenciadas ({dismissedAlerts.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Estos productos no generan notificaciones rojas en el panel ni en el encabezado.
              </span>
            </div>

            <div className="space-y-3">
              {dismissedAlerts.map(({ product, severity, deficit }) => (
                <div
                  key={product.id}
                  className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-500">{product.sku}</span>
                      <h4 className="font-bold text-slate-300 text-sm">{product.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                        Alerta Silenciada
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Stock: <strong className="text-slate-300">{product.currentStock} {product.unit}</strong> (Mínimo configurado: {product.minStock})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestoreSingle(product.id, product.name)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Volver a mostrar alertas para este insumo"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Reactivar Alerta</span>
                    </button>

                    <button
                      onClick={() => onQuickRestock(product)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reponer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};
