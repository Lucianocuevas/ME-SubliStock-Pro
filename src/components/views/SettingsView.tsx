import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Building,
  DollarSign,
  Image as ImageIcon,
  Trash2,
  Bell,
  BellOff,
  Eye,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  FileText,
  Sparkles,
  AlertTriangle,
  Flame,
  ShieldCheck,
  RefreshCw,
  Tag,
  Cloud,
  CloudUpload,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { StorageService, AppSettings, formatCurrency } from '../../services/storageService';
import { FirestoreService } from '../../services/firestoreService';
import { ProductLabelsTab } from './settings/ProductLabelsTab';
import { CloudSyncModal } from '../modals/CloudSyncModal';

interface Props {
  onRefreshData: () => void;
}

export const SettingsView: React.FC<Props> = ({ onRefreshData }) => {
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [activeTab, setActiveTab] = useState<'company' | 'labels' | 'alerts' | 'billing' | 'backup'>('company');
  const [isSaved, setIsSaved] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(StorageService.getPendingChangesCount());

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    StorageService.saveSettings(settings);
    setIsSaved(true);
    showNotification('¡Configuración guardada con éxito!');
    onRefreshData();
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('El archivo no debe superar los 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const logoData = reader.result as string;
        const updated = { ...settings, logoUrl: logoData };
        setSettings(updated);
        StorageService.saveSettings(updated);
        showNotification('Logo de la empresa actualizado.');
        onRefreshData();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    const updated = { ...settings, logoUrl: '' };
    setSettings(updated);
    StorageService.saveSettings(updated);
    showNotification('Logo eliminado. Se usará el ícono institucional.');
    onRefreshData();
  };

  // Stock alert handlers
  const handleToggleGlobalAlerts = (enabled: boolean) => {
    const updated = { ...settings, enableStockAlerts: enabled };
    setSettings(updated);
    StorageService.saveSettings(updated);
    showNotification(enabled ? 'Sistema de alertas de stock activado.' : 'Sistema de alertas de stock desactivado globalmente.');
    onRefreshData();
  };

  const handleDismissAllAlerts = () => {
    if (confirm('¿Sacar y silenciar todas las alertas de inventario actuales? No se mostrarán alertas rojas en el panel.')) {
      StorageService.dismissAllStockAlerts();
      setSettings(StorageService.getSettings());
      showNotification('Todas las alertas actuales fueron sacadas y silenciadas.');
      onRefreshData();
    }
  };

  const handleRestoreAllAlerts = () => {
    StorageService.restoreAllStockAlerts();
    setSettings(StorageService.getSettings());
    showNotification('Todas las alertas de inventario fueron reactivadas.');
    onRefreshData();
  };

  const handleRestoreSingleAlert = (productId: string) => {
    StorageService.restoreStockAlert(productId);
    setSettings(StorageService.getSettings());
    showNotification('Alerta reactivada para este producto.');
    onRefreshData();
  };

  const handleExportBackup = () => {
    const json = StorageService.exportFullBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SubliStock_${settings.workshopName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
          setSettings(StorageService.getSettings());
          onRefreshData();
        } else {
          alert('Error al leer el archivo de copia de seguridad. Verifica el formato JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('¿Restaurar los datos de demostración iniciales? Esto cargará los ejemplos de tazas, remeras, insumos y configuración inicial.')) {
      StorageService.resetToDemoData();
      setSettings(StorageService.getSettings());
      onRefreshData();
      alert('Datos de demostración restablecidos correctamente.');
    }
  };

  const dismissedProducts = StorageService.getDismissedStockAlerts();
  const allProducts = StorageService.getProducts();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-emerald-400 hover:text-white text-xs underline font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Configuración de Empresa & Sistema
              </h2>
              <p className="text-xs text-slate-400">
                Personaliza el nombre de tu empresa, logotipo, datos comerciales, presupuestos y control de alertas de stock
              </p>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <button
          onClick={() => handleSave()}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-1 sm:gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'company'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Building className="w-4 h-4 text-cyan-400" />
          <span>Datos & Logo de la Empresa</span>
        </button>

        <button
          onClick={() => setActiveTab('labels')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'labels'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Tag className="w-4 h-4 text-pink-400" />
          <span>Etiquetas de Productos & A4</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BellOff className="w-4 h-4 text-amber-400" />
          <span>Alertas de Inventario ({settings.enableStockAlerts !== false ? 'Activas' : 'Desactivadas'})</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Bancos, CBU & Presupuestos</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Base de Datos Local & Nube</span>
          {pendingChanges > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-black">
              {pendingChanges}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: DATOS & LOGO DE LA EMPRESA */}
      {activeTab === 'company' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* LOGO CORPORATIVO CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Logo Corporativo de la Empresa
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Se visualiza en la barra superior, presupuestos formales y órdenes de trabajo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Logo Preview Section */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-xl min-h-[160px]">
                {settings.logoUrl ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="p-3 bg-white rounded-xl shadow-md border border-slate-300 max-w-[200px] flex items-center justify-center">
                      <img
                        src={settings.logoUrl}
                        alt="Logo Empresa"
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar Logo</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md mx-auto">
                      <Flame className="w-9 h-9 fill-white/20" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Sin logo personalizado</p>
                    <span className="text-[10px] text-slate-500 block">Se muestra el ícono SubliStock PRO</span>
                  </div>
                )}
              </div>

              {/* Upload Controls & Live Previews */}
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Cargar Archivo de Logo (PNG, JPG, SVG o WebP)
                  </label>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-colors">
                    <Upload className="w-6 h-6 text-cyan-400 mb-1" />
                    <span className="text-xs font-bold text-white">Haz clic aquí para seleccionar imagen</span>
                    <span className="text-[11px] text-slate-500">Recomendado: fondo transparente PNG de alta resolución (máx 3MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Previsualización en Vivo de cómo se ve en el Encabezado y en el Presupuesto */}
                <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Previsualización en la Barra Superior (Header):
                  </span>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {settings.logoUrl ? (
                        <div className="h-8 w-8 rounded-lg bg-white p-0.5 border border-slate-700 flex items-center justify-center overflow-hidden">
                          <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
                          <Flame className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-black text-white text-sm">SubliStock</span>
                          <span className="text-[9px] font-bold px-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">PRO</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{settings.workshopName || 'Nombre de tu Empresa'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                      Vista previa en vivo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DATOS GENERALES DE LA EMPRESA */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Identidad & Razón Social</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de la Empresa / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={settings.workshopName}
                  onChange={e => setSettings({ ...settings, workshopName: e.target.value })}
                  placeholder="Ej: SubliStudio Gráfica & Sublimación"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Eslogan o Actividad Principal
                </label>
                <input
                  type="text"
                  value={settings.slogan || ''}
                  onChange={e => setSettings({ ...settings, slogan: e.target.value })}
                  placeholder="Ej: Taller de Estampados, Sublimación y Merchandising"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  CUIT / RUT / Identificación Fiscal
                </label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={e => setSettings({ ...settings, taxId: e.target.value })}
                  placeholder="30-71987654-2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Condición Impositiva
                </label>
                <select
                  value={settings.taxCondition || 'Responsable Inscripto'}
                  onChange={e => setSettings({ ...settings, taxCondition: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributista">Monotributo</option>
                  <option value="Exento">IVA Exento</option>
                  <option value="Consumidor Final">Consumidor Final</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Tasa de IVA / Impuesto (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.taxRatePercent}
                    onChange={e => setSettings({ ...settings, taxRatePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Dirección del Taller / Local
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.address}
                    onChange={e => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Av. Corrientes 3420"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Ciudad / Localidad / Provincia
                </label>
                <input
                  type="text"
                  value={settings.city || ''}
                  onChange={e => setSettings({ ...settings, city: e.target.value })}
                  placeholder="CABA, Buenos Aires"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* CONTACTO COMERCIAL & REDES */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>Canales de Contacto & Redes Sociales</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  WhatsApp Comercial (Mensajes & Presupuestos)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.whatsapp || ''}
                    onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                    placeholder="+54 9 11 4567-8901"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Se utiliza para enviar presupuestos a clientes</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Teléfono Fijo / Central
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+54 11 4567-8901"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={settings.email}
                    onChange={e => setSettings({ ...settings, email: e.target.value })}
                    placeholder="contacto@tuempresa.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Sitio Web o Tienda Online
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.website || ''}
                    onChange={e => setSettings({ ...settings, website: e.target.value })}
                    placeholder="www.sublistudio.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Instagram / Redes
                </label>
                <input
                  type="text"
                  value={settings.instagram || ''}
                  onChange={e => setSettings({ ...settings, instagram: e.target.value })}
                  placeholder="@sublistudio.oficial"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
            {isSaved ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Datos y logo guardados correctamente</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">Recuerda guardar los cambios para aplicarlos en todo el sistema</span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB: ETIQUETAS DE PRODUCTOS */}
      {activeTab === 'labels' && (
        <ProductLabelsTab
          settings={settings}
          onSaveSettings={(newSettings) => {
            setSettings(newSettings);
            onRefreshData();
          }}
          showNotification={showNotification}
        />
      )}

      {/* TAB 2: ALERTAS DE INVENTARIO */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Main Alert Switch Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Sistema de Alertas Automáticas de Stock
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Controla si deseas recibir advertencias rojas en el panel de inicio y encabezado cuando un insumo caiga por debajo de su stock mínimo.
                </p>
              </div>

              {/* Master Alert Switch */}
              <div className="flex items-center gap-3 shrink-0 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">
                  {settings.enableStockAlerts !== false ? 'ALERTAS ACTIVADAS' : 'ALERTAS DESACTIVADAS'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleGlobalAlerts(settings.enableStockAlerts === false)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.enableStockAlerts !== false ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Actions to Dismiss / Restore */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                  <BellOff className="w-4 h-4" />
                  <span>Sacar / Silenciar Alertas</span>
                </div>
                <p className="text-xs text-slate-400">
                  Si tienes insumos con stock bajo pero no deseas que salgan alertas rojas en el panel ni en el contador superior, puedes sacarlas todas con un solo clic.
                </p>
                <button
                  type="button"
                  onClick={handleDismissAllAlerts}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/80 hover:border-amber-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Sacar Todas las Alertas de Stock</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                  <RefreshCw className="w-4 h-4" />
                  <span>Reactivar Alertas Silenciadas</span>
                </div>
                <p className="text-xs text-slate-400">
                  Vuelve a activar el monitoreo automático de stock para todos los insumos de sublimación del catálogo.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreAllAlerts}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800 hover:border-cyan-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer y Reactivar Todas</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Silenced Products */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BellOff className="w-4 h-4 text-cyan-400" />
                <span>Insumos con Alertas Silenciadas ({settings.dismissedAlertProductIds?.length || 0})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Puedes reactivar la alerta de cualquier insumo cuando desees reanudar su seguimiento.
              </span>
            </div>

            {(!settings.dismissedAlertProductIds || settings.dismissedAlertProductIds.length === 0) ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-white">No hay insumos con alertas silenciadas</p>
                <p className="text-xs text-slate-400">
                  Todas las alertas activas se muestran en el Centro de Alertas. Puedes silenciar insumos individuales desde allí o desde el inventario.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {settings.dismissedAlertProductIds.map(productId => {
                  const prod = allProducts.find(p => p.id === productId);
                  if (!prod) return null;

                  return (
                    <div
                      key={productId}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-500">{prod.sku}</span>
                        <div>
                          <p className="font-bold text-white">{prod.name}</p>
                          <span className="text-[11px] text-slate-400">
                            Stock actual: <strong className="text-amber-400">{prod.currentStock} {prod.unit}</strong> (Mínimo: {prod.minStock})
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreSingleAlert(productId)}
                        className="px-3 py-1 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Reactivar Alerta</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BANCOS, CBU & PRESUPUESTOS */}
      {activeTab === 'billing' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Datos Bancarios para Transferencias & Señas</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Datos de Cuenta Bancaria (Banco • CBU / CVU • Alias • Titular)
              </label>
              <textarea
                rows={3}
                value={settings.bankDetails || ''}
                onChange={e => setSettings({ ...settings, bankDetails: e.target.value })}
                placeholder="Banco Galicia • Caja de Ahorro $ • CBU: 0070123456789012345678 • Alias: SUBLISTUDIO.OFICIAL • CUIT: 30-71987654-2"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Esta información aparece automáticamente en el pie de los Presupuestos en PDF y órdenes enviadas por WhatsApp.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Símbolo de Moneda Principal
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Términos, Condiciones y Política de Presupuestos
              </label>
              <textarea
                rows={3}
                value={settings.termsAndConditions || ''}
                onChange={e => setSettings({ ...settings, termsAndConditions: e.target.value })}
                placeholder="Presupuesto válido por 15 días corridos. Precios incluyen insumos e impresión en alta definición. Seña 50% al aprobar boceto digital, saldo contra entrega."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Guarda los datos bancarios para que se actualicen en las cotizaciones</span>
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Datos Bancarios</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: BASE DE DATOS LOCAL OFFLINE & NUBE FIRESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Cloud & Offline Overview Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    Base de Datos Local Offline & Sincronización en la Nube
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    El taller almacena automáticamente todos los datos en tu base local offline. Puedes trabajar sin internet y subir los cambios a la nube cuando desees.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCloudSyncModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0 transition-colors"
              >
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span>Abrir Centro de Nube</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Modo de Operación</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    Offline Local
                  </span>
                </div>
                <div className="text-lg font-black text-white">100% Autónomo</div>
                <p className="text-[11px] text-slate-400">Funciona sin internet en cualquier momento.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Cambios Pendientes</span>
                  {pendingChanges > 0 ? (
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 animate-pulse">
                      Por Subir
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                      Al Día
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-amber-400">{pendingChanges} modificaciones</div>
                <p className="text-[11px] text-slate-400">Listas para respaldarse en Firestore.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Última Subida Cloud</span>
                  <span className="text-[10px] text-purple-300 font-mono">Firestore</span>
                </div>
                <div className="text-xs font-bold text-slate-200 truncate pt-1">
                  {FirestoreService.getSyncInfo().lastSyncAt
                    ? new Date(FirestoreService.getSyncInfo().lastSyncAt!).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })
                    : 'Aún no sincronizado'}
                </div>
                <p className="text-[11px] text-slate-400">Respaldo remoto en la nube.</p>
              </div>
            </div>

            {/* Direct Upload Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!navigator.onLine) {
                    showNotification('Sin conexión a internet. Los datos siguen 100% seguros en tu base local.');
                    return;
                  }
                  setIsUploadingCloud(true);
                  try {
                    const res = await FirestoreService.uploadAllToCloud();
                    if (res.success) {
                      showNotification('¡Base de datos local subida a la nube exitosamente!');
                      setPendingChanges(0);
                      onRefreshData();
                    } else {
                      showNotification(res.error || 'Error al subir a la nube.');
                    }
                  } catch (e: any) {
                    showNotification(e?.message || 'Error al conectar con la nube.');
                  } finally {
                    setIsUploadingCloud(false);
                  }
                }}
                disabled={isUploadingCloud}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
              >
                {isUploadingCloud ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Subiendo a la Nube...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Subir Todos los Datos a la Nube Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Offline Local Backups & Demo Reset */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Copias de Seguridad en Archivo Local (Sin Internet)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Descarga un archivo completo en formato JSON para transferir tus datos a otra PC o restaurar una copia previa en caso de formateo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Export JSON */}
              <button
                type="button"
                onClick={handleExportBackup}
                className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-white flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-6 h-6 text-cyan-400" />
                <span>Descargar Copia de Seguridad JSON</span>
                <span className="text-[10px] text-slate-500">Guarda todos tus datos actuales</span>
              </button>

              {/* Import JSON */}
              <label className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-white flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-indigo-400" />
                <span>Restaurar Copia desde JSON</span>
                <span className="text-[10px] text-slate-500">Cargar un archivo .json previo</span>
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
                className="p-4 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-rose-300 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-6 h-6 text-rose-400" />
                <span>Restablecer Catálogo Demo</span>
                <span className="text-[10px] text-slate-500">Reiniciar ejemplos iniciales</span>
              </button>
            </div>
          </div>

          <CloudSyncModal
            isOpen={isCloudSyncModalOpen}
            onClose={() => setIsCloudSyncModalOpen(false)}
            onDataRefreshed={() => {
              setSettings(StorageService.getSettings());
              setPendingChanges(StorageService.getPendingChangesCount());
              onRefreshData();
            }}
          />
        </div>
      )}
    </div>
  );
};
