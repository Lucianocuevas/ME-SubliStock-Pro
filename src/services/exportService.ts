import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductItem, CustomerOrder, DailySale, PurchaseOrder, MonthlyReportSummary, AccountMovement } from '../types';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../data/initialData';
import { formatCurrency, AppSettings } from './storageService';

export class ExportService {
  /**
   * Export complete Monthly Report to Excel (.xlsx) with multiple sheets
   */
  static exportMonthlyReportToExcel(
    summary: MonthlyReportSummary,
    monthSales: DailySale[],
    monthOrders: CustomerOrder[],
    monthPurchases: PurchaseOrder[],
    criticalProducts: ProductItem[]
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Resumen Ejecutivo
    const summaryData = [
      ['REPORTE MENSUAL DE SUBLIMACIÓN Y STOCK'],
      ['Período:', `${summary.monthName} ${summary.year}`],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-AR')],
      [''],
      ['MÉTRICA FINANCIERA', 'VALOR'],
      ['Ventas Totales Facturadas', summary.totalSalesRevenue],
      ['Costo Total de Insumos', summary.totalProductionCost],
      ['Ganancia Bruta Estimada', summary.estimatedGrossProfit],
      ['Margen Bruto (%)', `${summary.grossMarginPercent.toFixed(1)}%`],
      ['Total Invertido en Proveedores', summary.totalSupplierPurchases],
      ['Valorización Total del Stock Actual', summary.currentInventoryValue],
      ['Pedidos de Clientes Entregados', summary.ordersCompletedCount],
      ['Unidades Totales Producidas', summary.totalUnitsProduced],
      [''],
      ['INSUMOS EN ESTADO CRÍTICO O AGOTADOS', criticalProducts.length]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');

    // 2. Ventas de Mostrador
    const salesData = [
      ['Nro Comprobante', 'Fecha', 'Cliente', 'Medio de Pago', 'Total Venta ($)', 'Costo Insumos ($)', 'Ganancia ($)', 'Ítems']
    ];
    for (const s of monthSales) {
      const itemsList = s.items.map(i => `${i.quantity}x ${i.productName}`).join('; ');
      salesData.push([
        s.saleNumber,
        new Date(s.date).toLocaleDateString('es-AR') + ' ' + new Date(s.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        s.customerName,
        s.paymentMethod.toUpperCase(),
        String(s.totalAmount),
        String(s.totalCost),
        String(s.totalAmount - s.totalCost),
        itemsList
      ]);
    }
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    wsSales['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsSales, 'Ventas Diarias');

    // 3. Pedidos de Clientes
    const ordersData = [
      ['Nro Pedido', 'Cliente', 'Teléfono', 'Fecha Pedido', 'Fecha Entrega', 'Estado Producción', 'Total ($)', 'Seña ($)', 'Saldo ($)', 'Detalle Ítems']
    ];
    for (const o of monthOrders) {
      const itemsList = o.items.map(i => `${i.quantity}x ${i.productName} (${i.size || '-'})`).join('; ');
      ordersData.push([
        o.orderNumber,
        o.customerName,
        o.customerPhone,
        new Date(o.createdAt).toLocaleDateString('es-AR'),
        o.deliveryDate,
        o.productionStatus.toUpperCase(),
        String(o.totalAmount),
        String(o.depositAmount),
        String(o.remainingBalance),
        itemsList
      ]);
    }
    const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);
    wsOrders['!cols'] = [{ wch: 16 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Pedidos de Clientes');

    // 4. Insumos Críticos
    const alertsData = [
      ['SKU', 'Insumo / Producto', 'Rubro', 'Material', 'Talle/Tamaño', 'Stock Actual', 'Stock Mínimo', 'Déficit', 'Costo Unit.', 'Estado']
    ];
    for (const p of criticalProducts) {
      const cat = CATEGORY_LABELS[p.category]?.label || p.category;
      const mat = MATERIAL_LABELS[p.material] || p.material;
      const status = p.currentStock === 0 ? 'AGOTADO' : (p.currentStock <= p.minStock ? 'CRÍTICO' : 'ALERTA');
      alertsData.push([
        p.sku,
        p.name,
        cat,
        mat,
        p.size || '-',
        String(p.currentStock),
        String(p.minStock),
        String(Math.max(0, p.minStock - p.currentStock)),
        String(p.costPrice),
        status
      ]);
    }
    const wsAlerts = XLSX.utils.aoa_to_sheet(alertsData);
    wsAlerts['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsAlerts, 'Insumos Críticos');

    // 5. Compras a Proveedores
    const purchasesData = [
      ['Nro Orden', 'Proveedor', 'Fecha', 'Factura / Remito', 'Estado', 'Total Invertido ($)', 'Ítems Recibidos']
    ];
    for (const pur of monthPurchases) {
      const itemsList = pur.items.map(i => `${i.quantity}x ${i.productName} ($${i.unitCost} c/u)`).join('; ');
      purchasesData.push([
        pur.orderNumber,
        pur.supplierName,
        pur.date,
        pur.invoiceNumber || '-',
        pur.status.toUpperCase(),
        String(pur.totalAmount),
        itemsList
      ]);
    }
    const wsPurchases = XLSX.utils.aoa_to_sheet(purchasesData);
    wsPurchases['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsPurchases, 'Compras a Proveedores');

    // Generate file download
    const fileName = `Reporte_Sublimacion_${summary.monthName}_${summary.year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Export all inventory catalog to Excel
   */
  static exportStockToExcel(products: ProductItem[]): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['SKU', 'Producto / Insumo', 'Rubro', 'Material', 'Talle/Tamaño', 'Color', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Costo Unit.', 'Precio Venta', 'Valor Stock Total', 'Ubicación', 'Alerta']
    ];

    for (const p of products) {
      const cat = CATEGORY_LABELS[p.category]?.label || p.category;
      const mat = MATERIAL_LABELS[p.material] || p.material;
      let alertState = 'Normal';
      if (p.currentStock === 0) alertState = 'AGOTADO';
      else if (p.currentStock <= p.minStock) alertState = 'CRÍTICO';
      else if (p.currentStock <= p.minStock * 1.4) alertState = 'Bajo';

      rows.push([
        p.sku,
        p.name,
        cat,
        mat,
        p.size || '-',
        p.color || '-',
        p.unit,
        String(p.currentStock),
        String(p.minStock),
        String(p.costPrice),
        String(p.salePrice),
        String(p.currentStock * p.costPrice),
        p.location || 'Taller',
        alertState
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 16 }, { wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario de Insumos');
    XLSX.writeFile(wb, `Inventario_Stock_Sublimacion_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Generate formal PDF Monthly Report with jsPDF
   */
  static exportMonthlyReportToPDF(
    summary: MonthlyReportSummary,
    monthSales: DailySale[],
    monthOrders: CustomerOrder[],
    criticalProducts: ProductItem[]
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header styling
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBLISTOCK PRO', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Taller de Sublimación e Insumos', 14, 22);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`REPORTE MENSUAL: ${summary.monthName.toUpperCase()} ${summary.year}`, 200, 16, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emitido: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`, 200, 22, { align: 'right' });

    // Financial KPI Summary Cards
    let startY = 40;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN FINANCIERO Y PRODUCTIVO DEL MES', 14, startY);

    const kpiData = [
      ['Ventas Totales:', formatCurrency(summary.totalSalesRevenue), 'Costo Total de Insumos:', formatCurrency(summary.totalProductionCost)],
      ['Ganancia Estimada:', formatCurrency(summary.estimatedGrossProfit), 'Margen Bruto:', `${summary.grossMarginPercent.toFixed(1)}%`],
      ['Compras a Proveedores:', formatCurrency(summary.totalSupplierPurchases), 'Valor Actual en Stock:', formatCurrency(summary.currentInventoryValue)],
      ['Pedidos Entregados:', `${summary.ordersCompletedCount} pedidos`, 'Unidades Producidas:', `${summary.totalUnitsProduced} unidades`]
    ];

    autoTable(doc, {
      startY: startY + 4,
      head: [],
      body: kpiData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 45 },
        1: { textColor: [15, 23, 42], fontStyle: 'bold', cellWidth: 50 },
        2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 45 },
        3: { textColor: [15, 23, 42], fontStyle: 'bold', cellWidth: 50 }
      }
    });

    // Critical Insumos Section
    // @ts-expect-error jsPDF autotable attaches lastAutoTable
    const afterKpiY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80;

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`2. ALERTAS CRÍTICAS DE STOCK (${criticalProducts.length} INSUMOS EN RIESGO)`, 14, afterKpiY);

    const alertsBody = criticalProducts.map(p => [
      p.sku,
      p.name,
      CATEGORY_LABELS[p.category]?.label || p.category,
      p.size || '-',
      `${p.currentStock} ${p.unit}`,
      `${p.minStock} ${p.unit}`,
      p.currentStock === 0 ? 'AGOTADO' : 'CRÍTICO'
    ]);

    autoTable(doc, {
      startY: afterKpiY + 4,
      head: [['SKU', 'Producto / Insumo', 'Rubro', 'Talle/Medida', 'Stock Actual', 'Mínimo', 'Estado']],
      body: alertsBody.length > 0 ? alertsBody : [['-', 'No hay alertas críticas en este momento', '-', '-', '-', '-', 'OK']],
      headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [254, 242, 242] }
    });

    // Customer Orders Section
    // @ts-expect-error jsPDF autotable attaches lastAutoTable
    const afterAlertsY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 130;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. PEDIDOS DESTACADOS DEL PERÍODO', 14, afterAlertsY);

    const ordersBody = monthOrders.slice(0, 10).map(o => [
      o.orderNumber,
      o.customerName,
      o.deliveryDate,
      o.productionStatus.replace('_', ' ').toUpperCase(),
      formatCurrency(o.totalAmount),
      formatCurrency(o.remainingBalance)
    ]);

    autoTable(doc, {
      startY: afterAlertsY + 4,
      head: [['Nro Pedido', 'Cliente', 'Fecha Entrega', 'Estado', 'Total ($)', 'Saldo Pendiente']],
      body: ordersBody.length > 0 ? ordersBody : [['-', 'Sin pedidos registrados en este período', '-', '-', '-', '-']],
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // Daily Sales Section
    // @ts-expect-error jsPDF autotable attaches lastAutoTable
    const afterOrdersY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 180;

    // Check if we need a new page
    if (afterOrdersY > 230) {
      doc.addPage();
      doc.text('4. VENTAS DIARIAS DE MOSTRADOR', 14, 20);
      autoTable(doc, {
        startY: 25,
        head: [['Comprobante', 'Fecha', 'Cliente', 'Pago', 'Total ($)', 'Ganancia ($)']],
        body: monthSales.slice(0, 15).map(s => [
          s.saleNumber,
          new Date(s.date).toLocaleDateString('es-AR'),
          s.customerName,
          s.paymentMethod.toUpperCase(),
          formatCurrency(s.totalAmount),
          formatCurrency(s.totalAmount - s.totalCost)
        ]),
        headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 }
      });
    } else {
      doc.text('4. VENTAS DIARIAS DE MOSTRADOR', 14, afterOrdersY);
      autoTable(doc, {
        startY: afterOrdersY + 4,
        head: [['Comprobante', 'Fecha', 'Cliente', 'Pago', 'Total ($)', 'Ganancia ($)']],
        body: monthSales.slice(0, 10).map(s => [
          s.saleNumber,
          new Date(s.date).toLocaleDateString('es-AR'),
          s.customerName,
          s.paymentMethod.toUpperCase(),
          formatCurrency(s.totalAmount),
          formatCurrency(s.totalAmount - s.totalCost)
        ]),
        headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 }
      });
    }

    // Footer page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SubliStock Pro - Documento generado automáticamente | Página ${i} de ${totalPages}`,
        105,
        290,
        { align: 'center' }
      );
    }

    doc.save(`Reporte_Sublimacion_${summary.monthName}_${summary.year}.pdf`);
  }

  /**
   * Export Account Statement to Excel (.xlsx)
   */
  static exportAccountStatementToExcel(
    entityName: string,
    entityType: 'customer' | 'supplier',
    movements: AccountMovement[],
    currentBalance: number,
    settings?: AppSettings,
    contactInfo?: { phone?: string; email?: string; address?: string; taxId?: string }
  ): void {
    const wb = XLSX.utils.book_new();
    const sorted = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalDebits = sorted.reduce((acc, m) => acc + (m.debit || 0), 0);
    const totalCredits = sorted.reduce((acc, m) => acc + (m.credit || 0), 0);

    const sheetData: (string | number)[][] = [
      [(settings?.workshopName || 'SubliStudio Taller Gráfico & Sublimación').toUpperCase()],
      ['EXTRACTO DE CUENTA CORRIENTE'],
      ['Fecha de Emisión:', new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })],
      [''],
      [entityType === 'customer' ? 'CLIENTE:' : 'PROVEEDOR:', entityName],
      ['Teléfono / WhatsApp:', contactInfo?.phone || '-'],
      ['Email:', contactInfo?.email || '-'],
      ['Dirección:', contactInfo?.address || '-'],
      ['CUIT / Identificación:', contactInfo?.taxId || '-'],
      [''],
      ['RESUMEN DE SALDO'],
      ['Total Debe (Cargos acumulados):', totalDebits],
      ['Total Haber (Pagos acumulados):', totalCredits],
      ['Saldo Actual:', currentBalance],
      ['Estado:', currentBalance > 0 ? (entityType === 'customer' ? 'Saldo Pendiente Adeudado' : 'Saldo a Pagar') : 'Cuenta al Día'],
      [''],
      ['DETALLE DE MOVIMIENTOS'],
      ['Fecha', 'Comprobante / Ref', 'Tipo', 'Concepto', 'Medio de Pago', 'Debe ($)', 'Haber ($)', 'Saldo ($)', 'Observaciones']
    ];

    for (const m of sorted) {
      sheetData.push([
        new Date(m.date).toLocaleDateString('es-AR'),
        m.referenceNumber || '-',
        m.type.replace('_', ' ').toUpperCase(),
        m.concept,
        m.paymentMethod ? m.paymentMethod.toUpperCase() : '-',
        m.debit || 0,
        m.credit || 0,
        m.balanceAfter,
        m.notes || ''
      ]);
    }

    if (settings?.bankDetails) {
      sheetData.push(['']);
      sheetData.push(['DATOS BANCARIOS PARA TRANSFERENCIA:']);
      sheetData.push([settings.bankDetails]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 45 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Cuenta Corriente');

    const cleanName = entityName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Extracto_CC_${cleanName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Export Account Statement to PDF with Workshop Branding
   */
  static exportAccountStatementToPDF(
    entityName: string,
    entityType: 'customer' | 'supplier',
    movements: AccountMovement[],
    currentBalance: number,
    settings?: AppSettings,
    contactInfo?: { phone?: string; email?: string; address?: string; taxId?: string }
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const workshopName = settings?.workshopName || 'SubliStudio Taller Gráfico';
    const sorted = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalDebits = sorted.reduce((acc, m) => acc + (m.debit || 0), 0);
    const totalCredits = sorted.reduce((acc, m) => acc + (m.credit || 0), 0);

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(workshopName, 14, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    const subtitle = [
      settings?.slogan || 'Sublimación, Estampado Textil & Merchandising',
      `CUIT: ${settings?.taxId || '30-71987654-2'} | Tel: ${settings?.phone || ''} | ${settings?.email || ''}`,
      settings?.address ? `${settings.address}, ${settings?.city || ''}` : ''
    ].filter(Boolean).join(' • ');
    doc.text(subtitle, 14, 23);

    // Document Title Badge
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 146, 60); // orange-400
    doc.text('ESTADO DE CUENTA CORRIENTE', 14, 31);

    const emissionDate = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Fecha de Emisión: ${emissionDate}`, 196, 31, { align: 'right' });

    // Client/Supplier Information Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, 42, 182, 26, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${entityType === 'customer' ? 'CLIENTE:' : 'PROVEEDOR:'} ${entityName}`, 18, 50);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600

    const col1 = [
      contactInfo?.phone ? `Tel / WhatsApp: ${contactInfo.phone}` : null,
      contactInfo?.email ? `Email: ${contactInfo.email}` : null
    ].filter(Boolean).join('   |   ');

    const col2 = [
      contactInfo?.address ? `Dirección: ${contactInfo.address}` : null,
      contactInfo?.taxId ? `CUIT / DNI: ${contactInfo.taxId}` : null
    ].filter(Boolean).join('   |   ');

    if (col1) doc.text(col1, 18, 57);
    if (col2) doc.text(col2, 18, 63);

    // Summary Cards (Total Debe, Total Haber, Saldo Actual)
    const startYSummary = 72;
    // Card 1: Total Facturado / Cargos
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startYSummary, 56, 18, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL CARGOS (DEBE)', 18, startYSummary + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(totalDebits), 18, startYSummary + 14);

    // Card 2: Total Pagos / Abonos
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(77, startYSummary, 56, 18, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('TOTAL COBROS / PAGOS (HABER)', 81, startYSummary + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(formatCurrency(totalCredits), 81, startYSummary + 14);

    // Card 3: Saldo Actual
    const isDebt = currentBalance > 0;
    if (isDebt) {
      doc.setFillColor(255, 247, 237);
    } else {
      doc.setFillColor(240, 253, 244);
    }
    doc.roundedRect(140, startYSummary, 56, 18, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    if (isDebt) {
      doc.setTextColor(194, 65, 12);
    } else {
      doc.setTextColor(21, 128, 61);
    }
    doc.text('SALDO ACTUAL', 144, startYSummary + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (isDebt) {
      doc.setTextColor(194, 65, 12);
    } else {
      doc.setTextColor(21, 128, 61);
    }
    doc.text(formatCurrency(currentBalance), 144, startYSummary + 14);

    // Table of movements
    autoTable(doc, {
      startY: startYSummary + 24,
      head: [['Fecha', 'Comprobante', 'Concepto', 'Medio de Pago', 'Debe (+)', 'Haber (-)', 'Saldo Acum.']],
      body: sorted.map(m => [
        new Date(m.date).toLocaleDateString('es-AR'),
        m.referenceNumber || '-',
        m.concept,
        m.paymentMethod ? m.paymentMethod.toUpperCase() : '-',
        m.debit > 0 ? formatCurrency(m.debit) : '-',
        m.credit > 0 ? formatCurrency(m.credit) : '-',
        formatCurrency(m.balanceAfter)
      ]),
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 26 },
        2: { cellWidth: 62 },
        3: { cellWidth: 24 },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    // Bank Details Banner if pending debt exists
    if (settings?.bankDetails && finalY < 235) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, finalY + 8, 182, 18, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('DATOS BANCARIOS PARA PAGO / TRANSFERENCIA:', 18, finalY + 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(settings.bankDetails, 18, finalY + 21);
    }

    // Page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${workshopName} · Extracto de Cuenta Corriente | Página ${i} de ${totalPages}`,
        105,
        290,
        { align: 'center' }
      );
    }

    const cleanName = entityName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Estado_Cuenta_${cleanName}.pdf`);
  }
}
