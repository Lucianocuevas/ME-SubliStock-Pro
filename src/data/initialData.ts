import { ProductItem, Supplier, Customer, CustomerOrder, PurchaseOrder, DailySale, AppUser, Quotation } from '../types';

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

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    name: 'Cerámicas del Plata & Polímeros S.A.',
    contactPerson: 'Carlos Mendoza',
    phone: '+54 11 4589-2231',
    email: 'ventas@ceramicasdelplata.com.ar',
    address: 'Av. Juan B. Justo 3450, CABA',
    cuitRut: '30-71458923-8',
    suppliedCategories: ['tazas', 'platos', 'llaveros'],
    leadTimeDays: 3,
    rating: 5,
    notes: 'Excelente calidad en recubrimiento polimérico y tazas Orca AAA. Entregan los martes y jueves.',
    createdAt: '2026-01-10'
  },
  {
    id: 'sup-02',
    name: 'Textil Sublimable del Sur',
    contactPerson: 'Mariana Rossi',
    phone: '+54 11 5560-8812',
    email: 'pedidos@textildelsur.com.ar',
    address: 'Parque Industrial Avellaneda, Galpón 14',
    cuitRut: '30-68945120-4',
    suppliedCategories: ['textil'],
    leadTimeDays: 4,
    rating: 4,
    notes: 'Fabricantes directos de remeras Spum, modal y buzos. Descuento del 10% por bulto cerrado de 50 u.',
    createdAt: '2026-02-15'
  },
  {
    id: 'sup-03',
    name: 'Insumos Gráficos & Transfers Pro',
    contactPerson: 'Esteban Varela',
    phone: '+54 11 4981-6733',
    email: 'contacto@graficapro.com.ar',
    address: 'Uruguay 820, San Nicolás, CABA',
    cuitRut: '30-77821940-1',
    suppliedCategories: ['gorras', 'vinilos', 'papel_tinta', 'llaveros'],
    leadTimeDays: 2,
    rating: 5,
    notes: 'Distribuidor oficial de tintas y papeles de secado rápido. Envío sin cargo en compras mayores a $80.000.',
    createdAt: '2026-03-01'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    name: 'Colegio San Martín - Promo 2026',
    businessOrContact: 'Prof. Gabriela Fernández',
    phone: '+54 9 11 4455-6677',
    email: 'egresados2026@sanmartin.edu.ar',
    address: 'Belgrano 1420, Ramos Mejía',
    totalOrdersCount: 4,
    totalSpent: 420000,
    currentBalance: 85000, // saldo pendiente
    notes: 'Cliente recurrente todos los años para remeras de egresados, tazas y gorras.',
    createdAt: '2026-04-12'
  },
  {
    id: 'cust-02',
    name: 'Cafetería & Tostaduría Moka',
    businessOrContact: 'Luciano D’Angelo',
    phone: '+54 9 11 6789-0123',
    email: 'administracion@mokacoffee.com',
    address: 'Gorriti 4890, Palermo',
    totalOrdersCount: 6,
    totalSpent: 310000,
    currentBalance: 0,
    notes: 'Piden tandas de 36 tazas con logo grabado y remeras de staff cada 2 meses.',
    createdAt: '2026-05-18'
  },
  {
    id: 'cust-03',
    name: 'Club Atlético Defensores',
    businessOrContact: 'Mariano Torres (Secretaría)',
    phone: '+54 9 11 3214-5566',
    email: 'clubdefensores@deportes.com',
    address: 'Av. Mitre 2300, Wilde',
    totalOrdersCount: 3,
    totalSpent: 185000,
    currentBalance: 45000,
    notes: 'Merchandising para torneo aniversario (gorras trucker y llaveros).',
    createdAt: '2026-07-02'
  },
  {
    id: 'cust-04',
    name: 'Empresa Logística Andina SRL',
    businessOrContact: 'Valeria Suárez (RRHH)',
    phone: '+54 9 11 8899-1122',
    email: 'rrhh@logisticaandina.com.ar',
    address: 'Panamericana Km 38.5, Tortuguitas',
    totalOrdersCount: 2,
    totalSpent: 260000,
    currentBalance: 0,
    notes: 'Kits de bienvenida institucional (taza térmica, llavero metálico y remera).',
    createdAt: '2026-08-10'
  },
  {
    id: 'cust-05',
    name: 'Jardín de Infantes Rayito de Sol',
    businessOrContact: 'Directora Patricia Sosa',
    phone: '+54 9 11 2345-9876',
    email: 'rayitodesol@jardin.edu.ar',
    address: 'Brandsen 650, Quilmes',
    totalOrdersCount: 5,
    totalSpent: 175000,
    currentBalance: 28000,
    notes: 'Tazas de polímero y platos irrompibles con foto y nombre de cada nene.',
    createdAt: '2026-06-25'
  }
];

export const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'PED-2026-101',
    customerId: 'cust-01',
    customerName: 'Colegio San Martín - Promo 2026',
    customerPhone: '+54 9 11 4455-6677',
    createdAt: '2026-09-22T10:30:00Z',
    deliveryDate: '2026-09-27', // AYER -> ATRASADO / VENCIDO
    deliveryTime: '16:00',
    productionStatus: 'en_produccion',
    paymentStatus: 'seña',
    depositAmount: 85000,
    totalAmount: 170000,
    costTotal: 56000,
    remainingBalance: 85000,
    items: [
      {
        productId: 'prod-rem-spum-m',
        productName: 'Remera Spum Premium Tacto Algodón Talle M',
        material: 'spum',
        category: 'textil',
        size: 'M',
        color: 'Blanco',
        quantity: 10,
        unitPrice: 8500,
        unitCost: 2800,
        totalPrice: 85000,
        customizationDetails: 'Frente: "Promo Egresados 2026" Full color. Dorso: Listado de 32 alumnos.'
      },
      {
        productId: 'prod-rem-spum-l',
        productName: 'Remera Spum Premium Tacto Algodón Talle L',
        material: 'spum',
        category: 'textil',
        size: 'L',
        color: 'Blanco',
        quantity: 10,
        unitPrice: 8500,
        unitCost: 2800,
        totalPrice: 85000,
        customizationDetails: 'Frente: "Promo Egresados 2026" Full color. Dorso: Listado de 32 alumnos.'
      }
    ],
    notes: '¡URGENTE! Planchado de remeras en proceso. La profesora llamó para retirar.',
  },
  {
    id: 'ord-102',
    orderNumber: 'PED-2026-102',
    customerId: 'cust-02',
    customerName: 'Cafetería & Tostaduría Moka',
    customerPhone: '+54 9 11 6789-0123',
    createdAt: '2026-09-24T14:15:00Z',
    deliveryDate: '2026-09-28', // HOY -> VENCE HOY
    deliveryTime: '18:00',
    productionStatus: 'control_calidad',
    paymentStatus: 'pagado',
    depositAmount: 151200,
    totalAmount: 151200,
    costTotal: 45000,
    remainingBalance: 0,
    items: [
      {
        productId: 'prod-taz-01',
        productName: 'Taza de Cerámica Blanca Importada Calidad AAA',
        material: 'ceramica',
        category: 'tazas',
        size: '11oz',
        color: 'Blanco Puro',
        quantity: 36,
        unitPrice: 4200,
        unitCost: 1250,
        totalPrice: 151200,
        customizationDetails: 'Logo Moka en dorado y café oscuro a 2 caras. Caja individual con ventana.'
      }
    ],
    notes: 'Empaquetar con viruta y sticker de cierre. Pasan en camioneta a las 18 hs.',
  },
  {
    id: 'ord-103',
    orderNumber: 'PED-2026-103',
    customerId: 'cust-03',
    customerName: 'Club Atlético Defensores',
    customerPhone: '+54 9 11 3214-5566',
    createdAt: '2026-09-25T09:00:00Z',
    deliveryDate: '2026-09-29', // MAÑANA -> VENCE MAÑANA
    deliveryTime: '12:00',
    productionStatus: 'diseno_pendiente',
    paymentStatus: 'seña',
    depositAmount: 50000,
    totalAmount: 114000,
    costTotal: 34000,
    remainingBalance: 64000,
    items: [
      {
        productId: 'prod-gor-01',
        productName: 'Gorra Trucker con Frente Blanco de Poliéster y Red',
        material: 'poliester',
        category: 'gorras',
        size: 'Ajustable',
        color: 'Blanco y Negro',
        quantity: 15,
        unitPrice: 4800,
        unitCost: 1600,
        totalPrice: 72000,
        customizationDetails: 'Escudo del club en frente a 190°C x 45 seg.'
      },
      {
        productId: 'prod-lla-02',
        productName: 'Llavero Metálico Redondo con Placa de Aluminio',
        material: 'aluminio_metal',
        category: 'llaveros',
        size: '3.5 cm',
        color: 'Metalizado',
        quantity: 20,
        unitPrice: 2100,
        unitCost: 580,
        totalPrice: 42000,
        customizationDetails: 'Grabado conmemorativo 75 Aniversario.'
      }
    ],
    notes: 'Esperando aprobación final del vector del escudo por WhatsApp.',
  },
  {
    id: 'ord-104',
    orderNumber: 'PED-2026-104',
    customerId: 'cust-05',
    customerName: 'Jardín de Infantes Rayito de Sol',
    customerPhone: '+54 9 11 2345-9876',
    createdAt: '2026-09-26T11:20:00Z',
    deliveryDate: '2026-10-02', // EN 4 DÍAS -> PRÓXIMO
    deliveryTime: '15:00',
    productionStatus: 'en_produccion',
    paymentStatus: 'seña',
    depositAmount: 35000,
    totalAmount: 76000,
    costTotal: 22000,
    remainingBalance: 41000,
    items: [
      {
        productId: 'prod-taz-02',
        productName: 'Taza de Polímero Irrompible Sublimable',
        material: 'polimero',
        category: 'tazas',
        size: '11oz',
        color: 'Blanco',
        quantity: 20,
        unitPrice: 3800,
        unitCost: 1100,
        totalPrice: 76000,
        customizationDetails: 'Foto individual de cada egresadito de sala de 5 con dibujito.'
      }
    ],
    notes: 'Sublimar con molde metálico interno para no deformar el polímero.',
  },
  {
    id: 'ord-100',
    orderNumber: 'PED-2026-100',
    customerId: 'cust-04',
    customerName: 'Empresa Logística Andina SRL',
    customerPhone: '+54 9 11 8899-1122',
    createdAt: '2026-09-18T16:00:00Z',
    deliveryDate: '2026-09-23',
    deliveryTime: '17:00',
    productionStatus: 'entregado',
    paymentStatus: 'pagado',
    depositAmount: 180000,
    totalAmount: 180000,
    costTotal: 58000,
    remainingBalance: 0,
    items: [
      {
        productId: 'prod-taz-01',
        productName: 'Taza de Cerámica Blanca Importada Calidad AAA',
        material: 'ceramica',
        category: 'tazas',
        size: '11oz',
        color: 'Blanco',
        quantity: 25,
        unitPrice: 4200,
        unitCost: 1250,
        totalPrice: 105000,
        customizationDetails: 'Logo institucional full color.'
      },
      {
        productId: 'prod-lla-01',
        productName: 'Llavero de Polímero Rectangular Bifaz',
        material: 'polimero',
        category: 'llaveros',
        size: '6x4 cm',
        color: 'Blanco',
        quantity: 50,
        unitPrice: 1500,
        unitCost: 220,
        totalPrice: 75000,
        customizationDetails: 'Cara 1: Logo, Cara 2: Código QR web.'
      }
    ],
    notes: 'Entregado conforme. Factura A enviada.',
    deliveredAt: '2026-09-23T16:45:00Z'
  }
];

export const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 'pur-201',
    orderNumber: 'COM-2026-089',
    supplierId: 'sup-01',
    supplierName: 'Cerámicas del Plata & Polímeros S.A.',
    date: '2026-09-20',
    status: 'recibido',
    totalAmount: 112500,
    invoiceNumber: 'FACT-0004-0012948',
    receivedDate: '2026-09-22',
    notes: 'Caja de 36 tazas de cerámica + 50 llaveros de polímero.',
    items: [
      {
        productId: 'prod-taz-01',
        productName: 'Taza de Cerámica Blanca Importada Calidad AAA',
        quantity: 36,
        unitCost: 1250,
        totalCost: 45000
      },
      {
        productId: 'prod-taz-02',
        productName: 'Taza de Polímero Irrompible Sublimable',
        quantity: 50,
        unitCost: 900,
        totalCost: 45000
      },
      {
        productId: 'prod-lla-01',
        productName: 'Llavero de Polímero Rectangular Bifaz',
        quantity: 100,
        unitCost: 225,
        totalCost: 22500
      }
    ]
  },
  {
    id: 'pur-202',
    orderNumber: 'COM-2026-090',
    supplierId: 'sup-02',
    supplierName: 'Textil Sublimable del Sur',
    date: '2026-09-24',
    status: 'pendiente',
    totalAmount: 168000,
    invoiceNumber: 'PED-PROV-5491',
    notes: 'Reposición urgente de remeras Spum M y L pedidas para entrega el jueves.',
    items: [
      {
        productId: 'prod-rem-spum-m',
        productName: 'Remera Spum Premium Tacto Algodón Talle M',
        quantity: 30,
        unitCost: 2800,
        totalCost: 84000
      },
      {
        productId: 'prod-rem-spum-l',
        productName: 'Remera Spum Premium Tacto Algodón Talle L',
        quantity: 30,
        unitCost: 2800,
        totalCost: 84000
      }
    ]
  },
  {
    id: 'pur-203',
    orderNumber: 'COM-2026-088',
    supplierId: 'sup-03',
    supplierName: 'Insumos Gráficos & Transfers Pro',
    date: '2026-09-12',
    status: 'recibido',
    totalAmount: 88500,
    invoiceNumber: 'FACT-0002-0008412',
    receivedDate: '2026-09-14',
    notes: 'Rollo de vinilo textil sublimable + paquete de papel A4 + cinta térmica.',
    items: [
      {
        productId: 'prod-vin-01',
        productName: 'Vinilo Textil Sublimable Termotransferible (Rollo)',
        quantity: 10,
        unitCost: 4200,
        totalCost: 42000
      },
      {
        productId: 'prod-pap-01',
        productName: 'Papel de Sublimación Secado Rápido A4 Premium (100 Hojas)',
        quantity: 8,
        unitCost: 4500,
        totalCost: 36000
      },
      {
        productId: 'prod-cin-01',
        productName: 'Cinta Térmica para Sublimación Resistente al Calor',
        quantity: 11,
        unitCost: 950,
        totalCost: 10500
      }
    ]
  },
  // Historial mensual de compras último año
  {
    id: 'pur-hist-08',
    orderNumber: 'COM-2026-072',
    supplierId: 'sup-02',
    supplierName: 'Textil Sublimable del Sur',
    date: '2026-08-14',
    status: 'recibido',
    totalAmount: 420000,
    invoiceNumber: 'FACT-2026-0814',
    receivedDate: '2026-08-16',
    notes: 'Insumos para campaña Día de las Infancias.',
    items: [{ productId: 'prod-rem-spum-m', productName: 'Remeras Spum surtidas', quantity: 150, unitCost: 2800, totalCost: 420000 }]
  },
  {
    id: 'pur-hist-07',
    orderNumber: 'COM-2026-061',
    supplierId: 'sup-01',
    supplierName: 'Cerámicas del Plata & Polímeros S.A.',
    date: '2026-07-10',
    status: 'recibido',
    totalAmount: 330000,
    invoiceNumber: 'FACT-2026-0710',
    receivedDate: '2026-07-12',
    notes: 'Tazas y llaveros para el Día del Amigo.',
    items: [{ productId: 'prod-taz-01', productName: 'Tazas Cerámica Importada', quantity: 264, unitCost: 1250, totalCost: 330000 }]
  },
  {
    id: 'pur-hist-06',
    orderNumber: 'COM-2026-052',
    supplierId: 'sup-02',
    supplierName: 'Textil Sublimable del Sur',
    date: '2026-06-08',
    status: 'recibido',
    totalAmount: 370000,
    invoiceNumber: 'FACT-2026-0608',
    receivedDate: '2026-06-10',
    notes: 'Textil y gorras para campaña Día del Padre.',
    items: [{ productId: 'prod-rem-spum-l', productName: 'Remeras y gorras surtidas', quantity: 132, unitCost: 2800, totalCost: 370000 }]
  },
  {
    id: 'pur-hist-05',
    orderNumber: 'COM-2026-044',
    supplierId: 'sup-03',
    supplierName: 'Insumos Gráficos & Transfers Pro',
    date: '2026-05-12',
    status: 'recibido',
    totalAmount: 310000,
    invoiceNumber: 'FACT-2026-0512',
    receivedDate: '2026-05-14',
    notes: 'Tintas, vinilo textil y papel sublimación.',
    items: [{ productId: 'prod-tin-01', productName: 'Tintas y Papeles de Sublimación', quantity: 60, unitCost: 5166, totalCost: 310000 }]
  },
  {
    id: 'pur-hist-04',
    orderNumber: 'COM-2026-035',
    supplierId: 'sup-01',
    supplierName: 'Cerámicas del Plata & Polímeros S.A.',
    date: '2026-04-15',
    status: 'recibido',
    totalAmount: 260000,
    invoiceNumber: 'FACT-2026-0415',
    receivedDate: '2026-04-17',
    notes: 'Reposición polímeros y platos sublimables.',
    items: [{ productId: 'prod-taz-02', productName: 'Polímeros y tazas', quantity: 200, unitCost: 1300, totalCost: 260000 }]
  },
  {
    id: 'pur-hist-03',
    orderNumber: 'COM-2026-026',
    supplierId: 'sup-02',
    supplierName: 'Textil Sublimable del Sur',
    date: '2026-03-09',
    status: 'recibido',
    totalAmount: 340000,
    invoiceNumber: 'FACT-2026-0309',
    receivedDate: '2026-03-11',
    notes: 'Textil para colegios e indumentaria inicial.',
    items: [{ productId: 'prod-rem-spum-m', productName: 'Remeras y pecheras escolares', quantity: 120, unitCost: 2833, totalCost: 340000 }]
  },
  {
    id: 'pur-hist-02',
    orderNumber: 'COM-2026-017',
    supplierId: 'sup-01',
    supplierName: 'Cerámicas del Plata & Polímeros S.A.',
    date: '2026-02-11',
    status: 'recibido',
    totalAmount: 290000,
    invoiceNumber: 'FACT-2026-0211',
    receivedDate: '2026-02-13',
    notes: 'Gorras trucker y tazas de polímero.',
    items: [{ productId: 'prod-gor-01', productName: 'Gorras trucker y tazas', quantity: 145, unitCost: 2000, totalCost: 290000 }]
  },
  {
    id: 'pur-hist-01',
    orderNumber: 'COM-2026-008',
    supplierId: 'sup-03',
    supplierName: 'Insumos Gráficos & Transfers Pro',
    date: '2026-01-16',
    status: 'recibido',
    totalAmount: 150000,
    invoiceNumber: 'FACT-2026-0116',
    receivedDate: '2026-01-18',
    notes: 'Reposición básica temporada de verano.',
    items: [{ productId: 'prod-pap-01', productName: 'Papel y cinta térmica', quantity: 30, unitCost: 5000, totalCost: 150000 }]
  },
  {
    id: 'pur-hist-12',
    orderNumber: 'COM-2025-099',
    supplierId: 'sup-02',
    supplierName: 'Textil Sublimable del Sur',
    date: '2025-12-05',
    status: 'recibido',
    totalAmount: 480000,
    invoiceNumber: 'FACT-2025-1205',
    receivedDate: '2025-12-07',
    notes: 'Megacompra navideña y egresados.',
    items: [{ productId: 'prod-rem-spum-l', productName: 'Remeras y tazas masivas fin de año', quantity: 160, unitCost: 3000, totalCost: 480000 }]
  },
  {
    id: 'pur-hist-11',
    orderNumber: 'COM-2025-089',
    supplierId: 'sup-01',
    supplierName: 'Cerámicas del Plata & Polímeros S.A.',
    date: '2025-11-12',
    status: 'recibido',
    totalAmount: 240000,
    invoiceNumber: 'FACT-2025-1112',
    receivedDate: '2025-11-14',
    notes: 'Stock preventivo para temporada alta.',
    items: [{ productId: 'prod-taz-01', productName: 'Tazas cerámica y cajas de regalo', quantity: 192, unitCost: 1250, totalCost: 240000 }]
  },
  {
    id: 'pur-hist-10',
    orderNumber: 'COM-2025-078',
    supplierId: 'sup-03',
    supplierName: 'Insumos Gráficos & Transfers Pro',
    date: '2025-10-18',
    status: 'recibido',
    totalAmount: 180000,
    invoiceNumber: 'FACT-2025-1018',
    receivedDate: '2025-10-20',
    notes: 'Insumos gráficos para Día de la Madre.',
    items: [{ productId: 'prod-tin-01', productName: 'Tintas y vinilos', quantity: 40, unitCost: 4500, totalCost: 180000 }]
  }
];

export const INITIAL_DAILY_SALES: DailySale[] = [
  {
    id: 'sale-001',
    saleNumber: 'VTA-2026-0410',
    date: '2026-09-28T09:40:00Z',
    customerName: 'Martín Gómez (Mostrador)',
    paymentMethod: 'transferencia',
    totalAmount: 17000,
    totalCost: 5600,
    notes: '2 Remeras Spum lisas para prueba de diseño',
    items: [
      {
        productId: 'prod-rem-spum-l',
        productName: 'Remera Spum Premium Tacto Algodón Talle L',
        quantity: 2,
        unitPrice: 8500,
        unitCost: 2800,
        totalPrice: 17000
      }
    ]
  },
  {
    id: 'sale-002',
    saleNumber: 'VTA-2026-0411',
    date: '2026-09-28T11:15:00Z',
    customerName: 'Andrea Peñalver',
    paymentMethod: 'mercadopago',
    totalAmount: 13000,
    totalCost: 4200,
    notes: '2 tazas mágicas personalizadas día de la madre',
    items: [
      {
        productId: 'prod-taz-03',
        productName: 'Taza Mágica Termosensible Cerámica',
        quantity: 2,
        unitPrice: 6500,
        unitCost: 2100,
        totalPrice: 13000
      }
    ]
  },
  {
    id: 'sale-003',
    saleNumber: 'VTA-2026-0408',
    date: '2026-09-27T16:20:00Z',
    customerName: 'Santiago Rossi',
    paymentMethod: 'efectivo',
    totalAmount: 14400,
    totalCost: 4800,
    notes: '3 Gorras trucker lisas',
    items: [
      {
        productId: 'prod-gor-01',
        productName: 'Gorra Trucker con Frente Blanco de Poliéster y Red',
        quantity: 3,
        unitPrice: 4800,
        unitCost: 1600,
        totalPrice: 14400
      }
    ]
  },
  {
    id: 'sale-004',
    saleNumber: 'VTA-2026-0405',
    date: '2026-09-26T18:00:00Z',
    customerName: 'Gimnasio Fitness Zone',
    paymentMethod: 'transferencia',
    totalAmount: 48000,
    totalCost: 16000,
    notes: '10 Gorras trucker con estampado frente',
    items: [
      {
        productId: 'prod-gor-01',
        productName: 'Gorra Trucker con Frente Blanco de Poliéster y Red',
        quantity: 10,
        unitPrice: 4800,
        unitCost: 1600,
        totalPrice: 48000
      }
    ]
  },
  // Ventas históricas del último año
  {
    id: 'sale-hist-08',
    saleNumber: 'VTA-2026-0370',
    date: '2026-08-20T17:30:00Z',
    customerName: 'Escuela de Danzas Ritmo',
    paymentMethod: 'transferencia',
    totalAmount: 760000,
    totalCost: 280000,
    notes: 'Conjuntos y remeras sublimadas evento Día del Niño',
    items: [{ productId: 'prod-rem-spum-m', productName: 'Remeras y gorras surtidas', quantity: 95, unitPrice: 8000, unitCost: 2947, totalPrice: 760000 }]
  },
  {
    id: 'sale-hist-07',
    saleNumber: 'VTA-2026-0320',
    date: '2026-07-19T18:00:00Z',
    customerName: 'Peluquería & Estilo Urban',
    paymentMethod: 'mercadopago',
    totalAmount: 640000,
    totalCost: 230000,
    notes: 'Tazas personalizadas y botellas Día del Amigo',
    items: [{ productId: 'prod-taz-01', productName: 'Tazas Cerámica Importadas Diseños Amistad', quantity: 128, unitPrice: 5000, unitCost: 1796, totalPrice: 640000 }]
  },
  {
    id: 'sale-hist-06',
    saleNumber: 'VTA-2026-0280',
    date: '2026-06-18T16:00:00Z',
    customerName: 'Club Social y Deportivo Alberdi',
    paymentMethod: 'transferencia',
    totalAmount: 670000,
    totalCost: 245000,
    notes: 'Remeras y gorras con fotos y leyendas Día del Padre',
    items: [{ productId: 'prod-rem-spum-l', productName: 'Remeras estampadas Día del Padre', quantity: 80, unitPrice: 8375, unitCost: 3062, totalPrice: 670000 }]
  },
  {
    id: 'sale-hist-05',
    saleNumber: 'VTA-2026-0230',
    date: '2026-05-22T15:30:00Z',
    customerName: 'Sindicato de Gastronómicos',
    paymentMethod: 'transferencia',
    totalAmount: 590000,
    totalCost: 215000,
    notes: 'Pecheras y gorras para conmemoración',
    items: [{ productId: 'prod-gor-01', productName: 'Gorras y delantales estampados', quantity: 118, unitPrice: 5000, unitCost: 1822, totalPrice: 590000 }]
  },
  {
    id: 'sale-hist-04',
    saleNumber: 'VTA-2026-0185',
    date: '2026-04-18T12:00:00Z',
    customerName: 'Cervecería Artesanal El Faro',
    paymentMethod: 'mercadopago',
    totalAmount: 480000,
    totalCost: 175000,
    notes: 'Remeras uniformes y posavasos sublimados',
    items: [{ productId: 'prod-rem-spum-m', productName: 'Remeras y accesorios cerveceros', quantity: 60, unitPrice: 8000, unitCost: 2916, totalPrice: 480000 }]
  },
  {
    id: 'sale-hist-03',
    saleNumber: 'VTA-2026-0130',
    date: '2026-03-24T17:00:00Z',
    customerName: 'Colegio San Martín (Centro de Estudiantes)',
    paymentMethod: 'transferencia',
    totalAmount: 610000,
    totalCost: 220000,
    notes: 'Indumentaria promo 2026 y botellas',
    items: [{ productId: 'prod-rem-spum-l', productName: 'Remeras Promo y llaveros', quantity: 75, unitPrice: 8133, unitCost: 2933, totalPrice: 610000 }]
  },
  {
    id: 'sale-hist-02',
    saleNumber: 'VTA-2026-0080',
    date: '2026-02-17T16:00:00Z',
    customerName: 'Comparsa Los Reyes del Barrio',
    paymentMethod: 'efectivo',
    totalAmount: 520000,
    totalCost: 190000,
    notes: 'Gorras trucker flúor y remeras carnaval',
    items: [{ productId: 'prod-gor-01', productName: 'Gorras trucker carnaval', quantity: 104, unitPrice: 5000, unitCost: 1826, totalPrice: 520000 }]
  },
  {
    id: 'sale-hist-01',
    saleNumber: 'VTA-2026-0035',
    date: '2026-01-20T14:00:00Z',
    customerName: 'Complejo Turístico Las Cabañas',
    paymentMethod: 'mercadopago',
    totalAmount: 280000,
    totalCost: 105000,
    notes: 'Merchandising de verano y recuerdos',
    items: [{ productId: 'prod-taz-02', productName: 'Tazas plásticas de viaje', quantity: 56, unitPrice: 5000, unitCost: 1875, totalPrice: 280000 }]
  },
  {
    id: 'sale-hist-12',
    saleNumber: 'VTA-2025-0950',
    date: '2025-12-22T19:00:00Z',
    customerName: 'Empresa Logística del Plata',
    paymentMethod: 'transferencia',
    totalAmount: 890000,
    totalCost: 320000,
    notes: 'Regalos corporativos fin de año y canastas navideñas',
    items: [{ productId: 'prod-taz-01', productName: 'Kits Navideños: Taza + Remera + Llavero', quantity: 100, unitPrice: 8900, unitCost: 3200, totalPrice: 890000 }]
  },
  {
    id: 'sale-hist-11',
    saleNumber: 'VTA-2025-0870',
    date: '2025-11-25T16:30:00Z',
    customerName: 'Restaurante Don Vittorio',
    paymentMethod: 'mercadopago',
    totalAmount: 410000,
    totalCost: 155000,
    notes: 'Remeras staff cocina y mozos',
    items: [{ productId: 'prod-rem-spum-m', productName: 'Remeras gastronómicas', quantity: 50, unitPrice: 8200, unitCost: 3100, totalPrice: 410000 }]
  },
  {
    id: 'sale-hist-10',
    saleNumber: 'VTA-2025-0810',
    date: '2025-10-16T18:00:00Z',
    customerName: 'Farmacias y Perfumerías del Centro',
    paymentMethod: 'transferencia',
    totalAmount: 320000,
    totalCost: 120000,
    notes: 'Tazas con diseño especial Día de la Madre',
    items: [{ productId: 'prod-taz-03', productName: 'Tazas mágicas mamá', quantity: 50, unitPrice: 6400, unitCost: 2400, totalPrice: 320000 }]
  }
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

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-01',
    quoteNumber: 'COT-2026-0042',
    createdAt: '2026-09-27T10:30:00Z',
    validUntil: '2026-10-12T23:59:59Z',
    customerId: 'cust-01',
    customerName: 'Promociones Impacto Visual SRL',
    customerEmail: 'compras@impactovisual.com.ar',
    customerPhone: '+54 9 11 5544-3322',
    customerTaxId: '30-71458923-8',
    status: 'enviado',
    items: [
      {
        productId: 'prod-rem-02',
        productName: 'Remera Spum Blanca Premium Sublimación',
        saleMode: 'con_diseno',
        size: 'L',
        color: 'Blanco',
        quantity: 30,
        unitPrice: 6500,
        totalPrice: 195000,
        designNotes: 'Logo corporativo al frente 20x28cm en cuatricromía HD',
        designName: 'Logo Impacto Visual 2026'
      },
      {
        productId: 'prod-taz-01',
        productName: 'Taza de Cerámica Blanca Importada Calidad AAA',
        saleMode: 'con_diseno',
        quantity: 30,
        unitPrice: 4200,
        totalPrice: 126000,
        designNotes: 'Mismo logo con eslogan al dorso'
      }
    ],
    subtotal: 321000,
    discountAmount: 16000,
    taxPercent: 0,
    taxAmount: 0,
    totalAmount: 305000,
    estimatedDays: 5,
    notes: 'Presupuesto válido por 15 días corridos. Precios incluyen insumos e impresión en alta definición.',
    paymentTerms: 'Seña del 50% al aprobar boceto digital, saldo contra entrega o despacho.'
  }
];

