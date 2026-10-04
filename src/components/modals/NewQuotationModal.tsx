import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Image as ImageIcon,
  Upload,
  DollarSign,
  Calendar,
  AlertCircle,
  Calculator,
  Truck,
  Zap,
  Printer,
  Layers,
  Coins,
  Sparkles,
  Percent,
  CheckCircle,
  Info,
  Package
} from 'lucide-react';
import { Customer, ProductItem, QuotationItem, Quotation, JobCostBreakdown } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { ImageCompressionService } from '../../services/imageCompressionService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: ProductItem[];
  onQuotationCreated: (quote: Quotation) => void;
}

export const NewQuotationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customers,
  products,
  onQuotationCreated
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [isManualCustomer, setIsManualCustomer] = useState(false);

  // Quote terms
  const today = new Date();
  const defaultValid = new Date(today);
  defaultValid.setDate(defaultValid.getDate() + 15);
  const [validUntil, setValidUntil] = useState(defaultValid.toISOString().split('T')[0]);
  const [estimatedDays, setEstimatedDays] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('Presupuesto formal válido por 15 días corridos. Precios incluyen insumos e impresión en alta definición.');
  const [paymentTerms, setPaymentTerms] = useState('Seña del 50% al aprobar boceto digital, saldo contra entrega o despacho.');

  // Items
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(20);
  const [itemSaleMode, setItemSaleMode] = useState<'con_diseno' | 'lisa'>('con_diseno');
  const [itemDesignNotes, setItemDesignNotes] = useState('');
  const [itemDesignName, setItemDesignName] = useState('');
  const [itemDesignImage, setItemDesignImage] = useState<string | undefined>(undefined);
  const [customUnitPrice, setCustomUnitPrice] = useState<number | ''>('');

  // -----------------------------------------------------------------
  // Armado Propio de Costos del Trabajo (Taza/Remera, Flete, Hoja, Tinta, Luz, Margen)
  // -----------------------------------------------------------------
  const [showCostCalculator, setShowCostCalculator] = useState(true);
  const [costBaseProduct, setCostBaseProduct] = useState<number>(1250);
  const [costShipping, setCostShipping] = useState<number>(120);
  const [costPaper, setCostPaper] = useState<number>(45);
  const [costInk, setCostInk] = useState<number>(40);
  const [costElectricity, setCostElectricity] = useState<number>(50);
  const [costExtra, setCostExtra] = useState<number>(20);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(80);

  if (!isOpen) return null;

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find(c => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerEmail(found.email || '');
      setCustomerPhone(found.phone || '');
      setCustomerTaxId(found.taxId || '');
    }
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      const baseCost = prod.costPrice || 0;
      setCostBaseProduct(baseCost);

      let ship = 120;
      let paper = 45;
      let ink = 40;
      let elec = 50;
      let extra = 20;

      if (prod.category === 'tazas') {
        ship = 120;
        paper = 45;
        ink = 40;
        elec = 50;
        extra = 30; // cajita o embalaje
      } else if (prod.category === 'textil') {
        ship = 150;
        paper = 120;
        ink = 90;
        elec = 80;
        extra = 50;
      } else if (prod.category === 'gorras') {
        ship = 100;
        paper = 40;
        ink = 35;
        elec = 70;
        extra = 30;
      } else if (prod.category === 'llaveros') {
        ship = 60;
        paper = 25;
        ink = 20;
        elec = 30;
        extra = 15;
      }

      if (itemSaleMode === 'lisa') {
        paper = 0;
        ink = 0;
        elec = 0;
      }

      setCostShipping(ship);
      setCostPaper(paper);
      setCostInk(ink);
      setCostElectricity(elec);
      setCostExtra(extra);

      const effectiveP = itemSaleMode === 'lisa' ? 0 : paper;
      const effectiveI = itemSaleMode === 'lisa' ? 0 : ink;
      const effectiveE = itemSaleMode === 'lisa' ? 0 : elec;
      const unitDirect = baseCost + ship + effectiveP + effectiveI + effectiveE + extra;
      const profitUnit = Math.round((unitDirect * profitMarginPercent) / 100);
      const suggested = unitDirect + profitUnit;

      setCustomUnitPrice(suggested > 0 ? suggested : prod.salePrice);
    }
  };

  const handleSaleModeChange = (mode: 'con_diseno' | 'lisa') => {
    setItemSaleMode(mode);
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) {
      const paper = mode === 'lisa' ? 0 : 50;
      const ink = mode === 'lisa' ? 0 : 40;
      const elec = mode === 'lisa' ? 0 : 50;
      setCostPaper(paper);
      setCostInk(ink);
      setCostElectricity(elec);

      const unitDirect = (costBaseProduct || 0) + (costShipping || 0) + paper + ink + elec + (costExtra || 0);
      const profitUnit = Math.round((unitDirect * profitMarginPercent) / 100);
      const suggested = unitDirect + profitUnit;
      setCustomUnitPrice(suggested);
    }
  };

  // Calculations for current cost breakdown
  const effectivePaper = itemSaleMode === 'lisa' ? 0 : costPaper;
  const effectiveInk = itemSaleMode === 'lisa' ? 0 : costInk;
  const effectiveElec = itemSaleMode === 'lisa' ? 0 : costElectricity;

  const currentUnitDirectCost = (costBaseProduct || 0) + (costShipping || 0) + effectivePaper + effectiveInk + effectiveElec + (costExtra || 0);
  const currentProfitUnit = Math.round((currentUnitDirectCost * profitMarginPercent) / 100);
  const calculatedSuggestedPrice = currentUnitDirectCost + currentProfitUnit;

  const handleApplyCalculatedPrice = () => {
    setCustomUnitPrice(calculatedSuggestedPrice);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await ImageCompressionService.compressFileToDataUrl(file, 500, 0.82);
        setItemDesignImage(compressed);
        if (!itemDesignName) {
          setItemDesignName(file.name.replace(/\.[^/.]+$/, ''));
        }
      } catch (err) {
        console.error('Error al procesar imagen de diseño:', err);
      }
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = typeof customUnitPrice === 'number' && customUnitPrice > 0
      ? customUnitPrice
      : (calculatedSuggestedPrice > 0 ? calculatedSuggestedPrice : prod.salePrice);

    const costBreakdown: JobCostBreakdown = {
      baseProductCost: costBaseProduct,
      shippingCost: costShipping,
      paperCost: effectivePaper,
      inkCost: effectiveInk,
      electricityCost: effectiveElec,
      extraCost: costExtra,
      totalUnitCost: currentUnitDirectCost,
      profitMarginPercent: profitMarginPercent,
      profitUnitAmount: Math.max(0, unitPrice - currentUnitDirectCost),
      suggestedUnitPrice: calculatedSuggestedPrice
    };

    const newItem: QuotationItem = {
      productId: prod.id,
      productName: prod.name,
      saleMode: itemSaleMode,
      size: prod.size,
      color: prod.color,
      quantity: itemQuantity,
      unitPrice,
      totalPrice: unitPrice * itemQuantity,
      unitCost: currentUnitDirectCost,
      totalCost: currentUnitDirectCost * itemQuantity,
      designImage: itemSaleMode === 'con_diseno' ? itemDesignImage : undefined,
      designName: itemSaleMode === 'con_diseno' ? itemDesignName : undefined,
      designNotes: itemSaleMode === 'con_diseno' ? itemDesignNotes : undefined,
      costBreakdown
    };

    setItems([...items, newItem]);

    // Reset item form
    setSelectedProductId('');
    setItemQuantity(20);
    setItemDesignImage(undefined);
    setItemDesignName('');
    setItemDesignNotes('');
    setCustomUnitPrice('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalProductionCost = items.reduce((acc, curr) => acc + (curr.totalCost || ((curr.unitCost || 0) * curr.quantity)), 0);
  const taxableBase = Math.max(0, subtotal - (discountAmount || 0));
  const taxAmount = taxPercent > 0 ? (taxableBase * taxPercent) / 100 : 0;
  const totalAmount = taxableBase + taxAmount;
  const estimatedProfit = totalAmount - totalProductionCost;
  const overallMarginPercent = totalProductionCost > 0 ? Math.round((estimatedProfit / totalProductionCost) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor indica el nombre del cliente');
      return;
    }
    if (items.length === 0) {
      alert('Debes agregar al menos un ítem al presupuesto');
      return;
    }

    const newQuote = StorageService.addQuotation({
      validUntil,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerTaxId: customerTaxId.trim() || undefined,
      status: 'enviado',
      items,
      subtotal,
      discountAmount: Number(discountAmount) || 0,
      taxPercent: Number(taxPercent) || 0,
      taxAmount,
      totalAmount,
      totalCost: totalProductionCost,
      estimatedProfit,
      estimatedDays: Number(estimatedDays) || 5,
      notes: notes.trim() || undefined,
      paymentTerms: paymentTerms.trim() || undefined
    });

    onQuotationCreated(newQuote);
    onClose();
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nuevo Presupuesto / Cotización Formal</h2>
              <p className="text-xs text-slate-400">
                Armado propio de costos (insumo, flete, papel, tinta, electricidad) y margen de ganancia pretendido
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Customer & Quote Details */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Datos del Cliente & Validez
              </span>
              <button
                type="button"
                onClick={() => setIsManualCustomer(!isManualCustomer)}
                className="text-xs text-orange-400 hover:underline"
              >
                {isManualCustomer ? 'Seleccionar de Cartera' : '+ Cargar Cliente Nuevo/Manual'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {!isManualCustomer ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cliente Existente</label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => handleCustomerSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Seleccionar cliente --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.taxId ? `(${c.taxId})` : ''}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre o Empresa *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ej: Deportes Rivadavia"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Email del Cliente</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="compras@cliente.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">CUIT / Identificación Fiscal</label>
                <input
                  type="text"
                  value={customerTaxId}
                  onChange={e => setCustomerTaxId(e.target.value)}
                  placeholder="30-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Presupuesto Válido Hasta</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Plazo Estimado de Producción</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={estimatedDays}
                    onChange={e => setEstimatedDays(parseInt(e.target.value) || 1)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-xs text-slate-400">días hábiles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Item to Quote with Armado Propio de Costos */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                2. Armado Propio de Costos & Margen del Trabajo
              </span>
              <button
                type="button"
                onClick={() => setShowCostCalculator(!showCostCalculator)}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{showCostCalculator ? 'Ocultar Desglose Técnico' : 'Mostrar Desglose Técnico de Costos'}</span>
              </button>
            </div>

            {/* Sale Mode Selector: Lisa vs Con Diseño */}
            <div className="flex items-center gap-4 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs font-medium text-slate-300">Tipo de Trabajo:</span>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="saleMode"
                  checked={itemSaleMode === 'con_diseno'}
                  onChange={() => handleSaleModeChange('con_diseno')}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-orange-400">🎨 Con Diseño / Estampado Sublimado (Papel + Tinta + Plancha)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="saleMode"
                  checked={itemSaleMode === 'lisa'}
                  onChange={() => handleSaleModeChange('lisa')}
                  className="text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-cyan-400">👕 Prenda / Insumo Lisa (Sin impresión térmica)</span>
              </label>
            </div>

            {/* Product selection and quantity */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[11px] text-slate-400 mb-1">Insumo / Producto Base *</label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Seleccionar producto base (ej. Taza, Remera) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.size ? `[${p.size}]` : ''} - Costo Base: ${p.costPrice} | Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Cantidad (Unidades)</label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={e => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Precio Unit. Final ($)</label>
                <input
                  type="number"
                  value={customUnitPrice}
                  onChange={e => setCustomUnitPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-orange-500 font-mono font-bold"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-950/60"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir al Presupuesto</span>
                </button>
              </div>
            </div>

            {/* DETAILED COST BREAKDOWN CALCULATOR PANEL */}
            {showCostCalculator && selectedProductId && (
              <div className="bg-slate-900/90 border border-orange-500/30 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Desglose de Costos de Producción por Unidad
                    </span>
                    <span className="text-[10px] bg-orange-950 text-orange-300 px-2 py-0.5 rounded border border-orange-800 font-mono">
                      {selectedProduct?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Precio Sugerido:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(calculatedSuggestedPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyCalculatedPrice}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                      title="Copiar este precio calculado al campo Precio Unitario"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Aplicar</span>
                    </button>
                  </div>
                </div>

                {/* 6 Individual Cost Inputs Requested */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Cost 1: Taza / Insumo Base */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-cyan-400" />
                        Insumo / Taza
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        value={costBaseProduct}
                        onChange={e => setCostBaseProduct(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pl-5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        title="Costo de compra del insumo base (taza, remera, gorra)"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate">Costo base insumo</span>
                  </div>

                  {/* Cost 2: Flete / Envío */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-amber-400" />
                        Flete
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        value={costShipping}
                        onChange={e => setCostShipping(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pl-5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        title="Flete y transporte prorrateado por unidad"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate">Logística unitaria</span>
                  </div>

                  {/* Cost 3: Hoja de Impresión */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Printer className="w-3 h-3 text-indigo-400" />
                        Hoja Impresión
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        disabled={itemSaleMode === 'lisa'}
                        value={effectivePaper}
                        onChange={e => setCostPaper(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pl-5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                        title="Papel de sublimación o transfer por estampado"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {itemSaleMode === 'lisa' ? 'No aplica' : 'Papel sublimable'}
                    </span>
                  </div>

                  {/* Cost 4: Tinta */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-pink-400" />
                        Tinta
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        disabled={itemSaleMode === 'lisa'}
                        value={effectiveInk}
                        onChange={e => setCostInk(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pl-5 text-xs text-white font-mono focus:outline-none focus:border-pink-500 disabled:opacity-40"
                        title="Consumo de tintas de sublimación CMYK"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {itemSaleMode === 'lisa' ? 'No aplica' : 'Tintas CMYK HD'}
                    </span>
                  </div>

                  {/* Cost 5: Electricidad */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-300" />
                        Electricidad
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        disabled={itemSaleMode === 'lisa'}
                        value={effectiveElec}
                        onChange={e => setCostElectricity(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pl-5 text-xs text-white font-mono focus:outline-none focus:border-amber-300 disabled:opacity-40"
                        title="Consumo eléctrico y desgaste de prensa/estampadora térmica"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {itemSaleMode === 'lisa' ? 'No aplica' : 'Plancha térmica'}
                    </span>
                  </div>

                  {/* Cost 6: Extras / Empaque */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-emerald-400" />
                        Extras
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        value={costExtra}
                        onChange={e => setCostExtra(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pl-5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        title="Bolsas, cajas, cinta térmica o mano de obra adicional"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate">Caja / empaque</span>
                  </div>
                </div>

                {/* Profit Margin & Real-Time Financial Summary */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Margin Selector */}
                  <div className="md:col-span-6 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-orange-300 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-orange-400" />
                        Margen de Ganancia Pretendido:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={profitMarginPercent}
                          onChange={e => setProfitMarginPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right font-bold text-white text-xs font-mono"
                        />
                        <span className="text-orange-400 font-bold">%</span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500">Presets:</span>
                      {[40, 60, 80, 100, 120, 150].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setProfitMarginPercent(pct)}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                            profitMarginPercent === pct
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="md:col-span-6 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-around text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Costo Directo Unit.</span>
                      <span className="text-sm font-bold font-mono text-slate-200">
                        {formatCurrency(currentUnitDirectCost)}
                      </span>
                    </div>

                    <div className="text-slate-600 text-sm font-bold">+</div>

                    <div>
                      <span className="text-[10px] text-orange-400 block uppercase">Ganancia Unitaria</span>
                      <span className="text-sm font-bold font-mono text-orange-400">
                        +{formatCurrency(currentProfitUnit)}
                      </span>
                    </div>

                    <div className="text-slate-600 text-sm font-bold">=</div>

                    <div>
                      <span className="text-[10px] text-emerald-400 block uppercase">Precio Venta Sug.</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {formatCurrency(calculatedSuggestedPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Batch metrics for the current quantity */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      Lote de <strong>{itemQuantity} un.</strong>: Costo total producción:{' '}
                      <strong className="text-slate-200 font-mono">{formatCurrency(currentUnitDirectCost * itemQuantity)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>
                      Ganancia neta estimada del lote:{' '}
                      <strong className="text-emerald-400 font-mono">
                        +{formatCurrency((calculatedSuggestedPrice - currentUnitDirectCost) * itemQuantity)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Design upload if mode is con_diseno */}
            {itemSaleMode === 'con_diseno' && selectedProductId && (
              <div className="p-3 bg-slate-900/90 rounded-lg border border-orange-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-orange-400" />
                    Cargar Diseño / Estampa para este Producto
                  </span>
                  <span className="text-[10px] text-slate-400">Formatos: PNG, JPG, WebP</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-4">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-lg cursor-pointer text-xs text-slate-300 hover:text-white transition-colors bg-slate-950/40">
                      <Upload className="w-4 h-4 text-orange-400" />
                      <span>{itemDesignImage ? 'Cambiar Imagen' : 'Subir Archivo de Diseño'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={itemDesignName}
                      onChange={e => setItemDesignName(e.target.value)}
                      placeholder="Nombre del diseño (ej: Logo Pecho Club)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={itemDesignNotes}
                      onChange={e => setItemDesignNotes(e.target.value)}
                      placeholder="Medidas, ubicación (ej: 20x25cm frente)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {itemDesignImage && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                    <img
                      src={itemDesignImage}
                      alt="Vista previa del diseño"
                      className="w-12 h-12 object-contain bg-slate-950 rounded border border-slate-700 p-0.5"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">{itemDesignName || 'Diseño cargado'}</p>
                      <button
                        type="button"
                        onClick={() => { setItemDesignImage(undefined); setItemDesignName(''); }}
                        className="text-rose-400 hover:underline text-[11px]"
                      >
                        Quitar imagen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items in quote table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Ítems en el Presupuesto ({items.length})
              </h3>
              {items.length > 0 && (
                <span className="text-xs text-slate-400">
                  Costo Total Producción Taller:{' '}
                  <strong className="text-slate-200 font-mono">{formatCurrency(totalProductionCost)}</strong> · Ganancia Proyectada:{' '}
                  <strong className="text-emerald-400 font-mono">+{formatCurrency(estimatedProfit)}</strong> ({overallMarginPercent}%)
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-500 text-sm">
                No hay productos en esta cotización aún. Selecciona un producto e insumos arriba para armar el presupuesto.
              </div>
            ) : (
              <div className="space-y-2 border border-slate-800 rounded-lg p-2.5 bg-slate-950/40">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.designImage ? (
                          <img
                            src={item.designImage}
                            alt="Diseño"
                            className="w-12 h-12 object-contain bg-slate-950 rounded border border-orange-500/40 shrink-0 p-0.5"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 text-xs font-bold border border-slate-700">
                            {item.saleMode === 'lisa' ? 'LISA' : 'S/F'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white truncate">{item.productName}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.saleMode === 'lisa'
                                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800'
                                : 'bg-orange-950/70 text-orange-300 border border-orange-800'
                            }`}>
                              {item.saleMode === 'lisa' ? '👕 Lisa' : '🎨 Sublimada'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.size ? `Talle: ${item.size} · ` : ''}{item.color ? `Color: ${item.color} · ` : ''}
                            {item.designName ? `Diseño: ${item.designName}` : ''}
                          </p>
                          {item.designNotes && (
                            <p className="text-[11px] text-orange-300/80">{item.designNotes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">{item.quantity} un. x {formatCurrency(item.unitPrice)}</span>
                          <span className="font-bold text-white text-sm font-mono">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-slate-800 transition-colors"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Cost Breakdown Chip for this specific item */}
                    {item.costBreakdown && (
                      <div className="bg-slate-950 p-2 rounded border border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] gap-2">
                        <div className="flex items-center gap-2 flex-wrap text-slate-400">
                          <span className="font-semibold text-slate-300">Costos unitarios:</span>
                          <span>Insumo: <strong className="text-slate-200">${item.costBreakdown.baseProductCost}</strong></span>
                          <span>· Flete: <strong className="text-slate-200">${item.costBreakdown.shippingCost}</strong></span>
                          {item.saleMode === 'con_diseno' && (
                            <>
                              <span>· Hoja: <strong className="text-slate-200">${item.costBreakdown.paperCost}</strong></span>
                              <span>· Tinta: <strong className="text-slate-200">${item.costBreakdown.inkCost}</strong></span>
                              <span>· Luz: <strong className="text-slate-200">${item.costBreakdown.electricityCost}</strong></span>
                            </>
                          )}
                          {item.costBreakdown.extraCost ? (
                            <span>· Extras: <strong className="text-slate-200">${item.costBreakdown.extraCost}</strong></span>
                          ) : null}
                          <span className="text-slate-500">|</span>
                          <span className="text-cyan-400 font-bold">
                            Costo Unit: {formatCurrency(item.costBreakdown.totalUnitCost)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-orange-400 font-bold">
                            Margen: {item.costBreakdown.profitMarginPercent}% (+{formatCurrency(item.costBreakdown.profitUnitAmount)}/un)
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-emerald-400 font-bold">
                            Ganancia lote: +{formatCurrency(item.costBreakdown.profitUnitAmount * item.quantity)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terms, Conditions & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Condiciones & Notas Comerciales
              </span>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Condiciones de Pago</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Notas / Alcance del Trabajo</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Presupuesto:</span>
                <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Descuento Comercial ($):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-xs text-white font-mono"
                />
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>IVA (%):</span>
                <select
                  value={taxPercent}
                  onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                >
                  <option value={0}>0% (Sin IVA)</option>
                  <option value={10.5}>10.5% (IVA Reducido)</option>
                  <option value={21}>21% (IVA General)</option>
                </select>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Monto IVA:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-white text-sm">TOTAL AL CLIENTE:</span>
                <span className="font-mono font-bold text-orange-400 text-lg">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Internal Workshop Profit Summary */}
              {totalProductionCost > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded">
                  <span>Costo Taller: <strong className="text-slate-200 font-mono">{formatCurrency(totalProductionCost)}</strong></span>
                  <span>
                    Ganancia Proyectada:{' '}
                    <strong className="text-emerald-400 font-mono">+{formatCurrency(estimatedProfit)}</strong> ({overallMarginPercent}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-950/60 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Guardar Presupuesto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
