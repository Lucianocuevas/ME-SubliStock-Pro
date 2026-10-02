import { ProductItem, Supplier, Customer, CustomerOrder, PurchaseOrder, DailySale, AppUser, Quotation, AccountMovement } from '../types';

export const INITIAL_PRODUCTS: ProductItem[] = [
  // 1. Tazas y Mugs
  {
    id: 'prod-taz-01',
    sku: 'TAZ-CER-BLA-11',
    name: 'Taza de Cerámica Blanca Importada Calidad AAA',
    category: 'tazas',
    material: 'ceramica',
    size: '11oz (325ml)',
    color: 'Blanco Puro',
    unit: 'Unidades',
    currentStock: 18,
    minStock: 36, // CRÍTICO: Menor al mínimo
    costPrice: 1250,
    salePrice: 4200,
    supplierId: 'sup-01',
    location: 'Estante A-1 (Taller Central)',
    description: 'Cerámica con doble recubrimiento de polímero brillante. Apta microondas y lavavajillas.',
    lastRestocked: '2026-09-15'
  },
  {
    id: 'prod-taz-02',
    sku: 'TAZ-POL-BLA-11',
    name: 'Taza de Polímero Irrompible Sublimable',
    category: 'tazas',
    material: 'polimero',
    size: '11oz',
    color: 'Blanco',
    unit: 'Unidades',
    currentStock: 45,
    minStock: 25,
    costPrice: 900,
    salePrice: 3200,
    supplierId: 'sup-01',
    location: 'Estante A-2',
    description: 'Ideal para jardines, colegios infantiles y souvenirs de cumpleaños.',
    lastRestocked: '2026-09-20'
  },
  {
    id: 'prod-taz-03',
    sku: 'TAZ-MAG-NEG-11',
    name: 'Taza Mágica Termosensible Cerámica',
    category: 'tazas',
    material: 'ceramica',
    size: '11oz',
    color: 'Negro Mate (cambia con calor)',
    unit: 'Unidades',
    currentStock: 6,
    minStock: 12, // CRÍTICO
    costPrice: 2100,
    salePrice: 6500,
    supplierId: 'sup-01',
    location: 'Estante A-3',
    description: 'Revela el diseño impreso al verter líquido caliente.',
    lastRestocked: '2026-09-02'
  },

  // 2. Textil y Remeras
  {
    id: 'prod-rem-spum-m',
    sku: 'REM-SPU-BLA-M',
    name: 'Remera Spum Premium Tacto Algodón Talle M',
    category: 'textil',
    material: 'spum',
    size: 'M (52x72cm)',
    color: 'Blanco Sublimable',
    unit: 'Unidades',
    currentStock: 8,
    minStock: 20, // CRÍTICO
    costPrice: 2800,
    salePrice: 8500,
    supplierId: 'sup-02',
    location: 'Perchero B-1',
    description: 'Tejido spum hilado suave, 100% poliéster especial sublimación directa sin perder color.',
    lastRestocked: '2026-09-10'
  },
  {
    id: 'prod-rem-spum-l',
    sku: 'REM-SPU-BLA-L',
    name: 'Remera Spum Premium Tacto Algodón Talle L',
    category: 'textil',
    material: 'spum',
    size: 'L (55x74cm)',
    color: 'Blanco Sublimable',
    unit: 'Unidades',
    currentStock: 14,
    minStock: 20, // Advertencia
    costPrice: 2800,
    salePrice: 8500,
    supplierId: 'sup-02',
    location: 'Perchero B-1',
    description: 'Remera corte unisex clásica para egresados, peñas y merchandising.',
    lastRestocked: '2026-09-10'
  },
  {
    id: 'prod-rem-spum-xl',
    sku: 'REM-SPU-BLA-XL',
    name: 'Remera Spum Premium Tacto Algodón Talle XL',
    category: 'textil',
    material: 'spum',
    size: 'XL (58x76cm)',
    color: 'Blanco Sublimable',
    unit: 'Unidades',
    currentStock: 26,
    minStock: 15,
    costPrice: 2950,
    salePrice: 8900,
    supplierId: 'sup-02',
    location: 'Perchero B-1',
    description: 'Talle amplio para estampa completa en formato A3 o plano.',
    lastRestocked: '2026-09-22'
  },
  {
    id: 'prod-rem-modal-m',
    sku: 'REM-MOD-BLA-M',
    name: 'Remera Modal con Spandex Dama Talle M',
    category: 'textil',
    material: 'modal',
    size: 'M',
    color: 'Blanco',
    unit: 'Unidades',
    currentStock: 5,
    minStock: 15, // CRÍTICO
    costPrice: 3200,
    salePrice: 9200,
    supplierId: 'sup-02',
    location: 'Perchero B-2',
    description: 'Caída suave con brillo satinado, excelente definición fotográfica.',
    lastRestocked: '2026-09-05'
  },
  {
    id: 'prod-rem-alg-neg-l',
    sku: 'REM-ALG-NEG-L',
    name: 'Remera Algodón Peinado 24/1 Talle L (Base DTF / Vinilo)',
    category: 'textil',
    material: 'algodon',
    size: 'L',
    color: 'Negro Profundo',
    unit: 'Unidades',
    currentStock: 12,
    minStock: 10,
    costPrice: 3900,
    salePrice: 11500,
    supplierId: 'sup-02',
    location: 'Perchero B-3',
    description: 'Algodón pesado de máxima durabilidad para estampa con Vinilo Termotransferible.',
    lastRestocked: '2026-09-18'
  },

  // 3. Gorras
  {
    id: 'prod-gor-01',
    sku: 'GOR-TRU-BLA-NEG',
    name: 'Gorra Trucker con Frente Blanco de Poliéster y Red',
    category: 'gorras',
    material: 'poliester',
    size: 'Ajustable con broche plástico',
    color: 'Frente Blanco / Red Negra',
    unit: 'Unidades',
    currentStock: 35,
    minStock: 20,
    costPrice: 1600,
    salePrice: 4800,
    supplierId: 'sup-03',
    location: 'Cajón C-1',
    description: 'Frente acolchado sublimable en prensa de gorras a 185°C.',
    lastRestocked: '2026-09-14'
  },
  {
    id: 'prod-gor-02',
    sku: 'GOR-TRU-BLA-AZU',
    name: 'Gorra Trucker Frente Blanco y Red Azul Marino',
    category: 'gorras',
    material: 'poliester',
    size: 'Ajustable',
    color: 'Frente Blanco / Red Azul',
    unit: 'Unidades',
    currentStock: 4,
    minStock: 15, // CRÍTICO
    costPrice: 1600,
    salePrice: 4800,
    supplierId: 'sup-03',
    location: 'Cajón C-1',
    description: 'Gran demanda para eventos corporativos y clubes deportivos.',
    lastRestocked: '2026-08-28'
  },

  // 4. Platos
  {
    id: 'prod-pla-01',
    sku: 'PLA-CER-DOR-20',
    name: 'Plato de Cerámica con Borde Dorado y Soporte',
    category: 'platos',
    material: 'ceramica',
    size: '20 cm diámetro',
    color: 'Blanco con filete dorado',
    unit: 'Unidades',
    currentStock: 11,
    minStock: 10,
    costPrice: 2400,
    salePrice: 6900,
    supplierId: 'sup-01',
    location: 'Estante A-4',
    description: 'Incluye soporte de plástico para exhibir en bodas, homenajes y aniversarios.',
    lastRestocked: '2026-09-08'
  },
  {
    id: 'prod-pla-02',
    sku: 'PLA-POL-BLA-22',
    name: 'Plato Playo de Polímero Sublimable Irrompible',
    category: 'platos',
    material: 'polimero',
    size: '22 cm diámetro',
    color: 'Blanco',
    unit: 'Unidades',
    currentStock: 2,
    minStock: 15, // CRÍTICO
    costPrice: 1350,
    salePrice: 3800,
    supplierId: 'sup-01',
    location: 'Estante A-4',
    description: 'Apto para comida de niños, escuelas y fiestas infantiles.',
    lastRestocked: '2026-08-15'
  },

  // 5. Llaveros
  {
    id: 'prod-lla-01',
    sku: 'LLA-POL-REC-BIF',
    name: 'Llavero de Polímero Rectangular Bifaz con Argolla',
    category: 'llaveros',
    material: 'polimero',
    size: '6 x 4 cm',
    color: 'Blanco brillante ambas caras',
    unit: 'Unidades',
    currentStock: 85,
    minStock: 50,
    costPrice: 220,
    salePrice: 950,
    supplierId: 'sup-01',
    location: 'Caja D-1',
    description: 'Sublimable en ambas caras con prensa plana a 190°C por 60 segundos.',
    lastRestocked: '2026-09-21'
  },
  {
    id: 'prod-lla-02',
    sku: 'LLA-MET-RED-01',
    name: 'Llavero Metálico Redondo con Placa de Aluminio',
    category: 'llaveros',
    material: 'aluminio_metal',
    size: '3.5 cm diámetro',
    color: 'Plata brillante / Placa blanca',
    unit: 'Unidades',
    currentStock: 9,
    minStock: 30, // CRÍTICO
    costPrice: 580,
    salePrice: 1800,
    supplierId: 'sup-03',
    location: 'Caja D-2',
    description: 'Acabado de lujo metálico con adhesivo extra fuerte para la chapita sublimada.',
    lastRestocked: '2026-08-30'
  },

  // 6. Vinilos y Estampados
  {
    id: 'prod-vin-01',
    sku: 'VIN-TEX-SUB-BLA',
    name: 'Vinilo Textil Sublimable Termotransferible (Rollo)',
    category: 'vinilos',
    material: 'vinilo_textil',
    size: '50cm ancho x 25m largo',
    color: 'Blanco Mate',
    unit: 'Metros',
    currentStock: 4,
    minStock: 10, // CRÍTICO
    costPrice: 4200,
    salePrice: 9800,
    supplierId: 'sup-03',
    location: 'Sector Plotter / Mesada',
    description: 'Permite estampar en remeras de algodón 100% oscuras o claras con tintas de sublimación.',
    lastRestocked: '2026-09-01'
  },
  {
    id: 'prod-vin-02',
    sku: 'VIN-COR-NEG-MET',
    name: 'Vinilo de Corte Textil Premium Termo-adhesivo',
    category: 'vinilos',
    material: 'vinilo_textil',
    size: '50cm ancho x 10m',
    color: 'Negro Mate',
    unit: 'Metros',
    currentStock: 18,
    minStock: 8,
    costPrice: 3400,
    salePrice: 7500,
    supplierId: 'sup-03',
    location: 'Sector Plotter',
    description: 'Para dorsales de camisetas deportivas y logos vectoriales sin impresión.',
    lastRestocked: '2026-09-17'
  },

  // 7. Papel, Tintas y Cintas
  {
    id: 'prod-pap-01',
    sku: 'PAP-SUB-A4-100',
    name: 'Papel de Sublimación Secado Rápido A4 Premium (100 Hojas)',
    category: 'papel_tinta',
    material: 'papel_sublimacion',
    size: 'A4 (21 x 29.7cm)',
    color: 'Reverso Rosa / Cara Blanca',
    unit: 'Paquetes',
    currentStock: 3,
    minStock: 8, // CRÍTICO
    costPrice: 4500,
    salePrice: 9000,
    supplierId: 'sup-03',
    location: 'Estante Impresoras',
    description: 'Transferencia del 98% de la tinta. No produce camino de hormigas ni manchas.',
    lastRestocked: '2026-09-05'
  },
  {
    id: 'prod-tin-01',
    sku: 'TIN-SUB-CMYK-KIT',
    name: 'Kit Tintas de Sublimación HD x 400ml (C-M-Y-K)',
    category: 'papel_tinta',
    material: 'tinta_sublimacion',
    size: '4 botellas de 100ml',
    color: 'Cyan, Magenta, Yellow, Black',
    unit: 'Kits',
    currentStock: 1,
    minStock: 3, // CRÍTICO
    costPrice: 14000,
    salePrice: 28000,
    supplierId: 'sup-03',
    location: 'Gabinete de Tintas',
    description: 'Fórmula anti-obstrucción para cabezales piezoeléctricos Epson Serie L.',
    lastRestocked: '2026-08-25'
  },
  {
    id: 'prod-cin-01',
    sku: 'CIN-TER-10MM',
    name: 'Cinta Térmica para Sublimación Resistente al Calor',
    category: 'papel_tinta',
    material: 'otro',
    size: '10mm ancho x 33m largo',
    color: 'Ámbar Poliimida',
    unit: 'Rollos',
    currentStock: 12,
    minStock: 5,
    costPrice: 950,
    salePrice: 2200,
    supplierId: 'sup-03',
    location: 'Mesa de Termoprensas',
    description: 'Soporta hasta 260°C sin dejar residuos de pegamento en tazas ni textiles.',
    lastRestocked: '2026-09-12'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_ORDERS: CustomerOrder[] = [];

export const INITIAL_PURCHASES: PurchaseOrder[] = [];

export const INITIAL_DAILY_SALES: DailySale[] = [];

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
    email: 'admin@sublistock.com',
    role: 'admin',
    avatar: 'LC',
    status: 'activo',
    lastLogin: '2026-09-28T08:00:00Z',
    phone: '+54 9 11 4455-8899'
  },
  {
    id: 'user-02',
    name: 'Carolina Méndez',
    email: 'carolina.diseno@sublistock.com',
    role: 'disenador',
    avatar: 'CM',
    status: 'activo',
    lastLogin: '2026-09-28T07:45:00Z',
    phone: '+54 9 11 5566-7788'
  },
  {
    id: 'user-03',
    name: 'Martín Gómez',
    email: 'martin.ventas@sublistock.com',
    role: 'vendedor',
    avatar: 'MG',
    status: 'activo',
    lastLogin: '2026-09-27T16:30:00Z',
    phone: '+54 9 11 3322-1100'
  },
  {
    id: 'user-04',
    name: 'Javier Rocha',
    email: 'javier.taller@sublistock.com',
    role: 'produccion',
    avatar: 'JR',
    status: 'activo',
    lastLogin: '2026-09-26T14:15:00Z',
    phone: '+54 9 11 7788-9900'
  }
];

export const INITIAL_QUOTATIONS: Quotation[] = [];

export const INITIAL_ACCOUNT_MOVEMENTS: AccountMovement[] = [];
