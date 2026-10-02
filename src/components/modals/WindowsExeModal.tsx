import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Monitor,
  Download,
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Terminal,
  FileCode,
  Sparkles,
  Laptop,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsExeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [appUrl, setAppUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'quick_install' | 'electron'>('download');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentUrl = `${window.location.origin}${window.location.pathname}`;
    setAppUrl(currentUrl);

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

  // Handle direct Windows Desktop PWA installation
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
      alert(
        'Para instalar como Aplicación de Escritorio en Windows:\n\n' +
        '1. En Microsoft Edge o Google Chrome, haz clic en el icono de instalación ⊕ en la barra de direcciones.\n' +
        '2. O ve al menú ⋮ > "Aplicaciones" > "Instalar SubliStock Pro".\n' +
        '3. Windows creará un ejecutable nativo en tu Menú Inicio y en tu Escritorio.'
      );
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Generate complete Windows EXE package
  const handleDownloadWindowsPackage = async () => {
    try {
      setIsGeneratingZip(true);
      const zip = new JSZip();
      const targetUrl = appUrl || window.location.href;

      // 1. SubliStockPro.bat - Standalone Windows 1-click launcher
      const launcherBat = `@echo off
chcp 65001 > nul
title SubliStock Pro - Taller de Sublimacion
echo ========================================================
echo       SUBLISTOCK PRO - APLICACION DE ESCRITORIO
echo ========================================================
echo Iniciando SubliStock Pro en modo aplicacion nativa...
echo.

set APP_URL=${targetUrl}

:: Comprobar si Microsoft Edge existe (incluido en todo Windows 10 y 11)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1280,820 --start-maximized
    exit
)
if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1280,820 --start-maximized
    exit
)

:: Comprobar si Google Chrome existe
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1280,820 --start-maximized
    exit
)
if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1280,820 --start-maximized
    exit
)

:: Fallback navegador predeterminado
start "" "%APP_URL%"
exit
`;
      zip.file('SubliStockPro.bat', launcherBat);

      // 2. Compilar_SubliStockPro_EXE.bat - Compiles authentic SubliStockPro.exe using built-in Microsoft csc.exe compiler
      const compileBat = `@echo off
chcp 65001 > nul
title Compilador Nativo de SubliStockPro.exe para Windows
echo ===================================================================
echo     COMPILADOR DE EJECUTABLE NATIVO: SubliStockPro.exe
echo ===================================================================
echo.
echo Buscando el compilador de Microsoft .NET Framework (csc.exe)...

set CSC_PATH=""
if exist "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set CSC_PATH="C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set CSC_PATH="C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if %CSC_PATH%=="" (
    echo [AVISO] No se encontro csc.exe. Puedes ejecutar directamente SubliStockPro.bat
    pause
    exit /b 1
)

echo Compilando codigo C# en ejecutable nativo SubliStockPro.exe...
%CSC_PATH% /target:winexe /out:SubliStockPro.exe /optimize+ SubliStockPro.cs

if exist SubliStockPro.exe (
    echo.
    echo ===================================================================
    echo  [EXITO] Se ha creado con exito el archivo: SubliStockPro.exe
    echo ===================================================================
    echo.
    echo Ahora puedes hacer doble clic en "SubliStockPro.exe" para abrir la
    echo aplicacion directamente en tu escritorio de Windows.
    echo.
    echo Deseas ejecutar SubliStockPro.exe ahora mismo? (S/N)
    set /p RESP="Opcion: "
    if /i "%RESP%"=="S" (
        start "" SubliStockPro.exe
    )
) else (
    echo [ERROR] Hubo un problema durante la compilacion.
    echo Puedes utilizar directamente SubliStockPro.bat para abrir la app.
    pause
)
`;
      zip.file('Compilar_SubliStockPro_EXE.bat', compileBat);

      // 3. SubliStockPro.cs - C# source code for native Windows executable
      const csharpSource = `using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace SubliStockProDesktop
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            string url = "${targetUrl}";
            
            // 1. Intento con Microsoft Edge en modo App nativa
            string edgeX86 = @"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
            string edgeX64 = @"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe";
            string chromeX64 = @"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
            string chromeX86 = @"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

            string targetExe = null;
            if (File.Exists(edgeX86)) targetExe = edgeX86;
            else if (File.Exists(edgeX64)) targetExe = edgeX64;
            else if (File.Exists(chromeX64)) targetExe = chromeX64;
            else if (File.Exists(chromeX86)) targetExe = chromeX86;

            if (targetExe != null)
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = targetExe;
                psi.Arguments = string.Format("--app=\\"{0}\\" --window-size=1280,820 --start-maximized", url);
                psi.UseShellExecute = false;
                Process.Start(psi);
            }
            else
            {
                // Fallback navegador default
                Process.Start(url);
            }
        }
    }
}
`;
      zip.file('SubliStockPro.cs', csharpSource);

      // 4. Shortcut creator script (VBScript + Batch)
      const shortcutVbs = `' Crear acceso directo en el Escritorio
Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
strCurrentDir = CreateObject("Scripting.FileSystemObject").GetAbsolutePathName(".")

Set oShellLink = WshShell.CreateShortcut(strDesktop & "\\SubliStock Pro.lnk")
If CreateObject("Scripting.FileSystemObject").FileExists(strCurrentDir & "\\SubliStockPro.exe") Then
    oShellLink.TargetPath = strCurrentDir & "\\SubliStockPro.exe"
Else
    oShellLink.TargetPath = strCurrentDir & "\\SubliStockPro.bat"
End If
oShellLink.WindowStyle = 1
oShellLink.WorkingDirectory = strCurrentDir
oShellLink.Description = "SubliStock Pro - Taller de Sublimacion"
oShellLink.Save

WScript.Echo "Acceso directo creado con exito en tu Escritorio de Windows."
`;
      zip.file('Crear_Acceso_Directo.vbs', shortcutVbs);

      const installShortcutBat = `@echo off
cscript //nologo Crear_Acceso_Directo.vbs
pause
`;
      zip.file('Crear_Acceso_Directo_Escritorio.bat', installShortcutBat);

      // 5. Electron Project for advanced packaging
      const electronPackageJson = JSON.stringify({
        name: "sublistock-pro-desktop",
        version: "1.0.0",
        description: "SubliStock Pro Desktop - Sistema de Gestion de Taller de Sublimacion",
        main: "main.cjs",
        scripts: {
          "start": "electron .",
          "dist": "electron-builder --win portable"
        },
        author: "SubliStock Pro",
        license: "Apache-2.0",
        devDependencies: {
          "electron": "^29.1.0",
          "electron-builder": "^24.13.3"
        },
        build: {
          appId: "app.sublistock.pro",
          productName: "SubliStock Pro",
          win: {
            target: ["portable", "nsis"],
            icon: "icon.ico"
          }
        }
      }, null, 2);
      zip.file('electron/package.json', electronPackageJson);

      const electronMainJs = `const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'SubliStock Pro - Taller de Sublimación',
    backgroundColor: '#020617',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Cargar URL de la aplicación
  mainWindow.loadURL('${targetUrl}');

  // Abrir enlaces externos en el navegador predeterminado
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;
      zip.file('electron/main.cjs', electronMainJs);

      // 6. Complete Readme / Guide in Spanish
      const instructions = `======================================================================
SUBLISTOCK PRO - GUÍA DE EJECUCIÓN E INSTALACIÓN PARA WINDOWS (.EXE)
======================================================================

¡Bienvenido! Este paquete contiene todo lo necesario para ejecutar
SubliStock Pro como una aplicación de escritorio nativa en Windows 10 y 11.

Tienes 3 métodos fáciles para usar SubliStock Pro en tu PC:

----------------------------------------------------------------------
MÉTODO 1: GENERAR SubliStockPro.exe NATIVO EN 1 CLIC (RECOMENDADO)
----------------------------------------------------------------------
1. Haz doble clic en el archivo "Compilar_SubliStockPro_EXE.bat".
2. El script detectará el compilador oficial de Microsoft (.NET csc.exe)
   que ya viene preinstalado en todas las computadoras Windows.
3. En 2 segundos generará el archivo binario "SubliStockPro.exe".
4. ¡Listo! Ya tienes tu ejecutable nativo "SubliStockPro.exe" listo para
   abrir en cualquier momento con doble clic.
5. Puedes hacer doble clic en "Crear_Acceso_Directo_Escritorio.bat" para
   colocar un icono directo en tu Escritorio de Windows.

----------------------------------------------------------------------
MÉTODO 2: EJECUCIÓN INMEDIATA SIN COMPILAR
----------------------------------------------------------------------
1. Haz doble clic en "SubliStockPro.bat".
2. La aplicación se abrirá instantáneamente en modo ventana independiente
   de escritorio (sin barras de navegador ni pestañas).

----------------------------------------------------------------------
MÉTODO 3: PROYECTO ELECTRON (AVANZADO PARA DESARROLLADORES)
----------------------------------------------------------------------
Si deseas compilar un instalador Setup.exe tradicional con Electron:
1. Abre una terminal en la carpeta "electron".
2. Ejecuta:
   npm install
   npm run dist
3. En la carpeta "dist" tendrás el archivo instalador "SubliStock Pro Setup.exe".

----------------------------------------------------------------------
VENTAJAS DE LA VERSIÓN DE ESCRITORIO
----------------------------------------------------------------------
✓ Ventana completa dedicada al taller de sublimación.
✓ Cuentas corrientes, presupuestos PDF y catálogo de insumos 100% operativos.
✓ Sincronización automática en tiempo real con la nube Firestore.
✓ Modo sin conexión / local persistente.
`;
      zip.file('LEEME_INSTALACION_EXE_WINDOWS.txt', instructions);

      // Generate zip file and download
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `SubliStock_Pro_Windows_Desktop_EXE_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      setIsGeneratingZip(false);
    } catch (err) {
      console.error('Error generando paquete de Windows:', err);
      alert('Error al generar el paquete. Puedes utilizar el acceso directo del navegador.');
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Aplicación de Escritorio para Windows (.EXE)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Windows 10 / 11
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ejecutable nativo, acceso directo de escritorio y modo aplicación independiente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'download'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Paquete EXE (.ZIP)</span>
          </button>
          <button
            onClick={() => setActiveTab('quick_install')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'quick_install'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Instalación Directa (1 Clic)</span>
          </button>
          <button
            onClick={() => setActiveTab('electron')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'electron'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Compilación Electron / C#</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* TAB 1: Download EXE Package */}
          {activeTab === 'download' && (
            <div className="space-y-5">
              {/* Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-800/60 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-600 text-white shrink-0 mt-0.5">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Paquete Completo SubliStockPro.exe para Windows
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Descarga el archivo ZIP listo para descomprimir. Incluye el compilador nativo de Windows (genera tu archivo <strong className="text-cyan-300 font-mono">SubliStockPro.exe</strong> en 2 segundos sin instalar programas adicionales) y el lanzador directo de 1 clic con icono de escritorio.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDownloadWindowsPackage}
                    disabled={isGeneratingZip}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingZip ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Empaquetando Archivos EXE...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Descargar Paquete Windows Desktop (.ZIP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* What is included */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Archivos Incluidos en el Paquete</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 font-mono text-cyan-300 font-semibold">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Compilar_SubliStockPro_EXE.bat</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Compila <strong className="text-slate-200">SubliStockPro.exe</strong> nativo usando el compilador de Microsoft .NET integrado en Windows.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 font-mono text-emerald-300 font-semibold">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>SubliStockPro.bat</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Lanzador inmediato que abre el taller en su propia ventana maximizada sin barras de navegador.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 font-mono text-amber-300 font-semibold">
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Crear_Acceso_Directo.bat</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Coloca el acceso directo de SubliStock Pro con su logo en tu Escritorio de Windows.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 font-mono text-purple-300 font-semibold">
                      <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>electron/</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Código fuente Electron completo para generar un instalador <strong className="text-slate-200">Setup.exe</strong> profesional.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pasos para ejecutar en tu PC de Windows</span>
                </h4>
                <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside pl-1">
                  <li>Haz clic en el botón superior para descargar el archivo ZIP.</li>
                  <li>Descomprime la carpeta en tu computadora (ej: en <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300">C:\SubliStockPro</code> o en el Escritorio).</li>
                  <li>Haz doble clic en <strong className="text-white">Compilar_SubliStockPro_EXE.bat</strong> para crear tu archivo <strong className="text-cyan-400 font-mono">SubliStockPro.exe</strong>.</li>
                  <li>¡Listo! Ejecuta <strong className="text-white">SubliStockPro.exe</strong> cada vez que abras tu taller de sublimación.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: Quick Direct Install (PWA Desktop) */}
          {activeTab === 'quick_install' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400 shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Instalación de Aplicación Nativa en Windows (PWA Desktop)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tanto Microsoft Edge como Google Chrome permiten instalar esta web como un programa nativo de Windows con su propio proceso en el Administrador de Tareas.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={handleDirectInstall}
                    disabled={isInstalling}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-950/50 transition-colors cursor-pointer"
                  >
                    <Laptop className="w-4 h-4" />
                    <span>{deferredPrompt ? 'Instalar SubliStock Pro en Windows Ahora' : 'Ver Cómo Instalar en 1 Clic'}</span>
                  </button>
                </div>

                {installSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>¡Instalación completada! Revisa tu Menú Inicio y Barra de Tareas de Windows.</span>
                  </div>
                )}
              </div>

              {/* Step by Step Visual Guide */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Cómo instalar manualmente desde tu navegador de Windows:</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white">En la barra de direcciones:</strong>
                      <p className="text-slate-400 mt-0.5">
                        Busca el icono de computadora con flecha hacia abajo o el icono <strong>⊕ (Instalar aplicación)</strong> situado en el extremo derecho de la barra de direcciones de Edge o Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white">O a través del menú del navegador:</strong>
                      <p className="text-slate-400 mt-0.5">
                        Haz clic en los tres puntos <strong>(⋮)</strong> arriba a la derecha &gt; <strong>"Aplicaciones"</strong> &gt; <strong>"Instalar SubliStock Pro"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <div>
                      <strong className="text-white">Integración en Windows:</strong>
                      <p className="text-slate-400 mt-0.5">
                        Al hacer clic en Instalar, Windows creará el acceso directo en el Menú Inicio y en la Barra de Tareas. Se ejecutará en su propia ventana aislada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Electron & Advanced Compiling */}
          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>Compilar Ejecutable Instalador con Electron</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Si deseas crear un instalador tradicional <strong className="text-white font-mono">SubliStock-Pro-Setup.exe</strong> con instalador NSIS o versión Portable independiente, puedes usar los archivos preconfigurados de la carpeta <strong className="text-cyan-300 font-mono">electron/</strong> incluida en el ZIP.
                </p>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 space-y-1.5">
                  <div className="text-slate-500"># 1. Ingresar a la carpeta electron</div>
                  <div>cd electron</div>
                  <div className="text-slate-500 pt-1"># 2. Instalar dependencias</div>
                  <div>npm install</div>
                  <div className="text-slate-500 pt-1"># 3. Compilar instalador .EXE para Windows</div>
                  <div>npm run dist</div>
                </div>

                <p className="text-[11px] text-slate-400">
                  El proceso creará la carpeta <code className="text-cyan-300 font-mono">dist/</code> con el archivo instalador <code className="text-cyan-300 font-mono">SubliStock Pro-1.0.0.exe</code> listo para distribuir e instalar en cualquier equipo con Windows.
                </p>
              </div>

              {/* Direct Link Copy */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-medium text-slate-400">Enlace directo a la aplicación:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Compatible con Windows 11, Windows 10, Windows 8 y 7</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
