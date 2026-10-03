/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StorageService, calculateOrderUrgency } from './services/storageService';
import {
  ProductItem,
  Supplier,
  Customer,
  CustomerOrder,
  PurchaseOrder,
  DailySale,
  StockAlert,
  Quotation,
  AppUser,
  AccountMovement
} from './types';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { DashboardView } from './components/views/DashboardView';
import { InventoryView } from './components/views/InventoryView';
import { AlertsView } from './components/views/AlertsView';
import { OrdersProductionView } from './components/views/OrdersProductionView';
import { SuppliersView } from './components/views/SuppliersView';
import { CustomersView } from './components/views/CustomersView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { QuotationsView } from './components/views/QuotationsView';
import { UsersView } from './components/views/UsersView';
import { BackendCloudView } from './components/views/BackendCloudView';
import { CurrentAccountsView } from './components/views/CurrentAccountsView';
import { MultiDeviceView } from './components/views/MultiDeviceView';
import { FirestoreService } from './services/firestoreService';

// Modals
import { NewDailySaleModal } from './components/modals/NewDailySaleModal';
import { NewCustomerOrderModal } from './components/modals/NewCustomerOrderModal';
import { NewProductModal } from './components/modals/NewProductModal';
import { NewPurchaseOrderModal } from './components/modals/NewPurchaseOrderModal';
import { QuickRestockModal } from './components/modals/QuickRestockModal';
import { OrderDetailsModal } from './components/modals/OrderDetailsModal';
import { NewCustomerModal } from './components/modals/NewCustomerModal';
import { NewSupplierModal } from './components/modals/NewSupplierModal';
import { NewQuotationModal } from './components/modals/NewQuotationModal';
import { QuotationPrintModal } from './components/modals/QuotationPrintModal';
import { NewPaymentModal } from './components/modals/NewPaymentModal';
import { CloudSyncModal } from './components/modals/CloudSyncModal';
import { AndroidApkModal } from './components/modals/AndroidApkModal';
import { WindowsExeModal } from './components/modals/WindowsExeModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [accountMovements, setAccountMovements] = useState<AccountMovement[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser>(StorageService.getCurrentUser());
  const [settings, setSettings] = useState(StorageService.getSettings());

  // Modal States
  const [isDailySaleOpen, setIsDailySaleOpen] = useState(false);
  const [isCustomerOrderOpen, setIsCustomerOrderOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductItem | null>(null);
  const [initialSkuForNewProduct, setInitialSkuForNewProduct] = useState<string | undefined>(undefined);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [preselectedSupplierId, setPreselectedSupplierId] = useState<string | undefined>(undefined);
  const [isQuickRestockOpen, setIsQuickRestockOpen] = useState(false);
  const [productToRestock, setProductToRestock] = useState<ProductItem | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  // Payment / Cta Cte Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentEntityType, setPaymentEntityType] = useState<'customer' | 'supplier'>('customer');
  const [paymentEntityId, setPaymentEntityId] = useState<string | undefined>(undefined);

  // Cloud Sync & Local Offline Modal
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isAndroidApkOpen, setIsAndroidApkOpen] = useState(false);
  const [isWindowsExeOpen, setIsWindowsExeOpen] = useState(false);

  // Preference states: Show/Hide Android Access & MultiDevice Tab
  const [showAndroidAccess, setShowAndroidAccess] = useState<boolean>(() => {
    return localStorage.getItem('sublistock_show_android_header') !== 'false';
  });
  const [showMultiDeviceTab, setShowMultiDeviceTab] = useState<boolean>(() => {
    return localStorage.getItem('sublistock_show_multidevice_tab') !== 'false';
  });

  const handleHideAndroidAccess = () => {
    setShowAndroidAccess(false);
    localStorage.setItem('sublistock_show_android_header', 'false');
  };

  // Quotation Modals
  const [isNewQuotationOpen, setIsNewQuotationOpen] = useState(false);
  const [isPrintQuotationOpen, setIsPrintQuotationOpen] = useState(false);
  const [quotationToPrint, setQuotationToPrint] = useState<Quotation | null>(null);

  // Sync data from StorageService
  const loadData = useCallback(() => {
    setProducts(StorageService.getProducts());
    setSuppliers(StorageService.getSuppliers());
    setCustomers(StorageService.getCustomers());
    setOrders(StorageService.getCustomerOrders());
    setPurchases(StorageService.getPurchaseOrders());
    setDailySales(StorageService.getDailySales());
    setStockAlerts(StorageService.getStockAlerts());
    setQuotations(StorageService.getQuotations());
    setAccountMovements(StorageService.getAccountMovements());
    setUsers(StorageService.getUsers());
    setCurrentUser(StorageService.getCurrentUser());
    setSettings(StorageService.getSettings());
  }, []);

  useEffect(() => {
    // Zero out old fictitious records on mount if not done yet, keeping products intact
    if (localStorage.getItem('sublistock_zeroed_fictitious_v1') !== 'true') {
      StorageService.resetFictitiousDataToZero(true);
    }

    loadData();

    // Listen to reactive update events
    const handleUpdate = () => loadData();
    window.addEventListener('sublistock_products_updated', handleUpdate);
    window.addEventListener('sublistock_orders_updated', handleUpdate);
    window.addEventListener('sublistock_purchases_updated', handleUpdate);
    window.addEventListener('sublistock_sales_updated', handleUpdate);
    window.addEventListener('sublistock_daily_sales_updated', handleUpdate);
    window.addEventListener('sublistock_customers_updated', handleUpdate);
    window.addEventListener('sublistock_suppliers_updated', handleUpdate);
    window.addEventListener('sublistock_settings_updated', handleUpdate);
    window.addEventListener('sublistock_quotes_updated', handleUpdate);
    window.addEventListener('sublistock_movements_updated', handleUpdate);
    window.addEventListener('sublistock_users_updated', handleUpdate);
    window.addEventListener('sublistock_auth_changed', handleUpdate);
    window.addEventListener('sublistock_reset_to_zero', handleUpdate);

    const handlePrefs = () => {
      setShowAndroidAccess(localStorage.getItem('sublistock_show_android_header') !== 'false');
      setShowMultiDeviceTab(localStorage.getItem('sublistock_show_multidevice_tab') !== 'false');
    };
    window.addEventListener('sublistock_prefs_updated', handlePrefs);

    // Listen to real-time sync events from other devices (PC, Android, iOS) via Firestore
    const unsubscribeCloud = FirestoreService.listenToRemoteSync(() => {
      FirestoreService.downloadAllFromCloud().then(res => {
        if (res.success) {
          loadData();
        }
      });
    });

    return () => {
      window.removeEventListener('sublistock_products_updated', handleUpdate);
      window.removeEventListener('sublistock_orders_updated', handleUpdate);
      window.removeEventListener('sublistock_purchases_updated', handleUpdate);
      window.removeEventListener('sublistock_sales_updated', handleUpdate);
      window.removeEventListener('sublistock_daily_sales_updated', handleUpdate);
      window.removeEventListener('sublistock_customers_updated', handleUpdate);
      window.removeEventListener('sublistock_suppliers_updated', handleUpdate);
      window.removeEventListener('sublistock_settings_updated', handleUpdate);
      window.removeEventListener('sublistock_quotes_updated', handleUpdate);
      window.removeEventListener('sublistock_movements_updated', handleUpdate);
      window.removeEventListener('sublistock_users_updated', handleUpdate);
      window.removeEventListener('sublistock_auth_changed', handleUpdate);
      window.removeEventListener('sublistock_reset_to_zero', handleUpdate);
      window.removeEventListener('sublistock_prefs_updated', handlePrefs);
      if (unsubscribeCloud) unsubscribeCloud();
    };
  }, [loadData]);

  // Urgent and critical counters
  const criticalStockCount = stockAlerts.filter(a => a.severity === 'critical' || a.severity === 'out_of_stock').length;
  const activeOrders = orders.filter(o => o.productionStatus !== 'entregado' && o.productionStatus !== 'cancelado');
  const urgentOrdersCount = activeOrders.filter(o => {
    const urg = calculateOrderUrgency(o.deliveryDate, o.productionStatus);
    return urg.urgency === 'overdue' || urg.urgency === 'today';
  }).length;

  // Handlers for Opening Modals
  const handleOpenNewProduct = () => {
    setProductToEdit(null);
    setInitialSkuForNewProduct(undefined);
    setIsProductModalOpen(true);
  };

  const handleOpenNewProductWithSku = (sku?: string) => {
    setProductToEdit(null);
    setInitialSkuForNewProduct(sku);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: ProductItem) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleQuickRestock = (prod: ProductItem) => {
    setProductToRestock(prod);
    setIsQuickRestockOpen(true);
  };

  const handleOpenPurchaseOrder = (supplierId?: string) => {
    setPreselectedSupplierId(supplierId);
    setIsPurchaseModalOpen(true);
  };

  const handleSelectOrder = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handleOpenNewCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (cust: Customer) => {
    setCustomerToEdit(cust);
    setIsCustomerModalOpen(true);
  };

  const handleOpenNewOrderForCustomer = (customerId: string) => {
    setIsCustomerOrderOpen(true);
  };

  const handleOpenNewSupplier = () => {
    setSupplierToEdit(null);
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (sup: Supplier) => {
    setSupplierToEdit(sup);
    setIsSupplierModalOpen(true);
  };

  const handleViewPrintQuotation = (quote: Quotation) => {
    setQuotationToPrint(quote);
    setIsPrintQuotationOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Header */}
      <Header
        workshopName={settings.workshopName}
        logoUrl={settings.logoUrl}
        criticalStockCount={criticalStockCount}
        urgentOrdersCount={urgentOrdersCount}
        currentUser={currentUser}
        onNavigateTab={setActiveTab}
        onOpenNewSale={() => setIsDailySaleOpen(true)}
        onOpenNewOrder={() => setIsCustomerOrderOpen(true)}
        onOpenNewQuotation={() => setIsNewQuotationOpen(true)}
        onOpenNewProduct={handleOpenNewProduct}
        onOpenNewPurchase={() => handleOpenPurchaseOrder()}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
      />

      {/* Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        criticalAlertsCount={criticalStockCount}
        activeOrdersCount={activeOrders.length}
        productsCount={products.length}
        quotationsCount={quotations.length}
        debtorCustomersCount={customers.filter(c => c.currentBalance > 0).length}
        showMultiDeviceTab={showMultiDeviceTab}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            orders={orders}
            dailySales={dailySales}
            purchases={purchases}
            stockAlerts={stockAlerts}
            onOpenNewSale={() => setIsDailySaleOpen(true)}
            onOpenNewOrder={() => setIsCustomerOrderOpen(true)}
            onOpenNewQuotation={() => setIsNewQuotationOpen(true)}
            onNavigateTab={setActiveTab}
            onSelectOrder={handleSelectOrder}
            onDismissAllAlerts={loadData}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onOpenNewProduct={handleOpenNewProduct}
            onOpenNewProductWithSku={handleOpenNewProductWithSku}
            onEditProduct={handleEditProduct}
            onQuickRestock={handleQuickRestock}
            onRefreshData={loadData}
            onNavigateToLabels={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            stockAlerts={stockAlerts}
            suppliers={suppliers}
            onQuickRestock={handleQuickRestock}
            onOpenPurchaseOrder={handleOpenPurchaseOrder}
            onNavigateTab={setActiveTab}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersProductionView
            orders={orders}
            onOpenNewOrder={() => setIsCustomerOrderOpen(true)}
            onSelectOrder={handleSelectOrder}
            onUpdateOrderStatus={(orderId, status) => {
              StorageService.updateOrderStatus(orderId, status);
              loadData();
            }}
            onOrderDeleted={loadData}
          />
        )}

        {activeTab === 'cuentas_corrientes' && (
          <CurrentAccountsView
            customers={customers}
            suppliers={suppliers}
            movements={accountMovements}
            settings={settings}
            onOpenNewPayment={(entityType, entityId) => {
              setPaymentEntityType(entityType || 'customer');
              setPaymentEntityId(entityId);
              setIsPaymentModalOpen(true);
            }}
            onDataUpdated={loadData}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationsView
            quotations={quotations}
            customers={customers}
            products={products}
            settings={settings}
            onOpenNewQuotation={() => setIsNewQuotationOpen(true)}
            onViewPrintQuotation={handleViewPrintQuotation}
            onQuotationsUpdated={loadData}
            onOrderCreatedFromQuote={() => {
              loadData();
              setActiveTab('orders');
            }}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            purchases={purchases}
            onOpenNewSupplier={handleOpenNewSupplier}
            onOpenNewPurchase={handleOpenPurchaseOrder}
            onEditSupplier={handleEditSupplier}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            orders={orders}
            onOpenNewCustomer={handleOpenNewCustomer}
            onEditCustomer={handleEditCustomer}
            onOpenNewOrderForCustomer={handleOpenNewOrderForCustomer}
            onNavigateToCurrentAccounts={customerId => {
              setActiveTab('cuentas_corrientes');
            }}
            onOpenNewPayment={customerId => {
              setPaymentEntityType('customer');
              setPaymentEntityId(customerId);
              setIsPaymentModalOpen(true);
            }}
            onCustomerUpdated={loadData}
          />
        )}

        {activeTab === 'multi_device' && (
          <MultiDeviceView />
        )}

        {activeTab === 'users' && (
          <UsersView
            users={users}
            currentUser={currentUser}
            onUsersUpdated={loadData}
            onCurrentUserChanged={user => {
              setCurrentUser(user);
              loadData();
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            products={products}
            orders={orders}
            dailySales={dailySales}
            purchases={purchases}
            accountMovements={accountMovements}
            settings={settings}
          />
        )}

        {activeTab === 'backend' && (
          <BackendCloudView
            products={products}
            suppliers={suppliers}
            customers={customers}
            orders={orders}
            dailySales={dailySales}
            users={users}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onRefreshData={loadData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 no-print">
        <p>SubliStock Pro · Sistema Integral de Gestión de Stock, Insumos, Diseños y Producción para Talleres de Sublimación</p>
      </footer>

      {/* Modals */}
      <NewDailySaleModal
        isOpen={isDailySaleOpen}
        onClose={() => setIsDailySaleOpen(false)}
        products={products}
        onSaleCreated={loadData}
      />

      <NewCustomerOrderModal
        isOpen={isCustomerOrderOpen}
        onClose={() => setIsCustomerOrderOpen(false)}
        customers={customers}
        products={products}
        onOrderCreated={loadData}
      />

      <NewQuotationModal
        isOpen={isNewQuotationOpen}
        onClose={() => setIsNewQuotationOpen(false)}
        customers={customers}
        products={products}
        onQuotationCreated={quote => {
          loadData();
          handleViewPrintQuotation(quote);
        }}
      />

      <QuotationPrintModal
        isOpen={isPrintQuotationOpen}
        onClose={() => setIsPrintQuotationOpen(false)}
        quotation={quotationToPrint}
        settings={settings}
      />

      <NewPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customers={customers}
        suppliers={suppliers}
        initialEntityType={paymentEntityType}
        initialEntityId={paymentEntityId}
        onPaymentSaved={loadData}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        onDataRefreshed={loadData}
      />

      <AndroidApkModal
        isOpen={isAndroidApkOpen}
        onClose={() => setIsAndroidApkOpen(false)}
      />

      <WindowsExeModal
        isOpen={isWindowsExeOpen}
        onClose={() => setIsWindowsExeOpen(false)}
      />

      <NewProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setInitialSkuForNewProduct(undefined);
        }}
        productToEdit={productToEdit}
        initialSku={initialSkuForNewProduct}
        suppliers={suppliers}
        onProductSaved={loadData}
      />

      <NewPurchaseOrderModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        suppliers={suppliers}
        products={products}
        preselectedSupplierId={preselectedSupplierId}
        onPurchaseCreated={loadData}
      />

      <QuickRestockModal
        isOpen={isQuickRestockOpen}
        onClose={() => setIsQuickRestockOpen(false)}
        product={productToRestock}
        onRestocked={loadData}
      />

      <OrderDetailsModal
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        order={selectedOrder}
        onOrderUpdated={() => {
          loadData();
          if (selectedOrder) {
            const updated = StorageService.getCustomerOrders().find(o => o.id === selectedOrder.id);
            if (updated) setSelectedOrder(updated);
          }
        }}
      />

      <NewCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerToEdit={customerToEdit}
        onSaved={loadData}
      />

      <NewSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplierToEdit={supplierToEdit}
        onSaved={loadData}
      />
    </div>
  );
}
