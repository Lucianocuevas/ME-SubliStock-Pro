import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, ArrowDownRight, ArrowUpRight, Receipt, CheckCircle, FileText } from 'lucide-react';
import { Customer, Supplier, AccountMovementType, PaymentMethodType } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  suppliers: Supplier[];
  initialEntityType?: 'customer' | 'supplier';
  initialEntityId?: string;
  onPaymentSaved: () => void;
}

export const NewPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customers,
  suppliers,
  initialEntityType = 'customer',
  initialEntityId,
  onPaymentSaved
}) => {
  const [entityType, setEntityType] = useState<'customer' | 'supplier'>(initialEntityType);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(initialEntityId || '');
  const [movementType, setMovementType] = useState<AccountMovementType>('pago_recibido');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('transferencia');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEntityType(initialEntityType);
      const defaultId = initialEntityId || (initialEntityType === 'customer' ? (customers[0]?.id || '') : (suppliers[0]?.id || ''));
      setSelectedEntityId(defaultId);
      
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      if (initialEntityType === 'customer') {
        setMovementType('pago_recibido');
        setReferenceNumber(`REC-${year}-${randomNum}`);
        setConcept('Cobro / Pago a cuenta en Cuenta Corriente');
      } else {
        setMovementType('pago_proveedor');
        setReferenceNumber(`OP-${year}-${randomNum}`);
        setConcept('Orden de Pago a Proveedor');
      }
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen, initialEntityType, initialEntityId, customers, suppliers]);

  if (!isOpen) return null;

  const handleEntityChange = (id: string) => {
    setSelectedEntityId(id);
    if (entityType === 'customer') {
      const cust = customers.find(c => c.id === id);
      if (cust && cust.currentBalance > 0 && amount === '') {
        // Pre-fill suggested balance
        setConcept(`Cobro a cuenta ${cust.name}`);
      }
    } else {
      const sup = suppliers.find(s => s.id === id);
      if (sup) {
        setConcept(`Pago a proveedor ${sup.name}`);
      }
    }
  };

  const handleTypeChange = (type: AccountMovementType) => {
    setMovementType(type);
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    if (type === 'pago_recibido') {
      setReferenceNumber(`REC-${year}-${randomNum}`);
      setConcept('Cobro / Pago a cuenta en Cuenta Corriente');
    } else if (type === 'pago_seña') {
      setReferenceNumber(`REC-${year}-${randomNum}`);
      setConcept('Anticipo / Seña de pedido');
    } else if (type === 'nota_credito') {
      setReferenceNumber(`NC-${year}-${randomNum}`);
      setConcept('Nota de Crédito / Descuento o Bonificación');
    } else if (type === 'nota_debito') {
      setReferenceNumber(`ND-${year}-${randomNum}`);
      setConcept('Nota de Débito / Cargo administrativo o adicional');
    } else if (type === 'pago_proveedor') {
      setReferenceNumber(`OP-${year}-${randomNum}`);
      setConcept('Orden de Pago / Cancelación de factura');
    } else if (type === 'compra_proveedor') {
      setReferenceNumber(`FAC-${year}-${randomNum}`);
      setConcept('Factura o Remito de compra');
    } else if (type === 'saldo_inicial') {
      setReferenceNumber(`APER-${year}`);
      setConcept('Ajuste de Apertura / Saldo Inicial');
    }
  };

  const currentSelectedCustomer = entityType === 'customer' ? customers.find(c => c.id === selectedEntityId) : null;
  const currentSelectedSupplier = entityType === 'supplier' ? suppliers.find(s => s.id === selectedEntityId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) return;
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) return;

    let debit = 0;
    let credit = 0;

    if (entityType === 'customer') {
      // For customer:
      // Debe (debit): increases customer debt (cargo_pedido, nota_debito, saldo_inicial deudor)
      // Haber (credit): cancels customer debt (pago_recibido, pago_seña, nota_credito)
      if (movementType === 'pago_recibido' || movementType === 'pago_seña' || movementType === 'nota_credito') {
        credit = numAmount;
      } else {
        debit = numAmount;
      }
    } else {
      // For supplier:
      // Debe (debit): payments made to supplier (pago_proveedor)
      // Haber (credit): purchases / invoices from supplier (compra_proveedor)
      if (movementType === 'pago_proveedor') {
        debit = numAmount;
      } else {
        credit = numAmount;
      }
    }

    const entityName = entityType === 'customer'
      ? (currentSelectedCustomer?.name || 'Cliente')
      : (currentSelectedSupplier?.name || 'Proveedor');

    StorageService.addAccountMovement({
      entityType,
      entityId: selectedEntityId,
      entityName,
      date: `${date}T${new Date().toTimeString().split(' ')[0]}Z`,
      type: movementType,
      concept: concept.trim() || 'Movimiento en Cuenta Corriente',
      referenceNumber: referenceNumber.trim() || undefined,
      debit,
      credit,
      paymentMethod,
      notes: notes.trim() || undefined,
      createdByName: StorageService.getCurrentUser().name
    });

    onPaymentSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-950/70 border border-emerald-800/80 rounded-lg text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Registrar Movimiento / Cobranza</h3>
              <p className="text-xs text-slate-400">Asiento contable directo en Cuenta Corriente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Entity Type Selector */}
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 mb-1.5 block">
              Tipo de Cuenta Corriente
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEntityType('customer');
                  setMovementType('pago_recibido');
                  setSelectedEntityId(customers[0]?.id || '');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  entityType === 'customer'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-300" />
                <span>Cliente (Cobranza / Haber)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntityType('supplier');
                  setMovementType('pago_proveedor');
                  setSelectedEntityId(suppliers[0]?.id || '');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  entityType === 'supplier'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-300" />
                <span>Proveedor (Pago emitido)</span>
              </button>
            </div>
          </div>

          {/* Select Entity */}
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
              {entityType === 'customer' ? 'Seleccionar Cliente' : 'Seleccionar Proveedor'}
            </label>
            <select
              value={selectedEntityId}
              onChange={e => handleEntityChange(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="" disabled>-- Seleccione una entidad --</option>
              {entityType === 'customer' ? (
                customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.currentBalance > 0 ? `(Deuda: ${formatCurrency(c.currentBalance)})` : '(Al día)'}
                  </option>
                ))
              ) : (
                suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contactPerson})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Outstanding balance helper note */}
          {currentSelectedCustomer && (
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Saldo actual del cliente:</span>
              <span className={currentSelectedCustomer.currentBalance > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {formatCurrency(currentSelectedCustomer.currentBalance)}
              </span>
            </div>
          )}

          {/* Movement Type & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
                Tipo de Comprobante
              </label>
              <select
                value={movementType}
                onChange={e => handleTypeChange(e.target.value as AccountMovementType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                {entityType === 'customer' ? (
                  <>
                    <option value="pago_recibido">Cobranza / Pago a cuenta (Recibo)</option>
                    <option value="pago_seña">Seña / Anticipo de Pedido</option>
                    <option value="nota_credito">Nota de Crédito (Descuento)</option>
                    <option value="nota_debito">Nota de Débito (Cargo extra)</option>
                    <option value="saldo_inicial">Ajuste de Saldo Inicial</option>
                  </>
                ) : (
                  <>
                    <option value="pago_proveedor">Orden de Pago a Proveedor</option>
                    <option value="compra_proveedor">Factura / Remito de Compra</option>
                    <option value="nota_credito">Nota de Crédito de Proveedor</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
                N° de Comprobante / Recibo
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="REC-2026-0042"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
                Monto ($) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
                Medio de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="transferencia">Transferencia Bancaria (CBU / CVU)</option>
                <option value="efectivo">Efectivo / Caja Taller</option>
                <option value="mercadopago">MercadoPago / QR</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta Débito / Crédito</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Date & Concept */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
                Concepto / Descripción
              </label>
              <input
                type="text"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder="Ej: Pago de saldo pendiente"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 mb-1 block">
              Observaciones internas / N° Transacción Bancaria
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Operación Santander #99481 - Enviado comprobante por WhatsApp"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/50 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Guardar en Cuenta Corriente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
