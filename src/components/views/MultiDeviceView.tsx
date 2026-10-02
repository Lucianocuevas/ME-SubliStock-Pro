import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Laptop,
  Apple,
  Globe,
  Database,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
  Info,
  Download,
  Monitor
} from 'lucide-react';
import { FirestoreService, FirestoreSyncInfo } from '../../services/firestoreService';
import firebaseConfig from '../../../firebase-applet-config.json';
import { AndroidApkModal } from '../modals/AndroidApkModal';
import { WindowsExeModal } from '../modals/WindowsExeModal';

export const MultiDeviceView: React.FC = () => {
  const [syncInfo, setSyncInfo] = useState<FirestoreSyncInfo>(FirestoreService.getSyncInfo());
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ connected: boolean; latencyMs?: number; error?: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isWindowsExeModalOpen, setIsWindowsExeModalOpen] = useState(false);

  useEffect(() => {
    // Current application URL for accessing from phone or other PCs
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    const fullUrl = `${currentOrigin}${currentPath}`;
    setAppUrl(fullUrl);

    const handleSyncUpdate = (e: any) => {
      if (e.detail) {
        setSyncInfo(e.detail);
      } else {
        setSyncInfo(FirestoreService.getSyncInfo());
      }
    };

    window.addEventListener('sublistock_firestore_sync_updated', handleSyncUpdate);
    return () => {
      window.removeEventListener('sublistock_firestore_sync_updated', handleSyncUpdate);
    };
  }, []);

  // Generate QR Code locally whenever appUrl updates
  useEffect(() => {
    const targetUrl = appUrl || window.location.href;
    if (!targetUrl) return;

    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000', // High contrast pure black for instant mobile camera detection
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrCodeDataUrl(url);
        setQrError(null);
      })
      .catch(err => {
        console.error('Error generando código QR:', err);
        setQrError('No se pudo generar el código QR.');
      });
  }, [appUrl]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = 'sublistock-acceso-qr.png';
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionResult(null);
    const res = await FirestoreService.testCloudConnection();
    setConnectionResult(res);
    setIsTesting(false);
  };

  const handleUploadToCloud = async () => {
    setIsUploading(true);
    await FirestoreService.uploadAllToCloud();
    setIsUploading(false);
  };

  const handleDownloadFromCloud = async () => {
    setIsDownloading(true);
    const res = await FirestoreService.downloadAllFromCloud();
    setIsDownloading(false);
    if (res.success) {
      alert('¡Datos descargados de la nube con éxito! Toda la aplicación está actualizada.');
    } else {
      alert(`Error al descargar: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/60 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-cyan-400" />
            <span>Acceso Multi-Dispositivo: PC de Escritorio, Android & iOS</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Usa la misma base de datos en la nube (Firebase Firestore) para que los pedidos, insumos y cobranzas se sincronicen en vivo en todos tus dispositivos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleUploadToCloud}
            disabled={isUploading}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isUploading ? 'Subiendo...' : 'Subir a la Nube'}</span>
          </button>

          <button
            onClick={handleDownloadFromCloud}
            disabled={isDownloading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <CloudDownload className="w-4 h-4 text-emerald-400" />
            <span>{isDownloading ? 'Descargando...' : 'Descargar de Nube'}</span>
          </button>
        </div>
      </div>

      {/* Quick Download Action Cards for Android & Windows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: App Android */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-700/60 hover:border-emerald-500 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-lg transition-all">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-600/70 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  App Android (APK & WebAPK)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                  Celulares & Tablets
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Instala la aplicación en tu teléfono Android en 1 solo clic o descarga el paquete APK para usar la cámara y escanear productos en el taller.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Compatible con Samsung, Xiaomi, Motorola y más
            </span>
            <button
              onClick={() => setIsApkModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/60 cursor-pointer shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              <span>Abrir App Android / APK</span>
            </button>
          </div>
        </div>

        {/* Card 2: App Windows */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-700/60 hover:border-cyan-500 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-lg transition-all">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-600/70 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  App Windows (.EXE & Desktop)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  Windows 10 / 11
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ejecutable nativo SubliStockPro.exe y lanzador de escritorio sin barras de navegador. Incluye acceso directo para abrir el taller con 1 clic.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Genera SubliStockPro.exe nativo en 2 segundos
            </span>
            <button
              onClick={() => setIsWindowsExeModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-950/60 cursor-pointer shrink-0"
            >
              <Monitor className="w-4 h-4" />
              <span>Descargar App Windows (.EXE)</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code and Mobile Access Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="p-4 bg-white rounded-2xl border-2 border-cyan-500/40 shadow-xl shadow-cyan-950/20 flex items-center justify-center min-w-[210px] min-h-[210px] transition-all hover:scale-[1.02]">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Código QR para abrir en celular"
                className="w-48 h-48 rounded-lg block shadow-xs"
              />
            ) : qrError ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-rose-500 p-2 text-center text-xs">
                <QrCode className="w-10 h-10 mb-2 opacity-50" />
                <span>{qrError}</span>
              </div>
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 mb-2" />
                <span className="text-xs font-semibold text-slate-600">Generando QR...</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span>Escanea con tu Celular</span>
            </span>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Apunta la cámara de tu teléfono móvil (Android o iPhone) para abrir la aplicación instantáneamente.
            </p>
          </div>

          {/* Action buttons under QR */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={handleDownloadQr}
              disabled={!qrCodeDataUrl}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Descargar imagen del código QR en PNG"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Descargar QR (PNG)</span>
            </button>

            <button
              onClick={() => setIsApkModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/40 cursor-pointer"
              title="Descargar paquete APK para Android o instalar como aplicación nativa"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar / Descargar APK</span>
            </button>

            <button
              onClick={() => setIsWindowsExeModalOpen(true)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950/40 cursor-pointer"
              title="Descargar instalador o ejecutable para Windows (.exe)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>App Windows (.EXE)</span>
            </button>
          </div>

          {/* Copy URL */}
          <div className="w-full pt-1">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1.5 pl-3">
              <span className="text-[11px] font-mono text-slate-300 truncate flex-1">{appUrl}</span>
              <button
                onClick={handleCopyUrl}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                title="Copiar enlace"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Database Status & Sync Info */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Base de Datos Central en la Nube (Google Cloud Firestore)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: <span className="font-mono text-cyan-300">{firebaseConfig.firestoreDatabaseId}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
                </button>
              </div>
            </div>

            {/* Test result message */}
            {connectionResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  connectionResult.connected
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {connectionResult.connected
                      ? `¡Conexión exitosa a la base de datos Firestore! Latencia: ${connectionResult.latencyMs}ms`
                      : `Error al conectar: ${connectionResult.error}`}
                  </span>
                </div>
              </div>
            )}

            {/* Metrics grid of synced collections */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Productos / Stock</span>
                <span className="text-lg font-black text-white">{syncInfo.counts.products}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Clientes & Cartera</span>
                <span className="text-lg font-black text-cyan-400">{syncInfo.counts.customers}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pedidos Producción</span>
                <span className="text-lg font-black text-orange-400">{syncInfo.counts.orders}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cuentas Corrientes</span>
                <span className="text-lg font-black text-emerald-400">{syncInfo.counts.accountMovements}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Sincronización Automática en Segundo Plano:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Activa en Tiempo Real
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cualquier cambio que realices en tu PC de escritorio (nuevo pedido, pago recibido, actualización de stock) o en tu teléfono móvil se guarda en Firestore y se sincroniza automáticamente.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
            <span>Última sincronización: {syncInfo.lastSyncAt ? new Date(syncInfo.lastSyncAt).toLocaleString('es-AR') : 'Recién inicializado'}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Nube Conectada</span>
            </span>
          </div>
        </div>
      </div>

      {/* Step by Step Guides for Each Platform */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Android Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 bg-emerald-950 border border-emerald-800/80 rounded-lg text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">En Android (Samsung, Xiaomi, Motorola...)</h3>
              <p className="text-[11px] text-slate-400">Navegador Google Chrome</p>
            </div>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <span>Abre el enlace de la app en <strong>Google Chrome</strong> en tu celular.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <span>Toca el menú de <strong>tres puntos ⋮</strong> arriba a la derecha.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <span>
                Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                ✓
              </span>
              <span className="text-slate-400">
                ¡Listo! Se creará el icono de <strong>SubliStock Pro</strong> en tus aplicaciones, abriendo en pantalla completa como app nativa.
              </span>
            </li>
          </ol>
        </div>

        {/* iOS / iPhone Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 bg-blue-950 border border-blue-800/80 rounded-lg text-blue-400">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">En iOS (iPhone & iPad)</h3>
              <p className="text-[11px] text-slate-400">Navegador Safari de Apple</p>
            </div>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <span>Abre el enlace de la app en <strong>Safari</strong> (navegador nativo de iOS).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <span>
                Toca el botón <strong>Compartir ⎋</strong> (cuadrado con flecha hacia arriba en la barra inferior).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <span>
                Baja en el menú y selecciona <strong>"Agregar a inicio" (Add to Home Screen)</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                ✓
              </span>
              <span className="text-slate-400">
                Toca "Agregar" arriba a la derecha. Ahora tienes la app instalada en la pantalla de inicio de tu iPhone sin barras de navegador.
              </span>
            </li>
          </ol>
        </div>

        {/* Desktop PC Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 bg-purple-950 border border-purple-800/80 rounded-lg text-purple-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">En tu PC de Escritorio (Windows / Mac)</h3>
              <p className="text-[11px] text-slate-400">Chrome, Edge o Brave</p>
            </div>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <span>Abre el sistema en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <span>
                Haz clic en el icono <strong>"Instalar SubliStock Pro" ⊕</strong> que aparece a la derecha en la barra de direcciones.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <span>
                (O menú ⋮ &gt; <strong>"Guardar y compartir"</strong> &gt; <strong>"Instalar aplicación"</strong>).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                ✓
              </span>
              <span className="text-slate-400">
                La aplicación se abrirá en su propia ventana sin pestañas y quedará anclada en tu barra de tareas como cualquier programa de Windows/Mac.
              </span>
            </li>
          </ol>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setIsWindowsExeModalOpen(true)}
              className="w-full px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/50 cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Descargar SubliStockPro.exe para Windows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Android APK & WebAPK Modal */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Windows EXE Desktop Modal */}
      <WindowsExeModal
        isOpen={isWindowsExeModalOpen}
        onClose={() => setIsWindowsExeModalOpen(false)}
      />
    </div>
  );
};
