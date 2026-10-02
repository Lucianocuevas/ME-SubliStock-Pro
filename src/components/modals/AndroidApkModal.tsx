import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Globe,
  HardDrive,
  FileCode,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [appUrl, setAppUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'package' | 'instructions'>('install');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentUrl = `${window.location.origin}${window.location.pathname}`;
    setAppUrl(currentUrl);

    // Generate high-contrast QR code for Android phone scanning
    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Error generando QR para Android:', err));

    // Listen for beforeinstallprompt event (native Android PWA / WebAPK installation)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle direct Android installation via browser WebAPK engine
  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
      setIsInstalling(false);
    } else {
      // In browsers where the event has not fired yet, show clear instructions
      alert(
        'Para instalar en Android:\n\n1. Abre esta aplicación en Google Chrome o Samsung Internet en tu teléfono.\n2. Toca los 3 puntos superiores (⋮) o el botón "Instalar aplicación".\n3. Selecciona "Instalar" o "Agregar a la pantalla principal".\n\nAndroid creará automáticamente la APK nativa en tu dispositivo.'
      );
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Download complete Android PWA / APK package as ZIP
  const handleDownloadApkPackage = async () => {
    try {
      setIsGeneratingZip(true);
      const zip = new JSZip();

      // Fetch icons and manifest
      const manifestRes = await fetch('./manifest.webmanifest').catch(() => null);
      const manifestText = manifestRes ? await manifestRes.text() : JSON.stringify({
        id: "/",
        name: "SubliStock Pro - Taller de Sublimación",
        short_name: "SubliStock",
        display: "standalone",
        start_url: "./",
        theme_color: "#0f172a",
        background_color: "#020617"
      }, null, 2);

      zip.file('manifest.json', manifestText);
      zip.file('manifest.webmanifest', manifestText);

      // Android Manifest template for Android Studio / Bubblewrap
      const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="app.sublistock.pro"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="SubliStock Pro"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name="app.sublistock.pro.MainActivity"
            android:exported="true"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
      zip.file('android/AndroidManifest.xml', androidManifestXml);

      // TWA (Trusted Web Activity) manifest for Google Play & PWABuilder
      const twaManifestJson = JSON.stringify({
        packageId: "app.sublistock.pro",
        host: new URL(appUrl || 'https://sublistock.app').hostname,
        name: "SubliStock Pro",
        launcherName: "SubliStock",
        themeColor: "#0f172a",
        navigationColor: "#020617",
        backgroundColor: "#020617",
        startUrl: "/",
        iconUrl: `${appUrl}/icon-512.png`,
        maskableIconUrl: `${appUrl}/icon-512.png`,
        appVersionName: "1.0.0",
        appVersionCode: 1,
        shortcuts: [],
        generatorApp: "bubblewrap-cli"
      }, null, 2);
      zip.file('twa-manifest.json', twaManifestJson);

      // Add instruction guide
      const instructions = `========================================================================
SUBLISTOCK PRO - GUÍA DE INSTALACIÓN Y GENERACIÓN DE APK PARA ANDROID
========================================================================

Esta aplicación está construida con tecnología PWA de última generación con soporte
para compilación WebAPK nativa de Android, modo sin conexión y sincronización con Firestore.

MÉTODO 1: INSTALACIÓN INMEDIATA EN ANDROID (RECOMENDADO - 1 TOQUE)
------------------------------------------------------------------------
1. Abre tu navegador móvil (Google Chrome, Samsung Internet, Edge o Brave) en tu teléfono.
2. Ingresa a la URL:
   ${appUrl}
3. Aparecerá un aviso en la parte inferior: "Agregar SubliStock a la pantalla principal"
   o toca el menú de tres puntos (⋮) en la esquina superior derecha y selecciona:
   "Instalar aplicación" o "Agregar a la pantalla de inicio".
4. Android compilará el archivo WebAPK nativo de forma instantánea en tu teléfono:
   - Tendrá su propio ícono en el cajón de aplicaciones.
   - Se ejecutará en pantalla completa sin barra de direcciones de navegador.
   - Funcionará 100% offline para consultar stock, registrar pedidos y escanear códigos de barra.

MÉTODO 2: GENERAR ARCHIVO .APK FIRMADO CON PWABUILDER (1 CLICK)
------------------------------------------------------------------------
1. Ingresa a: https://www.pwabuilder.com/
2. Pega la URL de la aplicación: ${appUrl}
3. Haz click en "Start" y luego en "Package for Stores" -> "Android".
4. PWABuilder generará el archivo .apk listo para instalar en cualquier teléfono
   o publicar en Google Play Store.

MÉTODO 3: COMPILAR APK CON BUBBLEWRAP (GOOGLE CLI OFICIAL)
------------------------------------------------------------------------
Si tienes Node.js y Android SDK en tu PC:
1. Instala Bubblewrap:
   npm i -g @bubblewrap/cli
2. Inicializa el proyecto con el archivo twa-manifest.json adjunto en este ZIP:
   bubblewrap init --manifest=${appUrl}/manifest.webmanifest
3. Compila el APK:
   bubblewrap build
4. El archivo "app-release-signed.apk" estará listo para instalar con "adb install app-release-signed.apk"
   o enviarlo por WhatsApp a tus dispositivos.
========================================================================
`;
      zip.file('INSTRUCCIONES_APK_ANDROID.txt', instructions);

      // Download icons into zip
      try {
        const icon192Blob = await fetch('./icon-192.png').then(r => r.blob());
        zip.file('res/icon-192.png', icon192Blob);
        const icon512Blob = await fetch('./icon-512.png').then(r => r.blob());
        zip.file('res/icon-512.png', icon512Blob);
      } catch (e) {
        console.warn('Could not bundle icon binaries into zip', e);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `SubliStock_Pro_Android_APK_Package_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generando zip de APK:', err);
      alert('Error al generar el paquete. Puedes instalar la aplicación directamente desde Chrome en tu Android.');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleOpenPwaBuilder = () => {
    const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`;
    window.open(pwaBuilderUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Instalación de App / APK para Android
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android & WebAPK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Usa SubliStock Pro en tu celular o tablet como una aplicación nativa instalada
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instalar en Android (WebAPK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('package')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'package'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Paquete / APK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'instructions'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Guía Paso a Paso</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'install' && (
            <div className="space-y-6">
              {/* Primary Card: QR Code & Direct Install */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center bg-slate-950 p-5 rounded-2xl border border-slate-800">
                {/* QR Code Presentation */}
                <div className="flex flex-col items-center text-center space-y-2.5">
                  <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-emerald-500/40">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Código QR de instalación"
                        className="w-44 h-44 block"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                        <QrCode className="w-10 h-10 animate-pulse text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Apunta con la cámara de tu celular</span>
                  </span>
                </div>

                {/* Direct Install Info */}
                <div className="space-y-3.5 text-left">
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white">
                      Instalación Instantánea en tu Dispositivo
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Android detecta automáticamente el manifiesto de la aplicación y la compila como una app nativa en tu teléfono.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ícono nativo en el cajón de aplicaciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Pantalla completa sin barra del navegador</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Lector de código de barras con cámara nativa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Funciona 100% offline y sincroniza con la nube</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleDirectInstall}
                      disabled={isInstalling}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{deferredPrompt ? 'Instalar App en Android Ahora' : 'Cómo Instalar en mi Teléfono'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* URL Sharing */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Enlace directo para abrir en el navegador de tu celular (Chrome / Samsung Internet):
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex-1 truncate">
                    {appUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'package' && (
            <div className="space-y-5">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Descargar Paquete Android PWA & APK Builder</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Descarga el paquete completo con el manifiesto oficial de Android, íconos de alta resolución (192px y 512px), configuración TWA y la guía paso a paso.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadApkPackage}
                    disabled={isGeneratingZip}
                    className="p-4 bg-slate-900 hover:bg-slate-800 border border-cyan-800/80 rounded-xl text-left space-y-2 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <Download className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        .ZIP
                      </span>
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-white block">
                        Descargar Paquete (.zip)
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        Incluye AndroidManifest.xml, íconos PNG y plantillas de compilación
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPwaBuilder}
                    className="p-4 bg-slate-900 hover:bg-slate-800 border border-purple-800/80 rounded-xl text-left space-y-2 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <ExternalLink className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                        PWABuilder
                      </span>
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-white block">
                        Generar APK en PWABuilder (1-Click)
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        Servicio oficial de Microsoft & Google para generar APK listo para descargar
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>Abre el enlace en Google Chrome en tu celular</span>
                </div>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  Escanea el código QR o copia el enlace de la aplicación en el navegador Google Chrome de tu teléfono Android.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>Toca "Instalar Aplicación" o Menú (⋮)</span>
                </div>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  En la parte inferior verás el banner "Instalar SubliStock Pro" o presiona los 3 puntos arriba a la derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla de inicio"</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-700 flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <span>Listo: APK instalada en tu sistema</span>
                </div>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  Android genera el paquete WebAPK automáticamente. Podrás abrirla directamente desde tu pantalla de inicio, sin barras de navegación y con todas las funciones de cámara y escaneo activadas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Versión: <strong className="text-white font-mono">1.0.0 (WebAPK / PWA)</strong>
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
