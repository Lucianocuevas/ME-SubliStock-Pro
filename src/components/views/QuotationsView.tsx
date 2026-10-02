import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Trash2,
  Search,
  Layers,
  Sparkles,
  Calculator,
  ChevronDown,
  ChevronUp,
  Percent,
  Truck,
  Zap,
  Package
} from 'lucide-react';
import { Quotation, QuotationStatus, QuotationItem, Customer, ProductItem } from '../../types';
import { StorageService, formatCurrency, AppSettings } from '../../services/storageService';

interface Props {
  quotations: Quotation[];
  customers: Customer[];
  products: ProductItem[];
  settings: AppSettings;
  onOpenNewQuotation: () => void;
  onViewPrintQuotation: (quote: Quotation) => void;
  onQuotationsUpdated: () => void;
  onOrderCreatedFromQuote?: () => void;
}

export const QuotationsView: React.FC<Props> = ({
  quotations,
  customers,
  products,
  settings,
  onOpenNewQuotation,
  onViewPrintQuotation,
  onQuotationsUpdated,
  onOrderCreatedFromQuote
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedCostQuoteId, setExpandedCostQuoteId] = useState<string | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quotation | null>(null);

  const filtered = quotations.filter(q => {
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: QuotationStatus) => {
    StorageService.updateQuotation(id, { status: newStatus });
    onQuotationsUpdated();
  };

  const confirmDeleteQuote = () => {
    if (quoteToDelete) {
      StorageService.deleteQuotation(quoteToDelete.id);
      setQuoteToDelete(null);
      onQuotationsUpdated();
    }
  };

  const handleConvertToOrder = (quote: Quotation) => {
    const today = new Date();
    const delivery = new Date(today);
    delivery.setDate(delivery.getDate() + (quote.estimatedDays || 5));
    const deliveryDateStr = delivery.toISOString().split('T')[0];

    const customer = customers.find(c => c.name === quote.customerName || c.id === quote.customerId);
    const customerId = customer ? customer.id : (quote.customerId || 'cust-' + Date.now());

    // Map quotation items to customer order items with accurate unit cost
    const orderItems = quote.items.map((item: QuotationItem) => {
      const prod = products.find(p => p.id === item.productId);
      const accurateUnitCost = item.costBreakdown?.totalUnitCost || item.unitCost || prod?.costPrice || Math.round(item.unitPrice * 0.4);
      return {
        productId: item.productId,
        productName: item.productName,
        saleMode: item.saleMode,
        material: prod?.material,
        category: prod?.category,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: accurateUnitCost,
        totalPrice: item.totalPrice,
        customizationDetails: item.designNotes || item.designName,
        designImage: item.designImage,
        designName: item.designName
      };
    });

    const costTotal = orderItems.reduce((acc: number, curr) => acc + (curr.unitCost * curr.quantity), 0);

    StorageService.addCustomerOrder({
      customerId,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone || 'Sin teléfono',
      deliveryDate: deliveryDateStr,
      deliveryTime: '17:00',
      productionStatus: 'diseno_pendiente',
      paymentStatus: 'seña',
      depositAmount: Math.round(quote.totalAmount * 0.5), // 50% standard deposit
      totalAmount: quote.totalAmount,
      costTotal,
      items: orderItems,
      notes: `Generado a partir del presupuesto ${quote.quoteNumber}. ${quote.notes || ''}`
    });

    // Mark quote as approved
    StorageService.updateQuotation(quote.id, { status: 'aprobado' });
    onQuotationsUpdated();

    alert(`¡Presupuesto ${quote.quoteNumber} convertido exitosamente en Pedido de Producción!`);
    if (onOrderCreatedFromQuote) {
      onOrderCreatedFromQuote();
    }
  };

  const totalQuoted = quotations.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const approvedQuoted = quotations.filter(q => q.status === 'aprobado').reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Presupuestos & Cotizaciones Membretadas</h2>
            <span className="text-xs bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded border border-orange-500/30">
              PDF Formal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Genera presupuestos con el logo del taller, especificación de prendas lisas o estampadas con diseño, y pásalos a producción con un clic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewQuotation}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-950/60 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Total Cotizado Histórico</span>
          <span className="text-xl font-black text-white font-mono mt-1 block">
            {formatCurrency(totalQuoted)}
          </span>
          <span className="text-[11px] text-slate-500">{quotations.length} presupuestos emitidos</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-emerald-400 font-medium block">Cotizaciones Aprobadas</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
            {formatCurrency(approvedQuoted)}
          </span>
          <span className="text-[11px] text-emerald-500/80">
            {quotations.filter(q => q.status === 'aprobado').length} aprobadas y convertidas
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-orange-400 font-medium block">Logo & Membrete Oficial</span>
          <p className="text-xs text-slate-300 mt-1 font-semibold truncate">
            {settings.workshopName}
          </p>
          <span className="text-[11px] text-slate-500">CUIT: {settings.taxId} • Tel: {settings.phone}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'borrador', 'enviado', 'aprobado', 'rechazado'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'all' ? 'Todos los estados' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-10 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold">No se encontraron presupuestos</p>
            <p className="text-xs text-slate-500 mt-1">Crea un presupuesto formal para enviar a tus clientes.</p>
          </div>
        ) : (
          filtered.map(q => {
            const statusColors: Record<string, { bg: string; text: string; border: string }> = {
              borrador: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' },
              enviado: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-700' },
              aprobado: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-700' },
              rechazado: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-700' },
              vencido: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-700' }
            };
            const sc = statusColors[q.status] || statusColors.enviado;

            return (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-mono font-bold text-xs shrink-0">
                      COT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{q.quoteNumber}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full border uppercase font-bold ${sc.bg} ${sc.text} ${sc.border}`}>
                          {q.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5">
                        {q.customerName} {q.customerPhone ? `· ${q.customerPhone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onViewPrintQuotation(q)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Ver e Imprimir Membretado / Guardar como PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-orange-400" />
                      <span>Imprimir Membretado</span>
                    </button>

                    {q.status !== 'aprobado' && (
                      <button
                        onClick={() => handleConvertToOrder(q)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Aprobar y crear orden de producción con reserva de insumos"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Pasar a Producción</span>
                      </button>
                    )}

                    <select
                      value={q.status}
                      onChange={e => handleStatusChange(q.id, e.target.value as QuotationStatus)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-500"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="enviado">Enviado</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="rechazado">Rechazado</option>
                      <option value="vencido">Vencido</option>
                    </select>

                    <button
                      onClick={() => setQuoteToDelete(q)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      title="Eliminar presupuesto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                  {q.items.map((item: QuotationItem, idx: number) => (
                    <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2.5 text-xs">
                      {item.designImage ? (
                        <img
                          src={item.designImage}
                          alt="Diseño"
                          className="w-9 h-9 object-contain rounded border border-orange-500/40 p-0.5 bg-slate-900 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
                          {item.saleMode === 'lisa' ? 'LISA' : 'STP'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-200 truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} un. x {formatCurrency(item.unitPrice)}
                          <span className={`ml-1.5 font-bold ${item.saleMode === 'lisa' ? 'text-cyan-400' : 'text-orange-400'}`}>
                            ({item.saleMode === 'lisa' ? 'Lisa' : 'Estampada'})
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary footer */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span>Válido hasta: <strong className="text-slate-200">{new Date(q.validUntil).toLocaleDateString('es-AR')}</strong></span>
                    <span>Plazo entrega: <strong className="text-slate-200">{q.estimatedDays} días hábiles</strong></span>
                    <button
                      type="button"
                      onClick={() => setExpandedCostQuoteId(expandedCostQuoteId === q.id ? null : q.id)}
                      className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold text-[11px] bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/40"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>{expandedCostQuoteId === q.id ? 'Ocultar Costos del Trabajo' : 'Ver Desglose de Costos & Margen'}</span>
                      {expandedCostQuoteId === q.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {q.totalCost ? (
                      <span className="text-[11px] text-slate-400">
                        Costo Taller: <strong className="text-slate-300 font-mono">{formatCurrency(q.totalCost)}</strong> · Ganancia:{' '}
                        <strong className="text-emerald-400 font-mono">+{formatCurrency((q.totalAmount || 0) - q.totalCost)}</strong>
                      </span>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Total:</span>
                      <span className="font-mono font-bold text-orange-400 text-base">
                        {formatCurrency(q.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Workshop Cost Breakdown Details */}
                {expandedCostQuoteId === q.id && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-orange-500/30 space-y-3 pt-3 mt-1">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                        Análisis de Costos de Fabricación del Trabajo (Taller)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Cálculo unitario: Insumo + Flete + Hoja + Tinta + Electricidad + Extras
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {q.items.map((item, itemIdx) => {
                        const cb = item.costBreakdown;
                        const unitCost = cb ? cb.totalUnitCost : (item.unitCost || Math.round(item.unitPrice * 0.4));
                        const profitUnit = item.unitPrice - unitCost;
                        const marginPct = unitCost > 0 ? Math.round((profitUnit / unitCost) * 100) : 0;

                        return (
                          <div key={itemIdx} className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200">{item.productName}</span>
                              <span className="text-slate-400 font-mono">{item.quantity} unidades</span>
                            </div>

                            {cb ? (
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px] text-center">
                                <div className="bg-slate-950 p-1 rounded border border-slate-800/80">
                                  <span className="text-slate-500 block truncate">Insumo</span>
                                  <span className="text-slate-200 font-mono font-bold">${cb.baseProductCost}</span>
                                </div>
                                <div className="bg-slate-950 p-1 rounded border border-slate-800/80">
                                  <span className="text-slate-500 block truncate">Flete</span>
                                  <span className="text-slate-200 font-mono font-bold">${cb.shippingCost}</span>
                                </div>
                                <div className="bg-slate-950 p-1 rounded border border-slate-800/80">
                                  <span className="text-slate-500 block truncate">Hoja</span>
                                  <span className="text-slate-200 font-mono font-bold">${cb.paperCost}</span>
                                </div>
                                <div className="bg-slate-950 p-1 rounded border border-slate-800/80">
                                  <span className="text-slate-500 block truncate">Tinta</span>
                                  <span className="text-slate-200 font-mono font-bold">${cb.inkCost}</span>
                                </div>
                                <div className="bg-slate-950 p-1 rounded border border-slate-800/80">
                                  <span className="text-slate-500 block truncate">Luz/Plancha</span>
                                  <span className="text-slate-200 font-mono font-bold">${cb.electricityCost}</span>
                                </div>
                                <div className="bg-slate-950 p-1 rounded border border-slate-800/80">
                                  <span className="text-slate-500 block truncate">Extras</span>
                                  <span className="text-slate-200 font-mono font-bold">${cb.extraCost || 0}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400">
                                Costo directo unitario estimado: <strong className="text-slate-200">{formatCurrency(unitCost)}</strong>
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                              <span>
                                Costo Unit: <strong className="text-cyan-400 font-mono">{formatCurrency(unitCost)}</strong>
                              </span>
                              <span>
                                Precio Venta: <strong className="text-white font-mono">{formatCurrency(item.unitPrice)}</strong>
                              </span>
                              <span className="text-emerald-400 font-bold">
                                Ganancia: +{formatCurrency(profitUnit * item.quantity)} ({marginPct}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Quote Confirmation Modal */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">¿Eliminar Presupuesto?</h3>
                <p className="text-xs text-slate-400 font-mono">{quoteToDelete.quoteNumber} · {quoteToDelete.customerName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Confirmas que deseas eliminar este presupuesto por valor de <strong className="text-white">{formatCurrency(quoteToDelete.totalAmount)}</strong>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteQuote}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-rose-950/50"
              >
                Sí, Eliminar Presupuesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
