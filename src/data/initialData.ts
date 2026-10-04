import {
  ProductItem,
  Supplier,
  Customer,
  CustomerOrder,
  PurchaseOrder,
  DailySale,
  AppUser,
  Quotation,
  AccountMovement,
  CategoryDefinition,
  MaterialDefinition
} from '../types';

// Zero fictitious items by default: only real data loaded into the cloud is used
export const INITIAL_PRODUCTS: ProductItem[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_ORDERS: CustomerOrder[] = [];

export const INITIAL_PURCHASES: PurchaseOrder[] = [];

export const INITIAL_DAILY_SALES: DailySale[] = [];

export const INITIAL_QUOTATIONS: Quotation[] = [];

export const INITIAL_ACCOUNT_MOVEMENTS: AccountMovement[] = [];

// Catalog Taxonomies (Rubros & Materiales standard definitions)
export const INITIAL_CATEGORIES: CategoryDefinition[] = [
  { id: 'tazas', label: 'Tazas y Mugs', icon: 'Coffee', description: 'Cerámica, polímero, mágicas, cónicas', isCustom: false },
  { id: 'textil', label: 'Textil y Remeras', icon: 'Shirt', description: 'Spum, modal, algodón peinado, buzos', isCustom: false },
  { id: 'gorras', label: 'Gorras y Viseras', icon: 'Crown', description: 'Trucker con red, visera plana, gabardina', isCustom: false },
  { id: 'platos', label: 'Platos y Bandejas', icon: 'Disc', description: 'Cerámica con borde dorado, polímero', isCustom: false },
  { id: 'llaveros', label: 'Llaveros y Pins', icon: 'Key', description: 'Polímero bifaz, metálicos, acrílico', isCustom: false },
  { id: 'vinilos', label: 'Vinilos y Transfers', icon: 'Layers', description: 'Sublimable textil, corte, reflectivo', isCustom: false },
  { id: 'papel_tinta', label: 'Papeles y Tintas', icon: 'Printer', description: 'Papel secado rápido, tintas CMYK, cinta', isCustom: false },
  { id: 'otros', label: 'Otros Insumos', icon: 'Package', description: 'Cajas, pads de mouse, rompecabezas', isCustom: false }
];

export const INITIAL_MATERIALS: MaterialDefinition[] = [
  { id: 'ceramica', label: 'Cerámica Esmaltada', isCustom: false },
  { id: 'polimero', label: 'Polímero / Plástico Sublimable', isCustom: false },
  { id: 'algodon', label: 'Algodón 100% (DTF/Vinilo)', isCustom: false },
  { id: 'spum', label: 'Spum (Poliéster Premium)', isCustom: false },
  { id: 'modal', label: 'Modal con Lycra', isCustom: false },
  { id: 'poliester', label: 'Poliéster Textil', isCustom: false },
  { id: 'acrilico', label: 'Acrílico Transparente', isCustom: false },
  { id: 'madera', label: 'Madera / MDF', isCustom: false },
  { id: 'neoprene', label: 'Neoprene', isCustom: false },
  { id: 'aluminio_metal', label: 'Aluminio / Metal', isCustom: false },
  { id: 'vinilo_textil', label: 'Vinilo Textil', isCustom: false },
  { id: 'papel_sublimacion', label: 'Papel de Sublimación', isCustom: false },
  { id: 'tinta_sublimacion', label: 'Tinta de Sublimación HD', isCustom: false },
  { id: 'otro', label: 'Otro Material', isCustom: false }
];

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  tazas: { label: 'Tazas y Mugs', icon: 'Coffee', description: 'Cerámica, polímero, mágicas, cónicas' },
  textil: { label: 'Textil y Remeras', icon: 'Shirt', description: 'Spum, modal, algodón peinado, buzos' },
  gorras: { label: 'Gorras y Viseras', icon: 'Crown', description: 'Trucker con red, visera plana, gabardina' },
  platos: { label: 'Platos y Bandejas', icon: 'Disc', description: 'Cerámica con borde dorado, polímero' },
  llaveros: { label: 'Llaveros y Pins', icon: 'Key', description: 'Polímero bifaz, metálicos, acrílico' },
  vinilos: { label: 'Vinilos y Transfers', icon: 'Layers', description: 'Sublimable textil, corte, reflectivo' },
  papel_tinta: { label: 'Papeles y Tintas', icon: 'Printer', description: 'Papel secado rápido, tintas CMYK, cinta' },
  otros: { label: 'Otros Insumos', icon: 'Package', description: 'Cajas, pads de mouse, rompecabezas' }
};

export const MATERIAL_LABELS: Record<string, string> = {
  ceramica: 'Cerámica Esmaltada',
  polimero: 'Polímero / Plástico Sublimable',
  algodon: 'Algodón 100% (DTF/Vinilo)',
  spum: 'Spum (Poliéster Premium)',
  modal: 'Modal con Lycra',
  poliester: 'Poliéster Textil',
  acrilico: 'Acrílico Transparente',
  madera: 'Madera / MDF',
  neoprene: 'Neoprene',
  aluminio_metal: 'Aluminio / Metal',
  vinilo_textil: 'Vinilo Textil',
  papel_sublimacion: 'Papel de Sublimación',
  tinta_sublimacion: 'Tinta de Sublimación HD',
  otro: 'Otro Material'
};

export const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  diseno_pendiente: { label: 'Diseño Pendiente', bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/50' },
  en_produccion: { label: 'En Plancha / Impresión', bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/50' },
  control_calidad: { label: 'Control de Calidad', bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-800/50' },
  listo_entrega: { label: 'Listo para Entregar', bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/50' },
  entregado: { label: 'Entregado / Cerrado', bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700' },
  cancelado: { label: 'Cancelado', bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-800/50' }
};

export const ROLE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  admin: {
    label: 'Administrador General',
    description: 'Acceso total a finanzas, configuración, usuarios, proveedores y reportes',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  disenador: {
    label: 'Diseñador / Sublimador',
    description: 'Gestión de estampados, carga de diseños en remeras/tazas, control de impresión',
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/40'
  },
  vendedor: {
    label: 'Vendedor / Mostrador',
    description: 'Ventas rápidas, presupuestos membretados, nuevos pedidos y cobros',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  produccion: {
    label: 'Operador de Producción',
    description: 'Operación de planchas térmicas, stock de insumos y preparación de paquetes',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
};

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-01',
    name: 'Luciano Cuevas',
    email: 'lucianocuevasmehauod@gmail.com',
    role: 'admin',
    avatar: 'LC',
    status: 'activo',
    lastLogin: '2026-10-04T12:00:00Z',
    phone: ''
  }
];
