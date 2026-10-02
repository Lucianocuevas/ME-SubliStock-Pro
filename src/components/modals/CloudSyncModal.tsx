import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Database,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Smartphone,
  HardDrive,
  ShieldCheck,
  Download,
  Upload,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { FirestoreService, FirestoreSyncInfo } from '../../services/firestoreService';
import { StorageService } from '../../services/storageService';
import firebaseConfig from '../../../firebase-applet-config.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed?: () => void;
}

export const CloudSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onDataRefreshed
}) => {
  const [syncInfo, setSyncInfo] = useState<FirestoreSyncInfo>(FirestoreService.getSyncInfo());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; latencyMs: number; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localSummary, setLocalSummary] = useState(StorageService.getLocalDatabaseSummary());
  const [mobileQrDataUrl, setMobileQrDataUrl] = useState<string>('');
  const [showMobileQr, setShowMobileQr] = useState<boolean>(false);
  const [copiedMobileUrl, setCopiedMobileUrl] = useState<boolean>(false);

  // Generate QR code for mobile connection whenever modal is opened
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const currentUrl = `${window.location.origin}${window.location.pathname}`;
    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setMobileQrDataUrl(url))
      .catch(err => console.error('Error generando QR de celular:', err));
  }, [isOpen]);

  // Upload Local Data to Cloud
  const handleUpload = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMessage('Sin conexión a internet. Los datos están 100% resguardados en tu base de datos local.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setIsUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await FirestoreService.uploadAllToCloud();
      if (res.success) {
        setSuccessMessage('¡Datos subidos exitosamente a la nube de Firestore!');
        setLocalSummary(StorageService.getLocalDatabaseSummary());
        if (onDataRefreshed) onDataRefreshed();
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al subir los datos.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al conectar con la nube.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  }, [onDataRefreshed]);

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncInfo.autoSyncEnabled) {
        handleUpload();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSyncUpdate = (e: any) => {
      if (e.detail) {
        setSyncInfo(e.detail);
      } else {
        setSyncInfo(FirestoreService.getSyncInfo());
      }
      setLocalSummary(StorageService.getLocalDatabaseSummary());
    };

    window.addEventListener('sublistock_firestore_sync_updated', handleSyncUpdate);
    window.addEventListener('sublistock_pending_changes_updated', handleSyncUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sublistock_firestore_sync_updated', handleSyncUpdate);
      window.removeEventListener('sublistock_pending_changes_updated', handleSyncUpdate);
    };
  }, [syncInfo.autoSyncEnabled, handleUpload]);

  useEffect(() => {
    if (isOpen) {
      setSyncInfo(FirestoreService.getSyncInfo());
      setLocalSummary(StorageService.getLocalDatabaseSummary());
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    }
  }, [isOpen]);

  // Test Cloud Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await FirestoreService.testCloudConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ connected: false, latencyMs: 0, error: e?.message || 'Error de conexión' });
    } finally {
      setIsTesting(false);
    }
  };

  // Download Cloud Data to Local
  const handleDownload = async () => {
    if (!isOnline) {
      setErrorMessage('Sin conexión a internet para descargar datos.');
      return;
    }

    if (!confirm('¿Descargar y sincronizar los datos de la nube en tu base de datos local? Esto actualizará tu almacenamiento local con la información remota.')) {
      return;
    }

    setIsDownloading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await FirestoreService.downloadAllFromCloud();
      if (res.success) {
        setSuccessMessage('¡Datos descargados y sincronizados en tu base local con éxito!');
        setLocalSummary(StorageService.getLocalDatabaseSummary());
        if (onDataRefreshed) onDataRefreshed();
      } else {
        setErrorMessage(res.error || 'Error al descargar datos de la nube.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de descarga.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Toggle Auto-sync
  const handleToggleAutoSync = () => {
    const next = !syncInfo.autoSyncEnabled;
    FirestoreService.setAutoSyncEnabled(next);
    setSyncInfo(prev => ({ ...prev, autoSyncEnabled: next }));
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const json = StorageService.exportFullBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SubliStock_LocalDB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importFullBackupJSON(content);
        if (success) {
          setSuccessMessage('¡Copia de seguridad local importada correctamente!');
          setLocalSummary(StorageService.getLocalDatabaseSummary());
          if (onDataRefreshed) onDataRefreshed();
        } else {
          setErrorMessage('Archivo de respaldo no válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const formattedLastSync = syncInfo.lastSyncAt
    ? new Date(syncInfo.lastSyncAt).toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Aún no sincronizado';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Base de Datos Local (Offline) & Sincronización en la Nube
                </h3>
                {isOnline ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <WifiOff className="w-3 h-3" /> Offline (Local)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Usa el taller 100% offline sin conexión a internet y sube tus datos a la nube cuando lo desees.
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

        {/* Alerts / Feedback */}
        {successMessage && (
          <div className="px-6 py-2.5 bg-emerald-950/90 border-b border-emerald-600/70 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-950/90 border-b border-rose-600/70 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Local DB Status */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Base Local
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  Activa
                </span>
              </div>
              <div className="text-lg font-black text-white">
                {localSummary.products + localSummary.orders + localSummary.customers} registros
              </div>
              <p className="text-[11px] text-slate-400">
                Guardado en la memoria segura de tu equipo.
              </p>
            </div>

            {/* Card 2: Pending Sync Status */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" /> Pendientes
                </span>
                {localSummary.pendingChanges > 0 ? (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 animate-pulse">
                    Por subir
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    Al día
                  </span>
                )}
              </div>
              <div className="text-lg font-black text-amber-400">
                {localSummary.pendingChanges} cambios
              </div>
              <p className="text-[11px] text-slate-400">
                {localSummary.pendingChanges === 0
                  ? 'Todos tus cambios locales están sincronizados.'
                  : 'Modificaciones hechas localmente listas para subir.'}
              </p>
            </div>

            {/* Card 3: Cloud Last Sync */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-purple-400" /> Nube Firestore
                </span>
                <span className="text-[10px] text-purple-300 font-mono">
                  {firebaseConfig.projectId ? 'Conectado' : 'Configurado'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 truncate pt-1">
                {formattedLastSync}
              </div>
              <p className="text-[11px] text-slate-400">
                Último respaldo en la nube de Google Firebase.
              </p>
            </div>

            {/* Card 4: Mobile Access QR */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Acceso Celular
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                    QR Móvil
                  </span>
                </div>
                <div className="text-xs font-bold text-white pt-1">
                  Abrir en Teléfono
                </div>
                <p className="text-[11px] text-slate-400">
                  Escanea para sincronizar y usar en vivo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileQr(!showMobileQr)}
                className="w-full mt-2 py-1 px-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showMobileQr ? 'Ocultar QR' : 'Ver Código QR'}</span>
              </button>
            </div>
          </div>

          {/* EXPANDABLE MOBILE QR CODE BOX */}
          {showMobileQr && (
            <div className="bg-slate-950 p-5 rounded-2xl border-2 border-cyan-500/40 shadow-xl flex flex-col md:flex-row items-center gap-5 animate-in fade-in">
              <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-700 shrink-0">
                {mobileQrDataUrl ? (
                  <img
                    src={mobileQrDataUrl}
                    alt="Código QR para abrir en celular"
                    className="w-40 h-40 block"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-500">
                    <QrCode className="w-10 h-10 animate-pulse text-cyan-600" />
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center md:text-left">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Conectar Celular o Tablet al Taller</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Apunta la cámara de tu smartphone a este código QR para abrir el sistema. Toda la información registrada en tu celular se sincronizará automáticamente con tu computadora mediante Firestore.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={() => {
                      const currentUrl = `${window.location.origin}${window.location.pathname}`;
                      navigator.clipboard.writeText(currentUrl);
                      setCopiedMobileUrl(true);
                      setTimeout(() => setCopiedMobileUrl(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedMobileUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMobileUrl ? '¡Enlace copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  {mobileQrDataUrl && (
                    <a
                      href={mobileQrDataUrl}
                      download="sublistock-qr-acceso.png"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Descargar QR (PNG)</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MAIN ACTIONS: UPLOAD & DOWNLOAD BUTTONS */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-emerald-400" />
                  Subida & Descarga con la Nube
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Respaldar toda la base de datos local en Firestore o descargarla a este dispositivo
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                  testResult.connected
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                }`}
              >
                <span>
                  {testResult.connected
                    ? `✓ Conexión con Firestore exitosa (${testResult.latencyMs} ms de latencia)`
                    : `✗ No se pudo conectar: ${testResult.error}`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Main Upload Button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all text-center"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Subiendo datos a la nube...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CloudUpload className="w-5 h-5" />
                      <span className="text-sm">Subir Datos a la Nube Ahora</span>
                    </div>
                    <span className="text-[11px] font-normal text-emerald-100">
                      Sube productos, pedidos, cuentas y clientes a Firestore
                    </span>
                  </>
                )}
              </button>

              {/* Secondary Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                    <span>Descargando desde la nube...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CloudDownload className="w-5 h-5 text-cyan-400" />
                      <span className="text-sm">Descargar / Sincronizar Nube</span>
                    </div>
                    <span className="text-[11px] font-normal text-slate-400">
                      Baja la base de datos de la nube a esta máquina local
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Auto Sync Toggle */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Auto-subida al detectar internet:</span>
                <span className="text-[11px] text-slate-400">
                  Si estás trabajando offline, sube automáticamente los cambios al reconectar.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  syncInfo.autoSyncEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    syncInfo.autoSyncEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* LOCAL DATABASE SUMMARY TABLE */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Contenido de la Base de Datos Local
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Productos</span>
                <strong className="text-white text-sm">{localSummary.products}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Clientes</span>
                <strong className="text-white text-sm">{localSummary.customers}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Pedidos</span>
                <strong className="text-white text-sm">{localSummary.orders}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Compras Proveedor</span>
                <strong className="text-white text-sm">{localSummary.purchases}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Ventas Mostrador</span>
                <strong className="text-white text-sm">{localSummary.dailySales}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Presupuestos</span>
                <strong className="text-white text-sm">{localSummary.quotations}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Cuentas Corrientes</span>
                <strong className="text-white text-sm">{localSummary.accountMovements}</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">Proveedores</span>
                <strong className="text-white text-sm">{localSummary.suppliers}</strong>
              </div>
            </div>

            {/* Offline Local Backups (No internet required) */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-slate-400">
                Respaldo en archivo local (sin internet):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Copia JSON</span>
                </button>

                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar Copia</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Base de datos Firestore: <strong className="text-white font-mono">{syncInfo.databaseId}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
