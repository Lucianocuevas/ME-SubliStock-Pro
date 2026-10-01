import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ShoppingBag,
  Award,
  Sparkles,
  PieChart
} from 'lucide-react';
import {
  ProductItem,
  CustomerOrder,
  DailySale,
  PurchaseOrder,
  MonthlyReportSummary,
  ProductCategory,
  MaterialType,
  AccountMovement
} from '../../types';
import { formatCurrency, AppSettings, StorageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';
import { MonthlyReportPdfModal } from '../modals/MonthlyReportPdfModal';

interface Props {
  products: ProductItem[];
  orders: CustomerOrder[];
  dailySales: DailySale[];
  purchases: PurchaseOrder[];
  accountMovements?: AccountMovement[];
  settings?: AppSettings;
}

export const ReportsView: React.FC<Props> = ({
  products,
  orders,
  dailySales,
  purchases,
  accountMovements,
  settings
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const monthsList = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Filter records for selected month & year
  const monthSales = useMemo(() => {
    return dailySales.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [dailySales, selectedYear, selectedMonth]);

  const monthOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [orders, selectedYear, selectedMonth]);

  const monthPurchases = useMemo(() => {
    return purchases.filter(p => {
      const [y, m] = p.date.split('-').map(Number);
      return y === selectedYear && (m - 1) === selectedMonth;
    });
  }, [purchases, selectedYear, selectedMonth]);

  const monthMovements = useMemo(() => {
    const list = accountMovements && accountMovements.length > 0 ? accountMovements : StorageService.getAccountMovements();
    return list.filter(m => {
      const d = new Date(m.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [accountMovements, selectedYear, selectedMonth]);

  // Calculations
  const salesRevenue = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const salesCost = monthSales.reduce((acc, s) => acc + s.totalCost, 0);

  const ordersCompleted = monthOrders.filter(o => o.productionStatus === 'entregado');
  const ordersRevenue = monthOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const ordersCost = monthOrders.reduce((acc, o) => acc + o.costTotal, 0);

  const totalRevenue = salesRevenue + ordersRevenue;
  const totalCost = salesCost + ordersCost;
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const totalSupplierPurchases = monthPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const currentInventoryValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);

  // Units count
  let totalUnitsProduced = 0;
  monthSales.forEach(s => s.items.forEach(i => totalUnitsProduced += i.quantity));
  monthOrders.forEach(o => o.items.forEach(i => totalUnitsProduced += i.quantity));

  // Category breakdown
  const categoryStats: Record<string, { revenue: number; units: number }> = {};
  monthSales.forEach(s => {
    s.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod?.category || 'otros';
      if (!categoryStats[cat]) categoryStats[cat] = { revenue: 0, units: 0 };
      categoryStats[cat].revenue += item.totalPrice;
      categoryStats[cat].units += item.quantity;
    });
  });
  monthOrders.forEach(o => {
    o.items.forEach(item => {
      const cat = item.category || 'otros';
      if (!categoryStats[cat]) categoryStats[cat] = { revenue: 0, units: 0 };
      categoryStats[cat].revenue += item.totalPrice;
      categoryStats[cat].units += item.quantity;
    });
  });

  // Material breakdown
  const materialStats: Record<string, number> = {};
  monthOrders.forEach(o => {
    o.items.forEach(item => {
      const mat = item.material || 'otro';
      materialStats[mat] = (materialStats[mat] || 0) + item.quantity;
    });
  });

  const criticalProducts = products.filter(p => p.currentStock <= p.minStock);

  const reportSummary: MonthlyReportSummary = {
    year: selectedYear,
    month: selectedMonth,
    monthName: monthsList[selectedMonth],
    totalSalesRevenue: totalRevenue,
    totalProductionCost: totalCost,
    estimatedGrossProfit: grossProfit,
    grossMarginPercent: grossMargin,
    ordersCompletedCount: ordersCompleted.length,
    totalSupplierPurchases,
    currentInventoryValue,
    totalUnitsProduced,
    topCategories: Object.entries(categoryStats).map(([cat, data]) => ({
      category: cat as ProductCategory,
      revenue: data.revenue,
      units: data.units
    })),
    topProducts: [],
    materialUsageEstimates: Object.entries(materialStats).map(([mat, units]) => ({
      material: mat as MaterialType,
      units
    }))
  };

  const handleExportExcel = () => {
    ExportService.exportMonthlyReportToExcel(
      reportSummary,
      monthSales,
      monthOrders,
      monthPurchases,
      criticalProducts
    );
  };

  const handleExportPDF = () => {
    ExportService.exportMonthlyReportToPDF(
      reportSummary,
      monthSales,
      monthOrders,
      criticalProducts
    );
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Period Selector & Export CTAs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Reportes Mensuales y Rentabilidad del Taller</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Exportación formal a Excel (.xlsx) y PDF para contabilidad, socios y control de costos
          </p>
        </div>

        {/* Month/Year Picker & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {monthsList.map((m, idx) => (
                <option key={idx} value={idx} className="bg-slate-900">{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-slate-900">2026</option>
              <option value={2025} className="bg-slate-900">2025</option>
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-colors"
            title="Descargar archivo Excel .xlsx con pestañas de Ventas, Insumos y Compras"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Excel</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/50 transition-colors"
            title="Generar y descargar documento PDF formal de ventas y movimientos"
          >
            <FileText className="w-4 h-4" />
            <span>Descargar Reporte PDF (Ventas & Movimientos)</span>
          </button>

          <button
            onClick={handleNativePrint}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Imprimir o guardar como PDF desde el navegador"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs for selected month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Ventas Totales Facturadas
          </span>
          <span className="text-2xl font-black text-white mt-1 block">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {monthSales.length} mostrador + {monthOrders.length} pedidos
          </span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Costo Directo de Insumos
          </span>
          <span className="text-2xl font-black text-slate-300 mt-1 block">
            {formatCurrency(totalCost)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Materia prima consumida
          </span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            Ganancia Bruta Estimada
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {formatCurrency(grossProfit)}
          </span>
          <span className="text-[11px] text-emerald-300/80 mt-1 block font-medium">
            Margen Bruto: {grossMargin.toFixed(1)}%
          </span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
            Inversión en Proveedores
          </span>
          <span className="text-2xl font-black text-indigo-400 mt-1 block">
            {formatCurrency(totalSupplierPurchases)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {monthPurchases.length} compras en {monthsList[selectedMonth]}
          </span>
        </div>
      </div>

      {/* Production & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rubro sales breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Ventas por Rubro de Sublimación</h3>
                <p className="text-xs text-slate-400">Distribución de ingresos generados en {monthsList[selectedMonth]}</p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400">{totalUnitsProduced} unidades producidas</span>
          </div>

          <div className="space-y-3">
            {Object.keys(categoryStats).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No hay ventas registradas para este mes.
              </div>
            ) : (
              Object.entries(categoryStats).map(([catKey, data]) => {
                const percent = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
                const label = CATEGORY_LABELS[catKey]?.label || catKey;

                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{data.units} u.</span>
                        <strong className="text-white font-mono">{formatCurrency(data.revenue)}</strong>
                        <span className="text-slate-500 text-[10px] w-9 text-right font-mono">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Materials consumed & Stock Valuation (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Consumo de Materiales en Producción</h3>
            <p className="text-xs text-slate-400">Insumos transformados durante el período</p>
          </div>

          <div className="space-y-2">
            {Object.entries(materialStats).length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Sin consumo de materiales registrado en pedidos este mes.
              </div>
            ) : (
              Object.entries(materialStats).map(([matKey, qty]) => (
                <div key={matKey} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{MATERIAL_LABELS[matKey] || matKey}</span>
                  <strong className="text-cyan-400 font-mono text-sm">{qty} unidades</strong>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Valorización Actual de Stock en Taller:</span>
              <strong className="text-white font-bold text-sm">{formatCurrency(currentInventoryValue)}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Insumos bajo nivel crítico:</span>
              <strong className={criticalProducts.length > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {criticalProducts.length} productos
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Financial Movements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">
                Movimientos Financieros y Cobranzas del Mes ({monthMovements.length} registros)
              </h3>
              <p className="text-xs text-slate-400">
                Cobranzas de pedidos, señas, pagos a proveedores y flujo de caja en {monthsList[selectedMonth]} {selectedYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF Completo</span>
            </button>
          </div>
        </div>

        {monthMovements.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800/80">
            No hay movimientos financieros registrados en {monthsList[selectedMonth]} {selectedYear}.
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Comprobante / Ref</th>
                  <th className="py-2.5 px-3">Entidad / Cliente</th>
                  <th className="py-2.5 px-3">Tipo de Movimiento</th>
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3">Medio de Pago</th>
                  <th className="py-2.5 px-3 text-right">Haber (Ingreso +)</th>
                  <th className="py-2.5 px-3 text-right">Debe (Egreso -)</th>
                  <th className="py-2.5 px-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {monthMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(m.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-white font-medium">
                      {m.referenceNumber || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {m.entityName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {m.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {m.concept}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize">
                      {m.paymentMethod || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                      {m.credit > 0 ? formatCurrency(m.credit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400 font-mono">
                      {m.debit > 0 ? formatCurrency(m.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-white font-mono">
                      {formatCurrency(m.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formal Printable Document Preview (formatted for clean window.print()) */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4 print-only">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white">REPORTE MENSUAL DE SUBLIMACIÓN Y STOCK</h1>
            <p className="text-xs text-slate-400">Período: {monthsList[selectedMonth]} {selectedYear}</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <span>Fecha de emisión: {new Date().toLocaleDateString('es-AR')}</span>
          </div>
        </div>

        {/* Printable table */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 border border-slate-800 rounded">
            <strong className="block text-slate-300 mb-1">Resumen Económico</strong>
            <p>Ventas Totales: {formatCurrency(totalRevenue)}</p>
            <p>Costo Insumos: {formatCurrency(totalCost)}</p>
            <p>Ganancia Bruta: {formatCurrency(grossProfit)} ({grossMargin.toFixed(1)}%)</p>
          </div>
          <div className="p-3 border border-slate-800 rounded">
            <strong className="block text-slate-300 mb-1">Producción y Stock</strong>
            <p>Unidades Producidas: {totalUnitsProduced}</p>
            <p>Compras a Proveedores: {formatCurrency(totalSupplierPurchases)}</p>
            <p>Insumos Críticos: {criticalProducts.length}</p>
          </div>
        </div>
      </div>

      {/* MODAL PARA GENERAR Y DESCARGAR REPORTE MENSUAL PDF */}
      <MonthlyReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        summary={reportSummary}
        monthSales={monthSales}
        monthOrders={monthOrders}
        monthPurchases={monthPurchases}
        monthMovements={monthMovements}
        criticalProducts={criticalProducts}
        settings={settings || StorageService.getSettings()}
        selectedMonthName={monthsList[selectedMonth]}
        selectedYear={selectedYear}
      />
    </div>
  );
};
