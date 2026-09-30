import {
  ProductItem,
  Supplier,
  Customer,
  CustomerOrder,
  PurchaseOrder,
  DailySale,
  StockAlert,
  UrgencyLevel,
  AppUser,
  Quotation,
  AccountMovement,
  AccountMovementType,
  PaymentMethodType,
  ProductLabelSettings,
  LabelPreset
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PURCHASES,
  INITIAL_DAILY_SALES,
  INITIAL_USERS,
  INITIAL_QUOTATIONS,
  INITIAL_ACCOUNT_MOVEMENTS
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'sublistock_products_v1',
  SUPPLIERS: 'sublistock_suppliers_v1',
  CUSTOMERS: 'sublistock_customers_v1',
  ORDERS: 'sublistock_orders_v1',
  PURCHASES: 'sublistock_purchases_v1',
  DAILY_SALES: 'sublistock_daily_sales_v1',
  SETTINGS: 'sublistock_settings_v1',
  USERS: 'sublistock_users_v1',
  CURRENT_USER_ID: 'sublistock_current_user_v1',
  QUOTATIONS: 'sublistock_quotations_v1',
  ACCOUNT_MOVEMENTS: 'sublistock_account_movements_v1'
};

export const LABEL_PRESETS_CONFIG: Record<LabelPreset, Partial<ProductLabelSettings>> = {
  a4_3x8: {
    preset: 'a4_3x8',
    columns: 3,
    rows: 8,
    labelWidthMm: 64,
    labelHeightMm: 33.8,
    marginTopMm: 12,
    marginLeftMm: 6,
    gapHorizontalMm: 3,
    gapVerticalMm: 0,
    showBorder: true
  },
  a4_4x10: {
    preset: 'a4_4x10',
    columns: 4,
    rows: 10,
    labelWidthMm: 48.5,
    labelHeightMm: 25.4,
    marginTopMm: 13,
    marginLeftMm: 8,
    gapHorizontalMm: 2,
    gapVerticalMm: 0,
    showBorder: true
  },
  a4_3x7: {
    preset: 'a4_3x7',
    columns: 3,
    rows: 7,
    labelWidthMm: 70,
    labelHeightMm: 38.1,
    marginTopMm: 15,
    marginLeftMm: 0,
    gapHorizontalMm: 0,
    gapVerticalMm: 0,
    showBorder: true
  },
  a4_2x5: {
    preset: 'a4_2x5',
    columns: 2,
    rows: 5,
    labelWidthMm: 105,
    labelHeightMm: 57,
    marginTopMm: 6,
    marginLeftMm: 0,
    gapHorizontalMm: 0,
    gapVerticalMm: 0,
    showBorder: true
  },
  custom: {
    preset: 'custom'
  }
};

export const DEFAULT_LABEL_SETTINGS: ProductLabelSettings = {
  preset: 'a4_3x8',
  columns: 3,
  rows: 8,
  labelWidthMm: 64,
  labelHeightMm: 33.8,
  marginTopMm: 12,
  marginLeftMm: 6,
  gapHorizontalMm: 3,
  gapVerticalMm: 0,
  showBorder: true,

  includeBarcode: true,
  includePrice: true,
  includeProductName: true,
  includeLogo: true,

  includeWorkshopName: true,
  includeSku: true,
  includeCategoryOrMaterial: false,
  includeSizeColor: true,
  includeCustomText: false,
  customText: 'Sublimación & Merchandising',

  barcodeFormat: 'CODE128',
  showBarcodeValue: true,
  pricePrefix: '$',
  fontSize: 'medium',
  textAlign: 'center',
  colorTheme: 'monochrome'
};

export interface AppSettings {
  workshopName: string;
  slogan?: string;
  currencySymbol: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  city?: string;
  taxId: string;
  taxCondition?: string;
  taxRatePercent: number;
  logoUrl?: string;
  bankDetails?: string;
  termsAndConditions?: string;
  website?: string;
  instagram?: string;
  enableStockAlerts?: boolean;
  dismissedAlertProductIds?: string[];
  labelSettings?: ProductLabelSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  workshopName: 'SubliStudio Taller Gráfico & Sublimación',
  slogan: 'Sublimación, Estampado Textil & Merchandising Personalizado',
  currencySymbol: '$',
  phone: '+54 11 4567-8901',
  whatsapp: '+54 9 11 4567-8901',
  email: 'contacto@sublistudio.com',
  address: 'Av. Corrientes 3420',
  city: 'CABA, Buenos Aires',
  taxId: '30-71987654-2',
  taxCondition: 'Responsable Inscripto',
  taxRatePercent: 0,
  logoUrl: '',
  bankDetails: 'Banco Galicia • CBU: 0070123456789012345678 • Alias: SUBLISTUDIO.OFICIAL',
  termsAndConditions: 'Presupuesto válido por 15 días corridos. Precios incluyen insumos e impresión en alta definición. Seña 50% al aprobar boceto digital, saldo contra entrega.',
  website: 'www.sublistudio.com',
  instagram: '@sublistudio.ok',
  enableStockAlerts: true,
  dismissedAlertProductIds: [],
  labelSettings: DEFAULT_LABEL_SETTINGS
};

export class StorageService {
  // PRODUCTS
  static getProducts(): ProductItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  static saveProducts(products: ProductItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new Event('sublistock_products_updated'));
  }

  static addProduct(product: Omit<ProductItem, 'id'>): ProductItem {
    const products = this.getProducts();
    const newProduct: ProductItem = {
      ...product,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  static updateProduct(product: ProductItem): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      this.saveProducts(products);
    }
  }

  static deleteProduct(productId: string): void {
    const products = this.getProducts().filter(p => p.id !== productId);
    this.saveProducts(products);
  }

  static quickRestock(productId: string, quantityToAdd: number, newCostPrice?: number): void {
    const products = this.getProducts();
    const item = products.find(p => p.id === productId);
    if (item) {
      item.currentStock += quantityToAdd;
      item.lastRestocked = new Date().toISOString().split('T')[0];
      if (newCostPrice && newCostPrice > 0) {
        item.costPrice = newCostPrice;
      }
      this.saveProducts(products);
    }
  }

  // ALERTS CALCULATION & DISMISSAL
  static getStockAlerts(includeDismissed = false): StockAlert[] {
    const settings = this.getSettings();
    if (!includeDismissed && settings.enableStockAlerts === false) {
      return [];
    }

    const dismissedSet = new Set(settings.dismissedAlertProductIds || []);
    const products = this.getProducts();
    const orders = this.getCustomerOrders().filter(
      o => o.productionStatus !== 'entregado' && o.productionStatus !== 'cancelado'
    );

    // Calculate required units for pending production
    const pendingDemand: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items) {
        pendingDemand[item.productId] = (pendingDemand[item.productId] || 0) + item.quantity;
      }
    }

    const alerts: StockAlert[] = [];

    for (const prod of products) {
      if (!includeDismissed && dismissedSet.has(prod.id)) {
        continue;
      }

      const demand = pendingDemand[prod.id] || 0;
      const effectiveStock = prod.currentStock;

      if (effectiveStock === 0) {
        alerts.push({
          product: prod,
          severity: 'out_of_stock',
          deficit: prod.minStock + demand,
          ordersImpactedCount: demand > 0 ? 1 : 0
        });
      } else if (effectiveStock <= prod.minStock) {
        alerts.push({
          product: prod,
          severity: 'critical',
          deficit: (prod.minStock - effectiveStock) + demand,
          ordersImpactedCount: demand > effectiveStock ? 1 : 0
        });
      } else if (effectiveStock <= prod.minStock * 1.4) {
        alerts.push({
          product: prod,
          severity: 'warning',
          deficit: Math.max(0, (prod.minStock * 1.5) - effectiveStock),
          ordersImpactedCount: demand > 0 ? 1 : 0
        });
      }
    }

    // Sort by severity (out of stock first, then critical, then warning)
    return alerts.sort((a, b) => {
      const rank = { out_of_stock: 0, critical: 1, warning: 2 };
      return rank[a.severity] - rank[b.severity];
    });
  }

  static getDismissedStockAlerts(): StockAlert[] {
    const settings = this.getSettings();
    const dismissedSet = new Set(settings.dismissedAlertProductIds || []);
    if (dismissedSet.size === 0) return [];

    const allAlerts = this.getStockAlerts(true);
    return allAlerts.filter(a => dismissedSet.has(a.product.id));
  }

  static dismissStockAlert(productId: string): void {
    const settings = this.getSettings();
    const current = settings.dismissedAlertProductIds || [];
    if (!current.includes(productId)) {
      settings.dismissedAlertProductIds = [...current, productId];
      this.saveSettings(settings);
    }
  }

  static restoreStockAlert(productId: string): void {
    const settings = this.getSettings();
    const current = settings.dismissedAlertProductIds || [];
    settings.dismissedAlertProductIds = current.filter(id => id !== productId);
    this.saveSettings(settings);
  }

  static dismissAllStockAlerts(): void {
    const settings = this.getSettings();
    const allAlerts = this.getStockAlerts(true);
    settings.dismissedAlertProductIds = allAlerts.map(a => a.product.id);
    this.saveSettings(settings);
  }

  static restoreAllStockAlerts(): void {
    const settings = this.getSettings();
    settings.dismissedAlertProductIds = [];
    settings.enableStockAlerts = true;
    this.saveSettings(settings);
  }

  static setStockAlertsEnabled(enabled: boolean): void {
    const settings = this.getSettings();
    settings.enableStockAlerts = enabled;
    this.saveSettings(settings);
  }

  // SUPPLIERS
  static getSuppliers(): Supplier[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (!raw) {
      this.saveSuppliers(INITIAL_SUPPLIERS);
      return INITIAL_SUPPLIERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUPPLIERS;
    }
  }

  static saveSuppliers(suppliers: Supplier[]): void {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
    window.dispatchEvent(new Event('sublistock_suppliers_updated'));
  }

  static addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const suppliers = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: 'sup-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    suppliers.unshift(newSupplier);
    this.saveSuppliers(suppliers);
    return newSupplier;
  }

  static updateSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === supplier.id);
    if (index !== -1) {
      suppliers[index] = supplier;
      this.saveSuppliers(suppliers);
    }
  }

  static deleteSupplier(supplierId: string): void {
    const suppliers = this.getSuppliers().filter(s => s.id !== supplierId);
    this.saveSuppliers(suppliers);
  }

  // PURCHASE ORDERS (COMPRAS A PROVEEDORES)
  static getPurchaseOrders(): PurchaseOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!raw) {
      this.savePurchaseOrders(INITIAL_PURCHASES);
      return INITIAL_PURCHASES;
    }
    try {
      const list: PurchaseOrder[] = JSON.parse(raw);
      if (list.length < INITIAL_PURCHASES.length) {
        const existingIds = new Set(list.map(p => p.id));
        const missing = INITIAL_PURCHASES.filter(p => !existingIds.has(p.id));
        if (missing.length > 0) {
          const merged = [...list, ...missing];
          this.savePurchaseOrders(merged);
          return merged;
        }
      }
      return list;
    } catch {
      return INITIAL_PURCHASES;
    }
  }

  static savePurchaseOrders(purchases: PurchaseOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
    window.dispatchEvent(new Event('sublistock_purchases_updated'));
  }

  static addPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'orderNumber'>): PurchaseOrder {
    const purchases = this.getPurchaseOrders();
    const count = purchases.length + 1;
    const year = new Date().getFullYear();
    const newOrder: PurchaseOrder = {
      ...order,
      id: 'pur-' + Date.now(),
      orderNumber: `COM-${year}-${String(count).padStart(3, '0')}`
    };
    purchases.unshift(newOrder);

    // If order was created directly as 'recibido', update stock immediately
    if (newOrder.status === 'recibido') {
      this.applyPurchaseToStock(newOrder);
    }

    this.savePurchaseOrders(purchases);
    return newOrder;
  }

  static markPurchaseAsReceived(orderId: string): void {
    const purchases = this.getPurchaseOrders();
    const order = purchases.find(p => p.id === orderId);
    if (order && order.status !== 'recibido') {
      order.status = 'recibido';
      order.receivedDate = new Date().toISOString().split('T')[0];
      this.applyPurchaseToStock(order);
      this.savePurchaseOrders(purchases);
    }
  }

  private static applyPurchaseToStock(purchase: PurchaseOrder): void {
    const products = this.getProducts();
    for (const item of purchase.items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.currentStock += item.quantity;
        prod.lastRestocked = purchase.receivedDate || new Date().toISOString().split('T')[0];
        if (item.unitCost > 0) {
          prod.costPrice = item.unitCost;
        }
      }
    }
    this.saveProducts(products);
  }

  // CUSTOMERS
  static getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      this.saveCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    window.dispatchEvent(new Event('sublistock_customers_updated'));
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrdersCount' | 'totalSpent'>): Customer {
    const customers = this.getCustomers();
    const newCust: Customer = {
      ...customer,
      id: 'cust-' + Date.now(),
      totalOrdersCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    customers.unshift(newCust);
    this.saveCustomers(customers);
    return newCust;
  }

  static updateCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
      this.saveCustomers(customers);
    }
  }

  // CUSTOMER ORDERS (PEDIDOS CON PRODUCCIÓN Y FECHAS DE ENTREGA)
  static getCustomerOrders(): CustomerOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      this.saveCustomerOrders(INITIAL_ORDERS);
      return INITIAL_ORDERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ORDERS;
    }
  }

  static saveCustomerOrders(orders: CustomerOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new Event('sublistock_orders_updated'));
  }

  static addCustomerOrder(order: Omit<CustomerOrder, 'id' | 'orderNumber' | 'createdAt' | 'remainingBalance'>): CustomerOrder {
    const orders = this.getCustomerOrders();
    const count = orders.length + 100;
    const year = new Date().getFullYear();
    const remainingBalance = Math.max(0, order.totalAmount - (order.depositAmount || 0));

    const newOrder: CustomerOrder = {
      ...order,
      id: 'ord-' + Date.now(),
      orderNumber: `PED-${year}-${count}`,
      createdAt: new Date().toISOString(),
      remainingBalance
    };

    // Deduct stock of raw materials
    const products = this.getProducts();
    for (const item of newOrder.items) {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.currentStock = Math.max(0, p.currentStock - item.quantity);
      }
    }
    this.saveProducts(products);

    // Update customer stats
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === newOrder.customerId);
    if (customer) {
      customer.totalOrdersCount += 1;
      customer.totalSpent += newOrder.totalAmount;
      this.saveCustomers(customers);
    }

    orders.unshift(newOrder);
    this.saveCustomerOrders(orders);

    // Register Account Movement for the Order (Debit)
    this.addAccountMovement({
      entityType: 'customer',
      entityId: newOrder.customerId,
      entityName: newOrder.customerName,
      date: newOrder.createdAt,
      type: 'cargo_pedido',
      concept: `Pedido ${newOrder.orderNumber}: ${newOrder.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`,
      referenceNumber: newOrder.orderNumber,
      debit: newOrder.totalAmount,
      credit: 0
    });

    // If there is an initial deposit/seña, register Credit movement
    if (newOrder.depositAmount > 0) {
      this.addAccountMovement({
        entityType: 'customer',
        entityId: newOrder.customerId,
        entityName: newOrder.customerName,
        date: newOrder.createdAt,
        type: 'pago_seña',
        concept: `Seña / Anticipo para Pedido ${newOrder.orderNumber}`,
        referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
        debit: 0,
        credit: newOrder.depositAmount,
        paymentMethod: 'efectivo'
      });
    }

    return newOrder;
  }

  static updateOrderStatus(orderId: string, newStatus: CustomerOrder['productionStatus']): void {
    const orders = this.getCustomerOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.productionStatus = newStatus;
      if (newStatus === 'entregado' && !order.deliveredAt) {
        order.deliveredAt = new Date().toISOString();
        // If remaining balance is paid upon delivery, update customer balance
        if (order.remainingBalance > 0 && order.paymentStatus === 'pagado') {
          this.addAccountMovement({
            entityType: 'customer',
            entityId: order.customerId,
            entityName: order.customerName,
            date: new Date().toISOString(),
            type: 'pago_recibido',
            concept: `Saldo final cancelado contra entrega Pedido ${order.orderNumber}`,
            referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
            debit: 0,
            credit: order.remainingBalance,
            paymentMethod: 'efectivo'
          });
          order.remainingBalance = 0;
        }
      }
      this.saveCustomerOrders(orders);
    }
  }

  static updateOrderPayment(orderId: string, paymentStatus: CustomerOrder['paymentStatus'], additionalPayment: number, paymentMethod: PaymentMethodType = 'transferencia', referenceNote?: string): void {
    const orders = this.getCustomerOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.depositAmount += additionalPayment;
      order.remainingBalance = Math.max(0, order.totalAmount - order.depositAmount);

      this.saveCustomerOrders(orders);

      if (additionalPayment > 0) {
        this.addAccountMovement({
          entityType: 'customer',
          entityId: order.customerId,
          entityName: order.customerName,
          date: new Date().toISOString(),
          type: 'pago_recibido',
          concept: `Cobro / Pago recibido para Pedido ${order.orderNumber}`,
          referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
          debit: 0,
          credit: additionalPayment,
          paymentMethod,
          notes: referenceNote
        });
      }
    }
  }

  // DAILY SALES (VENTAS DIARIAS DE MOSTRADOR)
  static getDailySales(): DailySale[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_SALES);
    if (!raw) {
      this.saveDailySales(INITIAL_DAILY_SALES);
      return INITIAL_DAILY_SALES;
    }
    try {
      const list: DailySale[] = JSON.parse(raw);
      if (list.length < INITIAL_DAILY_SALES.length) {
        const existingIds = new Set(list.map(s => s.id));
        const missing = INITIAL_DAILY_SALES.filter(s => !existingIds.has(s.id));
        if (missing.length > 0) {
          const merged = [...list, ...missing];
          this.saveDailySales(merged);
          return merged;
        }
      }
      return list;
    } catch {
      return INITIAL_DAILY_SALES;
    }
  }

  static saveDailySales(sales: DailySale[]): void {
    localStorage.setItem(STORAGE_KEYS.DAILY_SALES, JSON.stringify(sales));
    window.dispatchEvent(new Event('sublistock_sales_updated'));
  }

  static addDailySale(sale: Omit<DailySale, 'id' | 'saleNumber' | 'date'>): DailySale {
    const sales = this.getDailySales();
    const count = sales.length + 400;
    const year = new Date().getFullYear();

    const newSale: DailySale = {
      ...sale,
      id: 'sale-' + Date.now(),
      saleNumber: `VTA-${year}-${count}`,
      date: new Date().toISOString()
    };

    // Deduct stock
    const products = this.getProducts();
    for (const item of newSale.items) {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.currentStock = Math.max(0, p.currentStock - item.quantity);
      }
    }
    this.saveProducts(products);

    sales.unshift(newSale);
    this.saveDailySales(sales);
    return newSale;
  }

  // SETTINGS
  static getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        labelSettings: {
          ...DEFAULT_LABEL_SETTINGS,
          ...(parsed.labelSettings || {})
        }
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('sublistock_settings_updated'));
  }

  // USERS & ROLES
  static getUsers(): AppUser[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      this.saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  }

  static saveUsers(users: AppUser[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    window.dispatchEvent(new Event('sublistock_users_updated'));
  }

  static addUser(user: Omit<AppUser, 'id'>): AppUser {
    const users = this.getUsers();
    const newUser: AppUser = {
      ...user,
      id: 'user-' + Date.now(),
      status: user.status || 'activo'
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  static updateUser(id: string, updates: Partial<AppUser>): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.saveUsers(users);
    }
  }

  static deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);
  }

  static getCurrentUser(): AppUser {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (currentId) {
      const found = users.find(u => u.id === currentId);
      if (found) return found;
    }
    return users[0] || INITIAL_USERS[0];
  }

  static setCurrentUser(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    window.dispatchEvent(new Event('sublistock_auth_changed'));
  }

  // QUOTATIONS (PRESUPUESTOS MEMBRETADOS)
  static getQuotations(): Quotation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
    if (!raw) {
      this.saveQuotations(INITIAL_QUOTATIONS);
      return INITIAL_QUOTATIONS;
    }
    try {
      const list: Quotation[] = JSON.parse(raw);
      // If list has older quotes without cost breakdown or missing new ones, merge or augment
      if (list.length < INITIAL_QUOTATIONS.length) {
        const existingIds = new Set(list.map(q => q.id));
        const missing = INITIAL_QUOTATIONS.filter(q => !existingIds.has(q.id));
        if (missing.length > 0) {
          const merged = [...list, ...missing];
          this.saveQuotations(merged);
          return merged;
        }
      }
      return list;
    } catch {
      return INITIAL_QUOTATIONS;
    }
  }

  static saveQuotations(quotes: Quotation[]): void {
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotes));
    window.dispatchEvent(new Event('sublistock_quotes_updated'));
  }

  static addQuotation(quote: Omit<Quotation, 'id' | 'quoteNumber' | 'createdAt'>): Quotation {
    const quotes = this.getQuotations();
    const count = quotes.length + 101;
    const year = new Date().getFullYear();

    const newQuote: Quotation = {
      ...quote,
      id: 'quote-' + Date.now(),
      quoteNumber: `COT-${year}-${String(count).padStart(4, '0')}`,
      createdAt: new Date().toISOString()
    };
    quotes.unshift(newQuote);
    this.saveQuotations(quotes);
    return newQuote;
  }

  static updateQuotation(id: string, updates: Partial<Quotation>): void {
    const quotes = this.getQuotations();
    const idx = quotes.findIndex(q => q.id === id);
    if (idx !== -1) {
      quotes[idx] = { ...quotes[idx], ...updates };
      this.saveQuotations(quotes);
    }
  }

  static deleteQuotation(id: string): void {
    const quotes = this.getQuotations().filter(q => q.id !== id);
    this.saveQuotations(quotes);
  }

  // ACCOUNT MOVEMENTS / CUENTAS CORRIENTES
  static getAccountMovements(filter?: { entityType?: 'customer' | 'supplier'; entityId?: string }): AccountMovement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT_MOVEMENTS);
    let list: AccountMovement[] = [];
    if (!raw) {
      this.saveAccountMovements(INITIAL_ACCOUNT_MOVEMENTS);
      list = INITIAL_ACCOUNT_MOVEMENTS;
    } else {
      try {
        list = JSON.parse(raw);
        if (list.length < INITIAL_ACCOUNT_MOVEMENTS.length) {
          const existingIds = new Set(list.map(m => m.id));
          const missing = INITIAL_ACCOUNT_MOVEMENTS.filter(m => !existingIds.has(m.id));
          if (missing.length > 0) {
            list = [...list, ...missing];
            this.saveAccountMovements(list);
          }
        }
      } catch {
        list = INITIAL_ACCOUNT_MOVEMENTS;
      }
    }

    if (filter) {
      if (filter.entityType) {
        list = list.filter(m => m.entityType === filter.entityType);
      }
      if (filter.entityId) {
        list = list.filter(m => m.entityId === filter.entityId);
      }
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static saveAccountMovements(movements: AccountMovement[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_MOVEMENTS, JSON.stringify(movements));
    window.dispatchEvent(new Event('sublistock_movements_updated'));
  }

  static addAccountMovement(movement: Omit<AccountMovement, 'id' | 'balanceAfter'>): AccountMovement {
    const movements = this.getAccountMovements();
    const entityMovements = movements.filter(m => m.entityId === movement.entityId);

    let previousBalance = 0;
    if (movement.entityType === 'customer') {
      const customer = this.getCustomers().find(c => c.id === movement.entityId);
      previousBalance = customer ? customer.currentBalance : 0;
    } else {
      const sortedAsc = [...entityMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      previousBalance = sortedAsc.length > 0 ? sortedAsc[sortedAsc.length - 1].balanceAfter : 0;
    }

    let newBalance = previousBalance;
    if (movement.entityType === 'customer') {
      newBalance = previousBalance + (movement.debit || 0) - (movement.credit || 0);
    } else {
      newBalance = previousBalance + (movement.credit || 0) - (movement.debit || 0);
    }

    const newMov: AccountMovement = {
      ...movement,
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      balanceAfter: Math.max(0, newBalance)
    };

    movements.unshift(newMov);
    this.saveAccountMovements(movements);

    // Sync Customer balance
    if (movement.entityType === 'customer') {
      const customers = this.getCustomers();
      const customer = customers.find(c => c.id === movement.entityId);
      if (customer) {
        customer.currentBalance = Math.max(0, newBalance);
        this.saveCustomers(customers);
      }
    }

    return newMov;
  }

  static deleteAccountMovement(id: string): void {
    const movements = this.getAccountMovements();
    const movement = movements.find(m => m.id === id);
    if (!movement) return;

    const filtered = movements.filter(m => m.id !== id);
    this.saveAccountMovements(filtered);

    if (movement.entityType === 'customer') {
      const customers = this.getCustomers();
      const customer = customers.find(c => c.id === movement.entityId);
      if (customer) {
        const diff = (movement.credit || 0) - (movement.debit || 0);
        customer.currentBalance = Math.max(0, customer.currentBalance + diff);
        this.saveCustomers(customers);
      }
    }
  }

  // BACKUP & RESET
  static exportFullBackupJSON(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      products: this.getProducts(),
      suppliers: this.getSuppliers(),
      customers: this.getCustomers(),
      orders: this.getCustomerOrders(),
      purchases: this.getPurchaseOrders(),
      dailySales: this.getDailySales(),
      users: this.getUsers(),
      quotations: this.getQuotations(),
      accountMovements: this.getAccountMovements(),
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFullBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products) this.saveProducts(parsed.products);
      if (parsed.suppliers) this.saveSuppliers(parsed.suppliers);
      if (parsed.customers) this.saveCustomers(parsed.customers);
      if (parsed.orders) this.saveCustomerOrders(parsed.orders);
      if (parsed.purchases) this.savePurchaseOrders(parsed.purchases);
      if (parsed.dailySales) this.saveDailySales(parsed.dailySales);
      if (parsed.users) this.saveUsers(parsed.users);
      if (parsed.quotations) this.saveQuotations(parsed.quotations);
      if (parsed.accountMovements) this.saveAccountMovements(parsed.accountMovements);
      if (parsed.settings) this.saveSettings(parsed.settings);
      return true;
    } catch (err) {
      console.error('Error importing backup:', err);
      return false;
    }
  }

  static resetToDemoData(): void {
    this.saveProducts(INITIAL_PRODUCTS);
    this.saveSuppliers(INITIAL_SUPPLIERS);
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.saveCustomerOrders(INITIAL_ORDERS);
    this.savePurchaseOrders(INITIAL_PURCHASES);
    this.saveDailySales(INITIAL_DAILY_SALES);
    this.saveUsers(INITIAL_USERS);
    this.saveQuotations(INITIAL_QUOTATIONS);
    this.saveAccountMovements(INITIAL_ACCOUNT_MOVEMENTS);
    this.saveSettings(DEFAULT_SETTINGS);
  }
}

// DATE & URGENCY HELPER
export function calculateOrderUrgency(deliveryDateStr: string, status: CustomerOrder['productionStatus']): {
  urgency: UrgencyLevel;
  daysDiff: number;
  label: string;
  badgeClass: string;
} {
  if (status === 'entregado') {
    return { urgency: 'normal', daysDiff: 0, label: 'Entregado', badgeClass: 'text-slate-400 bg-slate-800/40 border-slate-700' };
  }
  if (status === 'cancelado') {
    return { urgency: 'normal', daysDiff: 0, label: 'Cancelado', badgeClass: 'text-rose-400 bg-rose-950/30 border-rose-800/40' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = deliveryDateStr.split('-').map(Number);
  const delivery = new Date(y, m - 1, d);
  delivery.setHours(0, 0, 0, 0);

  const diffTime = delivery.getTime() - today.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return {
      urgency: 'overdue',
      daysDiff,
      label: `¡ATRASADO! (${Math.abs(daysDiff)} d)`,
      badgeClass: 'text-rose-400 bg-rose-950/80 border-rose-500 font-bold animate-pulse'
    };
  } else if (daysDiff === 0) {
    return {
      urgency: 'today',
      daysDiff,
      label: 'VENCE HOY',
      badgeClass: 'text-amber-300 bg-amber-950/70 border-amber-500 font-bold'
    };
  } else if (daysDiff === 1) {
    return {
      urgency: 'tomorrow',
      daysDiff,
      label: 'Vence Mañana',
      badgeClass: 'text-yellow-400 bg-yellow-950/50 border-yellow-600'
    };
  } else if (daysDiff <= 3) {
    return {
      urgency: 'upcoming',
      daysDiff,
      label: `En ${daysDiff} días`,
      badgeClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-800'
    };
  } else {
    return {
      urgency: 'normal',
      daysDiff,
      label: `En ${daysDiff} días`,
      badgeClass: 'text-slate-400 bg-slate-900 border-slate-800'
    };
  }
}

export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol} ${Number(amount || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}
