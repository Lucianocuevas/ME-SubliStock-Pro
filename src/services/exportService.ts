import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductItem, CustomerOrder, DailySale, PurchaseOrder, MonthlyReportSummary } from '../types';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../data/initialData';
import { formatCurrency } from './storageService';

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
}
