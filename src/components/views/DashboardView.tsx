import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  ShoppingBag,
  ArrowRight,
  Flame,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Filter,
  Activity,
  BellOff,
  CreditCard
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ProductItem, CustomerOrder, DailySale, PurchaseOrder, StockAlert } from '../../types';
import { StorageService, formatCurrency, calculateOrderUrgency } from '../../services/storageService';
import { CATEGORY_LABELS } from '../../data/initialData';

interface Props {
  products: ProductItem[];
  orders: CustomerOrder[];
  dailySales: DailySale[];
  purchases?: PurchaseOrder[];
  stockAlerts: StockAlert[];
  onOpenNewSale: () => void;
  onOpenNewOrder: () => void;
  onOpenNewQuotation?: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectOrder: (order: CustomerOrder) => void;
  onDismissAllAlerts?: () => void;
}

export const DashboardView: React.FC<Props> = ({
  products,
  orders,
  dailySales,
  purchases = [],
  stockAlerts,
  onOpenNewSale,
  onOpenNewOrder,
  onOpenNewQuotation,
  onNavigateTab,
  onSelectOrder,
  onDismissAllAlerts
}) => {
  const [liveClock, setLiveClock] = React.useState(new Date());
  const [chartTimeframe, setChartTimeframe] = useState<'year' | 'last30days' | 'last12weeks'>('year');
  const [includeProductionOrders, setIncludeProductionOrders] = useState(true);
  const [showNetBalance, setShowNetBalance] = useState(true);

  React.useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Daily Sales calculation
  const todaySales = dailySales.filter(s => s.date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const todayCost = todaySales.reduce((acc, curr) => acc + curr.totalCost, 0);
  const todayProfit = todayRevenue - todayCost;

  // Monthly Sales (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthSales = dailySales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthRevenue = monthSales.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Active production orders
  const activeOrders = orders.filter(o => o.productionStatus !== 'entregado' && o.productionStatus !== 'cancelado');
  
  // Urgent orders: Overdue or Due Today
  const urgentOrders = activeOrders.filter(o => {
    const urg = calculateOrderUrgency(o.deliveryDate, o.productionStatus);
    return urg.urgency === 'overdue' || urg.urgency === 'today';
  });

  // Critical stock count
  const criticalCount = stockAlerts.filter(a => a.severity === 'critical' || a.severity === 'out_of_stock').length;

  // ----------------------------------------------------
  // RECHARTS: Comparative Sales vs Purchases Data Builder
  // ----------------------------------------------------
  const chartData = useMemo(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    if (chartTimeframe === 'year') {
      // 12 months leading up to current date
      const result = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const yKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = `${monthNames[m]} ${String(y).slice(2)}`;

        // Daily counter sales
        const matchedSales = dailySales.filter(s => s.date.startsWith(yKey));
        const salesTotal = matchedSales.reduce((acc, s) => acc + s.totalAmount, 0);

        // Production orders (if enabled)
        const matchedOrders = includeProductionOrders
          ? orders.filter(o => (o.createdAt.startsWith(yKey) || o.deliveryDate.startsWith(yKey)) && o.productionStatus !== 'cancelado')
          : [];
        const ordersTotal = matchedOrders.reduce((acc, o) => acc + o.totalAmount, 0);

        const totalVentas = salesTotal + ordersTotal;

        // Purchases from suppliers
        const matchedPurchases = (purchases || []).filter(p => p.date.startsWith(yKey) && p.status !== 'cancelado');
        const totalCompras = matchedPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

        result.push({
          key: yKey,
          label,
          fullDate: `${monthNames[m]} de ${y}`,
          ventas: totalVentas,
          compras: totalCompras,
          balance: totalVentas - totalCompras,
          operacionesVenta: matchedSales.length + matchedOrders.length,
          operacionesCompra: matchedPurchases.length
        });
      }
      return result;
    }

    if (chartTimeframe === 'last30days') {
      // Last 30 individual days
      const result = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const yKey = d.toISOString().split('T')[0];
        const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;

        const matchedSales = dailySales.filter(s => s.date.startsWith(yKey));
        const salesTotal = matchedSales.reduce((acc, s) => acc + s.totalAmount, 0);

        const matchedOrders = includeProductionOrders
          ? orders.filter(o => o.createdAt.startsWith(yKey) && o.productionStatus !== 'cancelado')
          : [];
        const ordersTotal = matchedOrders.reduce((acc, o) => acc + o.totalAmount, 0);

        const totalVentas = salesTotal + ordersTotal;

        const matchedPurchases = (purchases || []).filter(p => p.date.startsWith(yKey) && p.status !== 'cancelado');
        const totalCompras = matchedPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

        result.push({
          key: yKey,
          label,
          fullDate: yKey,
          ventas: totalVentas,
          compras: totalCompras,
          balance: totalVentas - totalCompras,
          operacionesVenta: matchedSales.length + matchedOrders.length,
          operacionesCompra: matchedPurchases.length
        });
      }
      return result;
    }

    // Default: Last 12 weeks
    const result = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const endDay = new Date();
      endDay.setDate(now.getDate() - i * 7);
      const startDay = new Date();
      startDay.setDate(endDay.getDate() - 6);

      const label = `Sem ${12 - i} (${startDay.getDate()}/${startDay.getMonth() + 1})`;

      const startIso = startDay.toISOString().split('T')[0];
      const endIso = endDay.toISOString().split('T')[0];

      const matchedSales = dailySales.filter(s => {
        const dStr = s.date.split('T')[0];
        return dStr >= startIso && dStr <= endIso;
      });
      const salesTotal = matchedSales.reduce((acc, s) => acc + s.totalAmount, 0);

      const matchedOrders = includeProductionOrders
        ? orders.filter(o => {
            const dStr = o.createdAt.split('T')[0];
            return dStr >= startIso && dStr <= endIso && o.productionStatus !== 'cancelado';
          })
        : [];
      const ordersTotal = matchedOrders.reduce((acc, o) => acc + o.totalAmount, 0);

      const totalVentas = salesTotal + ordersTotal;

      const matchedPurchases = (purchases || []).filter(p => {
        const dStr = p.date.split('T')[0];
        return dStr >= startIso && dStr <= endIso && p.status !== 'cancelado';
      });
      const totalCompras = matchedPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

      result.push({
        key: `week-${i}`,
        label,
        fullDate: `${startDay.getDate()} ${monthNames[startDay.getMonth()]} - ${endDay.getDate()} ${monthNames[endDay.getMonth()]}`,
        ventas: totalVentas,
        compras: totalCompras,
        balance: totalVentas - totalCompras,
        operacionesVenta: matchedSales.length + matchedOrders.length,
        operacionesCompra: matchedPurchases.length
      });
    }
    return result;
  }, [dailySales, purchases, orders, chartTimeframe, includeProductionOrders]);

  // Aggregate stats from the chart dataset
  const chartTotals = useMemo(() => {
    const totalVentas = chartData.reduce((acc, curr) => acc + curr.ventas, 0);
    const totalCompras = chartData.reduce((acc, curr) => acc + curr.compras, 0);
    const balanceNeto = totalVentas - totalCompras;
    const margenNeto = totalVentas > 0 ? (balanceNeto / totalVentas) * 100 : 0;
    const ratioRetorno = totalCompras > 0 ? (totalVentas / totalCompras) : 0;

    let maxVentasPoint = chartData[0] || { label: '-', ventas: 0 };
    let maxComprasPoint = chartData[0] || { label: '-', compras: 0 };

    for (const item of chartData) {
      if (item.ventas > maxVentasPoint.ventas) maxVentasPoint = item;
      if (item.compras > maxComprasPoint.compras) maxComprasPoint = item;
    }

    return {
      totalVentas,
      totalCompras,
      balanceNeto,
      margenNeto,
      ratioRetorno,
      maxVentasPoint,
      maxComprasPoint
    };
  }, [chartData]);

  // Custom Glassmorphic Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      const ventas = dataPoint?.ventas || 0;
      const compras = dataPoint?.compras || 0;
      const balance = dataPoint?.balance || 0;

      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2.5 min-w-[210px]">
          <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-white text-xs">{dataPoint?.fullDate || label}</span>
            <span className="text-[10px] text-slate-400 font-mono">Taller</span>
          </div>

          <div className="space-y-1.5">
            {/* Ventas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                <span className="text-slate-300">Ventas Registradas:</span>
              </div>
              <span className="font-bold text-emerald-400 font-mono">{formatCurrency(ventas)}</span>
            </div>

            {/* Compras */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-500/50" />
                <span className="text-slate-300">Compras Insumos:</span>
              </div>
              <span className="font-bold text-orange-400 font-mono">{formatCurrency(compras)}</span>
            </div>

            {/* Balance Neto */}
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-bold">
              <span className="text-slate-400 text-[11px]">Balance Neto:</span>
              <span className={`font-mono ${balance >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </span>
            </div>

            {dataPoint?.operacionesVenta > 0 && (
              <div className="text-[10px] text-slate-500 pt-0.5 flex justify-between">
                <span>Operaciones:</span>
                <span>{dataPoint.operacionesVenta} ventas · {dataPoint.operacionesCompra} compras</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Live Clock & Workshop Status Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-2xl sm:text-3xl text-white tracking-wider">
                {liveClock.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Hora en Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400 capitalize mt-0.5">
              {liveClock.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
          {onOpenNewQuotation && (
            <button
              onClick={onOpenNewQuotation}
              className="px-3.5 py-2 bg-orange-600/90 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Generar presupuesto membretado con logo institucional"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>+ Nuevo Presupuesto</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('orders')}
            className="px-3.5 py-2 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Ver pedidos agendados"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Pedido Taller</span>
          </button>

          <button
            onClick={() => onNavigateTab('cuentas_corrientes')}
            className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Ver Cuentas Corrientes y Saldos"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cuentas Corrientes</span>
          </button>

          <button
            onClick={() => onNavigateTab('backend')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Exportar MySQL y estructura Spring Boot"
          >
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nube & MySQL</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/50 border border-rose-800/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>¡ALERTA AUTOMÁTICA DE INVENTARIO CRÍTICO!</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-700">
                  {criticalCount} {criticalCount === 1 ? 'insumo en riesgo' : 'insumos en riesgo'}
                </span>
              </h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Hay productos de sublimación por debajo del stock mínimo de seguridad requeridos para entregas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => {
                if (confirm('¿Sacar y silenciar estas alertas para que no se muestren en el panel?')) {
                  StorageService.dismissAllStockAlerts();
                  onDismissAllAlerts?.();
                }
              }}
              className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-800/80 hover:border-amber-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Sacar alertas del panel de inicio"
            >
              <BellOff className="w-4 h-4 text-amber-400" />
              <span>Sacar Alertas</span>
            </button>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-950/60"
            >
              <span>Ver Insumos y Reponer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ventas Hoy */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ventas del Día (Hoy)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(todayRevenue)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Ganancia est.: <strong className="text-emerald-400">{formatCurrency(todayProfit)}</strong></span>
            <span>{todaySales.length} {todaySales.length === 1 ? 'venta' : 'ventas'}</span>
          </div>
        </div>

        {/* Card 2: Ingresos Acumulados Mes */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Facturación Mes Actual
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(monthRevenue)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>{monthSales.length} transacciones</span>
            <span className="text-cyan-400 font-medium">Taller en marcha</span>
          </div>
        </div>

        {/* Card 3: Trabajos Activos en Taller */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              En Producción Activa
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {activeOrders.length}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>{urgentOrders.length} por entregar hoy/urgentes</span>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-indigo-400 hover:underline font-medium"
            >
              Ver taller &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Insumos en Catálogo */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Insumos & Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {products.length} <span className="text-xs font-normal text-slate-400">ítems</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span className={criticalCount > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
              {criticalCount} bajo nivel mínimo
            </span>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-orange-400 hover:underline font-medium"
            >
              Inventario &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RECHARTS: Comparative Sales vs Purchases Line Chart */}
      {/* ---------------------------------------------------- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl relative overflow-hidden">
        {/* Header with Title, Controls, and Timeframe Selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-orange-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Balance Comparativo: Ventas vs. Compras de Insumos
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-400" />
                  Recharts Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativa de ingresos por ventas frente a desembolsos por compras a proveedores durante el último año
              </p>
            </div>
          </div>

          {/* Timeframe & Mode Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Timeframe buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setChartTimeframe('year')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  chartTimeframe === 'year'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Últimos 12 Meses
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe('last12weeks')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  chartTimeframe === 'last12weeks'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                12 Semanas
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe('last30days')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  chartTimeframe === 'last30days'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Últimos 30 Días
              </button>
            </div>

            {/* Toggle: Include Orders */}
            <button
              type="button"
              onClick={() => setIncludeProductionOrders(!includeProductionOrders)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                includeProductionOrders
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Alternar entre solo ventas de mostrador o sumar pedidos de producción"
            >
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>{includeProductionOrders ? 'Ventas Totales' : 'Solo Mostrador'}</span>
            </button>

            {/* Toggle: Net Balance Line */}
            <button
              type="button"
              onClick={() => setShowNetBalance(!showNetBalance)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showNetBalance
                  ? 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Mostrar u ocultar línea de margen / balance neto"
            >
              <span className={`w-2 h-2 rounded-full ${showNetBalance ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              <span>Línea Balance</span>
            </button>
          </div>
        </div>

        {/* Comparative Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Total Ventas del Período */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Ventas del Período
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {formatCurrency(chartTotals.totalVentas)}
            </div>
            <div className="text-[11px] text-slate-500">
              Pico: <strong className="text-slate-300">{chartTotals.maxVentasPoint.label}</strong> ({formatCurrency(chartTotals.maxVentasPoint.ventas)})
            </div>
          </div>

          {/* Card 2: Total Compras del Período */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                Compras a Proveedores
              </span>
              <ArrowDownRight className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {formatCurrency(chartTotals.totalCompras)}
            </div>
            <div className="text-[11px] text-slate-500">
              Pico: <strong className="text-slate-300">{chartTotals.maxComprasPoint.label}</strong> ({formatCurrency(chartTotals.maxComprasPoint.compras)})
            </div>
          </div>

          {/* Card 3: Margen / Balance Neto */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Balance Neto (Superávit)
              </span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className={`text-xl font-bold font-mono ${chartTotals.balanceNeto >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {chartTotals.balanceNeto >= 0 ? '+' : ''}{formatCurrency(chartTotals.balanceNeto)}
            </div>
            <div className="text-[11px] text-slate-500">
              Margen bruto: <strong className="text-cyan-300">{chartTotals.margenNeto.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Card 4: Retorno Inversión Insumos */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Retorno Insumos</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                ROI
              </span>
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {chartTotals.ratioRetorno.toFixed(2)}x
            </div>
            <div className="text-[11px] text-slate-500">
              Por cada $1 en insumos se generan ${(chartTotals.ratioRetorno).toFixed(2)}
            </div>
          </div>
        </div>

        {/* The Recharts Responsive Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val: number) => {
                  if (val === 0) return '$0';
                  if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                  return `$${val}`;
                }}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                iconType="circle"
              />
              {/* Line 1: Ventas */}
              <Line
                type="monotone"
                dataKey="ventas"
                name="Ventas Realizadas ($)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 7, stroke: '#34d399', strokeWidth: 2, fill: '#10b981' }}
              />
              {/* Line 2: Compras */}
              <Line
                type="monotone"
                dataKey="compras"
                name="Compras a Proveedores ($)"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 7, stroke: '#fb923c', strokeWidth: 2, fill: '#f97316' }}
              />
              {/* Optional Line 3: Net Balance */}
              {showNetBalance && (
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance Operativo Neto ($)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#06b6d4', strokeWidth: 1, stroke: '#0f172a' }}
                  activeDot={{ r: 6, stroke: '#22d3ee', strokeWidth: 2, fill: '#06b6d4' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer info note */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Datos calculados en tiempo real desde el registro de ventas de mostrador y compras cargadas.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{chartData.length} períodos visualizados</span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Exportar reporte contable &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Deliveries + Quick Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Urgent Deliveries / Production Queue (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Entregas y Pedidos Inmediatos</h3>
                <p className="text-xs text-slate-400">Alertas automáticas por fecha prometida al cliente</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Ver todos ({orders.length})
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
              No hay pedidos en cola activa. ¡Todo el taller al día!
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 4).map(order => {
                const urg = calculateOrderUrgency(order.deliveryDate, order.productionStatus);
                return (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="p-3.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 text-[11px] rounded-full border ${urg.badgeClass}`}>
                          {urg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {order.items.map(i => `${i.quantity}x ${i.productName}`).join(' · ')}
                      </p>
                    </div>

                    <div className="text-right sm:self-center shrink-0">
                      <span className="text-xs text-slate-400 block">Total Trabajo</span>
                      <span className="font-bold text-white text-sm">{formatCurrency(order.totalAmount)}</span>
                      {order.remainingBalance > 0 && (
                        <span className="text-[11px] text-amber-400 block font-medium">
                          Saldo: {formatCurrency(order.remainingBalance)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">¿Nuevo encargo de cliente?</span>
            <button
              onClick={onOpenNewOrder}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Cargar Nuevo Pedido</span>
            </button>
          </div>
        </div>

        {/* Right Column: Today's Counter Sales (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Ventas de Mostrador Recientes</h3>
                <p className="text-xs text-slate-400">Operaciones directas en el taller</p>
              </div>
            </div>
            <button
              onClick={onOpenNewSale}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              + Nueva Venta
            </button>
          </div>

          {dailySales.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
              No hay ventas registradas hoy.
            </div>
          ) : (
            <div className="space-y-2.5">
              {dailySales.slice(0, 4).map(sale => (
                <div
                  key={sale.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{sale.saleNumber}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <p className="font-medium text-white text-xs truncate mt-0.5">{sale.customerName}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-white text-sm">{formatCurrency(sale.totalAmount)}</span>
                    <span className="text-[10px] text-emerald-400 block font-medium">
                      +{formatCurrency(sale.totalAmount - sale.totalCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-400">Total acumulado en mostrador:</span>
            <strong className="text-white text-sm">
              {formatCurrency(dailySales.reduce((a, b) => a + b.totalAmount, 0))}
            </strong>
          </div>
        </div>
      </div>

      {/* Critical Insumos Quick Table on Dashboard */}
      {stockAlerts.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white text-sm">Insumos de Sublimación con Stock Crítico</h3>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Ver panel completo de alertas ({stockAlerts.length}) &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Insumo</th>
                  <th className="py-2 px-3">Rubro</th>
                  <th className="py-2 px-3">Talle/Medida</th>
                  <th className="py-2 px-3 text-center">Stock Actual</th>
                  <th className="py-2 px-3 text-center">Stock Mínimo</th>
                  <th className="py-2 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockAlerts.slice(0, 5).map(({ product, severity, deficit }) => (
                  <tr key={product.id} className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-mono text-slate-400">{product.sku}</td>
                    <td className="py-2 px-3 font-medium text-white">{product.name}</td>
                    <td className="py-2 px-3 text-slate-400">{CATEGORY_LABELS[product.category]?.label || product.category}</td>
                    <td className="py-2 px-3 text-slate-300">{product.size || '-'}</td>
                    <td className="py-2 px-3 text-center font-bold text-rose-400">{product.currentStock} {product.unit}</td>
                    <td className="py-2 px-3 text-center text-slate-400">{product.minStock} {product.unit}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        severity === 'out_of_stock'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {severity === 'out_of_stock' ? 'AGOTADO' : 'BAJO NIVEL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
