import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Image as ImageIcon, Upload, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Customer, ProductItem, QuotationItem, Quotation } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';

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
  const [notes, setNotes] = useState('Presupuesto válido por 15 días corridos. Precios incluyen insumos e impresión en alta definición.');
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
      // Default price depends on sale mode: if lisa, base sale price; if con_diseno, standard markup
      const price = itemSaleMode === 'lisa' ? Math.round(prod.salePrice * 0.85) : prod.salePrice;
      setCustomUnitPrice(price);
    }
  };

  const handleSaleModeChange = (mode: 'con_diseno' | 'lisa') => {
    setItemSaleMode(mode);
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) {
      const price = mode === 'lisa' ? Math.round(prod.salePrice * 0.85) : prod.salePrice;
      setCustomUnitPrice(price);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setItemDesignImage(reader.result as string);
        if (!itemDesignName) {
          setItemDesignName(file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = typeof customUnitPrice === 'number' && customUnitPrice > 0
      ? customUnitPrice
      : prod.salePrice;

    const newItem: QuotationItem = {
      productId: prod.id,
      productName: prod.name,
      saleMode: itemSaleMode,
      size: prod.size,
      color: prod.color,
      quantity: itemQuantity,
      unitPrice,
      totalPrice: unitPrice * itemQuantity,
      designImage: itemSaleMode === 'con_diseno' ? itemDesignImage : undefined,
      designName: itemSaleMode === 'con_diseno' ? itemDesignName : undefined,
      designNotes: itemSaleMode === 'con_diseno' ? itemDesignNotes : undefined
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
  const taxableBase = Math.max(0, subtotal - (discountAmount || 0));
  const taxAmount = taxPercent > 0 ? (taxableBase * taxPercent) / 100 : 0;
  const totalAmount = taxableBase + taxAmount;

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
      estimatedDays: Number(estimatedDays) || 5,
      notes: notes.trim() || undefined,
      paymentTerms: paymentTerms.trim() || undefined
    });

    onQuotationCreated(newQuote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nuevo Presupuesto / Cotización Membretada</h2>
              <p className="text-xs text-slate-400">Genera una cotización formal para remeras lisas o estampadas con logo institucional</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
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

          {/* Add Item to Quote */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider block">
              2. Agregar Productos & Diseños al Presupuesto
            </span>

            {/* Sale Mode Selector: Lisa vs Con Diseño */}
            <div className="flex items-center gap-4 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-xs font-medium text-slate-300">Tipo de Producto:</span>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="saleMode"
                  checked={itemSaleMode === 'con_diseno'}
                  onChange={() => handleSaleModeChange('con_diseno')}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-orange-400">🎨 Con Diseño / Estampado Sublimado</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="saleMode"
                  checked={itemSaleMode === 'lisa'}
                  onChange={() => handleSaleModeChange('lisa')}
                  className="text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-cyan-400">👕 Prenda / Insumo Lisa (Sin estampado)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[11px] text-slate-400 mb-1">Producto / Insumo Base</label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Seleccionar producto --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.size ? `[${p.size}]` : ''} - Stock: {p.currentStock} - Base ${p.salePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={e => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Precio Unit. ($)</label>
                <input
                  type="number"
                  value={customUnitPrice}
                  onChange={e => setCustomUnitPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir al Presupuesto</span>
                </button>
              </div>
            </div>

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
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Ítems en el Presupuesto ({items.length})
            </h3>

            {items.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-500 text-sm">
                No hay productos en esta cotización aún.
              </div>
            ) : (
              <div className="space-y-2 border border-slate-800 rounded-lg p-2.5 bg-slate-950/40">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-sm"
                  >
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
                        <div className="flex items-center gap-2">
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
                        <span className="font-bold text-white text-sm">{formatCurrency(item.totalPrice)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terms, Conditions & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Condiciones & Notas
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
                <span>Subtotal Bruto:</span>
                <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Descuento Comercial ($):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-xs text-white"
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
                <span className="font-bold text-white text-sm">TOTAL PRESUPUESTADO:</span>
                <span className="font-mono font-bold text-orange-400 text-lg">{formatCurrency(totalAmount)}</span>
              </div>
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
