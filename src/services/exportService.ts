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
   * Export all inventory catalog to a formatted PDF report with executive summary and autoTable
   */
  static exportInventoryToPDF(
    products: ProductItem[],
    settings?: AppSettings,
    options?: {
      title?: string;
      saveToFile?: boolean;
    }
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const workshopName = settings?.workshopName || 'SubliStock Pro';
    const emissionDate = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const emissionTime = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate Financial Summary
    const totalItems = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
    const totalCostValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
    const totalSaleValue = products.reduce((acc, p) => acc + (p.currentStock * p.salePrice), 0);
    const grossMargin = totalSaleValue - totalCostValue;
    const marginPercent = totalCostValue > 0 ? Math.round((grossMargin / totalCostValue) * 100) : 0;
    const criticalCount = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
    const outOfStockCount = products.filter(p => p.currentStock === 0).length;

    // Header Banner (Landscape 297mm width)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 28, 'F');

    // Workshop Name & Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(workshopName.toUpperCase(), 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    const subtitle = [
      settings?.slogan || 'Taller de Sublimación & Estampado Textil',
      settings?.taxId ? `CUIT: ${settings.taxId}` : null,
      settings?.phone ? `Tel: ${settings.phone}` : null,
      settings?.address ? `${settings.address}, ${settings?.city || ''}` : null
    ].filter(Boolean).join(' • ');
    doc.text(subtitle, 14, 19);

    // Document Title Badge on Right
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 146, 60); // orange-400
    doc.text('REPORTE GENERAL DE INVENTARIO Y STOCK', 283, 12, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Fecha de Emisión: ${emissionDate} ${emissionTime} hs`, 283, 19, { align: 'right' });

    // Executive KPI Summary Cards (Y = 32)
    const kpiY = 32;
    const cardH = 16;
    const cardW = 44;
    const gap = 3;

    // KPI 1: Total Insumos
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, kpiY, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CATÁLOGO DE INSUMOS', 17, kpiY + 5);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalItems} productos`, 17, kpiY + 12);

    // KPI 2: Unidades Físicas
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14 + (cardW + gap), kpiY, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('UNIDADES EN TALLER', 14 + (cardW + gap) + 3, kpiY + 5);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalUnits.toLocaleString('es-AR')} unidades`, 14 + (cardW + gap) + 3, kpiY + 12);

    // KPI 3: Valoración al Costo
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(14 + (cardW + gap) * 2, kpiY, cardW + 2, cardH, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('CAPITAL VALUADO (COSTO)', 14 + (cardW + gap) * 2 + 3, kpiY + 5);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(formatCurrency(totalCostValue), 14 + (cardW + gap) * 2 + 3, kpiY + 12);

    // KPI 4: Valoración a la Venta
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.roundedRect(14 + (cardW + gap) * 3 + 2, kpiY, cardW + 2, cardH, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229);
    doc.text('POTENCIAL A LA VENTA', 14 + (cardW + gap) * 3 + 5, kpiY + 5);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text(formatCurrency(totalSaleValue), 14 + (cardW + gap) * 3 + 5, kpiY + 12);

    // KPI 5: Margen Proyectado
    doc.setFillColor(254, 243, 199); // amber-50
    doc.roundedRect(14 + (cardW + gap) * 4 + 4, kpiY, cardW, cardH, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 83, 9);
    doc.text('MARGEN PROYECTADO', 14 + (cardW + gap) * 4 + 7, kpiY + 5);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text(`+${marginPercent}% (${formatCurrency(grossMargin)})`, 14 + (cardW + gap) * 4 + 7, kpiY + 12);

    // KPI 6: Alertas Críticas / Agotados
    const alertBg = (outOfStockCount > 0 || criticalCount > 0) ? [254, 242, 242] : [240, 253, 244];
    doc.setFillColor(alertBg[0], alertBg[1], alertBg[2]);
    doc.roundedRect(14 + (cardW + gap) * 5 + 4, kpiY, cardW - 3, cardH, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(outOfStockCount > 0 ? 185 : 21, outOfStockCount > 0 ? 28 : 128, outOfStockCount > 0 ? 28 : 61);
    doc.text('ESTADO DE ALERTA', 14 + (cardW + gap) * 5 + 7, kpiY + 5);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${outOfStockCount} agot. · ${criticalCount} crít.`, 14 + (cardW + gap) * 5 + 7, kpiY + 12);

    // Prepare table rows
    const tableData = products.map(p => {
      const cat = CATEGORY_LABELS[p.category]?.label || p.category;
      const mat = MATERIAL_LABELS[p.material] || p.material;
      const talleColor = [p.size ? `T: ${p.size}` : null, p.color].filter(Boolean).join(' / ') || '-';
      const rowValuation = p.currentStock * p.costPrice;

      let status = 'ÓPTIMO';
      if (p.currentStock === 0) status = '¡AGOTADO!';
      else if (p.currentStock <= p.minStock) status = 'CRÍTICO';
      else if (p.currentStock <= p.minStock * 1.4) status = 'BAJO';

      return [
        p.sku,
        p.name,
        cat,
        mat,
        talleColor,
        `${p.currentStock} ${p.unit}`,
        `${p.minStock} ${p.unit}`,
        formatCurrency(p.costPrice),
        formatCurrency(p.salePrice),
        formatCurrency(rowValuation),
        p.location || 'Taller',
        status
      ];
    });

    // Render Table
    autoTable(doc, {
      startY: 52,
      head: [[
        'SKU',
        'Insumo / Descripción',
        'Rubro',
        'Material',
        'Talle/Color',
        'Stock',
        'Mín.',
        'Costo Unit.',
        'P. Venta',
        'Valuación Costo',
        'Ubicación',
        'Estado'
      ]],
      body: tableData,
      foot: [[
        'TOTALES',
        `${totalItems} insumos en catálogo`,
        '',
        '',
        '',
        `${totalUnits.toLocaleString('es-AR')} un.`,
        '',
        '',
        '',
        formatCurrency(totalCostValue),
        '',
        `${outOfStockCount} Agot. / ${criticalCount} Crít.`
      ]],
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
        cellPadding: 2
      },
      footStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 2.5
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 22 }, // SKU
        1: { cellWidth: 50 }, // Name
        2: { cellWidth: 26 }, // Category
        3: { cellWidth: 24 }, // Material
        4: { cellWidth: 22 }, // Talle/Color
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 18 }, // Stock
        6: { halign: 'right', cellWidth: 15 }, // Min
        7: { halign: 'right', cellWidth: 20 }, // Cost Price
        8: { halign: 'right', fontStyle: 'bold', cellWidth: 20 }, // Sale Price
        9: { halign: 'right', fontStyle: 'bold', cellWidth: 24 }, // Total Valuation
        10: { cellWidth: 18 }, // Location
        11: { halign: 'center', fontStyle: 'bold', cellWidth: 20 } // Estado
      },
      didParseCell: (data) => {
        // Highlight status cell
        if (data.section === 'body' && data.column.index === 11) {
          const val = String(data.cell.raw);
          if (val === '¡AGOTADO!') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'CRÍTICO') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'BAJO') {
            data.cell.styles.textColor = [202, 138, 4];
          } else {
            data.cell.styles.textColor = [16, 185, 129];
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);

        doc.text(
          `${workshopName} • Reporte de Inventario de Insumos • Documento de Control Interno`,
          14,
          202
        );
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          283,
          202,
          { align: 'right' }
        );
      },
      margin: { top: 52, right: 14, bottom: 12, left: 14 }
    });

    const shouldSave = options?.saveToFile ?? true;
    if (shouldSave) {
      const cleanWorkshop = workshopName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Inventario_Stock_${cleanWorkshop}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    return doc;
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
   * Export comprehensive Monthly Sales & Financial Movements PDF
   */
  static exportMonthlySalesAndMovementsPDF(
    summary: MonthlyReportSummary,
    monthSales: DailySale[],
    monthOrders: CustomerOrder[],
    monthPurchases: PurchaseOrder[],
    monthMovements: AccountMovement[],
    criticalProducts: ProductItem[],
    settings?: AppSettings,
    options?: {
      includeExecutiveSummary?: boolean;
      includeSales?: boolean;
      includeOrders?: boolean;
      includeMovements?: boolean;
      includePurchases?: boolean;
      includeAlerts?: boolean;
      saveToFile?: boolean;
    }
  ): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const workshopName = settings?.workshopName || 'SubliStudio Taller Gráfico & Sublimación';

    const incSummary = options?.includeExecutiveSummary ?? true;
    const incSales = options?.includeSales ?? true;
    const incOrders = options?.includeOrders ?? true;
    const incMovements = options?.includeMovements ?? true;
    const incPurchases = options?.includePurchases ?? true;
    const incAlerts = options?.includeAlerts ?? true;
    const saveToFile = options?.saveToFile ?? true;

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');

    // Logo if exists
    let logoOffset = 14;
    if (settings?.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', 14, 6, 18, 18);
        logoOffset = 36;
      } catch {
        logoOffset = 14;
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(workshopName, logoOffset, 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    const subtitle = [
      settings?.slogan || 'Sublimación, Estampado Textil & Merchandising',
      `CUIT: ${settings?.taxId || '30-71987654-2'}`,
      settings?.phone ? `Tel: ${settings.phone}` : null,
      settings?.email ? `Email: ${settings.email}` : null
    ].filter(Boolean).join(' • ');
    doc.text(subtitle, logoOffset, 21);

    // Right-aligned report title & period
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 146, 60); // orange-400
    doc.text('INFORME DE VENTAS & MOVIMIENTOS', 196, 14, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`PERÍODO: ${summary.monthName.toUpperCase()} ${summary.year}`, 196, 21, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Emitido: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
      196,
      27,
      { align: 'right' }
    );

    let currentY = 44;

    // 2. Executive Financial & Production Summary
    if (incSummary) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. RESUMEN EJECUTIVO Y MÉTRICAS FINANCIERAS', 14, currentY);

      // Movements aggregation for the month
      const totalCollections = monthMovements
        .filter(m => m.credit > 0)
        .reduce((sum, m) => sum + m.credit, 0);
      const totalOutflows = monthMovements
        .filter(m => m.debit > 0 && m.type !== 'cargo_pedido')
        .reduce((sum, m) => sum + m.debit, 0);

      const kpiRows = [
        [
          'Ventas Totales Facturadas:',
          formatCurrency(summary.totalSalesRevenue),
          'Costo Total de Insumos:',
          formatCurrency(summary.totalProductionCost)
        ],
        [
          'Ganancia Bruta Estimada:',
          formatCurrency(summary.estimatedGrossProfit),
          'Margen Bruto:',
          `${summary.grossMarginPercent.toFixed(1)}%`
        ],
        [
          'Cobranzas / Ingresos Percibidos:',
          formatCurrency(totalCollections),
          'Compras a Proveedores:',
          formatCurrency(summary.totalSupplierPurchases)
        ],
        [
          'Pedidos Completados:',
          `${summary.ordersCompletedCount} pedidos`,
          'Unidades Producidas:',
          `${summary.totalUnitsProduced} unidades`
        ],
        [
          'Valorización del Stock Actual:',
          formatCurrency(summary.currentInventoryValue),
          'Insumos Críticos / Alerta:',
          `${criticalProducts.length} productos`
        ]
      ];

      autoTable(doc, {
        startY: currentY + 3,
        head: [],
        body: kpiRows,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 48 },
          1: { textColor: [15, 23, 42], fontStyle: 'bold', cellWidth: 47 },
          2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 48 },
          3: { textColor: [15, 23, 42], fontStyle: 'bold', cellWidth: 47 }
        }
      });

      currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 45;
    }

    // Helper to check page break space
    const checkPageBreak = (neededMm: number) => {
      if (currentY + neededMm > 275) {
        doc.addPage();
        currentY = 20;
      }
    };

    // 3. Ventas Diarias de Mostrador
    if (incSales && monthSales.length > 0) {
      checkPageBreak(35);
      doc.setTextColor(2, 132, 199); // cyan-600
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`2. VENTAS DE MOSTRADOR (${monthSales.length} comprobantes)`, 14, currentY);

      const salesRows = monthSales.map(s => {
        const itemsText = s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
        return [
          s.saleNumber,
          new Date(s.date).toLocaleDateString('es-AR'),
          s.customerName,
          s.paymentMethod.toUpperCase(),
          itemsText,
          formatCurrency(s.totalAmount),
          formatCurrency(s.totalAmount - s.totalCost)
        ];
      });

      const totalSalesAmount = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);
      const totalSalesProfit = monthSales.reduce((acc, s) => acc + (s.totalAmount - s.totalCost), 0);

      salesRows.push([
        'TOTALES',
        '',
        `${monthSales.length} ventas`,
        '',
        '',
        formatCurrency(totalSalesAmount),
        formatCurrency(totalSalesProfit)
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Nro Ticket', 'Fecha', 'Cliente', 'Medio Pago', 'Ítems', 'Total ($)', 'Ganancia ($)']],
        body: salesRows,
        headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 16 },
          2: { cellWidth: 30 },
          3: { cellWidth: 22 },
          4: { cellWidth: 50 },
          5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 24, halign: 'right' }
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [240, 249, 255] }
      });

      currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;
    }

    // 4. Pedidos de Clientes a Producción
    if (incOrders && monthOrders.length > 0) {
      checkPageBreak(35);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`3. PEDIDOS DE CLIENTES A PRODUCCIÓN (${monthOrders.length} pedidos)`, 14, currentY);

      const ordersRows = monthOrders.map(o => {
        const itemsText = o.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
        return [
          o.orderNumber,
          o.customerName,
          o.deliveryDate,
          o.productionStatus.replace('_', ' ').toUpperCase(),
          itemsText,
          formatCurrency(o.totalAmount),
          formatCurrency(o.depositAmount),
          formatCurrency(o.remainingBalance)
        ];
      });

      const totalOrdersAmount = monthOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      const totalDeposits = monthOrders.reduce((acc, o) => acc + o.depositAmount, 0);
      const totalBalances = monthOrders.reduce((acc, o) => acc + o.remainingBalance, 0);

      ordersRows.push([
        'TOTALES',
        `${monthOrders.length} pedidos`,
        '',
        '',
        '',
        formatCurrency(totalOrdersAmount),
        formatCurrency(totalDeposits),
        formatCurrency(totalBalances)
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Nro Pedido', 'Cliente', 'Entrega', 'Estado', 'Detalle Ítems', 'Total ($)', 'Seña ($)', 'Saldo ($)']],
        body: ordersRows,
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 28 },
          2: { cellWidth: 18 },
          3: { cellWidth: 20 },
          4: { cellWidth: 46 },
          5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 17, halign: 'right' },
          7: { cellWidth: 17, halign: 'right' }
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;
    }

    // 5. Movimientos Financieros de Caja y Cuentas Corrientes
    if (incMovements && monthMovements.length > 0) {
      checkPageBreak(35);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`4. LIBRO DE MOVIMIENTOS FINANCIEROS Y CUENTAS CORRIENTES (${monthMovements.length} asientos)`, 14, currentY);

      const movementsRows = monthMovements.map(m => [
        new Date(m.date).toLocaleDateString('es-AR'),
        m.referenceNumber || '-',
        m.entityName,
        m.type.replace('_', ' ').toUpperCase(),
        m.concept,
        m.paymentMethod ? m.paymentMethod.toUpperCase() : '-',
        m.credit > 0 ? formatCurrency(m.credit) : '-',
        m.debit > 0 ? formatCurrency(m.debit) : '-',
        formatCurrency(m.balanceAfter)
      ]);

      const sumCredits = monthMovements.reduce((acc, m) => acc + (m.credit || 0), 0);
      const sumDebits = monthMovements.reduce((acc, m) => acc + (m.debit || 0), 0);

      movementsRows.push([
        'TOTALES',
        '',
        `${monthMovements.length} movs`,
        '',
        '',
        '',
        formatCurrency(sumCredits),
        formatCurrency(sumDebits),
        ''
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Fecha', 'Ref / Nro', 'Entidad / Cliente', 'Tipo', 'Concepto', 'Medio', 'Haber (+)', 'Debe (-)', 'Saldo']],
        body: movementsRows,
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 18 },
          2: { cellWidth: 26 },
          3: { cellWidth: 20 },
          4: { cellWidth: 44 },
          5: { cellWidth: 18 },
          6: { cellWidth: 16, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
          7: { cellWidth: 16, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] },
          8: { cellWidth: 16, halign: 'right' }
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [240, 253, 244] }
      });

      currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;
    }

    // 6. Compras de Insumos a Proveedores
    if (incPurchases && monthPurchases.length > 0) {
      checkPageBreak(30);
      doc.setTextColor(109, 40, 217); // purple-700
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`5. COMPRAS DE INSUMOS A PROVEEDORES (${monthPurchases.length} órdenes)`, 14, currentY);

      const purchasesRows = monthPurchases.map(p => {
        const itemsText = p.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
        return [
          p.orderNumber,
          p.supplierName,
          p.date,
          p.invoiceNumber || '-',
          p.status.toUpperCase(),
          itemsText,
          formatCurrency(p.totalAmount)
        ];
      });

      const totalPurchasesAmount = monthPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
      purchasesRows.push([
        'TOTALES',
        `${monthPurchases.length} compras`,
        '',
        '',
        '',
        '',
        formatCurrency(totalPurchasesAmount)
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Nro Orden', 'Proveedor', 'Fecha', 'Factura / Remito', 'Estado', 'Ítems Insumos', 'Total Invertido']],
        body: purchasesRows,
        headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 18 },
          3: { cellWidth: 22 },
          4: { cellWidth: 18 },
          5: { cellWidth: 54 },
          6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [250, 245, 255] }
      });

      currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 35;
    }

    // 7. Insumos Críticos o Agotados
    if (incAlerts && criticalProducts.length > 0) {
      checkPageBreak(25);
      doc.setTextColor(185, 28, 28); // rose-700
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`6. INSUMOS EN NIVEL CRÍTICO O AGOTADOS (${criticalProducts.length} productos)`, 14, currentY);

      const alertsRows = criticalProducts.map(p => [
        p.sku,
        p.name,
        CATEGORY_LABELS[p.category]?.label || p.category,
        p.size || '-',
        `${p.currentStock} ${p.unit}`,
        `${p.minStock} ${p.unit}`,
        formatCurrency(p.costPrice),
        p.currentStock === 0 ? 'AGOTADO' : 'CRÍTICO'
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['SKU', 'Insumo / Producto', 'Rubro', 'Talle/Medida', 'Stock Actual', 'Stock Mínimo', 'Costo Unit.', 'Estado']],
        body: alertsRows,
        headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 48 },
          2: { cellWidth: 26 },
          3: { cellWidth: 18 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
        },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [254, 242, 242] }
      });
    }

    // 8. Page Numbers & Watermark Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${workshopName} · Reporte Mensual de Ventas y Movimientos (${summary.monthName} ${summary.year}) | Página ${i} de ${totalPages}`,
        105,
        290,
        { align: 'center' }
      );
    }

    const fileName = `Reporte_Mensual_Ventas_y_Movimientos_${summary.monthName}_${summary.year}.pdf`;
    if (saveToFile) {
      doc.save(fileName);
    }
    return doc;
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
