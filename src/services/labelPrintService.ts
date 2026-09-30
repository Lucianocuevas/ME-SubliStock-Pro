import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { ProductItem, ProductLabelSettings } from '../types';
import { AppSettings } from './storageService';

export interface LabelPrintItem {
  product: ProductItem;
  quantity: number;
}

export class LabelPrintService {
  /**
   * Generates a base64 PNG data URL of a barcode
   */
  static generateBarcodeImage(
    value: string,
    format: 'CODE128' | 'EAN13' | 'CODE39' = 'CODE128',
    options?: { width?: number; height?: number; displayValue?: boolean }
  ): string {
    if (!value || typeof document === 'undefined') return '';
    try {
      const canvas = document.createElement('canvas');
      // Clean value according to format
      let safeValue = value.trim();
      if (format === 'EAN13') {
        // EAN-13 must be numeric and 12-13 digits
        safeValue = safeValue.replace(/\D/g, '');
        if (safeValue.length < 12) {
          safeValue = safeValue.padStart(12, '0');
        } else if (safeValue.length > 13) {
          safeValue = safeValue.substring(0, 13);
        }
      } else if (format === 'CODE39') {
        // CODE39 supports uppercase letters, digits, and - . $ / + % SPACE
        safeValue = safeValue.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '-');
      }

      JsBarcode(canvas, safeValue || 'PROD001', {
        format,
        width: options?.width || 1.8,
        height: options?.height || 36,
        displayValue: options?.displayValue ?? false,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
        fontSize: 10
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('Barcode generation fallback for value:', value, err);
      try {
        // Fallback to CODE128 if EAN13 or CODE39 fails
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, value.slice(0, 15) || 'PROD001', {
          format: 'CODE128',
          width: 1.5,
          height: 32,
          displayValue: false,
          margin: 2
        });
        return canvas.toDataURL('image/png');
      } catch {
        return '';
      }
    }
  }

  /**
   * Generates and downloads an A4 PDF sheet with product labels
   */
  static generateA4Pdf(
    items: LabelPrintItem[],
    labelConfig: ProductLabelSettings,
    settings: AppSettings,
    options?: { startOffset?: number } // Skip starting labels if sheet is partially used
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4' // 210 x 297 mm
    });

    const {
      columns = 3,
      rows = 8,
      labelWidthMm = 64,
      labelHeightMm = 33.8,
      marginTopMm = 12,
      marginLeftMm = 6,
      gapHorizontalMm = 3,
      gapVerticalMm = 0,
      showBorder = true,
      includeBarcode = true,
      includePrice = true,
      includeProductName = true,
      includeLogo = true,
      includeWorkshopName = true,
      includeSku = true,
      includeSizeColor = true,
      includeCustomText = false,
      customText = '',
      barcodeFormat = 'CODE128',
      showBarcodeValue = true,
      pricePrefix = '$',
      fontSize = 'medium',
      textAlign = 'center'
    } = labelConfig;

    const labelsPerPage = columns * rows;
    const startOffset = Math.max(0, options?.startOffset || 0);

    // Flatten items by quantity
    const labelList: ProductItem[] = [];
    for (const item of items) {
      for (let q = 0; q < Math.max(1, item.quantity); q++) {
        labelList.push(item.product);
      }
    }

    if (labelList.length === 0) {
      return doc;
    }

    // Font scaling multipliers
    const scaleFactor = fontSize === 'small' ? 0.85 : fontSize === 'large' ? 1.15 : 1.0;

    let totalPrinted = 0;
    let isFirstPage = true;

    // Pre-calculate barcode cache to avoid redundant generations
    const barcodeCache: Record<string, string> = {};
    for (const prod of labelList) {
      const codeValue = prod.sku || prod.id;
      if (!barcodeCache[codeValue]) {
        barcodeCache[codeValue] = this.generateBarcodeImage(codeValue, barcodeFormat);
      }
    }

    const totalSlots = startOffset + labelList.length;

    for (let slotIdx = startOffset; slotIdx < totalSlots; slotIdx++) {
      const pageIndex = Math.floor(slotIdx / labelsPerPage);
      const slotOnPage = slotIdx % labelsPerPage;
      const col = slotOnPage % columns;
      const row = Math.floor(slotOnPage / columns);

      // Handle page creation
      if (slotOnPage === 0 && slotIdx !== startOffset) {
        doc.addPage('a4', 'portrait');
      } else if (isFirstPage && slotIdx === startOffset && pageIndex > 0) {
        // If start offset pushes to next page
        for (let p = 0; p < pageIndex; p++) {
          doc.addPage('a4', 'portrait');
        }
      }
      isFirstPage = false;

      const prodIdx = slotIdx - startOffset;
      const prod = labelList[prodIdx];
      if (!prod) continue;

      // Coordinate calculations
      const x = marginLeftMm + col * (labelWidthMm + gapHorizontalMm);
      const y = marginTopMm + row * (labelHeightMm + gapVerticalMm);
      const w = labelWidthMm;
      const h = labelHeightMm;

      // Label background / cut border
      if (showBorder) {
        doc.setDrawColor(210, 215, 225);
        doc.setLineWidth(0.18);
        doc.roundedRect(x, y, w, h, 1.2, 1.2, 'S');
      }

      // Internal padding
      const padX = 2.2;
      const padY = 2;
      const innerW = w - padX * 2;
      const centerX = x + w / 2;
      const alignX = textAlign === 'center' ? centerX : x + padX;

      let curY = y + padY + 2.5;

      // 1. Header: Logo & Workshop Name
      const showHeader = (includeLogo && settings.logoUrl) || includeWorkshopName;
      if (showHeader) {
        let logoWidth = 0;
        if (includeLogo && settings.logoUrl) {
          try {
            const logoH = 4.5 * scaleFactor;
            logoWidth = 6.5 * scaleFactor;
            doc.addImage(settings.logoUrl, 'PNG', x + padX, curY - 2.2, logoWidth, logoH);
          } catch {
            logoWidth = 0;
          }
        }

        if (includeWorkshopName) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.2 * scaleFactor);
          doc.setTextColor(90, 100, 120);
          const shopNameText = doc.splitTextToSize(settings.workshopName || 'SubliStudio', innerW - logoWidth - 1)[0] || '';
          const nameX = logoWidth > 0 ? x + padX + logoWidth + 1.5 : alignX;
          doc.text(shopNameText, nameX, curY, { align: logoWidth > 0 ? 'left' : textAlign });
        }
        curY += 3.4 * scaleFactor;
      }

      // 2. Product Name
      if (includeProductName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5 * scaleFactor);
        doc.setTextColor(15, 23, 42); // slate-900
        const nameLines = doc.splitTextToSize(prod.name, innerW);
        const nameToPrint = nameLines.slice(0, 2);
        for (const line of nameToPrint) {
          doc.text(line, alignX, curY, { align: textAlign });
          curY += 3.3 * scaleFactor;
        }
      }

      // 3. Size / Color / SKU details line
      const detailParts: string[] = [];
      if (includeSku && prod.sku) detailParts.push(`SKU: ${prod.sku}`);
      if (includeSizeColor) {
        if (prod.size) detailParts.push(prod.size);
        if (prod.color) detailParts.push(prod.color);
      }
      if (detailParts.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6 * scaleFactor);
        doc.setTextColor(100, 116, 139); // slate-500
        const detailsText = doc.splitTextToSize(detailParts.join(' • '), innerW)[0] || '';
        doc.text(detailsText, alignX, curY, { align: textAlign });
        curY += 2.8 * scaleFactor;
      }

      // 4. Barcode
      if (includeBarcode) {
        const barcodeData = barcodeCache[prod.sku || prod.id];
        if (barcodeData) {
          const barcodeW = Math.min(innerW * 0.88, 44 * scaleFactor);
          const barcodeH = Math.min(8.5 * scaleFactor, h * 0.28);
          const barX = textAlign === 'center' ? x + (w - barcodeW) / 2 : x + padX;

          try {
            doc.addImage(barcodeData, 'PNG', barX, curY, barcodeW, barcodeH);
            curY += barcodeH + 1.2;
          } catch (e) {
            console.error('Failed to add barcode to pdf', e);
          }

          if (showBarcodeValue) {
            doc.setFont('courier', 'normal');
            doc.setFontSize(5.5 * scaleFactor);
            doc.setTextColor(71, 85, 105);
            doc.text(prod.sku || prod.id, alignX, curY, { align: textAlign });
            curY += 2.4 * scaleFactor;
          }
        }
      }

      // 5. Price & Custom Text
      if (includePrice) {
        const priceVal = prod.salePrice || 0;
        const formattedPrice = `${pricePrefix} ${priceVal.toLocaleString('es-AR')}`;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10 * scaleFactor);
        doc.setTextColor(15, 23, 42); // Dark slate
        doc.text(formattedPrice, alignX, curY + 1, { align: textAlign });
        curY += 3.5 * scaleFactor;
      }

      // 6. Custom footer text
      if (includeCustomText && customText) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5.5 * scaleFactor);
        doc.setTextColor(148, 163, 184); // slate-400
        const customLine = doc.splitTextToSize(customText, innerW)[0] || '';
        doc.text(customLine, alignX, curY + 0.5, { align: textAlign });
      }

      totalPrinted++;
    }

    return doc;
  }
}
