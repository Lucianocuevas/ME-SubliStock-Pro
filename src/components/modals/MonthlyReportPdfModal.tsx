import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  Calendar,
  CheckSquare,
  Square,
  DollarSign,
  TrendingUp,
  Activity,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Building
} from 'lucide-react';
import {
  ProductItem,
  CustomerOrder,
  DailySale,
  PurchaseOrder,
  AccountMovement,
  MonthlyReportSummary
} from '../../types';
import { ExportService } from '../../services/exportService';
import { formatCurrency, AppSettings } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summary: MonthlyReportSummary;
  monthSales: DailySale[];
  monthOrders: CustomerOrder[];
  monthPurchases: PurchaseOrder[];
  monthMovements: AccountMovement[];
  criticalProducts: ProductItem[];
  settings?: AppSettings;
  selectedMonthName: string;
  selectedYear: number;
}

export const MonthlyReportPdfModal: React.FC<Props> = ({
  isOpen,
  onClose,
  summary,
  monthSales,
  monthOrders,
  monthPurchases,
  monthMovements,
  criticalProducts,
  settings,
  selectedMonthName,
  selectedYear
}) => {
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeSales, setIncludeSales] = useState(true);
  const [includeOrders, setIncludeOrders] = useState(true);
  const [includeMovements, setIncludeMovements] = useState(true);
  const [includePurchases, setIncludePurchases] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Clean up blob URL on unmount or close
  React.useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  if (!isOpen) return null;

  const totalCollections = monthMovements
    .filter(m => m.credit > 0)
    .reduce((sum, m) => sum + m.credit, 0);

  const generatePdfDocument = (saveToFile: boolean) => {
    return ExportService.exportMonthlySalesAndMovementsPDF(
      summary,
      monthSales,
      monthOrders,
      monthPurchases,
      monthMovements,
      criticalProducts,
      settings,
      {
        includeExecutiveSummary,
        includeSales,
        includeOrders,
        includeMovements,
        includePurchases,
        includeAlerts,
        saveToFile
      }
    );
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generatePdfDocument(true);
      } catch (err) {
        console.error('Error generating PDF:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleGeneratePreview = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        if (previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl);
        }
        const doc = generatePdfDocument(false);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
        setActiveTab('preview');
      } catch (err) {
        console.error('Error opening print preview:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Generar Reporte Mensual de Ventas y Movimientos (PDF)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Documento contable formal generado con jsPDF para el período: <strong className="text-white">{selectedMonthName} {selectedYear}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 pb-0 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-rose-500 text-rose-400 bg-slate-950/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Configuración y Secciones</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!previewPdfUrl) {
                handleGeneratePreview();
              } else {
                setActiveTab('preview');
              }
            }}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-rose-500 text-rose-400 bg-slate-950/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Vista Previa del Documento</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'preview' ? (
            <div className="space-y-4">
              {previewPdfUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800">
                    <span>
                      Vista previa del documento A4 generado para <strong>{selectedMonthName} {selectedYear}</strong>:
                    </span>
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      disabled={isGenerating}
                      className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>Regenerar Vista Previa</span>
                    </button>
                  </div>
                  <div className="w-full h-[60vh] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                    <iframe
                      src={previewPdfUrl}
                      className="w-full h-full rounded-xl bg-white"
                      title="Vista Previa de Reporte Mensual PDF"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <FileText className="w-10 h-10 text-rose-400 mx-auto opacity-70" />
                  <p className="text-xs text-slate-300">
                    Aún no se ha generado la vista previa del documento.
                  </p>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Generar Vista Previa Ahora
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick Metrics of the Period */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Ventas Totales</span>
                  <strong className="text-sm font-black text-white">{formatCurrency(summary.totalSalesRevenue)}</strong>
                  <span className="text-[10px] text-slate-500 block">Mostrador + Pedidos</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Ganancia Bruta</span>
                  <strong className="text-sm font-black text-emerald-400">{formatCurrency(summary.estimatedGrossProfit)}</strong>
                  <span className="text-[10px] text-emerald-500/80 block">{summary.grossMarginPercent.toFixed(1)}% margen</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Cobranzas Percibidas</span>
                  <strong className="text-sm font-black text-cyan-400">{formatCurrency(totalCollections)}</strong>
                  <span className="text-[10px] text-slate-500 block">{monthMovements.length} movimientos</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Inversión Insumos</span>
                  <strong className="text-sm font-black text-purple-400">{formatCurrency(summary.totalSupplierPurchases)}</strong>
                  <span className="text-[10px] text-slate-500 block">{monthPurchases.length} compras</span>
                </div>
              </div>

              {/* Configuration Checkboxes */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <span>Secciones a Incluir en el Documento PDF:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeExecutiveSummary}
                      onChange={e => setIncludeExecutiveSummary(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500/30"
                    />
                    <div>
                      <span className="font-bold text-white block">Resumen Ejecutivo y Métricas</span>
                      <span className="text-[11px] text-slate-400">Total facturado, margen bruto, stock e insumos</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeSales}
                      onChange={e => setIncludeSales(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500/30"
                    />
                    <div>
                      <span className="font-bold text-white block">Ventas Diarias de Mostrador</span>
                      <span className="text-[11px] text-slate-400">{monthSales.length} comprobantes con medios de pago</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeOrders}
                      onChange={e => setIncludeOrders(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500/30"
                    />
                    <div>
                      <span className="font-bold text-white block">Pedidos de Clientes a Producción</span>
                      <span className="text-[11px] text-slate-400">{monthOrders.length} pedidos con señas y saldos</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeMovements}
                      onChange={e => setIncludeMovements(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500/30"
                    />
                    <div>
                      <span className="font-bold text-white block">Libro de Movimientos & Cuentas</span>
                      <span className="text-[11px] text-slate-400">{monthMovements.length} asientos (cobros, señas, pagos)</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includePurchases}
                      onChange={e => setIncludePurchases(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500/30"
                    />
                    <div>
                      <span className="font-bold text-white block">Compras a Proveedores</span>
                      <span className="text-[11px] text-slate-400">{monthPurchases.length} órdenes de compra de insumos</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeAlerts}
                      onChange={e => setIncludeAlerts(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500/30"
                    />
                    <div>
                      <span className="font-bold text-white block">Insumos Críticos o Agotados</span>
                      <span className="text-[11px] text-slate-400">{criticalProducts.length} productos en alerta de stock</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Workshop branding info notice */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  El PDF incluirá membrete formal con los datos de tu empresa (<strong className="text-white">{settings?.workshopName || 'SubliStudio'}</strong>), CUIT, teléfono, dirección y paginación numerada.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Ver Vista Previa</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Reporte PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
