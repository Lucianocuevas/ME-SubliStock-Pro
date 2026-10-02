import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Camera,
  CameraOff,
  X,
  ScanLine,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Flashlight,
  Volume2,
  VolumeX,
  Tag,
  Package,
  Layers,
  Edit,
  ExternalLink,
  ChevronRight,
  QrCode,
  Upload,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ProductItem } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onProductUpdated: () => void;
  onSelectProductInInventory?: (product: ProductItem) => void;
  onCreateNewProductWithSku?: (sku: string) => void;
}

// Play pleasant web audio feedback on successful scan
const playScanBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08); // A6 note

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // Ignore audio context autoplay restriction
  }
};

export const BarcodeScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onProductUpdated,
  onSelectProductInInventory,
  onCreateNewProductWithSku
}) => {
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [scanGuideMode, setScanGuideMode] = useState<'qr' | 'barcode' | 'all'>('all');
  const [isDecodingFile, setIsDecodingFile] = useState(false);

  // Scanned item state
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<ProductItem | null>(null);
  const [scannedNotFound, setScannedNotFound] = useState(false);
  const [matchedProductQrUrl, setMatchedProductQrUrl] = useState<string>('');
  const [showProductQrInScanner, setShowProductQrInScanner] = useState(false);

  // Quick stock update state
  const [stockAdjustmentMode, setStockAdjustmentMode] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(1);
  const [newCostPrice, setNewCostPrice] = useState<number | ''>('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);

  // Manual fallback input
  const [manualCode, setManualCode] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'sublistock-barcode-reader-container';

  // Find product by barcode or SKU
  const findProductByCode = useCallback((code: string): ProductItem | null => {
    let cleanCode = code.trim().toLowerCase();
    if (!cleanCode) return null;

    // Handle URLs or query parameters containing sku
    if (cleanCode.includes('sku=')) {
      try {
        const url = new URL(code);
        const skuParam = url.searchParams.get('sku');
        if (skuParam) {
          cleanCode = skuParam.trim().toLowerCase();
        }
      } catch {
        const match = code.match(/sku=([^&]+)/i);
        if (match && match[1]) {
          cleanCode = decodeURIComponent(match[1]).trim().toLowerCase();
        }
      }
    }

    return products.find(p => {
      const matchSku = p.sku.trim().toLowerCase() === cleanCode;
      const matchId = p.id.trim().toLowerCase() === cleanCode;
      return matchSku || matchId;
    }) || null;
  }, [products]);

  // Handle scanned barcode or QR
  const handleBarcodeDetected = useCallback((decodedText: string) => {
    const code = decodedText.trim();
    if (!code) return;

    if (soundEnabled) {
      playScanBeep();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([40, 30, 40]); } catch {}
    }

    setLastScannedCode(code);
    const prod = findProductByCode(code);

    if (prod) {
      setMatchedProduct(prod);
      setScannedNotFound(false);
      setNewCostPrice(prod.costPrice);
      setAdjustmentValue(1);
      setUpdateSuccessMessage(null);

      // Generate local QR code for matched product preview
      const targetPayload = `${window.location.origin}?sku=${encodeURIComponent(prod.sku)}`;
      QRCode.toDataURL(targetPayload, {
        width: 240,
        margin: 1.5,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(url => setMatchedProductQrUrl(url)).catch(() => {});
    } else {
      setMatchedProduct(null);
      setScannedNotFound(true);
      setUpdateSuccessMessage(null);
      setMatchedProductQrUrl('');
    }

    // If not in continuous mode, pause scanning until user chooses next action
    if (!continuousMode && html5QrCodeRef.current?.isScanning) {
      try {
        html5QrCodeRef.current.pause(true);
        setIsScanning(false);
      } catch (err) {
        console.warn('Could not pause camera scanner:', err);
      }
    }
  }, [findProductByCode, soundEnabled, continuousMode]);

  // Start Camera Scanner
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    setCameraError(null);

    // Give DOM time to mount reader div
    await new Promise(res => setTimeout(res, 80));
    const container = document.getElementById(scannerContainerId);
    if (!container) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });
      }

      // Check available cameras
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          if (!selectedCameraId) {
            // Prefer back/environment camera if found
            const backCam = cameras.find(c =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('trasera') ||
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('environment')
            );
            const activeId = cameraIdToUse || (backCam ? backCam.id : cameras[0].id);
            setSelectedCameraId(activeId);
          }
        }
      } catch (err) {
        console.warn('Could not enumerate cameras:', err);
      }

      const cameraConfig = cameraIdToUse || selectedCameraId
        ? { deviceId: { exact: cameraIdToUse || selectedCameraId } }
        : { facingMode: 'environment' };

      // Responsive square scanning region that allows detecting both 2D QR codes and 1D barcodes
      const qrboxCalculator = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edge = Math.floor(minEdge * 0.78);
        return { width: edge, height: edge };
      };

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: qrboxCalculator,
          aspectRatio: 1.3333
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // Frame without barcode, normal operation
        }
      );

      setIsScanning(true);

      // Check torch capability
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setIsScanning(false);
      const errStr = String(err?.message || err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setCameraError('Permiso de cámara no concedido. Puedes habilitarla en tu navegador, subir una imagen con el código o escribir el SKU manualmente abajo.');
      } else if (errStr.includes('NotFoundError') || errStr.includes('DevicesNotFoundError')) {
        setCameraError('No se encontró ninguna cámara disponible. Puedes subir una foto o escribir el código manualmente.');
      } else {
        setCameraError('No se pudo inicializar la cámara. Puedes subir una foto del código QR o ingresarlo manualmente.');
      }
    }
  }, [handleBarcodeDetected, selectedCameraId]);

  // Stop camera stream safely
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
    setIsTorchOn(false);
  }, []);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any]
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  // Switch camera device
  const handleSwitchCamera = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    await stopScanner();
    await startScanner(newCameraId);
  };

  // Scan code from image file upload
  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    setCameraError(null);
    try {
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });
        html5QrCodeRef.current = scanner;
      }
      const decodedText = await scanner.scanFile(file, true);
      handleBarcodeDetected(decodedText);
    } catch (err: any) {
      console.warn('Error al decodificar imagen:', err);
      setCameraError('No se pudo detectar ningún código QR o de barras en la foto subida. Verifica que esté nítido.');
    } finally {
      setIsDecodingFile(false);
      e.target.value = '';
    }
  };

  // Resume or start scanning again
  const handleScanNext = async () => {
    setMatchedProduct(null);
    setScannedNotFound(false);
    setUpdateSuccessMessage(null);
    setLastScannedCode(null);

    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.resume();
        setIsScanning(true);
        return;
      } catch {
        // Fall through to restart
      }
    }
    await startScanner();
  };

  // Manage lifecycle on open/close
  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
      setMatchedProduct(null);
      setScannedNotFound(false);
      setLastScannedCode(null);
      setUpdateSuccessMessage(null);
      setCameraError(null);
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  // Stock quick update submission
  const handleApplyStockUpdate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!matchedProduct) return;

    setIsUpdatingStock(true);
    try {
      let updatedProduct: ProductItem | null = null;
      const numVal = Math.max(0, adjustmentValue);

      if (stockAdjustmentMode === 'add') {
        const costToApply = typeof newCostPrice === 'number' && newCostPrice > 0 ? newCostPrice : undefined;
        StorageService.quickRestock(matchedProduct.id, numVal, costToApply);
        updatedProduct = StorageService.getProducts().find(p => p.id === matchedProduct.id) || null;
      } else if (stockAdjustmentMode === 'subtract') {
        updatedProduct = StorageService.adjustProductStock(matchedProduct.id, -numVal);
      } else if (stockAdjustmentMode === 'set') {
        updatedProduct = StorageService.setProductStock(matchedProduct.id, numVal);
      }

      if (updatedProduct) {
        setMatchedProduct(updatedProduct);
        setUpdateSuccessMessage(
          `¡Stock actualizado! Nuevo stock: ${updatedProduct.currentStock} ${updatedProduct.unit}`
        );
        onProductUpdated();

        // If continuous mode, automatically prepare next scan after brief delay
        if (continuousMode) {
          setTimeout(() => {
            handleScanNext();
          }, 1200);
        }
      }
    } catch (err: any) {
      console.error('Error updating stock:', err);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Manual code entry submit
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Lector de Código de Barras & QR (Cámara)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 hidden sm:inline">
                  Cámara & Foto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Apunta al código QR o de barras, o sube una imagen para actualizar stock al instante
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* CAMERA VIEWFINDER SECTION */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[220px] max-h-[320px]">
            {/* HTML5 QRCODE CONTAINER */}
            <div
              id={scannerContainerId}
              className="w-full h-full min-h-[220px] flex items-center justify-center overflow-hidden"
            />

            {/* Scanning Laser and Guide Reticle Overlay */}
            {isScanning && !matchedProduct && !scannedNotFound && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Target box adjusting to guide mode */}
                <div
                  className={`border-2 border-orange-400/80 rounded-xl relative shadow-[0_0_20px_rgba(251,146,60,0.3)] transition-all duration-300 ${
                    scanGuideMode === 'qr'
                      ? 'w-48 h-48 sm:w-56 sm:h-56'
                      : scanGuideMode === 'barcode'
                      ? 'w-64 h-28 sm:w-72 sm:h-32'
                      : 'w-56 h-48 sm:w-64 sm:h-52'
                  }`}
                >
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-orange-400 rounded-tl-sm" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-orange-400 rounded-tr-sm" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-orange-400 rounded-bl-sm" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-orange-400 rounded-br-sm" />

                  {/* Red Laser Scanning Beam */}
                  <div className="absolute left-2 right-2 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-bounce top-1/2" />
                </div>
                <span className="text-[11px] font-medium text-slate-200 mt-2 bg-slate-950/85 px-3 py-1 rounded-full border border-slate-700/60 backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                  {scanGuideMode === 'qr' ? (
                    <>
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Centra el Código QR dentro del recuadro</span>
                    </>
                  ) : scanGuideMode === 'barcode' ? (
                    <>
                      <ScanLine className="w-3.5 h-3.5 text-orange-400" />
                      <span>Centra el Código de Barras (1D)</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Centra el Código QR o Código de Barras</span>
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Camera Controls Bar (Overlaid on camera feed) */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-lg text-xs font-semibold backdrop-blur-md transition-colors ${
                    isTorchOn
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                  title={isTorchOn ? 'Apagar Linterna' : 'Encender Linterna'}
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg text-xs font-semibold backdrop-blur-md transition-colors ${
                  soundEnabled
                    ? 'bg-slate-900/80 text-slate-200 border border-slate-700'
                    : 'bg-slate-900/80 text-slate-500 border border-slate-700'
                }`}
                title={soundEnabled ? 'Sonido activado' : 'Silenciar sonido de escaneo'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom Camera Selector (if multiple cameras available) */}
            {availableCameras.length > 1 && (
              <div className="absolute bottom-2.5 left-2.5 z-10">
                <select
                  value={selectedCameraId}
                  onChange={e => handleSwitchCamera(e.target.value)}
                  className="bg-slate-950/90 text-[11px] text-slate-200 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none backdrop-blur-md"
                >
                  {availableCameras.map(cam => (
                    <option key={cam.id} value={cam.id}>
                      📷 {cam.label || `Cámara ${cam.id.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error Message if camera failed */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
                <CameraOff className="w-9 h-9 text-rose-400" />
                <p className="text-xs text-rose-300 font-medium max-w-sm">
                  {cameraError}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startScanner()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    Reintentar Cámara
                  </button>

                  <label className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto del Código</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScanFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* VIEWPORT CONTROLS & MODE SELECTOR */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            {/* Mode guide buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 font-medium pr-1 hidden sm:inline">Modo:</span>
              <button
                type="button"
                onClick={() => setScanGuideMode('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                  scanGuideMode === 'all'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Auto / Todo</span>
              </button>

              <button
                type="button"
                onClick={() => setScanGuideMode('qr')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                  scanGuideMode === 'qr'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>Código QR</span>
              </button>

              <button
                type="button"
                onClick={() => setScanGuideMode('barcode')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                  scanGuideMode === 'barcode'
                    ? 'bg-orange-950 text-orange-300 border border-orange-800'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ScanLine className="w-3.5 h-3.5 text-orange-400" />
                <span>Código de Barras</span>
              </button>
            </div>

            {/* Scan from file upload button */}
            <label className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
              <Upload className={`w-3.5 h-3.5 text-cyan-400 ${isDecodingFile ? 'animate-bounce' : ''}`} />
              <span>{isDecodingFile ? 'Leyendo imagen...' : 'Subir Imagen con Código'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleScanFile}
                disabled={isDecodingFile}
                className="hidden"
              />
            </label>
          </div>

          {/* QUICK MANUAL ENTRY BARCODE SEARCH (Fallback & Manual Testing) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <form onSubmit={handleManualSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Escribir o pegar SKU / Código (ej: TAZ-CER-001)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
              >
                Buscar
              </button>
            </form>

            {/* Quick sample SKU buttons for immediate testing */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-slate-400 pt-1">
              <span className="shrink-0 font-medium">Ejemplos rápidos:</span>
              {products.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setManualCode(p.sku);
                    handleBarcodeDetected(p.sku);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 font-mono transition-colors shrink-0"
                >
                  {p.sku}
                </button>
              ))}
            </div>
          </div>

          {/* SCANNED CODE RESULT PANEL */}
          {matchedProduct && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {/* Product Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800/80 font-bold">
                      SKU: {matchedProduct.sku}
                    </span>
                    <span className="text-xs text-slate-400">
                      {CATEGORY_LABELS[matchedProduct.category]?.label || matchedProduct.category}
                      {matchedProduct.material ? ` · ${MATERIAL_LABELS[matchedProduct.material] || matchedProduct.material}` : ''}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white mt-1">
                    {matchedProduct.name}
                  </h4>
                  {(matchedProduct.size || matchedProduct.color || matchedProduct.location) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {matchedProduct.size && `Talle: ${matchedProduct.size} `}
                      {matchedProduct.color && `· Color: ${matchedProduct.color} `}
                      {matchedProduct.location && `· Ubicación: ${matchedProduct.location}`}
                    </p>
                  )}
                </div>

                {/* Current Stock Indicator */}
                <div className="text-right sm:text-right bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Stock Actual</span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <strong className={`text-xl font-black ${
                      matchedProduct.currentStock <= matchedProduct.minStock ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {matchedProduct.currentStock}
                    </strong>
                    <span className="text-xs text-slate-400">{matchedProduct.unit}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Mínimo: {matchedProduct.minStock} {matchedProduct.unit}
                  </span>
                </div>
              </div>

              {/* SUCCESS NOTIFICATION */}
              {updateSuccessMessage && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-600/80 rounded-lg text-xs font-bold text-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{updateSuccessMessage}</span>
                </div>
              )}

              {/* PRODUCT QR CODE PREVIEW PANEL */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Código QR del Insumo</span>
                      <span className="text-[10px] text-slate-400">Escaneable directamente desde cualquier smartphone</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowProductQrInScanner(!showProductQrInScanner)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    {showProductQrInScanner ? 'Ocultar QR' : 'Ver Código QR'}
                  </button>
                </div>

                {showProductQrInScanner && matchedProductQrUrl && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center justify-center animate-in fade-in">
                    <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-700 flex flex-col items-center">
                      <img
                        src={matchedProductQrUrl}
                        alt={`QR ${matchedProduct.sku}`}
                        className="w-36 h-36 block"
                      />
                      <span className="text-[10px] font-mono text-slate-900 font-bold mt-1">
                        {matchedProduct.sku}
                      </span>
                    </div>

                    <a
                      href={matchedProductQrUrl}
                      download={`QR-${matchedProduct.sku}.png`}
                      className="mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Imagen QR (PNG)</span>
                    </a>
                  </div>
                )}
              </div>

              {/* QUICK STOCK ADJUSTMENT TOOL */}
              <form onSubmit={handleApplyStockUpdate} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Actualización Rápida de Stock:
                  </span>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setStockAdjustmentMode('add')}
                      className={`px-2.5 py-1 rounded font-bold transition-colors ${
                        stockAdjustmentMode === 'add'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      + Sumar Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockAdjustmentMode('subtract')}
                      className={`px-2.5 py-1 rounded font-bold transition-colors ${
                        stockAdjustmentMode === 'subtract'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      - Descontar
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockAdjustmentMode('set')}
                      className={`px-2.5 py-1 rounded font-bold transition-colors ${
                        stockAdjustmentMode === 'set'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      = Fijar Stock
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* Quantity input & quick stepping */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 block font-medium">
                      {stockAdjustmentMode === 'add'
                        ? 'Cantidad a sumar al inventario:'
                        : stockAdjustmentMode === 'subtract'
                        ? 'Cantidad a descontar:'
                        : 'Nuevo valor exacto de stock:'}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustmentValue(prev => Math.max(1, prev - 1))}
                        className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        value={adjustmentValue}
                        onChange={e => setAdjustmentValue(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-base font-bold text-center text-white focus:outline-none focus:border-orange-500"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setAdjustmentValue(prev => prev + 1)}
                        className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick step chips */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {[5, 10, 25, 50].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAdjustmentValue(val)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Purchase Cost or Info */}
                  <div className="space-y-1.5">
                    {stockAdjustmentMode === 'add' ? (
                      <>
                        <label className="text-[11px] text-slate-400 block font-medium">
                          Costo de compra unitario actual ($):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={newCostPrice}
                          onChange={e => setNewCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          placeholder={formatCurrency(matchedProduct.costPrice)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[10px] text-slate-500 block">
                          Costo actual: {formatCurrency(matchedProduct.costPrice)} · Precio venta: {formatCurrency(matchedProduct.salePrice)}
                        </span>
                      </>
                    ) : (
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-400">
                        <span className="block font-semibold text-white">Efecto en el Stock:</span>
                        <span>
                          Stock resultante estimado:{' '}
                          <strong className="text-white">
                            {stockAdjustmentMode === 'subtract'
                              ? Math.max(0, matchedProduct.currentStock - adjustmentValue)
                              : adjustmentValue}{' '}
                            {matchedProduct.unit}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                  <div className="flex items-center gap-2">
                    {onSelectProductInInventory && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProductInInventory(matchedProduct);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ver en Tabla</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleScanNext}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ScanLine className="w-3.5 h-3.5 text-orange-400" />
                      <span>Escanear Siguiente</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingStock}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all"
                  >
                    {isUpdatingStock ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Actualización</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CODE NOT FOUND IN INVENTORY */}
          {scannedNotFound && (
            <div className="p-4 bg-slate-950 rounded-xl border border-rose-900/60 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">
                    Código de barras no registrado
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No existe ningún insumo con el código / SKU:{' '}
                    <strong className="text-rose-400 font-mono">{lastScannedCode}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleScanNext}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold"
                >
                  Escanear Otro
                </button>

                {onCreateNewProductWithSku && (
                  <button
                    type="button"
                    onClick={() => {
                      if (lastScannedCode) {
                        onCreateNewProductWithSku(lastScannedCode);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-950/50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Nuevo Insumo con este SKU</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={e => setContinuousMode(e.target.checked)}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500/30"
              />
              <span>Modo continuo (escanear sin pausar)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
