import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Printer,
  MessageCircle,
  Users,
  Truck,
  BookOpen,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Calendar,
  Trash2,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { Customer, Supplier, AccountMovement } from '../../types';
import { StorageService, formatCurrency, AppSettings } from '../../services/storageService';
import { ExportService } from '../../services/exportService';

interface Props {
  customers: Customer[];
  suppliers: Supplier[];
  movements: AccountMovement[];
  settings: AppSettings;
  onOpenNewPayment: (entityType?: 'customer' | 'supplier', entityId?: string) => void;
  onDataUpdated: () => void;
}

export const CurrentAccountsView: React.FC<Props> = ({
  customers,
  suppliers,
  movements,
  settings,
  onOpenNewPayment,
  onDataUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'journal'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debt' | 'up_to_date'>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'customer' | 'supplier'>('customer');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Financial Metrics
  const totalCustomerDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  }, [customers]);

  const debtorCustomersCount = useMemo(() => {
    return customers.filter(c => c.currentBalance > 0).length;
  }, [customers]);

  // Current month collections (Cobros recibidos de clientes)
  const currentMonthCollections = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return movements
      .filter(m => {
        if (m.entityType !== 'customer') return false;
        if (m.type !== 'pago_recibido' && m.type !== 'pago_seña') return false;
        const d = new Date(m.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, m) => sum + (m.credit || 0), 0);
  }, [movements]);

  // Current month supplier payments
  const currentMonthSupplierPayments = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return movements
      .filter(m => {
        if (m.entityType !== 'supplier') return false;
        if (m.type !== 'pago_proveedor') return false;
        const d = new Date(m.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, m) => sum + (m.debit || 0), 0);
  }, [movements]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.businessOrContact && c.businessOrContact.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.phone.includes(searchTerm);

      if (!matchSearch) return false;

      if (statusFilter === 'debt') return c.currentBalance > 0;
      if (statusFilter === 'up_to_date') return c.currentBalance <= 0;
      return true;
    });
  }, [customers, searchTerm, statusFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
      );
    });
  }, [suppliers, searchTerm]);

  // Filtered Journal Movements
  const filteredJournalMovements = useMemo(() => {
    return movements.filter(m => {
      return (
        m.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.referenceNumber && m.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [movements, searchTerm]);

  // Selected Entity Details
  const selectedCustomer = selectedEntityType === 'customer' ? customers.find(c => c.id === selectedEntityId) : null;
  const selectedSupplier = selectedEntityType === 'supplier' ? suppliers.find(s => s.id === selectedEntityId) : null;

  const selectedEntityMovements = useMemo(() => {
    if (!selectedEntityId) return [];
    return movements.filter(m => m.entityId === selectedEntityId);
  }, [movements, selectedEntityId]);

  const handleOpenDetail = (entityType: 'customer' | 'supplier', entityId: string) => {
    setSelectedEntityType(entityType);
    setSelectedEntityId(entityId);
    setIsDetailModalOpen(true);
  };

  const handleDeleteMovement = (movementId: string) => {
    if (confirm('¿Confirmas que deseas eliminar este movimiento contable? Se recalculará el saldo de la cuenta.')) {
      StorageService.deleteAccountMovement(movementId);
      onDataUpdated();
    }
  };

  const handleSendWhatsApp = (customer: Customer) => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const bankInfo = settings.bankDetails ? `\n\n📌 *Datos para Transferencia:*\n${settings.bankDetails}` : '';
    const message = encodeURIComponent(
      `¡Hola ${customer.name}! Te escribimos desde ${settings.workshopName}.\n\n` +
      `Te enviamos el estado actualizado de tu Cuenta Corriente:\n` +
      `• *Saldo adeudado:* ${formatCurrency(customer.currentBalance)}\n` +
      `• *Pedidos registrados:* ${customer.totalOrdersCount}` +
      bankInfo +
      `\n\nQuedamos a tu disposición para cualquier consulta. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleExportPDF = (entityType: 'customer' | 'supplier', entityId: string) => {
    const entityMovements = movements.filter(m => m.entityId === entityId);
    if (entityType === 'customer') {
      const cust = customers.find(c => c.id === entityId);
      if (!cust) return;
      ExportService.exportAccountStatementToPDF(
        cust.name,
        'customer',
        entityMovements,
        cust.currentBalance,
        settings,
        {
          phone: cust.phone,
          email: cust.email,
          address: cust.address,
          taxId: cust.taxId
        }
      );
    } else {
      const sup = suppliers.find(s => s.id === entityId);
      if (!sup) return;
      const sorted = [...entityMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const currentBalance = sorted.length > 0 ? sorted[sorted.length - 1].balanceAfter : 0;
      ExportService.exportAccountStatementToPDF(
        sup.name,
        'supplier',
        entityMovements,
        currentBalance,
        settings,
        {
          phone: sup.phone,
          email: sup.email,
          address: sup.address,
          taxId: sup.cuitRut
        }
      );
    }
  };

  const handleExportExcel = (entityType: 'customer' | 'supplier', entityId: string) => {
    const entityMovements = movements.filter(m => m.entityId === entityId);
    if (entityType === 'customer') {
      const cust = customers.find(c => c.id === entityId);
      if (!cust) return;
      ExportService.exportAccountStatementToExcel(
        cust.name,
        'customer',
        entityMovements,
        cust.currentBalance,
        settings,
        {
          phone: cust.phone,
          email: cust.email,
          address: cust.address,
          taxId: cust.taxId
        }
      );
    } else {
      const sup = suppliers.find(s => s.id === entityId);
      if (!sup) return;
      const sorted = [...entityMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const currentBalance = sorted.length > 0 ? sorted[sorted.length - 1].balanceAfter : 0;
      ExportService.exportAccountStatementToExcel(
        sup.name,
        'supplier',
        entityMovements,
        currentBalance,
        settings,
        {
          phone: sup.phone,
          email: sup.email,
          address: sup.address,
          taxId: sup.cuitRut
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>Gestión de Cuentas Corrientes & Saldos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Libro de cuenta corriente de clientes y proveedores, recibos de cobro y extractos contables en PDF / Excel
          </p>
        </div>

        <button
          onClick={() => onOpenNewPayment()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Cobro / Pago</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400 block uppercase font-bold tracking-wider">
              Total por Cobrar (Clientes)
            </span>
            <span className="text-2xl font-black text-amber-400">{formatCurrency(totalCustomerDebt)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {debtorCustomersCount} cliente(s) con saldo adeudado
            </span>
          </div>
          <div className="p-3 bg-amber-950/50 border border-amber-800/60 rounded-xl text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400 block uppercase font-bold tracking-wider">
              Cobranzas del Mes
            </span>
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(currentMonthCollections)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Ingresos registrados a cuenta corriente
            </span>
          </div>
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-400">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-purple-400 block uppercase font-bold tracking-wider">
              Pagos a Proveedores (Mes)
            </span>
            <span className="text-2xl font-black text-purple-400">{formatCurrency(currentMonthSupplierPayments)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Cancelación de insumos y compras
            </span>
          </div>
          <div className="p-3 bg-purple-950/50 border border-purple-800/60 rounded-xl text-purple-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-cyan-400 block uppercase font-bold tracking-wider">
              Movimientos Registrados
            </span>
            <span className="text-2xl font-black text-cyan-400">{movements.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Asientos contables históricos en el libro
            </span>
          </div>
          <div className="p-3 bg-cyan-950/50 border border-cyan-800/60 rounded-xl text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'customers'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cuentas de Clientes</span>
          {debtorCustomersCount > 0 && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {debtorCustomersCount} con deuda
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Cuentas de Proveedores</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'journal'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Libro Diario General</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'customers'
                ? 'Buscar por cliente, teléfono o colegio...'
                : activeTab === 'suppliers'
                ? 'Buscar proveedor o contacto...'
                : 'Buscar por concepto, comprobante o entidad...'
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {activeTab === 'customers' && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtro:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter('debt')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                statusFilter === 'debt' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Con Saldo Adeudado ({debtorCustomersCount})
            </button>
            <button
              onClick={() => setStatusFilter('up_to_date')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                statusFilter === 'up_to_date' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Al Día ({customers.length - debtorCustomersCount})
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Customers View */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const customerMovements = movements.filter(m => m.entityId === customer.id);
            const hasDebt = customer.currentBalance > 0;

            return (
              <div
                key={customer.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base">{customer.name}</h3>
                      {customer.businessOrContact && (
                        <p className="text-xs text-cyan-400 font-medium">{customer.businessOrContact}</p>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        hasDebt
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                      }`}
                    >
                      {hasDebt ? 'Con Deuda' : 'Al Día'}
                    </span>
                  </div>

                  {/* Balance Display */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      hasDebt
                        ? 'bg-amber-950/30 border-amber-800/50'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo en Cuenta</span>
                      <strong className={`text-lg font-black ${hasDebt ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(customer.currentBalance)}
                      </strong>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <span>{customerMovements.length} asientos</span>
                      <span className="block text-[10px] text-slate-500">
                        {customer.totalOrdersCount} pedidos
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="truncate">📞 {customer.phone}</p>
                    {customer.email && <p className="truncate">✉️ {customer.email}</p>}
                    {customer.address && <p className="truncate">📍 {customer.address}</p>}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleOpenDetail('customer', customer.id)}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Extracto</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenNewPayment('customer', customer.id)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    title="Cargar Cobro"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cobro</span>
                  </button>

                  {customer.phone && (
                    <button
                      onClick={() => handleSendWhatsApp(customer)}
                      className="p-1.5 bg-emerald-950 hover:bg-emerald-800 text-emerald-400 hover:text-white rounded-lg border border-emerald-800 transition-colors"
                      title="Enviar resumen y datos de transferencia por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleExportPDF('customer', customer.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Descargar Extracto en PDF Membretado"
                  >
                    <FileText className="w-4 h-4 text-orange-400" />
                  </button>

                  <button
                    onClick={() => handleExportExcel('customer', customer.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Exportar Extracto a Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Suppliers View */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
            const supplierMovements = movements.filter(m => m.entityId === supplier.id);
            const sorted = [...supplierMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const currentDebt = sorted.length > 0 ? sorted[sorted.length - 1].balanceAfter : 0;

            return (
              <div
                key={supplier.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base">{supplier.name}</h3>
                      <p className="text-xs text-purple-400 font-medium">Contacto: {supplier.contactPerson}</p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        currentDebt > 0
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {currentDebt > 0 ? 'Saldo a Pagar' : 'Al Día'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Deuda Pendiente</span>
                      <strong className={`text-lg font-black ${currentDebt > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {formatCurrency(currentDebt)}
                      </strong>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <span>{supplierMovements.length} asientos</span>
                      <span className="block text-[10px] text-slate-500">Demora: {supplier.leadTimeDays} días</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="truncate">📞 {supplier.phone}</p>
                    <p className="truncate">✉️ {supplier.email}</p>
                    {supplier.cuitRut && <p className="truncate font-mono">CUIT: {supplier.cuitRut}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleOpenDetail('supplier', supplier.id)}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Extracto</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenNewPayment('supplier', supplier.id)}
                    className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    title="Registrar Orden de Pago"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pago</span>
                  </button>

                  <button
                    onClick={() => handleExportPDF('supplier', supplier.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Descargar Extracto en PDF Membretado"
                  >
                    <FileText className="w-4 h-4 text-orange-400" />
                  </button>

                  <button
                    onClick={() => handleExportExcel('supplier', supplier.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Exportar Extracto a Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: General Journal (Libro Diario) */}
      {activeTab === 'journal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4 text-right">Debe (+)</th>
                  <th className="py-3 px-4 text-right">Haber (-)</th>
                  <th className="py-3 px-4 text-right">Saldo</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredJournalMovements.map(m => {
                  const isDebit = m.debit > 0;
                  const isCredit = m.credit > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(m.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {m.entityType === 'customer' ? (
                            <span className="w-2 h-2 rounded-full bg-cyan-400" title="Cliente" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-purple-400" title="Proveedor" />
                          )}
                          <span>{m.entityName}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {m.referenceNumber || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.type.startsWith('pago')
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                              : m.type === 'cargo_pedido'
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                              : m.type === 'compra_proveedor'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {m.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={m.concept}>
                        {m.concept}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap uppercase text-[10px]">
                        {m.paymentMethod || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                        {isDebit ? formatCurrency(m.debit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {isCredit ? formatCurrency(m.credit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(m.balanceAfter)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteMovement(m.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          title="Eliminar asiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal: Account Statement */}
      {isDetailModalOpen && (selectedCustomer || selectedSupplier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-950/70 border border-emerald-800/80 rounded-lg text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Extracto de Cuenta Corriente: {selectedCustomer ? selectedCustomer.name : selectedSupplier?.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedCustomer
                      ? `Tel: ${selectedCustomer.phone} • Email: ${selectedCustomer.email || 'Sin email'}`
                      : `Contacto: ${selectedSupplier?.contactPerson} • Tel: ${selectedSupplier?.phone}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPDF(selectedEntityType, selectedEntityId!)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Descargar en PDF Membretado"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-400" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => handleExportExcel(selectedEntityType, selectedEntityId!)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Descargar en Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={() => onOpenNewPayment(selectedEntityType, selectedEntityId!)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Cobro / Pago</span>
                </button>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Balance Summary Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {selectedEntityType === 'customer' ? 'Total Cargos (Debe)' : 'Total Pagos Emitidos'}
                  </span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(
                      selectedEntityMovements.reduce((acc, m) => acc + (selectedEntityType === 'customer' ? m.debit : m.debit), 0)
                    )}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                    {selectedEntityType === 'customer' ? 'Total Pagos Recibidos (Haber)' : 'Total Facturas Proveedor'}
                  </span>
                  <span className="text-xl font-bold text-emerald-400">
                    {formatCurrency(
                      selectedEntityMovements.reduce((acc, m) => acc + (selectedEntityType === 'customer' ? m.credit : m.credit), 0)
                    )}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">
                    Saldo Actual
                  </span>
                  <span className="text-xl font-black text-amber-400">
                    {selectedCustomer
                      ? formatCurrency(selectedCustomer.currentBalance)
                      : formatCurrency(
                          selectedEntityMovements.length > 0
                            ? selectedEntityMovements[0].balanceAfter
                            : 0
                        )}
                  </span>
                </div>
              </div>

              {/* Table of Movements */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Comprobante</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-3">Medio</th>
                      <th className="py-2.5 px-3 text-right">Debe (+)</th>
                      <th className="py-2.5 px-3 text-right">Haber (-)</th>
                      <th className="py-2.5 px-3 text-right">Saldo</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedEntityMovements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-500 text-xs">
                          No hay movimientos registrados para esta cuenta.
                        </td>
                      </tr>
                    ) : (
                      selectedEntityMovements.map(m => (
                        <tr key={m.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(m.date).toLocaleDateString('es-AR')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {m.referenceNumber || '-'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                              {m.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">{m.concept}</td>
                          <td className="py-2.5 px-3 text-slate-400 uppercase text-[10px] whitespace-nowrap">
                            {m.paymentMethod || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                            {m.debit > 0 ? formatCurrency(m.debit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {m.credit > 0 ? formatCurrency(m.credit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                            {formatCurrency(m.balanceAfter)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleDeleteMovement(m.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                              title="Eliminar asiento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
