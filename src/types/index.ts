export type ProductCategory = 
  | 'tazas'
  | 'textil'
  | 'gorras'
  | 'platos'
  | 'llaveros'
  | 'vinilos'
  | 'papel_tinta'
  | 'otros';

export type MaterialType =
  | 'ceramica'
  | 'polimero'
  | 'algodon'
  | 'spum'
  | 'modal'
  | 'poliester'
  | 'acrilico'
  | 'aluminio_metal'
  | 'vinilo_textil'
  | 'papel_sublimacion'
  | 'tinta_sublimacion'
  | 'otro';

export type SaleMode = 'lisa' | 'con_diseno' | 'estampada';

export type UserRole = 'admin' | 'disenador' | 'operador' | 'vendedor' | 'produccion';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  status?: 'activo' | 'inactivo';
  active?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  material: MaterialType;
  size?: string; // ej: 11oz, S, M, L, XL, XXL, 20x30cm, Rollo 50m
  color?: string; // ej: Blanco, Negro, Gris Melange, Rosa Pastel
  unit: string; // ej: Unidades, Rollos, Hojas, Litros
  currentStock: number;
  minStock: number; // nivel de alerta crítica
  costPrice: number; // costo de insumo unitario
  salePrice: number; // precio sugerido terminado o base lisa
  salePriceCustomized?: number; // precio sugerido estampado con diseño
  supplierId?: string;
  location?: string; // ej: Estante A-3, Mesa de corte
  description?: string;
  lastRestocked?: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'out_of_stock';

export interface StockAlert {
  product: ProductItem;
  severity: AlertSeverity;
  deficit: number;
  ordersImpactedCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  cuitRut?: string;
  suppliedCategories: ProductCategory[];
  leadTimeDays: number;
  rating?: number; // 1 to 5
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'pendiente' | 'recibido' | 'cancelado';
  items: PurchaseOrderItem[];
  totalAmount: number;
  invoiceNumber?: string;
  receivedDate?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  businessOrContact?: string;
  phone: string;
  email: string;
  taxId?: string;
  address?: string;
  totalOrdersCount: number;
  totalSpent: number;
  currentBalance: number; // saldo adeudado o a favor
  notes?: string;
  createdAt: string;
}

export type ProductionStatus = 
  | 'diseno_pendiente'
  | 'en_produccion'
  | 'control_calidad'
  | 'listo_entrega'
  | 'entregado'
  | 'cancelado';

export type UrgencyLevel = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'normal';

export interface CustomerOrderItem {
  productId: string;
  productName: string;
  material?: MaterialType;
  category?: ProductCategory;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  saleMode?: SaleMode; // 'lisa' o 'con_diseno'
  designImage?: string; // Base64 data URL
  designImageUrl?: string;
  designName?: string;
  customizationDetails?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime?: string;
  productionStatus: ProductionStatus;
  paymentStatus: 'pendiente' | 'seña' | 'pagado';
  depositAmount: number;
  totalAmount: number;
  costTotal: number;
  remainingBalance: number;
  items: CustomerOrderItem[];
  notes?: string;
  deliveredAt?: string;
  googleCalendarEventId?: string;
  googleCalendarEventUrl?: string;
  assignedUserId?: string;
}

export interface DailySaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  saleMode?: SaleMode;
  designImage?: string;
  designImageUrl?: string;
  designDetails?: string;
}

export interface DailySale {
  id: string;
  saleNumber: string;
  date: string; // ISO datetime
  customerName: string;
  customerPhone?: string;
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'mercadopago';
  items: DailySaleItem[];
  totalAmount: number;
  totalCost: number;
  notes?: string;
  linkedOrderId?: string;
}

export type QuotationStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencido';

export interface JobCostBreakdown {
  baseProductCost: number;     // Insumo base (taza, remera, gorra, etc.)
  shippingCost: number;        // Flete y logística prorrateada
  paperCost: number;           // Hoja de impresión / papel sublimable
  inkCost: number;             // Tinta de sublimación HD
  electricityCost: number;     // Electricidad / amortización de plancha térmica
  extraCost?: number;          // Mano de obra, empaque o adicionales
  totalUnitCost: number;       // Costo total directo por unidad producida
  profitMarginPercent: number; // Margen de ganancia pretendido (ej: 60%)
  profitUnitAmount: number;    // Ganancia neta por unidad
  suggestedUnitPrice: number;  // Precio unitario calculado
}

export interface QuotationItem {
  productId: string;
  productName: string;
  saleMode: SaleMode;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitCost?: number;
  totalCost?: number;
  designImage?: string;
  designName?: string;
  designNotes?: string;
  costBreakdown?: JobCostBreakdown;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerTaxId?: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  totalCost?: number;
  estimatedProfit?: number;
  estimatedDays: number;
  notes?: string;
  paymentTerms?: string;
}

export interface MonthlyReportSummary {
  year: number;
  month: number; // 0-11
  monthName: string;
  totalSalesRevenue: number;
  totalProductionCost: number;
  estimatedGrossProfit: number;
  grossMarginPercent: number;
  ordersCompletedCount: number;
  totalSupplierPurchases: number;
  currentInventoryValue: number;
  totalUnitsProduced: number;
  topCategories: Array<{ category: ProductCategory; revenue: number; units: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
  materialUsageEstimates: Array<{ material: MaterialType; units: number }>;
}
