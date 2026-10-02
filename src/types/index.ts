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
  status?: 'activo' | 'inactivo';
  isActive?: boolean;
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

export type AccountMovementType = 
  | 'cargo_pedido'       // Cargo por pedido a cliente (Aumenta saldo adeudado)
  | 'pago_recibido'      // Cobranza o pago recibido de cliente (Disminuye saldo)
  | 'pago_seña'          // Anticipo / seña inicial de pedido
  | 'nota_credito'       // Bonificación o descuento a favor del cliente
  | 'nota_debito'        // Recargo o gasto adicional
  | 'saldo_inicial'      // Saldo de apertura de cuenta corriente
  | 'compra_proveedor'   // Factura o compra a proveedor (Aumenta pasivo)
  | 'pago_proveedor';    // Pago emitido a proveedor (Cancela pasivo)

export type PaymentMethodType = 
  | 'efectivo'
  | 'transferencia'
  | 'mercadopago'
  | 'cheque'
  | 'tarjeta'
  | 'otro';

export interface AccountMovement {
  id: string;
  entityType: 'customer' | 'supplier';
  entityId: string;
  entityName: string;
  date: string; // ISO string
  type: AccountMovementType;
  concept: string;
  referenceNumber?: string; // N° de Recibo, N° de Pedido, Transferencia, Cheque
  debit: number;            // Debe (+ deuda del cliente / - deuda con proveedor)
  credit: number;           // Haber (- deuda del cliente / + deuda con proveedor)
  balanceAfter: number;     // Saldo resultante histórico
  paymentMethod?: PaymentMethodType;
  notes?: string;
  createdByName?: string;
}

export type LabelPreset = 
  | 'a4_3x8'   // 24 etiquetas (64 x 33.8 mm) estándar hojas autoadhesivas
  | 'a4_4x10'  // 40 etiquetas (48.5 x 25.4 mm) mini código de barras
  | 'a4_3x7'   // 21 etiquetas (70 x 38 mm) medianas
  | 'a4_2x5'   // 10 etiquetas (105 x 57 mm) grandes con descripción
  | 'custom';  // Personalizado por el usuario

export interface ProductLabelSettings {
  preset: LabelPreset;
  // Dimensiones de grilla en hoja A4 (210 x 297 mm)
  columns: number;
  rows: number;
  labelWidthMm: number;
  labelHeightMm: number;
  marginTopMm: number;
  marginLeftMm: number;
  marginRightMm?: number;
  marginBottomMm?: number;
  gapHorizontalMm: number;
  gapVerticalMm: number;
  showBorder: boolean;

  // Campos a incluir en la etiqueta (Requeridos por el usuario)
  includeBarcode: boolean;
  includePrice: boolean;
  includeProductName: boolean;
  includeLogo: boolean;

  // Campos adicionales opcionales
  includeWorkshopName: boolean;
  includeSku: boolean;
  includeCategoryOrMaterial: boolean;
  includeSizeColor: boolean;
  includeCustomText: boolean;
  customText?: string;

  // Estilo y tipografía
  barcodeFormat: 'CODE128' | 'EAN13' | 'CODE39';
  showBarcodeValue: boolean; // Mostrar texto del código debajo de las barras
  pricePrefix: string;
  fontSize: 'small' | 'medium' | 'large';
  textAlign: 'left' | 'center';
  colorTheme: 'monochrome' | 'dark' | 'accent';
}

export interface LocalOfflineStats {
  isOnline: boolean;
  pendingChangesCount: number;
  lastLocalSaveAt: string | null;
  lastCloudUploadAt: string | null;
  totalLocalRecords: {
    products: number;
    customers: number;
    suppliers: number;
    orders: number;
    purchases: number;
    dailySales: number;
    quotations: number;
    accountMovements: number;
  };
}

