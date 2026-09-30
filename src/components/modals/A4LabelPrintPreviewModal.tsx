import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  X,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  AlignCenter,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Tag,
  Sparkles
} from 'lucide-react';
import { ProductItem, ProductLabelSettings } from '../../types';
import { AppSettings, StorageService } from '../../services/storageService';
import { LabelPrintService, LabelPrintItem } from '../../services/labelPrintService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: LabelPrintItem[];
  labelConfig: ProductLabelSettings;
  settings: AppSettings;
  onUpdateConfig: (newConfig: ProductLabelSettings) => void;
  onSaveConfigPermanently: (newConfig: ProductLabelSettings) => void;
  startOffset?: number;
  onUpdateOffset?: (offset: number) => void;
}

export const A4LabelPrintPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  labelConfig,
  settings,
  onUpdateConfig,
  onSaveConfigPermanently,
  startOffset = 0,
  onUpdateOffset
}) => {
  // Local working copy of margins & layout
  const [margins, setMargins] = useState({
    marginTopMm: labelConfig.marginTopMm ?? 12,
    marginBottomMm: labelConfig.marginBottomMm ?? labelConfig.marginTopMm ?? 12,
    marginLeftMm: labelConfig.marginLeftMm ?? 6,
    marginRightMm: labelConfig.marginRightMm ?? labelConfig.marginLeftMm ?? 6,
    gapHorizontalMm: labelConfig.gapHorizontalMm ?? 3,
    gapVerticalMm: labelConfig.gapVerticalMm ?? 0,
    showBorder: labelConfig.showBorder ?? true
  });

  const [currentOffset, setCurrentOffset] = useState<number>(startOffset);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '50' | '75' | '100'>('fit');
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync state if props change
  useEffect(() => {
    if (isOpen) {
      setMargins({
        marginTopMm: labelConfig.marginTopMm ?? 12,
        marginBottomMm: labelConfig.marginBottomMm ?? labelConfig.marginTopMm ?? 12,
        marginLeftMm: labelConfig.marginLeftMm ?? 6,
        marginRightMm: labelConfig.marginRightMm ?? labelConfig.marginLeftMm ?? 6,
        gapHorizontalMm: labelConfig.gapHorizontalMm ?? 3,
        gapVerticalMm: labelConfig.gapVerticalMm ?? 0,
        showBorder: labelConfig.showBorder ?? true
      });
      setCurrentOffset(startOffset);
      setCurrentPage(0);
    }
  }, [isOpen, labelConfig, startOffset]);

  // Flatten items into single label stream
  const labelList: ProductItem[] = useMemo(() => {
    const list: ProductItem[] = [];
    for (const item of items) {
      for (let q = 0; q < Math.max(1, item.quantity); q++) {
        list.push(item.product);
      }
    }
    return list;
  }, [items]);

  const columns = Math.max(1, labelConfig.columns || 3);
  const rows = Math.max(1, labelConfig.rows || 8);
  const labelWidthMm = labelConfig.labelWidthMm || 64;
  const labelHeightMm = labelConfig.labelHeightMm || 33.8;
  const labelsPerPage = columns * rows;

  const totalSlots = currentOffset + labelList.length;
  const totalPages = Math.max(1, Math.ceil(totalSlots / labelsPerPage));

  // Compute printable bounding box check
  const totalGridWidthMm =
    margins.marginLeftMm + margins.marginRightMm + columns * labelWidthMm + (columns - 1) * margins.gapHorizontalMm;
  const totalGridHeightMm =
    margins.marginTopMm + margins.marginBottomMm + rows * labelHeightMm + (rows - 1) * margins.gapVerticalMm;

  const exceedsWidth = totalGridWidthMm > 210.5;
  const exceedsHeight = totalGridHeightMm > 297.5;

  // Pre-generate barcode data URLs for preview
  const barcodeMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of items) {
      const code = item.product.sku || item.product.id;
      if (!map[code] && labelConfig.includeBarcode) {
        map[code] = LabelPrintService.generateBarcodeImage(code, labelConfig.barcodeFormat);
      }
    }
    return map;
  }, [items, labelConfig.includeBarcode, labelConfig.barcodeFormat]);

  if (!isOpen) return null;

  // Auto-center margins symmetrically on A4
  const handleAutoCenter = () => {
    const gridContentWidth = columns * labelWidthMm + (columns - 1) * margins.gapHorizontalMm;
    const remainingWidth = Math.max(0, 210 - gridContentWidth);
    const symmetricHoriz = Math.round((remainingWidth / 2) * 10) / 10;

    const gridContentHeight = rows * labelHeightMm + (rows - 1) * margins.gapVerticalMm;
    const remainingHeight = Math.max(0, 297 - gridContentHeight);
    const symmetricVert = Math.round((remainingHeight / 2) * 10) / 10;

    const updated = {
      ...margins,
      marginLeftMm: symmetricHoriz,
      marginRightMm: symmetricHoriz,
      marginTopMm: symmetricVert,
      marginBottomMm: symmetricVert
    };
    setMargins(updated);
    notifyParent(updated);
  };

  // Reset to default presets
  const handleResetDefaults = () => {
    const def = {
      marginTopMm: 12,
      marginBottomMm: 12,
      marginLeftMm: 6,
      marginRightMm: 6,
      gapHorizontalMm: 3,
      gapVerticalMm: 0,
      showBorder: true
    };
    setMargins(def);
    notifyParent(def);
  };

  const notifyParent = (updatedMargins: typeof margins) => {
    const updatedConfig: ProductLabelSettings = {
      ...labelConfig,
      ...updatedMargins
    };
    onUpdateConfig(updatedConfig);
  };

  const handleMarginChange = (key: keyof typeof margins, val: number | boolean) => {
    const updated = {
      ...margins,
      [key]: val
    };
    setMargins(updated);
    notifyParent(updated);
  };

  const handleSavePermanently = () => {
    const updatedConfig: ProductLabelSettings = {
      ...labelConfig,
      ...margins
    };
    onSaveConfigPermanently(updatedConfig);
    setSaveSuccessMessage('¡Márgenes guardados exitosamente en la configuración!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Generate and download PDF
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        const mergedConfig: ProductLabelSettings = {
          ...labelConfig,
          ...margins
        };
        const doc = LabelPrintService.generateA4Pdf(items, mergedConfig, settings, {
          startOffset: currentOffset
        });
        doc.save(`SubliStock_Etiquetas_A4_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (err) {
        console.error('Error generating PDF:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  // Direct print via browser print dialog
  const handleDirectPrint = () => {
    window.print();
  };

  // Build the slots for the currently viewed page
  const pageStartSlot = currentPage * labelsPerPage;
  const pageSlots = Array.from({ length: labelsPerPage }).map((_, idx) => {
    const slotIndex = pageStartSlot + idx;
    if (slotIndex < currentOffset) {
      return { type: 'offset', slotIndex };
    }
    const prodIdx = slotIndex - currentOffset;
    if (prodIdx < labelList.length) {
      return { type: 'product', product: labelList[prodIdx], slotIndex };
    }
    return { type: 'empty', slotIndex };
  });

  // Scale factor for preview CSS
  // A4 is 210mm x 297mm.
  // We calculate a base mm-to-pixel ratio.
  const mmToPx = zoomLevel === '50' ? 1.9 : zoomLevel === '75' ? 2.85 : zoomLevel === '100' ? 3.8 : 2.5;

  const a4WidthPx = 210 * mmToPx;
  const a4HeightPx = 297 * mmToPx;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight">
                  Vista Previa de Impresión Hoja A4 & Calibrador de Márgenes
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  A4: 210 × 297 mm
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Simulación milimétrica exacta con los elementos configurados. Calibra los márgenes antes de enviar a la impresora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alert / Notification Bar if margins saved */}
        {saveSuccessMessage && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Main Body: Sidebar Controls + Center A4 Canvas */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 print:block">
          {/* LEFT PANEL: MARGIN & PRINT CONTROLS (4 cols) */}
          <div className="lg:col-span-4 bg-slate-950/70 border-r border-slate-800/80 p-4 overflow-y-auto space-y-4 print:hidden text-xs">
            {/* Quick Summary Badge */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacidad por Hoja</span>
                <span className="text-base font-black text-white">{columns * rows} etiquetas</span>
                <span className="text-[10px] text-slate-400 block">({columns} col × {rows} filas)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total a Imprimir</span>
                <span className="text-base font-black text-emerald-400">{labelList.length} etiquetas</span>
                <span className="text-[10px] text-slate-400 block">({totalPages} {totalPages === 1 ? 'hoja' : 'hojas'})</span>
              </div>
            </div>

            {/* Warnings if exceeding A4 sheet */}
            {(exceedsWidth || exceedsHeight) && (
              <div className="p-3 bg-rose-950/80 border border-rose-600/70 rounded-xl text-rose-200 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>¡Advertencia de Desborde de Hoja!</span>
                </div>
                {exceedsWidth && (
                  <p>El ancho total ({totalGridWidthMm.toFixed(1)} mm) supera los 210 mm de la hoja A4.</p>
                )}
                {exceedsHeight && (
                  <p>El alto total ({totalGridHeightMm.toFixed(1)} mm) supera los 297 mm de la hoja A4.</p>
                )}
                <button
                  type="button"
                  onClick={handleAutoCenter}
                  className="mt-1 underline text-rose-200 hover:text-white font-semibold"
                >
                  Haz clic aquí para centrar y reducir márgenes
                </button>
              </div>
            )}

            {/* MARGIN ADJUSTMENTS CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ajuste de Márgenes A4 (mm)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoCenter}
                  className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                  title="Calcula márgenes simétricos para centrar la grilla en la hoja"
                >
                  <AlignCenter className="w-3 h-3" />
                  <span>Centrar</span>
                </button>
              </div>

              {/* Top & Bottom Margin */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Margen Superior:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={0.5}
                      value={margins.marginTopMm}
                      onChange={e => handleMarginChange('marginTopMm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-400">mm</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Margen Inferior:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={0.5}
                      value={margins.marginBottomMm}
                      onChange={e => handleMarginChange('marginBottomMm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-400">mm</span>
                  </div>
                </div>
              </div>

              {/* Left & Right Margin */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Margen Izquierdo:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={0.5}
                      value={margins.marginLeftMm}
                      onChange={e => handleMarginChange('marginLeftMm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-400">mm</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Margen Derecho:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={0.5}
                      value={margins.marginRightMm}
                      onChange={e => handleMarginChange('marginRightMm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-400">mm</span>
                  </div>
                </div>
              </div>

              {/* Gaps Between Labels */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Espaciado Horiz.:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={margins.gapHorizontalMm}
                      onChange={e => handleMarginChange('gapHorizontalMm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-400">mm</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Espaciado Vert.:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={margins.gapVerticalMm}
                      onChange={e => handleMarginChange('gapVerticalMm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-400">mm</span>
                  </div>
                </div>
              </div>

              {/* Start Offset (Salto Inicial para rehusar hojas) */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  Salto inicial (Posición donde empezar a imprimir):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={labelsPerPage - 1}
                    value={currentOffset}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setCurrentOffset(val);
                      if (onUpdateOffset) onUpdateOffset(val);
                    }}
                    className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Saltea etiquetas si la hoja adhesiva ya fue usada previamente.
                  </span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={margins.showBorder}
                    onChange={e => handleMarginChange('showBorder', e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <span className="text-slate-300 text-[11px]">Mostrar borde tenue / guía de corte</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={e => setShowGuides(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <span className="text-slate-300 text-[11px]">Ver líneas guía de márgenes en pantalla</span>
                </label>
              </div>

              {/* Buttons: Auto Center & Reset */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1 text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer estándar</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePermanently}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold flex items-center gap-1.5 transition-colors border border-slate-700 text-[11px]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Márgenes</span>
                </button>
              </div>
            </div>

            {/* Elements Configured in each Label */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 text-[10px] text-slate-400">
              <span className="font-bold text-slate-300 block uppercase tracking-wider text-[9px]">
                Elementos activos en cada etiqueta:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {labelConfig.includeLogo && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-medium">✓ Logo</span>}
                {labelConfig.includeWorkshopName && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-medium">✓ Empresa</span>}
                {labelConfig.includeProductName && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-medium">✓ Producto</span>}
                {labelConfig.includeSku && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-medium">✓ SKU</span>}
                {labelConfig.includeBarcode && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-medium">✓ Código ({labelConfig.barcodeFormat})</span>}
                {labelConfig.includePrice && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-medium">✓ Precio ({labelConfig.pricePrefix})</span>}
              </div>
            </div>
          </div>

          {/* RIGHT / MAIN CANVAS: REALISTIC A4 PREVIEW (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950 flex flex-col overflow-hidden relative">
            {/* Canvas Toolbar: Zoom & Page Navigation */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden">
              {/* Pagination */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-200 font-mono">
                  Hoja {currentPage + 1} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] hidden sm:inline">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel('fit')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    zoomLevel === 'fit' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Ajustar
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('50')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    zoomLevel === '50' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('75')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    zoomLevel === '75' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('100')}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    zoomLevel === '100' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  100% Real
                </button>
              </div>
            </div>

            {/* A4 Sheet Container Area with scroll */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950/90 min-h-[460px] print:p-0 print:m-0 print:bg-white">
              {/* THE SIMULATED A4 PAPER SHEET */}
              <div
                className="bg-white text-slate-900 rounded-sm shadow-2xl relative select-none transition-all print:shadow-none print:m-0 print:border-none"
                style={{
                  width: `${a4WidthPx}px`,
                  height: `${a4HeightPx}px`,
                  minWidth: `${a4WidthPx}px`,
                  minHeight: `${a4HeightPx}px`,
                  boxSizing: 'border-box'
                }}
              >
                {/* Visual Margin Guides (Dashed cyan lines) */}
                {showGuides && (
                  <>
                    {/* Top Guide */}
                    <div
                      className="absolute left-0 right-0 border-b border-dashed border-cyan-400/80 pointer-events-none z-20"
                      style={{ top: `${margins.marginTopMm * mmToPx}px` }}
                    >
                      <span className="text-[7px] text-cyan-700 bg-cyan-100/90 px-1 rounded absolute right-2 -top-3">
                        Sup: {margins.marginTopMm}mm
                      </span>
                    </div>

                    {/* Bottom Guide */}
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-cyan-400/80 pointer-events-none z-20"
                      style={{ bottom: `${margins.marginBottomMm * mmToPx}px` }}
                    >
                      <span className="text-[7px] text-cyan-700 bg-cyan-100/90 px-1 rounded absolute right-2 -bottom-3">
                        Inf: {margins.marginBottomMm}mm
                      </span>
                    </div>

                    {/* Left Guide */}
                    <div
                      className="absolute top-0 bottom-0 border-r border-dashed border-cyan-400/80 pointer-events-none z-20"
                      style={{ left: `${margins.marginLeftMm * mmToPx}px` }}
                    >
                      <span className="text-[7px] text-cyan-700 bg-cyan-100/90 px-0.5 rounded absolute -left-1 top-2 [writing-mode:vertical-rl]">
                        Izq: {margins.marginLeftMm}mm
                      </span>
                    </div>

                    {/* Right Guide */}
                    <div
                      className="absolute top-0 bottom-0 border-l border-dashed border-cyan-400/80 pointer-events-none z-20"
                      style={{ right: `${margins.marginRightMm * mmToPx}px` }}
                    />
                  </>
                )}

                {/* THE GRID OF LABELS ON THE A4 SHEET */}
                <div
                  className="absolute"
                  style={{
                    top: `${margins.marginTopMm * mmToPx}px`,
                    left: `${margins.marginLeftMm * mmToPx}px`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, ${labelWidthMm * mmToPx}px)`,
                    gridTemplateRows: `repeat(${rows}, ${labelHeightMm * mmToPx}px)`,
                    columnGap: `${margins.gapHorizontalMm * mmToPx}px`,
                    rowGap: `${margins.gapVerticalMm * mmToPx}px`
                  }}
                >
                  {pageSlots.map((slot, sIdx) => {
                    const isOffset = slot.type === 'offset';
                    const isEmpty = slot.type === 'empty';
                    const prod = slot.type === 'product' ? slot.product : null;

                    if (isOffset) {
                      return (
                        <div
                          key={sIdx}
                          className="border border-dashed border-slate-300 bg-slate-50/80 rounded-[2px] flex flex-col items-center justify-center text-slate-400 p-1"
                          style={{
                            width: `${labelWidthMm * mmToPx}px`,
                            height: `${labelHeightMm * mmToPx}px`
                          }}
                        >
                          <span className="text-[7px] font-mono text-slate-400 font-bold">
                            #{slot.slotIndex + 1} Salteada
                          </span>
                          <span className="text-[6px] text-slate-400/80">
                            (Hoja ya usada)
                          </span>
                        </div>
                      );
                    }

                    if (isEmpty || !prod) {
                      return (
                        <div
                          key={sIdx}
                          className="border border-dotted border-slate-200 bg-white/40 rounded-[2px] flex items-center justify-center text-slate-300"
                          style={{
                            width: `${labelWidthMm * mmToPx}px`,
                            height: `${labelHeightMm * mmToPx}px`
                          }}
                        >
                          <span className="text-[7px] text-slate-300">
                            #{slot.slotIndex + 1}
                          </span>
                        </div>
                      );
                    }

                    // Product Label Box
                    const barcodeImg = barcodeMap[prod.sku || prod.id];
                    const scaleFactor = mmToPx / 2.5;

                    return (
                      <div
                        key={sIdx}
                        className={`bg-white rounded-[2px] overflow-hidden flex flex-col justify-between p-1 transition-all ${
                          margins.showBorder ? 'border border-dashed border-slate-300' : 'border border-transparent'
                        }`}
                        style={{
                          width: `${labelWidthMm * mmToPx}px`,
                          height: `${labelHeightMm * mmToPx}px`,
                          textAlign: labelConfig.textAlign
                        }}
                      >
                        {/* 1. Header: Logo & Workshop */}
                        {(labelConfig.includeLogo || labelConfig.includeWorkshopName) && (
                          <div
                            className={`flex items-center gap-1 ${
                              labelConfig.textAlign === 'center' ? 'justify-center' : 'justify-start'
                            }`}
                            style={{ marginBottom: `${1 * scaleFactor}px` }}
                          >
                            {labelConfig.includeLogo && settings.logoUrl && (
                              <img
                                src={settings.logoUrl}
                                alt="Logo"
                                className="object-contain"
                                style={{ height: `${3.5 * scaleFactor}px`, width: 'auto' }}
                              />
                            )}
                            {labelConfig.includeWorkshopName && (
                              <span
                                className="font-black uppercase text-slate-600 truncate"
                                style={{ fontSize: `${Math.max(5, 5.5 * scaleFactor)}px` }}
                              >
                                {settings.workshopName || 'SubliStudio'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 2. Product Name */}
                        {labelConfig.includeProductName && (
                          <div
                            className="font-black text-slate-900 leading-tight line-clamp-2"
                            style={{
                              fontSize:
                                labelConfig.fontSize === 'small'
                                  ? `${Math.max(6, 6.5 * scaleFactor)}px`
                                  : labelConfig.fontSize === 'large'
                                  ? `${Math.max(7.5, 9 * scaleFactor)}px`
                                  : `${Math.max(6.5, 7.5 * scaleFactor)}px`
                            }}
                          >
                            {prod.name}
                          </div>
                        )}

                        {/* 3. SKU / Size / Color */}
                        {(labelConfig.includeSku || labelConfig.includeSizeColor) && (
                          <div
                            className="text-slate-500 font-medium truncate"
                            style={{ fontSize: `${Math.max(5, 5 * scaleFactor)}px` }}
                          >
                            {labelConfig.includeSku && <span>SKU: {prod.sku}</span>}
                            {labelConfig.includeSku && labelConfig.includeSizeColor && (prod.size || prod.color) && (
                              <span> • </span>
                            )}
                            {labelConfig.includeSizeColor && (
                              <span>{[prod.size, prod.color].filter(Boolean).join('/')}</span>
                            )}
                          </div>
                        )}

                        {/* 4. Barcode graphic */}
                        {labelConfig.includeBarcode && (
                          <div className="flex flex-col items-center justify-center my-0.5">
                            {barcodeImg ? (
                              <img
                                src={barcodeImg}
                                alt="Barcode"
                                className="object-contain"
                                style={{
                                  height: `${Math.min(22, 6.5 * scaleFactor)}px`,
                                  maxWidth: '92%'
                                }}
                              />
                            ) : (
                              <div
                                className="bg-slate-100 flex items-center justify-center text-[5px] text-slate-400 font-mono"
                                style={{ height: `${6 * scaleFactor}px`, width: '80%' }}
                              >
                                |||| |||||| ||||
                              </div>
                            )}
                            {labelConfig.showBarcodeValue && (
                              <span
                                className="font-mono text-slate-700 tracking-wider font-semibold"
                                style={{ fontSize: `${Math.max(4.5, 4.8 * scaleFactor)}px` }}
                              >
                                {prod.sku || prod.id}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 5. Price Tag */}
                        {labelConfig.includePrice && (
                          <div
                            className={`flex items-baseline gap-0.5 ${
                              labelConfig.textAlign === 'center' ? 'justify-center' : 'justify-start'
                            }`}
                          >
                            <span
                              className="font-bold text-slate-600"
                              style={{ fontSize: `${Math.max(5, 6 * scaleFactor)}px` }}
                            >
                              {labelConfig.pricePrefix}
                            </span>
                            <span
                              className="font-black text-slate-950 tracking-tight"
                              style={{
                                fontSize:
                                  labelConfig.fontSize === 'small'
                                    ? `${Math.max(7, 8 * scaleFactor)}px`
                                    : labelConfig.fontSize === 'large'
                                    ? `${Math.max(9, 11 * scaleFactor)}px`
                                    : `${Math.max(8, 9.5 * scaleFactor)}px`
                              }}
                            >
                              {prod.salePrice.toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}

                        {/* 6. Custom text */}
                        {labelConfig.includeCustomText && labelConfig.customText && (
                          <div
                            className="text-slate-400 italic text-center truncate border-t border-slate-100 pt-0.5"
                            style={{ fontSize: `${Math.max(4, 4.5 * scaleFactor)}px` }}
                          >
                            {labelConfig.customText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>
              Dimensiones: <strong className="text-white">{labelWidthMm} × {labelHeightMm} mm</strong>
            </span>
            <span>•</span>
            <span>
              Márgenes: <strong className="text-white">Sup {margins.marginTopMm}mm / Lat {margins.marginLeftMm}mm</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={labelList.length === 0 || isGeneratingPdf}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF A4 Calibrado'}</span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={labelList.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Enviar a la Impresora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
