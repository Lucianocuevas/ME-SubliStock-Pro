import React, { useState } from 'react';
import { X, Calendar, DollarSign, Printer, CheckCircle2, Image as ImageIcon, ExternalLink, Trash2 } from 'lucide-react';
import { CustomerOrder, ProductionStatus } from '../../types';
import { StorageService, formatCurrency, calculateOrderUrgency } from '../../services/storageService';
import { STATUS_LABELS } from '../../data/initialData';
import { GoogleCalendarService } from '../../services/googleCalendarService';
import { AuthService } from '../../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: CustomerOrder | null;
  onOrderUpdated: () => void;
}

export const OrderDetailsModal: React.FC<Props> = ({ isOpen, onClose, order, onOrderUpdated }) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !order) return null;

  const urgency = calculateOrderUrgency(order.deliveryDate, order.productionStatus);

  const handleStatusChange = (newStatus: ProductionStatus) => {
    StorageService.updateOrderStatus(order.id, newStatus);
    onOrderUpdated();
  };

  const handleAddPayment = () => {
    if (paymentAmount <= 0) return;
    const isFullPaid = (order.depositAmount + paymentAmount) >= order.totalAmount;
    StorageService.updateOrderPayment(order.id, isFullPaid ? 'pagado' : 'seña', paymentAmount);
    setPaymentAmount(0);
    onOrderUpdated();
  };

  const handleScheduleInGoogleCalendar = async () => {
    setCalendarSyncing(true);
    setCalendarMessage(null);
    try {
      const token = AuthService.getCachedAccessToken();
      if (token) {
        const res = await GoogleCalendarService.scheduleOrderEvent(order, token);
        if (res.success) {
          setCalendarMessage('¡Agendado con éxito en Google Calendar!');
        } else {
          const webUrl = GoogleCalendarService.getGoogleCalendarWebLink(order);
          window.open(webUrl, '_blank');
          setCalendarMessage('Abriendo Google Calendar para confirmar...');
        }
      } else {
        const webUrl = GoogleCalendarService.getGoogleCalendarWebLink(order);
        window.open(webUrl, '_blank');
        setCalendarMessage('Abriendo Google Calendar en pestaña nueva...');
      }
    } catch {
      const webUrl = GoogleCalendarService.getGoogleCalendarWebLink(order);
      window.open(webUrl, '_blank');
    } finally {
      setCalendarSyncing(false);
      setTimeout(() => setCalendarMessage(null), 5000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusList: { key: ProductionStatus; label: string }[] = [
    { key: 'diseno_pendiente', label: '1. Diseño Pendiente' },
    { key: 'en_produccion', label: '2. En Plancha / Sublimado' },
    { key: 'control_calidad', label: '3. Control de Calidad' },
    { key: 'listo_entrega', label: '4. Listo p/ Entrega' },
    { key: 'entregado', label: '5. Entregado / Cerrado' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{order.orderNumber}</h2>
                <span className={`px-2.5 py-0.5 text-xs rounded-full border ${urgency.badgeClass}`}>
                  {urgency.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">Cliente: <strong className="text-white">{order.customerName}</strong> · Tel: {order.customerPhone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Orden</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Production Workflow Step Tracker */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Estado de Producción en Taller
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {statusList.map(step => {
                const isActive = order.productionStatus === step.key;
                const statusMeta = STATUS_LABELS[step.key];
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => handleStatusChange(step.key)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                      isActive
                        ? `${statusMeta.bg} ${statusMeta.text} ${statusMeta.border} ring-2 ring-cyan-500/40 font-bold scale-[1.02]`
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates, Google Calendar & Payment Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Fecha Prometida de Entrega:</span>
                </div>
                <button
                  type="button"
                  onClick={handleScheduleInGoogleCalendar}
                  disabled={calendarSyncing}
                  className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                  title="Agendar en Google Calendar"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>{calendarSyncing ? 'Sincronizando...' : 'Agendar en Calendar'}</span>
                </button>
              </div>

              {calendarMessage && (
                <div className="p-2 bg-blue-950/80 border border-blue-500/40 rounded text-xs text-blue-200">
                  {calendarMessage}
                </div>
              )}

              <p className="text-lg font-bold text-white">
                {new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {order.deliveryTime && (
                <p className="text-xs text-slate-400">Hora pactada: {order.deliveryTime} hs</p>
              )}
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Estado de Pago:</span>
                <span className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${
                  order.paymentStatus === 'pagado'
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                    : order.paymentStatus === 'seña'
                    ? 'bg-cyan-950/50 text-cyan-400 border-cyan-800/50'
                    : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                }`}>
                  {order.paymentStatus === 'pagado' ? 'Pagado Totalmente' : (order.paymentStatus === 'seña' ? 'Seña Abonada' : 'Pago Pendiente')}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Saldo Adeudado</span>
                <span className={`text-xl font-bold ${order.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatCurrency(order.remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Items & Custom Details */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Insumos y Diseños del Pedido ({order.items.length})
            </h3>
            <div className="space-y-2.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {item.designImage ? (
                        <div
                          onClick={() => setPreviewImage(item.designImage || null)}
                          className="cursor-pointer group relative shrink-0"
                          title="Click para ampliar diseño"
                        >
                          <img
                            src={item.designImage}
                            alt="Diseño"
                            className="w-14 h-14 object-contain rounded border border-cyan-500/40 p-0.5 bg-slate-900 group-hover:opacity-80 transition-opacity"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] text-white opacity-0 group-hover:opacity-100 rounded">
                            Ver
                          </span>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0 border border-slate-800">
                          {item.saleMode === 'lisa' ? 'LISA' : 'S/D'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{item.productName}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.saleMode === 'lisa'
                              ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                              : 'bg-cyan-950/70 text-cyan-300 border border-cyan-800'
                          }`}>
                            {item.saleMode === 'lisa' ? '👕 Lisa' : '🎨 Estampada'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          {item.size && <span>Talle: <strong className="text-slate-200">{item.size}</strong></span>}
                          {item.color && <span>Color: <strong className="text-slate-200">{item.color}</strong></span>}
                          <span>Cant: <strong className="text-cyan-400 text-sm">{item.quantity} u.</strong></span>
                          {item.designName && <span>Diseño: <strong className="text-cyan-300">{item.designName}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block">${item.unitPrice} c/u</span>
                      <span className="font-bold text-white">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  </div>

                  {item.customizationDetails && (
                    <div className="bg-slate-900 border border-cyan-900/40 rounded p-2 text-xs text-cyan-200">
                      <strong className="text-cyan-400">Instrucciones de Personalización: </strong>
                      {item.customizationDetails}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment collection box if remaining balance > 0 */}
          {order.remainingBalance > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Cobrar Saldo o Registrar Pago Parcial
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    max={order.remainingBalance}
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    placeholder={`Ingresar monto (máx ${formatCurrency(order.remainingBalance)})`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(order.remainingBalance)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700"
                >
                  Cobrar Total ({formatCurrency(order.remainingBalance)})
                </button>
                <button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={paymentAmount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Registrar Cobro</span>
                </button>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
              <strong className="text-slate-400 block mb-1">Notas del Pedido:</strong>
              {order.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Total Trabajo: <strong className="text-white text-sm">{formatCurrency(order.totalAmount)}</strong> · Seña: <strong className="text-cyan-400">{formatCurrency(order.depositAmount)}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isDeleting ? (
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="px-3 py-2 bg-rose-950/50 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Eliminar pedido permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-700 p-1 rounded-lg">
                <span className="text-[11px] text-rose-200 px-1 font-semibold">¿Seguro?</span>
                <button
                  type="button"
                  onClick={() => {
                    StorageService.deleteCustomerOrder(order.id, order.productionStatus !== 'entregado');
                    setIsDeleting(false);
                    onOrderUpdated();
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-colors"
                >
                  Sí, Eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-semibold"
                >
                  No
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Design Image */}
      {previewImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90" onClick={() => setPreviewImage(null)}>
          <div className="bg-slate-900 p-4 rounded-xl max-w-lg w-full border border-slate-800 text-center" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Diseño en grande" className="max-h-[70vh] mx-auto object-contain rounded" />
            <button
              onClick={() => setPreviewImage(null)}
              className="mt-4 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
