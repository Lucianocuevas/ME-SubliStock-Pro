import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  Plus,
  ShoppingBag,
  Layers,
  FileText,
  Package,
  Calendar,
  Shield,
  Settings as SettingsIcon,
  BellOff,
  Smartphone
} from 'lucide-react';
import { AppUser } from '../types';
import { ROLE_LABELS } from '../data/initialData';

interface Props {
  workshopName: string;
  logoUrl?: string;
  criticalStockCount: number;
  urgentOrdersCount: number;
  currentUser?: AppUser;
  onNavigateTab: (tab: string) => void;
  onOpenNewSale: () => void;
  onOpenNewOrder: () => void;
  onOpenNewQuotation: () => void;
  onOpenNewProduct: () => void;
  onOpenNewPurchase: () => void;
}

export const Header: React.FC<Props> = ({
  workshopName,
  logoUrl,
  criticalStockCount,
  urgentOrdersCount,
  currentUser,
  onNavigateTab,
  onOpenNewSale,
  onOpenNewOrder,
  onOpenNewQuotation,
  onOpenNewProduct,
  onOpenNewPurchase
}) => {
  // Live digital clock: updates every second
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const dateString = now.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const roleMeta = currentUser ? ROLE_LABELS[currentUser.role] : null;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          {logoUrl ? (
            <div
              onClick={() => onNavigateTab('settings')}
              className="cursor-pointer h-9 w-9 rounded-lg bg-white p-0.5 border border-slate-700 hover:border-cyan-500 flex items-center justify-center overflow-hidden shrink-0 shadow-md transition-colors"
              title="Configuración de Empresa, Logo y Datos"
            >
              <img src={logoUrl} alt={workshopName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div
              onClick={() => onNavigateTab('dashboard')}
              className="cursor-pointer w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-950/50"
            >
              <Flame className="w-5 h-5 fill-white/20" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => onNavigateTab('dashboard')}
                className="cursor-pointer font-black text-white text-base tracking-tight hover:text-orange-400 transition-colors"
              >
                SubliStock
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <p
              onClick={() => onNavigateTab('settings')}
              className="text-[11px] text-slate-400 font-medium truncate max-w-[130px] sm:max-w-xs cursor-pointer hover:text-cyan-400 transition-colors"
              title="Clic para configurar datos de la empresa"
            >
              {workshopName}
            </p>
          </div>
        </div>

        {/* Live Digital Clock Centerpiece */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-lg shadow-inner">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 leading-none">
            <span className="font-mono font-black text-sm text-slate-100 tracking-wider">
              {timeString}
            </span>
            <span className="text-[10px] text-slate-400 font-medium capitalize hidden sm:inline">
              {dateString}
            </span>
          </div>
        </div>

        {/* Right Section: Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Critical Stock Alert Pill */}
          {criticalStockCount > 0 ? (
            <button
              onClick={() => onNavigateTab('alerts')}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-600/80 text-rose-300 hover:bg-rose-900/90 text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-950 transition-all animate-pulse"
              title="Ver insumos en nivel crítico de inventario"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden md:inline">{criticalStockCount} {criticalStockCount === 1 ? 'Alerta Crítica' : 'Alertas Críticas'}</span>
              <span className="md:hidden">{criticalStockCount} Críticos</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Stock Óptimo</span>
            </div>
          )}

          {/* Urgent Orders indicator */}
          {urgentOrdersCount > 0 && (
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 border border-amber-600/80 text-amber-300 hover:bg-amber-900/80 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Pedidos por entregar hoy o atrasados"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">{urgentOrdersCount} por entregar</span>
              <span className="md:hidden">{urgentOrdersCount} hoy</span>
            </button>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
            <button
              onClick={onOpenNewSale}
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition-colors"
              title="Venta de mostrador (lisa o estampada)"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Venta</span>
            </button>

            <button
              onClick={onOpenNewOrder}
              className="px-2.5 sm:px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition-colors"
              title="Cargar pedido a producción con diseño y agendar en Calendar"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Pedido</span>
            </button>

            <button
              onClick={onOpenNewQuotation}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-orange-600/90 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition-colors"
              title="Generar Presupuesto Formal Membretado con Logo"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">+ Cotizar</span>
            </button>
          </div>

          {/* User Session Profile Pill */}
          {currentUser && (
            <button
              onClick={() => onNavigateTab('users')}
              className="flex items-center gap-2 pl-2 border-l border-slate-800 hover:opacity-80 transition-opacity"
              title={`Usuario actual: ${currentUser.name} (${roleMeta?.label}) - Clic para gestionar roles`}
            >
              <div className="w-7 h-7 rounded-full bg-purple-600/40 border border-purple-500/60 flex items-center justify-center text-[11px] font-bold text-purple-200">
                {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden xl:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-white truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[9px] text-purple-300 font-semibold">{roleMeta?.label.split(' ')[0]}</span>
              </div>
            </button>
          )}

          {/* Quick Settings Icon */}
          <button
            onClick={() => onNavigateTab('settings')}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-lg transition-colors border border-slate-800/60"
            title="Configuración de la Empresa, Logo, Datos y Alertas"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Quick Multi-Device & Mobile Access */}
          <button
            onClick={() => onNavigateTab('multi_device')}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-lg transition-colors border border-slate-800/60 flex items-center gap-1"
            title="Acceso Multi-Dispositivo (PC, Android & iOS con la misma base de datos)"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline text-[10px] font-bold text-cyan-400">Móvil/Nube</span>
          </button>
        </div>
      </div>
    </header>
  );
};
