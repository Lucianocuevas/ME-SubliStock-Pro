import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Printer,
  Package,
  ExternalLink,
  Barcode
} from 'lucide-react';
import { ProductItem } from '../../types';
import { LabelPrintService } from '../../services/labelPrintService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onPrintLabel?: (product: ProductItem) => void;
}

export const ProductQrModal: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  onPrintLabel
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [copiedSku, setCopiedSku] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'barcode'>('qr');

  useEffect(() => {
    if (!product || !isOpen) {
      setQrDataUrl('');
      setBarcodeDataUrl('');
      return;
    }

    const codeValue = product.sku || product.id;

    // Generate local QR code
    // Encodes product SKU along with app URL for direct scanning in mobile
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullScanPayload = `${origin}?sku=${encodeURIComponent(codeValue)}`;

    QRCode.toDataURL(fullScanPayload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => {
        console.error('Error generating product QR code:', err);
      });

    // Generate local barcode
    const barImg = LabelPrintService.generateBarcodeImage(codeValue, 'CODE128', {
      width: 2,
      height: 48,
      displayValue: true
    });
    setBarcodeDataUrl(barImg);
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const codeValue = product.sku || product.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeValue);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.download = `QR-${product.sku || 'producto'}.png`;
    a.href = qrDataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadBarcode = () => {
    if (!barcodeDataUrl) return;
    const a = document.createElement('a');
    a.download = `Barcode-${product.sku || 'producto'}.png`;
    a.href = barcodeDataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Código QR & Barras del Insumo
              </h3>
              <p className="text-[11px] font-mono text-cyan-400">
                SKU: {product.sku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: QR vs Barcode */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código QR (2D)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('barcode')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'barcode'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Código de Barras (CODE128)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex flex-col items-center text-center">
          {/* Product details summary */}
          <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-left">
            <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Stock: <strong className="text-emerald-400">{product.currentStock} {product.unit}</strong></span>
              <span>Costo: <strong className="text-slate-200">${product.costPrice}</strong></span>
              {product.location && <span>Ubicación: <strong className="text-cyan-300">{product.location}</strong></span>}
            </div>
          </div>

          {/* Visual Code Box */}
          {activeTab === 'qr' ? (
            <div className="p-4 bg-white rounded-2xl border-2 border-cyan-500/50 shadow-xl flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Código QR de ${product.name}`}
                  className="w-52 h-52 block"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12 animate-pulse text-cyan-600" />
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-700 mt-2 font-bold">
                {product.sku}
              </span>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-2xl border-2 border-cyan-500/50 shadow-xl flex flex-col items-center justify-center w-full max-w-[320px]">
              {barcodeDataUrl ? (
                <img
                  src={barcodeDataUrl}
                  alt={`Código de Barras de ${product.name}`}
                  className="max-w-full h-auto block"
                />
              ) : (
                <div className="h-24 flex items-center justify-center text-slate-400">
                  <Barcode className="w-12 h-12 animate-pulse text-cyan-600" />
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400 max-w-xs">
            {activeTab === 'qr'
              ? 'Escanea este código QR con la cámara del celular para consultar stock, registrar ingresos o editar el insumo.'
              : 'Código de barras estándar compatible con lectores láser USB y cámaras de dispositivos.'}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full pt-1">
            {activeTab === 'qr' ? (
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar QR (PNG)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadBarcode}
                className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Barras (PNG)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Copiar código SKU"
            >
              {copiedSku ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSku ? '¡Copiado!' : 'Copiar SKU'}</span>
            </button>

            {onPrintLabel && (
              <button
                type="button"
                onClick={() => {
                  onPrintLabel(product);
                  onClose();
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Imprimir en hoja A4 autoadhesiva"
              >
                <Printer className="w-3.5 h-3.5 text-purple-400" />
                <span>Etiqueta A4</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
