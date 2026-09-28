import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, AlertTriangle, Layers, UserCheck, Upload, Image as ImageIcon } from 'lucide-react';
import { Customer, ProductItem, CustomerOrderItem, CustomerOrder } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { GoogleCalendarService } from '../../services/googleCalendarService';
import { AuthService } from '../../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: ProductItem[];
  onOrderCreated: (order?: CustomerOrder) => void;
}

export const NewCustomerOrderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customers,
  products,
  onOrderCreated
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isQuickNewCustomer, setIsQuickNewCustomer] = useState(false);

  // Delivery details
  const todayStr = new Date().toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState(todayStr);
  const [deliveryTime, setDeliveryTime] = useState('17:00');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [scheduleInCalendar, setScheduleInCalendar] = useState(true);

  // Items
  const [items, setItems] = useState<CustomerOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(10);
  const [itemSaleMode, setItemSaleMode] = useState<'con_diseno' | 'lisa'>('con_diseno');
  const [itemCustomDetails, setItemCustomDetails] = useState('');
  const [itemDesignImage, setItemDesignImage] = useState<string | undefined>(undefined);
  const [itemDesignName, setItemDesignName] = useState('');
  const [itemCustomPrice, setItemCustomPrice] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      const price = itemSaleMode === 'lisa' ? Math.round(prod.salePrice * 0.85) : prod.salePrice;
      setItemCustomPrice(price);
    }
  };

  const handleSaleModeToggle = (mode: 'con_diseno' | 'lisa') => {
    setItemSaleMode(mode);
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) {
      const price = mode === 'lisa' ? Math.round(prod.salePrice * 0.85) : prod.salePrice;
      setItemCustomPrice(price);
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

    const unitPrice = typeof itemCustomPrice === 'number' && itemCustomPrice > 0
      ? itemCustomPrice
      : (itemSaleMode === 'lisa' ? Math.round(prod.salePrice * 0.85) : prod.salePrice);

    const newItem: CustomerOrderItem = {
      productId: prod.id,
      productName: prod.name,
      material: prod.material,
      category: prod.category,
      size: prod.size,
      color: prod.color,
      quantity: itemQuantity,
      unitPrice,
      unitCost: prod.costPrice,
      totalPrice: unitPrice * itemQuantity,
      saleMode: itemSaleMode,
      customizationDetails: itemCustomDetails.trim() || undefined,
      designImage: itemSaleMode === 'con_diseno' ? itemDesignImage : undefined,
      designName: itemSaleMode === 'con_diseno' ? itemDesignName : undefined
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setItemQuantity(10);
    setItemCustomDetails('');
    setItemDesignImage(undefined);
    setItemDesignName('');
    setItemCustomPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index].unitPrice = newPrice;
    updated[index].totalPrice = updated[index].quantity * newPrice;
    setItems(updated);
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, newQty);
    updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
    setItems(updated);
  };

  const totalAmount = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const costTotal = items.reduce((acc, curr) => acc + (curr.unitCost * curr.quantity), 0);
  const remainingBalance = Math.max(0, totalAmount - (depositAmount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Debes agregar al menos un ítem al pedido de producción');
      return;
    }

    let customerId = selectedCustomerId;
    let customerName = '';
    let customerPhone = '';

    if (isQuickNewCustomer || !selectedCustomerId) {
      if (!newCustomerName.trim()) {
        alert('Por favor indica el nombre del cliente');
        return;
      }
      const createdCust = StorageService.addCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || 'Sin teléfono',
        email: 'sin_email@taller.com',
        currentBalance: 0
      });
      customerId = createdCust.id;
      customerName = createdCust.name;
      customerPhone = createdCust.phone;
    } else {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (!cust) return;
      customerName = cust.name;
      customerPhone = cust.phone;
    }

    const paymentStatus = depositAmount >= totalAmount ? 'pagado' : (depositAmount > 0 ? 'seña' : 'pendiente');

    const createdOrder = StorageService.addCustomerOrder({
      customerId,
      customerName,
      customerPhone,
      deliveryDate,
      deliveryTime,
      productionStatus: 'diseno_pendiente',
      paymentStatus,
      depositAmount: Number(depositAmount) || 0,
      totalAmount,
      costTotal,
      items,
      notes: notes.trim() || undefined
    });

    // Handle Google Calendar Scheduling
    if (scheduleInCalendar) {
      try {
        const token = AuthService.getCachedAccessToken();
        if (token) {
          const res = await GoogleCalendarService.scheduleOrderEvent(createdOrder, token);
          if (res.success && res.eventId) {
            StorageService.updateOrderStatus(createdOrder.id, createdOrder.productionStatus);
          }
        } else {
          // If no token cached yet, open Google Calendar event prefill web link
          const calendarUrl = GoogleCalendarService.getGoogleCalendarWebLink(createdOrder);
          window.open(calendarUrl, '_blank');
        }
      } catch (err) {
        console.warn('Google Calendar auto-sync notice:', err);
      }
    }

    onOrderCreated(createdOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nuevo Pedido de Sublimación / Producción</h2>
              <p className="text-xs text-slate-400">Vincula insumos del inventario con diseño personalizado y fecha de entrega</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Customer Selection */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Cliente del Trabajo
              </span>
              <button
                type="button"
                onClick={() => setIsQuickNewCustomer(!isQuickNewCustomer)}
                className="text-xs text-cyan-400 hover:underline"
              >
                {isQuickNewCustomer ? 'Seleccionar existente' : '+ Crear cliente rápido'}
              </button>
            </div>

            {isQuickNewCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre Completo o Institución</label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    placeholder="Ej: Colegio Belgrano / Lucas Pérez"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    placeholder="Ej: +54 9 11 5566-7788"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">-- Seleccionar cliente de la cartera --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.businessOrContact ? `(${c.businessOrContact})` : ''} - Tel: {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Delivery & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Fecha Prometida de Entrega
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Hora Estimada de Entrega
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={e => setDeliveryTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Items Selector */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
                Agregar Prendas / Insumos al Pedido
              </span>

              {/* Lisa vs Con Diseño toggle */}
              <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-200">
                  <input
                    type="radio"
                    name="orderSaleMode"
                    checked={itemSaleMode === 'con_diseno'}
                    onChange={() => handleSaleModeToggle('con_diseno')}
                    className="text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-cyan-300">🎨 Con Diseño</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-200">
                  <input
                    type="radio"
                    name="orderSaleMode"
                    checked={itemSaleMode === 'lisa'}
                    onChange={() => handleSaleModeToggle('lisa')}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-slate-300">👕 Lisa</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[11px] text-slate-400 mb-1">Producto Base (En blanco)</label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Seleccionar producto --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.size ? `[${p.size}]` : ''} ({p.color || ''}) - Stock: {p.currentStock} - Base ${p.salePrice}
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 text-center"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Precio Unit. ($)</label>
                <input
                  type="number"
                  value={itemCustomPrice}
                  onChange={e => setItemCustomPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 text-right"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir al Pedido</span>
                </button>
              </div>
            </div>

            {/* Design image uploader if con_diseno */}
            {itemSaleMode === 'con_diseno' && selectedProductId && (
              <div className="p-3 bg-slate-900 rounded-lg border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    Cargar Imagen del Diseño que va en esta Remera/Producto
                  </span>
                  <span className="text-[10px] text-slate-400">PNG, JPG hasta 2MB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-lg cursor-pointer text-xs text-slate-300 hover:text-white transition-colors bg-slate-950/60">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{itemDesignImage ? 'Cambiar Imagen' : 'Subir Archivo de Diseño'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={itemDesignName}
                      onChange={e => setItemDesignName(e.target.value)}
                      placeholder="Nombre del diseño (ej: Escudo Club)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={itemCustomDetails}
                      onChange={e => setItemCustomDetails(e.target.value)}
                      placeholder="Medidas, ubicación (pecho, espalda)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {itemDesignImage && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                    <img
                      src={itemDesignImage}
                      alt="Vista previa del diseño"
                      className="w-12 h-12 object-contain bg-slate-950 rounded border border-cyan-500/40 p-0.5"
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

          {/* Items List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Ítems en Producción ({items.length})
            </h3>

            {items.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-500 text-sm">
                No hay ítems en este pedido aún.
              </div>
            ) : (
              <div className="space-y-2 border border-slate-800 rounded-lg p-2.5 bg-slate-950/40">
                {items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  const isStockInsufficient = prod && prod.currentStock < item.quantity;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {item.designImage ? (
                            <img
                              src={item.designImage}
                              alt="Diseño"
                              className="w-12 h-12 object-contain bg-slate-950 rounded border border-cyan-500/40 p-0.5 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                              {item.saleMode === 'lisa' ? 'LISA' : 'S/D'}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white truncate">{item.productName}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                item.saleMode === 'lisa'
                                  ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                                  : 'bg-cyan-950/70 text-cyan-300 border border-cyan-800'
                              }`}>
                                {item.saleMode === 'lisa' ? '👕 Lisa' : '🎨 Estampada'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                              {item.size && <span>Talle: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                              <span>Costo: {formatCurrency(item.unitCost)}</span>
                            </div>
                            {item.customizationDetails && (
                              <p className="text-xs text-cyan-300 mt-1 bg-cyan-950/40 p-1.5 rounded border border-cyan-800/40">
                                Detalle: {item.customizationDetails}
                              </p>
                            )}
                            {isStockInsufficient && (
                              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Stock disponible ({prod?.currentStock || 0}) menor al pedido ({item.quantity}). Se descontará y quedará en déficit para reponer.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block text-right">Cant.</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-center text-xs"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block text-right">Precio Unit.</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={e => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-right text-xs"
                            />
                          </div>

                          <div className="text-right w-20">
                            <span className="text-[10px] text-slate-400 block">Subtotal</span>
                            <span className="font-bold text-white text-sm">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Calendar Agendamiento Checkbox */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Vincular y Agendar en Google Calendar</p>
                <p className="text-[11px] text-slate-400">Crea el evento automáticamente con fecha, hora, cliente y lista de productos para entrega</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleInCalendar}
                onChange={e => setScheduleInCalendar(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Payment & Seña */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total del Pedido
              </label>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</div>
              <span className="text-xs text-slate-500">Costo insumos: {formatCurrency(costTotal)}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                Seña / Adelanto Recibido
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={depositAmount}
                  onChange={e => setDepositAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-cyan-800 rounded-lg px-3 py-1.5 text-white font-bold text-lg focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                Saldo Pendiente
              </label>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(remainingBalance)}</div>
              <span className="text-xs text-slate-400">A abonar contra entrega</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notas Generales del Pedido
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instrucciones para taller, temperatura de planchado, embalaje o transporte..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={items.length === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-950/50 transition-all"
            >
              Crear Pedido y Enviar a Taller
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
