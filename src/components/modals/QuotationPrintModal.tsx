import React, { useRef, useState } from 'react';
import { X, Printer, Download, Flame, CheckCircle, Clock, Calculator, Sparkles, Layers } from 'lucide-react';
import { Quotation, QuotationItem } from '../../types';
import { StorageService, formatCurrency, AppSettings } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  settings: AppSettings;
}

export const QuotationPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quotation,
  settings
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [showTechnicalCostSheet, setShowTechnicalCostSheet] = useState(false);

  if (!isOpen || !quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[96vh]">
        {/* Modal Controls Bar (hidden during browser print) */}
        <div className="print:hidden px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
              Vista Previa de Presupuesto
            </span>
            <span className="text-xs text-slate-400 font-mono">({quotation.quoteNumber})</span>

            {/* Toggle: Modo Cliente vs Ficha Técnica de Taller */}
            <button
              type="button"
              onClick={() => setShowTechnicalCostSheet(!showTechnicalCostSheet)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                showTechnicalCostSheet
                  ? 'bg-orange-950 text-orange-300 border-orange-700'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{showTechnicalCostSheet ? 'Ficha de Taller (Con Costos)' : 'Modo Cliente (Formal)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar como PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            id="printable-quotation"
            className="w-full max-w-3xl bg-white text-slate-900 p-8 sm:p-10 rounded-lg shadow-xl print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs"
          >
            {/* Header with Logo and Company Info */}
            <div className="border-b-2 border-orange-500 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.workshopName}
                    className="h-16 w-auto max-w-[140px] object-contain rounded"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
                    <Flame className="w-8 h-8 fill-white/20" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                    {settings.workshopName}
                  </h1>
                  <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider mt-1">
                    Taller de Sublimación, Estampado Textil & Merchandising
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {settings.address} • CUIT: {settings.taxId}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Tel: {settings.phone} • Email: {settings.email}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right bg-orange-50 p-3 rounded-lg border border-orange-200 self-stretch sm:self-auto sm:min-w-[210px]">
                <span className="text-[10px] font-bold text-orange-800 uppercase tracking-widest block">
                  PRESUPUESTO FORMAL
                </span>
                <p className="text-lg font-black text-slate-900 font-mono tracking-tight">
                  {quotation.quoteNumber}
                </p>
                <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                  <p>Fecha de Emisión: <strong>{formatDate(quotation.createdAt)}</strong></p>
                  <p>Válido Hasta: <strong className="text-orange-700">{formatDate(quotation.validUntil)}</strong></p>
                  <p>Plazo Estimado: <strong>{quotation.estimatedDays} días hábiles</strong></p>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  PRESUPUESTADO PARA:
                </span>
                <p className="text-sm font-bold text-slate-900">{quotation.customerName}</p>
                {quotation.customerTaxId && (
                  <p className="text-slate-600">CUIT / DNI: <span className="font-mono">{quotation.customerTaxId}</span></p>
                )}
              </div>
              <div className="sm:text-right space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  DATOS DE CONTACTO:
                </span>
                {quotation.customerPhone && <p className="text-slate-700">Tel: {quotation.customerPhone}</p>}
                {quotation.customerEmail && <p className="text-slate-700">Email: {quotation.customerEmail}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-left rounded-l">Ítem / Producto</th>
                    <th className="py-2.5 px-2 text-center">Tipo</th>
                    <th className="py-2.5 px-2 text-center">Talle / Color</th>
                    <th className="py-2.5 px-2 text-center">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-3 text-right rounded-r">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {quotation.items.map((item: QuotationItem, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {item.designImage && (
                            <img
                              src={item.designImage}
                              alt="Diseño"
                              className="w-10 h-10 object-contain rounded border border-slate-300 p-0.5 bg-white shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            {item.designName && (
                              <p className="text-[10px] text-orange-700 font-semibold">
                                Diseño: {item.designName}
                              </p>
                            )}
                            {item.designNotes && (
                              <p className="text-[10px] text-slate-500 italic">
                                {item.designNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          item.saleMode === 'lisa'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.saleMode === 'lisa' ? 'Prenda Lisa' : 'Con Estampado'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">
                        {item.size || item.color ? `${item.size || ''} ${item.color ? `(${item.color})` : ''}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Financial Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t-2 border-slate-200 pt-4 mb-6">
              <div className="flex-1 space-y-2 text-[10px] text-slate-600">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 uppercase block mb-1">
                    Condiciones de Pago & Banco
                  </span>
                  <p className="text-slate-700">{quotation.paymentTerms || settings.termsAndConditions}</p>
                  {settings.bankDetails && (
                    <p className="font-mono text-slate-800 mt-1 font-semibold">{settings.bankDetails}</p>
                  )}
                </div>

                {quotation.notes && (
                  <p className="italic text-slate-500">
                    * Nota: {quotation.notes}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento:</span>
                    <span className="font-mono">-{formatCurrency(quotation.discountAmount)}</span>
                  </div>
                )}
                {quotation.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>IVA ({quotation.taxPercent}%):</span>
                    <span className="font-mono">{formatCurrency(quotation.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-center text-sm">
                  <span className="font-black text-slate-900">TOTAL:</span>
                  <span className="font-mono font-black text-orange-600 text-base">
                    {formatCurrency(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Technical Workshop Cost Sheet */}
            {showTechnicalCostSheet && (
              <div className="border-t-2 border-orange-400 pt-5 mt-6 mb-6 bg-orange-50/40 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-orange-200">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-orange-600" />
                    <span className="font-bold text-orange-900 uppercase text-[11px] tracking-wider">
                      Ficha Técnica de Fabricación & Análisis de Costos (Uso Interno de Taller)
                    </span>
                  </div>
                  <span className="text-[10px] text-orange-700 font-semibold">
                    Insumos + Flete + Papel + Tinta + Luz + Margen
                  </span>
                </div>

                <table className="w-full text-[10px] border-collapse mb-3">
                  <thead>
                    <tr className="bg-orange-100/80 text-orange-950 font-bold border-b border-orange-200">
                      <th className="py-1.5 px-2 text-left">Ítem / Trabajo</th>
                      <th className="py-1.5 px-1 text-center">Cant.</th>
                      <th className="py-1.5 px-1 text-right">Insumo</th>
                      <th className="py-1.5 px-1 text-right">Flete</th>
                      <th className="py-1.5 px-1 text-right">Papel</th>
                      <th className="py-1.5 px-1 text-right">Tinta</th>
                      <th className="py-1.5 px-1 text-right">Luz</th>
                      <th className="py-1.5 px-1 text-right">Costo Unit.</th>
                      <th className="py-1.5 px-1 text-right">Precio Venta</th>
                      <th className="py-1.5 px-2 text-right">Margen % (Ganancia)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-200/60">
                    {quotation.items.map((item, idx) => {
                      const cb = item.costBreakdown;
                      const unitCost = cb ? cb.totalUnitCost : (item.unitCost || Math.round(item.unitPrice * 0.4));
                      const profitUnit = item.unitPrice - unitCost;
                      const marginPct = unitCost > 0 ? Math.round((profitUnit / unitCost) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-orange-100/40">
                          <td className="py-1.5 px-2 font-semibold text-slate-800">
                            {item.productName} {item.saleMode === 'lisa' ? '(Lisa)' : '(Estampada)'}
                          </td>
                          <td className="py-1.5 px-1 text-center font-bold text-slate-700">{item.quantity}</td>
                          <td className="py-1.5 px-1 text-right font-mono text-slate-600">${cb?.baseProductCost || '-'}</td>
                          <td className="py-1.5 px-1 text-right font-mono text-slate-600">${cb?.shippingCost || '-'}</td>
                          <td className="py-1.5 px-1 text-right font-mono text-slate-600">${cb?.paperCost || '-'}</td>
                          <td className="py-1.5 px-1 text-right font-mono text-slate-600">${cb?.inkCost || '-'}</td>
                          <td className="py-1.5 px-1 text-right font-mono text-slate-600">${cb?.electricityCost || '-'}</td>
                          <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-900">${unitCost}</td>
                          <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-900">${item.unitPrice}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-800">
                            {marginPct}% (+{formatCurrency(profitUnit * item.quantity)})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {quotation.totalCost ? (
                  <div className="flex justify-between items-center bg-white p-2.5 rounded border border-orange-200 text-[11px]">
                    <span className="text-slate-600">
                      Costo Total Producción Taller: <strong className="font-mono text-slate-900">{formatCurrency(quotation.totalCost)}</strong>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Ganancia Neta Proyectada: +{formatCurrency((quotation.totalAmount || 0) - quotation.totalCost)}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Signature and Approval Line */}
            <div className="border-t border-dashed border-slate-300 pt-8 mt-6 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
              <div>
                <div className="w-44 border-b border-slate-400 mx-auto mb-1.5 h-8"></div>
                <p className="font-bold text-slate-800">Firma & Sello Taller</p>
                <p>{settings.workshopName}</p>
              </div>
              <div>
                <div className="w-44 border-b border-slate-400 mx-auto mb-1.5 h-8"></div>
                <p className="font-bold text-slate-800">Firma de Conformidad / Aprobación</p>
                <p>{quotation.customerName}</p>
              </div>
            </div>

            {/* Footer watermark */}
            <div className="mt-8 text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3">
              Documento comercial formal generado con SubliStock Pro • {settings.website || 'www.sublistock.com'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
