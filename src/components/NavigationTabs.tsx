import React from 'react';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  Flame,
  Truck,
  Users,
  FileSpreadsheet,
  Settings,
  FileText,
  Shield,
  Database,
  CreditCard,
  Smartphone
} from 'lucide-react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  criticalAlertsCount: number;
  activeOrdersCount: number;
  productsCount: number;
  quotationsCount?: number;
  debtorCustomersCount?: number;
  showMultiDeviceTab?: boolean;
}

export const NavigationTabs: React.FC<Props> = ({
  activeTab,
  onTabChange,
  criticalAlertsCount,
  activeOrdersCount,
  productsCount,
  quotationsCount = 0,
  debtorCustomersCount = 0,
  showMultiDeviceTab = true
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'inventory',
      label: 'Inventario & Insumos',
      icon: Package,
      badge: productsCount ? `${productsCount}` : null
    },
    {
      id: 'alerts',
      label: 'Alertas Críticas',
      icon: AlertTriangle,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}` : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse'
    },
    {
      id: 'orders',
      label: 'Pedidos & Producción',
      icon: Flame,
      badge: activeOrdersCount > 0 ? `${activeOrdersCount}` : null,
      badgeColor: 'bg-cyan-600 text-white'
    },
    {
      id: 'cuentas_corrientes',
      label: 'Cuentas Corrientes',
      icon: CreditCard,
      badge: debtorCustomersCount > 0 ? `${debtorCustomersCount}` : null,
      badgeColor: 'bg-emerald-900/90 text-emerald-300 border border-emerald-700'
    },
    {
      id: 'quotations',
      label: 'Presupuestos (PDF)',
      icon: FileText,
      badge: quotationsCount > 0 ? `${quotationsCount}` : null,
      badgeColor: 'bg-orange-500/80 text-white'
    },
    {
      id: 'suppliers',
      label: 'Proveedores & Compras',
      icon: Truck,
      badge: null
    },
    {
      id: 'customers',
      label: 'Clientes & WhatsApp',
      icon: Users,
      badge: null
    },
    ...(showMultiDeviceTab ? [{
      id: 'multi_device',
      label: 'PC & Móvil',
      icon: Smartphone,
      badge: 'App Android/PC',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800'
    }] : []),
    {
      id: 'users',
      label: 'Usuarios & Roles',
      icon: Shield,
      badge: null
    },
    {
      id: 'reports',
      label: 'Reportes Mensuales',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'backend',
      label: 'MySQL & Nube (Spring Boot)',
      icon: Database,
      badge: 'SQL',
      badgeColor: 'bg-indigo-900/80 text-indigo-300 border border-indigo-700'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    tab.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
