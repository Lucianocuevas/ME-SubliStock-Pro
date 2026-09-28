import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Building,
  DollarSign
} from 'lucide-react';
import { StorageService, AppSettings } from '../../services/storageService';

interface Props {
  onRefreshData: () => void;
}

export const SettingsView: React.FC<Props> = ({ onRefreshData }) => {
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportFullBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SubliStock_CopiaSeguridad_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importFullBackupJSON(content);
        if (success) {
          alert('¡Copia de seguridad restaurada con éxito!');
          onRefreshData();
        } else {
          alert('Error al leer el archivo de copia de seguridad. Verifica el formato JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('¿Restaurar los datos de demostración iniciales? Esto cargará los ejemplos de tazas de cerámica, polímero, remeras spum, modal, gorras, llaveros y proveedores iniciales.')) {
      StorageService.resetToDemoData();
      setSettings(StorageService.getSettings());
      onRefreshData();
      alert('Datos de demostración restablecidos correctamente.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            <span>Configuración del Taller y Copias de Seguridad</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza el nombre de tu imprenta/taller, moneda de trabajo y resguardo de datos
          </p>
        </div>
      </div>

      {/* Workshop Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-cyan-400" />
          <span>Datos del Taller / Negocio</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nombre del Taller / Marca
            </label>
            <input
              type="text"
              value={settings.workshopName}
              onChange={e => setSettings({ ...settings, workshopName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Símbolo de Moneda
            </label>
            <input
              type="text"
              value={settings.currencySymbol}
              onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Teléfono / WhatsApp de Contacto
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={e => setSettings({ ...settings, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Dirección del Taller
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              CUIT / Identificación Fiscal
            </label>
            <input
              type="text"
              value={settings.taxId}
              onChange={e => setSettings({ ...settings, taxId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Logo and Membrete Presupuesto */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider block">
            Logo & Membrete para Presupuestos Formales (PDF)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subir Logo de la Empresa (PNG, JPG o SVG)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSettings({ ...settings, logoUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, logoUrl: '' })}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Quitar logo
                  </button>
                )}
              </div>
            </div>

            {settings.logoUrl ? (
              <div className="p-2 bg-white rounded-lg border border-slate-300 flex items-center justify-center max-h-16">
                <img src={settings.logoUrl} alt="Logo Empresa" className="max-h-12 object-contain" />
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic flex items-center">
                Sin logo cargado. Se utilizará el ícono corporativo de SubliStock en el membrete.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Datos Bancarios (CBU / Alias / Banco)
              </label>
              <input
                type="text"
                value={settings.bankDetails || ''}
                onChange={e => setSettings({ ...settings, bankDetails: e.target.value })}
                placeholder="Banco • CBU • Alias"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Página Web / Redes
              </label>
              <input
                type="text"
                value={settings.website || ''}
                onChange={e => setSettings({ ...settings, website: e.target.value })}
                placeholder="www.sublistudio.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Términos, Condiciones y Política de Seña para Presupuestos
            </label>
            <textarea
              rows={2}
              value={settings.termsAndConditions || ''}
              onChange={e => setSettings({ ...settings, termsAndConditions: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {isSaved ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuración guardada correctamente</span>
            </span>
          ) : <span />}

          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Preferencias</span>
          </button>
        </div>
      </form>

      {/* Backup and Data Maintenance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Resguardo de Datos y Restauración
        </h3>
        <p className="text-xs text-slate-400">
          Los datos se guardan de forma persistente y local en tu navegador. Puedes descargar una copia de seguridad en JSON para transferirla a otra PC o restaurar el catálogo demo de sublimación.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold text-white flex flex-col items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5 text-cyan-400" />
            <span>Descargar Copia de Seguridad JSON</span>
          </button>

          {/* Import JSON */}
          <label className="p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold text-white flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-indigo-400" />
            <span>Restaurar Copia desde JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={handleResetDemo}
            className="p-3.5 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-rose-300 flex flex-col items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <span>Restablecer Catálogo Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
