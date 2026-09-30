import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Barcode,
  Printer,
  Download,
  Eye,
  Sliders,
  CheckCircle2,
  Building,
  DollarSign,
  Type,
  LayoutGrid,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Check,
  Plus,
  Minus,
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { ProductItem, ProductLabelSettings, LabelPreset } from '../../../types';
import { AppSettings, StorageService, LABEL_PRESETS_CONFIG, DEFAULT_LABEL_SETTINGS } from '../../../services/storageService';
import { LabelPrintService, LabelPrintItem } from '../../../services/labelPrintService';

interface Props {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  showNotification: (msg: string) => void;
}

export const ProductLabelsTab: React.FC<Props> = ({
  settings,
  onSaveSettings,
  showNotification
}) => {
  const [labelConfig, setLabelConfig] = useState<ProductLabelSettings>(
    settings.labelSettings || DEFAULT_LABEL_SETTINGS
  );

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [printSelectionMode, setPrintSelectionMode] = useState<'all' | 'custom'>('custom');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [startOffset, setStartOffset] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Load products
  useEffect(() => {
    const prods = StorageService.getProducts();
    setProducts(prods);
    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
      // Initialize default quantities: 1 per product
      const initialQtys: Record<string, number> = {};
      prods.slice(0, 8).forEach(p => {
        initialQtys[p.id] = 1;
      });
      setQuantities(initialQtys);
    }
  }, []);

  // Sync when prop settings change
  useEffect(() => {
    if (settings.labelSettings) {
      setLabelConfig(settings.labelSettings);
    }
  }, [settings.labelSettings]);

  // Selected sample product for live preview
  const sampleProduct: ProductItem = useMemo(() => {
    const found = products.find(p => p.id === selectedProductId);
    if (found) return found;
    return {
      id: 'demo-sample-01',
      sku: 'TAZA-BLA-01',
      name: 'Taza de Cerámica Importada 11oz',
      category: 'tazas',
      material: 'ceramica',
      size: '11oz / 325ml',
      color: 'Blanco Brillante',
      unit: 'Unidades',
      currentStock: 48,
      minStock: 10,
      costPrice: 1800,
      salePrice: 4500,
      salePriceCustomized: 6800,
      description: 'Apta microondas y lavavajillas con polímero grado AAA.'
    };
  }, [products, selectedProductId]);

  // Live barcode preview data URL
  const sampleBarcodeUrl = useMemo(() => {
    if (!labelConfig.includeBarcode) return '';
    return LabelPrintService.generateBarcodeImage(
      sampleProduct.sku || sampleProduct.id,
      labelConfig.barcodeFormat
    );
  }, [sampleProduct, labelConfig.includeBarcode, labelConfig.barcodeFormat]);

  // Preset changer
  const handleApplyPreset = (preset: LabelPreset) => {
    if (preset === 'custom') {
      setLabelConfig(prev => ({ ...prev, preset: 'custom' }));
      return;
    }
    const presetConfig = LABEL_PRESETS_CONFIG[preset];
    if (presetConfig) {
      setLabelConfig(prev => ({
        ...prev,
        ...presetConfig,
        preset
      }));
    }
  };

  // Toggle field
  const toggleField = (key: keyof ProductLabelSettings) => {
    setLabelConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save changes
  const handleSaveConfig = () => {
    const updatedSettings: AppSettings = {
      ...settings,
      labelSettings: labelConfig
    };
    StorageService.saveSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    showNotification('Configuración de etiquetas guardada con éxito.');
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('¿Restablecer el formato de etiquetas a los valores recomendados de fábrica?')) {
      setLabelConfig(DEFAULT_LABEL_SETTINGS);
      const updated: AppSettings = {
        ...settings,
        labelSettings: DEFAULT_LABEL_SETTINGS
      };
      StorageService.saveSettings(updated);
      onSaveSettings(updated);
      showNotification('Formato de etiquetas restablecido al valor predeterminado.');
    }
  };

  // Calculate items to print
  const itemsToPrint: LabelPrintItem[] = useMemo(() => {
    if (printSelectionMode === 'all') {
      return products.map(p => ({
        product: p,
        quantity: 1
      }));
    } else {
      return Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const product = products.find(p => p.id === id);
          return product ? { product, quantity: qty } : null;
        })
        .filter((item): item is LabelPrintItem => item !== null);
    }
  }, [printSelectionMode, products, quantities]);

  const totalLabelsToPrint = itemsToPrint.reduce((acc, curr) => acc + curr.quantity, 0);
  const labelsPerPage = labelConfig.columns * labelConfig.rows;
  const totalPagesNeeded = Math.ceil((totalLabelsToPrint + startOffset) / (labelsPerPage || 1)) || 1;

  // Quantity helpers
  const handleSetQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleSetAllQuantities = (qty: number) => {
    const next: Record<string, number> = {};
    products.forEach(p => {
      next[p.id] = qty;
    });
    setQuantities(next);
  };

  // Generate & Download PDF
  const handleDownloadPdf = async () => {
    if (itemsToPrint.length === 0) {
      alert('Por favor selecciona al menos 1 producto con cantidad mayor a 0 para imprimir.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const doc = LabelPrintService.generateA4Pdf(
        itemsToPrint,
        labelConfig,
        settings,
        { startOffset }
      );
      const filename = `Etiquetas_A4_${settings.workshopName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      showNotification(`¡PDF de ${totalLabelsToPrint} etiquetas generado con éxito!`);
    } catch (err) {
      console.error('Error al generar PDF de etiquetas:', err);
      alert('Ocurrió un error al crear el archivo PDF. Intenta nuevamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct print preview
  const handleDirectPrint = () => {
    if (itemsToPrint.length === 0) {
      alert('Por favor selecciona al menos 1 producto para imprimir.');
      return;
    }
    try {
      const doc = LabelPrintService.generateA4Pdf(
        itemsToPrint,
        labelConfig,
        settings,
        { startOffset }
      );
      const pdfBlobUrl = doc.output('bloburl');
      const printWindow = window.open(pdfBlobUrl);
      if (printWindow) {
        printWindow.focus();
      } else {
        // Fallback: download if popup blocked
        doc.save(`Etiquetas_A4_${Date.now()}.pdf`);
      }
    } catch (err) {
      console.error('Error al abrir vista de impresión:', err);
    }
  };

  // Filter products for the selector list
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Personalización de Etiquetas para Hojas A4
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-wider">
                  Impresión Láser / Tinta
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Personaliza qué campos mostrar (código de barras, precio, nombre, logo) y ajusta la distribución en hojas A4 autoadhesivas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
          <button
            type="button"
            onClick={handleSaveConfig}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-950/40 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Formato</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Controls (Left) vs Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Campos a incluir en la etiqueta (USER REQUIREMENT) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Campos Visibles en la Etiqueta
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Activa o desactiva cada elemento
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Nombre del producto */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.includeProductName
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.includeProductName}
                  onChange={() => toggleField('includeProductName')}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-cyan-400" />
                    Nombre del Producto
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Título completo del insumo o producto terminado
                  </p>
                </div>
              </label>

              {/* 2. Precio de venta */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.includePrice
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.includePrice}
                  onChange={() => toggleField('includePrice')}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Precio de Venta
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Destacado en negrita con el signo monetario
                  </p>
                </div>
              </label>

              {/* 3. Código de barras */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.includeBarcode
                    ? 'bg-pink-500/10 border-pink-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.includeBarcode}
                  onChange={() => toggleField('includeBarcode')}
                  className="mt-0.5 rounded border-slate-700 text-pink-500 focus:ring-pink-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-pink-400" />
                    Código de Barras
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Generado automáticamente a partir del SKU
                  </p>
                </div>
              </label>

              {/* 4. Logo de la empresa */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.includeLogo
                    ? 'bg-amber-500/10 border-amber-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.includeLogo}
                  onChange={() => toggleField('includeLogo')}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    Logo de la Empresa
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {settings.logoUrl ? 'Logo corporativo cargado' : 'Requiere logo en Config. Empresa'}
                  </p>
                </div>
              </label>

              {/* 5. Nombre de la empresa / taller */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.includeWorkshopName
                    ? 'bg-purple-500/10 border-purple-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.includeWorkshopName}
                  onChange={() => toggleField('includeWorkshopName')}
                  className="mt-0.5 rounded border-slate-700 text-purple-500 focus:ring-purple-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    Nombre de Empresa
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {settings.workshopName || 'SubliStudio'}
                  </p>
                </div>
              </label>

              {/* 6. Código SKU / Referencia */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.includeSku
                    ? 'bg-blue-500/10 border-blue-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.includeSku}
                  onChange={() => toggleField('includeSku')}
                  className="mt-0.5 rounded border-slate-700 text-blue-500 focus:ring-blue-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    Código SKU
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Identificador de inventario único
                  </p>
                </div>
              </label>

              {/* 7. Talle y Color */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.includeSizeColor
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.includeSizeColor}
                  onChange={() => toggleField('includeSizeColor')}
                  className="mt-0.5 rounded border-slate-700 text-slate-400 focus:ring-slate-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold">Talle & Color</span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Variantes si están asignadas al producto
                  </p>
                </div>
              </label>

              {/* 8. Borde tenue de corte */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  labelConfig.showBorder
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={labelConfig.showBorder}
                  onChange={() => toggleField('showBorder')}
                  className="mt-0.5 rounded border-slate-700 text-slate-400 focus:ring-slate-500/30"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold">Borde de Corte A4</span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Línea tenue guía para cortar con tijera o cúter
                  </p>
                </div>
              </label>
            </div>

            {/* Custom footer text option */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labelConfig.includeCustomText}
                  onChange={() => toggleField('includeCustomText')}
                  className="rounded border-slate-700 text-pink-500 focus:ring-pink-500/30"
                />
                <span className="text-xs font-bold text-slate-200">
                  Incluir lema, pie de página o texto personalizado
                </span>
              </label>
              {labelConfig.includeCustomText && (
                <input
                  type="text"
                  value={labelConfig.customText || ''}
                  onChange={e => setLabelConfig({ ...labelConfig, customText: e.target.value })}
                  placeholder="Ej: Calidad Premium • www.sublistudio.com • Garantía Oficial"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              )}
            </div>
          </div>

          {/* Card 2: Plantillas de Hojas A4 & Disposición */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Plantillas de Hojas A4 (210 × 297 mm)
                </h4>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {labelConfig.columns * labelConfig.rows} etiquetas por hoja
              </span>
            </div>

            {/* Preset Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 3x8 */}
              <button
                type="button"
                onClick={() => handleApplyPreset('a4_3x8')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  labelConfig.preset === 'a4_3x8'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">3 × 8 (24)</span>
                  {labelConfig.preset === 'a4_3x8' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">64 × 33.8 mm</p>
                <span className="text-[9px] text-emerald-400/90 font-bold block mt-1">
                  Estándar Autoadhesivo
                </span>
              </button>

              {/* 4x10 */}
              <button
                type="button"
                onClick={() => handleApplyPreset('a4_4x10')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  labelConfig.preset === 'a4_4x10'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">4 × 10 (40)</span>
                  {labelConfig.preset === 'a4_4x10' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">48.5 × 25.4 mm</p>
                <span className="text-[9px] text-cyan-400/90 font-bold block mt-1">
                  Mini Códigos / Precios
                </span>
              </button>

              {/* 3x7 */}
              <button
                type="button"
                onClick={() => handleApplyPreset('a4_3x7')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  labelConfig.preset === 'a4_3x7'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">3 × 7 (21)</span>
                  {labelConfig.preset === 'a4_3x7' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">70 × 38.1 mm</p>
                <span className="text-[9px] text-amber-400/90 font-bold block mt-1">
                  Medianas con Logo
                </span>
              </button>

              {/* 2x5 */}
              <button
                type="button"
                onClick={() => handleApplyPreset('a4_2x5')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  labelConfig.preset === 'a4_2x5'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">2 × 5 (10)</span>
                  {labelConfig.preset === 'a4_2x5' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">105 × 57 mm</p>
                <span className="text-[9px] text-purple-400/90 font-bold block mt-1">
                  Grandes / Packaging
                </span>
              </button>
            </div>

            {/* Custom Grid Controls */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Columnas</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={labelConfig.columns}
                  onChange={e => setLabelConfig({ ...labelConfig, columns: Number(e.target.value) || 1, preset: 'custom' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Filas</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={labelConfig.rows}
                  onChange={e => setLabelConfig({ ...labelConfig, rows: Number(e.target.value) || 1, preset: 'custom' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Ancho (mm)</label>
                <input
                  type="number"
                  min={20}
                  max={210}
                  step={0.5}
                  value={labelConfig.labelWidthMm}
                  onChange={e => setLabelConfig({ ...labelConfig, labelWidthMm: Number(e.target.value) || 20, preset: 'custom' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Alto (mm)</label>
                <input
                  type="number"
                  min={15}
                  max={297}
                  step={0.5}
                  value={labelConfig.labelHeightMm}
                  onChange={e => setLabelConfig({ ...labelConfig, labelHeightMm: Number(e.target.value) || 15, preset: 'custom' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Formato de Código de Barras & Tipografía */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-pink-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Configuración del Código de Barras & Estilo
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Estándar de Código
                </label>
                <select
                  value={labelConfig.barcodeFormat}
                  onChange={e => setLabelConfig({ ...labelConfig, barcodeFormat: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="CODE128">CODE128 (Alfanumérico estándar)</option>
                  <option value="EAN13">EAN-13 (Comercial 13 dígitos)</option>
                  <option value="CODE39">CODE39 (Industrial)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tamaño de Fuente
                </label>
                <select
                  value={labelConfig.fontSize}
                  onChange={e => setLabelConfig({ ...labelConfig, fontSize: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="small">Compacto / Pequeño</option>
                  <option value="medium">Mediano (Recomendado)</option>
                  <option value="large">Grande / Muy Visible</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Alineación
                </label>
                <select
                  value={labelConfig.textAlign}
                  onChange={e => setLabelConfig({ ...labelConfig, textAlign: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="center">Centrado</option>
                  <option value="left">Alineado a la Izquierda</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={labelConfig.showBarcodeValue}
                  onChange={() => toggleField('showBarcodeValue')}
                  className="rounded border-slate-700 text-pink-500 focus:ring-pink-500/30"
                />
                <span>Mostrar texto alfanumérico debajo de las barras</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Prefijo de Precio:</span>
                <input
                  type="text"
                  value={labelConfig.pricePrefix}
                  onChange={e => setLabelConfig({ ...labelConfig, pricePrefix: e.target.value })}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview & Sheet Stats */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Live Preview of Single Label */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-pink-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Vista Previa en Vivo (1 Etiqueta)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {labelConfig.labelWidthMm} × {labelConfig.labelHeightMm} mm
              </span>
            </div>

            {/* Selector of sample product */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block font-semibold">
                Producto de demostración para la vista previa:
              </label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - ${p.salePrice.toLocaleString('es-AR')}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Label Card (Simulates A4 Paper) */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center min-h-[220px]">
              <div
                className={`bg-white text-slate-900 rounded-md shadow-2xl p-3 flex flex-col justify-between transition-all relative overflow-hidden ${
                  labelConfig.showBorder ? 'border border-dashed border-slate-300' : 'border border-transparent'
                }`}
                style={{
                  width: `${Math.min(320, labelConfig.labelWidthMm * 4.2)}px`,
                  minHeight: `${Math.max(140, labelConfig.labelHeightMm * 4.2)}px`,
                  textAlign: labelConfig.textAlign
                }}
              >
                {/* 1. Header: Logo & Company Name */}
                {(labelConfig.includeLogo || labelConfig.includeWorkshopName) && (
                  <div className={`flex items-center gap-2 mb-1.5 ${labelConfig.textAlign === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {labelConfig.includeLogo && settings.logoUrl && (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="h-5 w-auto object-contain shrink-0"
                      />
                    )}
                    {labelConfig.includeWorkshopName && (
                      <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider truncate max-w-[190px]">
                        {settings.workshopName || 'SubliStudio'}
                      </span>
                    )}
                  </div>
                )}

                {/* 2. Product Name */}
                {labelConfig.includeProductName && (
                  <div className="font-black text-slate-900 leading-snug line-clamp-2" style={{
                    fontSize: labelConfig.fontSize === 'small' ? '11px' : labelConfig.fontSize === 'large' ? '14px' : '12px'
                  }}>
                    {sampleProduct.name}
                  </div>
                )}

                {/* 3. SKU & Variant */}
                {(labelConfig.includeSku || labelConfig.includeSizeColor) && (
                  <div className="text-[9px] text-slate-500 font-semibold my-0.5">
                    {labelConfig.includeSku && <span>SKU: {sampleProduct.sku}</span>}
                    {labelConfig.includeSku && labelConfig.includeSizeColor && (sampleProduct.size || sampleProduct.color) && <span> • </span>}
                    {labelConfig.includeSizeColor && (
                      <span>{[sampleProduct.size, sampleProduct.color].filter(Boolean).join(' / ')}</span>
                    )}
                  </div>
                )}

                {/* 4. Barcode rendering */}
                {labelConfig.includeBarcode && (
                  <div className="my-1.5 flex flex-col items-center justify-center">
                    {sampleBarcodeUrl ? (
                      <img
                        src={sampleBarcodeUrl}
                        alt="Barcode"
                        className="h-9 w-auto max-w-[90%] object-contain"
                      />
                    ) : (
                      <div className="h-8 w-44 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                        |||||||| |||| |||||
                      </div>
                    )}
                    {labelConfig.showBarcodeValue && (
                      <span className="text-[9px] font-mono font-bold text-slate-600 tracking-widest mt-0.5">
                        {sampleProduct.sku || sampleProduct.id}
                      </span>
                    )}
                  </div>
                )}

                {/* 5. Price tag */}
                {labelConfig.includePrice && (
                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="text-xs font-bold text-slate-600">{labelConfig.pricePrefix}</span>
                    <span className="text-base font-black text-slate-950 tracking-tight" style={{
                      fontSize: labelConfig.fontSize === 'small' ? '14px' : labelConfig.fontSize === 'large' ? '18px' : '16px'
                    }}>
                      {sampleProduct.salePrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}

                {/* 6. Custom text */}
                {labelConfig.includeCustomText && labelConfig.customText && (
                  <div className="text-[8px] text-slate-400 italic text-center mt-1 truncate border-t border-slate-100 pt-0.5">
                    {labelConfig.customText}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Vista generada con renderizado vectorial SVG/Canvas idéntico al PDF A4 final.
            </p>
          </div>

          {/* Card: Miniature A4 Sheet Layout Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Distribución en Hoja A4
                </h4>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">
                {labelConfig.columns} cols × {labelConfig.rows} filas
              </span>
            </div>

            {/* A4 Sheet Miniature Representation */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
              <div
                className="bg-white rounded p-1.5 shadow-md border border-slate-300 relative"
                style={{
                  width: '150px',
                  height: '212px' // 210 x 297 aspect ratio
                }}
              >
                <div
                  className="w-full h-full grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${labelConfig.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${labelConfig.rows}, minmax(0, 1fr))`
                  }}
                >
                  {Array.from({ length: labelConfig.columns * labelConfig.rows }).map((_, idx) => (
                    <div
                      key={idx}
                      className="border border-cyan-300 bg-cyan-50/80 rounded-[1px] flex items-center justify-center text-[5px] text-cyan-700 font-mono font-bold"
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Capacidad por hoja:</span>
                <strong className="text-white">{labelConfig.columns * labelConfig.rows} etiquetas</strong>
              </div>
              <div className="flex justify-between">
                <span>Dimensiones etiqueta:</span>
                <strong className="text-white">{labelConfig.labelWidthMm} × {labelConfig.labelHeightMm} mm</strong>
              </div>
              <div className="flex justify-between">
                <span>Márgenes A4:</span>
                <strong className="text-white">Sup: {labelConfig.marginTopMm}mm | Lat: {labelConfig.marginLeftMm}mm</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PRINTING CENTER (SELECCIÓN DE PRODUCTOS & DESCARGA A4) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Printer className="w-4 h-4 text-emerald-400" />
              Centro de Impresión de Etiquetas A4
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Elige los productos a etiquetar y las cantidades de cada uno para armar las hojas A4
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintSelectionMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printSelectionMode === 'custom'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Selección Personalizada
            </button>
            <button
              type="button"
              onClick={() => setPrintSelectionMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printSelectionMode === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos los Productos (1 c/u)
            </button>
          </div>
        </div>

        {/* Action Bar: Search, Offset, Quick Actions & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Salto inicial:</span>
            <input
              type="number"
              min={0}
              max={labelsPerPage - 1}
              value={startOffset}
              onChange={e => setStartOffset(Math.max(0, Number(e.target.value) || 0))}
              title="Saltea etiquetas si la hoja A4 ya fue usada parcialmente"
              className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center font-bold"
            />
            <span className="text-[10px] text-slate-500">
              (reutilizar hoja usada)
            </span>
          </div>

          <div className="md:col-span-5 flex items-center justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleSetAllQuantities(5)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold"
            >
              +5 a todos
            </button>
            <button
              type="button"
              onClick={() => handleSetAllQuantities(0)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold"
            >
              Limpiar selección
            </button>
          </div>
        </div>

        {/* Product Selection Table */}
        {printSelectionMode === 'custom' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Producto</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Stock Actual</th>
                  <th className="py-2.5 px-3 text-right">Precio Venta</th>
                  <th className="py-2.5 px-4 text-center">Etiquetas a Imprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No se encontraron productos coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => {
                    const qty = quantities[prod.id] || 0;
                    return (
                      <tr
                        key={prod.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          qty > 0 ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{prod.name}</span>
                            {prod.size && (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {prod.size}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{prod.sku}</td>
                        <td className="py-2.5 px-3">
                          <span className={`font-bold ${prod.currentStock <= prod.minStock ? 'text-amber-400' : 'text-slate-300'}`}>
                            {prod.currentStock} {prod.unit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">
                          ${prod.salePrice.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetQuantity(prod.id, -1)}
                              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={qty}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setQuantities(prev => ({ ...prev, [prod.id]: val }));
                              }}
                              className="w-14 bg-slate-950 border border-slate-700 rounded text-center py-1 text-xs font-bold text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetQuantity(prod.id, 1)}
                              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            {/* Fast set to stock */}
                            <button
                              type="button"
                              onClick={() => {
                                setQuantities(prev => ({ ...prev, [prod.id]: prod.currentStock }));
                              }}
                              title="Establecer cantidad igual al stock disponible"
                              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-[10px] text-cyan-400 rounded font-bold ml-1"
                            >
                              Stock
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Final Summary & Print Trigger Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Total etiquetas:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-black">
                {totalLabelsToPrint}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Hojas A4 estimadas:</span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-sm font-black">
                {totalPagesNeeded} {totalPagesNeeded === 1 ? 'hoja' : 'hojas'}
              </span>
            </div>
            {startOffset > 0 && (
              <span className="text-[11px] text-amber-400 font-semibold">
                (Salteando las primeras {startOffset} posiciones)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={totalLabelsToPrint === 0}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir en Navegador</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={totalLabelsToPrint === 0 || isGeneratingPdf}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando PDF A4...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF A4 Listo para Imprimir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
